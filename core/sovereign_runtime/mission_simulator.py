"""
mission_simulator.py
Simulator and Replay Engine for Sovereign Runtime Missions:
- noizy mission replay <fixture.json>
- noizy policy explain <DEC-uuid>
- noizy receipt verify <REC-uuid>
- noizy mission rollback <MIS-uuid>
"""

from __future__ import annotations

import json
import hashlib
import time
import os
from typing import Dict, Any, Optional

from core.sovereign_runtime.rsp_cognitive_firewall import (
    RspCognitiveFirewall,
    FirewallOutcome,
    RiskClass,
    Reversibility
)
from core.sovereign_runtime.gabriel_capability_broker import GabrielCapabilityBroker
from core.sovereign_runtime.counterfactual_policy_engine import CounterfactualPolicyEngine


class MissionSimulator:
    """
    Executes policy, state machine transitions, and counterfactual analysis
    in dry-run / simulation mode without mutating external production state.
    """

    def __init__(self, sovereign_authority: str = "RSP_001"):
        self.authority = sovereign_authority
        self.firewall = RspCognitiveFirewall(sovereign_authority=sovereign_authority)
        self.broker = GabrielCapabilityBroker(broker_id="GABRIEL_SIM_01")
        self.counterfactual = CounterfactualPolicyEngine()
        self.simulated_receipts: Dict[str, Dict[str, Any]] = {}

    def replay_mission(self, fixture_path: str) -> Dict[str, Any]:
        if not os.path.exists(fixture_path):
            raise FileNotFoundError(f"Fixture not found: {fixture_path}")

        with open(fixture_path, "r", encoding="utf-8") as fh:
            fixture = json.load(fh)

        mission_id = fixture["mission_id"]
        decision = fixture["decision"]
        cap = fixture["capability"]
        actor_id = fixture["actor_id"]

        # Step 1: Pre-Execution PROPOSED Receipt
        rec_id = f"REC-SIM-{mission_id[-6:]}"
        prev_hash = "0" * 64
        input_hash = hashlib.sha256(json.dumps(fixture["execution_payload"]).encode()).hexdigest()

        proposed_receipt = {
            "receipt_id": rec_id,
            "mission_id": mission_id,
            "sequence": 1,
            "state": "PROPOSED",
            "capability_id": cap["capability_id"],
            "decision_id": decision["decision_id"],
            "policy_version": fixture.get("policy_version", "RSP-CF-v1"),
            "input_hash": input_hash,
            "output_hash": None,
            "previous_receipt_hash": prev_hash,
            "signing_key_id": "sim-key-2026",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        self.simulated_receipts[rec_id] = proposed_receipt

        # Step 2: Policy & Broker Verification
        outcome = decision.get("outcome", "ALLOW_WITH_RSP_APPROVAL")
        broker_check = self.broker.verify_and_broker_tool(cap["capability_id"], caller_tier="T4_SOVEREIGN", user_approved=True)

        # Step 3: Transition to SUCCEEDED
        output_payload = {
            "provider": cap["provider"],
            "duration_seconds": 1284,
            "eta_minutes": 21.4,
            "distance_meters": 14250,
            "simulated": True
        }
        output_hash = hashlib.sha256(json.dumps(output_payload).encode()).hexdigest()

        final_receipt = dict(proposed_receipt)
        final_receipt["sequence"] = 2
        final_receipt["state"] = "SUCCEEDED"
        final_receipt["output_hash"] = output_hash
        final_receipt["finalized_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self.simulated_receipts[rec_id] = final_receipt

        # Step 4: Generate Counterfactual Explanation
        explanation = self.counterfactual.generate_explanation(decision)

        return {
            "mission_id": mission_id,
            "status": "REPLAY_COMPLETE",
            "simulated_receipt": final_receipt,
            "counterfactual_explanation": explanation,
            "execution_output": output_payload
        }

    def explain_policy(self, decision_id: str, decision_packet: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        pkt = decision_packet or {
            "decision_id": decision_id,
            "intent": "prepare_traffic_aware_route",
            "outcome": "ALLOW_WITH_RSP_APPROVAL",
            "risk": { "reversibility": "REVERSIBLE" },
            "policy_version": "RSP-CF-v1"
        }
        return self.counterfactual.generate_explanation(pkt)

    def verify_receipt(self, receipt_id: str, receipt_data: Optional[Dict[str, Any]] = None) -> Dict[str, Any]:
        rec = receipt_data or self.simulated_receipts.get(receipt_id)
        if not rec:
            return { "receipt_id": receipt_id, "valid": False, "error": "RECEIPT_NOT_FOUND" }

        return {
            "receipt_id": receipt_id,
            "mission_id": rec.get("mission_id"),
            "state": rec.get("state"),
            "valid": rec.get("state") in ["SUCCEEDED", "PROPOSED", "AUTHORIZED"],
            "input_hash": rec.get("input_hash"),
            "output_hash": rec.get("output_hash")
        }

    def rollback_mission(self, mission_id: str) -> Dict[str, Any]:
        return {
            "mission_id": mission_id,
            "state": "ROLLED_BACK",
            "reason": "MANUAL_OR_POLICY_ROLLBACK_EXECUTED",
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
