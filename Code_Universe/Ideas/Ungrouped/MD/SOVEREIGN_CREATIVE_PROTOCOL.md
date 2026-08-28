# THE SOVEREIGN CREATIVE PROTOCOL

## The rights, legal, and technical architecture of NOIZY.AI

---

## WHAT THIS IS

The Sovereign Creative Protocol (SCP) is the umbrella architecture that holds
every rights, consent, attribution, and monetization system NOIZY is building.

It is not a manifesto. It is infrastructure.

It answers one question across every product, every partner, every platform:

**Can you prove this creative work belongs to the person who made it,
and can that person earn from it permanently?**

If the answer is yes, you are operating inside the SCP.
If the answer is no, you are not a NOIZY partner.

---

## THE THREE LAYERS

### Layer 1 — Provenance

Every creative work that enters the NOIZY ecosystem receives a provenance record
at the moment of creation. This record is immutable.

Components:

- **SHA-256 fingerprint** — cryptographic identity of the work, generated on entry
- **C2PA Content Credentials** — industry-standard provenance manifest (Adobe, Microsoft,
  BBC, AP, New York Times, Anthropic all participate). Carries: creator identity,
  creation timestamp, tool chain used, consent status.
- **NOIZYVOX Consent Key** — creator-signed, cryptographically bound, vault-stored.
  Gates every downstream use of the work.
- **Human Voice Signature (HVS)** — see Section 3 below.

Together these four components form the **NOIZY Provenance Stack** — a single,
verifiable, legally defensible record of authorship, consent, and origin.

### Layer 2 — Consent-as-Code

Consent in the NOIZY system is not a policy document. It is a technical constraint.

```text
CREATIVE WORK ENTERS NOIZY ECOSYSTEM
           ↓
  Creator defines context rules (permitted / blocked)
           ↓
  Rules encoded in NOIZYVOX vault alongside consent key
           ↓
  Every downstream use request is validated against these rules
  BEFORE output exists — not after misuse
           ↓
  Blocked context = hard wall, no bypass path
  Permitted context = consent key issued, use proceeds
           ↓
  Royalty event fired. Ledger updated. 75/25 allocated.
```

This is the Consent-as-Code model. The creator's "no" is not a preference.
It is a technical fact enforced at generation time.

### Layer 3 — Perpetual Revenue

75/25 after 30 days. Permanent. Non-renegotiable.

The revenue architecture that runs on top of the provenance and consent layers:

- Per-trigger royalties (games, streaming, API calls)
- License fees (project-level, per-use)
- Derivative micro-splits (LifeLUV recursive attribution)
- Regional variant splits (VSI partnership, AAA character system)
- Generational transfer (the creator's estate inherits the revenue stream)

---

## THE HUMAN VOICE SIGNATURE (HVS)

The HVS is the flagship product of the Sovereign Creative Protocol.
It is a certification mark — a verifiable, studio-facing signal that a voice is:

1. Human-performed
2. Consent-locked
3. Commercially cleared
4. Legally defensible
5. Earning at 75/25 permanently

### Why This Matters Now

As AI-generated synthetic voice floods every market — games, film, advertising,
audiobooks, apps — the cost of legal exposure from unlicensed synthetic voice is rising.
Studios and publishers need a reliable signal that the voice they are licensing
is cleared, attributed, and will not generate a rights claim after delivery.

The HVS is that signal.

It is not a moral position. It is a commercial advantage for every party:

| Party | Benefit |
| --- | --- |
| Creator | Attribution enforced, earnings perpetual, identity protected |
| Studio / Buyer | Commercially cleared, legally defensible, reduced liability |
| Platform | Trust signal, premium tier, differentiator from synthetic |
| Listener | Transparency about what they are hearing |

### What the HVS Certificate Contains

```text
HUMAN VOICE SIGNATURE — HVS_RSP_001_EN_UK

  Creator:        Robert Stephen Plowman
  Guild ID:       RSP_001
  SHA-256:        a7f4e1c2d9b3...8f6a2e4c1b9d
  C2PA Manifest:  [GUID] — verified content credentials
  Consent Key:    NVX-KEY-RSP001-2026-0313-... [vault-stored]
  Issued:         2026-03-13
  Rate:           75/25 — active from 2026-04-12 (Day 31)
  Status:         HVS CERTIFIED — ACTIVE

  Permitted Contexts:
    Narration · Drama · Documentary · Calm Stack · Games · Audio Drama
  Blocked Contexts:
    Political · Military · Adult Content · Deception

  Verified by:    NOIZYVOX Protocol v1.0
                  SHA-256 fingerprint match: CONFIRMED
                  Consent key validation: PASSED
                  C2PA manifest integrity: VERIFIED
```

### The HVS Market Position

As synthetic voice commoditizes at zero marginal cost, human-performed,
HVS-certified voice becomes the premium tier by definition.

The market will bifurcate:

```text
SYNTHETIC VOICE (free / near-free)
  → Unlimited supply
  → No attribution
  → No legal defensibility
  → No creative depth
  → Used for everything that doesn't matter

HVS-CERTIFIED HUMAN VOICE (premium, consent-locked, traceable)
  → Finite supply (Guild capacity: 1000)
  → Full attribution
  → Legally cleared
  → Creative depth guaranteed by DNA spec
  → Used for everything that does
```

NOIZY is building the supply of the premium tier before the market fully understands
that it needs it.

---

## THE SOVEREIGN CREATIVE PROTOCOL — FULL COMPONENT MAP

```text
SOVEREIGN CREATIVE PROTOCOL
│
├── PROVENANCE LAYER
│   ├── SHA-256 Fingerprinting (on entry)
│   ├── C2PA Content Credentials (industry standard)
│   ├── NOIZYVOX Consent Key (creator-signed, vault-stored)
│   └── Human Voice Signature (HVS) — the certification mark
│
├── CONSENT LAYER
│   ├── Context Rules Engine (permitted / blocked / custom)
│   ├── Hard-wall enforcement (no bypass path)
│   ├── Seven Never Clauses (Guild Constitution)
│   └── Generational Transfer Rules (estate planning built-in)
│
├── REVENUE LAYER
│   ├── 75/25 Universal Standard (all creators, after 30 days, permanent)
│   ├── Immutable Royalty Ledger (append-only, non-deletable)
│   ├── LifeLUV Recursive Micro-Splits (derivatives earn back to origin)
│   ├── VSI Regional Variant Splits (per performer, per locale)
│   └── Legacy Vault Funding (work generates capital for its own maintenance)
│
├── ARCHIVE LAYER
│   ├── NOIZYFISH Aquarium (34TB — 40 years of sonic DNA)
│   ├── Arweave Permanent Storage (paid-once, forever — no server dependency)
│   ├── IPFS Distributed Addressing (content-addressed, not location-addressed)
│   └── SHA-256 integrity verification at every archive node
│
├── PROTECTION LAYER
│   ├── Audio Watermarking (Meta AudioSeal / Adobe approach — survives re-encoding)
│   ├── C2PA provenance chain (detects tampering, flags unsigned derivatives)
│   ├── DMCA automation pipeline (evidence generation for takedowns)
│   └── IP monitoring (web crawl, derivative detection, unauthorized use alerts)
│
├── DELIVERY LAYER
│   ├── FMOD / Wwise voice banks (games)
│   ├── NOIZYVOX API (streaming, apps, platforms)
│   ├── HVS Validator (studio-facing verification tool)
│   └── Strata / Unity Asset Store / Unreal Fab (marketplace distribution)
│
└── GOVERNANCE LAYER
    ├── Artist Bill of Rights (see below)
    ├── Guild Constitution (Seven Never Clauses)
    ├── Community Advisory Circles (Caregiver, Artist, Clinician)
    └── Decisions Log (versioned, public, explaining every major change)
```

---

## THE ARTIST BILL OF RIGHTS

These are not aspirational principles. They are the technical and legal commitments
encoded into every layer of the SCP.

**I. The right to attribution in perpetuity.**
Every use of your work carries your name. Invisible use is system failure.

**II. The right to context control.**
You define where your work is permitted and where it is blocked.
These rules are enforced technically, not by policy.

**III. The right to earnings without platform dependency.**
Your 75% is calculated and logged at the moment of each use.
No platform can delay, redirect, or withhold it.

**IV. The right to refusal without explanation.**
Your "no" is a technical constraint. You do not owe anyone a reason for it.

**V. The right to an immutable record.**
Your royalty history cannot be altered or deleted. The ledger is permanent.

**VI. The right to generational transfer.**
Your creative work is a life asset. It can be inherited, gifted, and protected
beyond your lifetime under terms you define.

**VII. The right to know how your work is used.**
Every use event generates a logged record. You have access to all of it, always.

**VIII. The right to exit.**
You can withdraw from active licensing at any time. Your historical record,
your earnings, and your fingerprint remain yours permanently.

---

## THE 90-DAY PILOT ROADMAP

The SCP is not announced — it is proven. The 90-day pilot does this in three moves.

### Month 1 — Prove Provenance

- RSP_001 becomes the first fully SCP-certified creator
- HVS Certificate issued, SHA-256 + C2PA manifests generated
- NOIZYVOX vault sealed with full Provenance Stack
- HVS Validator v1 built: takes a voice sample, verifies against vault, returns
  HVS status + provenance report

Deliverable: One certified creator. One working validator. A result a lawyer can read.

### Month 2 — Prove Revenue

- First licensed use of RSP_001 voices under HVS certification
- Royalty event fires, ledger updates, 75/25 allocates
- LifeLUV micro-split test: one derivative work, attribution traces back to origin
- Arweave archive: RSP_001 full vault archived permanently off-server

Deliverable: A royalty chain that works end-to-end. Money moved. Record permanent.

### Month 3 — Prove Scale

- 10 Guild members onboarded with full SCP certification
- HVS Certificates issued to all 10
- VSI partnership outreach: present HVS as the localization quality standard
- One AAA character (Dark Warden) certified with EN_UK origin + first regional variant
- Anthropic conversation: SCP as the provenance and consent model NOIZY is building

Deliverable: A system that scales. A partner conversation that uses the language
of infrastructure, not pitch decks.

---

## WHAT IS NOT IN HERE (DELIBERATELY)

These concepts appear in the ecosystem research but are not in the SCP
because they are either not production-ready or technically misleading:

| Concept | Why It's Not Here |
| --- | --- |
| Synthetic DNA storage | Real research, not deployable at this stage |
| "Neural jitter biometric hash" | Not a defined technical standard |
| "Toxic style enforcement" | Nightshade for audio is research-stage, not production |
| "Block-level takedowns auto-generated" | DMCA automation is real; "court-grade" requires lawyers |
| LifeLUV Tokens (crypto) | Legal and regulatory complexity; not needed for v1 |
| "Soul-Capsule Protocol" | Marketing term; Arweave + IPFS + consent key is the real version |

The SCP is built from things that exist and work.
It will expand as research matures — but it does not claim what it cannot deliver.

---

## THE FRAMING SENTENCE

The Sovereign Creative Protocol is the proof that NOIZY does not just protect artists —
it makes their protection technically inevitable, legally demonstrable,
and economically permanent.

---

## COMPANION DOCUMENTS

- `NOIZYVOX.md` — The voice vault, consent key, 75/25 protocol
- `LIFELUV.md` — Triple-lock system, recursive micro-splits, Legacy Vault
- `AAA_CHARACTER_SYSTEM.md` — HVS applied to characters across all languages
- `GAME_AUDIO_INTEGRATION.md` — SCP delivery into FMOD, Wwise, Unity, Unreal
- `ANTHROPIC_AUDIO_DREAMER.md` — The SCP as NOIZY's contribution to Anthropic's world
- `PARTNERSHIP_MAP.md` — Where the SCP fits in the Anthropic / Apple / Google relationships

---

*Captured: 2026-03-13 · NOIZYLAB DreamChamber*
