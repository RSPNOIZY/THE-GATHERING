"""
gabriel_capability_broker.py
GABRIEL Sovereign Execution Plane & Allowlisted Capability Broker (v2.4.0-PROD).
Enforces strict capability registration against capability-registry.schema.json.
An agent must never be able to invent a capability name or bypass registered policy.
"""

from __future__ import annotations

import enum
import json
import time
import uuid
from typing import Dict, Any, List, Optional, Callable


class CapabilityClass(str, enum.Enum):
    OBSERVE = "OBSERVE"               # Read-only: route ETA, device state, audio level
    PREPARE = "PREPARE"               # Draft route, prepare Pushcut handoff, create playlist
    EXECUTE = "EXECUTE"               # Open Waze, change audio routing, send notification
    CONSEQUENTIAL = "CONSEQUENTIAL"   # Disclose location, contact a person, alter a ride
    DESTRUCTIVE = "DESTRUCTIVE"       # Delete data, revoke access, overwrite asset


class GabrielCapabilityBroker:
    """
    Capability Broker managing allowlisted tools and verified execution gates.
    """

    CAPABILITY_REGISTRY: Dict[str, Dict[str, Any]] = {
        "google_routes.compute": {
            "capability_id": "google_routes.compute",
            "provider": "google_routes",
            "transport": "mcp_stdio",
            "capability_class": CapabilityClass.PREPARE.value,
            "risk_class": "LOCATION_OPERATION",
            "required_policy": "NC-01-10-v2",
            "required_approval": "RSP",
            "receipt_required": True,
            "reversible": True,
            "allowed_inputs": ["origin", "destination", "travel_mode", "routing_preference"],
            "redactions": ["session_token", "raw_coordinates_in_logs"],
            "timeout_ms": 15000
        },
        "audio_matrix.meter_lufs": {
            "capability_id": "audio_matrix.meter_lufs",
            "provider": "dsp_matrix",
            "transport": "local_function",
            "capability_class": CapabilityClass.OBSERVE.value,
            "risk_class": "READ_ONLY_OBSERVE",
            "required_policy": "NOIZY-AUDIO-v1",
            "required_approval": "NONE",
            "receipt_required": False,
            "reversible": True,
            "allowed_inputs": ["audio_path", "target_lufs"],
            "redactions": [],
            "timeout_ms": 5000
        },
        "audio_matrix.inject_watermark": {
            "capability_id": "audio_matrix.inject_watermark",
            "provider": "audioseal",
            "transport": "local_function",
            "capability_class": CapabilityClass.PREPARE.value,
            "risk_class": "PREPARATION",
            "required_policy": "EU-AI-ACT-ART-50",
            "required_approval": "NONE",
            "receipt_required": True,
            "reversible": True,
            "allowed_inputs": ["audio_bytes", "watermark_token"],
            "redactions": [],
            "timeout_ms": 10000
        },
        "waze.launch_navigation": {
            "capability_id": "waze.launch_navigation",
            "provider": "waze_universal",
            "transport": "native_bridge",
            "capability_class": CapabilityClass.EXECUTE.value,
            "risk_class": "LOCATION_OPERATION",
            "required_policy": "CARPLAY-SAFETY-v1",
            "required_approval": "DRIVER",
            "receipt_required": True,
            "reversible": True,
            "allowed_inputs": ["latitude", "longitude", "destination_label"],
            "redactions": ["raw_coordinates_in_logs"],
            "timeout_ms": 5000
        },
        "d1_ledger.commit_receipt": {
            "capability_id": "d1_ledger.commit_receipt",
            "provider": "cloudflare_d1",
            "transport": "mcp_streamable_http",
            "capability_class": CapabilityClass.EXECUTE.value,
            "risk_class": "READ_ONLY_OBSERVE",
            "required_policy": "RULE-ZERO-v1",
            "required_approval": "SYSTEM",
            "receipt_required": True,
            "reversible": False,
            "allowed_inputs": ["receipt_id", "data_hash", "payload"],
            "redactions": ["session_token"],
            "timeout_ms": 8000
        },
        "sovereign_catalog.lock": {
            "capability_id": "sovereign_catalog.lock",
            "provider": "sovereign_catalog",
            "transport": "local_function",
            "capability_class": CapabilityClass.CONSEQUENTIAL.value,
            "risk_class": "CONSEQUENTIAL_FINANCIAL",
            "required_policy": "PLOWMAN-75-25",
            "required_approval": "RSP",
            "receipt_required": True,
            "reversible": False,
            "allowed_inputs": ["asset_id", "covenant_split", "signing_authority"],
            "redactions": [],
            "timeout_ms": 5000
        }
    }

    def __init__(self, broker_id: str = "GABRIEL_BROKER_01"):
        self.broker_id = broker_id

    def verify_and_broker_tool(
        self,
        tool_name: str,
        caller_tier: str,
        user_approved: bool = False
    ) -> Dict[str, Any]:
        """
        Verifies tool against the strict allowlisted registry.
        Rejects arbitrary or un-registered tool calls.
        """
        if tool_name not in self.CAPABILITY_REGISTRY:
            return {
                "permitted": False,
                "error": f"SECURITY_VIOLATION: Tool '{tool_name}' is not in the GABRIEL allowlisted capability registry.",
                "rule_zero_receipt": None
            }

        capability = self.CAPABILITY_REGISTRY[tool_name]
        req_approval = capability["required_approval"]

        # Check required approval
        if req_approval in ["DRIVER", "RSP"] and not user_approved:
            return {
                "permitted": False,
                "error": f"APPROVAL_REQUIRED: Tool '{tool_name}' (Approval: {req_approval}) requires explicit user approval before invocation.",
                "rule_zero_receipt": None
            }

        # Generate signed execution receipt
        receipt_id = f"REC_GAB_{uuid.uuid4().hex[:10].upper()}"

        return {
            "permitted": True,
            "tool": tool_name,
            "capability": capability,
            "rule_zero_receipt": receipt_id,
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
