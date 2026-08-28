# Gordon Docker Prompts — NOIZY.AI Sovereign Stack

**Purpose:** A series of precise, no-nonsense prompts for Docker's Gordon AI to build the infrastructure layer for NOIZY.AI.  
**Author:** Robert Stephen Plowman  
**Date:** April 12, 2026  
**Machine:** GOD.local — Mac M2 Ultra, macOS  

Each prompt is self-contained. Copy-paste directly into Gordon. They're ordered by dependency — Prompt 1 first, then the rest in any order.

---

## Prompt 1: docker-compose.yml — The Sovereign Stack

```
I need a production-grade docker-compose.yml for a Mac M2 Ultra (ARM64) 
running 12 local services behind Cloudflare Zero Trust tunnels. 

Here are the exact services and their ports:

Services:
1. ollama (port 11434) — LLM inference server, needs GPU passthrough 
   for Apple Silicon. Mount /Users/rsp/.ollama for model persistence.
   Image: ollama/ollama:latest
   
2. n8n (port 5678) — workflow automation.
   Image: n8nio/n8n:latest
   Needs persistent volume for /home/node/.n8n
   Environment: N8N_BASIC_AUTH_ACTIVE=true
   
3. neo4j (port 7474 HTTP, 7687 bolt) — graph database.
   Image: neo4j:5-community
   Volumes: neo4j_data:/data, neo4j_logs:/logs
   
4. qdrant (port 6333 HTTP, 6334 gRPC) — vector database.
   Image: qdrant/qdrant:latest
   Volume: qdrant_storage:/qdrant/storage
   
5. meilisearch (port 7700) — search engine.
   Image: getmeili/meilisearch:latest
   Volume: meili_data:/meili_data
   Environment: MEILI_MASTER_KEY from .env file
   
6. rabbitmq (port 5672 AMQP, 15672 management UI).
   Image: rabbitmq:3-management-alpine
   
7. grafana (port 3000) — monitoring dashboards.
   Image: grafana/grafana:latest
   Volume: grafana_data:/var/lib/grafana
   
8. open-webui (port 3080) — chat interface for Ollama.
   Image: ghcr.io/open-webui/open-webui:main
   Environment: OLLAMA_BASE_URL=http://ollama:11434
   Depends on: ollama
   
9. heaven-dev (port 8787) — Cloudflare Worker local dev.
   Build from ./heaven directory using Dockerfile.
   Command: npx wrangler dev --local --port 8787
   Volumes: ./heaven:/app (bind mount for live reload)
   Depends on: ollama, qdrant, meilisearch
   
10. dreamchamber (port 7777) — custom streaming UI.
    Build from ./dreamchamber directory.
    Volume: ./dreamchamber:/app
    
11. kubernetes (port 54335) — k3s lightweight cluster.
    Image: rancher/k3s:latest
    Privileged: true
    
12. voice-bridge (port 8088) — voice synthesis bridge.
    Build from ./voice-bridge directory.
    Depends on: ollama, heaven-dev

Requirements:
- All services on a shared Docker network called "noizy-net"
- Named volumes for all persistent data
- .env file for secrets (MEILI_MASTER_KEY, NEO4J_AUTH, 
  ANTHROPIC_API_KEY, CLOUDFLARE_API_TOKEN, RABBITMQ_DEFAULT_PASS)
- Health checks on every service
- Restart policy: unless-stopped on all services
- ARM64/aarch64 compatible images only (Mac M2 Ultra)
- Resource limits: Ollama gets 48GB memory, others get 2GB each
- Log rotation: max-size 10m, max-file 3

Also create a .env.example file with placeholder values.
```

---

## Prompt 2: GitHub Actions CI/CD for HEAVEN Worker

```
I need a GitHub Actions workflow for deploying a Cloudflare Worker 
called "heaven" from a repo at github.com/Noizyfish/GABRIEL.

Tech stack:
- TypeScript Cloudflare Worker
- Wrangler CLI v3 for deployment
- Two D1 databases bound to the worker:
  - agent-memory (UUID: b5b58cc9-1f37-4000-adc5-12f9e419662f)
  - gabriel_db (UUID: 68ac0f08-c4ee-43ff-9480-366406d41b37)
- Four KV namespaces bound:
  - GABRIEL_VOICE (ID: 1a172d526c4442329a56d82248bd70d4)
  - GABRIEL_KV (ID: 61673efaa60b4418a2110a78ca512ce0)
  - FEATURE_FLAGS (ID: bf944d9a307249289565144a569a1de8)
  - GAP_SOLVER (ID: f481eeaa1a724c45a510674273f463d1)

Create .github/workflows/heaven-deploy.yml with these stages:

1. Trigger: push to main, and pull_request to main
2. Lint: run eslint + typescript check
3. Test: run vitest (Cloudflare Workers test environment)
4. D1 Migrations: if any .sql files changed in /migrations/, 
   run `wrangler d1 migrations apply` for both databases
5. Deploy: `wrangler deploy` (only on push to main, not on PR)
6. Smoke test: POST to https://heaven.noizy.ai/v1/health 
   and verify 200 response

Secrets needed (stored in GitHub repo secrets):
- CLOUDFLARE_API_TOKEN
- CLOUDFLARE_ACCOUNT_ID (value: 2446d788cc42805ea22a9948410c355)

Also create:
- .github/workflows/dependabot-automerge.yml that auto-merges 
  dependabot PRs for patch versions after CI passes
- dependabot.yml config checking npm weekly
- Branch protection recommendation (as a comment in the workflow)
```

---

## Prompt 3: Dockerfile for HEAVEN Dev Environment

```
I need a Dockerfile for local development of a Cloudflare Worker 
called "heaven" on a Mac M2 Ultra (ARM64).

The worker is written in TypeScript and uses:
- Wrangler CLI v3 (npx wrangler dev)
- Bindings to D1 databases and KV namespaces (defined in wrangler.toml)
- Node.js 20 LTS

The Dockerfile should:
1. Use node:20-slim as base (ARM64 compatible)
2. Install wrangler globally
3. Set working directory to /app
4. Copy package.json and package-lock.json first (layer caching)
5. Run npm ci --production=false
6. Copy the rest of the source
7. Expose port 8787
8. Default CMD: npx wrangler dev --local --port 8787 --ip 0.0.0.0
9. Include a HEALTHCHECK that curls localhost:8787/v1/health

Also create a .dockerignore that excludes:
node_modules, .git, .wrangler, *.md, .env, .env.*, dist

And a wrangler.toml template with:
- name = "heaven"
- main = "src/index.ts"  
- compatibility_date = "2026-04-12"
- D1 bindings for agent-memory and gabriel_db
- KV bindings for GABRIEL_VOICE, GABRIEL_KV, FEATURE_FLAGS, GAP_SOLVER
- [vars] section with ENVIRONMENT = "development"
```

---

## Prompt 4: Health Monitoring + Auto-Recovery

```
I have 12 Docker services running on a Mac M2 Ultra. I need a 
monitoring and auto-recovery setup.

Create:

1. A docker-compose.override.yml that adds:
   - Prometheus (port 9090) scraping all services
   - Grafana dashboard JSON file for the NOIZY sovereign stack
   - AlertManager with webhook to a local n8n endpoint
   
2. A shell script (scripts/healthcheck.sh) that:
   - Checks every service is healthy via Docker health status
   - If any service is unhealthy for >60 seconds, restart it
   - Logs all events to /var/log/noizy-health.log
   - Can be run via cron every 30 seconds
   
3. A shell script (scripts/startup.sh) that:
   - Starts services in dependency order
   - Waits for each service health check to pass before starting dependents
   - Order: ollama → qdrant → meilisearch → neo4j → rabbitmq → 
     grafana → n8n → open-webui → heaven-dev → dreamchamber → 
     voice-bridge → kubernetes
   - Prints a status table when all services are up
   - Total startup timeout: 5 minutes

4. A shell script (scripts/backup.sh) that:
   - Dumps all named Docker volumes to timestamped tarballs
   - Stores in /Volumes/Backup/noizy/ (external drive path)
   - Keeps last 7 daily backups, deletes older
   - Can be run via launchd daily at 3am

Services and their health endpoints:
- ollama: GET http://localhost:11434/api/tags
- n8n: GET http://localhost:5678/healthz
- neo4j: GET http://localhost:7474
- qdrant: GET http://localhost:6333/healthz
- meilisearch: GET http://localhost:7700/health
- rabbitmq: GET http://localhost:15672/api/healthchecks/node
- grafana: GET http://localhost:3000/api/health
- open-webui: GET http://localhost:3080/health
- heaven-dev: GET http://localhost:8787/v1/health
- dreamchamber: GET http://localhost:7777/health
```

---

## Prompt 5: Security Hardening + Secrets Management

```
I need to security-harden my Docker setup on a Mac M2 Ultra 
running 12 services behind Cloudflare Zero Trust tunnels.

Current setup:
- Cloudflare Tunnel routes *.noizy.ai subdomains to local ports
- 13 Access policies in Cloudflare One Dashboard (not yet configured)
- Services expose ports only on localhost (127.0.0.1)
- Secrets currently in .env files

Create:

1. A docker-compose.security.yml overlay that:
   - Uses Docker secrets instead of environment variables for all 
     sensitive values (API keys, passwords, tokens)
   - Sets read_only: true on all containers that don't need writes
   - Drops all Linux capabilities, adds back only what's needed
   - Sets no-new-privileges: true on all services
   - Limits network access: only heaven-dev can reach the internet,
     other services communicate only on noizy-net
   - Adds user namespacing (no root processes)

2. A scripts/setup-zero-trust.sh that:
   - Installs cloudflared if not present
   - Creates a Cloudflare Tunnel named "noizy-sovereign"
   - Configures ingress rules mapping subdomains to local ports:
     dream.chamber.noizy.ai → localhost:7777
     voice.noizy.ai → localhost:8088
     ollama-api.noizy.ai → localhost:11434
     n8n.noizy.ai → localhost:5678
     grafana.noizy.ai → localhost:3000
     graph.noizy.ai → localhost:7474
     vectors.noizy.ai → localhost:6333
     search.noizy.ai → localhost:7700
     mq.noizy.ai → localhost:15672
     heaven-dev.noizy.ai → localhost:8787
     k8s.noizy.ai → localhost:54335
   - Sets catch-all to http_status:404
   - Installs cloudflared as a macOS launchd service
   - Prints verification commands

3. A .github/workflows/security-scan.yml that:
   - Runs on every PR
   - Scans Dockerfiles with Hadolint
   - Scans images with Trivy for CVEs
   - Checks for hardcoded secrets with Gitleaks
   - Fails the PR if any HIGH or CRITICAL findings
```

---

## Prompt 6: Vercel Deployment for NOIZY.AI Frontend

```
I need a Vercel deployment configuration for the NOIZY.AI public 
website and landing page.

Setup:
- GitHub repo: Noizyfish/noizy-landing (or similar)
- Framework: Next.js 14 (App Router) or static HTML
- Domain: noizy.ai (already registered, DNS on Cloudflare)
- The landing page includes a hero component with animated waveform,
  3 A/B copy variants, and a 2-step signup modal

Create:

1. vercel.json with:
   - Build command and output directory
   - Rewrites: /api/* routes proxy to heaven.noizy.ai/v1/*
   - Headers: strict CSP, HSTS, X-Frame-Options
   - Edge middleware for A/B variant assignment (cookie-based)
   - Redirect: www.noizy.ai → noizy.ai

2. A GitHub Actions workflow (.github/workflows/vercel-deploy.yml):
   - Preview deploy on PR (with comment containing preview URL)
   - Production deploy on push to main
   - Uses Vercel CLI, not the GitHub integration
   - Runs lighthouse CI after deploy, fails if score < 90

3. Environment variables needed:
   - NEXT_PUBLIC_HEAVEN_API=https://heaven.noizy.ai/v1
   - NEXT_PUBLIC_SIGNUP_ENDPOINT=/api/signup
   - VERCEL_ORG_ID and VERCEL_PROJECT_ID as secrets

4. DNS configuration instructions:
   - CNAME record for noizy.ai → cname.vercel-dns.com
   - Keep Cloudflare proxy (orange cloud) enabled
   - SSL mode: Full (strict) on Cloudflare side
```

---

## Prompt 7: Reusable Workflow Template for All NOIZY Repos

```
I have 10 repos under the Noizyfish GitHub org:
- GABRIEL (main orchestrator + HEAVEN worker)
- NOIZYLAB (tech services)
- MC96 (browser panel)
- noizy-landing (public website)
- dreamchamber (streaming UI)
- voice-bridge (synthesis pipeline)
- hvs-schema (D1 database migrations)
- noizy-docs (documentation)
- agent-configs (agent persona definitions)
- infrastructure (Docker, CI/CD, scripts)

Create a reusable GitHub Actions workflow template at 
.github/workflows/noizy-ci.yml in the infrastructure repo 
that other repos can call with:

  uses: Noizyfish/infrastructure/.github/workflows/noizy-ci.yml@main

The template should accept inputs:
- node_version (default: "20")
- run_lint (default: true)
- run_tests (default: true)
- deploy_target: "cloudflare" | "vercel" | "docker" | "none"
- cloudflare_worker_name (optional)
- vercel_project_id (optional)

Steps:
1. Checkout code
2. Setup Node.js with caching
3. Install dependencies (npm ci)
4. Lint (if enabled): eslint + prettier check
5. Type check: tsc --noEmit
6. Test (if enabled): vitest with coverage report
7. Security: gitleaks scan
8. Deploy based on target:
   - cloudflare: wrangler deploy
   - vercel: vercel deploy --prod
   - docker: docker build + push to ghcr.io/noizyfish/{repo}
   - none: skip
9. Post-deploy smoke test (curl health endpoint)

Include a calling example for each repo type.
```

---

## How to Use These Prompts

Feed them to Gordon one at a time. Start with Prompt 1 (the compose file) because everything else depends on it. After each response from Gordon, review the output and paste it back for refinement if needed.

The prompts are designed to be:
- **Specific** — exact ports, image names, UUIDs, and paths
- **Complete** — Gordon shouldn't need to guess anything
- **ARM64-aware** — M2 Ultra is aarch64, not x86
- **Security-first** — secrets in .env, no root, capabilities dropped
- **NOIZY-aligned** — the 9 architectural constraints from the 2036 vision are embedded (versioned APIs, idempotency, append-only patterns)

---

*"The gap between 2036 and 2026 is infrastructure, not imagination."*  
— Robert Stephen Plowman
