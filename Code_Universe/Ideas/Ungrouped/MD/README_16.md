# NOIZYLAB — The NOIZY Empire

> **Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic.**

HEAVEN is the core consent kernel for NOIZY.AI — a voice actor rights management platform built on Cloudflare's edge infrastructure. Zero servers, zero monthly cost, global latency.

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                  CLOUDFLARE EDGE                     │
│                                                      │
│  ┌──────────┐  ┌──────────┐  ┌──────────────────┐  │
│  │ HEAVEN │──│ GABRIEL_DB│  │ GABRIEL_KV       │  │
│  │ Worker   │  │ (D1/SQL) │  │ (Cache + Limits) │  │
│  └────┬─────┘  └──────────┘  └──────────────────┘  │
│       │                                              │
│  ┌────┴──────────────────────────────────────────┐  │
│  │  /health  /dashboard  /api/v1/*               │  │
│  │  Rate Limiting · Auth · KV Cache              │  │
│  └───────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────┐
│               DREAMCHAMBER (local)                   │
│  Express + WebSocket · Multi-model AI interface      │
│  Anthropic · OpenAI · Google · Cohere · Mistral      │
│  Port 7777 · http://localhost:7777                   │
└─────────────────────────────────────────────────────┘
```

## Quick Start

```bash
# Deploy HEAVEN to Cloudflare
npm run deploy

# Seed the database (first time only)
npm run seed

# View live dashboard
open https://heaven.rsp-5f3.workers.dev/dashboard

# Run smoke tests (13 tests)
npm run smoke

# Tail logs in real-time
npm run tail
```

## Live Endpoints

| Endpoint | Auth | Description |
|---|---|---|
| `GET /` | No | API index with all endpoints |
| `GET /health` | No | System health + counts |
| `GET /dashboard` | No | Live HTML command center |
| `GET /api/v1/actors` | Yes | List all actors |
| `POST /api/v1/actors` | Yes | Register new actor |
| `GET /api/v1/actors/:id` | Yes | Get actor details |
| `GET /api/v1/actors/:id/never-clauses` | Yes | Actor's sacred boundaries |
| `GET /api/v1/actors/:id/descendants` | Yes | Actor's voice descendants |
| `GET /api/v1/actors/:id/consent-tokens` | Yes | Actor's consent tokens |
| `POST /api/v1/consent-tokens` | Yes | Issue consent token |
| `POST /api/v1/consent-tokens/:id/revoke` | Yes | Kill switch — revoke consent |
| `POST /api/v1/descendants` | Yes | Register voice descendant |
| `POST /api/v1/synth-requests` | Yes | Request voice synthesis |
| `POST /api/v1/licenses` | Yes | Issue commercial license |
| `GET /api/v1/ledger` | Yes | Immutable audit trail |
| `GET /api/v1/rate-table` | Yes | Compensation rate schedule |
| `GET /api/v1/stats` | Yes | System-wide statistics |
| `GET /api/v1/kpi/*` | Yes | Trust/Safety/Revenue/Quality/Risk KPIs |
| `GET /api/v1/enterprise/audit` | Yes | Enterprise audit view |

## Authentication

All `/api/v1/*` endpoints require the `X-NOIZY-Key` header:

```bash
curl -H "X-NOIZY-Key: YOUR_KEY" https://heaven.rsp-5f3.workers.dev/api/v1/actors
```

Or use `Authorization: Bearer YOUR_KEY`.

## Infrastructure (All Free Tier)

| Resource | Service | Cost |
|---|---|---|
| HEAVEN Worker | Cloudflare Workers | $0 |
| GABRIEL_DB | Cloudflare D1 (SQLite) | $0 |
| GABRIEL_KV | Cloudflare KV (cache + rate limits) | $0 |
| GABRIEL_VOICE | Cloudflare KV (voice data) | $0 |
| DNS | Cloudflare DNS | $0 |
| Email Routing | Cloudflare Email Routing | $0 |
| **Total** | | **$0/month** |

## Project Structure

```
NOIZYLAB/
├── src/
│   ├── index.js              # HEAVEN worker (main router)
│   ├── dashboard.js           # Live HTML dashboard
│   └── streaming/
│       └── StreamingProvider.js
├── dreamchamber/              # Multi-model AI interface
│   ├── src/
│   │   ├── server.js          # Express + WebSocket server
│   │   ├── core/              # State management
│   │   ├── providers/         # AI model providers
│   │   ├── routes/            # API + health routes
│   │   └── websocket/         # Real-time handlers
│   └── package.json
├── schema.sql                 # D1 database schema
├── seed.sql                   # Founding actor + never clauses + rates
├── smoke_test.sh              # 13-test validation suite
├── wrangler.toml              # Cloudflare Worker config
├── DNS_EMAIL_MIGRATION.md     # DNS + email migration runbook
├── package.json               # Root scripts
├── .env.example               # Environment template
└── .gitignore
```

## Core Concepts

- **Actor** — A real human whose voice is being protected (e.g., RSP_001)
- **Never Clause** — A sacred, immutable boundary that can never be crossed (e.g., no political use)
- **Consent Token** — A cryptographic grant of permission for specific voice use
- **Descendant** — A synthetic voice derived from an actor's voice DNA
- **Kill Switch** — Instant revocation of all consent, effective immediately
- **Synth Request** — A request to use a voice, checked against never clauses and consent
- **Ledger** — Immutable audit trail of every event in the system

## Domains

| Domain | Purpose |
|---|---|
| noizy.ai | Primary brand |
| noizyfish.com | Production company |
| noizy.com | Legacy/redirect |
| noizybox.com | Product line |

---

*Built by RSP. Protected by HEAVEN.*

---

## Setup & Local Development

### Prerequisites

- **Node.js ≥ 20** — `node --version`
- **Wrangler v4** — installed as a devDependency (`npx wrangler --version`)
- A Cloudflare account with D1, KV, and R2 enabled

### First-Time Setup

```bash
# 1. Install root dependencies
npm install

# 2. Authenticate with Cloudflare
npx wrangler login

# 3. Create KV namespaces (needed for FEATURE_FLAGS and GAP_SOLVER bindings)
npx wrangler kv namespace create FEATURE_FLAGS
npx wrangler kv namespace create GAP_SOLVER

# 4. Update wrangler.toml with the IDs printed by the commands above
#    Replace FEATURE_FLAGS_PLACEHOLDER and GAP_SOLVER_PLACEHOLDER

# 5. Set required secrets
npx wrangler secret put NOIZY_API_KEY
npx wrangler secret put ANTHROPIC_API_KEY   # required for Claude in Heaven

# 6. Bootstrap the D1 database (first deploy only)
npm run schema   # creates all tables
npm run seed     # inserts founding actor + defaults

# 7. Deploy Heaven to Cloudflare
npm run deploy

# 8. Verify deployment
npm run health   # should return {"status":"healthy",...}
npm run smoke    # runs all smoke tests
```

### Webhook Proxy Worker Setup

The `workers/webhook-proxy` worker requires real KV namespace IDs before deploying:

```bash
cd workers/webhook-proxy
npx wrangler kv namespace create WEBHOOK_QUEUE
npx wrangler kv namespace create WEBHOOK_QUEUE --preview
# Update workers/webhook-proxy/wrangler.toml with the printed IDs
npx wrangler deploy
```

### Running Tests

```bash
# Consent gateway tests (GATE 4 in CI)
cd workers/consent-gateway && npm ci && npm test

# CB01 router tests (GATE 5 in CI)
cd workers/cb01-router && npm ci && npm test

# DreamChamber (local server on port 7777)
npm run dc:start
```

### CI / GitHub Actions

All CI checks must pass before merging. The key gates are:

| Workflow | Gate | What it checks |
|---|---|---|
| `noizy-preflight.yml` | GATE 1 | Wrangler config format |
| `noizy-preflight.yml` | GATE 2 | No placeholder IDs in `workers/` configs |
| `noizy-preflight.yml` | GATE 3 | Entry-point files exist |
| `noizy-preflight.yml` | GATE 4 | `workers/consent-gateway` tests pass |
| `noizy-preflight.yml` | GATE 5 | `workers/cb01-router` tests pass |
| `noizy-preflight.yml` | GATE 6 | Auth contract (401/403 split) |
| `ethics-gate.yml` | — | No royalty rates < 75% for creators |
| `edge-core-compliance.yml` | — | Observability, rollback, canary order |
| `deploy.yml` | — | Constitutional audit + D1 migration readiness |

### Troubleshooting

**`fatal: No url found for submodule path`** — This was caused by a stale gitlink in `.claude/worktrees/`. It has been cleaned up. Run `git pull` to get the fix.

**KV namespace IDs showing as `00000000...`** — The webhook-proxy worker uses placeholder IDs. Before deploying it, follow the Webhook Proxy Worker Setup steps above.

**`FEATURE_FLAGS_PLACEHOLDER` / `GAP_SOLVER_PLACEHOLDER` in `wrangler.toml`** — These are in the root Heaven worker config. Create the KV namespaces and replace them before deploying to production.

