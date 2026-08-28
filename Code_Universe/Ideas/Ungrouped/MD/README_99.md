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

## Part of the NOIZY Empire

| Brand | Role |
|---|---|
| [NOIZY.AI](https://noizy.ai) | Sovereign AI infrastructure |
| [NOIZYFISH](https://noizyfish.com) | Producer ecosystem |
| [NOIZYKIDZ](https://noizykidz.com) | Youth division |
| [NOIZYVOX](https://noizyvox.com) | Voice + schema core |
| [NOIZYLAB](https://noizylab.ca) | Research + shared tooling |
| [DREAMCHAMBER](https://github.com/RSPNOIZY/DREAMCHAMBER) | Creative residency |
| [THE-OLD-GUARD](https://github.com/RSPNOIZY/THE-OLD-GUARD) | Legacy artist catalog |
| [THE-GATHERING](https://github.com/RSPNOIZY/THE-GATHERING) | Community gathering point |
| [NOIZYANTHROPIC](https://github.com/RSPNOIZY/NOIZYANTHROPIC) | AI governance + doctrine |
| [THE-AQUARIUM](https://github.com/RSPNOIZY/THE-AQUARIUM) | Audio vault -- CLIENT#1 RSP001 |

**killSwitchHolder:** RSP_001 | **covenant:** 75/25 | **canon:** noizy.ai
 
