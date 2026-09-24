#!/usr/bin/env bash
# ============================================================
# ORGANIZE — Copy all session output into ~/Desktop/CLAUDE TODAY/
# Run: chmod +x organize.sh && ./organize.sh
# ============================================================

set -e

TARGET="$HOME/Desktop/CLAUDE TODAY"
SCRATCH="$HOME/.gemini/antigravity/scratch/noizy-100"
HEAVEN="/tmp/Heaven"
BRAIN="$HOME/.gemini/antigravity/brain/308e0e42-576b-4570-a7c3-d3582f85fc53"

mkdir -p "$TARGET"

echo "🗂️  ORGANIZING — CLAUDE TODAY"
echo "================================"

# ─── 1. Heaven Worker (Cloudflare Edge Gateway) ──────────────
echo "📁 1/7 — Heaven Worker"
mkdir -p "$TARGET/01-HEAVEN-WORKER"
cp "$HEAVEN/worker/wrangler.jsonc"    "$TARGET/01-HEAVEN-WORKER/"
cp "$HEAVEN/worker/package.json"      "$TARGET/01-HEAVEN-WORKER/"
cp "$HEAVEN/worker/tsconfig.json"     "$TARGET/01-HEAVEN-WORKER/"
cp "$HEAVEN/worker/schema.sql"        "$TARGET/01-HEAVEN-WORKER/"
mkdir -p "$TARGET/01-HEAVEN-WORKER/src"
cp "$HEAVEN/worker/src/index.ts"      "$TARGET/01-HEAVEN-WORKER/src/"

# ─── 2. Heaven Express Origin (Docker API) ───────────────────
echo "📁 2/7 — Heaven Express Origin"
mkdir -p "$TARGET/02-HEAVEN-ORIGIN/src/middleware"
cp "$HEAVEN/Docker/heaven/package.json"              "$TARGET/02-HEAVEN-ORIGIN/"
cp "$HEAVEN/Docker/heaven/src/index.js"              "$TARGET/02-HEAVEN-ORIGIN/src/"
cp "$HEAVEN/Docker/heaven/src/middleware/access-jwt.js" "$TARGET/02-HEAVEN-ORIGIN/src/middleware/"

# ─── 3. Cloudflare Infrastructure ────────────────────────────
echo "📁 3/7 — Cloudflare Infrastructure"
mkdir -p "$TARGET/03-CLOUDFLARE"
cp "$HEAVEN/cloudflare/tunnel-config.yml"  "$TARGET/03-CLOUDFLARE/"
cp "$HEAVEN/scripts/setup-tunnel.sh"       "$TARGET/03-CLOUDFLARE/"
chmod +x "$TARGET/03-CLOUDFLARE/setup-tunnel.sh"

# ─── 4. DREAMCHAMBER Agent Prompts (all 8) ───────────────────
echo "📁 4/7 — DREAMCHAMBER Agent Prompts"
mkdir -p "$TARGET/04-AGENT-PROMPTS"
if [ -d "$SCRATCH/DREAMCHAMBER/wisdom/prompts" ]; then
  cp "$SCRATCH/DREAMCHAMBER/wisdom/prompts/"*.md "$TARGET/04-AGENT-PROMPTS/"
fi

# ─── 5. METABEAST v2 (AQUARIUM Scanner) ──────────────────────
echo "📁 5/7 — ENGR METABEAST v2"
mkdir -p "$TARGET/05-METABEAST"
if [ -f "$SCRATCH/DREAMCHAMBER/ops/agents/engr_metabeast_v2.py" ]; then
  cp "$SCRATCH/DREAMCHAMBER/ops/agents/engr_metabeast_v2.py" "$TARGET/05-METABEAST/"
fi

# ─── 6. Brand READMEs (for empty repos) ──────────────────────
echo "📁 6/7 — Brand READMEs"
mkdir -p "$TARGET/06-BRAND-READMES/NOIZY-AI"
mkdir -p "$TARGET/06-BRAND-READMES/NOIZYFISH"
mkdir -p "$TARGET/06-BRAND-READMES/NOIZYVOX"
mkdir -p "$TARGET/06-BRAND-READMES/HVS"
[ -f "$SCRATCH/NOIZY-AI/README.md" ]  && cp "$SCRATCH/NOIZY-AI/README.md"  "$TARGET/06-BRAND-READMES/NOIZY-AI/"
[ -f "$SCRATCH/NOIZYFISH/README.md" ] && cp "$SCRATCH/NOIZYFISH/README.md" "$TARGET/06-BRAND-READMES/NOIZYFISH/"
[ -f "$SCRATCH/NOIZYVOX/README.md" ]  && cp "$SCRATCH/NOIZYVOX/README.md"  "$TARGET/06-BRAND-READMES/NOIZYVOX/"
[ -f "$SCRATCH/HVS/README.md" ]       && cp "$SCRATCH/HVS/README.md"       "$TARGET/06-BRAND-READMES/HVS/"

# ─── 7. Runbooks & Plans ─────────────────────────────────────
echo "📁 7/7 — Runbooks & Plans"
mkdir -p "$TARGET/07-RUNBOOKS"
[ -f "$BRAIN/cloudflare_lockdown_runbook.md" ] && cp "$BRAIN/cloudflare_lockdown_runbook.md" "$TARGET/07-RUNBOOKS/"
[ -f "$BRAIN/heaven_milestones.md" ]           && cp "$BRAIN/heaven_milestones.md"           "$TARGET/07-RUNBOOKS/"
[ -f "$BRAIN/noizy_100_plan.md" ]              && cp "$BRAIN/noizy_100_plan.md"              "$TARGET/07-RUNBOOKS/"
[ -f "$BRAIN/heaven_ground_truth.md" ]         && cp "$BRAIN/heaven_ground_truth.md"         "$TARGET/07-RUNBOOKS/"
[ -f "$BRAIN/metabeast_review.md" ]            && cp "$BRAIN/metabeast_review.md"            "$TARGET/07-RUNBOOKS/"

# ─── INDEX ────────────────────────────────────────────────────
cat > "$TARGET/INDEX.md" << 'INDEXEOF'
# CLAUDE TODAY — 2026-04-11
> Everything built in one session. Organized. Ready to deploy.

---

## 📁 Folder Structure

```
CLAUDE TODAY/
├── INDEX.md                              ← You are here
│
├── 01-HEAVEN-WORKER/                     ← Cloudflare Worker (edge gateway)
│   ├── wrangler.jsonc                    ← Config — deploy with `wrangler deploy`
│   ├── package.json
│   ├── tsconfig.json
│   ├── schema.sql                        ← D1 database schema
│   └── src/index.ts                      ← 428 lines — routing, JWT, agent proxy
│
├── 02-HEAVEN-ORIGIN/                     ← Express API (runs on GOD behind tunnel)
│   ├── package.json
│   └── src/
│       ├── index.js                      ← Express server with JWT validation
│       └── middleware/access-jwt.js       ← Cf-Access-Jwt-Assertion validator
│
├── 03-CLOUDFLARE/                        ← Infrastructure scripts
│   ├── tunnel-config.yml                 ← All 10 ingress routes, Access required
│   └── setup-tunnel.sh                   ← One-shot: create tunnel, route DNS, go
│
├── 04-AGENT-PROMPTS/                     ← All 8 DREAMCHAMBER family prompts
│   ├── CLAUDE_PROMPT.md                  ← Strategist / Creative Brain
│   ├── LUCY_PROMPT.md                    ← Voice Estate Guardian
│   ├── ENGR_KEITH_PROMPT.md              ← Infrastructure Engineer
│   ├── CB01_PROMPT.md                    ← Consent & Contracts Bot
│   ├── HEAVEN_PROMPT.md                  ← DNS & Domain Sovereign
│   ├── SHIRL_PROMPT.md                   ← Sample Intelligence Analyst
│   ├── DREAM_PROMPT.md                   ← DAW Whisperer
│   └── POPS_PROMPT.md                    ← No-Code Orchestrator
│
├── 05-METABEAST/                         ← AQUARIUM Intelligence Scanner
│   └── engr_metabeast_v2.py              ← 10-worker parallel audio cataloger
│
├── 06-BRAND-READMES/                     ← Complete READMEs for empty repos
│   ├── NOIZY-AI/README.md                ← The Mothership
│   ├── NOIZYFISH/README.md               ← Master Brand
│   ├── NOIZYVOX/README.md                ← Voice Estate / A.I.V.A.
│   └── HVS/README.md                     ← Human Voice Sovereignty
│
└── 07-RUNBOOKS/                          ← Strategy & tracking docs
    ├── cloudflare_lockdown_runbook.md     ← 10-step Cloudflare execution plan
    ├── heaven_milestones.md              ← 7 separate deployment milestones
    ├── heaven_ground_truth.md            ← What exists vs. what was assumed
    ├── noizy_100_plan.md                 ← All 6 brands → 100% completion
    └── metabeast_review.md               ← Code review: 9 bugs fixed
```

---

## Deployment Priority

1. **Deploy Heaven Worker** → `cd 01-HEAVEN-WORKER && npm install && npm run deploy`
2. **Fix noizy.ai nameservers** → Registrar dashboard
3. **Start tunnel on GOD** → `./03-CLOUDFLARE/setup-tunnel.sh`
4. **Push agent prompts** → Copy `04-AGENT-PROMPTS/` into DREAMCHAMBER repo
5. **Push brand READMEs** → Copy from `06-BRAND-READMES/` into each repo

---

*GORUNFREE. TECHNICOLOR FIREWORKS. 🎆*
INDEXEOF

echo ""
echo "================================"
echo "✅ ORGANIZED — ~/Desktop/CLAUDE TODAY/"
echo "================================"
echo ""
echo "  01-HEAVEN-WORKER/     Cloudflare Worker"
echo "  02-HEAVEN-ORIGIN/     Express API (Docker)"
echo "  03-CLOUDFLARE/        Tunnel + setup script"
echo "  04-AGENT-PROMPTS/     8 family member prompts"
echo "  05-METABEAST/         AQUARIUM scanner"
echo "  06-BRAND-READMES/     4 brand READMEs"
echo "  07-RUNBOOKS/          5 strategy docs"
echo ""
echo "  INDEX.md              Master table of contents"
echo ""
echo "GORUNFREE. 🐟"
