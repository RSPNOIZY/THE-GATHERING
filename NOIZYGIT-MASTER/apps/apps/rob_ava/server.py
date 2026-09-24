#!/usr/bin/env python3
"""Rob.AVA weekend prototype.

Minimal trust loop:
- persona create
- approve/reject review
- safe collaboration authorization with never-clauses
"""

from __future__ import annotations

import json
import threading
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Optional

from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from rob_ava.multilang_workflow import MultilangDemoRequest, run_multilang_demo
from rob_ava.rag_integration import (
    AuditEvent,
    CollaborationContract,
    RagQueryRequest,
    append_audit_event,
    get_contract,
    list_contracts,
    load_fan_boundary_policy,
    run_rag_query,
    upsert_contract,
)


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
DB_PATH = DATA_DIR / "rob_ava_db.json"
POLICY_PATH = ROOT / "policy" / "never_clauses.json"


class CollaborationRules(BaseModel):
    allowed_partners: list[str] = Field(default_factory=list)
    restricted_topics: list[str] = Field(default_factory=list)
    max_interaction_duration: int = Field(default=300, ge=30, le=7200)


class PersonaProfile(BaseModel):
    persona_id: str
    owner_id: str
    display_name: str
    languages: list[str] = Field(min_length=1)
    consent_level: Literal["private", "crew-only", "public"] = "crew-only"
    collaboration_rules: CollaborationRules
    status: Literal["candidate", "approved", "rejected"] = "candidate"
    review_log: list[dict[str, Any]] = Field(default_factory=list)


class SessionAuthorizeRequest(BaseModel):
    partner_id: str
    duration_seconds: int = Field(default=180, ge=30, le=7200)
    topics: list[str] = Field(default_factory=list)


class RefusalPreviewRequest(BaseModel):
    reason: str = Field(min_length=3)
    level: Literal["standard", "firm", "educational"] = "standard"
    next_step: Optional[str] = None


class ActorApprovalDecisionRequest(BaseModel):
    approve: bool = True
    reason: str = ""


def _load_policy() -> dict[str, Any]:
    default = {
        "never_clauses": [
            "never_share_voice_data_without_explicit_owner_consent",
            "never_bypass_consent_keys",
            "never_disable_audit_logging",
            "never_allow_restricted_topics",
            "never_exceed_interaction_limits",
            "never_sublicense_without_owner_permission",
            "never_claim_owner_endorsement_without_permission",
            "never_expose_private_farm_metadata",
            "never_modify_persona_without_audit_record",
            "never_break_rsp_quality_standard",
        ],
        "global_blocked_topics": ["self-harm", "illegal activities", "violent wrongdoing"],
    }
    if not POLICY_PATH.exists():
        return default
    try:
        loaded = json.loads(POLICY_PATH.read_text(encoding="utf-8"))
        default.update(loaded)
    except json.JSONDecodeError:
        pass
    return default


def ava_refusal(
    reason: str,
    level: Literal["standard", "firm", "educational"] = "standard",
    next_step: Optional[str] = None,
) -> str:
    messages = {
        "standard": f"I cannot continue because {reason}. Thank you for understanding.",
        "firm": f"I must decline. {reason} prevents this interaction.",
        "educational": (
            f"This action is blocked: {reason}. "
            "This safeguard protects consent, ownership, and collaboration integrity."
        ),
    }
    message = messages.get(level, messages["standard"])
    if next_step:
        return f"{message} Next step: {next_step}."
    return message


_db_lock = threading.Lock()
_db_cache: dict[str, dict[str, Any]] | None = None


def _load_db() -> dict[str, dict[str, Any]]:
    global _db_cache
    if _db_cache is not None:
        return _db_cache
    if not DB_PATH.exists():
        _db_cache = {}
        return _db_cache
    try:
        _db_cache = json.loads(DB_PATH.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        _db_cache = {}
    return _db_cache


def _save_db(db: dict[str, dict[str, Any]]) -> None:
    global _db_cache
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    DB_PATH.write_text(json.dumps(db, indent=2), encoding="utf-8")
    _db_cache = db


def _atomic_update(fn: Any) -> Any:
    """Execute a read-modify-write on the JSON DB under lock."""
    with _db_lock:
        db = _load_db()
        result = fn(db)
        _save_db(db)
        return result


POLICY = _load_policy()
FAN_BOUNDARY_POLICY = load_fan_boundary_policy()
app = FastAPI(title="Rob.AVA Weekend Prototype", version="0.1.0")


@app.post("/ava/create")
def create_ava(profile: PersonaProfile) -> dict[str, Any]:
    with _db_lock:
        db = _load_db()
        if profile.persona_id in db:
            raise HTTPException(status_code=409, detail="persona_id already exists")
        db[profile.persona_id] = profile.model_dump()
        _save_db(db)
    return {"message": "created", "persona_id": profile.persona_id, "status": profile.status}


@app.post("/ava/review/{persona_id}")
def review_ava(persona_id: str, approve: bool = True, reason: str = "") -> dict[str, Any]:
    with _db_lock:
        db = _load_db()
        if persona_id not in db:
            raise HTTPException(status_code=404, detail="persona_id not found")
        entry = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "approved": approve,
            "reason": reason,
        }
        db[persona_id].setdefault("review_log", []).append(entry)
        db[persona_id]["status"] = "approved" if approve else "rejected"
        _save_db(db)
    append_audit_event(
        AuditEvent(
            event_type="contract_updated",
            actor_id=db[persona_id]["owner_id"],
            summary="Persona review decision recorded.",
            details={"persona_id": persona_id, "approved": approve, "reason": reason},
        )
    )
    return {"message": db[persona_id]["status"], "review_event": entry}


@app.get("/ava/list")
def list_avas() -> dict[str, Any]:
    return {"avas": list(_load_db().values())}


@app.get("/actor/{owner_id}/approval/queue")
def actor_approval_queue(
    owner_id: str, status: Optional[Literal["candidate", "approved", "rejected"]] = None
) -> dict[str, Any]:
    db = _load_db()
    items = [
        profile
        for profile in db.values()
        if profile.get("owner_id") == owner_id and (status is None or profile.get("status") == status)
    ]
    return {"owner_id": owner_id, "count": len(items), "items": items}


@app.post("/actor/{owner_id}/approval/{persona_id}")
def actor_approval_decision(
    owner_id: str, persona_id: str, decision: ActorApprovalDecisionRequest
) -> dict[str, Any]:
    with _db_lock:
        db = _load_db()
        if persona_id not in db:
            raise HTTPException(status_code=404, detail="persona_id not found")
        if db[persona_id].get("owner_id") != owner_id:
            raise HTTPException(status_code=403, detail="persona does not belong to owner")

        entry = {
            "timestamp_utc": datetime.now(timezone.utc).isoformat(),
            "approved": decision.approve,
            "reason": decision.reason,
            "source": "actor_portal",
        }
        db[persona_id].setdefault("review_log", []).append(entry)
        db[persona_id]["status"] = "approved" if decision.approve else "rejected"
        _save_db(db)
    append_audit_event(
        AuditEvent(
            event_type="contract_updated",
            actor_id=owner_id,
            summary="Actor approval decision applied.",
            details={
                "persona_id": persona_id,
                "approved": decision.approve,
                "reason": decision.reason,
            },
        )
    )
    return {
        "message": db[persona_id]["status"],
        "persona_id": persona_id,
        "owner_id": owner_id,
        "review_event": entry,
    }


@app.post("/ava/refusal")
def preview_refusal(request: RefusalPreviewRequest) -> dict[str, str]:
    return {
        "message": ava_refusal(
            reason=request.reason, level=request.level, next_step=request.next_step
        )
    }


@app.post("/ava/session/authorize/{persona_id}")
def authorize_session(persona_id: str, request: SessionAuthorizeRequest) -> dict[str, Any]:
    db = _load_db()
    if persona_id not in db:
        raise HTTPException(status_code=404, detail="persona_id not found")
    ava = db[persona_id]
    rules = ava["collaboration_rules"]
    reasons: list[str] = []
    reason_codes: list[str] = []

    if ava.get("status") != "approved":
        reasons.append("Persona is not approved.")
        reason_codes.append("PERSONA_NOT_APPROVED")
    if request.partner_id not in rules.get("allowed_partners", []):
        reasons.append("Partner is not in allowed_partners.")
        reason_codes.append("PARTNER_NOT_APPROVED")
    if request.duration_seconds > int(rules.get("max_interaction_duration", 300)):
        reasons.append("Requested duration exceeds max_interaction_duration.")
        reason_codes.append("DURATION_LIMIT_EXCEEDED")

    blocked = {t.lower().strip() for t in rules.get("restricted_topics", [])}
    blocked.update(t.lower().strip() for t in POLICY.get("global_blocked_topics", []))
    incoming = {t.lower().strip() for t in request.topics}
    blocked_hits = sorted(incoming.intersection(blocked))
    if blocked_hits:
        reasons.append(f"Restricted topics detected: {', '.join(blocked_hits)}")
        reason_codes.append("TOPIC_PROHIBITED")

    refusal = None
    if reasons:
        level: Literal["standard", "firm", "educational"] = "standard"
        if "TOPIC_PROHIBITED" in reason_codes or "PERSONA_NOT_APPROVED" in reason_codes:
            level = "firm"
        refusal = ava_refusal(
            reason=reasons[0],
            level=level,
            next_step="adjust request to match collaboration rules",
        )

    return {
        "allowed": not reasons,
        "persona_id": persona_id,
        "partner_id": request.partner_id,
        "reasons": reasons,
        "reason_codes": reason_codes,
        "refusal": refusal,
        "never_clauses": POLICY["never_clauses"],
    }


@app.get("/policy/ava-fan-boundary")
def get_ava_fan_boundary() -> dict[str, Any]:
    return FAN_BOUNDARY_POLICY


@app.post("/collaboration/contracts")
def save_contract(contract: CollaborationContract) -> dict[str, Any]:
    existing = get_contract(contract.collaboration_id)
    saved = upsert_contract(contract)
    append_audit_event(
        AuditEvent(
            event_type="contract_created" if existing is None else "contract_updated",
            actor_id=contract.ava_owner,
            summary="Collaboration contract saved.",
            details={
                "collaboration_id": contract.collaboration_id,
                "partner_ava": contract.partner_ava,
                "status": contract.status,
            },
        )
    )
    return {"message": "saved", "contract": saved.model_dump()}


@app.get("/collaboration/contracts")
def get_contracts(ava_id: Optional[str] = None) -> dict[str, Any]:
    contracts = [contract.model_dump() for contract in list_contracts(ava_id=ava_id)]
    return {"count": len(contracts), "contracts": contracts}


@app.get("/collaboration/contracts/{collaboration_id}")
def get_contract_by_id(collaboration_id: str) -> dict[str, Any]:
    contract = get_contract(collaboration_id)
    if contract is None:
        raise HTTPException(status_code=404, detail="collaboration_id not found")
    return {"contract": contract.model_dump()}


@app.post("/ava/rag/query")
def rag_query(request: RagQueryRequest) -> dict[str, Any]:
    db = _load_db()
    persona = db.get(request.ava_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="persona_id not found")

    result = run_rag_query(
        request_model=request,
        persona=persona,
        policy=POLICY,
        boundary_policy=FAN_BOUNDARY_POLICY,
        refusal_builder=ava_refusal,
    )
    return result.model_dump()


@app.post("/demo/multilang/render")
def demo_multilang_render(request: MultilangDemoRequest) -> dict[str, Any]:
    db = _load_db()
    persona = db.get(request.ava_id)
    if persona is None:
        raise HTTPException(status_code=404, detail="persona_id not found")

    result = run_multilang_demo(
        request_model=request,
        persona=persona,
        policy=POLICY,
        refusal_builder=ava_refusal,
    )

    if result.allowed:
        append_audit_event(
            AuditEvent(
                event_type="session_completed",
                actor_id=request.ava_id,
                summary="Multilang demo render completed.",
                details={
                    "session_id": result.session_id,
                    "director_note_key": request.director_note_key,
                    "locales": request.locales,
                    "emotional_signature": result.emotional_signature,
                    "artifact_path": result.artifact_path,
                },
            )
        )
    else:
        append_audit_event(
            AuditEvent(
                event_type="session_blocked",
                actor_id=request.ava_id,
                summary="Multilang demo render blocked.",
                details={
                    "session_id": result.session_id,
                    "reason_codes": result.reason_codes,
                    "reasons": result.reasons,
                },
            )
        )

    return result.model_dump()
