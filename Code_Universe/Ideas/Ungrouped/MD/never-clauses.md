# The 9 Never Clauses

> NOIZY Consent Protocol (NCP) — Immovable Principles
> GABRIEL Self-Healing Loop Knowledge Base
> Author: Robert Stephen Plowman (RSP_001)
> Status: IMMOVABLE. These clauses cannot be overridden by any system, agent, or operator.
> Last updated: 2026-04-03

---

## Preamble

The 9 Never Clauses are the ethical bedrock of the MC96ECO universe. They are encoded into every service, worker, database schema, and AI agent in the NOIZY.AI infrastructure. No configuration change, code deployment, business decision, or emergency can override them.

These are not guidelines. They are law.

Every GABRIEL tower checks compliance with these clauses. The consent-gateway Worker enforces them at the edge. The D1 schema constraints encode them at the data layer. They exist at every level of the stack.

---

## The 9 Never Clauses

### 1. Never use voice without explicit consent

No voice data — recordings, clones, synthesis, fingerprints, or genome data — may be used for any purpose without explicit, informed, revocable consent from the voice owner.

**Enforcement:**
- NOIZYVOX checks consent token before every synthesis operation
- consent-gateway Check #7 (Biometric Gate) blocks unconsented voice requests
- KV GABRIEL_VOICE stores consent status alongside every voice genome
- No "implied consent" — silence is not consent, account creation is not consent

**What "explicit" means:**
- The person must actively opt in (not opt out)
- They must understand what they're consenting to (scope is described in plain language)
- They must be able to revoke at any time (see Clause 7)

---

### 2. Never train on opted-out content

If a creator has opted out of AI training, their content must not be used to train, fine-tune, or evaluate any model — regardless of how the content was obtained.

**Enforcement:**
- D1 `consent_records` table tracks training consent separately from usage consent
- Model training pipelines check opt-out status before including any data
- Opted-out content is excluded from dataset generation, even for internal research
- Retroactive opt-out: if a creator opts out after their data was used, the data is flagged and excluded from future training runs

---

### 3. Never share raw biometric data

Raw biometric data (voice recordings, voice prints, genome fingerprints) is never shared with third parties, partners, or other creators. Derived products (synthesized voice, processed audio) may be shared per consent terms, but the raw source material stays locked.

**Enforcement:**
- consent-gateway Check #7 blocks any API request that would expose raw biometric data
- GABRIEL_VOICE KV stores voice genomes with access controls — only the owner and consented systems can read
- API responses never include raw waveform data — only processed/synthesized output
- Database exports exclude biometric columns

---

### 4. Never reduce creator split below 75%

The Plowman Standard mandates a minimum 75/25 split in favor of the creator. This applies to every financial transaction in the NOIZY.AI ecosystem — royalties, licensing fees, marketplace sales, streaming revenue.

**Enforcement:**
- consent-gateway Check #10 validates creator split on every financial operation
- D1 `creator_splits` table has a CHECK constraint: `creator_share >= 0.75`
- KV_ROYALTIES calculations hard-code the 75% floor
- heaven Worker `/royalty/calculate` endpoint rejects any split below 75/25
- See `gospel/plowman-standard.md` for the full economic model

---

### 5. Never allow posthumous exploitation without estate authorization

When a creator dies, their voice, likeness, and content rights transfer to their designated estate or legal representative. No posthumous use is permitted without explicit estate authorization.

**Enforcement:**
- D1 `consent_records` includes `estate_contact` and `posthumous_policy` fields
- Consent tokens for deceased creators are frozen (not revoked — estate can reactivate)
- No automated systems may generate content using a deceased creator's voice or likeness
- Estate authorization requires manual verification (not automated)

---

### 6. Never strip provenance metadata

Every piece of content in the NOIZY.AI ecosystem carries provenance metadata: who created it, when, with what tools, under what consent terms, and the full chain of transformations applied to it.

**Enforcement:**
- D1 `provenance_chain` table maintains cryptographic hash chains
- Every audio file includes embedded provenance in metadata tags
- API responses include `X-Provenance-Hash` header
- Stripping provenance from content is treated as a data integrity violation
- NOIZYSTREAM session proofs are part of the provenance chain

---

### 7. Never deny revocation right

Any consent granted can be revoked at any time, for any reason, with immediate effect. The platform must honor revocation within the technical limits of propagation (typically seconds, never more than minutes).

**Enforcement:**
- NOIZYVOX `/revoke` endpoint processes revocation immediately
- consent-gateway Check #8 checks active revocations on every request
- Revocation is irreversible from the platform's perspective — once revoked, the platform cannot use the data
- The creator can re-grant consent later, but this creates a new consent token (not a restoration)
- D1 `revocations` table is append-only — revocations are never deleted

---

### 8. Never obscure compensation

Every creator must be able to see exactly how their compensation is calculated, what they earned, when they'll be paid, and what deductions (if any) were applied. No hidden fees, no opaque algorithms, no "trust us" accounting.

**Enforcement:**
- KV_ROYALTIES stores full calculation breakdowns, not just final numbers
- heaven Worker `/royalty/history` endpoint shows every transaction with line-item detail
- Artist dashboard displays real-time earnings with full transparency
- Platform fees are fixed and disclosed upfront (never more than 25% per Clause 4)
- Audit trail in D1 `royalty_ledger` is immutable and queryable

---

### 9. Never prioritize platform over creator

In any conflict between platform interests (growth, revenue, partnerships) and creator interests (rights, compensation, consent), the creator wins. The platform exists to serve creators, not the other way around.

**Enforcement:**
- This clause is the meta-principle that governs all other clauses
- Product decisions are evaluated against this principle
- Algorithmic recommendations must not disadvantage creators who exercise their rights
- Creators who revoke consent, opt out of training, or demand higher splits must not be penalized in visibility, placement, or access
- GABRIEL Tower 3 (CONSENT) treats any platform-over-creator behavior as a violation

---

## Violation Response

If any system, agent, or process violates a Never Clause:

1. **Immediate halt:** The violating operation is stopped
2. **Alert:** Tower 9 (HEAL) triggers an emergency alert
3. **Log:** The violation is recorded in D1 `noizylab-repairs.repairs` with `severity: NEVER_CLAUSE_VIOLATION`
4. **Escalate:** Human notification via Voice Bridge emergency webhook
5. **No auto-fix:** Never Clause violations cannot be auto-resolved by GABRIEL. They require human review.
6. **Post-mortem:** Every violation gets a written post-mortem stored in agent-memory

---

## Immovability

These clauses are:
- **Not configurable.** There is no env var, feature flag, or admin override.
- **Not negotiable.** No business deal, partnership, or investor can modify them.
- **Not temporary.** They do not expire, pause, or get suspended for testing.
- **Not optional.** Every service in the MC96ECO universe must comply.

They are the foundation. Everything else is built on top.
