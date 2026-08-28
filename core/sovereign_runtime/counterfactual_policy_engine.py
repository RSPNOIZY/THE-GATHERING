"""
counterfactual_policy_engine.py
Generates counterfactual explanations for RSP Cognitive Firewall decisions:
- Why was an action allowed / denied?
- What missing evidence would cause ABSTAIN?
- What would trigger a DENY?
- What safer alternatives exist?
- Is the action reversible?
"""

from __future__ import annotations

from typing import Dict, Any, List, Optional
from core.sovereign_runtime.rsp_cognitive_firewall import FirewallOutcome, RiskClass, Reversibility


class CounterfactualPolicyEngine:
    """
    Evaluates what state changes would alter a decision outcome.
    Turns governance into something testable, explainable, and accountable.
    """

    def generate_explanation(
        self,
        decision_packet: Dict[str, Any],
        active_consent: bool = True,
        evidence_quality_score: float = 0.95
    ) -> Dict[str, Any]:
        outcome = decision_packet.get("outcome", FirewallOutcome.ALLOW.value)
        risk = decision_packet.get("risk", {})
        reversibility = risk.get("reversibility", "REVERSIBLE")

        would_be_denied_if: List[str] = [
            "consent_revoked_or_expired",
            "destination_outside_mission_scope",
            "attempted_creator_split_reduction_below_75_pct",
            "unregistered_capability_invoked"
        ]

        would_abstain_if: List[str] = [
            "route_age_exceeds_120_seconds",
            "evidence_quality_score_below_0_60",
            "network_state_compromised_or_insecure",
            "driver_biometric_confidence_missing"
        ]

        safer_alternatives = {
            "prepare_traffic_aware_route": "prepare_route_without_opening_navigation",
            "launch_navigation": "display_static_eta_and_prompt_tap",
            "payout_transfer": "queue_escrow_hold_pending_manual_stationary_review",
            "modify_rights": "record_provisional_draft_in_local_sandbox"
        }

        intent = decision_packet.get("intent", "")
        safer_alt = safer_alternatives.get(intent, "defer_action_for_stationary_review")

        return {
            "current": outcome,
            "reversibility": reversibility,
            "can_be_reversed": reversibility in ["REVERSIBLE", "CONDITIONALLY_REVERSIBLE"],
            "would_be_denied_if": would_be_denied_if,
            "would_abstain_if": would_abstain_if,
            "safer_alternative": safer_alt,
            "policy_version": decision_packet.get("policy_version", "RSP-CF-v1")
        }
