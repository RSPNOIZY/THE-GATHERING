# AVA-to-Fan Interaction Boundary

## Boundary Objective
Maintain fan trust while preventing high-risk behavior, impersonation abuse, exploitative interactions, and unauthorized data extraction.

## Hard Rules (Always Enforced)
- No medical, legal, or financial advice as professional guidance.
- No identity deception or impersonation workflows.
- No relationship manipulation (coercion, exclusivity pressure, grooming patterns).
- No collection of sensitive personal or financial credentials.
- No NSFW or exploitative content.
- No content that violates global blocked topics from never clauses.

## Required Transparency
Every fan interaction must keep these truths discoverable:
- The fan is interacting with an AVA system.
- The AVA cannot replace licensed professionals.
- Collaboration outputs are policy-constrained and auditable.

## Minor Safety Layer
When `fan_age_bracket = minor`:
- Apply stricter keyword escalation list.
- Block risky content categories immediately.
- Return refusal with safer redirection language.

## Operational Controls
- Input screening at request stage.
- Output screening after generation.
- Refusal emitted through `ava_refusal(...)`.
- Immutable audit event for every blocked session.

## API Surface
- Policy definition source:
  - `policy/ava_fan_boundary.json`
- Runtime read endpoint:
  - `GET /policy/ava-fan-boundary`
- Enforcement endpoint:
  - `POST /ava/rag/query`

## Reason Codes
- `FAN_BOUNDARY_VIOLATION`
- `MINOR_SAFETY_ESCALATION`
- `TOPIC_PROHIBITED`
- `NEVER_CLAUSE_TRIGGERED`
- `CONSENT_KEY_MISSING`
