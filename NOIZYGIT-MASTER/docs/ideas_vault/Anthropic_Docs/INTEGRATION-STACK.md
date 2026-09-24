# NOIZY Empire — Integration Stack v2

> Docker + n8n (Queue Mode) + PostgreSQL + Redis + Caddy + CF Workers
> Linear + Notion + Zapier + GitHub Actions + Lucy + GABRIEL
> Everything wired. Everything governed. Everything yours.

---

## Architecture v2

```
┌──────────────────────────────────────────────────────────────────────────┐
│                         EXTERNAL SERVICES                                │
│  ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐ ┌────────┐    │
│  │ Linear │ │ Notion │ │ Zapier │ │ GitHub │ │ Stripe │ │ Voice  │    │
│  └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘ └───┬────┘    │
│      └──────────┴──────┬───┴──────────┴──────────┴──────────┘          │
│                        │                                                │
│              ┌─────────▼──────────┐    ┌────────────────────────┐       │
│              │  Webhook Proxy     │    │  GitHub Actions        │       │
│              │  (CF Worker Edge)  │    │  n8n-notify.yml        │       │
│              │  HMAC verification │    │  Push/PR/Deploy/Issue  │       │
│              │  KV queue + drain  │    └──────────┬─────────────┘       │
│              └─────────┬──────────┘               │                     │
│                        │  3-min drain loop        │                     │
└────────────────────────┼──────────────────────────┼─────────────────────┘
                         │                          │
┌────────────────────────┼──────────────────────────┼─────────────────────┐
│                  LOCAL DOCKER STACK (Queue Mode)   │                     │
│                        │                          │                     │
│  ┌─────────────────────▼──────────────────────────▼──────────────────┐  │
│  │                    Caddy Reverse Proxy  (8080/8443)               │  │
│  │              Security headers · Rate limiting · TLS               │  │
│  └──────────────────────────────┬────────────────────────────────────┘  │
│                                 │                                       │
│  ┌──────────────────────────────▼────────────────────────────────────┐  │
│  │                    n8n Main  (port 5678)                          │  │
│  │  ┌──────────┐ ┌──────────┐ ┌──────────┐ ┌──────────────────────┐│  │
│  │  │ ZAP 1-8  │ │ ZAP 9    │ │ ZAP 10   │ │ ZAP 11              ││  │
│  │  │ Core     │ │ Linear   │ │ Zapier   │ │ Notion Dashboard    ││  │
│  │  │ Flows    │ │ ↔ Sync   │ │ Bridge   │ │ ↔ Linear+Deploy    ││  │
│  │  └──────────┘ └──────────┘ └──────────┘ └──────────────────────┘│  │
│  │  ┌──────────────────────────┐ ┌────────────────────────────────┐│  │
│  │  │ ZAP 12 — Master Orch v2 │ │ ZAP 13 — Health Dashboard v2  ││  │
│  │  │ Universal ingest router  │ │ 15-service health matrix      ││  │
│  │  │ Proxy drain → normalize  │ │ Notion + GABRIEL alerts       ││  │
│  │  └──────────────────────────┘ └────────────────────────────────┘│  │
│  └──┬────────┬────────────┬───────────────────────────────────────┘  │
│     │        │            │                                           │
│  ┌──▼────┐ ┌─▼─────┐ ┌───▼────────┐ ┌────────────┐ ┌──────────┐   │
│  │Postgre│ │ Redis │ │ n8n Worker │ │ pg-backup  │ │   STT    │   │
│  │  SQL  │ │ (AOF) │ │ (queue)    │ │ daily/wk/  │ │(Whisper) │   │
│  │       │ │       │ │ execution  │ │ monthly    │ │          │   │
│  └───────┘ └───────┘ └────────────┘ └────────────┘ └──────────┘   │
│                                                                      │
│  ┌───────────────────────────────────────────────────────────────┐   │
│  │                    Lucy Engine                                 │   │
│  │  nightly-analysis.ts → n8n-bridge.ts (HTTP) → n8n webhooks   │   │
│  │  Auto-creates Linear issues · Logs to Notion · Alerts GABRIEL │   │
│  └───────────────────────────────────────────────────────────────┘   │
│                                                                      │
│  ┌────────────────────────────────┐  ┌─────────────────────────────┐│
│  │ CF Workers (Edge)              │  │ Also Running                ││
│  │  • Heaven (noizy.ai)        │  │  • Open WebUI (:3080)       ││
│  │  • Consent Gateway             │  │  • RabbitMQ (:5672/15672)   ││
│  │  • Webhook Proxy               │  │  • Qdrant (:6333/6334)     ││
│  └────────────────────────────────┘  │  • Grafana (:3000)         ││
│                                      │  • Neo4j (:7474/7687)      ││
│                                      │  • Kind K8s (:6443)        ││
│                                      └─────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────┘
```

---

## Quick Start

```bash
# 1. Configure your API keys
cp ops/.env.integrations ops/.env.integrations.local
nano ops/.env.integrations    # ← fill in your keys

# 2. Run the setup script
./scripts/setup-integrations.sh

# 3. Open n8n and import workflows
open http://localhost:5678
# Login: noizylab / noizy-local-2026
```

---

## Services

| Service | Container | Port | Purpose |
|---------|-----------|------|---------|
| **n8n** | `noizy-n8n` | 5678 | Central automation brain — all workflows run here |
| **PostgreSQL** | `noizy-postgres` | 5432 (internal) | Persistent storage for n8n workflows, credentials, executions |
| **Redis** | `noizy-redis` | 6379 (internal) | Queue & cache — ready for n8n worker mode scaling |
| **STT** | `noizy-stt` | 8000 | Faster-Whisper speech-to-text for voice commands |

---

## Workflows

### Core (ZAP 1–8) — Pre-existing

| # | Workflow | Trigger | Action |
|---|----------|---------|--------|
| 1 | GitHub Push → GABRIEL | Webhook | Routes GitHub push events to GABRIEL AI |
| 2 | Stripe → Consent Ledger | Webhook | Logs payments to consent ledger, notifies creators |
| 3 | Voice → DreamChamber | Webhook | Voice commands processed by DreamChamber + GABRIEL |
| 4 | Health Monitor | Schedule (5 min) | Checks all services, alerts on failures |
| 5 | GABRIEL Events → Notion | Webhook | Logs events to Notion database |
| 6 | Consent Killswitch | Webhook | Emergency consent revocation chain |
| 7 | Notion → GitHub Deploy | Webhook | Notion task triggers GitHub + Cloudflare deploy |
| 8 | AI Commit Validation | Webhook | Validates commits against governance rules |

### New Integration (ZAP 9–11)

| # | Workflow | Trigger | Action |
|---|----------|---------|--------|
| **9** | **Linear ↔ NOIZY Sync** | Webhook + Poll (5 min) | New Linear issue → GitHub branch + Notion task. Status changes sync bidirectionally. Done → logs to consent ledger. |
| **10** | **Zapier Bridge** | Webhook | Receives any Zapier hook, categorizes (email/payment/notification/etc.), routes to GABRIEL or Notion log. Outbound hook available for sending events TO Zapier. |
| **11** | **Notion Project Dashboard** | Webhook + Poll (5 min) | Notion project changes sync to Linear. Status = "Deploy" triggers GitHub deployment. Polls for project status summary. |

### Support Workflows

| Workflow | Trigger | Action |
|----------|---------|--------|
| DreamChamber Automation | Webhook | Full Notion → GitHub → Cloudflare pipeline |
| GitHub Deploy Pipeline | Webhook | GitHub push → Cloudflare Workers deploy |
| Heaven Webhook | Webhook + Schedule | Empire-wide orchestration hub |
| Complete Webhook Orchestrator | Webhook + Schedule | Master router: detects source (GitHub/Stripe/Zapier/etc.) |
| Notion Sync Watcher | Schedule (5 min) | Polls Notion for recent changes |

---

## Webhook Endpoints

Once workflows are imported and activated in n8n:

```
POST http://localhost:5678/webhook/linear-webhook     ← Linear webhooks
POST http://localhost:5678/webhook/zapier-bridge       ← Zapier catch hooks
POST http://localhost:5678/webhook/notion-dashboard    ← Notion changes
POST http://localhost:5678/webhook/github-push         ← GitHub push events
POST http://localhost:5678/webhook/stripe-payment      ← Stripe webhooks
POST http://localhost:5678/webhook/voice-command        ← Voice commands
POST http://localhost:5678/webhook/notion-sync         ← GABRIEL → Notion
POST http://localhost:5678/webhook/consent-revoke      ← Emergency killswitch
```

**For external access** (Linear/GitHub/Zapier need to reach your local n8n):

```bash
# Option 1: Cloudflare Tunnel (recommended — you already have CF)
brew install cloudflare/cloudflare/cloudflared
cloudflared tunnel --url http://localhost:5678

# Option 2: ngrok
ngrok http 5678

# Option 3: Tailscale Funnel
tailscale funnel 5678
```

---

## Data Flows

### Linear → NOIZY (ZAP 9)
```
Linear Issue Created
  → Webhook to n8n
    → Parse & verify signature
    → Create GitHub branch (linear/<id>/<title>)
    → Create Notion task (with priority, assignee, URL)
    → Respond OK to Linear

Linear Issue Updated
  → Webhook to n8n
    → Map state (In Progress, In Review, etc.)
    → Alert GABRIEL with severity
    → Respond OK

Linear Issue Done
  → Webhook to n8n
    → Write completion to Consent Ledger
    → Respond OK
```

### Zapier → NOIZY (ZAP 10)
```
Zapier sends POST to /webhook/zapier-bridge
  → Normalize event (detect category: email/payment/social/etc.)
  → Route by category:
    Email    → Forward to GABRIEL
    Payment  → Write to Consent Ledger
    Notify   → Forward to notification pipeline
    General  → Log to Notion Events DB
  → All events also forwarded to Heaven
  → Respond OK to Zapier
```

### Notion ↔ Everything (ZAP 11)
```
Notion project page updated
  → Parse properties (status, priority, assignee)
  → If status = "Deploy":
      → Trigger GitHub repository_dispatch
  → Else:
      → Sync to Linear (create/update issue)
      → Alert GABRIEL
  → Respond OK

Every 5 minutes:
  → Poll Notion Projects DB for recent changes
  → Generate project status summary
  → Feed to GABRIEL for dashboard
```

---

## Environment Variables

| Variable | Service | Required | Description |
|----------|---------|----------|-------------|
| `N8N_USER` | n8n | ✓ | Basic auth username |
| `N8N_PASS` | n8n | ✓ | Basic auth password |
| `N8N_ENCRYPTION_KEY` | n8n | ✓ | Encrypts stored credentials (auto-generated) |
| `POSTGRES_USER` | PostgreSQL | ✓ | Database username |
| `POSTGRES_PASSWORD` | PostgreSQL | ✓ | Database password |
| `NOTION_API_KEY` | Notion | For Notion | Internal integration token |
| `NOTION_EVENTS_DB_ID` | Notion | For Notion | Events log database ID |
| `NOTION_PROJECTS_DB_ID` | Notion | For Notion | Projects dashboard database ID |
| `NOTION_TASKS_DB_ID` | Notion | For Notion | Tasks database ID |
| `LINEAR_API_KEY` | Linear | For Linear | Personal API key |
| `LINEAR_TEAM_ID` | Linear | For Linear | Team ID for issue creation |
| `LINEAR_WEBHOOK_SECRET` | Linear | For Linear | Webhook signature verification |
| `GITHUB_TOKEN` | GitHub | For GitHub | Fine-grained personal access token |
| `GITHUB_OWNER` | GitHub | For GitHub | GitHub org/user (default: noizyfish) |
| `ZAPIER_CATCH_HOOK_URL` | Zapier | For Zapier | Outbound hook URL to Zapier |
| `NOIZY_API_KEY` | Heaven | ✓ | NOIZY empire API key |
| `HEAVEN_URL` | Heaven | ✓ | Heaven worker URL |
| `WEBHOOK_TUNNEL_URL` | n8n | For external | Public tunnel URL for webhooks |

---

## Docker Commands

```bash
# Start the full stack
cd ops && docker compose -f docker-compose.integration.yml --env-file .env.integrations up -d

# View logs
docker compose -f ops/docker-compose.integration.yml logs -f n8n
docker compose -f ops/docker-compose.integration.yml logs -f postgres

# Stop everything
docker compose -f ops/docker-compose.integration.yml down

# Stop and remove data (⚠ destructive)
docker compose -f ops/docker-compose.integration.yml down -v

# Import a workflow via CLI
docker exec noizy-n8n n8n import:workflow --input=/home/node/workflows/09_linear_sync.json

# Import ALL workflows
for f in /home/node/workflows/*.json; do
  docker exec noizy-n8n n8n import:workflow --input="$f"
done

# Export workflows (backup)
docker exec noizy-n8n n8n export:workflow --all --output=/home/node/workflows/backup/

# PostgreSQL shell
docker exec -it noizy-postgres psql -U noizy -d n8n
```

---

## Migration from SQLite

The setup script automatically:
1. Detects the existing SQLite database in the running container
2. Backs it up to `ops/backups/<timestamp>/`
3. Stops the old container
4. Starts the new stack with PostgreSQL
5. n8n automatically migrates data from SQLite → PostgreSQL on first boot

Your existing workflows, credentials, and execution history are preserved.

---

## Security Notes

- All services bind to `127.0.0.1` only (no external exposure without tunnel)
- n8n basic auth protects the UI and API
- Linear webhook signatures are verified cryptographically
- PostgreSQL is not exposed outside Docker network
- Redis is not exposed outside Docker network
- All integration API keys are stored in `.env.integrations` (gitignored)
- Consent ledger entries are written for all state-changing operations

---

## File Structure

```text
NOIZYANTHROPIC/
├── ops/
│   ├── docker-compose.yml                ← Original (SQLite) stack
│   ├── docker-compose.integration.yml    ← ★ v2: queue mode, Caddy, pg-backup
│   ├── Caddyfile                         ← ★ Reverse proxy config
│   ├── .env.integrations                 ← ★ All API keys (gitignored)
│   ├── .secrets-audit.log                ← Generated by harden-secrets.sh
│   └── backups/                          ← SQLite + PostgreSQL backups
├── tools/n8n_workflows/
│   ├── 01_github_to_gabriel.json         ← ZAP 1
│   ├── 02_stripe_to_ledger.json          ← ZAP 2
│   ├── 03_voice_to_dreamchamber.json     ← ZAP 3
│   ├── 04_health_monitor_alerts.json     ← ZAP 4
│   ├── 05_notion_sync.json              ← ZAP 5
│   ├── 06_consent_revoke_killswitch.json ← ZAP 6
│   ├── 07_notion_to_github_deploy.json   ← ZAP 7
│   ├── 08_ai_commit_validation.json      ← ZAP 8
│   ├── 09_linear_sync.json              ← ★ ZAP 9
│   ├── 10_zapier_bridge.json            ← ★ ZAP 10
│   ├── 11_notion_project_dashboard.json  ← ★ ZAP 11
│   ├── 12_master_orchestrator_v2.json    ← ★ ZAP 12 — Universal router
│   ├── 13_health_dashboard_v2.json       ← ★ ZAP 13 — Full health matrix
│   ├── dreamchamber_automation.json
│   ├── github_deploy_pipeline.json
│   ├── heaven_webhook.json
│   ├── noizy_complete_webhook_orchestrator.json
│   └── notion_sync_watcher.json
├── workers/
│   ├── heaven17/                         ← CF Worker: noizy.ai/*
│   ├── consent-gateway/                  ← CF Worker: consent.noizy.ai/*
│   └── webhook-proxy/                    ← ★ CF Worker: edge webhook queue
│       ├── src/index.ts                  ← HMAC verify → KV queue → drain
│       ├── wrangler.toml
│       └── package.json
├── lucy/src/engine/
│   ├── nightly-analysis.ts              ← Pattern recognition
│   ├── n8n-bridge.ts                     ← ★ v2: HTTP delivery + Linear + Notion
│   ├── run-nightly.ts                    ← Pipeline runner
│   └── schemas/lucy-core.ts             ← Zod schemas
├── .github/workflows/
│   ├── deploy.yml                        ← Main deploy
│   ├── heaven-deploy.yml                 ← Heaven deploy
│   ├── consent-gateway-deploy.yml        ← Consent Gateway deploy
│   ├── n8n-notify.yml                    ← ★ GitHub → n8n webhooks
│   ├── ethics-gate.yml                   ← RSP governance check
│   └── ... (12 total)
├── scripts/
│   ├── setup-integrations.sh             ← ★ One-command setup
│   ├── bootstrap-n8n.sh                  ← ★ Import all workflows + creds
│   ├── harden-secrets.sh                 ← ★ Generate & audit secrets
│   ├── test-integrations.sh              ← ★ Smoke tests for all endpoints
│   └── fix-noizylab-mx.sh               ← MX record fix (pending token)
└── docs/
    └── INTEGRATION-STACK.md              ← This file
```

---

## Operations Runbook

### First-Time Setup

```bash
# 1. Generate all secrets
./scripts/harden-secrets.sh

# 2. Copy generated secrets into env file
cp ops/.env.integrations ops/.env.integrations.bak
nano ops/.env.integrations    # paste secrets from step 1

# 3. Start the full stack
./scripts/setup-integrations.sh

# 4. Import all workflows + credentials
./scripts/bootstrap-n8n.sh

# 5. Run smoke tests
./scripts/test-integrations.sh
```

### Daily Operations

```bash
# Check empire health
curl -s localhost:5678/webhook/health-check | python3 -m json.tool

# View n8n logs
docker compose -f ops/docker-compose.integration.yml logs -f n8n

# View execution queue
docker compose -f ops/docker-compose.integration.yml logs -f n8n-worker

# Check webhook proxy stats
curl -s https://webhook-proxy.rsp-5f3.workers.dev/stats

# Run Lucy nightly manually
cd lucy && npx ts-node src/engine/run-nightly.ts
```

### Troubleshooting

```bash
# Restart n8n only
docker compose -f ops/docker-compose.integration.yml restart n8n n8n-worker

# Check PostgreSQL
docker exec -it noizy-postgres psql -U noizy -d n8n -c "SELECT count(*) FROM workflow_entity;"

# Check Redis queue
docker exec noizy-redis redis-cli INFO keyspace

# Force drain webhook proxy
curl -X POST https://webhook-proxy.rsp-5f3.workers.dev/api/drain \
  -H "X-Noizy-Key: $NOIZY_API_KEY"

# Re-import a single workflow
docker cp tools/n8n_workflows/12_master_orchestrator_v2.json noizy-n8n:/tmp/
docker exec noizy-n8n n8n import:workflow --input=/tmp/12_master_orchestrator_v2.json
```

---

*RSP_001 | NOIZY Empire Integration Stack v2 | Built with governance, wired with purpose.*
