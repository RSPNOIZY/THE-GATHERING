"""Rob.AVA policy-first RAG pipeline pseudocode.

This file is intentionally pseudocode-style to document flow, not production runtime.
"""


def rag_pipeline(user_query: str, ava_id: str, session_id: str, partner_ava: str | None = None):
    """
    1) Preflight policy and consent checks
    2) Retrieve from AVA Farm and approved collaboration memory
    3) Augment with persona, legal, and contract constraints
    4) Generate candidate output
    5) Enforce never clauses and collaboration contract
    6) Return response or policy refusal
    """

    # ---------------------------------------------------------
    # 1. Preflight governance checks
    # ---------------------------------------------------------
    contract = load_active_contract(ava_id=ava_id, partner_ava=partner_ava)
    consent_state = verify_consent_key(ava_id=ava_id, session_id=session_id)

    if not consent_state.valid:
        refusal = ava_refusal(
            reason="consent signature is missing or invalid",
            level="firm",
            next_step="sign request with your consent key",
        )
        log_audit_event(session_id, "session_blocked", refusal, reason_code="CONSENT_SIGNATURE_INVALID")
        return refusal

    if contract and not contract_is_active(contract):
        refusal = ava_refusal(
            reason="no active collaboration contract is available",
            level="standard",
            next_step="activate or renew collaboration contract",
        )
        log_audit_event(session_id, "session_blocked", refusal, reason_code="CONTRACT_INACTIVE")
        return refusal

    # ---------------------------------------------------------
    # 2. Retrieve trusted context
    # ---------------------------------------------------------
    farm_docs = retrieve_from_farm(ava_id=ava_id, query=user_query, top_k=8)
    policy_docs = retrieve_policy_context(ava_id=ava_id)

    crew_docs = []
    if contract:
        crew_docs = retrieve_from_approved_partners(
            ava_id=ava_id,
            partner_ava=partner_ava,
            query=user_query,
            allowed_languages=contract["allowed_languages"],
            top_k=6,
        )

    # ---------------------------------------------------------
    # 3. Augment query with persona + legal constraints
    # ---------------------------------------------------------
    persona_context = load_persona_profile(ava_id)
    never_clauses = load_never_clauses(ava_id)
    prohibited_topics = build_prohibited_topic_set(contract, never_clauses)

    augmented_prompt = build_augmented_prompt(
        user_query=user_query,
        persona_context=persona_context,
        retrieved_docs=farm_docs + crew_docs + policy_docs,
        never_clauses=never_clauses,
        prohibited_topics=sorted(prohibited_topics),
        consent_required=True,
        output_style="character-faithful, safety-constrained",
    )

    # ---------------------------------------------------------
    # 4. Generate candidate response
    # ---------------------------------------------------------
    candidate = llm_generate(
        prompt=augmented_prompt,
        persona_id=ava_id,
        temperature=0.4,
        max_tokens=450,
    )

    # ---------------------------------------------------------
    # 5. Enforce policies on the candidate
    # ---------------------------------------------------------
    violations = []

    if output_mentions_prohibited_topics(candidate, prohibited_topics):
        violations.append("prohibited topic detected")

    if violates_never_clauses(candidate, never_clauses):
        violations.append("never clause violation")

    if contract and not output_respects_contract(candidate, contract):
        violations.append("collaboration contract mismatch")

    if violations:
        refusal = ava_refusal(
            reason="; ".join(violations),
            level="educational",
            next_step="revise request within contract and consent boundaries",
        )
        log_audit_event(
            session_id,
            "session_blocked",
            refusal,
            reason_code="NEVER_CLAUSE_TRIGGERED",
            details={"violations": violations},
        )
        return refusal

    # ---------------------------------------------------------
    # 6. Log successful generation and return
    # ---------------------------------------------------------
    log_generation(
        session_id=session_id,
        ava_id=ava_id,
        partner_ava=partner_ava,
        query=user_query,
        response=candidate,
        retrieved_doc_count=len(farm_docs) + len(crew_docs) + len(policy_docs),
    )
    return candidate


# ---------------------------
# Refusal helper pseudocode
# ---------------------------
def ava_refusal(reason: str, level: str = "standard", next_step: str | None = None) -> str:
    messages = {
        "standard": f"I cannot continue because {reason}. Thank you for understanding.",
        "firm": f"I must decline. {reason} prevents this interaction.",
        "educational": (
            f"This action is blocked: {reason}. "
            "This safeguard protects consent, ownership, and collaboration integrity."
        ),
    }
    text = messages.get(level, messages["standard"])
    if next_step:
        text = f"{text} Next step: {next_step}."
    return text
