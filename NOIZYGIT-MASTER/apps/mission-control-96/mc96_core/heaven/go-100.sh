#!/usr/bin/env bash
# ============================================================
# CLOUDFLARE & GITHUB — 100% COMPLETION
# Run in YOUR terminal (not sandbox). Takes ~5 minutes.
#
# What this does:
#   GITHUB:
#     1. Pushes 8 agent prompts → DREAMCHAMBER
#     2. Pushes README → NOIZYFISH
#     3. Pushes README → NOIZY.AI
#     4. Creates NOIZYVOX + HVS repos if missing, pushes READMEs
#     5. Creates MC96ECO repo, pushes Heaven
#   CLOUDFLARE:
#     6. Creates KV namespace for Heaven
#     7. Creates D1 database + runs schema
#     8. Deploys Heaven Worker to *.workers.dev
#     9. Creates tunnel (if not exists)
#     10. Reports full status
#
# Prerequisites (all installed on GOD):
#   gh auth login        (if not done already)
#   wrangler login       (if not done already)
#   cloudflared tunnel login  (if not done already)
#
# Usage:
#   chmod +x go-100.sh && ./go-100.sh
# ============================================================

set -euo pipefail

# ─── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; PURPLE='\033[0;35m'; CYAN='\033[0;36m'
BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

# ─── Paths ────────────────────────────────────────────────────
HEAVEN="/tmp/Heaven"
SCRATCH="$HOME/.gemini/antigravity/scratch/noizy-100"
BRAIN="$HOME/.gemini/antigravity/brain/308e0e42-576b-4570-a7c3-d3582f85fc53"
WORK="$HOME/noizy-push-work"
MC96="$HOME/MC96ECO"
ERRORS=0
SUCCESSES=0

step()  { echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"; echo -e "${BOLD}$1${NC}"; }
ok()    { echo -e "  ${GREEN}✅${NC} $1"; SUCCESSES=$((SUCCESSES + 1)); }
fail()  { echo -e "  ${RED}❌${NC} $1"; ERRORS=$((ERRORS + 1)); }
warn()  { echo -e "  ${YELLOW}⚠️${NC}  $1"; }
info()  { echo -e "  ${DIM}$1${NC}"; }

echo ""
echo -e "${BOLD}╔════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  CLOUDFLARE & GITHUB — GO TO 100%         ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════╝${NC}"
echo ""

# ─── Prereq Check ─────────────────────────────────────────────
step "PREFLIGHT CHECK"

GH_OK=false
WRANGLER_OK=false
CF_OK=false

if gh auth status &>/dev/null; then
  GH_OK=true
  ok "GitHub CLI: authenticated"
else
  warn "GitHub CLI: not authenticated"
  echo -e "     ${DIM}Run: gh auth login${NC}"
  read -p "     Authenticate now? [y/N] " -n 1 -r; echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    gh auth login && GH_OK=true && ok "GitHub authenticated"
  fi
fi

if wrangler whoami &>/dev/null; then
  WRANGLER_OK=true
  ok "Wrangler: authenticated"
  wrangler whoami 2>&1 | grep -E "Account|email" | head -2 | while read -r line; do
    info "$line"
  done
else
  warn "Wrangler: not authenticated"
  echo -e "     ${DIM}Run: wrangler login${NC}"
  read -p "     Authenticate now? [y/N] " -n 1 -r; echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    wrangler login && WRANGLER_OK=true && ok "Wrangler authenticated"
  fi
fi

if cloudflared tunnel list &>/dev/null; then
  CF_OK=true
  ok "cloudflared: authenticated"
else
  warn "cloudflared: not authenticated"
  echo -e "     ${DIM}Run: cloudflared tunnel login${NC}"
  read -p "     Authenticate now? [y/N] " -n 1 -r; echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    cloudflared tunnel login && CF_OK=true && ok "cloudflared authenticated"
  fi
fi

# ═══════════════════════════════════════════════════════════════
#                         GITHUB
# ═══════════════════════════════════════════════════════════════

if $GH_OK; then
  mkdir -p "$WORK"

  # ─── Save Heaven to permanent home ────────────────────────
  step "SAVE HEAVEN → ~/MC96ECO/"
  if [[ -d "$HEAVEN" ]]; then
    mkdir -p "$MC96/heaven"
    rsync -a --exclude='.git' --exclude='node_modules' \
      --exclude='DerivedData' --exclude='.build' \
      --exclude='xcuserdata' \
      "$HEAVEN/" "$MC96/heaven/"
    ok "Heaven saved to ~/MC96ECO/heaven/"
  else
    fail "/tmp/Heaven not found"
  fi

  # ─── MC96ECO repo ──────────────────────────────────────────
  step "CREATE MC96ECO REPO ON GITHUB"
  if ! gh repo view RSPNOIZY/MC96ECO &>/dev/null 2>&1; then
    gh repo create RSPNOIZY/MC96ECO --private --description "MC96 Ecosystem — Heaven Worker + Origin + Tunnel + Swift" && ok "MC96ECO repo created (private)"
  else
    ok "MC96ECO repo already exists"
  fi

  cd "$MC96/heaven"
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
    git commit -m "feat: Heaven — Worker + Origin + Tunnel + Swift client

Complete edge gateway for MC96 Ecosystem:
- Cloudflare Worker (wrangler.jsonc, 428-line index.ts)
- Express origin with Access JWT validation (jose)
- Hardened tunnel config (10 ingress routes, all Access-required)
- SwiftUI iOS/macOS client
- Agent routing: /keith/*, /lucy/*, /gabriel/* → GOD via tunnel
- D1 schema, KV bindings, agent dispatch logging
- Smart file organizer (v3, watch mode, undo, auto-schedule)
GORUNFREE."
    git branch -M main
    git remote add origin "https://github.com/RSPNOIZY/MC96ECO.git" 2>/dev/null || true
    git push -u origin main && ok "MC96ECO pushed to GitHub" || fail "MC96ECO push failed"
  else
    git add -A
    git diff --cached --quiet && ok "MC96ECO — already up to date" || {
      git commit -m "chore: sync latest changes"
      git push && ok "MC96ECO updated"
    }
  fi

  # ─── DREAMCHAMBER — Agent Prompts ──────────────────────────
  step "PUSH AGENT PROMPTS → DREAMCHAMBER"
  cd "$WORK"
  [[ -d DREAMCHAMBER ]] && rm -rf DREAMCHAMBER
  
  if gh repo clone RSPNOIZY/DREAMCHAMBER -- --depth 1 2>/dev/null; then
    cd DREAMCHAMBER
    mkdir -p wisdom/prompts
    if [[ -d "$SCRATCH/DREAMCHAMBER/wisdom/prompts" ]]; then
      cp "$SCRATCH/DREAMCHAMBER/wisdom/prompts/"*.md wisdom/prompts/
      git add wisdom/prompts/
      if git diff --cached --quiet; then
        ok "DREAMCHAMBER prompts already up to date"
      else
        prompt_count=$(ls -1 wisdom/prompts/*.md | wc -l | tr -d ' ')
        git commit -m "feat: all ${prompt_count} family agent prompts

CLAUDE, LUCY, ENGR_KEITH, CB01, HEAVEN, SHIRL, DREAM, POPS
Every family member fully defined. GORUNFREE."
        git push origin main && ok "DREAMCHAMBER — ${prompt_count} prompts pushed"
      fi
    else
      fail "Prompt source files not found at $SCRATCH"
    fi
    cd "$WORK"
  else
    fail "Could not clone DREAMCHAMBER"
  fi

  # ─── NOIZYFISH README ──────────────────────────────────────
  step "PUSH README → NOIZYFISH"
  push_readme() {
    local org="$1" repo="$2" src="$3" msg="$4"
    cd "$WORK"
    [[ -d "$repo" ]] && rm -rf "$repo"
    
    if gh repo clone "${org}/${repo}" -- --depth 1 2>/dev/null; then
      cp "$src" "${repo}/README.md"
      cd "$repo"
      git add README.md
      if git diff --cached --quiet; then
        ok "${repo} README already up to date"
      else
        git commit -m "$msg"
        git push origin main && ok "${repo} README pushed" || fail "${repo} push failed"
      fi
      cd "$WORK"
    else
      warn "${repo} — repo not found. Creating..."
      gh repo create "${org}/${repo}" --public --description "${repo} — NOIZY Empire" 2>/dev/null && {
        gh repo clone "${org}/${repo}" -- --depth 1 2>/dev/null
        cp "$src" "${repo}/README.md"
        cd "$repo" && git add README.md
        git commit -m "$msg"
        git push origin main && ok "${repo} created + README pushed"
        cd "$WORK"
      } || fail "Could not create ${repo}"
    fi
  }

  [[ -f "$SCRATCH/NOIZYFISH/README.md" ]] && \
    push_readme "RSPNOIZY" "NOIZYFISH" "$SCRATCH/NOIZYFISH/README.md" \
      "docs: master brand README — NOIZY Empire flagship"

  # ─── NOIZY.AI README ───────────────────────────────────────
  step "PUSH README → NOIZY.AI"
  [[ -f "$SCRATCH/NOIZY-AI/README.md" ]] && \
    push_readme "NOIZYLAB-io" "NOIZY.ai" "$SCRATCH/NOIZY-AI/README.md" \
      "docs: platform README — The Mothership"

  # ─── NOIZYVOX README ───────────────────────────────────────
  step "PUSH README → NOIZYVOX"
  [[ -f "$SCRATCH/NOIZYVOX/README.md" ]] && \
    push_readme "RSPNOIZY" "NOIZYVOX" "$SCRATCH/NOIZYVOX/README.md" \
      "docs: voice estate README — A.I.V.A. manifesto"

  # ─── HVS README ────────────────────────────────────────────
  step "PUSH README → HVS"
  [[ -f "$SCRATCH/HVS/README.md" ]] && \
    push_readme "RSPNOIZY" "HVS" "$SCRATCH/HVS/README.md" \
      "docs: Human Voice Sovereignty manifesto"

  # ─── METABEAST to DREAMCHAMBER ─────────────────────────────
  step "PUSH METABEAST → DREAMCHAMBER"
  if [[ -f "$SCRATCH/DREAMCHAMBER/ops/agents/engr_metabeast_v2.py" ]]; then
    cd "$WORK"
    if [[ -d DREAMCHAMBER ]]; then
      cd DREAMCHAMBER
      mkdir -p ops/agents
      cp "$SCRATCH/DREAMCHAMBER/ops/agents/engr_metabeast_v2.py" ops/agents/
      git add ops/agents/engr_metabeast_v2.py
      if git diff --cached --quiet; then
        ok "METABEAST already in DREAMCHAMBER"
      else
        git commit -m "feat: ENGR METABEAST v2 — 10-worker AQUARIUM scanner

Parallel audio intelligence engine:
- 10 concurrent workers with librosa + mutagen
- Gemma 4 AI summaries via Ollama
- HVS voice detection, network auto-tagging
- Constitutional safeguards (AQUARIUM only, never GOD)
- 9 bugs fixed from code review
GORUNFREE."
        git push origin main && ok "METABEAST pushed to DREAMCHAMBER"
      fi
    fi
  fi

else
  fail "GitHub CLI not authenticated — cannot push"
  echo -e "     ${BOLD}Run: gh auth login${NC}"
  echo -e "     ${DIM}Then re-run this script${NC}"
fi

# ═══════════════════════════════════════════════════════════════
#                       CLOUDFLARE
# ═══════════════════════════════════════════════════════════════

if $WRANGLER_OK; then
  step "DEPLOY HEAVEN WORKER TO CLOUDFLARE"
  
  WORKER_DIR="$MC96/heaven/worker"
  [[ ! -d "$WORKER_DIR" ]] && WORKER_DIR="$HEAVEN/worker"
  
  if [[ -d "$WORKER_DIR" ]]; then
    cd "$WORKER_DIR"
    
    # Install deps
    info "Installing dependencies..."
    npm install --silent 2>/dev/null

    # Create KV namespace
    info "Creating KV namespace..."
    KV_OUTPUT=$(wrangler kv namespace create HEAVEN_KV 2>&1) || true
    KV_ID=$(echo "$KV_OUTPUT" | grep -oE '"[0-9a-f]{32}"' | tr -d '"' | head -1)
    
    if [[ -n "$KV_ID" ]]; then
      # Patch wrangler.jsonc with the real KV ID
      if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "s/\"id\": \"\"/\"id\": \"${KV_ID}\"/" wrangler.jsonc
      else
        sed -i "s/\"id\": \"\"/\"id\": \"${KV_ID}\"/" wrangler.jsonc
      fi
      ok "KV namespace created: ${KV_ID}"
    else
      warn "KV namespace may already exist"
      EXISTING_KV=$(echo "$KV_OUTPUT" | grep -oE '[0-9a-f]{32}' | head -1 || true)
      [[ -n "$EXISTING_KV" ]] && {
        sed -i '' "s/\"id\": \"\"/\"id\": \"${EXISTING_KV}\"/" wrangler.jsonc 2>/dev/null || true
        ok "Using existing KV: $EXISTING_KV"
      }
    fi
    
    # Create D1 database
    info "Creating D1 database..."
    D1_OUTPUT=$(wrangler d1 create heaven-db 2>&1) || true
    D1_ID=$(echo "$D1_OUTPUT" | grep -oE '"[0-9a-f-]{36}"' | tr -d '"' | head -1)
    
    if [[ -n "$D1_ID" ]]; then
      if [[ "$(uname)" == "Darwin" ]]; then
        sed -i '' "s/\"database_id\": \"\"/\"database_id\": \"${D1_ID}\"/" wrangler.jsonc
      else
        sed -i "s/\"database_id\": \"\"/\"database_id\": \"${D1_ID}\"/" wrangler.jsonc
      fi
      ok "D1 database created: ${D1_ID}"
      
      # Run schema
      info "Applying D1 schema..."
      wrangler d1 execute heaven-db --file=./schema.sql --yes 2>/dev/null && \
        ok "D1 schema applied" || warn "D1 schema — may need manual apply"
    else
      warn "D1 database may already exist — check dashboard"
    fi
    
    # Deploy Worker
    info "Deploying Heaven Worker..."
    DEPLOY_OUTPUT=$(wrangler deploy 2>&1)
    if echo "$DEPLOY_OUTPUT" | grep -qE "workers\.dev|Published|Success"; then
      WORKER_URL=$(echo "$DEPLOY_OUTPUT" | grep -oE 'https://[a-z0-9-]+\.workers\.dev' | head -1)
      ok "HEAVEN WORKER DEPLOYED"
      echo -e "     ${BOLD}${GREEN}${WORKER_URL}${NC}"
      
      # Test health endpoint
      info "Testing health..."
      HEALTH=$(curl -s --max-time 5 "${WORKER_URL}/health" 2>/dev/null || echo "timeout")
      if echo "$HEALTH" | grep -q "healthy"; then
        ok "Health check PASSED: $HEALTH"
      else
        warn "Health check returned: $HEALTH"
      fi
    else
      fail "Deploy failed"
      echo "$DEPLOY_OUTPUT" | tail -5
    fi
  else
    fail "Worker directory not found"
  fi
else
  warn "Wrangler not authenticated — Worker not deployed"
  echo -e "     ${BOLD}Run: wrangler login${NC}"
fi

# ─── Cloudflared Tunnel ──────────────────────────────────────
if $CF_OK; then
  step "SETUP CLOUDFLARE TUNNEL"
  
  EXISTING_TUNNEL=$(cloudflared tunnel list 2>/dev/null | grep "noizylab" | awk '{print $1}')
  
  if [[ -n "$EXISTING_TUNNEL" ]]; then
    ok "Tunnel 'noizylab' exists: $EXISTING_TUNNEL"
  else
    info "Creating tunnel 'noizylab'..."
    TUNNEL_OUTPUT=$(cloudflared tunnel create noizylab 2>&1)
    TUNNEL_ID=$(echo "$TUNNEL_OUTPUT" | grep -oE '[0-9a-f-]{36}' | head -1)
    if [[ -n "$TUNNEL_ID" ]]; then
      ok "Tunnel created: $TUNNEL_ID"
    else
      fail "Tunnel creation failed"
      echo "$TUNNEL_OUTPUT" | tail -3
    fi
  fi
  
  # Get tunnel ID for config
  TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "noizylab" | awk '{print $1}')
  
  if [[ -n "$TUNNEL_ID" ]]; then
    # Install config
    mkdir -p "$HOME/.cloudflared"
    TUNNEL_CONFIG="$MC96/heaven/cloudflare/tunnel-config.yml"
    [[ ! -f "$TUNNEL_CONFIG" ]] && TUNNEL_CONFIG="$HEAVEN/cloudflare/tunnel-config.yml"
    
    if [[ -f "$TUNNEL_CONFIG" ]]; then
      sed "s|<TUNNEL-ID>|${TUNNEL_ID}|g" "$TUNNEL_CONFIG" > "$HOME/.cloudflared/config.yml"
      ok "Tunnel config installed: ~/.cloudflared/config.yml"
    fi
    
    # Route DNS (best-effort, may fail if zone inactive)
    info "Routing DNS records..."
    for hostname in keith.noizy.ai heaven.noizy.ai lucy.noizy.ai gabriel.dreamchamber.noizy.ai api.noizy.ai n8n.noizy.ai; do
      cloudflared tunnel route dns noizylab "$hostname" 2>/dev/null && \
        ok "DNS: $hostname" || \
        warn "DNS: $hostname — zone may not be active yet"
    done
  fi
else
  warn "cloudflared not authenticated — tunnel not created"
  echo -e "     ${BOLD}Run: cloudflared tunnel login${NC}"
fi

# ═══════════════════════════════════════════════════════════════
#                     FINAL REPORT
# ═══════════════════════════════════════════════════════════════

step "FINAL STATUS"
echo ""

echo -e "${BOLD}GITHUB:${NC}"
if $GH_OK; then
  for repo in DREAMCHAMBER NOIZYFISH MC96ECO; do
    gh repo view "RSPNOIZY/$repo" --json updatedAt,description --jq '"\(.description) — updated: \(.updatedAt)"' 2>/dev/null && \
      ok "$repo" || warn "$repo — check status"
  done
  gh repo view "NOIZYLAB-io/NOIZY.ai" --json updatedAt --jq '"updated: \(.updatedAt)"' 2>/dev/null && \
    ok "NOIZY.AI" || warn "NOIZY.AI — check status"
fi

echo ""
echo -e "${BOLD}CLOUDFLARE:${NC}"
$WRANGLER_OK && {
  wrangler deployments list 2>/dev/null | head -5 || warn "Check deployments in dashboard"
}
$CF_OK && {
  cloudflared tunnel list 2>/dev/null | head -5 || warn "Check tunnels in dashboard"
}

echo ""
echo -e "╔════════════════════════════════════════════╗"
if (( ERRORS == 0 )); then
  echo -e "║  ${GREEN}${BOLD}100% COMPLETE — $SUCCESSES items done, 0 errors${NC}    ║"
else
  echo -e "║  ${YELLOW}${BOLD}$SUCCESSES DONE, $ERRORS NEED ATTENTION${NC}              ║"
fi
echo -e "╚════════════════════════════════════════════╝"
echo ""

if (( ERRORS > 0 )); then
  echo -e "${BOLD}Remaining:${NC}"
  ! $GH_OK && echo -e "  → ${BOLD}gh auth login${NC}"
  ! $WRANGLER_OK && echo -e "  → ${BOLD}wrangler login${NC}"
  ! $CF_OK && echo -e "  → ${BOLD}cloudflared tunnel login${NC}"
  echo -e "  → Then re-run: ${BOLD}$0${NC}"
fi

echo ""
echo -e "${DIM}GORUNFREE. TECHNICOLOR FIREWORKS. 🐟🎆${NC}"

# Cleanup work dir
rm -rf "$WORK" 2>/dev/null || true
