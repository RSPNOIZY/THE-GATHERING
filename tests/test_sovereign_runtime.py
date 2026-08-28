"""
test_sovereign_runtime.py
Comprehensive Test Suite for NOIZY Sovereign Runtime:
1. RSP Cognitive Firewall (Intent, Reversibility, 5 Outcomes, Protected Records)
2. GABRIEL Capability Broker (Allowlist, Risk Classes, Receipts)
3. Dreamchamber Telemetry Fabric (Operational, Governance, Outcome Planes & Budgets)
4. Sonic Passport Graph (Multi-Generational Lineage & Rights Assertions)
"""

import os
import sys
import unittest

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
from core.sovereign_runtime.dreamchamber_telemetry_fabric import (
    DreamchamberTelemetryFabric
)
from core.sovereign_runtime.sonic_passport_graph import (
    SonicPassportGraph
)


class TestSovereignRuntime(unittest.TestCase):

    def setUp(self):
        self.firewall = RspCognitiveFirewall(sovereign_authority="RSP_001")
        self.broker = GabrielCapabilityBroker(broker_id="GABRIEL_CORE_01")
        self.telemetry = DreamchamberTelemetryFabric(node_id="DREAMCHAMBER_NODE")
        self.passport = SonicPassportGraph(sovereign_owner="RSP_001")

    # =========================================================================
    # 1. RSP Cognitive Firewall Tests
    # =========================================================================
    def test_protected_intent_record_creation(self):
        record = self.firewall.create_protected_human_intent_record(
            raw_input="Take me to YOW Airport avoiding highway delay",
            actor_id="RSP_001",
            normalized_intent="prepare traffic-aware route",
            purpose="dispatch_eta",
            authority="driver",
            consent_state="ACTIVE",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.FULLY_REVERSIBLE
        )
        self.assertTrue(record["intent_id"].startswith("INT_"))
        self.assertEqual(record["purpose"], "dispatch_eta")
        # Ensure raw input is not stored in plaintext
        self.assertNotIn("Take me to YOW", str(record))
        self.assertEqual(len(record["raw_intent_hash"]), 64)

    def test_firewall_abstain_on_missing_consent(self):
        record = self.firewall.create_protected_human_intent_record(
            raw_input="compute route",
            actor_id="RSP_001",
            normalized_intent="route",
            purpose="nav",
            authority="driver",
            consent_state="REVOKED",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.FULLY_REVERSIBLE
        )
        decision = self.firewall.evaluate_decision(record, evidence_quality_score=0.95, active_consent=False)
        self.assertEqual(decision["outcome"], FirewallOutcome.ABSTAIN.value)
        self.assertIn("ABSTAIN", decision["reason"])

    def test_firewall_requires_approval_for_location(self):
        record = self.firewall.create_protected_human_intent_record(
            raw_input="launch waze nav",
            actor_id="RSP_001",
            normalized_intent="launch navigation",
            purpose="nav",
            authority="driver",
            consent_state="ACTIVE",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.CONDITIONALLY_REVERSIBLE
        )
        decision = self.firewall.evaluate_decision(record, evidence_quality_score=0.90, active_consent=True)
        self.assertEqual(decision["outcome"], FirewallOutcome.ALLOW_WITH_RSP_APPROVAL.value)

    # =========================================================================
    # 2. GABRIEL Capability Broker Tests
    # =========================================================================
    def test_capability_allowlist_enforcement(self):
        # 1. Registered tool with approval
        result = self.broker.verify_and_broker_tool("google_routes.compute", caller_tier="T3_FAMILY", user_approved=True)
        self.assertTrue(result["permitted"])
        self.assertTrue(result["rule_zero_receipt"].startswith("REC_GAB_"))

        # 2. Arbitrary unregistered tool
        bad_result = self.broker.verify_and_broker_tool("malicious_unregistered_tool", caller_tier="T1_SANDBOX")
        self.assertFalse(bad_result["permitted"])
        self.assertIn("SECURITY_VIOLATION", bad_result["error"])

    # =========================================================================
    # 3. Dreamchamber Telemetry Fabric Tests
    # =========================================================================
    def test_privacy_budget_and_tri_plane_telemetry(self):
        budget = self.telemetry.create_mission_privacy_budget("MSN_TEST_001")
        self.assertIn("raw_prompt", budget["prohibited_data"])
        self.assertFalse(budget["export_allowed"])

        op = self.telemetry.emit_operational_metric("MSN_TEST_001", latency_ms=42.5, retry_count=0)
        gov = self.telemetry.emit_governance_event("MSN_TEST_001", "NC-01-10", "APPROVED", "REC_001")
        out = self.telemetry.emit_outcome_event("MSN_TEST_001", mission_completed=True)

        self.assertEqual(op["plane"], "OPERATIONAL")
        self.assertEqual(gov["plane"], "GOVERNANCE")
        self.assertEqual(out["plane"], "OUTCOME")

    # =========================================================================
    # 4. Sonic Passport Lineage Graph Tests
    # =========================================================================
    def test_sonic_passport_lineage_chain(self):
        # Register Master
        master = self.passport.register_audio_asset("Heaven Anthem Master", b"AUDIO_MASTER_BYTES", derivative_type="MASTER")
        # Register Stem derived from Master
        stem = self.passport.register_audio_asset("Vocal Lead Stem 396Hz", b"AUDIO_STEM_BYTES", derivative_type="STEM", parent_asset_ids=[master["asset_id"]])

        chain = self.passport.build_lineage_chain(stem["asset_id"])
        self.assertEqual(len(chain), 2)
        self.assertEqual(chain[0]["derivative_type"], "STEM")
        self.assertEqual(chain[1]["derivative_type"], "MASTER")
        self.assertEqual(chain[1]["covenant_split"], "75.00%")


if __name__ == "__main__":
    unittest.main()
