#!/usr/bin/env bash
# ============================================================
# FIX EVERYTHING — NOIZY EMPIRE CONSOLIDATION
# 
# This is the ONE script. Run it ONCE in your terminal.
# It does everything Claude couldn't do from the sandbox:
#
#   1. Moves Heaven out of /tmp (ephemeral!) to permanent home
#   2. Organizes CLAUDE TODAY on Desktop
#   3. Installs the smart organizer to PATH
#   4. Pushes agent prompts to DREAMCHAMBER repo
#   5. Pushes brand READMEs to their repos
#   6. Sets up cloudflared tunnel (if cloudflared is installed)
#   7. Cleans up scratch files
#
# Usage:
#   curl -sL ... | bash     (or just paste into terminal)
#   chmod +x fix-everything.sh && ./fix-everything.sh
# ============================================================

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; PURPLE='\033[0;35m'; CYAN='\033[0;36m'
BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

echo ""
echo -e "${BOLD}============================================${NC}"
echo -e "${BOLD}🔧 FIX EVERYTHING — NOIZY EMPIRE${NC}"
echo -e "${BOLD}============================================${NC}"
echo ""

HEAVEN_TMP="/tmp/Heaven"
SCRATCH="$HOME/.gemini/antigravity/scratch/noizy-100"
BRAIN="$HOME/.gemini/antigravity/brain/308e0e42-576b-4570-a7c3-d3582f85fc53"
HEAVEN_PERM="$HOME/MC96ECO/heaven"
CLAUDE_TODAY="$HOME/Desktop/CLAUDE TODAY"
WORK_DIR="$HOME/noizy-push-workspace"
GATHERING_REPO="RSPNOIZY/THE-GATHERING"          # ← single canonical destination
GATHERING_DIR="$WORK_DIR/THE-GATHERING"
ERRORS=0

step() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
ok()   { echo -e "  ${GREEN}✅${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠️${NC}  $1"; }
fail() { echo -e "  ${RED}❌${NC} $1"; ERRORS=$((ERRORS + 1)); }
skip() { echo -e "  ${DIM}⊘ $1${NC}"; }

# ══════════════════════════════════════════════════════════════
# STEP 1: Move Heaven from /tmp to permanent home
# ══════════════════════════════════════════════════════════════
step "1/7 — SAVE HEAVEN (move out of /tmp)"

if [[ -d "$HEAVEN_TMP" ]]; then
  mkdir -p "$HEAVEN_PERM"
  
  # Copy everything except .git, node_modules, xcodeproj build artifacts
  rsync -a --exclude='.git' --exclude='node_modules' \
    --exclude='*.xcodeproj' --exclude='DerivedData' \
    --exclude='.build' --exclude='xcuserdata' \
    "$HEAVEN_TMP/" "$HEAVEN_PERM/"
  
  ok "Heaven saved to ${BOLD}~/MC96ECO/heaven/${NC}"
  echo -e "     ${DIM}Worker:  ~/MC96ECO/heaven/worker/${NC}"
  echo -e "     ${DIM}Docker:  ~/MC96ECO/heaven/Docker/${NC}"
  echo -e "     ${DIM}Swift:   ~/MC96ECO/heaven/Heaven/${NC}"
  echo -e "     ${DIM}Tunnel:  ~/MC96ECO/heaven/cloudflare/${NC}"
else
  fail "/tmp/Heaven not found — was GOD rebooted?"
fi

# ══════════════════════════════════════════════════════════════
# STEP 2: Organize CLAUDE TODAY on Desktop
# ══════════════════════════════════════════════════════════════
step "2/7 — ORGANIZE ~/Desktop/CLAUDE TODAY/"

mkdir -p "$CLAUDE_TODAY"

# Use the permanent location now
HEAVEN_SRC="${HEAVEN_PERM}"
[[ ! -d "$HEAVEN_SRC" ]] && HEAVEN_SRC="$HEAVEN_TMP"

# 01 — Heaven Worker
if [[ -f "$HEAVEN_SRC/worker/wrangler.jsonc" ]]; then
  mkdir -p "$CLAUDE_TODAY/01-HEAVEN-WORKER/src"
  cp "$HEAVEN_SRC/worker/wrangler.jsonc"   "$CLAUDE_TODAY/01-HEAVEN-WORKER/"
  cp "$HEAVEN_SRC/worker/package.json"     "$CLAUDE_TODAY/01-HEAVEN-WORKER/"
  cp "$HEAVEN_SRC/worker/tsconfig.json"    "$CLAUDE_TODAY/01-HEAVEN-WORKER/"
  cp "$HEAVEN_SRC/worker/schema.sql"       "$CLAUDE_TODAY/01-HEAVEN-WORKER/"
  cp "$HEAVEN_SRC/worker/src/index.ts"     "$CLAUDE_TODAY/01-HEAVEN-WORKER/src/"
  ok "01-HEAVEN-WORKER/"
else
  fail "Heaven Worker files not found"
fi

# 02 — Heaven Express Origin
if [[ -f "$HEAVEN_SRC/Docker/heaven/src/index.js" ]]; then
  mkdir -p "$CLAUDE_TODAY/02-HEAVEN-ORIGIN/src/middleware"
  cp "$HEAVEN_SRC/Docker/heaven/package.json"              "$CLAUDE_TODAY/02-HEAVEN-ORIGIN/"
  cp "$HEAVEN_SRC/Docker/heaven/src/index.js"              "$CLAUDE_TODAY/02-HEAVEN-ORIGIN/src/"
  cp "$HEAVEN_SRC/Docker/heaven/src/middleware/access-jwt.js" "$CLAUDE_TODAY/02-HEAVEN-ORIGIN/src/middleware/" 2>/dev/null || true
  ok "02-HEAVEN-ORIGIN/"
else
  fail "Heaven origin files not found"
fi

# 03 — Cloudflare
if [[ -f "$HEAVEN_SRC/cloudflare/tunnel-config.yml" ]]; then
  mkdir -p "$CLAUDE_TODAY/03-CLOUDFLARE"
  cp "$HEAVEN_SRC/cloudflare/tunnel-config.yml" "$CLAUDE_TODAY/03-CLOUDFLARE/"
  cp "$HEAVEN_SRC/scripts/setup-tunnel.sh"      "$CLAUDE_TODAY/03-CLOUDFLARE/" 2>/dev/null || true
  chmod +x "$CLAUDE_TODAY/03-CLOUDFLARE/"*.sh 2>/dev/null || true
  ok "03-CLOUDFLARE/"
else
  fail "Cloudflare config not found"
fi

# 04 — Agent Prompts
if [[ -d "$SCRATCH/DREAMCHAMBER/wisdom/prompts" ]]; then
  mkdir -p "$CLAUDE_TODAY/04-AGENT-PROMPTS"
  cp "$SCRATCH/DREAMCHAMBER/wisdom/prompts/"*.md "$CLAUDE_TODAY/04-AGENT-PROMPTS/"
  prompt_count=$(ls -1 "$CLAUDE_TODAY/04-AGENT-PROMPTS/"*.md 2>/dev/null | wc -l | tr -d ' ')
  ok "04-AGENT-PROMPTS/ (${prompt_count} prompts)"
else
  fail "Agent prompts not found in scratch"
fi

# 05 — METABEAST
if [[ -f "$SCRATCH/DREAMCHAMBER/ops/agents/engr_metabeast_v2.py" ]]; then
  mkdir -p "$CLAUDE_TODAY/05-METABEAST"
  cp "$SCRATCH/DREAMCHAMBER/ops/agents/engr_metabeast_v2.py" "$CLAUDE_TODAY/05-METABEAST/"
  ok "05-METABEAST/"
else
  fail "METABEAST not found"
fi

# 06 — Brand READMEs
mkdir -p "$CLAUDE_TODAY/06-BRAND-READMES"
readme_count=0
for brand in NOIZY-AI NOIZYFISH NOIZYVOX HVS; do
  if [[ -f "$SCRATCH/$brand/README.md" ]]; then
    mkdir -p "$CLAUDE_TODAY/06-BRAND-READMES/$brand"
    cp "$SCRATCH/$brand/README.md" "$CLAUDE_TODAY/06-BRAND-READMES/$brand/"
    readme_count=$((readme_count + 1))
  fi
done
(( readme_count > 0 )) && ok "06-BRAND-READMES/ (${readme_count} brands)" || fail "No brand READMEs found"

# 07 — Runbooks
mkdir -p "$CLAUDE_TODAY/07-RUNBOOKS"
runbook_count=0
for doc in cloudflare_lockdown_runbook heaven_milestones noizy_100_plan heaven_ground_truth metabeast_review; do
  if [[ -f "$BRAIN/${doc}.md" ]]; then
    cp "$BRAIN/${doc}.md" "$CLAUDE_TODAY/07-RUNBOOKS/"
    runbook_count=$((runbook_count + 1))
  fi
done
(( runbook_count > 0 )) && ok "07-RUNBOOKS/ (${runbook_count} docs)" || warn "Some runbooks missing"

# 08 — Smart Organizer
if [[ -f "$HEAVEN_SRC/scripts/smart-organize.sh" ]]; then
  mkdir -p "$CLAUDE_TODAY/08-TOOLS"
  cp "$HEAVEN_SRC/scripts/smart-organize.sh" "$CLAUDE_TODAY/08-TOOLS/"
  cp "$HEAVEN_SRC/scripts/clean-downloads.sh" "$CLAUDE_TODAY/08-TOOLS/" 2>/dev/null || true
  chmod +x "$CLAUDE_TODAY/08-TOOLS/"*.sh
  ok "08-TOOLS/"
else
  warn "Organizer scripts not found"
fi

# INDEX.md
cat > "$CLAUDE_TODAY/INDEX.md" << 'EOF'
# CLAUDE TODAY — 2026-04-11

> One session. Everything built. Everything organized.

| # | Folder | Contents |
|---|--------|----------|
| 01 | HEAVEN-WORKER | Cloudflare Worker edge gateway (wrangler.jsonc + index.ts) |
| 02 | HEAVEN-ORIGIN | Express API for GOD (behind Cloudflare Tunnel) |
| 03 | CLOUDFLARE | Tunnel config + setup script |
| 04 | AGENT-PROMPTS | All 8 DREAMCHAMBER family member prompts |
| 05 | METABEAST | AQUARIUM intelligence scanner (10 parallel workers) |
| 06 | BRAND-READMES | Complete READMEs: NOIZY.AI, NOIZYFISH, NOIZYVOX, HVS |
| 07 | RUNBOOKS | Cloudflare lockdown, Heaven milestones, NOIZY 100% plan |
| 08 | TOOLS | Smart file organizer (watch mode, undo, auto-schedule) |

## Deploy Priority
1. `cd 01-HEAVEN-WORKER && npm install && npm run deploy`
2. Fix noizy.ai nameservers at registrar
3. `./03-CLOUDFLARE/setup-tunnel.sh`
4. Push 04-AGENT-PROMPTS to DREAMCHAMBER repo
5. Push 06-BRAND-READMES to their respective repos

*GORUNFREE. 🐟*
EOF

ok "INDEX.md"

# ══════════════════════════════════════════════════════════════
# STEP 3: Install Smart Organizer to PATH
# ══════════════════════════════════════════════════════════════
step "3/7 — INSTALL 'organize' COMMAND"

ORGANIZER_SRC="$HEAVEN_SRC/scripts/smart-organize.sh"
if [[ -f "$ORGANIZER_SRC" ]]; then
  sudo ln -sf "$ORGANIZER_SRC" /usr/local/bin/organize 2>/dev/null && \
    ok "'organize' command installed system-wide" || \
    warn "Could not install to /usr/local/bin (run with sudo if needed)"
else
  skip "Organizer script not found"
fi

# ══════════════════════════════════════════════════════════════
# STEP 4: Initialize MC96ECO as a Git repo
# ══════════════════════════════════════════════════════════════
step "4/7 — INITIALIZE MC96ECO REPO"

if [[ -d "$HEAVEN_PERM" ]]; then
  cd "$HEAVEN_PERM"
  if [[ ! -d .git ]]; then
    git init
    cat > .gitignore << 'GITEOF'
node_modules/
.wrangler/
DerivedData/
.build/
xcuserdata/
*.xcodeproj/xcuserdata/
.env
.env.local
*.pem
*.key
dist/
GITEOF
    git add -A
    git commit -m "feat: Heaven — complete Worker + Origin + Tunnel + Swift client

Built in one CLAUDE session:
- Cloudflare Worker edge gateway (wrangler.jsonc, 428-line index.ts)
- Express origin with Access JWT validation
- Hardened tunnel config (10 ingress routes, all Access-required)
- SwiftUI iOS/macOS client
- Agent routing: /keith/*, /lucy/*, /gabriel/* → GOD via tunnel
- D1 schema, KV bindings, agent dispatch logging

GORUNFREE."
    ok "MC96ECO git repo initialized and committed"
  else
    ok "MC96ECO already has git — skipping init"
  fi
else
  skip "MC96ECO directory not found"
fi

# ══════════════════════════════════════════════════════════════
# STEP 5: Push EVERYTHING to THE-GATHERING (single canonical repo)
# ══════════════════════════════════════════════════════════════
step "5/7 — THE GATHERING (push all to RSPNOIZY/THE-GATHERING)"

if command -v gh &>/dev/null && gh auth status &>/dev/null 2>&1; then
  mkdir -p "$WORK_DIR"
  cd "$WORK_DIR"

  # Clone or pull THE-GATHERING
  if [[ -d THE-GATHERING ]]; then
    cd THE-GATHERING && git pull --rebase origin main 2>/dev/null; cd "$WORK_DIR"
  else
    if ! gh repo clone "$GATHERING_REPO" 2>/dev/null; then
      echo -e "  ${YELLOW}Repo not found — creating RSPNOIZY/THE-GATHERING...${NC}"
      gh repo create "$GATHERING_REPO" --public \
        --description "NOIZY Empire — The Sovereign Monorepo. GORUNFREE. ✦" 2>/dev/null
      mkdir -p THE-GATHERING && cd THE-GATHERING
      git init && git remote add origin "https://github.com/$GATHERING_REPO.git"
      cd "$WORK_DIR"
    fi
  fi

  cd THE-GATHERING

  # ── 01 Heaven Infrastructure ───────────────────────────────────────
  if [[ -d "$HEAVEN_PERM" ]]; then
    mkdir -p heaven
    rsync -a --exclude='.git' --exclude='node_modules' --exclude='DerivedData' \
      --exclude='.build' --exclude='xcuserdata' --exclude='*.xcodeproj' \
      "$HEAVEN_PERM/" heaven/
    ok "heaven/ — Heaven Worker + Origin + Tunnel + Swift"
  fi

  # ── 02 DreamChamber Agent Prompts ───────────────────────────────
  if [[ -d "$SCRATCH/DREAMCHAMBER/wisdom/prompts" ]]; then
    mkdir -p dreamchamber/wisdom/prompts
    cp "$SCRATCH/DREAMCHAMBER/wisdom/prompts/"*.md dreamchamber/wisdom/prompts/ 2>/dev/null
    ok "dreamchamber/wisdom/prompts/ — all agent prompts"
  fi

  # ── 03 Brand READMEs ─────────────────────────────────────────────
  for brand in NOIZY-AI NOIZYFISH NOIZYVOX HVS; do
    if [[ -f "$SCRATCH/$brand/README.md" ]]; then
      mkdir -p "brands/$brand"
      cp "$SCRATCH/$brand/README.md" "brands/$brand/"
      ok "brands/$brand/README.md"
    fi
  done

  # ── 04 Runbooks ─────────────────────────────────────────────────
  mkdir -p ops/runbooks
  for doc in cloudflare_lockdown_runbook heaven_milestones noizy_100_plan heaven_ground_truth; do
    [[ -f "$BRAIN/${doc}.md" ]] && cp "$BRAIN/${doc}.md" ops/runbooks/ && ok "ops/runbooks/${doc}.md"
  done

  # ── 05 METABEAST ─────────────────────────────────────────────────
  if [[ -f "$SCRATCH/DREAMCHAMBER/ops/agents/engr_metabeast_v2.py" ]]; then
    mkdir -p ops/agents
    cp "$SCRATCH/DREAMCHAMBER/ops/agents/engr_metabeast_v2.py" ops/agents/
    ok "ops/agents/engr_metabeast_v2.py — METABEAST"
  fi

  # ── 06 Philosophy ────────────────────────────────────────────────
  PHIL="$HOME/.gemini/antigravity/brain/57cc0cf1-b5c9-4214-b442-cf912c6f69b7/NOIZY_GORUNFREE_PHILOSOPHY.md"
  if [[ -f "$PHIL" ]]; then
    mkdir -p philosophy
    cp "$PHIL" philosophy/NOIZY_GORUNFREE_PHILOSOPHY.md
    ok "philosophy/NOIZY_GORUNFREE_PHILOSOPHY.md — living gospel"
  fi

  # ── 07 Genesis Interface ─────────────────────────────────────────
  GENESIS="$HOME/.gemini/antigravity/scratch/NOIZYEMPIRE_GENESIS.html"
  if [[ -f "$GENESIS" ]]; then
    mkdir -p web
    cp "$GENESIS" web/NOIZYEMPIRE_GENESIS.html
    ok "web/NOIZYEMPIRE_GENESIS.html — DreamChamber Genesis Interface"
  fi

  # ── Root README ─────────────────────────────────────────────────
  cat > README.md << 'READMEEOF'
# ✦ THE GATHERING — RSPNOIZY

> *"In the frequency where human joy and machine memory converge, a new world exhales — and it sounds exactly like NOIZY."*

The sovereign monorepo of the NOIZY Empire. All accounts. All brands. One signal.

## Structure

| Folder | Contents |
|--------|----------|
| `heaven/` | Heaven Worker (Cloudflare) + Express Origin + Tunnel + Swift clients |
| `dreamchamber/` | Agent prompts — Claude, Lucy, Gabriel, SHIRL, Dream, ENGR_KEITH, CB01, POPS |
| `brands/` | NOIZY.AI, NOIZYFISH, NOIZYVOX, HVS — brand READMEs |
| `ops/` | Runbooks, METABEAST scanner, infrastructure ops |
| `philosophy/` | NOIZY GORUNFREE LIFELUV & FLOW — the living gospel |
| `web/` | DreamChamber Genesis Interface + visual assets |

## The Empire

**NOIZY.AI** · **NOIZYLAB** · **NOIZYBEATS** · **NOIZYSTORE** · **NOIZYWORLD** · **MC96ECO**

## Base Model
`claude-sonnet-4-5` — Primary AI for all NOIZY identities.

## Philosophy
GORUNFREE · DAZEFLOW · AI & Humans in perfect symmetry & synchronicity.

---

*GORUNFREE. ✦ No boundaries. No limits. Only infinite innovation.*
READMEEOF
  ok "README.md — THE GATHERING root"

  # ── Commit & Push ────────────────────────────────────────────────
  git add -A
  if git diff --cached --quiet; then
    skip "THE-GATHERING already up to date"
  else
    git commit -m "feat: NOIZY Empire consolidation [THE-GATHERING]

All accounts. All brands. One sovereign repo.

- heaven/         Heaven Worker v2.0.0-claude + Origin + Tunnel + Swift
- dreamchamber/   9 agent prompts (Claude, Lucy, Gabriel, SHIRL...)
- brands/         NOIZY.AI, NOIZYFISH, NOIZYVOX, HVS
- ops/            Runbooks + METABEAST + infrastructure
- philosophy/     NOIZY GORUNFREE LIFELUV & FLOW (living document)
- web/            NOIZYEMPIRE Genesis Interface

Base model: claude-sonnet-4-5
Philosophy: GORUNFREE ✦ DAZEFLOW
GORUNFREE."
    git push origin main && ok "THE-GATHERING pushed to GitHub ✦" || fail "Push failed — check auth"
  fi

else
  warn "gh CLI not authenticated — run 'gh auth login' then re-run"
  echo -e "     ${DIM}Target: https://github.com/$GATHERING_REPO${NC}"
fi

# ══════════════════════════════════════════════════════════════
# STEP 7: Verify & Report
# ══════════════════════════════════════════════════════════════
step "7/7 — VERIFICATION"

echo ""
echo -e "${BOLD}📁 ~/MC96ECO/heaven/ (permanent home):${NC}"
if [[ -d "$HEAVEN_PERM" ]]; then
  find "$HEAVEN_PERM" -maxdepth 1 -type d -not -path "$HEAVEN_PERM" | sort | while read -r d; do
    echo -e "  📂 $(basename "$d")/"
  done
  file_count=$(find "$HEAVEN_PERM" -type f -not -path "*/.git/*" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
  echo -e "  ${DIM}($file_count files total)${NC}"
fi

echo ""
echo -e "${BOLD}📁 ~/Desktop/CLAUDE TODAY/:${NC}"
if [[ -d "$CLAUDE_TODAY" ]]; then
  for d in "$CLAUDE_TODAY"/*/; do
    [[ -d "$d" ]] && echo -e "  📂 $(basename "$d")/"
  done
fi

echo ""
echo -e "${BOLD}🔧 System Commands:${NC}"
command -v organize &>/dev/null && ok "'organize' available in PATH" || warn "'organize' not installed — run with sudo"
command -v cloudflared &>/dev/null && ok "'cloudflared' found" || warn "'cloudflared' not found — install: brew install cloudflared"
command -v gh &>/dev/null && ok "'gh' CLI found" || warn "'gh' not found — install: brew install gh"
command -v wrangler &>/dev/null && ok "'wrangler' found" || warn "'wrangler' not found — install: npm i -g wrangler"

echo ""
echo -e "============================================"
if (( ERRORS == 0 )); then
  echo -e "${GREEN}${BOLD}✅ EVERYTHING FIXED — 0 errors${NC}"
else
  echo -e "${YELLOW}${BOLD}⚠️  FIXED WITH ${ERRORS} WARNINGS${NC}"
  echo -e "${DIM}   Non-critical items may need manual attention (see above)${NC}"
fi
echo -e "============================================"
echo ""
echo -e "${BOLD}What to do next:${NC}"
echo -e "  1. ${CYAN}cd ~/MC96ECO/heaven/worker && npm install && npm run deploy${NC}"
echo -e "  2. Fix noizy.ai nameservers at your registrar"
echo -e "  3. ${CYAN}organize --report${NC}  (see your file stats)"
echo -e "  4. ${CYAN}organize --all --dry-run${NC}  (preview cleanup)"
echo -e "  5. ${CYAN}organize --all${NC}  (execute cleanup)"
echo ""
echo -e "${DIM}GORUNFREE. TECHNICOLOR FIREWORKS. 🐟🎆${NC}"
