# NOIZY.ai ARCHITECTURE.md — Repo-Ready Blueprint

_Cloudflare runtime spine. Claude Max brain. Sovereign local Apple layer. Enterprise context rivers. Git-owned automation lanes. Deploy v1 in 30 days._

## Design Principles

```
1. Cloudflare owns ALL runtime state and serving
2. Claude Max + Projects owns ALL system design and build acceleration
3. Git owns ALL contracts, API flows, n8n workflows
4. Apple owns ALL local intelligence and creative production
5. Google/Microsoft are READ-ONLY context pipes
6. n8n Docker owns ALL trusted internal orchestration
7. Zapier/Notion/Linear are fast outer-loop glue only
```

**Single stack. Two lanes (local/cloud). No overlap. No chaos.**

## Architecture Modules

```
cloudflare/                    # Product runtime (Workers + full stack)
  workers/
    app/                       # Public app worker (noizy.ai)
    api/                       # API worker (api.noizy.ai) — Heaven
    admin/                     # Internal admin endpoints (admin.noizy.ai)
  d1/                          # Relational state (schema/migrations)
  r2/                          # Artifacts (uploads/receipts/proofs)
  queues/                      # Async tasks
  workflows/                   # Durable orchestration
  vectorize/                   # Semantic search (docs/contracts)

n8n-docker/                    # Trusted internal automation
  workflows/                   # Admin/policy/receipt/sync
  credentials/                 # Encrypted secrets
  docker-compose.yml

postman/                       # API design in Git
  collections/                 # API contracts
  flows/                       # Local Flows (versioned)
  environments/                # Dev/staging/prod

claude-projects/               # Build brain (5 projects)
  core-platform/
  consent-gov/
  creator-studio/
  integrations/
  growth/

infra/                         # Infrastructure
  terraform/                   # IaC modules
    main.tf
    modules/
      cloudflare/
      n8n-docker/
      integrations/
  docker/                      # Admin toolkit
  runbook/                     # Operational runbooks
```

## Mapping to Existing NOIZY Systems

| Architecture Module         | Existing System                | Status             |
| --------------------------- | ------------------------------ | ------------------ |
| `cloudflare/workers/api/`   | Heaven v18.0.0 (src/index.js)  | LIVE               |
| `cloudflare/workers/app/`   | noizy-landing (noizy-landing/) | LIVE (workers.dev) |
| `cloudflare/workers/admin/` | GABRIEL daemon (port 9777)     | LOCAL              |
| `cloudflare/d1/`            | gabriel_db (19 tables)         | LIVE               |
| `cloudflare/r2/`            | Not yet enabled                | BLOCKED            |
| `cloudflare/queues/`        | Not yet created                | PENDING            |
| `cloudflare/workflows/`     | Not yet created                | PENDING            |
| `cloudflare/vectorize/`     | Not yet created                | PENDING            |
| `n8n-docker/`               | n8n (port 5678)                | LIVE locally       |
| `postman/`                  | Not yet created                | NEW                |
| `claude-projects/`          | 21 skills + 10 agents          | LIVE               |
| `infra/terraform/`          | Just created                   | NEW                |
| `infra/docker/`             | Just created                   | NEW                |

## Step-by-Step Build Runbook

### Phase 1: Cloudflare Runtime Spine (Day 1-3)

```bash
# From ~/NOIZYANTHROPIC

# 1. Heaven is already the API worker — verify
curl https://heaven.rsp-5f3.workers.dev/health

# 2. Landing page is the app worker — deploy to custom domain
cd noizy-landing && npx wrangler deploy

# 3. Create admin worker (new)
mkdir -p cloudflare/workers/admin
# wrangler.toml already defines routes for admin.noizy.ai

# 4. R2 bucket for voice assets + receipts + proofs
npx wrangler r2 bucket create noizy-uploads
npx wrangler r2 bucket create noizy-receipts
npx wrangler r2 bucket create noizy-proofs

# 5. Queue for async tasks
npx wrangler queues create noizy-tasks
npx wrangler queues create noizy-webhooks

# 6. Vectorize for semantic search
npx wrangler vectorize create noizy-index --dimensions=1536 --metric=cosine

# 7. D1 already live — verify
npx wrangler d1 execute gabriel_db --remote --command="SELECT count(*) FROM hvs_actors"
```

### Phase 2: Claude Build Brain (Day 4-5)

```
Claude Max Projects (create at claude.ai/projects):

1. core-platform/     — Heaven API, Workers, D1 schema, auth
2. consent-gov/       — Never Clauses, Kill Switch, Covenant, audit
3. creator-studio/    — DreamChamber, Voice DNA, C2PA, TTS
4. integrations/      — Google, Microsoft, n8n, Zapier, Linear
5. growth/            — Guild of Artists, onboarding, scaling

Each project gets:
  - Relevant .claude/skills/ content as knowledge
  - Relevant .claude/rules/ as instructions
  - API specs from postman/collections/
```

### Phase 3: Local Automation Lane (Day 6-10)

```bash
# Start n8n with Docker
cd infra/docker
docker compose -f docker-compose.admin.yml up -d n8n postgres

# Import existing workflows
# n8n UI at http://localhost:5678
# Import from n8n-docker/workflows/

# Configure credentials in n8n UI:
#   - Cloudflare API token
#   - Google OAuth (read-only: Gmail, Drive)
#   - Microsoft Graph (read-only: Mail, Files, Calendar)
#   - Linear API key
#   - Anthropic API key

# Test: Receipt generation → R2 + policy checks
```

### Phase 4: Enterprise Context Pipes (Day 11-15)

```bash
# Terraform for Google integration
cd infra/terraform
terraform init
terraform plan -var-file="noizy.tfvars"
terraform apply -var-file="noizy.tfvars" -target=module.integrations

# n8n workflows for context ingestion:
#   Gmail → Cloudflare Queue → Vectorize (read-only)
#   Drive → Cloudflare R2 (read-only sync)
#   Graph/Teams → Cloudflare Vectorize (read-only)
```

### Phase 5: Fast Outer Loop (Day 16-20)

```
Zapier:
  - Forms → Linear issues → Notion status
  - Stripe events → n8n webhook → Cloudflare queue

Notion:
  - Project boards for Guild of Artists
  - Buttons → n8n webhooks → Cloudflare workflows

Linear:
  - Issue tracking for engineering
  - Webhooks → admin worker → Queues
```

### Phase 6: Apple Local Layer (Day 21-25)

```
On GOD.local (M2 Ultra):
  - Foundation Models: Local manifest parsing via mlx
  - Shortcuts: "Generate NOIZY brief" → GABRIEL daemon
  - Creator Studio: Final Cut/Logic output → R2 uploads
  - Voice Pipeline: mic → Whisper → Claude → TTS
  - LUCY iPad: PWA + native SwiftUI app
```

### Phase 7: Production Gates (Day 26-30)

```
Verification:
  ✅ Terraform drift detection = 0
  ✅ n8n workflows: 99.9% uptime
  ✅ Cloudflare: all workers healthy, R2 durable
  ✅ Claude Projects: 5 active, knowledge indexed
  ✅ Zero credential exposure
  ✅ Apple local lane functional on M2/iPad
  ✅ 22/22 smoke tests passing
  ✅ All domains on Cloudflare Registrar
  ✅ Email routing verified on all domains
  ✅ DMARC/SPF/DKIM on all domains
```

## Terraform Root Module

See [infra/terraform/main.tf](infra/terraform/main.tf) for the live implementation.

Extended modules to build:

```hcl
module "cloudflare_core" {
  source = "./modules/cloudflare"

  workers = {
    app   = { routes = ["noizy.ai/*"] }
    api   = { routes = ["api.noizy.ai/*"] }
    admin = { routes = ["admin.noizy.ai/*"] }
  }

  d1_databases = ["noizy-prod"]
  r2_buckets   = ["uploads", "receipts", "proofs"]
  queues       = ["tasks", "webhooks"]
  vectorize    = ["noizy-index"]
}

module "n8n_internal" {
  source = "./modules/n8n-docker"
  domain = "n8n-internal.noizy.ai"
}

module "integrations" {
  source = "./modules/integrations"

  google_scopes = ["gmail.readonly", "drive.readonly", "drive.file"]
  msft_scopes   = ["Mail.Read", "Files.Read", "Calendars.Read"]
}
```

## Docker Admin Toolkit

See [infra/docker/docker-compose.admin.yml](infra/docker/docker-compose.admin.yml) for the live implementation.

## Production Checklist

See [infra/PRODUCTION_CHECKLIST.md](infra/PRODUCTION_CHECKLIST.md) for the full 70+ item checklist.

## Success Metrics (v1)

```
100% Terraform coverage — all infrastructure as code
<50ms Cloudflare Workers p99 latency
99.9% n8n workflow uptime
Claude utilization >80% of build hours
Zero credential exposure in git
Apple local lane functional on M2 Ultra + iPad
22/22 smoke tests passing
All 4 domains on Cloudflare Registrar
Email routing verified on all domains
DMARC/SPF/DKIM on all domains
GoDaddy account closed — TOTAL FREEDOM
```

## Quick Commands

```bash
# Bootstrap
cd ~/NOIZYANTHROPIC
cp infra/terraform/noizy.tfvars.example infra/terraform/noizy.tfvars
# Edit noizy.tfvars with your API tokens

# Infrastructure
cd infra/terraform && terraform init && terraform plan
cd infra/docker && docker compose -f docker-compose.admin.yml up -d

# Deploy runtime
npx wrangler deploy                    # Heaven API
cd noizy-landing && npx wrangler deploy # Landing page

# Verify
bash smoke_test.sh                     # 22/22 tests
bash ops/godaddy-exit-execute.sh       # Full DNS scan
bash ops/godaddy-exit-dns.sh           # Email auth records
bash ops/godaddy-exit-deploy.sh        # Deploy + verify

# Production gates
cd infra/terraform && terraform plan   # Drift = 0
docker compose -f docker-compose.admin.yml run --rm admin scan
docker compose -f docker-compose.admin.yml run --rm admin status
```

---

_"We are the new punk rockers: capitalist free thinkers who believe in peace, love, and understanding."_
_— Robert Stephen Plowman, RSP_001_

**GORUNFREE.**
