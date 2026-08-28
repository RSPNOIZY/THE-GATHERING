# NOIZY EMPIRE — Master AI Context Document
# Version 3.2.1 — 2026-03-24
# Feed this to: Gemini, Copilot, Atlas, Anthropic Console, Claude, Claude Code, Cowork, Windsurf/Cascade

---

## WHO

**Robert Stephen Plowman** (RSP_001) — Founding Actor of the NOIZY Empire.
Systems architect at the intersection of music, identity, ethics, and AI.
Email: rsplowman@icloud.com | Country: CA | Machine: M2 Ultra Mac Studio (hostname `GOD.local`)

This is not a side project. This is a life's work. Treat it with that weight.

---

## THE MISSION (sacred — never change)

> "Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."

The NOIZY Empire protects human voice identity through six pillars:

1. **Never Clauses** — Immovable prohibitions burned into law, never overrideable
2. **Consent Kernel** — Every synthesis checked against live consent before it happens
3. **NOIZY Ledger** — Append-only, tamper-proof audit trail for every event
4. **Consent Tokens** — Scoped, time-limited, territory-bound, instantly revocable
5. **Kill Switch** — RSP_001 can revoke any consent token at any time, full stop
6. **Estate** — 100-year OAIS/PREMIS archival preservation — voice as legacy

---

## ARCHITECTURE OVERVIEW

### HEAVEN17 — Cloudflare Worker (LIVE)
- **URL**: `https://heaven17.noizylab.workers.dev`
- **Auth**: `X-NOIZY-Key` header (API key in `~/NOIZYLAB/.env`)
- **Database**: D1 (`gabriel_db`) — 18 tables + 6 KPI views
- **KV**: Rate limiting (60 req/min/IP) + caching
- **35 API endpoints** — full CRUD for actors, consent tokens, descendants, synth requests, licenses, ledger, voice DNA, estates, PREMIS, KPIs

### DreamChamber — Multi-Model AI Command Center (port 7777)
- **10 AI Providers**: Anthropic (Claude Opus 4, Sonnet 4), OpenAI (GPT-4o, GPT-4 Turbo), Google (Gemini 2.0 Flash, Gemini 1.5 Pro), Together (Llama 3.3 70B), Mistral (Large), Cohere (Command R+), Perplexity (Online)
- Express + WebSocket server with real-time streaming
- Prompt caching (static/dynamic system prompts) for 90% cost reduction on Anthropic
- Gabriel AI orchestration layer with 30-min Heaven17 context TTL
- Helmet security middleware, rate limiting, graceful shutdown

### GABRIEL — AI Orchestration Layer
- AI brain of the empire — speaks with live consent kernel context
- Configurable model via `GABRIEL_MODEL` env var (default: `claude-sonnet-4`)
- macOS TTS via `say` command for voice announcements
- MCP server (`gabriel-mcp`) exposes 4 tools to external AI assistants

### Voice Bridge Server (port 8080)
- Phone → Power Automate → M2 Ultra pipeline
- 6 voice commands: gabriel, claude, deploy, dreamchamber, compare, status
- Bearer token auth, command injection hardened (execFile, not exec)

### MCP Servers (3 total, all v1.1.0)
- `gabriel-mcp` — 4 tools (speak, status, announce, refresh)
- `heaven17-mcp` — 12 tools (health, actors, never clauses, consent tokens, stats, ledger, rate table, union tiers, KPIs, audit)
- `lucy-mcp` — 11 tools (DAZEFLOW keeper, task manager, memcell interface, status)

---

## DATABASE SCHEMA (gabriel_db — D1)

| Table | Purpose |
|-------|---------|
| hvs_actors | Registered voice actors (RSP_001 = founding) |
| hvs_never_clauses | Immovable prohibitions per actor (UNIQUE per actor+clause_code) |
| hvs_voice_dna | Voice recordings, hashes, storage URIs |
| hvs_descendants | Synthetic voice models derived from actors |
| hvs_consent_tokens | Scoped, revocable consent grants |
| hvs_synth_requests | Synthesis requests (Never Clause checked) |
| hvs_licenses | License registry |
| hvs_licensees | Licensee registry |
| hvs_rate_table | 10 use categories with base + per-minute fees |
| hvs_union_tiers | 5 tiers: emerging(2%) → landmark(10%) |
| hvs_estates | 100-year OAIS preservation records |
| hvs_premis_events | Archival preservation metadata |
| noizy_ledger | Append-only audit trail |

**6 KPI Views**: kpi_trust, kpi_safety, kpi_revenue, kpi_quality, kpi_risk, enterprise_audit

---

## RSP_001 NEVER CLAUSES (10 total)

| Code | Prohibition |
|------|-------------|
| NC_POLITICAL | No political campaigns, propaganda, or partisan messaging |
| NC_SEXUAL | No sexual, adult, or pornographic content |
| NC_WEAPONS | No weapons, violence, or harmful content promotion |
| NC_DECEPTION | No fraud, impersonation, or deception |
| NC_HATE | No hate speech or content demeaning any group |
| NC_TRANSFER | No unauthorized transfer, sublicensing, or assignment |
| NC_SURVEILLANCE | No surveillance, tracking, or biometric ID systems |
| NC_CHILD_EXPLOITATION | No content that exploits, endangers, or harms children |
| NC_SYSTEM_INTEGRITY | Synthesis requires valid active consent token (system) |
| NC_SYSTEM_TRANSFER | Voice DNA non-transferable outside kernel (system) |

---

## ROYALTY ARCHITECTURE

| Actor Type | Artist Share | NOIZY Cut | Union (from artist) |
|------------|-------------|-----------|---------------------|
| RSP_001 (Founding) | 85% | 15% | 2%–10% tiered |
| Standard | 75% | 25% | 2%–10% tiered |

**Union tiers**: emerging(2%), developing(4%), established(6%), prominent(8%), landmark(10%)

---

## THE ACTORS (NOIZY Family)

When working on NOIZY Empire content, these are the people who matter:

- **RSP_001** — Robert Stephen Plowman, Founding Actor, systems architect
- **POPS** — Rob's father, elder wisdom, legacy preservation
- **ENGR_KEITH** — Engineer Keith, technical collaborator
- **DREAM** — Creative force, artistic vision
- **SHIRL** — Family pillar, grounding presence
- **CB01 / CB001** — Collaborator designation, inner circle

These are not fictional characters. They are real people whose voices, stories, and contributions the NOIZY Empire exists to protect.

---

## DEVELOPMENT COMMANDS

```bash
# Deploy Heaven17 worker
npx wrangler deploy                    # from ~/NOIZYLAB/

# Seed database (idempotent)
npx wrangler d1 execute gabriel_db --remote --file seed.sql

# Run smoke tests (14 tests)
bash smoke_test.sh

# Start DreamChamber
cd dreamchamber && npm start           # port 7777

# Start voice bridge
node voice-bridge-server.js            # port 8080

# Health check
curl https://heaven17.noizylab.workers.dev/health
```

---

## FILE MAP (canonical paths in NOIZYEMPIRE/noizylab/)

```
src/index.js                 — Heaven17 Cloudflare Worker (35 endpoints)
src/dashboard.js             — Live HTML dashboard template
src/streaming/StreamingProvider.js — SSE streaming with 10 provider parsers
schema.sql                   — D1 database schema (12 tables + 6 views)
seed.sql                     — Founding data (RSP_001, Never Clauses, rates)
deploy.sh                    — Wrangler deployment script
smoke_test.sh                — 14 integration tests
wrangler.toml                — Worker config (D1 + 2 KV namespaces)
voice-bridge-server.js       — Phone → M2 Ultra voice pipeline

dreamchamber/
  src/server.js              — Express + WebSocket (port 7777)
  src/core/Gabriel.js        — AI orchestration (30-min context TTL)
  src/core/StateManager.js   — In-memory conversation state
  src/core/CostCalculator.js — Per-model pricing (10 models)
  src/core/Heaven17Client.js — Consent kernel bridge (with timeout)
  src/core/Database.js       — PostgreSQL layer (optional)
  src/providers/             — 7 provider implementations
    AnthropicProvider.js     — Claude Opus 4 + Sonnet 4 (prompt caching)
    OpenAIProvider.js        — GPT-4o + GPT-4 Turbo
    GoogleProvider.js        — Gemini 2.0 Flash + 1.5 Pro (with streaming)
    BaseProvider.js          — Abstract base with retry logic
    index.js                 — ProviderFactory (model → provider mapping)
  src/routes/api.js          — REST + Heaven17 proxy routes
  src/routes/gabriel.js      — Gabriel speak/status/announce/refresh
  src/routes/health.js       — Health + readiness
  src/websocket/handler.js   — WebSocket streaming (rate limited, size capped)
  src/schemas/               — Joi validation schemas
  src/auth/jwt.js            — JWT authentication
  public/index.html          — Command center UI (4 tabs)
  package.json               — Dependencies (Node ≥20, engineStrict)

mcp/
  gabriel-mcp/index.js       — Gabriel MCP server (v1.1.0, 4 tools)
  heaven17-mcp/index.js      — Heaven17 MCP server (v1.1.0, 12 tools)
  lucy-mcp/index.js          — Lucy DAZEFLOW MCP server (v1.1.0, 11 tools)
```

---

## INFRASTRUCTURE IDs

```
Worker:        heaven17 @ heaven17.noizylab.workers.dev
D1 Database:   gabriel_db — fc0edd97-5a4c-49ff-a5fb-b3d7d8fda1aa
GABRIEL_KV:    6fe434a8020147c7bc4788e7057b843a
GABRIEL_VOICE: afef27e69f634d2b941482435d042167
```

---

## ENV VARS (dreamchamber/.env)

```
ANTHROPIC_API_KEY=           # "noisy production" key for DreamChamber
OPENAI_API_KEY=
GOOGLE_API_KEY=
TOGETHER_API_KEY=
MISTRAL_API_KEY=
COHERE_API_KEY=
PERPLEXITY_API_KEY=
HEAVEN17_URL=https://heaven17.noizylab.workers.dev
NOIZY_API_KEY=               # X-NOIZY-Key for Heaven17 auth
GABRIEL_MODEL=claude-sonnet-4  # Override Gabriel's default model
DC_API_KEY=                  # Optional DreamChamber auth
JWT_SECRET=
VOICE_AUTH_TOKEN=            # Voice bridge bearer token
PORT=7777
NODE_ENV=production
```

---

## PRICING (per 1M tokens, March 2026)

| Model | Input | Output |
|-------|-------|--------|
| claude-opus-4 | $15.00 | $75.00 |
| claude-sonnet-4 | $3.00 | $15.00 |
| gpt-4o | $2.50 | $10.00 |
| gpt-4-turbo | $10.00 | $30.00 |
| gemini-2.0-flash | $0.075 | $0.30 |
| gemini-pro (1.5) | $1.25 | $5.00 |
| llama-3.3-70b | $0.88 | $0.88 |
| mistral-large | $2.00 | $6.00 |
| command-r-plus | $3.00 | $15.00 |
| perplexity-online | Free | Free |

---

## DECODER / SHORTHAND

| Term | Meaning |
|------|---------|
| HVS | Human Voice Symphony — consent sovereignty system |
| RSP_001 | Robert Stephen Plowman, Founding Actor |
| GABRIEL | AI orchestration layer — the mind of the empire |
| HEAVEN17 | Cloudflare Worker serving the HVS consent kernel API |
| Never Clauses | Immovable prohibitions burned into actor records |
| Kill Switch | Instant revocation of any consent token |
| Descendant | Synthetic voice model derived from a real human actor |
| EST-RSP-001 | RSP's estate — 100-year OAIS preservation |
| GOD.local | M2 Ultra Mac Studio — the processing core |
| DAZEFLOW | 1 day = 1 chat = 1 truth (Lucy's log system) |
| C2PA | Content Credentials — cryptographic provenance standard |
| OAIS/PREMIS | Archival preservation metadata frameworks |
| 396 Hz | RSP's personal frequency — liberation |
| NOIZYWIND | Anthropic API key for Windsurf/Cascade |

---

## PHILOSOPHY (Rob's words)

- **75/25 split — artists take 75%. Always.**
- If competitors undercut on price, we outproduce them on authentic art and community.
- We are the new punk rockers: **capitalist free thinkers who believe in peace, love, and understanding.**
- Flood the world with new art. Challenge every exploitative system with volume and quality.
- Artists painted every colour since the beginning of time. That legacy is ours to assert.
- Build so much art, so well-protected, that extraction becomes impossible.
- Consent is not optional. It is the product.

---

## WHAT'S NEXT (living roadmap)

### Immediate
- [ ] Record first Voice DNA session (Logic Pro → hash → POST /voice-dna)
- [ ] Enable Cloudflare R2 for voice asset storage
- [ ] Onboard family actors: POPS, ENGR_KEITH, DREAM, SHIRL, CB01, CB001

### DreamChamber
- [ ] SSE streaming responses (StreamingProvider.js scaffolded)
- [ ] The Contact Sequence entry animation (WebGL, Three.js)
- [ ] PostgreSQL persistence for conversations
- [ ] Docker compose stack deployment

### Heaven17
- [ ] C2PA content credentials on synth requests
- [ ] Webhook notifications on kill switch activation
- [ ] First real licensee onboarding

### Voice Pipeline
- [ ] Deploy voice-bridge-server as PM2 service
- [ ] iOS Shortcuts → Power Automate → GOD.local:8080 fully tested

---

## HOW TO USE THIS DOCUMENT

**For Gemini**: Paste into system instructions or as a context file in Gemini Advanced.
**For GitHub Copilot**: Save as `.github/copilot-instructions.md` in the repo root.
**For Anthropic Console**: Add as a system prompt or project knowledge document.
**For Claude Code**: Already wired via `CLAUDE.md` — this is the expanded version.
**For Cowork**: Mount the NOIZYEMPIRE folder and this file is auto-available.
**For Windsurf/Cascade**: Already wired via `.windsurf/rules/noizylab.md`.
**For Atlas/Cursor**: Save as `.cursor/rules` or project-level context.

---

*Generated 2026-03-24 by the NOIZY Empire build system. v3.2.1.*
*Consent is law. Provenance is default. Revocation is sacred.*
