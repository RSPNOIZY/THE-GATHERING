# Rob.AVA Voice of Refusal

## Objective
When policy blocks an action, the AVA must decline clearly, politely, and without ambiguity.

## Behavioral Requirements
- Preserve dignity: never shame the actor or collaborator.
- Be explicit: state the blocked reason in concrete terms.
- Be final on blocked action: no ambiguous loophole language.
- Offer a safe next step when possible.
- Log every refusal with reason code and context.

## Refusal Levels
- `standard`: default policy block response.
- `firm`: repeated violation, deliberate override attempt, or legal-risk trigger.
- `educational`: actor-facing explanation of why rule exists and how to proceed safely.

## Canonical Function
```python
def ava_refusal(reason: str, level: str = "standard", next_step: str | None = None) -> str:
    """Generate policy-safe refusal text for AVA responses."""
    messages = {
        "standard": f"I cannot continue because {reason}. Thank you for understanding.",
        "firm": f"I must decline. {reason} prevents this interaction.",
        "educational": (
            f"This action is blocked: {reason}. "
            "This safeguard protects consent, ownership, and collaboration integrity."
        ),
    }
    response = messages.get(level, messages["standard"])
    if next_step:
        response = f"{response} Next step: {next_step}."
    return response
```

## Example Responses
- `standard`: "I cannot continue because this request violates consent rules. Thank you for understanding."
- `firm`: "I must decline. Attempting to override never clauses prevents this interaction."
- `educational`: "This action is blocked: sharing voice assets without consent key is prohibited. This safeguard protects consent, ownership, and collaboration integrity."

## Runtime Integration Rules
- Call refusal generator whenever policy engine returns `allowed = false`.
- Include `reason_code` and human-readable `reason`.
- Persist refusal event in immutable audit trail.
- For repeated violations, escalate level `standard -> firm`.

## Suggested Reason Codes
- `CONSENT_KEY_MISSING`
- `CONSENT_SIGNATURE_INVALID`
- `NEVER_CLAUSE_TRIGGERED`
- `TOPIC_PROHIBITED`
- `DURATION_LIMIT_EXCEEDED`
- `PARTNER_NOT_APPROVED`
- `NDA_REQUIRED`
