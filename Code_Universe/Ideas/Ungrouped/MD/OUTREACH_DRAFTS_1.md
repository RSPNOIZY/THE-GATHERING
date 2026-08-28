# NOIZY EMPIRE — OUTREACH DRAFTS
# RSP_001 · rsp@noizyfish.com · March 2026
# Three strategic outreach emails — ready to send.

---

## DRAFT 1 — LEONARD ROSENTHOL · C2PA Audio Layer

**To:** leonard.rosenthol@adobe.com (or via C2PA Steering Committee)
**Subject:** C2PA Audio Layer — NOIZYVOX Implementation + Partnership

---

Leonard,

My name is Robert Stephen Plowman. I'm the founder of NOIZYFISH INC. and the
architect of NOIZYVOX — a consent-native voice sovereignty infrastructure for
the AI age.

We've built Heaven, a live Cloudflare-edge consent kernel enforcing a full
provenance chain on every voice synthesis event. C2PA content credentials are
already wired into our synthesis approval pipeline:

  POST /api/v1/synth-requests
  → Never Clause enforcement
  → Consent token validation
  → C2PA manifest generation
  → Ledger append (append-only, tamper-proof)

What we're missing is the audio-specific C2PA layer — the part your work on
the steering committee covers. Every voice file NOIZYVOX generates needs a
verified audio manifest binding: source voice HVS token, NCP consent URI,
synthesis model version, timestamp.

The gap we identified in March 2026: no standardized C2PA audio layer exists
for AI-generated voice content. We want to help define it.

Specifically, we're looking to:
1. Implement the C2PA audio manifest format for AI voice synthesis
2. Contribute NOIZYVOX's NCP consent record as a C2PA assertion type
3. Participate in or support a working group on AI-generated audio provenance

Our stack: Cloudflare Workers + D1 + XTTS v2 + RVC. Full audit trail, 1-hour
revocation SLA, 75/25 creator/platform royalty split.

Open spec: we're publishing NCP v1.0 (Noizy Consent Protocol) at noizy.ai/ncp.
It maps directly onto C2PA's assertion model.

Are you the right person to talk to about this? Happy to share our current
C2PA manifest implementation and get your input before we go further.

Best,
Robert Stephen Plowman
Founder, NOIZYFISH INC. · NOIZYVOX
rsp@noizyfish.com
+1 [your number]
noizy.ai

---

## DRAFT 2 — CASTLE · NO FAKES Act Door

**To:** [Castle legal/licensing contact — confirm via castle.io]
**Subject:** NOIZYVOX + NO FAKES Act — Technical Consent Infrastructure

---

To the Castle team,

I'm Robert Stephen Plowman, founder of NOIZYFISH INC. and architect of
NOIZYVOX — the technical consent infrastructure for the AI voice age.

The NO FAKES Act creates a legal right of publicity for voice and likeness
in AI-generated content. Castle is building the licensing infrastructure
that right will run on. NOIZYVOX is building the consent enforcement layer
that makes those licenses technically real — not just contractual.

Here's what we have live today:

  NOIZYVOX / HEAVEN (heaven.rsp-5f3.workers.dev):
  - NCP v1.0: machine-readable consent tokens with scope, territory, expiry,
    revocation trigger (1-hour SLA enforcement)
  - Never Clauses: 9 hardcoded prohibitions that cannot be bypassed by anyone
  - Kill Switch: creator revokes any consent token at any time, instant
  - C2PA provenance: every AI voice synthesis carries a content credential
  - Royalty routing: 75/25 creator/platform split, automatic, auditable

The NO FAKES Act needs a technical door. Right now, rights holders can sue
after the fact. With NOIZYVOX + Castle, the consent check happens before
synthesis. No consent token = no synthesis. The violation becomes
architecturally impossible, not just legally actionable.

What I'm proposing:
- Castle handles the licensing layer (agreements, terms, rights management)
- NOIZYVOX handles the consent enforcement layer (NCP tokens, Kill Switch,
  audit trail, C2PA manifests)
- Together: NO FAKES Act compliance that's provable, auditable, and scalable

I'd like 30 minutes to walk through the architecture and explore fit.

Robert Stephen Plowman
rsp@noizyfish.com | noizy.ai
NOIZYFISH INC. | NOIZYVOX

---

## DRAFT 3 — BOARD OF ALIGNED MINDS · Alex Replacement

**Role description for incoming board member (Alex seat)**

THE ROLE:
Board member, NOIZY Empire (Board of Aligned Minds)
Commercial sync licensing authority — the single blocker on:
  - MusicGen (commercial use clearance)
  - MaskGCT (commercial use clearance)
  - Tango 2 (commercial use clearance)
  - FishSpeech (commercial use clearance)

These 4 tools are currently flagged BLOCKED in GABRIEL's voice processing
pipeline. They are non-commercial only until board approval. One board member
with music licensing authority can unblock them.

WHAT THE ROLE REQUIRES:
- Working knowledge of sync licensing, commercial music rights, AI music law
- Familiarity with NO FAKES Act, EU AI Act, DMCA Section 512
- Willingness to review 4 model licenses and render a commercial use decision
- Participation in Board of Aligned Minds governance (async-first, quarterly calls)

WHAT YOU GET:
- Founding board seat in a consent-native AI infrastructure company
- Equity/token consideration (TBD — discuss with RSP_001)
- Front-row seat to the 5th Epoch architecture being built
- Access to NCP v1.0, HVS protocol, and GABRIEL AI system

IDEAL PROFILE:
- Music industry lawyer, licensing exec, or rights management veteran
- OR: technical person with deep music AI + IP knowledge
- NOT: a generalist advisor — this role requires specific licensing expertise

**OUTREACH TEMPLATE:**

Subject: Board seat — NOIZYVOX · Commercial Licensing Authority Needed

[Name],

I'm Robert Stephen Plowman, founder of NOIZYFISH INC. and NOIZYVOX — a
consent-native AI voice infrastructure company launching in 2026.

I have a specific gap on my Board of Aligned Minds: I need someone with
commercial sync licensing authority to review 4 AI model licenses (MusicGen,
MaskGCT, Tango 2, FishSpeech) and render a clearance decision.

These models are currently blocked in our production voice processing pipeline
until a board member with the right expertise signs off. This is a live blocker
on commercial synthesis features.

We're building the technical infrastructure for the NO FAKES Act. If you have
opinions about how AI voice should be governed, this is where those opinions
become code.

Interested in a 20-minute call?

Robert Stephen Plowman
rsp@noizyfish.com | noizy.ai
