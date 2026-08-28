# NOIZY.AI — Master Architecture

**Author:** Robert Stephen Plowman
**Date:** 2026-04-13
**Status:** Canonical — this is the source of truth
**Target:** Deploy v1 in 30 days

---

## Design Principles

```
1. Cloudflare owns ALL runtime state and serving
2. Claude Max + Projects owns ALL system design and build acceleration
3. Git owns ALL contracts, API flows, n8n workflows
4. Apple owns ALL local intelligence and creative production
5. Google/Microsoft are enterprise context pipes — scoped and minimal
6. n8n Docker owns ALL trusted internal orchestration
7. Zapier/Notion/Linear are fast outer-loop glue only
```

Single stack. Two lanes (local/cloud). No overlap. No chaos.

---

## The Two Lanes

### Lane A — Local / Sovereign / Sensitive

| Surface | Role |
|---------|------|
| Apple Foundation Models | On-device language understanding, structured output, tool calling for native NOIZY tools |
| Postman Local Flows | API design, test flows, and reproducible integration logic — versioned in Git |
| n8n (Docker on GOD.local) | Internal automation touching credentials, governance, receipts, or sensitive business process |
| Ollama (GOD.local) | Local LLM inference — voice prints, consent reasoning, batch text processing |
| Creator Studio (Mac) | Logic Pro, Final Cut Pro, Pixelmator Pro, Motion — local production floor |

### Lane B — Cloud / Fast / Broad

| Surface | Role |
|---------|------|
| Cloudflare Workers stack | Product runtime — app, API, storage, queues, workflows, search |
| Zapier | Fast no-code SaaS glue — forms, notifications, simple syncs |
| Notion | Operator console — buttons, database automations, webhook actions, approvals |
| Linear | Execution ledger — issues, milestones, build status, GraphQL API + webhooks |
| Google Workspace | Enterprise context — Gmail for mail workflows, Drive for file intake |
| Microsoft Graph | Enterprise context — Outlook, OneDrive, SharePoint, Teams, identity |

---

## Repository Structure

```
noizy-ai/
├── cloudflare/                    # Product runtime (Workers + full stack)
│   ├── workers/
│   │   ├── app/                   # Public app worker
│   │   ├── api/                   # API worker (HEAVEN consent kernel)
│   │   ├── hub/                   # Integration Hub (connector gateway)
│   │   └── admin/                 # Internal admin endpoints
│   ├── d1/                        # Relational state (schema/migrations)
│   ├── r2/                        # Artifacts (uploads/receipts/proofs)
│   ├── queues/                    # Async tasks
│   ├── workflows/                 # Durable orchestration
│   └── vectorize/                 # Semantic search (docs/contracts)
├── n8n-docker/                    # Trusted internal automation
│   ├── workflows/                 # Admin/policy/receipt/sync
│   ├── credentials/               # Encrypted secrets
│   └── docker-compose.yml
├── postman/                       # API design in Git
│   ├── collections/               # API contracts
│   ├── flows/                     # Local Flows (versioned)
│   └── environments/              # Dev/staging/prod
├── claude-projects/               # Build brain (5 projects)
│   ├── core-platform/
│   ├── consent-gov/
│   ├── creator-studio/
│   ├── integrations/
│   └── growth/
├── terraform/                     # Infra modules
│   ├── modules/
│   │   ├── cloudflare_core/
│   │   ├── identity_and_secrets/
│   │   ├── integration_google/
│   │   ├── integration_microsoft/
│   │   ├── integration_linear_notion/
│   │   ├── builder_toolchain/
│   │   └── observability_receipts/
│   ├── environments/
│   │   ├── production.tfvars
│   │   ├── staging.tfvars
│   │   └── dev.tfvars
│   └── main.tf
├── services/                      # Docker admin toolkit
│   ├── admin-gateway/
│   ├── policy-runner/
│   ├── receipt-emitter/
│   ├── sync-worker/
│   └── ops-ui/
└── docs/
    ├── COMPLIANCE-AUDIT.md
    ├── DOMAIN-TRANSFER-RUNBOOK.md
    ├── GCP-PROJECT-SETUP.md
    ├── GOOGLE-WORKSPACE-CLOUDFLARE.md
    └── ANTHROPIC-USAGE-POLICY.md
```

---

## Core Layers

### 1. Cloudflare — Runtime Core

Everything public-facing runs here. At-cost. Edge-fast. Sovereign-capable.

| Service | Purpose | Live ID |
|---------|---------|---------|
| Workers (API) | HEAVEN consent kernel | heaven.rsp-5f3.workers.dev |
| Workers (Hub) | Integration connector gateway | Ready to deploy |
| Workers (App) | Public application serving | Planned |
| Workers (Admin) | Internal admin endpoints | Planned |
| D1: agent-memory | Agent state storage | `b5b58cc9-1f37-4000-adc5-12f9e419662f` |
| D1: gabriel_db | Gabriel voice assistant data | `68ac0f08-c4ee-43ff-9480-366406d41b37` |
| D1: integration-events | Connector audit log | `74633734-2bc5-4330-85ae-81de3e652cbd` |
| R2: uploads | User/creator file intake | To create |
| R2: receipts | Immutable proof of consent/action | To create |
| R2: proofs | Legal proof bundles | To create |
| KV: GABRIEL_VOICE | Voice data storage | `1a172d526c4442329a56d82248bd70d4` |
| KV: GABRIEL_KV | Gabriel key-value state | `61673efaa60b4418a2110a78ca512ce0` |
| KV: FEATURE_FLAGS | Feature flag system | `bf944d9a307249289565144a569a1de8` |
| KV: GAP_SOLVER | Gap analysis state | `f481eeaa1a724c45a510674273f463d1` |
| KV: KV_TOKENS | OAuth tokens (encrypted at rest) | `39f7dde1656145489eb4c1371db046c9` |
| KV: KV_CONFIG | Connector configurations | `2a5acde115a54c8c806d0d7780556d73` |
| Queues | Async task dispatch | To create: integration-dispatch |
| Workflows | Durable multi-step orchestration | Planned |
| Vectorize | Semantic search on NOIZY knowledge | Planned |
| DNS | noizy.ai zone (post GoDaddy transfer) | Pending |

**Account:** Fishmusicinc (`2446d788cc4280f5ea22a9948410c355`)

### 2. Anthropic — Thinking and Build-Acceleration Core

| Mode | Purpose | Boundary |
|------|---------|----------|
| Claude Max (Cowork) | Architecture, build planning, multi-file synthesis | Human-in-the-loop only — never automated |
| Claude Projects | Self-contained workspaces with project knowledge | One per major system |
| Claude Artifacts | Specs, tools, UI drafts, reusable components | Substantial — not disposable |
| Anthropic API | Agent orchestration, n8n AI nodes, batch processing | Pay-per-token, automated pipelines only |
| MCP (13 live) | Cloudflare, Gmail, Calendar, Drive, Slack, Notion, Linear, Figma, Vercel, GitKraken, HuggingFace, Atlassian, noizy-gemma3 | Direct API access from Cowork |

**Claude Project Map:**

| Project | Scope |
|---------|-------|
| NOIZY Core Platform | HEAVEN, runtime, consent engine, Integration Hub |
| NOIZY Consent & Governance | Compliance, contracts, privacy law, HVS framework |
| NOIZY Creator Studio | DreamChamber, voice demos, audio production, content |
| NOIZY Integrations | Connector Hub, workflow engines, platform connectors |
| NOIZY Growth | Strategy, investor materials, market analysis |

**Model Selection:**

| Task | Model | Why |
|------|-------|-----|
| Consent clause analysis | Opus | Nuanced legal reasoning |
| Agent orchestration | Sonnet | Speed-capability balance |
| Simple routing / triage | Haiku | Fast, cost-effective |
| Code generation in CI | Sonnet | Best code quality per token |
| Batch text processing | Haiku | Volume at lowest cost |
| Local inference | Ollama (gemma3, deepseek-r1) | Zero cost, sovereign |

### 3. Apple — Local Intelligence and Creator Layer

| Surface | Role |
|---------|------|
| Foundation Models | On-device language understanding, structured output, tool calling |
| App Intents | Expose NOIZY actions to Siri and Shortcuts |
| Creator Studio | Logic Pro, Final Cut Pro, Pixelmator Pro, Motion, Compressor, MainStage |
| iWork (AI-enhanced) | Keynote, Pages, Numbers — document and presentation production |
| Xcode 26 | Native app development — SwiftUI, CoreML, visionOS |
| GOD.local | M2 Ultra, 24 cores, 192GB RAM, 1.8TB SSD |

**Design rule:** Foundation Models features are optional and degrade gracefully. App Intents are for system actions, not core logic. Creator Studio is the production floor — not the runtime.

### 4. Google Workspace — Enterprise Context

| Service | Path | Scope |
|---------|------|-------|
| Gmail | MCP + n8n | Structured mail workflows — read, send, label |
| Drive | MCP + n8n | File intake, shared-drive access, search |
| Calendar | MCP | Scheduling, availability, event management |
| GCP | gcloud CLI | Cloud Functions, Pub/Sub, Secret Manager, BigQuery |

### 5. Microsoft Graph — Enterprise Context

| Service | Path | Scope |
|---------|------|-------|
| Outlook Mail/Calendar | Graph API | Mail, calendar, scheduling |
| OneDrive / SharePoint | Graph API | Files, shared libraries |
| Teams | Graph API | Channel context, messaging |
| Entra ID | Graph API | Identity, groups |

---

## Toolchain

### Postman — API Design in Git

| Asset | Location |
|-------|----------|
| HEAVEN Collection (16 endpoints) | `postman/NOIZY-HEAVEN.postman_collection.json` |
| Local Environment | `postman/env.local.json` |
| Production Environment | `postman/env.prod.json` |
| Newman CI Pipeline | `.github/workflows/test-heaven-api.yml` |

### n8n — Trusted Internal Automation (Docker)

| Category | Examples |
|----------|----------|
| Admin | Policy checks, receipt generation, secure orchestration |
| Sync | Drive delta scans, Gmail label jobs, Graph sync, Notion reconciliation |
| Governance | Consent pipeline, compliance monitoring, audit trail |
| AI | Ollama-powered consent reasoning, batch analysis, voice print processing |

### Zapier — Fast Outer Loop

Breadth, not depth. Deep NOIZY logic stays in Cloudflare or n8n.

### Notion — Operator Console

Buttons, database automations, webhook actions. Ops surface, not runtime.

### Linear — Execution Ledger

Source of truth for engineering execution state. GraphQL API + webhooks → Integration Hub.

---

## Integration Architecture

```
                         ┌─────────────────────┐
                         │    PUBLIC INTERNET   │
                         └──────────┬──────────┘
                                    │
              ┌─────────────────────┼─────────────────────┐
              │                     │                     │
       ┌──────▼──────┐      ┌──────▼──────┐      ┌───────▼──────┐
       │   Linear    │      │   GitHub    │      │   Stripe     │
       │   Zapier    │      │   Notion    │      │   Google     │
       │   n8n cloud │      │   Slack     │      │   Microsoft  │
       └──────┬──────┘      └──────┬──────┘      └───────┬──────┘
              │                     │                     │
              └─────────────────────┼─────────────────────┘
                                    │ webhooks
                        ┌───────────▼───────────┐
                        │    CONNECTOR HUB      │  ← Cloudflare Worker
                        │    (Edge Gateway)     │
                        │                       │
                        │  • Webhook receivers  │
                        │  • OAuth handlers     │
                        │  • Event audit log    │
                        │  • Queue dispatch     │
                        │  • Connector status   │
                        └───────┬───────────────┘
                                │
                  ┌─────────────┼─────────────┐
                  │             │             │
           ┌──────▼──────┐ ┌───▼───┐  ┌──────▼──────┐
           │  D1 Audit   │ │ Queue │  │  KV Tokens  │
           │  (events)   │ │       │  │  KV Config  │
           └─────────────┘ └───┬───┘  └─────────────┘
                               │
                 ┌─────────────┼─────────────┐
                 │             │             │
          ┌──────▼──────┐ ┌───▼─────┐ ┌─────▼────────┐
          │   HEAVEN    │ │  n8n    │ │  Outbound    │
          │   Consent   │ │ Docker  │ │  Dispatch    │
          │   Kernel    │ │ GOD.loc │ │  (Slack,     │
          └─────────────┘ └─────────┘ │   Gmail,     │
                                      │   Notion)    │
                                      └──────────────┘
```

---

## Docker Admin Toolkit (GOD.local)

```yaml
services:
  n8n:
    image: n8nio/n8n:latest
    ports: ["5678:5678"]
    environment:
      - WEBHOOK_URL=https://n8n-internal.noizy.ai
      - CLOUDFLARE_API_TOKEN=${CF_TOKEN}
      - HEAVEN_URL=https://heaven.rsp-5f3.workers.dev

  admin-gateway:
    build: ./services/admin-gateway
    ports: ["3001:3001"]
    # Receives webhooks from Linear/Notion/Google/Microsoft/Zapier
    # Normalizes to NOIZY event shape, pushes to Cloudflare Queues

  policy-runner:
    build: ./services/policy-runner
    volumes:
      - ./contracts:/contracts:ro
    # Governance checks against manifests before high-trust promotion

  receipt-emitter:
    build: ./services/receipt-emitter
    # Builds append-only receipts and proof bundles → R2

  sync-worker:
    build: ./services/sync-worker
    # Periodic sync: Drive deltas, Gmail labels, Graph, Notion, Linear

  ops-ui:
    build: ./services/ops-ui
    ports: ["3000:3000"]
    # Minimal admin console: retries, queue inspection, approvals
```

---

## Terraform Root Module

```hcl
# terraform/main.tf

module "cloudflare_core" {
  source = "./modules/cloudflare_core"

  account_id = "2446d788cc4280f5ea22a9948410c355"

  workers = {
    app   = { routes = ["noizy.ai/*"] }
    api   = { routes = ["api.noizy.ai/*"] }
    hub   = { routes = ["integrate.noizy.ai/*"] }
    admin = { routes = ["admin.noizy.ai/*"] }
  }

  d1_databases = ["noizy-prod", "agent-memory", "gabriel_db", "integration-events"]
  r2_buckets   = ["uploads", "receipts", "proofs", "exports"]
  kv_namespaces = ["GABRIEL_VOICE", "GABRIEL_KV", "FEATURE_FLAGS", "GAP_SOLVER", "KV_TOKENS", "KV_CONFIG"]
  queues       = ["integration-dispatch", "consent-events"]
}

module "identity_and_secrets" {
  source = "./modules/identity_and_secrets"
  # CF secrets, Google OAuth, Entra app reg, Anthropic API keys
}

module "integration_google" {
  source = "./modules/integration_google"
  scopes = ["gmail.readonly", "drive.readonly", "drive.file", "calendar.readonly"]
}

module "integration_microsoft" {
  source = "./modules/integration_microsoft"
  scopes = ["Mail.Read", "Files.Read", "Calendars.Read", "User.Read"]
}

module "integration_linear_notion" {
  source = "./modules/integration_linear_notion"
  # Linear webhooks + mutations, Notion buttons + webhooks, sync mappers
}

module "observability_receipts" {
  source = "./modules/observability_receipts"
  # Event ingestion, receipt bucket, audit records, dead-letter, lineage
}
```

---

## 30-Day Build Runbook

### Phase 1: Cloudflare Runtime Spine (Day 1–3)

```bash
# Already done (2026-04-13):
# ✅ D1: integration-events created (74633734-2bc5-4330-85ae-81de3e652cbd)
# ✅ KV: KV_TOKENS created (39f7dde1656145489eb4c1371db046c9)
# ✅ KV: KV_CONFIG created (2a5acde115a54c8c806d0d7780556d73)
# ✅ D1 schema + 4 indexes applied
# ✅ wrangler.toml configured with real IDs

# Remaining:
wrangler r2 bucket create noizy-uploads
wrangler r2 bucket create noizy-receipts
wrangler r2 bucket create noizy-proofs
wrangler queues create integration-dispatch
wrangler deploy                              # Integration Hub worker
bash scripts/seed-connectors.sh              # Seed all 12 connector configs
```

### Phase 2: Claude Build Brain (Day 4–5)

```
1. Create 5 Claude Max Projects with curated knowledge + instructions
2. Generate: API specs, UI wireframes, n8n workflow templates
3. Export Artifacts → postman/collections + terraform/
4. Architecture review session → gap analysis
```

### Phase 3: Local Automation Lane (Day 6–10)

```bash
docker-compose up -d n8n postgres ollama redis
n8n import workflows/*.json
# Configure credentials: Cloudflare / Google / MSFT / Linear
# Test: Receipt generation → R2 + policy checks
```

### Phase 4: Enterprise Context Pipes (Day 11–15)

```bash
terraform apply -target=module.integration_google
terraform apply -target=module.integration_microsoft
# Test: Gmail/Drive → Cloudflare Queues
# Test: Graph/Teams → Cloudflare Vectorize
```

### Phase 5: Fast Outer Loop (Day 16–20)

```
Zapier: Forms → Linear issues → Notion status
Notion: Buttons → n8n webhooks → Cloudflare workflows
Linear: Webhooks → Integration Hub → Queues
```

### Phase 6: Apple Local Layer (Day 21–25)

```
Foundation Models: Local manifest parsing, consent reasoning
App Intents: Siri "generate NOIZY brief"
Creator Studio: Final Cut/Logic output → R2 uploads
```

### Phase 7: Production Gates (Day 26–30)

| System | Check | Metric | Target |
|--------|-------|--------|--------|
| Cloudflare | Workers healthy | All routes 200 OK | Pass |
| Cloudflare | D1 migrations | Latest schema applied | Pass |
| Cloudflare | R2 durability | 99.999999999% | Pass |
| Cloudflare | Queue DLQ | 0 messages | Pass |
| n8n | Workflow uptime | 99.9% | Pass |
| n8n | Credentials | Vault encrypted | Pass |
| Google | Token refresh | <1% failure rate | Pass |
| Microsoft | Graph latency | <500ms p95 | Pass |
| Claude | Project knowledge | 200+ docs indexed | Pass |
| Apple | Foundation Models | Available on M2 | Pass |
| Compliance | Privacy policy | Published | Pass |
| Compliance | Consent checkbox | Implemented | Pass |
| Compliance | Data deletion | Endpoint live | Pass |
| Compliance | PII pseudonymized | Ledger verified | Pass |
| Security | Zero credential exposure | Audit clean | Pass |

---

## Live GOD.local Inventory

| Resource | Details |
|----------|---------|
| Hardware | M2 Ultra, 24 cores, 192GB RAM, 1.8TB SSD |
| Ollama models | 19 active (gemma3, deepseek-r1, llama3.3, qwen2.5, etc.) |
| Docker services | 11 running (n8n, PostgreSQL, Ollama, Qdrant, Redis, Open WebUI, SurrealDB, Grafana, etc.) |
| NOIZY Agent MCPs | 11 active |
| Audio chain | MC96 — diagnostics in progress |

---

## Compliance Status (from 2026-04-13 audit)

| Framework | Status | Critical Gap |
|-----------|--------|-------------|
| PIPEDA | 6/10 FAIL | No consent mechanism, no deletion, PII in cleartext ledger |
| GDPR | All rights unimplemented | Art. 17 right to erasure vs append-only ledger |
| CCPA | Gaps identified | No opt-out mechanism, no privacy policy |
| CASL | Non-compliant | No express consent for email communications |
| Cloudflare ToS | Compliant | — |

**The Ledger Paradox:** HEAVEN's append-only ledger stores email in cleartext. Resolution: hash/pseudonymize PII at write time, keep cleartext only in deletable KV.

---

## Bootstrap Commands

```bash
# Clone + bootstrap
git clone <repo>
cd noizy-ai
cp .env.example .env

# Infrastructure
terraform init && terraform plan
docker-compose up -d n8n

# Deploy runtime
cd cloudflare/workers/hub
wrangler deploy --env production

# Seed connectors
bash scripts/seed-connectors.sh

# Run API tests
npx newman run postman/NOIZY-HEAVEN.postman_collection.json \
  -e postman/env.prod.json

# Production gates
make check-production
```

---

## The Blunt Summary

Build one real stack, not ten overlapping ones.

**Cloudflare** runs the product.
**Claude Max + Projects + Artifacts** design the product and builder tools.
**Postman Local Flows** version API logic in Git.
**n8n Docker** handles trusted internal automation.
**Zapier** handles fast edge automations.
**Notion** is the operator surface.
**Linear** is the execution ledger.
**Google Workspace + Microsoft Graph** are enterprise context pipes.
**Apple Foundation Models + App Intents + Creator Studio** are the local intelligence and making layer.

That is the cleanest way to build the application and the tools that build NOIZY.AI at the same time.

---

*Built for NOIZY.AI by Robert Stephen Plowman.*
*Every integration is a module. Every event is audited. Every voice is sovereign.*

GORUNFREE.
