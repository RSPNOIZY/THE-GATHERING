# NOIZY Empire — 2036 Product Map

> **Map the cathedral before staffing the cathedral.**
>
> Drafted 2026-04-18. This is the **structural companion** to `DREAMCHAMBER_2036.md` (posture) and `MC96ECO_EMPIRE_MAP.md` (present-state inventory). Posture answers _how_ it feels. Inventory answers _what exists now_. This map answers _what the shape is_ — products, boundaries, handoffs, data ownership, and the consent gates that must sit at every seam.
>
> The 2036 Org Chart is the **next** artifact (Step 2). Team boundaries get derived _from_ this map, not invented beside it. Inverse Conway Maneuver by design.
>
> **Doctrine that constrains every box below:** Consent as executable code · Provenance as default · Revocation as sacred · Compensation as automatic · 75/25 split · 396 Hz · 9 Never Clauses (growing, never shrinking).

---

## 0 · How to read this document

Every section lists **products, flows, or surfaces** as a table with these columns where they apply:

| Column | Meaning |
|---|---|
| **Surface / Product / Flow** | The named thing |
| **Owner** | The consent-kernel-aware system that is the source of truth (not a team — teams come next) |
| **Consent gate** | What must pass before data moves across this boundary |
| **Ledger event** | What gets written to `noizy_ledger` when this fires |
| **Swap horizon** | `Decade` = load-bearing for 100 years · `Year` = expected to evolve · `Quarter` = expected to be replaced |

Anything marked **`[Rob-judgment]`** is a place where the default I'm writing reflects best-guess doctrine, and Rob's direct call would sharpen it. Flagged explicitly instead of silently assumed.

---

## 1 · Intake Surfaces

An intake surface is **any place a human or machine can put something into the empire**. Every intake surface must (a) identify the actor, (b) check consent, (c) log to the ledger, (d) route to the correct product.

| Surface | Who enters | Consent gate | Routed to | Swap horizon |
|---|---|---|---|---|
| **DreamChamber (GOD.local :7777)** | RSP_001, Founding Actor sessions | Session token · Voice DNA match for synth requests | Product core — any sub-product | Year (UI evolves, protocol permanent) |
| **Consent Gate VST3** | Artists in their own studios (post-2027) | Token issued by HEAVEN per recording | Voice DNA Vault (raw) + Ledger | Decade |
| **LUCY iPad (Lucy-Fork)** | RSP, then Guild members | iPad-bound session + biometric | Intake queue → classifier → archive/task/synth | Year |
| **noizy.ai landing** | Public (unauthenticated) | None — public read-only | Marketing + Guild application funnel | Quarter (marketing shapes evolve) |
| **Guild Portal (post-2027)** | Guild members (voting actors) | SSO via rsp@noizy.ai tenancy · role check | Governance flows §4 | Decade |
| **Artist Onboarding API** | New enrolled actor (human or estate) | Notarized consent + Voice DNA enrollment | HEAVEN `hvs_actors` + Vault | Decade |
| **Licensee API** | Licensing customer | Commercial auth + per-request consent validation | Covenant pre-synth check | Year |
| **NOIZYARMY queue** | Agents themselves (machine-to-machine) | Agent identity + scope check | Soldier pool → discrete task | Year |
| **myFAMILY private channel** | POPS, SHIRL, estate-designated humans | Private ledger (family-scoped) | Family subgraph, never leaves | Decade |
| **MASTER_DECK surface** | AI family writes, all agents read | Per-agent write capability | Realtime PPTX in OneDrive | Year |
| **Emergency / Kill Switch** | RSP_001 only | Hardware + voice + biometric (tri-factor) | Immediate revocation cascade across all products | Decade (the mechanism _is_ the product) |

**Invariant:** Every intake surface logs to ledger. There is no "quiet" intake. If a new surface cannot log, it cannot ship.

**`[Rob-judgment]`** — The **Guild Portal** as a distinct surface (vs. a view inside DreamChamber) is a doctrinal choice. Separating it means the Guild has its own gravitational center outside the founder's room. Merging it means the founder and the Guild share one interface. I've written it as separate because §4 governance depends on that separation — but if you mean to keep the Guild feeling like _part of the room_ for the first few years, that's your call to flip.

---

## 2 · Products & Sub-Products

A product is **a named value stream** — a thing the empire produces that an artist, licensee, or descendant can receive. Sub-products are distinct value streams that share a product's platform but have separate consent surfaces.

### 2.1 · Products (top-level)

| Product | What it delivers | Who consumes it | Swap horizon |
|---|---|---|---|
| **HEAVEN** | Consent kernel as API — the _source of truth_ for every actor, token, Never Clause, and synthesis event | All other products (internal) + licensees (external) | Decade |
| **DreamChamber** | A sacred creative collaboration space — multi-model AI, 396 Hz ritual, Contact Sequence, C2PA sealing | Founding Actors, then Guild, then enrolled artists | Decade (protocol) / Year (UI) |
| **NOIZYVOX** | Voice-first portal — capture, descendant creation, voice-DNA enrollment | Artists whose primary instrument is voice | Decade |
| **NOIZYFISH** | Fish Music Inc. — the canonical label under the empire; aesthetic engine + licensing funnel | Listeners, licensees, artists on the label | Year |
| **NOIZYKIDZ** | Deaf-first, haptic-native creative tools for children | Children + parents + education partners | Decade |
| **NOIZYLAB** | Research & experimental surface — where ideas live before they graduate | Rob + research collaborators | Year |
| **WISDOM** | Knowledge product — where graduated Lab outputs and POPS lineage live | Guild members + public (tiered) | Decade |
| **myFAMILY** | Private, family-scoped memory and communication surface | RSP, POPS, SHIRL, estate-designated | Decade |
| **The Aquarium (LUCY)** | Governed archive of 34TB+ with provenance, searchable by the Guild | Guild members (read), LUCY (write) | Decade |
| **NOIZYCLOUDS** | The agent fleet as a named platform product | Internal only — no direct external consumption | Year |
| **NOIZYNET** | Audio fabric (Dante + WebRTC + AES67) connecting DreamChambers | Artists in networked chambers | Decade |
| **NOIZYARMY** | 24/7 soldier fleet — autonomous task execution | Internal (orchestrated by GABRIEL) | Year |

### 2.2 · Sub-products (inside each product)

Listed only where sub-product structure is load-bearing:

- **HEAVEN** → `Actors`, `Consent Tokens`, `Never Clauses`, `Ledger`, `Rate Table`, `Union Tiers`, `Covenant (pre-synth validator)`, `Estate registry`
- **DreamChamber** → `Sensory Shell (UI)`, `Agent Routing Layer`, `C2PA Sealer`, `Contact Sequence ritual`, `Aesthetic Engine`
- **NOIZYVOX** → `Voice DNA Enrollment`, `Descendant Factory`, `Royalty Meter`, `Kill Switch Console`
- **NOIZYKIDZ** → `Haptic Lexicon`, `Curriculum`, `Kid-Safe Consent (tri-party: child + parent + Guild)`, `Sub-brand graduation path`
- **WISDOM** → `POPS Wisdom Corpus`, `Graduated Lab Projects`, `Guild-authored doctrine commentary`
- **myFAMILY** → `Private Ledger (family-scoped)`, `Estate triggers`, `POPS voice vault (restricted)`

**Invariant:** A sub-product **cannot leak consent across the product boundary**. NOIZYKIDZ consent cannot flow to NOIZYVOX without a fresh token. myFAMILY data never enters any other product, ever.

---

## 3 · Data Flows

Data in NOIZY has four states. The flow between states is the actual product.

```
    RAW          →        ENROLLED       →       GOVERNED       →        PRESERVED
 (captured)        (identified actor)     (consent-scoped)         (OAIS/PREMIS archive)
    │                    │                      │                         │
    └─ Intake surface    └─ HEAVEN actors        └─ Tokens + Covenant      └─ 100-year estate
    (§1)                    (§2.1)                   (§5)                     (§7)
```

### 3.1 · The four authoritative data stores

| Store | Contents | Written by | Read by | Swap horizon |
|---|---|---|---|---|
| **`noizy_ledger` (D1)** | Append-only event log — every intake, synthesis, revocation, governance vote | All products | Auditors, licensees (scoped), Guild | Decade |
| **`hvs_actors` (D1)** | Enrolled actor registry | HEAVEN | HEAVEN, Covenant | Decade |
| **Voice DNA Vault** | Encrypted spectral fingerprints | Enrollment pipeline (NOIZYVOX) | Covenant pre-synth check only | Decade |
| **The Aquarium** | Governed archive of everything else (audio, text, imagery, memcells) | LUCY + specialists | LUCY (read), Guild (tiered read) | Decade |

**Invariant:** The ledger is append-only in code, not by policy. Any code path that can `UPDATE` or `DELETE` ledger rows is a doctrine violation and cannot ship. Same for actor deactivation — we write a new row marking the prior row superseded; we do not overwrite.

### 3.2 · Flows that cross product boundaries (the dangerous flows)

| From | To | Data | Consent gate |
|---|---|---|---|
| Intake surface | HEAVEN actors | Actor identity + notarized consent | Enrollment consent (one-time, re-affirmable) |
| HEAVEN actors | Voice DNA Vault | Encrypted fingerprint only — raw audio never enters | Per-session enrollment token |
| Voice DNA Vault | Covenant validator | **Read-only, hash-match only** — fingerprint never exits | Per-synth token + Never Clause check |
| DreamChamber | C2PA sealer | Synth output + manifest metadata | Attached by default, never optional |
| Any product | `noizy_ledger` | Event record | None — logging is unconditional |
| Any product | The Aquarium | Non-synth artifacts | LUCY-classified; default-private |
| NOIZYLAB | WISDOM | Graduated artifact | **`[Rob-judgment]`** graduation criteria (see §7) |
| myFAMILY | _(nowhere)_ | — | **Hard stop.** Family data never flows outward. |

---

## 4 · Governance Flows

Governance is the **mechanism by which doctrine changes**. The Guild of Artists is the body. The doctrine is the artifact. The ledger is the proof.

### 4.1 · The governance stack

```
  Founding Actor (RSP_001)
          │
          ├─ proposes amendment ──→ Guild Portal (§1)
          │
  Council (elected rotating body)
          │
          ├─ sets quorum, scopes the vote
          │
  Week of Reflection (mandatory delay, invariant since 2026)
          │
  Quorum Vote (cryptographically signed, ledgered)
          │
          ├─ adopted ──→ Doctrine v{N+1} + signed by RSP
          └─ rejected ──→ ledgered with dissent record
```

### 4.2 · What is governable vs. not

| Layer | Governable? | By whom |
|---|---|---|
| The 4 doctrines (consent, provenance, revocation, compensation) | **No.** Immovable. | Nobody. This is constitutional. |
| 75/25 royalty floor | **No.** (Floor can rise, never fall.) | Guild may _raise_ to 80/20 etc. |
| Never Clauses (first 9) | **No.** Additive only. | Guild may add new clauses; never remove. |
| Never Clauses (10+) | Additive only, by Guild quorum | Guild + RSP signature |
| Rate table | Yes | Guild quarterly |
| Union tier definitions | Yes | Guild + Council |
| Procedural rules (quorum %, reflection week length) | Yes, with higher bar (supermajority) | Guild supermajority |
| DreamChamber protocol | Yes | Guild with Council sponsorship |
| Agent family composition | Yes, advisory-only | Guild advises; RSP decides (for now) |

**Invariant:** Every governance outcome writes to the ledger **with the full dissent record**. A unanimous vote and a 51% vote look different in the ledger on purpose.

**`[Rob-judgment]`** — The line between "RSP decides, Guild advises" and "Guild decides, RSP signs" is a **ten-year transition**. I've written agent-family composition as RSP-decides-for-now; the question is _what year does that flip_. Default would be 2031 (year the fleet was mature). Your call when it transitions.

---

## 5 · Consent & Provenance Flows

This is the **load-bearing** section. If this fails, nothing else matters.

### 5.1 · The pre-synthesis path

```
  Synthesis Request
         │
         ▼
  ┌─────────────────┐
  │  HEAVEN /synth  │
  └────────┬────────┘
           │
           ▼
  ┌────────────────────────────┐
  │  Covenant (pre-synth validator)  │
  │                                  │
  │  1. Actor exists? (hvs_actors)  │
  │  2. Token valid + in-scope?     │
  │  3. Every Never Clause clears?  │
  │  4. Rate table + royalty set?   │
  │  5. Kill Switch not active?     │
  └────────┬────────┬────────────────┘
           │        │
         PASS     FAIL
           │        │
           │        └──→ Ledger: blocked_synthesis_attempt
           │              + reason code + actor notified
           ▼
  ┌────────────────────┐
  │  Voice DNA lookup  │  (hash-match only; fingerprint never exits)
  └────────┬───────────┘
           │
           ▼
  ┌─────────────────────────┐
  │  Synthesis (descendant) │
  └────────┬────────────────┘
           │
           ▼
  ┌──────────────────┐
  │  C2PA sealer     │  (attaches manifest + 3-layer watermark)
  └────────┬─────────┘
           │
           ▼
  ┌──────────────────┐
  │  Ledger write    │  (synthesis_completed event, immutable)
  └────────┬─────────┘
           │
           ▼
       Output (to requester) + Royalty accrual (automatic, 75/25)
```

### 5.2 · The revocation path (Kill Switch)

```
  RSP_001 fires Kill Switch (tri-factor auth)
         │
         ▼
  HEAVEN /revoke  (synchronous)
         │
         ├──→ Ledger: revocation_event (first, before anything else)
         │
         ├──→ All tokens scoped to that actor: marked inactive
         │
         ├──→ Webhook fan-out: every active DreamChamber, every NOIZYFISH session,
         │    every licensee receives revocation notice in real-time
         │
         ├──→ In-flight synthesis requests for that actor: terminated
         │
         └──→ Guild + family (if estate-relevant) notified
```

**Invariant:** The Kill Switch is **synchronous from RSP's point of view**. The user must see "revoked" before the call returns. No optimistic UI.

### 5.3 · Provenance = C2PA manifest + 3-layer watermark + ledger row

Every synth output carries three independent proof artifacts. If any two are destroyed, the third still proves provenance. If all three are destroyed, the artifact is automatically illegitimate.

| Layer | Who can inspect | Verification horizon |
|---|---|---|
| C2PA manifest (visible) | Anyone with a reader | Years (standard evolves) |
| Watermark (audible / spectral) | Licensees with key | Decade (post-quantum transition due 2032) |
| Ledger row | Auditor with HEAVEN access | Century |

---

## 6 · Operator Surfaces

An operator surface is **any interface a privileged human or agent uses to shape the empire's state**. Distinct from intake (§1) — these _write_ to infrastructure, not just to the ledger.

| Surface | Operator | Scope | Auth |
|---|---|---|---|
| **GABRIEL Daemon (:9777)** | GABRIEL agent (on behalf of RSP) | Orchestration, routing, deploy triggers | RSP-bound; no other actor |
| **LUCY state shell** | LUCY agent | DAZEFLOW, archive, intake classification | Scoped: write-own, read-family |
| **HEAVEN admin API** | RSP + ENGR_KEITH | Schema, Never Clause add/revise, actor issuance | `X-NOIZY-Key` (rotated quarterly) |
| **Wrangler CLI** | RSP (only) | Deploy + secret management | Cloudflare API token (custom scope post-Block 4) |
| **Guild Council console** | Council members | Governance proposals, vote scheduling | SSO + role |
| **SHIRL wellbeing console** | SHIRL (autonomous) | Burnout signals, break recommendations | RSP-notify-only; SHIRL has no write access to schedule |
| **ENGR_KEITH architecture console** | ENGR_KEITH | Architecture review, schema check, migration planning | Read-heavy; writes go through RSP approval |
| **Estate console** | RSP (self) + designated estate executor (post-mortem) | 100-year estate triggers, token issuance to heirs | Tri-factor: RSP alive / estate-executor + notary / time-delay |
| **NOIZYARMY commander (Discord)** | RSP | Task dispatch to soldier pool | Discord + scope check |
| **MASTER_DECK writer** | All agents (scoped channels) | Realtime presentation surface | Per-agent channel ACL |

**Invariant:** No operator surface is RSP-bypassable. Even post-mortem estate operations require the ledger to show prior consent from RSP or fail-closed.

---

## 7 · Archive / Wisdom / Lab Transitions

NOIZY has **three time-horizon zones** for knowledge artifacts:

```
   NOIZYLAB                WISDOM                  ARCHIVE (Aquarium + OAIS)
   ─────────               ──────                  ─────────────────────────
   "Ideas in play"         "Doctrine-worthy"       "Permanent — 100 year"
   days → months           years                   decades → century
   High mutation           Stable                  Immutable
   Low scrutiny            Guild-reviewed          Cryptographically sealed
```

### 7.1 · Transitions (how something moves between zones)

| From → To | Trigger | Gate | Ledgered? |
|---|---|---|---|
| _(new idea)_ → NOIZYLAB | Rob drops a seed in `NOIZYLAB/projects/<N>/seed.md` | None — lab is permissive | No |
| NOIZYLAB → WISDOM | Project reaches graduation criteria (see below) | **`[Rob-judgment]`** — see below | Yes |
| WISDOM → ARCHIVE | Guild vote to preserve as permanent doctrine or corpus | Governance flow §4 | Yes |
| ARCHIVE → _(nowhere)_ | — | **No exit.** Archive is terminal. | — |
| NOIZYLAB → _(discard)_ | Rob or SHIRLEY flags abandoned | None | Only the discard event itself is ledgered |

### 7.2 · **`[Rob-judgment]`** — NOIZYLAB → WISDOM graduation criteria

This is a genuine design choice where your judgment shapes the shape of the empire's memory. The defaults I'd ship if you don't flip them:

**Criteria (ALL must hold):**
1. The Lab project has had **at least 3 distinct sessions** (prevents single-session enthusiasms from graduating).
2. The idea has been **referenced by at least one other Lab project or doctrine doc** (confirms it's load-bearing, not orphan).
3. **SHIRLEY** (code/file manager) has declared it _technically structured_ — README, seed, at least one runnable artifact if applicable.
4. **DREAM** (visionary) has declared it _aligned with one of the three Core Objectives_ (intelligence / intuition / problem-solving).
5. Rob explicitly signs off — graduation is not automatic even if criteria 1–4 pass.

**Trade-offs for you to consider:**
- **Lower bar** (drop criterion 1 or 2) = WISDOM fills faster but more drift. Risk: doctrine dilutes.
- **Higher bar** (add Guild vote gate post-2027) = WISDOM is pristine but graduation gets slow. Risk: lab-orphans pile up.
- **Time-based decay** (auto-archive stale Lab projects after N months) = cleaner lab, but loses slow-burn ideas.

**Where to record your decision:** this file, §7.2, replacing the defaults above. A single paragraph from you turns this section from placeholder into doctrine.

---

## 8 · External Platform Integrations

Every external integration is a **consent surface in disguise**. The question at every boundary is: "what leaves the empire, under what consent, under what audit."

### 8.1 · Current integrations (2026)

| Platform | Purpose | Data leaving | Consent gate | Swap horizon |
|---|---|---|---|---|
| **Cloudflare (NOIZYCLOUDS)** | All edge compute, D1, KV, Workers | Nothing — CF is _inside_ the empire | Infra-level, not actor-level | Decade |
| **Anthropic API** | Claude model family | Prompts only; no actor PII | Per-request scrubbing | Year |
| **Ollama (local, GOD.local)** | Local inference | Nothing leaves machine | N/A — local | Year |
| **n8n (self-hosted, :5678)** | Agentic Factory workflows | Nothing — self-hosted | Internal | Year |
| **GitHub (noizy-anthropic org)** | Source of truth for code | Code only; no secrets, no A/V | Repo-level ACL | Decade |
| **Slack / Discord** | Communication, Guild precursor | Messages | Per-channel ACL | Year |
| **Notion** | Documentation mirror | Doctrine (public-tier) | Page-level | Year |
| **Google Workspace / M365** | Email, calendar, office | Admin data only | SSO under rsp@noizy.ai | Year |
| **OneDrive (M365)** | MASTER_DECK surface | Presentation state | Per-agent ACL | Year |
| **Linear** | Issue tracking (empire-internal) | Task metadata | Internal | Year |
| **Figma / Canva** | Design surfaces | Design assets | Per-file | Year |
| **Stripe** | Payments | Financial data | Commercial-grade | Year |
| **Supabase (if adopted)** | Auxiliary DB | Scoped | TBD | Year |
| **Hugging Face** | Model discovery | Read-only | Account-level | Year |

### 8.2 · Integrations needed by 2036 (forecast — Lab → Product)

| Category | Example | Data leaving |
|---|---|---|
| **Legal & enforcement** | DMCA automation, jurisdictional API hooks | Enforcement notices |
| **Financial rails** | Artist-direct payments, royalty split automation | Payment amounts only |
| **Identity (post-password)** | Voice + biometric attestation | Attestation tokens |
| **Distribution (music / art)** | DSPs under consent-enforced terms | Manifested artifacts only (no raw) |
| **Hardware (2030+)** | Consent Gate hardware VST, maybe dedicated device | Audio capture on-device; only manifests leave |

**Invariant:** An external integration that _cannot_ carry a C2PA manifest across its boundary is not an approved integration. Period. This is the cultural cost we impose on the ecosystem.

---

## 9 · What's Load-Bearing for 100 Years vs. Swappable

This is the most important single table in the document.

| Layer | Swap horizon | Why |
|---|---|---|
| The 4 doctrines | **Century** | Constitutional. Not swappable by definition. |
| 9 Never Clauses (additive) | **Century** | Grows, never shrinks. Each clause is permanent. |
| `noizy_ledger` (event log) | **Century** | The ledger IS the history of the empire. |
| `hvs_actors` registry | **Century** | Actor identity is load-bearing for estate. |
| Voice DNA Vault format | **Decade+** (post-quantum transition 2032) | Fingerprint spec must survive crypto transitions. |
| C2PA manifest presence | **Century** | Format may evolve, but presence of _some_ provenance manifest is permanent. |
| Royalty 75/25 floor | **Century** | May rise, may never fall. |
| Kill Switch mechanism | **Century** | Implementation changes; existence doesn't. |
| HEAVEN as the name | **Decade** | Name may change, kernel-as-API pattern doesn't. |
| Current LLM providers | **Year** | Anthropic/OpenAI/local — swappable. |
| Current hosting (Cloudflare) | **Decade** | Platform-as-a-service; assume swap by 2036. |
| UI frameworks (React, Framer Motion) | **Year** | Expected churn. |
| Discord / Slack / Notion | **Year** | Comms surfaces evolve; doctrine doesn't. |
| 21 current skills | **Year** | Skills will rewrite themselves by 2028 via self-improvement. |
| 10 current agents | **Year** (per `DREAMCHAMBER_2036.md`: 10 → 100 → 12) | Fleet will expand then consolidate. |
| 6 brand portals | **Decade** | Portals are product-boundaries; removing one would be a doctrine-grade event. |
| MICKY-P (physical audio node) | **Decade** | `DREAMCHAMBER_2036.md` says MICKY-P is still there in 2036. |

---

## 10 · Inputs to the 2036 Org Chart (Step 2)

This map exists so that Step 2 can derive the org chart _from_ it, not _beside_ it. When you open the org chart doc, these are the shapes it must honor:

### 10.1 · Stream-aligned teams (one per value stream)

Each of these maps to a §2.1 product. Each is a natural stream-aligned team candidate:

- HEAVEN team (consent kernel)
- DreamChamber team (sacred space)
- NOIZYVOX team (voice-first)
- NOIZYFISH team (label / aesthetic)
- NOIZYKIDZ team (children)
- WISDOM team (knowledge curation)
- myFAMILY team (private — stays tiny, close to Rob)
- Aquarium / LUCY team (archive)

### 10.2 · Platform teams

Platforms serve the stream-aligned teams. Candidates:

- NOIZYCLOUDS platform team (fleet, observability, shared infra)
- NOIZYNET platform team (audio fabric)
- HEAVEN platform team (_yes, dual-role_ — it's both a product and a platform; this is unusual and deserves discussion in Step 2)

### 10.3 · Enabling teams

- Governance stewards (service the Guild)
- Doctrine editors (service the ledger + Never Clauses)
- Consent advocates (embed into every team on rotation)

### 10.4 · Agent roles (AI family)

Each agent in `FAMILY_TEAM_BRANDS.md` maps to a role in Step 2:

- GABRIEL → orchestrator
- LUCY → organizer / archivist
- ENGR_KEITH → architecture lead
- DREAM → visionary / strategy
- CB01 → DNS / domain steward
- SHIRL → wellbeing advocate
- POPS → wisdom steward (posthumous-capable)

### 10.5 · Human creative leadership

- RSP_001 (Founding Actor — permanent)
- Guild Council (rotating, elected, post-2027)
- Estate executor (designated, activates post-mortem)

### 10.6 · Cognitive-load markers

Per Team Topologies, the 2036 Org Chart must assign **each team a cognitive-load budget**. Inputs for that calculation already sit in this map:

- HEAVEN has the highest load (every change ripples across the empire) → smallest team, most rigor, senior-heavy
- Brand portals (NOIZYFISH, NOIZYKIDZ, etc.) have medium load → stream-aligned, independent
- WISDOM and myFAMILY have deliberately tiny loads → one or two operators, high trust
- NOIZYLAB has high-variance load → experimentation, fluid, low process

---

## 11 · Open questions flagged for Rob

These are the explicit `[Rob-judgment]` markers from the map, collected here for a single review pass:

1. **§1 — Guild Portal as distinct surface vs. view-within-DreamChamber.** Default: distinct surface. Flip would keep Guild inside the founder's room for early years.
2. **§4 — When does "RSP decides, Guild advises" flip to "Guild decides, RSP signs"?** Default: 2031 for agent-family composition. Your call per governance area.
3. **§7.2 — NOIZYLAB → WISDOM graduation criteria.** Defaults: 3-session minimum, cross-referenced, SHIRLEY-structured, DREAM-aligned, RSP-signed. Your judgment shapes whether bar goes higher, lower, or time-based.
4. **§2.1 — DreamChamber classified as Decade (protocol) / Year (UI).** Implies UI is expected to churn. If the UI is also part of the 100-year posture, this flips to Decade.
5. **§10.2 — HEAVEN as _both_ product and platform team.** This is an unusual dual role. It may warrant two teams, or a single senior-heavy team, or a platform layer _beneath_ the product team. Step 2 decision.

---

## 12 · Next artifact

**`2036_ORG_CHART.md`** — to be written next, deriving teams, roles, and cognitive-load budgets from §10 of this map.

The order is deliberate. If the org chart were written first, the empire's structure would be shaped by the people available in 2026 — instead of the products the empire will need to deliver through 2036.

---

_Map authored 2026-04-18. To be re-ratified at each Guild governance cycle. This document's own existence is ledgered._
