#!/usr/bin/env python3
"""
node_runner.py - NOIZY Dispatcher Client & Routing Supervisor (v2.4.0-PROD)
Host Platform: Apple Mac Studio M2 Ultra (192GB Unified Memory)
Complies with: Google Routes API v2, MCP Stdio Protocol 2024-11-05, Universal Waze Handoff
"""

import asyncio
import json
import logging
import uuid
import re
from urllib.parse import urlencode
from typing import Dict, Any, Optional

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] [NOIZY-RUNNER] %(message)s"
)


def parse_google_duration(value: Any) -> int:
    """Convert Google duration values such as '124s' or '124.5s' to seconds."""
    if isinstance(value, (int, float)):
        return round(float(value))
    if isinstance(value, str):
        match = re.fullmatch(r"\s*([0-9]+(?:\.[0-9]+)?)s\s*", value)
        if match:
            return round(float(match.group(1)))
    raise ValueError(f"Unsupported duration value: {value!r}")


def make_waze_universal_link(lat: float, lon: float) -> str:
    """Constructs official universal Waze navigation link with fallback support."""
    params = urlencode({
        "ll": f"{lat},{lon}",
        "navigate": "yes",
        "utm_source": "noizy",
    })
    return f"https://waze.com/ul?{params}"


class GabrielDispatchClient:
    """
    Production-grade MCP stdio client with full initialization handshake,
    request correlation, and timeout management.
    """

    def __init__(self, mcp_server_cmd: list[str]):
        self.mcp_server_cmd = mcp_server_cmd
        self.process: Optional[asyncio.subprocess.Process] = None

    async def start(self):
        """Spawns the GABRIEL MCP server subprocess and executes initialization handshake."""
        self.process = await asyncio.create_subprocess_exec(
            *self.mcp_server_cmd,
            stdin=asyncio.subprocess.PIPE,
            stdout=asyncio.subprocess.PIPE,
            stderr=asyncio.subprocess.PIPE
        )
        logging.info("GABRIEL MCP Subprocess spawned. Executing MCP handshake...")

        # 1. Send Initialize Request
        init_req = {
            "jsonrpc": "2.0",
            "id": "INIT_001",
            "method": "initialize",
            "params": {
                "protocolVersion": "2024-11-05",
                "capabilities": {},
                "clientInfo": { "name": "M2UltraNodeRunner", "version": "2.4.0-PROD" }
            }
        }
        await self._send_json(init_req)

        # 2. Send Initialized Notification
        initialized_notif = {
            "jsonrpc": "2.0",
            "method": "notifications/initialized",
            "params": {}
        }
        await self._send_json(initialized_notif)
        logging.info("MCP initialization complete (Protocol: 2024-11-05).")

    async def _send_json(self, payload: dict):
        if not self.process or not self.process.stdin:
            raise RuntimeError("MCP process stdin not ready.")
        line = json.dumps(payload) + "\n"
        self.process.stdin.write(line.encode("utf-8"))
        await self.process.stdin.drain()

    async def call_mcp_tool(self, tool_name: str, arguments: Dict[str, Any], timeout_sec: float = 15.0) -> Dict[str, Any]:
        """Sends tools/call and parses structured response."""
        req_id = str(uuid.uuid4())
        payload = {
            "jsonrpc": "2.0",
            "id": req_id,
            "method": "tools/call",
            "params": {
                "name": tool_name,
                "arguments": arguments
            }
        }
        await self._send_json(payload)

        # Read matching response with timeout
        raw_response = await asyncio.wait_for(self.process.stdout.readline(), timeout=timeout_sec)
        if not raw_response:
            raise ConnectionError("Empty response from GABRIEL MCP Host.")
        
        parsed = json.loads(raw_response.decode("utf-8"))
        if "error" in parsed:
            raise RuntimeError(f"MCP RPC Error: {parsed['error']}")

        # Unpack MCP Content Text
        content_text = parsed["result"]["content"][0]["text"]
        return json.loads(content_text)

    async def evaluate_dispatch_route(
        self,
        driver_id: str,
        session_token: str,
        origin: Dict[str, float],
        destination: Dict[str, float],
        baseline_eta_seconds: int,
        max_acceptable_delay_pct: float = 0.25
    ) -> Dict[str, Any]:
        """
        Executes traffic-aware routing call and produces a structured verdict.
        """
        idempotency_key = str(uuid.uuid4())
        logging.info(f"Evaluating route {idempotency_key} for {driver_id}")

        tool_args = {
            "driver_id": driver_id,
            "session_token": session_token,
            "origin": origin,
            "destination": destination,
            "routing_preference": "TRAFFIC_AWARE",
            "travel_mode": "DRIVE",
            "idempotency_key": idempotency_key
        }

        route_result = await self.call_mcp_tool("compute_traffic_route", tool_args)
        actual_duration = parse_google_duration(route_result["duration_seconds"])
        static_duration = parse_google_duration(route_result.get("static_duration_seconds", actual_duration))
        delay_delta = max(0, actual_duration - baseline_eta_seconds)
        delay_pct = (delay_delta / baseline_eta_seconds) if baseline_eta_seconds > 0 else 0.0
        is_congested = delay_pct > max_acceptable_delay_pct

        waze_url = make_waze_universal_link(destination["latitude"], destination["longitude"])

        return {
            "idempotency_key": idempotency_key,
            "provider": "google_routes",
            "harmony_receipt_hash": route_result["harmony_receipt_hash"],
            "duration_seconds": actual_duration,
            "static_duration_seconds": static_duration,
            "distance_meters": route_result["distance_meters"],
            "eta_minutes": +(actual_duration / 60).toFixed(2) if hasattr(actual_duration, 'toFixed') else round(actual_duration / 60, 2),
            "delay_seconds": delay_delta,
            "delay_percentage": round(delay_pct * 100, 1),
            "is_congested": is_congested,
            "status": "HOLD_DISPATCH" if is_congested else "READY_FOR_VEHICLE",
            "waze_universal_link": waze_url,
            "pushcut_handoff_payload": {
                "title": "NOIZY Dispatch: Route Approved",
                "text": f"ETA: {round(actual_duration / 60, 1)} min. Tap to launch navigation.",
                "input": json.dumps({
                    "handoff_id": f"HND_{uuid.uuid4().hex[:8].upper()}",
                    "waybill_id": f"WB-{uuid.uuid4().hex[:6].upper()}",
                    "destination": destination,
                    "universal_url": waze_url,
                    "harmony_receipt_hash": route_result["harmony_receipt_hash"]
                }),
                "defaultAction": {
                    "name": "NOIZY-CarPlay-Handoff",
                    "shortcut": "NOIZY-CarPlay-Handoff",
                    "runOnServer": False
                },
                "isTimeSensitive": True
            }
        }


if __name__ == "__main__":
    print("=== node_runner.py v2.4.0-PROD initialized ===")
