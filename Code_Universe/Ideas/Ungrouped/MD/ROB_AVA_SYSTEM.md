# ROB.AVA — The Full System
## Fiduciary Voice Agent + Actor Governance Platform

*Captured: 2026-03-13 from /Users/m2ultra/NOIZYLAB/rob_ava/*

---

## What Rob.AVA Is

Rob's AI twin. The fiduciary voice agent. The governance platform for every actor in The 1000 Guild.

Not a chatbot. Not a TTS engine. A consent-enforced, never-clause-locked, cryptographically signed representation system.

- FastAPI: ports 8091/8092
- `/Users/m2ultra/NOIZYLAB/rob_ava/server.py` — running prototype

---

## The Never Clauses (Permanent, Enforceable)

- No exploitation of voice, identity, or likeness
- No extraction without consent and payout
- No deception or impersonation without explicit consent
- No content that violates the cultural consent framework
- No override of the 75/25 perpetual protocol

---

## The Onboarding Ritual (30 Minutes — "Crew Induction")

Language: actors are **Crew**, never "users". They own their AVAs. Their voice is their empire.

**0–2 min:** Welcome + three guarantees (ownership / consent key / immutable audit trail)
**2–5 min:** Identity verification (government ID + selfie liveness + 15-30s baseline voice)
**5–10 min:** Consent key creation (cryptographic keypair, HSM-stored, challenge completed)
**10–20 min:** Core character farm setup — 3 characters:
  - Character A: flagship persona
  - Character B: collaboration persona
  - Character C: experimental persona
**20–25 min:** Never clauses signed (digital signature → immutable audit hash)
**25–30 min:** Crew induction — "You are now RSP-approved Crew." Live dashboard activated.

**Exit criteria:** Identity verified + consent challenge passed + 3 personas created + never clauses signed + dashboard access.

---

## Voice of Refusal

Three refusal levels:
- `standard`: "I cannot continue because {reason}."
- `firm`: "I must decline. {reason} prevents this interaction."
- `educational`: "This action is blocked: {reason}. This safeguard protects consent, ownership, and collaboration integrity."

Key reason codes: `CONSENT_KEY_MISSING` / `CONSENT_SIGNATURE_INVALID` / `NEVER_CLAUSE_TRIGGERED` / `TOPIC_PROHIBITED` / `PARTNER_NOT_APPROVED`

Working Python implementation in `/rob_ava/docs/voice_of_refusal.md`

---

## The Safe Collaboration Mesh

Rob's AVA is version 1. Every Guild actor gets their own AVA under the same governance model.

`1 AVA (Rob) → 100 AVAs (first Guild cohort) → 10,000 AVAs (full Guild + extended network)`

Each AVA: same never clauses, same cryptographic consent, same 75/25 protocol. One governance standard, scaled.

---

## Character Profiles (Rob's Characters)

- **Morrison** — `morrison_character_dna.json`: slow_burn_tension 0.76, sarcasm_defense 0.71, moral_weight 0.84, vulnerability_latency 0.68, controlled_breath 0.73
- **Marcus** — collaboration persona
- **Commander Ash** — experimental/action persona

---

## Connected Systems

- NOIZYVOX vault (every render is consent-signed and fingerprinted)
- Fiduciary Agent (monitors unauthorized use of Rob's voice across platforms)
- Character Families system (the AVA governs public access to each Family)
- The 1000 Guild (Rob.AVA is the governance blueprint for every actor's AVA)
