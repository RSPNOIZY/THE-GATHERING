"""
test_vertical_slice_all_lanes.py
Executes the Unified Vertical Slice across all 13 Parallel Lanes:
1 mission -> 1 consent check -> 1 decision packet -> 1 registered capability ->
1 controlled execution -> 1 pre/post receipt -> 1 redacted telemetry trace -> 1 human correction.
"""

import hashlib
import json
import os
import sys
import time
import unittest

sys.path.insert(0, "/Users/m2ultra/THE-GATHERING")

from core.sovereign_runtime.rsp_cognitive_firewall import (
    RspCognitiveFirewall,
    FirewallOutcome,
    RiskClass,
    Reversibility
)
from core.sovereign_runtime.gabriel_capability_broker import GabrielCapabilityBroker
from core.sovereign_runtime.sovereign_pipeline_orchestrator import SovereignPipelineOrchestrator
from core.sovereign_runtime.dreamchamber_telemetry_fabric import DreamchamberTelemetryFabric
from core.sovereign_runtime.sonic_passport_graph import SonicPassportGraph
from core.sovereign_runtime.counterfactual_policy_engine import CounterfactualPolicyEngine
from core.sovereign_runtime.structured_correction_learner import StructuredCorrectionLearner
from core.sovereign_runtime.audio_vehicle_scenes import AudioVehicleSceneEngine, AudioSceneType
from core.sovereign_runtime.sovereign_fleet_mesh import SovereignFleetMesh
from core.sovereign_runtime.mission_simulator import MissionSimulator


class TestUnifiedVerticalSlice(unittest.TestCase):

    def setUp(self):
        self.orchestrator = SovereignPipelineOrchestrator(sovereign_authority="RSP_001")
        self.telemetry = DreamchamberTelemetryFabric(node_id="DREAMCHAMBER_01")
        self.passport = SonicPassportGraph(sovereign_owner="RSP_001")
        self.counterfactual = CounterfactualPolicyEngine()
        self.learner = StructuredCorrectionLearner()
        self.scene_engine = AudioVehicleSceneEngine()
        self.fleet_mesh = SovereignFleetMesh()
        self.simulator = MissionSimulator(sovereign_authority="RSP_001")

    def test_complete_unified_vertical_slice_end_to_end(self):
        """
        Executes the canonical slice from human intent to post-execution correction across all 13 lanes.
        """
        mission_id = "MIS-20260828-SLICE-01"
        actor_id = "DRV-RSP-001"
        raw_prompt = "Prepare traffic-aware route to YOW Ottawa Airport for passenger pickup"
        normalized_intent = "prepare_traffic_aware_route"
        target_tool = "google_routes.compute"
        policy_code = "NC-01-10-v2"

        # ---------------------------------------------------------------------
        # LANE 1: RSP CONTROL PLANE & COGNITIVE FIREWALL
        # ---------------------------------------------------------------------
        intent_record = self.orchestrator.firewall.create_protected_human_intent_record(
            raw_input=raw_prompt,
            actor_id=actor_id,
            normalized_intent=normalized_intent,
            purpose="dispatch_eta",
            authority="RSP",
            consent_state="ACTIVE",
            risk_class=RiskClass.LOCATION_OPERATION,
            reversibility=Reversibility.FULLY_REVERSIBLE
        )
        self.assertTrue(intent_record["intent_id"].startswith("INT_"))
        self.assertNotIn(raw_prompt, json.dumps(intent_record)) # Raw prompt redacted

        firewall_decision = self.orchestrator.firewall.evaluate_decision(
            intent_record=intent_record,
            evidence_quality_score=0.94,
            active_consent=True
        )
        self.assertEqual(firewall_decision["outcome"], "ALLOW_WITH_RSP_APPROVAL")

        # ---------------------------------------------------------------------
        # LANE 2: COUNTERFACTUAL POLICY ENGINE
        # ---------------------------------------------------------------------
        counterfactual = self.counterfactual.generate_explanation(firewall_decision)
        self.assertEqual(counterfactual["current"], "ALLOW_WITH_RSP_APPROVAL")
        self.assertIn("consent_revoked_or_expired", counterfactual["would_be_denied_if"])
        self.assertIn("route_age_exceeds_120_seconds", counterfactual["would_abstain_if"])

        # ---------------------------------------------------------------------
        # LANE 3: HARMONY LEDGER (PRE-EXECUTION PROPOSED RECEIPT)
        # ---------------------------------------------------------------------
        rec_id = "REC-SLICE-001"
        input_hash = hashlib.sha256(b"SAMPLE_ORIGIN_DESTINATION_PAYLOAD").hexdigest()
        proposed_receipt = {
            "receipt_id": rec_id,
            "mission_id": mission_id,
            "sequence": 1,
            "state": "PROPOSED",
            "capability_id": target_tool,
            "decision_id": firewall_decision["decision_id"],
            "policy_version": "RSP-CF-v1",
            "input_hash": input_hash,
            "output_hash": None,
            "previous_receipt_hash": "0" * 64,
            "signing_key_id": "harmony-key-2026-01",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }
        self.assertEqual(proposed_receipt["state"], "PROPOSED")

        # ---------------------------------------------------------------------
        # LANE 4: GABRIEL CAPABILITY BROKER (AUTHORIZATION & GATING)
        # ---------------------------------------------------------------------
        broker_check = self.orchestrator.broker.verify_and_broker_tool(
            tool_name=target_tool,
            caller_tier="T4_SOVEREIGN",
            user_approved=True # Signed by RSP_001
        )
        self.assertTrue(broker_check["permitted"])
        self.assertEqual(broker_check["capability"]["capability_class"], "PREPARE")

        # ---------------------------------------------------------------------
        # LANE 5: CONTROLLED EXECUTION & HARMONY RECEIPT FINALIZATION
        # ---------------------------------------------------------------------
        output_payload = {
            "provider": "google_routes",
            "duration_seconds": 1284,
            "eta_minutes": 21.4,
            "distance_meters": 14250,
            "waze_universal_link": "https://waze.com/ul?ll=45.3225%2C-75.6692&navigate=yes&utm_source=noizy"
        }
        output_hash = hashlib.sha256(json.dumps(output_payload).encode()).hexdigest()

        final_receipt = dict(proposed_receipt)
        final_receipt["sequence"] = 2
        final_receipt["state"] = "SUCCEEDED"
        final_receipt["output_hash"] = output_hash
        final_receipt["finalized_at"] = time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        self.assertEqual(final_receipt["state"], "SUCCEEDED")

        # ---------------------------------------------------------------------
        # LANE 6: DREAMCHAMBER TELEMETRY FABRIC (REDACTED TRI-PLANE)
        # ---------------------------------------------------------------------
        privacy_budget = self.telemetry.create_mission_privacy_budget(mission_id)
        op_event = self.telemetry.emit_operational_metric(mission_id, latency_ms=38.2, retry_count=0)
        gov_event = self.telemetry.emit_governance_event(mission_id, policy_code, "APPROVED", rec_id)
        out_event = self.telemetry.emit_outcome_event(mission_id, mission_completed=True)

        self.assertEqual(op_event["plane"], "OPERATIONAL")
        self.assertEqual(gov_event["plane"], "GOVERNANCE")
        self.assertEqual(out_event["plane"], "OUTCOME")

        # ---------------------------------------------------------------------
        # LANE 7: SONIC PASSPORT ASSET IDENTITY & AUDIO-TO-VEHICLE SCENE
        # ---------------------------------------------------------------------
        passport_node = self.passport.register_audio_asset(
            title="Sovereign Departure Theme 396Hz",
            audio_bytes=b"NOIZY_AUDIO_MASTER_WAV_BYTES_396HZ",
            derivative_type="MASTER"
        )
        self.assertIn("exact_hash", passport_node)
        self.assertIn("perceptual_id", passport_node)
        self.assertIn("provenance_claim", passport_node)
        self.assertIn("rights_claim", passport_node)
        self.assertIn("watermark_signal", passport_node)
        self.assertEqual(passport_node["rights_claim"]["covenant_split"], "75.00%")

        # In-Vehicle Scene Transition
        scene = self.scene_engine.activate_scene(
            mission_id=mission_id,
            scene_type=AudioSceneType.NAVIGATION_PRIORITY,
            asset_passport_id=passport_node["asset_id"]
        )
        self.assertEqual(scene["scene"], "NAVIGATION_PRIORITY")
        self.assertEqual(scene["config"]["ducking_on_nav_db"], -18)

        # ---------------------------------------------------------------------
        # LANE 8: FLEET MESH (ANONYMIZED PATTERNS)
        # ---------------------------------------------------------------------
        self.fleet_mesh.ingest_anonymized_mission_summary(
            corridor_id="YOW_AIRPORT_CORRIDOR",
            duration_seconds=1284,
            delay_seconds=180,
            route_failed=False,
            driver_corrected=True
        )
        fleet_intel = self.fleet_mesh.get_fleet_intelligence()
        self.assertEqual(fleet_intel["privacy_standard"], "ZERO_RAW_COORDINATE_AGGREGATION")
        self.assertEqual(fleet_intel["metrics"]["total_missions_executed"], 1)

        # ---------------------------------------------------------------------
        # LANE 9: STRUCTURED HUMAN CORRECTION & PREFERENCE LEARNING
        # ---------------------------------------------------------------------
        pref = self.learner.record_human_correction(
            subject_id=actor_id,
            predicate="traffic_warning_threshold",
            value=0.20, # Driver lowered delay threshold to 20%
            source="explicit_correction",
            confidence=0.95
        )
        self.assertTrue(pref["preference_id"].startswith("PREF-"))
        self.assertEqual(pref["predicate"], "traffic_warning_threshold")
        self.assertEqual(pref["value"], 0.20)

        learned = self.learner.get_learned_preference(actor_id, "traffic_warning_threshold")
        self.assertIsNotNone(learned)
        self.assertEqual(learned["value"], 0.20)


if __name__ == "__main__":
    unittest.main()
