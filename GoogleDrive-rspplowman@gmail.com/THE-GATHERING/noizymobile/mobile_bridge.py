"""
mobile_bridge.py
NOIZYMOBILE Gateway — Production FastAPI webhook bridge
Receives iOS Siri Shortcut & Talon Voice payloads from the CR-V cockpit,
authenticates them, and routes to:
  · Cloudflare D1  (Gospel of Receipts ledger)
  · Local filesystem log (fallback / audit trail)
  · Gabriel queue   (GitHub provenance commits)

Deploy on M2 Ultra: uvicorn mobile_bridge:app --host 0.0.0.0 --port 8080
"""

import os
import uuid
import json
import logging
import httpx
from typing import Literal, Optional
from fastapi import FastAPI, Depends, HTTPException, Security, BackgroundTasks, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from datetime import datetime, timezone
from pathlib import Path

# ── Logging ────────────────────────────────────────────────────────────────────
LOG_DIR = Path(os.getenv("NOIZY_LOG_DIR", "/tmp/noizymobile"))
LOG_DIR.mkdir(parents=True, exist_ok=True)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
    handlers=[
        logging.FileHandler(LOG_DIR / "mobile_bridge.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger("NOIZYMOBILE")

# ── App ────────────────────────────────────────────────────────────────────────
app = FastAPI(
    title="NOIZYMOBILE Gateway",
    version="1.1.0",
    description="Lucy Cortez CR-V cockpit webhook bridge for FISHMUSICINC.COM",
)

# ── Config from environment ────────────────────────────────────────────────────
BRIDGE_API_KEY        = os.getenv("NOIZY_BRIDGE_SECRET", "crv-cockpit-secret-key")
D1_API_BASE           = os.getenv("D1_API_BASE", "https://dispatch.noizyfish.com")
D1_WORKER_TOKEN       = os.getenv("D1_WORKER_TOKEN", "")
GABRIEL_WEBHOOK_URL   = os.getenv("GABRIEL_WEBHOOK_URL", "")   # internal Gabriel queue
AUDIT_LOG_PATH        = LOG_DIR / "receipts.jsonl"

# ── Auth ───────────────────────────────────────────────────────────────────────
security = HTTPBearer()

def verify_auth(credentials: HTTPAuthorizationCredentials = Security(security)):
    if credentials.credentials != BRIDGE_API_KEY:
        logger.warning("Unauthorized mobile attempt rejected")
        raise HTTPException(status_code=401, detail="Unauthorized access from NOIZYMOBILE")
    return credentials.credentials


# ══════════════════════════════════════════════════════════════════════════════
#  PAYLOAD SCHEMAS
# ══════════════════════════════════════════════════════════════════════════════

class AudioMarkerPayload(BaseModel):
    artist_id:      str     = Field(default="rp@fishmusicinc.com")
    session_id:     str     = Field(..., description="Unique SonoBus/BlackHole session ID")
    marker_type:    Literal["take_start", "take_complete", "mic_cut"]
    asset_title:    str     = Field(..., description="Name of the captured idea")
    trigger_source: Literal["siri_shortcut", "talon_voice"] = "siri_shortcut"
    bpm:            Optional[float] = Field(None, description="Detected BPM if available")
    key:            Optional[str]   = Field(None, description="Detected key signature")

class TripTelemetryPayload(BaseModel):
    trip_id:     str   = Field(default_factory=lambda: f"trip_{uuid.uuid4().hex[:8]}")
    mode:        Literal["uber_rideshare", "studio_transit"]
    mileage_km:  float = Field(..., gt=0, description="Distance logged for CRA tracking")
    origin:      Optional[str] = None
    destination: Optional[str] = None
    timestamp:   str   = Field(default_factory=lambda: datetime.now(timezone.utc).isoformat())

class QuickSplitPayload(BaseModel):
    artist_id:      str   = Field(default="rp@fishmusicinc.com")
    asset_id:       str
    gross_amount:   float = Field(..., gt=0)
    currency:       str   = Field(default="LLT")
    source_channel: Literal["NOIZYMOBILE"] = "NOIZYMOBILE"


# ══════════════════════════════════════════════════════════════════════════════
#  BACKGROUND TASKS
# ══════════════════════════════════════════════════════════════════════════════

def _write_local_receipt(record: dict):
    """Append-only JSONL local audit trail — always runs, even if D1 is down."""
    try:
        with open(AUDIT_LOG_PATH, "a") as f:
            f.write(json.dumps(record) + "\n")
        logger.info(f"Local receipt written: {record.get('receipt_id')}")
    except Exception as e:
        logger.error(f"Local receipt write failed: {e}")


async def _push_to_d1(endpoint: str, payload: dict):
    """
    Forward receipt to Cloudflare D1 via the dispatcher worker.
    Non-blocking — failures are logged but do not affect the 200 response.
    """
    if not D1_WORKER_TOKEN:
        logger.warning("D1_WORKER_TOKEN not set — skipping D1 sync")
        return
    try:
        async with httpx.AsyncClient(timeout=8.0) as client:
            r = await client.post(
                f"{D1_API_BASE}/{endpoint}",
                headers={
                    "Authorization": f"Bearer {D1_WORKER_TOKEN}",
                    "Content-Type": "application/json",
                    "X-NOIZY-Source": "mobile-bridge",
                },
                json=payload,
            )
            r.raise_for_status()
            logger.info(f"D1 sync OK → {endpoint} ({r.status_code})")
    except Exception as e:
        logger.error(f"D1 sync failed for {endpoint}: {e}")


async def _notify_gabriel(event_type: str, summary: dict):
    """
    Poke the Gabriel queue so he can write the provenance commit
    to THE-GATHERING and update the Slack audit block.
    """
    if not GABRIEL_WEBHOOK_URL:
        logger.debug("GABRIEL_WEBHOOK_URL not set — skipping Gabriel notification")
        return
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            await client.post(
                GABRIEL_WEBHOOK_URL,
                json={"event_type": event_type, "payload": summary},
                headers={"Authorization": f"Bearer {BRIDGE_API_KEY}"},
            )
            logger.info(f"Gabriel notified: {event_type}")
    except Exception as e:
        logger.warning(f"Gabriel notification failed: {e}")


# ══════════════════════════════════════════════════════════════════════════════
#  WEBHOOK ENDPOINTS
# ══════════════════════════════════════════════════════════════════════════════

@app.post("/v1/mobile/audio-marker", dependencies=[Depends(verify_auth)])
async def log_audio_marker(
    payload: AudioMarkerPayload,
    background_tasks: BackgroundTasks,
):
    """
    Caught via Siri Shortcuts when executing a hands-free vocal take.
    Flags the session in the core engine for subsequent C2PA / CTID hashing.

    Siri trigger: "Log vocal take"
    """
    receipt_id = f"AUDIO-{uuid.uuid4().hex[:10].upper()}"
    ts = datetime.now(timezone.utc).isoformat()

    record = {
        "receipt_id":    receipt_id,
        "receipt_type":  "audio_marker",
        "ts":            ts,
        "artist_id":     payload.artist_id,
        "session_id":    payload.session_id,
        "marker_type":   payload.marker_type,
        "asset_title":   payload.asset_title,
        "trigger_source": payload.trigger_source,
        "bpm":           payload.bpm,
        "key":           payload.key,
        "origin_code":   "OH",
        "signing_algo":  "ML-DSA-65",
    }

    logger.info(f"[Lucy] Audio marker: {payload.marker_type} → '{payload.asset_title}' ({receipt_id})")

    background_tasks.add_task(_write_local_receipt, record)
    background_tasks.add_task(_push_to_d1, "receipt/audio", record)
    background_tasks.add_task(_notify_gabriel, "audio_marker_captured", {
        "receipt_id": receipt_id,
        "session_id": payload.session_id,
        "asset_title": payload.asset_title,
    })

    return {
        "status":     "marker_secured",
        "receipt_id": receipt_id,
        "session":    payload.session_id,
        "ts":         ts,
    }


@app.post("/v1/mobile/telemetry", dependencies=[Depends(verify_auth)])
async def log_trip_telemetry(
    payload: TripTelemetryPayload,
    background_tasks: BackgroundTasks,
):
    """
    Logs vehicle mileage to D1 ledger for automated CRA tax compliance.
    Triggers once per Uber trip or studio transit leg.

    Siri trigger: "Log studio trip"
    """
    record = {
        "receipt_id":   f"TRIP-{payload.trip_id.upper()}",
        "receipt_type": "trip_telemetry",
        "ts":           payload.timestamp,
        "mode":         payload.mode,
        "mileage_km":   payload.mileage_km,
        "origin":       payload.origin,
        "destination":  payload.destination,
        "cra_eligible": payload.mode in ("uber_rideshare", "studio_transit"),
    }

    logger.info(f"[Lucy] Trip: {payload.mileage_km}km via {payload.mode} ({payload.trip_id})")

    background_tasks.add_task(_write_local_receipt, record)
    background_tasks.add_task(_push_to_d1, "receipt/trip", record)

    return {
        "status":     "telemetry_synced",
        "trip_id":    payload.trip_id,
        "mileage_km": payload.mileage_km,
        "cra_flag":   record["cra_eligible"],
    }


@app.post("/v1/mobile/mc96-split", dependencies=[Depends(verify_auth)])
async def trigger_mc96_split(
    payload: QuickSplitPayload,
    background_tasks: BackgroundTasks,
):
    """
    Triggers an instant 75/25 HVS write to the MC96 ledger from the car.
    Interfaces with FastMCP record_mc96_transaction tool via D1.

    Siri trigger: "Trigger split"
    """
    creator_share = round(payload.gross_amount * 0.75, 4)
    infra_share   = round(payload.gross_amount * 0.25, 4)
    receipt_id    = f"SPLIT-{uuid.uuid4().hex[:10].upper()}"
    ts            = datetime.now(timezone.utc).isoformat()

    record = {
        "receipt_id":     receipt_id,
        "receipt_type":   "mc96_split",
        "ts":             ts,
        "artist_id":      payload.artist_id,
        "asset_id":       payload.asset_id,
        "gross_amount":   payload.gross_amount,
        "currency":       payload.currency,
        "creator_share":  creator_share,
        "infra_share":    infra_share,
        "split_rule":     "75/25",
        "source_channel": payload.source_channel,
    }

    logger.info(f"[House Lights] Split: {payload.gross_amount} {payload.currency} → "
                f"{creator_share} creator / {infra_share} infra ({receipt_id})")

    background_tasks.add_task(_write_local_receipt, record)
    background_tasks.add_task(_push_to_d1, "receipt/split", record)
    background_tasks.add_task(_notify_gabriel, "mc96_split_triggered", {
        "receipt_id":    receipt_id,
        "asset_id":      payload.asset_id,
        "creator_share": creator_share,
        "infra_share":   infra_share,
        "currency":      payload.currency,
    })

    return {
        "status":         "queued_for_ledger",
        "receipt_id":     receipt_id,
        "rule":           "75/25",
        "creator_share":  creator_share,
        "infra_share":    infra_share,
        "currency":       payload.currency,
    }


# ── Health check ───────────────────────────────────────────────────────────────
@app.get("/health")
async def health():
    return {
        "status":    "online",
        "node":      os.uname().nodename,
        "version":   "1.1.0",
        "log_dir":   str(LOG_DIR),
        "d1_target": D1_API_BASE,
    }


# ── 404 catch-all ──────────────────────────────────────────────────────────────
@app.exception_handler(404)
async def not_found(request: Request, exc):
    return JSONResponse(status_code=404, content={"detail": "NOIZYMOBILE: endpoint not found"})
