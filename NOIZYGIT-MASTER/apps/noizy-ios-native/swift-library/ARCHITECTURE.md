# NOIZY.ai ARCHITECTURE.md — Repo-Ready Blueprint

*Cloudflare runtime spine. Claude Max brain. Sovereign local Apple layer. Enterprise context rivers. Git-owned automation lanes. Deploy v1 in 30 days.*

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
cloudflare/          # Product runtime (Workers + full stack)
├── workers/
│   ├── app/         # Public app worker
│   ├── api/         # API worker  
│   └── admin/       # Internal admin endpoints
├── d1/              # Relational state (schema/migrations)
├── r2/              # Artifacts (uploads/receipts/proofs)
├── queues/          # Async tasks
├── workflows/       # Durable orchestration
└── vectorize/       # Semantic search (docs/contracts)

n8n-docker/          # Trusted internal automation
├── workflows/       # Admin/policy/receipt/sync
├── credentials/     # Encrypted secrets
└── docker-compose.yml

postman/             # API design in Git
├── collections/     # API contracts
├── flows/           # Local Flows (versioned)
└── environments/    # Dev/staging/prod

claude-projects/     # Build brain (5 projects)
├── core-platform/
├── consent-gov/  
├── creator-studio/
├── integrations/
└── growth/

terraform/           # Infra modules
├── cloudflare-core.tf
├── identity-secrets.tf
├── integrations-google.tf
└── integrations-msft.tf
```

## Step-by-Step Build Runbook

### Phase 1: Cloudflare Runtime Spine (Day 1-3)
```
1. wrangler.toml -> Create app/api/admin workers
2. wrangler d1 create noizy-prod
3. wrangler r2 bucket create noizy-artifacts
4. wrangler queues create noizy-tasks  
5. wrangler workflows create noizy-orchestration
6. wrangler vectorize create noizy-index
7. Deploy: wrangler deploy --env production
```

### Phase 2: Claude Build Brain (Day 4-5)
```
1. Create 5 Claude Max Projects with docs/instructions
2. Generate: API specs, UI wireframes, n8n workflows
3. Export Artifacts -> postman/collections + terraform/
4. Session: Architecture review + gap analysis
```

### Phase 3: Local Automation Lane (Day 6-10)
```
docker-compose up n8n
n8n import workflows/claude-generated/*.json
Configure credentials -> Cloudflare/Google/MSFT/Linear
Test: Receipt generation -> R2 + policy checks
```

### Phase 4: Enterprise Context Pipes (Day 11-15)
```
terraform apply integrations-google.tf
terraform apply integrations-msft.tf
n8n test Gmail/Drive -> Cloudflare Queues
n8n test Graph/Teams -> Cloudflare Vectorize
```

### Phase 5: Fast Outer Loop (Day 16-20)
```
Zapier: Forms -> Linear issues -> Notion status
Notion: Buttons -> n8n webhooks -> Cloudflare workflows
Linear: Webhooks -> admin-gateway -> Queues
```

### Phase 6: Apple Local Layer (Day 21-25)
```
Foundation Models: Local manifest parsing
App Intents: Siri "generate NOIZY brief"
Creator Studio: Final Cut/Logic output -> R2 uploads
```

### Phase 7: Production Gates (Day 26-30)
```
100% Terraform drift detection = 0
n8n workflows: 99.9% uptime, <100ms p99
Cloudflare: 0 evicted caches, R2 durability
Claude Projects: Knowledge utilization >80%
```

## Terraform Root Module

```hcl
# terraform/main.tf
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
}

module "n8n_internal" {
  source = "./modules/n8n-docker"
  domain = "n8n-internal.noizy.ai"
}

module "integrations" {
  source = "./modules/integrations"
  
  google_scopes = [
    "gmail.readonly",
    "drive.readonly", 
    "drive.file"
  ]
  
  msft_scopes = [
    "Mail.Read",
    "Files.Read",
    "Calendars.Read"
  ]
}
```

## Docker Admin Toolkit

```yaml
# docker-compose.yml
services:
  n8n:
    image: n8nio/n8n:latest
    ports: ["5678:5678"]
    volumes: 
      - ./n8n-data:/home/node/.n8n
    environment:
      - WEBHOOK_URL=https://n8n-internal.noizy.ai
      - CLOUDFLARE_API_TOKEN=${CF_TOKEN}

  admin-gateway:
    build: ./services/admin-gateway
    ports: ["3001:3001"]
    environment:
      - CF_ACCOUNT_ID=${CF_ACCOUNT_ID}

  policy-runner:
    build: ./services/policy-runner
    volumes: 
      - ./contracts:/contracts:ro
```

## Production Checklist

| SYSTEM | CHECK | METRIC | STATUS |
|--------|-------|--------|--------|
| **Cloudflare** | Workers healthy | 200 OK all routes | |
| | D1 migrations | Latest schema | |
| | R2 durability | 99.999999999% | |
| | Queue DLQ empty | 0 messages | |
| **n8n** | Workflow uptime | 99.9% | |
| | Credentials encrypted | Vault verified | |
| **Integrations** | Google token refresh | <1% failure | |
| | MSFT Graph latency | <500ms p95 | |
| **Claude** | Project knowledge | 200+ docs indexed | |
| **Local** | Foundation Models | Available on M2+ | |

## Success Metrics (v1)
```
100% Terraform coverage
<50ms Cloudflare Workers p99
99.9% n8n uptime 
Claude utilization >80% of build hours
Zero credential exposure
Apple local lane functional on M2/iPad
```

## Next Commands

```bash
# Clone + bootstrap
git clone <this-repo>
cd noizy-ai
cp .env.example .env
terraform init
docker-compose up -d n8n

# Deploy runtime
wrangler deploy --env production

# Open Claude Projects
open claude-projects/ARCHITECTURE-instructions.md

# Production gates
make check-production
```

**This is your NOIZY empire spine. 30 days to v1. Cloudflare owns runtime. Claude owns brain. Git owns truth. Execute.**

```
GORUNFREE.
```
