"""
structured_correction_learner.py
Privacy-Preserving Learning from Explicit Human Corrections.
Learns preferences from structured interactions rather than raw prompts/voice bytes:
- driver accepted route
- driver rejected route
- driver changed threshold
- driver deferred navigation
- creator corrected asset attribution
- operator revoked capability
"""

from __future__ import annotations

import hashlib
import time
import uuid
from typing import Dict, Any, List, Optional


class StructuredCorrectionLearner:
    """
    Learns human preferences deterministically from structured telemetry corrections.
    Zero raw audio, prompt, or coordinate retention.
    """

    def __init__(self):
        self.preferences: Dict[str, Dict[str, Any]] = {}

    def record_human_correction(
        self,
        subject_id: str, # hashed driver/creator id
        predicate: str,  # e.g., 'traffic_warning_threshold'
        value: Any,      # e.g., 0.20
        source: str = "explicit_correction",
        confidence: float = 0.95,
        expires_at: Optional[str] = None
    ) -> Dict[str, Any]:
        pref_id = f"PREF-{uuid.uuid4().hex[:8].upper()}"
        
        pref_record = {
            "preference_id": pref_id,
            "subject": hashlib.sha256(subject_id.encode()).hexdigest()[:16],
            "predicate": predicate,
            "value": value,
            "source": source,
            "confidence": confidence,
            "expires_at": expires_at,
            "reversible": True,
            "recorded_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())
        }

        self.preferences[pref_id] = pref_record
        return pref_record

    def get_learned_preference(self, subject_id: str, predicate: str) -> Optional[Dict[str, Any]]:
        subj_hash = hashlib.sha256(subject_id.encode()).hexdigest()[:16]
        for pref in self.preferences.values():
            if pref["subject"] == subj_hash and pref["predicate"] == predicate:
                return pref
        return None
