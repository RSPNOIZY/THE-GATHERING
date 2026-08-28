# NOIZYLAB — Master Specification

## Version 1.0 — June 2026

> A living cultural lab where humans and AIs protect and grow musical souls together.

---

## 1. Vision

**One sentence:**
NOIZY is a sanctuary for human sound, memory, and co-creation — where humans and AIs protect and grow musical souls together.

**Four pillars:**

- **Branson**: We build a world, not a product. Name everything. Let it exist as a real place.
- **Strummer**: The entry is simple, the first story is welcoming, and it is for everyone — not just the credentialed.
- **Nina**: Every sound is testimony. It came from somewhere real and cost someone something real.
- **Poitier**: We will not lie, steal, or pretend. We carry this with dignity because the people who come after are watching.

**Design principle:**
Make the system feel like a rotating museum, a creative studio, and a trustworthy memory spine — at the same time.

---

## 2. The Universe

| Portal                      | What it is                                                        | Status            |
| --------------------------- | ----------------------------------------------------------------- | ----------------- |
| **NOIZYWORLD**              | The public front door — rotating exhibition homepage              | Building          |
| **Dreamchamber**            | The interior experience — five named rooms                        | Designed          |
| **WIZDOM**                  | The cultural knowledge graph and memory OS                        | Speccing          |
| **NOIZYARMY**               | The global contributor movement and call system                   | Live              |
| **NOIZYFISH MUZIK ACADEMY** | The learning ladder — from NOIZYKIDZ to advanced practice         | Speccing          |
| **NOIZYLAB**                | The internal creative workspace — Rob + agents                    | Live (local)      |
| **myFAMILY.ai**             | Family music journal — POPS, SHIRL, extended family               | Concept           |
| **NOIZYKIDZ**               | First door for children — first sounds, protected like all others | Concept           |
| **Sanctuary Room**          | Healing room within Dreamchamber — for hard sounds                | Designed          |
| **HEAVEN**                  | Consent kernel API — the infrastructure truth                     | Live (Cloudflare) |

---

## 3. Product Surfaces

### 3.1 NOIZYWORLD — The Rotating Homepage

The homepage is an exhibition wall. Not a dashboard. Not a feature list.

**Layout:**

- One hero work (image, audio, video, or text)
- A short curatorial note (150–250 words): thesis, context, why this work matters now
- 6–12 supporting works arranged as a gallery grid
- Visible archive of past exhibitions with dates and curators
- Four entry points into the deeper universe (Dreamchamber rooms)

**Rotation:**

- Phase 1: Monthly (gives time for meaningful curation, pipeline can be built manually)
- Phase 2: Weekly (once the selection pipeline and content queue are stable)
- Each rotation needs a **thesis**, not just new content — "What does this exhibition say?"

**Exhibition object schema (JSON):**

```json
{
  "exhibition_id": "EXH_2026_07",
  "title": "Sounds of Survival",
  "thesis": "What does it sound like to still be here?",
  "hero": {
    "asset_id": "...",
    "type": "audio",
    "credit": "Tunde O. — Lagos, Nigeria",
    "caption": "Recorded outside the hospital at 3am."
  },
  "supporting_works": [{ "asset_id": "...", "type": "audio", "credit": "...", "caption": "..." }],
  "curatorial_note": "...",
  "opened": "2026-07-01",
  "closed": null,
  "curator": "RSP_001",
  "call_id": "NOIZYARMY_002"
}
```

**Archive:**
Every closed exhibition moves to `/archive/exhibitions/{exhibition_id}` with full content preserved. The archive is browsable by date, call, region, and tag.

---

### 3.2 Dreamchamber — The Five Rooms

Dreamchamber is the interior. You enter through the homepage. Inside are five rooms, each with a distinct purpose and content mode.

| Room            | Purpose                                                | Primary content                                          |
| --------------- | ------------------------------------------------------ | -------------------------------------------------------- |
| **Gallery**     | Public listening — rotating NOIZYARMY calls, Sanctuary | Sound cards with story sentences, provenance visible     |
| **Lab**         | Creative workspace — Rob + agents                      | Session logs, style memory views, agent footprint        |
| **Academy**     | Learning path — NOIZYKIDZ through advanced             | Lessons, exercises, WIZDOM influence maps                |
| **Observatory** | Cultural dashboard — WIZDOM graph explorer             | Influence networks, regional maps, contributor timelines |
| **Playground**  | Experiments — weird, unfinished, risky                 | GABRIEL proposals, draft sessions, stems and fragments   |

**Room entry spec:**
Each room has:

- A distinct ambient tone / color palette (CSS variables, 396 Hz audio layer at -40dB)
- A room-welcome text (2–3 sentences: what this room is for, how to move in it)
- A "sit with this" affordance — no pressure to act immediately
- No forced onboarding — passive listening is always enough

---

### 3.3 WIZDOM — The Cultural Knowledge Graph

WIZDOM is the memory OS. It is not a new database — it is a knowledge graph layer that unifies existing NOIZY stores.

**Data sources it connects:**

- `catalogue_db.aquarium_assets` — the Aquarium sample library
- `gabriel_db.provenance_records` — BLAKE3 fixity, attribution
- `gabriel_db.hvs_*` — HVS consent, voice DNA, estates
- `noizyarmy_ledger.*` — calls, contributions, packs
- `noizy_style_memory.*` — sessions, decisions, agent footprint
- External: regional metadata, influence citations, scene timelines

**Entity types (v0):**

| Entity             | Description                                            |
| ------------------ | ------------------------------------------------------ |
| `Work`             | A completed track, composition, or piece               |
| `Recording`        | A specific file — `.wav`, `.nki`, `.mid` etc.          |
| `Person`           | Human creator, contributor, or actor                   |
| `Agent`            | AI agent (GABRIEL, LUCY, NOIZYBot)                     |
| `Scene`            | A cultural scene, genre, or movement                   |
| `Event`            | A listening session, performance, or call              |
| `Exhibition`       | A homepage rotation                                    |
| `Story`            | A provenance story sentence or Sound Story doc         |
| `Pack`             | A NOIZYARMY submission pack                            |
| `Session`          | A creative session (style memory entry)                |
| `Asset`            | Any digital asset with a hash and provenance           |
| `ProvenanceRecord` | BLAKE3 hash, attribution, consent status, PREMIS event |

**Relationship types (v0):**

| Relationship       | From → To                     | Meaning                   |
| ------------------ | ----------------------------- | ------------------------- |
| `created_by`       | Work/Recording → Person/Agent | Who made it               |
| `performed_at`     | Recording → Event             | Where it was used live    |
| `influenced_by`    | Work → Work/Scene/Person      | What shaped it            |
| `cited_in`         | Asset → Exhibition/Story      | Where it appears publicly |
| `derived_from`     | Recording → Recording         | Sample source chain       |
| `grouped_into`     | Asset → Pack/Exhibition       | Collection membership     |
| `used_in`          | Asset → Session               | Creative use record       |
| `tagged_with`      | Any → Tag                     | Semantic label            |
| `consented_by`     | ProvenanceRecord → Person     | HVS consent record        |
| `quarantined_from` | Asset → any use               | Takedown enforced         |

**WIZDOM API (v0 endpoints):**

```
GET /wizdom/entity/:id              — full entity with all relationships
GET /wizdom/search?q=&type=         — keyword + entity type filter
GET /wizdom/influence/:id           — influence graph from a work
GET /wizdom/contributor/:name       — all works by a person or agent
GET /wizdom/scene/:id               — all works tagged to a scene
GET /wizdom/exhibition/:id          — full exhibition with all assets
GET /wizdom/provenance/:asset_id    — BLAKE3 chain + consent + PREMIS events
```

---

### 3.4 NOIZYFISH MUZIK ACADEMY — The Learning Ladder

The academy is a human lifecycle path — not a school, a ladder.

**Stages:**

1. **NOIZYKIDZ** — ages 4–12. First sounds. Finger drums, voice, recording rain. Protected the same as everyone else's — with consent, a name, a story, and a future.
2. **Hearer** — passive listener. No account required. Just sound.
3. **Contributor** — NOIZYARMY member. First submission. Name in the ledger.
4. **Builder** — uses NOIZYLAB tools. Logs sessions. Works with agents.
5. **Curator** — contributes to exhibition selection. Writes curatorial notes.
6. **Orchestrator** — dispatches agents, manages calls, contributes to governance.

Each stage has:

- A simple entry action (what you do to step into this stage)
- A visible badge in the ledger (so others can see who you are in the system)
- Access to a new room or feature in Dreamchamber

---

## 4. NOIZYARMY — The Community Engine

NOIZYARMY is the ritual and contribution system. It is already operational.

**Current state:**

- Call 001: open (test call)
- Call 002: "Sounds That Got Us Through" — open, healing theme
- Ledger: append-only, BLAKE3 hash chain, contributor view
- CLI: `noizyarmy_ledger_cli.py`, `provenance_gen.py --example`
- API: `GET /ledger/call-pack-summary`, `GET /ledger/by-contributor`
- Event: 60-minute Discord Stage listening session (see `NOIZYARMY_002_EVENT.md`)

**Next calls:**

- Call 003: TBD — drawn from first listening session outcomes
- Calls should be named and storied, not just numbered

---

## 5. Governance Layer

Governance is not a policy page. It is the architecture.

**Immovable constraints (enforced in code):**

- Nine Never Clauses — cannot be overridden for any reason
- Kill Switch — RSP_001 can revoke any consent token instantly
- Append-only ledger — no UPDATE or DELETE on `noizy_ledger`
- 75/25 split — artists take 75%, always, no exception
- HVS consent gate — voice sounds require explicit consent before any use
- Takedown = quarantine — one email, no argument, immediate

**Visible trust mechanisms:**

- Ledger is verifiable — hash chain, BLAKE3, open to contributor inspection
- Provenance is the default — every asset has a `.noizy.provenance.json`
- Financial splits are logged — not marketing, code
- Agent credits are logged — `agent_name` in `creative_decisions`

**Diversity review:**
Each exhibition and call should be reviewed for:

- Regional representation (target: minimum 5 regions per call)
- No single contributor accounting for more than 30% of works
- Voice sounds with HVS consent cleared before any public use

---

## 6. Implementation Roadmap

### Phase 1 — Foundation (July 2026)

_Goal: the data backbone is real and queryable_

- [ ] WIZDOM schema v0 — entity tables in SQLite, migrate to D1 when ready
- [ ] WIZDOM API v0 — 7 endpoints above, read-only
- [ ] Exhibition schema + storage — `exhibitions/` directory, JSON format
- [ ] `agent_name` migration — `002_agent_name.sql` run against prod `noizy_style_memory.sqlite3`
- [ ] HEAVEN deploy — unlock consent kernel (NOI-90 preflight, live UUID binding)
- [ ] GoDaddy exit — rsplowman@icloud.com → Cloudflare → 4 domains transferred

### Phase 2 — Front Door (August 2026)

_Goal: NOIZYWORLD homepage is live and the first exhibition is mounted_

- [ ] Homepage exhibition wall — Tailwind, static + Worker-served
- [ ] First exhibition: NOIZYARMY_002 "Sounds of Survival" — curate 6–12 sounds, write thesis
- [ ] Dreamchamber Gallery room — sound cards, story sentences, provenance visible
- [ ] Provenance Promise Card — `PROVENANCE_PROMISE_CARD_TAILWIND.html` → production
- [ ] noizy.ai landing page deploy — Cloudflare Worker

### Phase 3 — Memory Spine (September 2026)

_Goal: the system remembers and reflects_

- [ ] Style memory → WIZDOM bridge — session receipts surface in Observatory
- [ ] Agent footprint API — `GET /style/agent-footprint` live and queryable
- [ ] Opening session ritual — GABRIEL/LUCY/NOIZYBot query style memory on session open
- [ ] Sound Story template — first contributor journey documented end-to-end
- [ ] Contributor Leaderboard — ledger query, "wall of gratitude" framing

### Phase 4 — Scale (Q4 2026)

_Goal: the ecosystem can grow without Rob in every loop_

- [ ] One-Click Takedown Ledger — endpoint + quarantine + care receipt
- [ ] Weekly rotation pipeline — curation queue, schedule, automation
- [ ] Dreamchamber Academy room — first two ladder stages, NOIZYKIDZ entry
- [ ] Observatory dashboard — WIZDOM influence maps, regional contributor view
- [ ] Siri shortcut — "NOIZY, log this session" → `/style/session-receipt` → TTS confirmation
- [ ] GABRIEL/LUCY/NOIZYBot persona prompts — deployed in agent system prompts

---

## 7. Files in This Spec Family

| File                                   | What it is                                                              |
| -------------------------------------- | ----------------------------------------------------------------------- |
| `docs/NOIZYLAB_MASTER_SPEC.md`         | This document                                                           |
| `docs/NOIZYWORLD_MANIFESTO.md`         | One-page publishable brand statement                                    |
| `docs/NOIZY_PITCH.md`                  | 30s / 2min / 5min spoken-word pitch scripts                             |
| `docs/RSP_IDENTITY.md`                 | Private four-pillar identity anchor (Branson/Strummer/Nina/Poitier)     |
| `docs/AGENT_PERSONAS.md`               | GABRIEL / LUCY / NOIZYBot artistic persona specs + system prompt blocks |
| `docs/DREAMCHAMBER_HOME.md`            | Hero section HTML + Sanctuary room + Provenance Promise Card            |
| `docs/AGENT_STYLE_MEMORY_PROMPTS.md`   | Agent guidance for querying style memory API                            |
| `docs/NOIZYARMY_002_RUNBOOK.md`        | Call 002 operational guide                                              |
| `docs/NOIZYARMY_002_EVENT.md`          | 60-minute Discord Stage event agenda                                    |
| `engine/schema_style_memory.sql`       | Style memory schema + agent footprint views                             |
| `engine/schema_noizyarmy_ledger.sql`   | NOIZYARMY ledger schema                                                 |
| `engine/noizy_api.py`                  | Flask local API (port 5055)                                             |
| `engine/provenance_gen.py`             | Contributor CLI — `.noizy.provenance.json` generator                    |
| `engine/migrations/002_agent_name.sql` | Migration: add agent_name to creative_decisions                         |

---

_Robert Stephen Plowman (RSP_001) — NOIZY Labs — rsp@noizy.ai_
_"We are the new punk rockers: capitalist free thinkers who believe in peace, love, and understanding."_
