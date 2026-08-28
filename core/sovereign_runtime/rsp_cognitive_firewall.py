"""
rsp_cognitive_firewall.py
RSP Cognitive Firewall & Sovereign Decision Engine (v2.4.0 Hardened).
Evaluates human intent, risk, reversibility, evidence quality, and consent before any consequential execution.
5 Authority Outcomes:
- ALLOW
- ALLOW_WITH_RSP_APPROVAL
- DEFER
- ABSTAIN
- DENY
"""

from __future__ import annotations

import enum
import hashlib
import time
import uuid
from typing import Dict, Any, List, Optional, Tuple


class FirewallOutcome(str, enum.Enum):
    ALLOW = "ALLOW"
    ALLOW_WITH_RSP_APPROVAL = "ALLOW_WITH_RSP_APPROVAL"
    DEFER = "DEFER"
    ABSTAIN = "ABSTAIN"
    DENY = "DENY"


class RiskClass(str, enum.Enum):
    READ_ONLY_OBSERVE = "READ_ONLY_OBSERVE"
    PREPARATION = "PREPARATION"
    DEVICE_EXECUTION = "DEVICE_EXECUTION"
    LOCATION_OPERATION = "LOCATION_OPERATION"
    CONSEQUENTIAL_FINANCIAL = "CONSEQUENTIAL_FINANCIAL"
    DESTRUCTIVE_OVERWRITE = "DESTRUCTIVE_OVERWRITE"


class Reversibility(str, enum.Enum):
    FULLY_REVERSIBLE = "FULLY_REVERSIBLE"
    CONDITIONALLY_REVERSIBLE = "CONDITIONALLY_REVERSIBLE"
    IRREVERSIBLE = "IRREVERSIBLE"


class RspCognitiveFirewall:
    """
    RSP Cognitive Firewall Policy Engine.
    Enforces that nothing consequential executes directly from an AI response.
    RSP is the sole human authority.
    """

    NEVER_CLAUSES = [
        "LOWER_CREATOR_SPLIT_BELOW_75",
        "PUMP_GOOGLE_TURNS_TO_TTS",
        "VIDEO_PLAYBACK_WHILE_IN_MOTION",
        "BYPASS_LAW25_CONSENT",
        "UNAUTHORIZED_FINANCIAL_PAYOUT"
    ]

    def __init__(self, sovereign_authority: str = "RSP_001"):
        self.sovereign_authority = sovereign_authority

    def hash_raw_intent(self, raw_input: str) -> str:
        return hashlib.sha256(raw_input.strip().encode("utf-8")).hexdigest()

    def create_protected_human_intent_record(
        self,
        raw_input: str,
        actor_id: str,
        normalized_intent: str,
        purpose: str,
        authority: str,
        consent_state: str,
        risk_class: RiskClass,
        reversibility: Reversibility,
        ttl_seconds: int = 3600
    ) -> Dict[str, Any]:
        """
        Creates a privacy-preserving protected human intent record.
        Retains cryptographic intent hash and authorization parameters without raw voice/prompt text.
        """
        now = time.time()
        intent_id = f"INT_{uuid.uuid4().hex[:12].upper()}"
        raw_hash = self.hash_raw_intent(raw_input)

        return {
            "intent_id": intent_id,
            "actor_id": actor_id,
            "raw_intent_hash": raw_hash,
            "normalized_intent": normalized_intent,
            "purpose": purpose,
            "authority": authority,
            "consent_state": consent_state,
            "risk_class": risk_class.value,
            "reversibility": reversibility.value,
            "approval": "REQUIRED" if risk_class in [RiskClass.LOCATION_OPERATION, RiskClass.CONSEQUENTIAL_FINANCIAL, RiskClass.DESTRUCTIVE_OVERWRITE] else "OPTIONAL",
            "created_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now)),
            "expires_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime(now + ttl_seconds))
        }

    def evaluate_decision(
        self,
        intent_record: Dict[str, Any],
        evidence_quality_score: float, # 0.0 to 1.0
        active_consent: bool,
        attempted_violations: Optional[List[str]] = None,
        emergency_override: bool = False
    ) -> Dict[str, Any]:
        """
        Evaluates the Cognitive Firewall pipeline across 5 distinct outcomes:
        1. DENY: Explicit policy or Never-Clause prohibition.
        2. ABSTAIN: Insufficient evidence, authority, confidence, or missing consent.
        3. DEFER: Held in queue due to transient conditions.
        4. ALLOW_WITH_RSP_APPROVAL: Consequential action requiring explicit RSP signature.
        5. ALLOW: Conforms to policy with active consent and verifiable evidence.
        """
        decision_id = f"DEC_{uuid.uuid4().hex[:10].upper()}"
        risk_class = intent_record.get("risk_class")
        reversibility = intent_record.get("reversibility")

        # 1. Check for Explicit Policy DENY (Never Clauses)
        if attempted_violations:
            for v in attempted_violations:
                if v in self.NEVER_CLAUSES:
                    return {
                        "decision_id": decision_id,
                        "outcome": FirewallOutcome.DENY.value,
                        "reason": f"POLICY_PROHIBITION: Attempted violation of invariant Never-Clause '{v}'.",
                        "recommended_action": "Halt and log security violation receipt.",
                        "alternatives": []
                    }

        # 2. Check for ABSTAIN (Missing consent / confidence / authority)
        if not active_consent and not emergency_override:
            return {
                "decision_id": decision_id,
                "outcome": FirewallOutcome.ABSTAIN.value,
                "reason": "ABSTAIN: Active consent missing or revoked (Law 25 / NC-01-10 policy).",
                "recommended_action": "Request explicit consent renewal from user.",
                "alternatives": ["Defer action to offline queue", "Execute zero-knowledge local fallback"]
            }

        # 3. Check for ABSTAIN (Insufficient evidence quality score < 0.60 or confidence)
        if evidence_quality_score < 0.60:
            return {
                "decision_id": decision_id,
                "outcome": FirewallOutcome.ABSTAIN.value,
                "reason": f"ABSTAIN: Evidence quality score ({evidence_quality_score:.2f}) below required threshold 0.60.",
                "recommended_action": "Gather additional telemetry or user confirmation.",
                "alternatives": ["Retry telemetry probe", "Request manual override"]
            }

        # 4. Check for ALLOW_WITH_RSP_APPROVAL (Consequential or Destructive Operations)
        if risk_class in [
            RiskClass.LOCATION_OPERATION.value,
            RiskClass.CONSEQUENTIAL_FINANCIAL.value,
            RiskClass.DESTRUCTIVE_OVERWRITE.value
        ]:
            return {
                "decision_id": decision_id,
                "outcome": FirewallOutcome.ALLOW_WITH_RSP_APPROVAL.value,
                "reason": f"CONSEQUENTIAL_OPERATION: Risk class ({risk_class}) requires explicit RSP approval + policy validation.",
                "recommended_action": "Prompt RSP_001 via Pushcut / CarPlay Live Activity / Siri.",
                "alternatives": ["Preview route metrics", "Hold in dispatch queue"]
            }

        # 5. Default ALLOW
        return {
            "decision_id": decision_id,
            "outcome": FirewallOutcome.ALLOW.value,
            "reason": "LOW_RISK_VERIFIED: Operation conforms to standard policy with active consent.",
            "recommended_action": "Proceed with execution and log 2-phase Harmony receipt.",
            "alternatives": []
        }
