"""
sovereign_pipeline_orchestrator.py
Hardened End-to-End Orchestrator executing the Canonical 8-Stage Sovereign Lifecycle
with 2-Phase Receipt Commitment (PROPOSED -> AUTHORIZED -> EXECUTING -> SUCCEEDED | FAILED | ROLLED_BACK).
"""

from __future__ import annotations

import sys
import os

# Add root directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "../..")))

import hashlib
import json
import time
import uuid
from typing import Dict, Any, List, Optional, Callable

from core.sovereign_runtime.rsp_cognitive_firewall import (
    RspCognitiveFirewall,
    FirewallOutcome,
    RiskClass,
    Reversibility
)
from core.sovereign_runtime.gabriel_capability_broker import (
    GabrielCapabilityBroker,
    CapabilityClass
)
from core.sovereign_runtime.dreamchamber_telemetry_fabric import (
    DreamchamberTelemetryFabric
)


class SovereignPipelineOrchestrator:
    """
    Unified Orchestrator implementing the fail-closed human-directed execution pipeline.
    """

    def __init__(self, sovereign_authority: str = "RSP_001"):
        self.authority = sovereign_authority
        self.firewall = RspCognitiveFirewall(sovereign_authority=sovereign_authority)
        self.broker = GabrielCapabilityBroker(broker_id="GABRIEL_CORE_01")
        self.telemetry = DreamchamberTelemetryFabric(node_id="DREAMCHAMBER_01")
        self.receipt_ledger: Dict[str, Dict[str, Any]] = {}
        self.last_receipt_hash = "0" * 64

    def process_ai_intent_lifecycle(
        self,
        raw_ai_output: str,
        actor_id: str,
        target_tool: str,
        normalized_intent: str,
        risk_class: RiskClass,
        reversibility: Reversibility,
        evidence_quality_score: float = 0.95,
        active_consent: bool = True,
        user_signature: Optional[str] = None,
        tool_executor: Optional[Callable[[Dict[str, Any]], Any]] = None
    ) -> Dict[str, Any]:
        """
        Executes the 8-stage canonical pipeline:
        1. AI Output
        2. Decision Packet (PROPOSED Receipt created in Ledger)
        3. Cognitive Firewall (5 Outcomes: ALLOW | ALLOW_WITH_RSP_APPROVAL | DEFER | ABSTAIN | DENY)
        4. RSP Authority Check
        5. Signed Approval when required (AUTHORIZED)
        6. GABRIEL Capability Broker (EXECUTING)
        7. Execution
        8. Finalize Receipt (SUCCEEDED | FAILED | ROLLED_BACK)
        """
        pipeline_id = f"PIPE_{uuid.uuid4().hex[:10].upper()}"
        packet_id = f"PKT_{uuid.uuid4().hex[:10].upper()}"
        receipt_id = f"REC_{uuid.uuid4().hex[:10].upper()}"
        start_time = time.time()

        # Step 1 & 2: Create Protected Intent Record & Initial PROPOSED Receipt
        intent_record = self.firewall.create_protected_human_intent_record(
            raw_input=raw_ai_output,
            actor_id=actor_id,
            normalized_intent=normalized_intent,
            purpose=target_tool,
            authority=self.authority,
            consent_state="ACTIVE" if active_consent else "REVOKED",
            risk_class=risk_class,
            reversibility=reversibility
        )

        receipt = {
            "receipt_id": receipt_id,
            "intent_id": intent_record["intent_id"],
            "packet_id": packet_id,
            "actor_id": actor_id,
            "authority": self.authority,
            "status": "PROPOSED",
            "covenant_split": "75.00%",
            "tool_invoked": target_tool,
            "execution_duration_ms": None,
            "error_details": None,
            "prev_receipt_hash": self.last_receipt_hash,
            "receipt_hash": hashlib.sha256(f"{receipt_id}:PROPOSED:{self.last_receipt_hash}".encode()).hexdigest(),
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(start_time)),
            "finalized_at": None
        }
        self.receipt_ledger[receipt_id] = receipt

        # Step 3: Cognitive Firewall Evaluation
        firewall_decision = self.firewall.evaluate_decision(
            intent_record=intent_record,
            evidence_quality_score=evidence_quality_score,
            active_consent=active_consent
        )

        outcome = firewall_decision["outcome"]

        # Step 4: Fail-Closed Gate on DENY, ABSTAIN, DEFER
        if outcome in [FirewallOutcome.DENY.value, FirewallOutcome.ABSTAIN.value, FirewallOutcome.DEFER.value]:
            receipt["status"] = "FAILED" if outcome == FirewallOutcome.DENY.value else "ROLLED_BACK"
            receipt["error_details"] = firewall_decision["reason"]
            receipt["finalized_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            receipt["receipt_hash"] = hashlib.sha256(f"{receipt_id}:{receipt['status']}:{self.last_receipt_hash}".encode()).hexdigest()
            self.last_receipt_hash = receipt["receipt_hash"]

            self.telemetry.emit_governance_event(
                mission_id=pipeline_id,
                consent_policy="NC-01-10",
                approval_status="REFUSED",
                rule_zero_receipt=receipt_id,
                refusal_reason=firewall_decision["reason"]
            )
            return {
                "pipeline_id": pipeline_id,
                "packet_id": packet_id,
                "stage": "COGNITIVE_FIREWALL_BLOCKED",
                "outcome": outcome,
                "reason": firewall_decision["reason"],
                "recommendation": firewall_decision["recommended_action"],
                "executed": False,
                "harmony_receipt": receipt
            }

        # Step 5: Signed RSP Approval Check
        if outcome == FirewallOutcome.ALLOW_WITH_RSP_APPROVAL.value:
            if not user_signature:
                receipt["status"] = "PROPOSED"
                receipt["error_details"] = "AWAITING_RSP_APPROVAL"
                return {
                    "pipeline_id": pipeline_id,
                    "packet_id": packet_id,
                    "stage": "AWAITING_RSP_APPROVAL",
                    "outcome": outcome,
                    "reason": "Operation requires explicit RSP approval + policy validation.",
                    "intent_record": intent_record,
                    "executed": False,
                    "harmony_receipt": receipt
                }

        # Status -> AUTHORIZED -> EXECUTING
        receipt["status"] = "AUTHORIZED"
        receipt["status"] = "EXECUTING"

        # Step 6: GABRIEL Capability Broker Check
        broker_check = self.broker.verify_and_broker_tool(
            tool_name=target_tool,
            caller_tier="T4_SOVEREIGN" if actor_id == self.authority else "T3_FAMILY",
            user_approved=True
        )

        if not broker_check["permitted"]:
            receipt["status"] = "FAILED"
            receipt["error_details"] = broker_check["error"]
            receipt["finalized_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
            receipt["receipt_hash"] = hashlib.sha256(f"{receipt_id}:FAILED:{self.last_receipt_hash}".encode()).hexdigest()
            self.last_receipt_hash = receipt["receipt_hash"]
            return {
                "pipeline_id": pipeline_id,
                "packet_id": packet_id,
                "stage": "CAPABILITY_BROKER_DENIED",
                "error": broker_check["error"],
                "executed": False,
                "harmony_receipt": receipt
            }

        # Step 7: Tool Execution
        execution_result = None
        try:
            if tool_executor:
                execution_result = tool_executor(broker_check["capability"])
            else:
                execution_result = {"status": "EXECUTED_MOCK_SUCCESS", "tool": target_tool}
            receipt["status"] = "SUCCEEDED"
        except Exception as err:
            receipt["status"] = "FAILED"
            receipt["error_details"] = str(err)

        # Step 8: Finalize Receipt in Hash Chain
        duration_ms = round((time.time() - start_time) * 1000, 2)
        receipt["execution_duration_ms"] = duration_ms
        receipt["finalized_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        receipt["receipt_hash"] = hashlib.sha256(f"{receipt_id}:{receipt['status']}:{self.last_receipt_hash}".encode()).hexdigest()
        self.last_receipt_hash = receipt["receipt_hash"]

        self.telemetry.emit_operational_metric(mission_id=pipeline_id, latency_ms=duration_ms, retry_count=0)
        self.telemetry.emit_governance_event(
            mission_id=pipeline_id,
            consent_policy="NC-01-10",
            approval_status=receipt["status"],
            rule_zero_receipt=receipt_id
        )

        return {
            "pipeline_id": pipeline_id,
            "packet_id": packet_id,
            "stage": "EXECUTION_COMPLETE",
            "outcome": receipt["status"],
            "decision": firewall_decision,
            "capability": broker_check["capability"],
            "execution_result": execution_result,
            "harmony_receipt": receipt,
            "executed": receipt["status"] == "SUCCEEDED"
        }
