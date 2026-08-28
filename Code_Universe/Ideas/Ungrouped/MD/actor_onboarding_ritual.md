# Rob.AVA Actor Onboarding Ritual (First 30 Minutes)

## Goals
- Establish trust immediately.
- Prove ownership and consent controls before creation starts.
- Produce three usable AVA seeds in a single session.
- End with clear momentum (next session, first collaboration, first publish path).

## Experience Principles
- Language frame: actor is "Crew", never "user".
- Ownership frame: "You own your AVAs and voice rights."
- Consent frame: "No render occurs without a valid consent key."
- Governance frame: "Never clauses are permanent and enforceable."

## Minute-by-Minute Flow

### 0:00-2:00 Welcome and Framing
- Show personalized greeting using legal/display name.
- Play short intro motion with line: "Your voice is your empire."
- Present three guarantees:
  1. Ownership remains with the actor.
  2. Consent key gates every protected action.
  3. Audit trail is immutable.
- Capture explicit acknowledgment checkbox: `I understand my ownership and consent rights.`

### 2:00-5:00 Identity and Authenticity Verification
- Capture government ID + selfie liveness.
- Capture baseline voice sample (15-30 seconds) for biometric matching.
- Generate temporary `persona_id` and verification state.
- Run duplicate checks against existing owned personas.
- Result states:
  - `verified`: continue.
  - `needs_review`: move to manual queue and stop advanced setup.
  - `rejected`: show support escalation path.

### 5:00-10:00 Consent Key Creation
- Generate actor-scoped cryptographic consent key pair.
- Store private key in actor vault (HSM or equivalent secure enclave).
- Actor completes key challenge:
  - request preview render,
  - sign operation with consent key,
  - confirm preview runs only when signature is valid.
- Show event log entry proving signed consent check.

### 10:00-20:00 Core Farm Setup
- Create first three characters:
  - Character A: flagship persona,
  - Character B: collaboration persona,
  - Character C: experimental persona.
- For each character collect:
  - tone range,
  - emotional range,
  - pacing defaults,
  - language availability (`1-3` launch languages).
- Optional LLM trait capture:
  - `archetype`,
  - `communication style`,
  - `persona boundaries`.
- Run instant synthesis preview per character.

### 20:00-25:00 Never Clauses Acknowledgment
- Present mandatory never clauses in plain language and legal form.
- Require digital signature.
- Persist signed artifact hash to immutable audit store.
- Confirm policy engine status: `enforcement = active`.

### 25:00-30:00 Crew Induction and Activation
- Play short induction clip: "You are now RSP-approved Crew."
- Open live dashboard with:
  - Farm status,
  - AVA readiness,
  - consent key health,
  - policy status.
- Offer immediate next actions:
  1. Schedule first collaboration.
  2. Publish internal test interaction.
  3. Launch guided "grow your empire" tutorial.

## Exit Criteria (Onboarding Success)
- Identity state is `verified`.
- Consent key challenge passed.
- Three starter personas created.
- Never clauses signed and activated.
- Actor can access dashboard and trigger first safe session.

## Key Metrics
- Time to first verified AVA (`TTVA`).
- Consent challenge pass rate.
- Never-clause comprehension pass (short quiz).
- First collaboration scheduled within 24h.
- 7-day activation retention.
