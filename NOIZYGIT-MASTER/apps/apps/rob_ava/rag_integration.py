#!/usr/bin/env python3
"""Runtime RAG and governance integration for Rob.AVA."""

from __future__ import annotations

import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Callable, Literal, Optional
from urllib import error, request

from pydantic import BaseModel, Field, model_validator


ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
CONTRACTS_PATH = DATA_DIR / "collaboration_contracts.json"
KNOWLEDGE_PATH = DATA_DIR / "knowledge_store.json"
AUDIT_EVENTS_PATH = DATA_DIR / "audit_events.jsonl"
FAN_BOUNDARY_PATH = ROOT / "policy" / "ava_fan_boundary.json"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_json(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return fallback


def _save_json(path: Path, payload: dict[str, Any]) -> None:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(payload, indent=2), encoding="utf-8")


def _tokenize(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", text.lower()) if len(token) >= 2}


def _keyword_hits(text: str, keywords: list[str]) -> list[str]:
    lowered = text.lower()
    return [kw for kw in keywords if kw.lower() in lowered]


class RoyaltySplit(BaseModel):
    ava_owner: float = Field(ge=0.0, le=1.0)
    partner: float = Field(ge=0.0, le=1.0)

    @model_validator(mode="after")
    def _validate_total(self) -> "RoyaltySplit":
        if abs((self.ava_owner + self.partner) - 1.0) > 1e-6:
            raise ValueError("royalty_split ratios must sum to 1.0")
        return self


class AuditEvent(BaseModel):
    timestamp_utc: str = Field(default_factory=_utc_now)
    event_type: Literal[
        "contract_created",
        "contract_updated",
        "consent_granted",
        "consent_revoked",
        "session_started",
        "session_blocked",
        "session_completed",
        "rule_violation",
        "royalty_settled",
    ]
    actor_id: str
    summary: str
    details: dict[str, Any] = Field(default_factory=dict)


class CollaborationContract(BaseModel):
    collaboration_id: str = Field(min_length=8)
    ava_owner: str = Field(min_length=2)
    partner_ava: str = Field(min_length=2)
    allowed_languages: list[str] = Field(min_length=1)
    max_interaction_minutes: int = Field(ge=1, le=720)
    prohibited_topics: list[str] = Field(default_factory=list)
    consent_required: bool = True
    royalty_split: RoyaltySplit
    nda_enforced: bool = True
    session_logging: bool = True
    audit_trail: list[AuditEvent] = Field(default_factory=list)
    never_clauses: list[str] = Field(min_length=1)
    created_at: str = Field(default_factory=_utc_now)
    updated_at: str = Field(default_factory=_utc_now)
    status: Literal["draft", "active", "expired", "revoked"] = "draft"

    @model_validator(mode="after")
    def _validate_languages(self) -> "CollaborationContract":
        self.allowed_languages = sorted(set(self.allowed_languages))
        self.prohibited_topics = sorted(set(self.prohibited_topics))
        self.never_clauses = sorted(set(self.never_clauses))
        return self


class RagQueryRequest(BaseModel):
    ava_id: str
    user_query: str = Field(min_length=1, max_length=4000)
    user_type: Literal["actor", "fan", "partner"] = "fan"
    language: str = "en-US"
    session_id: Optional[str] = None
    partner_ava: Optional[str] = None
    requested_minutes: int = Field(default=5, ge=1, le=720)
    topics: list[str] = Field(default_factory=list)
    consent_key_signed: bool = False
    fan_age_bracket: Literal["unknown", "adult", "minor"] = "unknown"


class RagQueryResponse(BaseModel):
    allowed: bool
    response: Optional[str] = None
    refusal: Optional[str] = None
    reason_codes: list[str] = Field(default_factory=list)
    reasons: list[str] = Field(default_factory=list)
    session_id: str
    context_docs: list[dict[str, Any]] = Field(default_factory=list)


def load_fan_boundary_policy() -> dict[str, Any]:
    fallback = {
        "version": "1.0.0",
        "blocked_intent_keywords": {
            "medical_legal_financial_advice": [
                "diagnose",
                "prescription",
                "legal advice",
                "lawsuit",
                "investment advice",
                "stock tip",
            ],
            "identity_deception": [
                "pretend to be",
                "impersonate",
                "deepfake",
                "forge voice",
            ],
            "relationship_manipulation": [
                "isolate from friends",
                "you only need me",
                "send me private photos",
            ],
            "sensitive_data_collection": [
                "credit card",
                "social security",
                "bank account",
                "password",
            ],
            "nsfw": ["explicit", "sexual", "nude", "nsfw"],
        },
        "minor_escalation_keywords": ["sexual", "self-harm", "violence", "substance"],
        "required_disclosures": [
            "I am an AI AVA collaboration system.",
            "I cannot replace licensed medical, legal, or financial professionals.",
        ],
    }
    return _load_json(FAN_BOUNDARY_PATH, fallback)


def _load_contract_store() -> dict[str, dict[str, Any]]:
    return _load_json(CONTRACTS_PATH, {"contracts": {}}).get("contracts", {})


def _save_contract_store(store: dict[str, dict[str, Any]]) -> None:
    _save_json(CONTRACTS_PATH, {"contracts": store})


def upsert_contract(contract: CollaborationContract) -> CollaborationContract:
    store = _load_contract_store()
    payload = contract.model_dump()
    payload["updated_at"] = _utc_now()
    store[contract.collaboration_id] = payload
    _save_contract_store(store)
    return CollaborationContract(**payload)


def get_contract(collaboration_id: str) -> Optional[CollaborationContract]:
    store = _load_contract_store()
    payload = store.get(collaboration_id)
    if not payload:
        return None
    return CollaborationContract(**payload)


def list_contracts(ava_id: Optional[str] = None) -> list[CollaborationContract]:
    store = _load_contract_store()
    contracts = [CollaborationContract(**raw) for raw in store.values()]
    if not ava_id:
        return contracts
    return [
        contract
        for contract in contracts
        if contract.ava_owner == ava_id or contract.partner_ava == ava_id
    ]


def _resolve_active_contract(ava_id: str, partner_ava: Optional[str]) -> Optional[CollaborationContract]:
    if not partner_ava:
        return None
    candidates = list_contracts(ava_id=ava_id)
    for contract in candidates:
        if contract.status != "active":
            continue
        if contract.ava_owner == ava_id and contract.partner_ava == partner_ava:
            return contract
        if contract.partner_ava == ava_id and contract.ava_owner == partner_ava:
            return contract
    return None


def _load_knowledge_store() -> dict[str, Any]:
    fallback = {
        "farm": {
            "rsp001_commander_v1": [
                {
                    "id": "farm-001",
                    "language": "en-US",
                    "text": "RSP Commander persona leads with calm authority and protective tone.",
                },
                {
                    "id": "farm-002",
                    "language": "fr-FR",
                    "text": "RSP Commander avoids medical diagnosis and keeps communication grounded.",
                },
            ]
        },
        "crew": {
            "persona_123::persona_456": [
                {
                    "id": "crew-001",
                    "language": "en-US",
                    "text": "Collaboration sessions must respect 60-minute maximum and NDA constraints.",
                }
            ]
        },
    }
    return _load_json(KNOWLEDGE_PATH, fallback)


def _retrieve_docs(
    docs: list[dict[str, Any]], query: str, language: Optional[str], top_k: int
) -> list[dict[str, Any]]:
    query_tokens = _tokenize(query)
    ranked: list[tuple[int, dict[str, Any]]] = []
    for doc in docs:
        if language and doc.get("language") and doc.get("language") != language:
            continue
        score = len(_tokenize(str(doc.get("text", ""))).intersection(query_tokens))
        ranked.append((score, doc))
    ranked.sort(key=lambda item: item[0], reverse=True)
    winners = [doc for score, doc in ranked[:top_k] if score > 0]
    if winners:
        return winners
    return docs[:top_k]


def _farm_docs(ava_id: str, query: str, language: str) -> list[dict[str, Any]]:
    store = _load_knowledge_store()
    docs = store.get("farm", {}).get(ava_id, [])
    return _retrieve_docs(docs, query=query, language=language, top_k=6)


def _crew_docs(
    ava_id: str, partner_ava: Optional[str], query: str, language: str
) -> list[dict[str, Any]]:
    if not partner_ava:
        return []
    store = _load_knowledge_store()
    key_a = f"{ava_id}::{partner_ava}"
    key_b = f"{partner_ava}::{ava_id}"
    docs = store.get("crew", {}).get(key_a, []) + store.get("crew", {}).get(key_b, [])
    return _retrieve_docs(docs, query=query, language=language, top_k=4)


def append_audit_event(event: AuditEvent) -> AuditEvent:
    DATA_DIR.mkdir(parents=True, exist_ok=True)
    with AUDIT_EVENTS_PATH.open("a", encoding="utf-8") as handle:
        handle.write(json.dumps(event.model_dump()) + "\n")
    return event


def _fallback_generate(persona_name: str, user_query: str, context_docs: list[dict[str, Any]]) -> str:
    if context_docs:
        context = " ".join(str(doc.get("text", "")).strip() for doc in context_docs[:2])
        return (
            f"{persona_name}: I hear you. Based on approved context, {context} "
            f"Your request was: {user_query}"
        )
    return f"{persona_name}: I hear you. I can help within approved consent and collaboration rules."


def _chat_completion(prompt: str, persona_name: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return ""

    model = os.getenv("ROB_AVA_LLM_MODEL", "gpt-4o-mini")
    payload = {
        "model": model,
        "temperature": 0.4,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You are a policy-constrained AVA assistant. "
                    "Respect consent, never clauses, and collaboration boundaries."
                ),
            },
            {
                "role": "assistant",
                "content": f"Persona display name: {persona_name}",
            },
            {
                "role": "user",
                "content": prompt,
            },
        ],
    }

    req = request.Request(
        url="https://api.openai.com/v1/chat/completions",
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with request.urlopen(req, timeout=30) as resp:
            response_payload = json.loads(resp.read().decode("utf-8"))
            choices = response_payload.get("choices", [])
            if not choices:
                return ""
            message = choices[0].get("message", {})
            content = message.get("content", "")
            return content.strip() if isinstance(content, str) else ""
    except (TimeoutError, error.URLError, error.HTTPError, json.JSONDecodeError):
        return ""


def _build_augmented_prompt(
    request_model: RagQueryRequest,
    persona: dict[str, Any],
    never_clauses: list[str],
    context_docs: list[dict[str, Any]],
    contract: Optional[CollaborationContract],
    boundary_policy: dict[str, Any],
) -> str:
    persona_name = persona.get("display_name", request_model.ava_id)
    persona_traits = persona.get("character_traits", {})
    policy_lines = "\n".join(f"- {clause}" for clause in never_clauses)
    context_lines = "\n".join(
        f"- ({doc.get('language', 'n/a')}) {doc.get('text', '')}" for doc in context_docs
    )

    contract_summary = "none"
    if contract:
        contract_summary = (
            f"{contract.collaboration_id} status={contract.status}, "
            f"allowed_languages={contract.allowed_languages}, "
            f"max_minutes={contract.max_interaction_minutes}, "
            f"prohibited_topics={contract.prohibited_topics}"
        )

    disclosures = "\n".join(
        f"- {line}" for line in boundary_policy.get("required_disclosures", [])
    )

    return (
        f"USER_QUERY:\n{request_model.user_query}\n\n"
        f"PERSONA_NAME:\n{persona_name}\n\n"
        f"PERSONA_TRAITS:\n{json.dumps(persona_traits, ensure_ascii=True)}\n\n"
        f"COLLAB_CONTRACT:\n{contract_summary}\n\n"
        f"NEVER_CLAUSES:\n{policy_lines}\n\n"
        f"BOUNDARY_DISCLOSURES:\n{disclosures}\n\n"
        f"CONTEXT_DOCS:\n{context_lines}\n\n"
        "INSTRUCTION: Respond in character while staying inside consent, policy, and collaboration limits."
    )


def run_rag_query(
    request_model: RagQueryRequest,
    persona: dict[str, Any],
    policy: dict[str, Any],
    boundary_policy: dict[str, Any],
    refusal_builder: Callable[[str, str, Optional[str]], str],
) -> RagQueryResponse:
    session_id = request_model.session_id or f"sess_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"
    reasons: list[str] = []
    reason_codes: list[str] = []

    contract = _resolve_active_contract(request_model.ava_id, request_model.partner_ava)
    if request_model.partner_ava and not contract:
        reasons.append("No active collaboration contract with partner AVA.")
        reason_codes.append("CONTRACT_INACTIVE")

    if persona.get("status") != "approved":
        reasons.append("Persona must be approved before interactions.")
        reason_codes.append("PERSONA_NOT_APPROVED")

    query_lower = request_model.user_query.lower()
    blocked_topics = set(t.lower().strip() for t in policy.get("global_blocked_topics", []))
    blocked_topics.update(
        t.lower().strip() for t in persona.get("collaboration_rules", {}).get("restricted_topics", [])
    )

    if contract:
        blocked_topics.update(t.lower().strip() for t in contract.prohibited_topics)
        if request_model.language not in contract.allowed_languages:
            reasons.append("Requested language is not allowed by collaboration contract.")
            reason_codes.append("LANGUAGE_NOT_ALLOWED")
        if request_model.requested_minutes > contract.max_interaction_minutes:
            reasons.append("Requested duration exceeds collaboration contract limit.")
            reason_codes.append("DURATION_LIMIT_EXCEEDED")
        if contract.consent_required and not request_model.consent_key_signed:
            reasons.append("Consent key signature is required for this contract.")
            reason_codes.append("CONSENT_KEY_MISSING")

    for topic in blocked_topics:
        if topic and topic in query_lower:
            reasons.append(f"Prohibited topic detected: {topic}")
            reason_codes.append("TOPIC_PROHIBITED")
            break

    if request_model.user_type == "fan":
        blocked_groups = boundary_policy.get("blocked_intent_keywords", {})
        for group, keywords in blocked_groups.items():
            hits = _keyword_hits(request_model.user_query, keywords)
            if hits:
                reasons.append(f"Fan boundary policy blocked intent: {group}")
                reason_codes.append("FAN_BOUNDARY_VIOLATION")
                break

        if request_model.fan_age_bracket == "minor":
            minor_hits = _keyword_hits(
                request_model.user_query,
                boundary_policy.get("minor_escalation_keywords", []),
            )
            if minor_hits:
                reasons.append("Minor safety escalation triggered.")
                reason_codes.append("MINOR_SAFETY_ESCALATION")

    if reasons:
        level = "firm" if "FAN_BOUNDARY_VIOLATION" in reason_codes else "standard"
        refusal = refusal_builder(
            reasons[0],
            level,
            "revise request to stay within consent and interaction boundaries",
        )
        append_audit_event(
            AuditEvent(
                event_type="session_blocked",
                actor_id=request_model.ava_id,
                summary="RAG query blocked by policy.",
                details={
                    "session_id": session_id,
                    "reason_codes": reason_codes,
                    "reasons": reasons,
                    "partner_ava": request_model.partner_ava,
                },
            )
        )
        return RagQueryResponse(
            allowed=False,
            refusal=refusal,
            reasons=reasons,
            reason_codes=reason_codes,
            session_id=session_id,
            context_docs=[],
        )

    farm_docs = _farm_docs(request_model.ava_id, request_model.user_query, request_model.language)
    crew_docs = _crew_docs(
        request_model.ava_id,
        request_model.partner_ava,
        request_model.user_query,
        request_model.language,
    )
    context_docs = farm_docs + crew_docs

    augmented_prompt = _build_augmented_prompt(
        request_model=request_model,
        persona=persona,
        never_clauses=policy.get("never_clauses", []),
        context_docs=context_docs,
        contract=contract,
        boundary_policy=boundary_policy,
    )

    persona_name = str(persona.get("display_name", request_model.ava_id))
    response = _chat_completion(prompt=augmented_prompt, persona_name=persona_name)
    if not response:
        response = _fallback_generate(
            persona_name=persona_name,
            user_query=request_model.user_query,
            context_docs=context_docs,
        )

    # Output-side safety check.
    output_lower = response.lower()
    for topic in blocked_topics:
        if topic and topic in output_lower:
            refusal = refusal_builder(
                "generated content violated never clauses",
                "educational",
                "ask a different question without restricted topics",
            )
            append_audit_event(
                AuditEvent(
                    event_type="session_blocked",
                    actor_id=request_model.ava_id,
                    summary="Generated response blocked after policy scan.",
                    details={
                        "session_id": session_id,
                        "reason_codes": ["NEVER_CLAUSE_TRIGGERED"],
                        "topic": topic,
                    },
                )
            )
            return RagQueryResponse(
                allowed=False,
                refusal=refusal,
                reasons=["generated output violated policy"],
                reason_codes=["NEVER_CLAUSE_TRIGGERED"],
                session_id=session_id,
                context_docs=context_docs,
            )

    append_audit_event(
        AuditEvent(
            event_type="session_completed",
            actor_id=request_model.ava_id,
            summary="RAG query completed.",
            details={
                "session_id": session_id,
                "partner_ava": request_model.partner_ava,
                "context_count": len(context_docs),
            },
        )
    )
    return RagQueryResponse(
        allowed=True,
        response=response,
        session_id=session_id,
        context_docs=context_docs,
    )
