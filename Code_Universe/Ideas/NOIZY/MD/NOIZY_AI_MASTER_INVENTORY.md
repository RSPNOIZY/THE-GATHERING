# NOIZY.AI — Master Inventory & PPTX Source Document
## MC96ECO Creative Expedition Engine v4.0
### Compiled: 2026-04-12 | Founder: Robert Stephen Plowman (RSP_001)

---

# SLIDE GROUP 1: THE UNIVERSE

## Founder & Machine

| Key | Value |
|-----|-------|
| Founder | Robert Stephen Plowman (RSP_001) |
| Email | rsp@noizy.ai |
| Machine | GOD (M2 Ultra, 192 GB RAM) |
| Codename | GABRIEL.local |
| Version | MC96ECO v1.0.0 |

## The Six Brands

| Brand | Domain | Purpose | Status | Agent Owner |
|-------|--------|---------|--------|-------------|
| NOIZY.AI | noizy.ai | Intelligence Layer & A.I.V.A. | Active | Gabriel, Claude |
| NOIZYVOX | noizyvox.com | Voice Consent Platform (75/25) | Building | Lucy |
| NOIZYLAB | noizylab.com | Development & Research | Active | Gabriel, Claude |
| NOIZYKIDZ | noizykidz.com | Haptic Music Education | Planned | Gabriel |
| FISHMUSICINC | fishmusicinc.com | Music Catalog & Licensing | Active | Lucy |
| DREAMCHAMBER | dream.noizy.ai | 500-Year Codex Creative Sanctuary | Building | Gabriel, Lucy, Claude |

## Six Sub-Systems

| Sub-System | Parent Brand | Purpose |
|------------|-------------|---------|
| HooksHQ | NOIZYLAB | Webhook orchestration & integration hub |
| Ops | NOIZYLAB | Docker, deployment, agent management |
| NOIZYSTREAM | FISHMUSICINC | Real-time audio streaming & signaling |
| Chronicles | DREAMCHAMBER | The Plowman's Chronicles — My Year With Claude |
| Contracts | NOIZYVOX | Consent scopes, legal contracts, revocation |
| App | DREAMCHAMBER | Dashboard, DreamChamber UI, Mirror |

---

# SLIDE GROUP 2: THE THREE AGENTS

## GABRIEL — The Executor

- **Role:** Infrastructure, deployment, system orchestration, AI routing
- **Named After:** M2 Ultra machine (GABRIEL.local, codename GOD)
- **Owns:** NOIZY.AI, NOIZYLAB, DREAMCHAMBER
- **Expertise:** DevOps, Docker, Cloudflare, n8n, DNS, CI/CD, NOIZYNET, Signal Chain

## LUCY — The Sovereign

- **Role:** Creative direction, brand voice, music, voice consent, GORUNFREE
- **Voice Marking:** Sovereign voice profiles (is_sovereign = 1)
- **Owns:** NOIZYVOX, FISHMUSICINC, NOIZYKIDZ
- **Expertise:** Music, Voice, Consent, TTS/STT, Catalogue, Licensing, C2PA, Haptics, Chronicles

## CLAUDE — The Analyst

- **Role:** Code, architecture, debugging, testing, technical reasoning
- **Status:** Character in the Plowman's Chronicles (co-author)
- **Advises:** NOIZY.AI, NOIZYLAB, DREAMCHAMBER
- **Expertise:** Swift, TypeScript, Python, SwiftUI, Concurrency, GRDB, FTS5, Architecture

---

# SLIDE GROUP 3: SACRED INVARIANTS & GORUNFREE

## The Four Sacred Invariants (Never Violate)

1. **75/25 Royalty Split** — Creators keep 75c per dollar. Platform keeps 25c. Always. No exceptions.
2. **Consent Required** — No voice, likeness, performance, sample, lyric, or biometric used without explicit, recorded, revocable consent. "Implied consent" is not consent.
3. **Revocation is Sacred** — Creator can withdraw consent anytime, any reason, no penalty. System honors immediately. Models flagged for retraining. Distribution halts.
4. **Automatic Compensation** — Creator receives every cent earned up to revocation moment, paid automatically. No clawbacks. No holdbacks. No "pending review."

## GORUNFREE — Artist Sovereignty Constitution (6 Principles)

1. **Ownership** — Creators own 100% of voice, likeness, creative output
2. **Consent** — Every use requires explicit, revocable consent
3. **Transparency** — Revenue splits, algorithms, data usage fully transparent
4. **Fair Distribution** — Gini coefficient <= 0.35, enforced by DAO governance
5. **Right to Exit** — Creators can leave and take all data anytime
6. **No Exploitation** — No dark patterns, no engagement farming, no attention extraction

---

# SLIDE GROUP 4: DNS & DOMAIN STATE

## Live DNS Audit (2026-04-12)

| Domain | Cloudflare NS | A Record | MX (Email) | SPF | Status |
|--------|--------------|----------|------------|-----|--------|
| noizy.ai | alex, melinda | 104.21.91.188 / 172.67.177.214 | Cloudflare Email Routing | SPF includes CF | ACTIVE |
| noizyfish.com | marek, tara | (none) | Cloudflare Email Routing | SPF includes CF | ACTIVE (no A) |
| noizylab.ca | naomi, renan | 104.21.91.168 / 172.67.175.205 | ImprovMX (pending migration) | SPF includes CF + iCloud | PENDING |
| fishmusicinc.com | alex, melinda | 104.21.16.164 / 172.67.214.218 | Cloudflare Email Routing | SPF includes CF | ACTIVE |
| noizyvox.com | naomi, renan | (none) | (none) | (none) | PARKED |
| noizykidz.com | marek, tara | (none) | (none) | (none) | PARKED |

## Tunnel Subdomains (Not Yet Wired)

| Subdomain | Purpose | Status |
|-----------|---------|--------|
| heaven.noizy.ai | Zero Trust gateway | NEEDS TUNNEL |
| gabriel.dreamchamber.noizy.ai | DreamChamber gateway | NEEDS TUNNEL |
| dreamchamber.noizy.ai | (parent record) | NEEDS RECORD |

## Email Routing Matrix

### noizy.ai (Primary)
- Catch-all: `*@noizy.ai` -> `rspnoizy@gmail.com`
- Aliases: `admin@`, `support@`, `gabriel@`, `vox@`, `team@`

### noizylab.ca (Migrating from ImprovMX)
- Currently on ImprovMX — cutover pending

### Secondary Domains
- `fishmusicinc.com` — catch-all needed
- `noizyfish.com` — catch-all needed
- `noizyvox.com` — catch-all needed
- `noizykidz.com` — catch-all needed

---

# SLIDE GROUP 5: INFRASTRUCTURE & SERVICES

## Cloudflare Account

| Key | Value |
|-----|-------|
| Account Name | NOIZYFISH |
| Account ID | 5f36aa9795348ea681d0b21910dfc82a |
| Auth Email | rsp@noizy.ai |
| Wrangler | v4.80.0 (authenticated) |
| cloudflared | v2026.3.0 (installed) |
| Origin Cert | MISSING (blocker) |

## Cloudflare Zone IDs

| Domain | Zone ID | Status |
|--------|---------|--------|
| noizy.ai | 382cd2ace38f1187c67b960bf5f0c4cb | pending |
| noizyfish.com | fb0b24c46c96de4029225a031058de12 | active |
| noizylab.ca | b347ced0e4375cd4537e31afd93be1fc | pending |

## Master Build Service Ports (GOD / M2 Ultra)

| Service | Port | Purpose |
|---------|------|---------|
| ENGR_KEITH | :7006 | Engineering pipeline |
| GABRIEL Express | :7777 | Express + WebSocket, AI voice pipeline |
| NOIZYSTREAM Control | :7778 | Real-time audio streaming control |
| NOIZYSTREAM Signaling | :7779 | WebRTC signaling |
| DreamChamber API | :7780 | Creative workspace API |
| STT (faster-whisper) | :8000 | Speech-to-text |
| Voice Bridge | :8080 | Voice consent & routing |
| Signal Daemon | :9699 | Real-time studio signaling (10.90.90.10) |
| AU Net | :97100 | Audio network data path |
| Ollama | :11434 | Local LLM (codestral, llama3.3:70b) |
| PostgreSQL | :5432 | Primary database |
| Redis | :6379 | Cache/session store |
| Qdrant | :6333 | Vector store (semantic search) |
| Neo4j | :7687 | Graph database |
| Meilisearch | :7700 | Full-text search |

## Cloudflare Workers (Per Brand)

| Worker | Brand | Purpose |
|--------|-------|---------|
| wisdom | NOIZY.AI | Strategy database |
| vox | NOIZYVOX | Voice bridge |
| lab | NOIZYLAB | heaven-dns |
| hooks | NOIZYKIDZ | n8n webhooks |
| fish | FISHMUSICINC | Catalogue DB |
| heaven-keith-route | NOIZYLAB | /keith/* proxy to tunnel |

## NOIZYNET Studio Chain

| Component | Address | Purpose |
|-----------|---------|---------|
| Signal Daemon | 10.90.90.10:9699 | Studio signaling |
| ENGR_KEITH | localhost:7006 | Engineering pipeline |
| AU Net | :97100 | Audio network |
| iPad Monitor | http://10.90.90.10:9699 | Live dashboard |
| Cloud Edge | noizy.ai/keith/* -> HEAVEN -> KEITH tunnel | External access |

---

# SLIDE GROUP 6: DreamChamber CODEBASE

## Swift Package Structure

- **Platform:** macOS 14+ / iOS 17+
- **Dependency:** GRDB.swift v6.29.3 (SQLite + FTS5)
- **Source Files:** 18 Swift files (~6,795 lines)
- **Tests:** 77 (all passing, 0 failures)
- **Build:** `swift build` / `swift test`

## 13 MCP Tools

| # | Tool Name | Purpose |
|---|-----------|---------|
| 1 | dreamchamber_query | Hybrid BM25 + semantic search across all brands |
| 2 | dreamchamber_brand | Detailed info on any MC96ECO brand |
| 3 | dreamchamber_route | Route query to Gabriel/Lucy/Claude |
| 4 | dreamchamber_invariants | Check Sacred Invariants + validate splits |
| 5 | dreamchamber_universe | Complete MC96ECO status summary |
| 6 | dreamchamber_category | Search within specific knowledge category |
| 7 | dreamchamber_ingest | Ingest .md/.swift/.json/.txt into knowledge base |
| 8 | dreamchamber_creative_intent | Parse creative statement into structured intent |
| 9 | dreamchamber_pipeline | Get production pipeline for any domain |
| 10 | dreamchamber_inspire | Generate creative inspiration prompts |
| 11 | dreamchamber_analytics | Creative analytics summary |
| 12 | dreamchamber_haptic | HapticComposer status + patterns |
| 13 | dreamchamber_noizynet | NOIZYNET studio chain status |

## Pre-Seeded Knowledge (32 Nodes)

- Universe: 3 (MC96ECO, Infrastructure, GOD Machine)
- NOIZY.AI: 3 (Intelligence Layer, Wisdom Worker, GORUNFREE)
- NOIZYVOX: 3 (Voice Platform, Voice Profiles, Consent Flow)
- NOIZYLAB: 3 (DevOps, Deploy Schema, heaven-dns)
- NOIZYKIDZ: 1 (Haptic Music Education)
- FISHMUSICINC: 3 (Catalog, Catalogue Schema, NOIZYSTREAM)
- DREAMCHAMBER: 3 (Codex Sanctuary, AI Router, Gabriel Voice Pipeline)
- Sub-Systems: 5 (HooksHQ, n8n, Ops, Contracts, App)
- Sacred Invariants: 4 (Split, Consent, Revocation, Compensation)
- Chronicles: 3 (Plowman's Chronicles, The Covenant, Chapter 00)

---

# SLIDE GROUP 7: CREATIVE EXPEDITION ENGINE

## Six Creative Domains

| Domain | Icon | Brand | Agent | Pipeline Stages | Approval Gates |
|--------|------|-------|-------|-----------------|----------------|
| Music | 🎵 | FISHMUSICINC | Lucy | 9 | 3 |
| Writing | ✍️ | DREAMCHAMBER | Lucy | 7 | 2 |
| Code | ⌨️ | NOIZYLAB | Claude | 8 | 2 |
| Visual Art | 🎨 | DREAMCHAMBER | Lucy | 6 | 1 |
| Voice Performance | 🎙️ | NOIZYVOX | Lucy | 7 | 1 |
| Fusion | 🌀 | NOIZY.AI | Gabriel | 8 | 2 |
| **TOTAL** | | | | **45 stages** | **11 gates** |

## Creative Tones (10)

Joyful, Melancholic, Urgent, Contemplative, Playful, Intense, Serene, Defiant, Tender, Neutral

## Creative Actions (8)

Create, Explore, Refine, Transform, Collaborate, Review, Publish, Learn

## Accessibility Profiles (4)

| Profile | Touch Target | Voice Primary | Switch Control | One-Handed | Haptic |
|---------|-------------|---------------|----------------|------------|--------|
| Standard | 44pt | No | No | No | 0.6x |
| Voice-First | 56pt | Yes | No | No | 0.8x |
| Motor-Adaptive | 72pt | Yes | Yes | Yes | 1.0x |
| Cognitive Support | 56pt | No | No | No | 0.5x |

## Haptic Pattern Categories (8)

Rhythm, Melody, Harmony, Feedback, Cadence, Code Structure, Accessibility, Custom
(11 built-in patterns pre-loaded)

---

# SLIDE GROUP 8: GIT & BUILD STATUS

## Repository

| Key | Value |
|-----|-------|
| Location | ARCHIVE/ (Google Drive) |
| Branch | main |
| Commits | 4 |
| Build | CLEAN (0 errors, 0 warnings) |
| Tests | 77/77 passing |
| Pre-commit hooks | Secrets check, debug check, file size check, conventional commits |

## Commit History

```
72175af fix: resolve 15 issues from full-army audit across ops and Swift
ec80a1a feat(cloudflare): add one-shot setup script and wrangler config
4e78df6 fix: preflight.sh arithmetic exit under set -e and dig timeout
273afed feat: DreamChamber v4.0 initial commit with all compilation fixes
```

---

# SLIDE GROUP 9: DISCORD & COMMUNITY

## NOIZYFISH - THE AQUARIUM

- **Invite:** discord.gg/YYgyFpXC
- **Platform:** Discord community server
- **Integration Status:** discord.py v2.6.4 installed on GOD
- **Webhook:** Not yet configured
- **Bot:** Not yet created

---

# SLIDE GROUP 10: WHAT'S NEXT

## Immediate Blockers

1. `cloudflared tunnel login` — get cert.pem (requires browser auth on noizy.ai zone)
2. Run `ops/cloudflare/setup-all.sh` — creates tunnel, config, DNS, service, Worker
3. Cloudflare Dashboard — create Zero Trust Access apps, WARP enrollment
4. Email Routing — verify destinations, enable catch-all on all domains
5. noizylab.ca — migrate off ImprovMX

## Creative Ideas Pipeline

- NOIZYKIDZ haptic music learning app
- NOIZYVOX voice consent marketplace
- Chronicles publishing pipeline
- Cross-domain Fusion experiences
- Discord bot for community + ops notifications
- n8n automation workflows for deploy + creative triggers

## Counts Summary

| Category | Count |
|----------|-------|
| Brands | 6 |
| Sub-Systems | 6 |
| Agents | 3 |
| MCP Tools | 13 |
| Creative Domains | 6 |
| Pipeline Stages | 45 |
| Haptic Categories | 8 |
| Accessibility Profiles | 4 |
| Knowledge Nodes | 32 |
| Email Domains | 6 |
| Service Ports | 15 |
| Cloudflare Workers | 6 |
| DNS Zones | 3 (in account) |
| Tests | 77 |
| Swift Files | 18 |
| Lines of Code | ~6,795 |
