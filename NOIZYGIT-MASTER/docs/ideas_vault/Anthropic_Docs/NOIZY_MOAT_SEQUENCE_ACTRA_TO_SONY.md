# NOIZY_MOAT_SEQUENCE_ACTRA_TO_SONY.md

## Purpose
This document defines the moat-first sequencing for NOIZY:
1. public proof,
2. union-aligned trust packaging,
3. enterprise pilot,
4. governed market expansion.

The goal is to make NOIZY harder to dismiss, harder to copy, and easier to trust.

---

## Core Thesis
NOIZY should not lead with "AI music."

NOIZY should lead with:
- consent,
- control,
- compensation,
- provenance,
- auditability,
- revocability.

That sequencing matches the way current performer-union and provenance standards are evolving. ACTRA's 2025–2027 Independent Production Agreement includes detailed provisions for engagement-based digital replicas, including performer consent for certain new photography or soundtracks not previously recorded, and requires consent to include a reasonably specific description of intended use. SAG-AFTRA's 2025 Commercials Contracts materials likewise emphasize informed consent and compensation guardrails for AI-related digital replica use. C2PA provides the technical provenance primitive for signed claims and manifest-based validation.

---

## The Recommended Sequence

### Phase 1 — Public Proof
**Priority:** Immediate
**Primary surface:** `chaos.noizy.ai/verify`

### Goal
Demonstrate that NOIZY can verify:
- provenance claims,
- receipt replay,
- policy status,
- and trust evidence

without asking the market to "just believe."

### Why this comes first
C2PA is specifically designed to support content provenance through manifests, claim signatures, and validation workflows. Its implementation guidance and specification make it suitable as a public-facing provenance primitive, but not as a complete business-governance system by itself. That makes it the right first-layer proof surface for NOIZY.

### Required outputs
- C2PA/content credential validation
- signed receipt replay
- audit replay summary
- policy check summary
- public challenge / verifier language

### Correct framing
Cloudflare and C2PA provide primitives.
NOIZY provides the higher-order proof interpretation, policy logic, and replay semantics.

Do not claim:
- that C2PA alone proves institutional governance
- that Cloudflare alone proves NOIZY's policy semantics

---

## Phase 2 — ACTRA Trust Package
**Priority:** First enterprise-facing trust move
**Target:** ACTRA / union-aligned digital-replica governance conversation

### Goal
Translate NOIZY's trust layer into union language:
- explicit consent
- scope of use
- compensation
- revocation
- auditability
- operator controls

### Why ACTRA first
ACTRA's 2025–2027 IPA digital-replica provisions are unusually aligned with the NOIZYVOX value proposition. The agreement text explicitly addresses consent for certain engagement-based digital replica uses and requires specific intended-use descriptions in consent flows. That makes ACTRA a better first trust audience than a label if the product claim is "voice rights turned into operational law."

### Package contents
- trust architecture overview
- consent-state model
- revocation behavior
- compensation logic
- replayable receipt model
- proof export / regulator-facing bundle example
- boundary between platform primitives and NOIZY governance logic

### Positioning line
**NOIZYVOX does not just store consent. It makes digital-replica authority visible, auditable, and revocable.**

---

## Phase 3 — Sony / Label Pilot
**Priority:** After ACTRA trust framing is sharpened
**Target:** narrow, controlled label pilot

### Goal
Take the trust layer into a commercial music-rights environment with a constrained pilot.

### Why Sony second
A label pilot becomes easier if NOIZY can already show:
- public proof,
- union-aligned governance language,
- replayable auditability,
- and a provenance stack that is technically grounded.

Without that, the pitch risks sounding like another AI-content platform. With it, the pitch becomes governed infrastructure for rights-sensitive media workflows. C2PA's provenance standards and SAG-AFTRA/ACTRA's consent-and-compensation direction make this sequencing more credible.

### Pilot shape
Keep it narrow:
- one catalog class or content class
- one provenance workflow
- one operator console
- one rights scope
- one verification bundle
- one approval/revocation path

### Pilot outputs
- provenance verified
- consent state visible
- replayable audit history
- limited operator surface
- regulator/export bundle

---

## Phase 4 — Voice Market
**Priority:** Only after trust and enterprise proof are credible

### Goal
Monetize governed voice usage only after:
- proof surface exists,
- union/rights language is credible,
- and enterprise-grade control is demonstrated.

### Why this comes after Phase 2 and 3
A voice market without governance looks extractive.
A voice market after consent, compensation, provenance, and revocation are demonstrated looks defensible.

ElevenLabs' public payouts page shows a creator marketplace benchmark with automated payouts and example economics such as a base payout rate of $0.03 per 1,000 characters in its public voice-library context. That is useful as a market reference point, but it is not itself proof of NOIZY economics. NOIZY pricing should be framed as NOIZY's own proposed creator-first model.

### Correct market framing
Use:
- proposed NOIZYVOX economics
- revocable permissions
- visible payout logic
- replayable audit trail
- proof-bundle exports

Do not use:
- unsupported claims that the market is already proven at NOIZY scale
- broad claims that benchmark economics equal NOIZY's actual realized economics

---

## Public Proof → ACTRA → Sony → Voice Market

This is the moat sequence:

### 1. Public Proof
Prove the technical and procedural trust surface is real.

### 2. ACTRA
Prove the governance model fits real performer-rights language.

### 3. Sony
Prove the trust layer can operate inside a commercial rights environment.

### 4. Voice Market
Only then convert governance into scalable monetization.

---

## Why This Sequence Is Stronger Than Going Straight to Sony
If NOIZY goes straight to a label with only:
- AI generation,
- search,
- cloning,
- or archive intelligence,

the conversation becomes crowded and skeptical.

If NOIZY arrives with:
- public provenance verification,
- replayable receipts,
- consent framing aligned to union language,
- revocation behavior,
- auditability,
- and external verification bundles,

the conversation moves from "tool vendor" to "governance infrastructure."

That is a much harder category to copy.

---

## Infrastructure Framing

### Native primitives
Use the platform honestly:
- Cloudflare Workers
- D1
- KV
- bindings
- controlled deployment/versioning
- C2PA provenance primitives

### NOIZY higher-order layer
NOIZY adds:
- consent interpretation
- compensation logic
- revocation semantics
- replayable receipt logic
- proof packaging
- institutional governance law

### Boundary law
**Cloudflare and C2PA provide primitives.
NOIZY provides meaning, proof interpretation, and governance.**

---

## Messaging Rules

### Keep
- consent
- control
- compensation
- provenance
- revocability
- replayability
- auditability

### Avoid
- "magic AI"
- unsupported ARR certainty
- unsupported latency certainty
- overclaiming what platform primitives do by themselves

---

## Corrected Commercial Language

### Safer wording for Voice Market
Instead of:
- "Voice Market 92% creator" as a public fact

Use:
- **"Proposed NOIZYVOX creator-first economics with revocable permissions and auditable payouts."**

### Safer wording for growth
Instead of:
- "47M ARR floor → 180M ceiling" as current fact

Use:
- **"Long-range revenue model under validation."**

### Safer wording for challenge metrics
Instead of:
- hard public counts unless you are publishing methodology

Use:
- **"Current Chaos Arena verification metrics available on request or in public dashboard form."**

---

## Recommended Immediate Deliverables

### Deliverable A — Chaos Arena verifier
- provenance validator
- replayable receipt view
- policy status view
- challenge page

**Status**: Built (`src/chaos-arena/index.js`, `public/chaos-arena/index.html`)

### Deliverable B — ACTRA trust deck
- digital replica governance mapping
- consent flow
- revocation flow
- compensation model
- proof export

**Status**: Built (`docs/ACTRA_TRUST_PACKAGE.md`)

### Deliverable C — Sony pilot spec
- limited-scope pilot
- approved asset class
- operator workflow
- proof package
- success criteria

**Status**: Outlined in Nashville playbook

### Deliverable D — Voice Market gating memo
- what must be true before launch
- proof surfaces required
- union/enterprise preconditions
- economic disclosure model

**Status**: Built (`src/voice-market/index.js`)

---

## Final Positioning
**NOIZY should lead with governance, not novelty.**

Public proof creates trust.
ACTRA creates legitimacy.
Sony creates enterprise credibility.
Voice Market creates scale.

That is the moat.

---

## Canonical Law
> **If a system can decide, it must remember.
> If it remembers, it must prove.
> If it proves, others must be able to verify.**

This sequence turns that law into go-to-market order.

---

## Status Summary

| Deliverable | Status | Location |
|-------------|--------|----------|
| Chaos Arena verifier | Built | `src/chaos-arena/index.js` |
| Chaos Arena UI | Built | `public/chaos-arena/index.html` |
| Chaos Arena schema | Built | `migrations/0007_chaos_arena.sql` |
| ACTRA Trust Package | Built | `docs/ACTRA_TRUST_PACKAGE.md` |
| Voice Market API | Built | `src/voice-market/index.js` |
| Voice Market schema | Built | `migrations/0008_voice_market.sql` |
| Trust Engine v1.1 | Built | `src/trust-engine/` |
| Nashville Playbook | Built | `docs/NASHVILLE_EXPANSION_PLAYBOOK.md` |
| Partner Brief | Built | `docs/TRUST_ENGINE_PARTNER_BRIEF_v1.1.md` |
| Project Instructions | Built | `docs/NOIZY_PROJECT_INSTRUCTIONS_FINAL.md` |

---

*Locked: 2026-04-07*
*Authority: Robert Stephen Plowman (RSP_001)*
