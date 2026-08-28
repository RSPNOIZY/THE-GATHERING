# HEAVEN17 — GABRIEL's Edge Brain
## One-Command Deployment

### What This Does
Replaces the Hello World stub on Cloudflare with GABRIEL's real API router.
Connects to ALL 7 of your D1 databases and 3 KV namespaces.
Runs a heartbeat cron every 5 minutes so GABRIEL is always alive.

### Prerequisites
- Node.js installed (your M2 Ultra has this)
- Cloudflare account logged in via Wrangler

### Deploy in 3 Steps

**Step 1: Open Terminal on your Mac**
Navigate to this folder:
```
cd "path/to/CLAUDE TODAY/HEAVEN17"
```

**Step 2: Install & Login**
```
npm install
npx wrangler login
```
(This opens your browser to authenticate with Cloudflare)

**Step 3: Deploy**
```
npm run deploy
```

That's it. GABRIEL goes live on Cloudflare's edge network worldwide.

### After Deployment — Test It

Visit these URLs (replace YOUR_SUBDOMAIN with your workers.dev subdomain):

- `https://deploy.YOUR_SUBDOMAIN.workers.dev/` → Health check
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/gabriel` → GABRIEL identity
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/status` → Full system status
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/agents` → All 7 AI family agents
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/memcells/stats` → Memory stats
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/aquarium/projects` → 40 years of work
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/consent/ledger` → RSP_001 consent
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/platforms` → All tracked platforms
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/login-issues` → Open login problems
- `https://deploy.YOUR_SUBDOMAIN.workers.dev/godaddy/status` → Escape progress

### API Routes (Complete)

| Route | Method | What It Does |
|-------|--------|-------------|
| `/` or `/health` | GET | System health + binding status |
| `/status` | GET | Full system status with DB counts |
| `/gabriel` | GET | GABRIEL's identity card |
| `/agents` | GET | All AI family agents |
| `/agents/:name` | GET | Single agent detail + related memcells |
| `/memcells` | GET | Browse memcells (?type=X&q=search&limit=50) |
| `/memcells/stats` | GET | Memcell counts by type |
| `/aquarium/projects` | GET | All 20 creative projects |
| `/aquarium/credits` | GET | All 16 career credits |
| `/consent/ledger` | GET | Voice consent entries |
| `/voice/models` | GET | Registered voice models |
| `/platforms` | GET | All tracked platforms |
| `/accounts` | GET | All tracked accounts |
| `/login-issues` | GET | Open login issues |
| `/godaddy/status` | GET | GoDaddy escape progress |
| `/budget/summary` | GET | Budget database tables |
| `/kv/get?key=X` | GET | Read from GABRIEL_KV |
| `/kv/set` | POST | Write to GABRIEL_KV |
