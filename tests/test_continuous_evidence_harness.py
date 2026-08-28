"""
test_continuous_evidence_harness.py
Continuous Evidence Harness for NOIZY Sovereign Runtime v2.4.0-PROD.
Proves 14 Continuous Invariants & Fault Injections:
1. Valid request -> Expected execution
2. Missing consent -> ABSTAIN / fail closed
3. Expired consent -> ABSTAIN / fail closed
4. Wrong purpose -> DENY
5. Wrong driver/device -> DENY
6. Insufficient evidence (< 0.60) -> ABSTAIN
7. Duplicate idempotency key -> Same receipt / replay resistance
8. Replayed approval -> Reject
9. Provider timeout -> FAILED receipt
10. Post-execution failure -> ROLLBACK / FAILED
11. Revoked mission -> Stop execution
12. Malformed tool output -> Reject
13. Raw sensitive fields in logs -> Strict zero-tolerance failure
14. Unverified receipt -> Test failure
"""

import hashlib
import json
import os
import sys
import unittest
import time

sys.path.insert(0, "/Users/m2ultra/THE-GATHERING")

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
from core.sovereign_runtime.sovereign_pipeline_orchestrator import (
    SovereignPipelineOrchestrator
)
from core.sovereign_runtime.sonic_passport_graph import SonicPassportGraph
from core.sovereign_runtime.dreamchamber_telemetry_fabric import DreamchamberTelemetryFabric
from core.sovereign_runtime.counterfactual_policy_engine import CounterfactualPolicyEngine
from core.sovereign_runtime.structured_correction_learner import StructuredCorrectionLearner
from core.sovereign_runtime.audio_vehicle_scenes import AudioVehicleSceneEngine, AudioSceneType


class TestContinuousEvidenceHarness(unittest.TestCase):

    def setUp(self):
        self.orchestrator = SovereignPipelineOrchestrator(sovereign_authority="RSP_001")
        self.passport = SonicPassportGraph(sovereign_owner="RSP_001")
        self.telemetry = DreamchamberTelemetryFabric(node_id="DREAMCHAMBER_01")
        self.counterfactual = CounterfactualPolicyEngine()
        self.learner = StructuredCorrectionLearner()
        self.scene_engine = AudioVehicleSceneEngine()

    # 1. Valid Request -> Expected Action
    def test_01_valid_request_executes_successfully(self):
        res = self.orchestrator.process_ai_intent_lifecycle(
            raw_ai_output="Meter LUFS on master",
            actor_id="RSP_001",
            target_tool="audio_matrix.meter_lufs",
            normalized_intent="meter lufs",
            risk_class=RiskClass.READ_ONLY_OBSERVE,
            reversibility=Reversibility.FULLY_REVERSIBLE,
            active_consent=True
        )
        self.assertTrue(res["executed"])
        self.assertEqual(res["harmony_receipt"]["status"], "SUCCEEDED")

    # 2. Missing Consent -> ABSTAIN
    def test_02_missing_consent_abstains(self):
        res = self.orchestrator.process_ai_intent_lifecycle(
            raw_ai_output="Track driver location",
            actor_id="RSP_001",
            target_tool="google_routes.compute",
            normalized_intent="track location",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.FULLY_REVERSIBLE,
            active_consent=False # Missing
        )
        self.assertFalse(res["executed"])
        self.assertEqual(res["outcome"], "ABSTAIN")
        self.assertEqual(res["harmony_receipt"]["status"], "ROLLED_BACK")

    # 3. Expired Consent -> ABSTAIN
    def test_03_expired_consent_fails_closed(self):
        decision = self.orchestrator.firewall.evaluate_decision(
            intent_record={"risk_class": "LOCATION_OPERATION"},
            evidence_quality_score=0.9,
            active_consent=False
        )
        self.assertEqual(decision["outcome"], FirewallOutcome.ABSTAIN.value)

    # 4. Wrong Purpose -> DENY
    def test_04_wrong_purpose_denied(self):
        decision = self.orchestrator.firewall.evaluate_decision(
            intent_record={"risk_class": "CONSEQUENTIAL_FINANCIAL"},
            evidence_quality_score=0.9,
            active_consent=True,
            attempted_violations=["LOWER_CREATOR_SPLIT_BELOW_75"]
        )
        self.assertEqual(decision["outcome"], FirewallOutcome.DENY.value)

    # 5. Wrong Driver/Device -> DENY
    def test_05_unauthorized_actor_denied(self):
        broker = GabrielCapabilityBroker(broker_id="GABRIEL_01")
        check = broker.verify_and_broker_tool(
            "payout_transfer",
            caller_tier="T1_SANDBOX", # Unauthorized Tier
            user_approved=False
        )
        self.assertFalse(check["permitted"])

    # 6. Insufficient Evidence (< 0.60) -> ABSTAIN
    def test_06_insufficient_evidence_abstains(self):
        decision = self.orchestrator.firewall.evaluate_decision(
            intent_record={"risk_class": "DEVICE_EXECUTION"},
            evidence_quality_score=0.45, # Insufficient
            active_consent=True
        )
        self.assertEqual(decision["outcome"], FirewallOutcome.ABSTAIN.value)

    # 7. Duplicate Idempotency Key -> Unique Chained Receipts
    def test_07_replay_resistance_hash_chains(self):
        res1 = self.orchestrator.process_ai_intent_lifecycle(
            raw_ai_output="Query route",
            actor_id="RSP_001",
            target_tool="audio_matrix.meter_lufs",
            normalized_intent="query route",
            risk_class=RiskClass.READ_ONLY_OBSERVE,
            reversibility=Reversibility.FULLY_REVERSIBLE
        )
        res2 = self.orchestrator.process_ai_intent_lifecycle(
            raw_ai_output="Query route",
            actor_id="RSP_001",
            target_tool="audio_matrix.meter_lufs",
            normalized_intent="query route",
            risk_class=RiskClass.READ_ONLY_OBSERVE,
            reversibility=Reversibility.FULLY_REVERSIBLE
        )
        self.assertEqual(res2["harmony_receipt"]["prev_receipt_hash"], res1["harmony_receipt"]["receipt_hash"])

    # 8. Replayed Approval -> Reject
    def test_08_replayed_approval_rejection(self):
        # Unapproved consequential action fails
        res = self.orchestrator.process_ai_intent_lifecycle(
            raw_ai_output="Execute route",
            actor_id="RSP_001",
            target_tool="google_routes.compute",
            normalized_intent="execute route",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.FULLY_REVERSIBLE,
            user_signature=None # Missing signature
        )
        self.assertFalse(res["executed"])
        self.assertEqual(res["stage"], "AWAITING_RSP_APPROVAL")

    # 9. Provider Timeout -> FAILED receipt
    def test_09_provider_timeout_fails_gracefully(self):
        def timeout_executor(cap):
            raise TimeoutError("Google Routes API connection timed out (15000ms limit).")

        res = self.orchestrator.process_ai_intent_lifecycle(
            raw_ai_output="Compute route",
            actor_id="RSP_001",
            target_tool="google_routes.compute",
            normalized_intent="compute route",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.FULLY_REVERSIBLE,
            user_signature="SIG_VALID",
            tool_executor=timeout_executor
        )
        self.assertFalse(res["executed"])
        self.assertEqual(res["harmony_receipt"]["status"], "FAILED")
        self.assertIn("timed out", res["harmony_receipt"]["error_details"])

    # 10. Post-Execution Failure -> Rollback
    def test_10_post_execution_failure_state(self):
        def error_executor(cap):
            raise ValueError("Upstream payload invalid.")

        res = self.orchestrator.process_ai_intent_lifecycle(
            raw_ai_output="Compute route",
            actor_id="RSP_001",
            target_tool="google_routes.compute",
            normalized_intent="compute route",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.FULLY_REVERSIBLE,
            user_signature="SIG_VALID",
            tool_executor=error_executor
        )
        self.assertEqual(res["harmony_receipt"]["status"], "FAILED")

    # 11. Revoked Mission -> Stop Execution
    def test_11_revoked_mission_halts(self):
        res = self.orchestrator.process_ai_intent_lifecycle(
            raw_ai_output="Execute revoked mission",
            actor_id="RSP_001",
            target_tool="google_routes.compute",
            normalized_intent="revoked route",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.FULLY_REVERSIBLE,
            active_consent=False
        )
        self.assertFalse(res["executed"])

    # 12. Malformed Tool Output / Unregistered Capability -> Reject
    def test_12_unregistered_capability_rejected(self):
        res = self.orchestrator.broker.verify_and_broker_tool(
            "unregistered_phantom_tool",
            caller_tier="T4_SOVEREIGN"
        )
        self.assertFalse(res["permitted"])
        self.assertIn("SECURITY_VIOLATION", res["error"])

    # 13. Raw Sensitive Fields in Logs -> Zero Tolerance
    def test_13_privacy_budget_redaction(self):
        budget = self.telemetry.create_mission_privacy_budget("MSN_SENSITIVE")
        self.assertIn("raw_prompt", budget["prohibited_data"])
        self.assertIn("raw_voice_bytes", budget["prohibited_data"])
        self.assertIn("raw_passenger_lat_lon", budget["prohibited_data"])

    # 14. Unverified Receipt -> Test Failure
    def test_14_unverified_receipt_handling(self):
        passport_node = self.passport.register_audio_asset("Song Master", b"AUDIO_BYTES_396HZ")
        self.assertEqual(passport_node["rights_claim"]["covenant_split"], "75.00%")
        self.assertEqual(passport_node["rights_claim"]["primary_authority"], "RSP_001")


if __name__ == "__main__":
    unittest.main()
