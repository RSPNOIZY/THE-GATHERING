#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# SOVEREIGN MANIFEST v2.0 — Executive Activation Protocol
# Pre-deploy gate check: auth, infrastructure, D1 truth, local mesh, toolchain
# NEVER overwrites wrangler.jsonc, .env, or any live config
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

G='\033[0;32m' R='\033[0;31m' Y='\033[0;33m' C='\033[0;36m' B='\033[1m' N='\033[0m'
PASS=0; FAIL=0; WARN=0

gate() {
  local label="$1" result="$2"
  if [ "$result" = "pass" ]; then
    printf "  ${G}PASS${N}  %s\n" "$label"; PASS=$((PASS + 1))
  elif [ "$result" = "warn" ]; then
    printf "  ${Y}WARN${N}  %s\n" "$label"; WARN=$((WARN + 1))
  else
    printf "  ${R}FAIL${N}  %s\n" "$label"; FAIL=$((FAIL + 1))
  fi
}

echo ""
printf "${B}═══════════════════════════════════════════════════${N}\n"
printf "${B} SOVEREIGN MANIFEST v2.0${N}\n"
printf "${B} Host: $(hostname -s) — $(date -u +%Y-%m-%dT%H:%M:%SZ)${N}\n"
printf "${B} 5 days to April 17, 2026${N}\n"
printf "${B}═══════════════════════════════════════════════════${N}\n"

# ── MEMBRANE 1: Cloudflare ───────────────────────────────────────────────────
echo ""
printf "${C}── MEMBRANE 1: Cloudflare ──${N}\n"
CF_WHO=$(npx wrangler whoami 2>&1)
if echo "$CF_WHO" | grep -q "rsp@noizy.ai"; then
  gate "Wrangler authed (rsp@noizy.ai)" "pass"
else
  gate "Wrangler auth — run: npx wrangler login" "fail"
fi

HEALTH=$(curl -fsS --max-time 8 "https://heaven.rsp-5f3.workers.dev/health" 2>/dev/null || echo "")
if echo "$HEALTH" | grep -q "LIVE"; then
  VER=$(echo "$HEALTH" | python3 -c "import sys,json; print(json.load(sys.stdin).get('version','?'))" 2>/dev/null || echo "?")
  gate "Heaven LIVE (v$VER)" "pass"
else
  gate "Heaven not responding" "fail"
fi

AUTH_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "https://heaven.rsp-5f3.workers.dev/api/v1/actors")
if [ "$AUTH_CODE" = "401" ]; then
  gate "NOIZY_API_KEY enforced (401)" "pass"
else
  gate "Auth NOT enforced — set NOIZY_API_KEY secret" "fail"
fi

# DNS check
NS=$(dig +short noizy.ai NS 2>/dev/null | head -1)
if echo "$NS" | grep -q "cloudflare"; then
  gate "noizy.ai NS → Cloudflare" "pass"
else
  gate "noizy.ai NS → ${NS:-unknown} (need Cloudflare)" "warn"
fi

# ── MEMBRANE 2: GitHub ───────────────────────────────────────────────────────
echo ""
printf "${C}── MEMBRANE 2: GitHub ──${N}\n"
if gh auth status 2>&1 | grep -q "Logged in"; then
  GH_USER=$(gh auth status 2>&1 | grep -oE 'account \S+' | awk '{print $2}')
  gate "GitHub auth ($GH_USER)" "pass"
else
  gate "GitHub auth — run: gh auth login" "fail"
fi

REMOTE=$(git remote get-url origin 2>/dev/null || echo "none")
if echo "$REMOTE" | grep -q "RSPNOIZY"; then
  gate "Remote: $REMOTE" "pass"
else
  gate "Git remote not set" "warn"
fi

AHEAD=$(git rev-list --count origin/main..HEAD 2>/dev/null || echo "?")
if [ "$AHEAD" = "0" ]; then
  gate "GitHub up to date" "pass"
else
  gate "$AHEAD commits ahead of origin — push needed" "warn"
fi

# ── TRUTH LAYER: D1 ─────────────────────────────────────────────────────────
echo ""
printf "${C}── TRUTH LAYER: D1 Database ──${N}\n"
TABLE_CHECK=$(npx wrangler d1 execute gabriel_db --remote --command "SELECT COUNT(*) as c FROM sqlite_master WHERE type='table';" 2>&1)
if echo "$TABLE_CHECK" | grep -q '"c"'; then
  TC=$(echo "$TABLE_CHECK" | grep -oE '"c":[0-9]+' | head -1 | cut -d: -f2)
  gate "gabriel_db connected ($TC tables)" "pass"
else
  gate "D1 not reachable" "fail"
fi

NC_CHECK=$(npx wrangler d1 execute gabriel_db --remote --command "SELECT COUNT(*) as c FROM hvs_never_clauses;" 2>&1)
NC=$(echo "$NC_CHECK" | grep -oE '"c":[0-9]+' | head -1 | cut -d: -f2)
if [ "${NC:-0}" -eq 9 ]; then
  gate "9 Never Clauses active" "pass"
else
  gate "Never Clauses: expected 9, got ${NC:-0}" "fail"
fi

EMAIL_CHECK=$(npx wrangler d1 execute gabriel_db --remote --command "SELECT email FROM hvs_actors WHERE actor_id='RSP_001';" 2>&1)
if echo "$EMAIL_CHECK" | grep -q "rsp@noizy.ai"; then
  gate "RSP_001 → rsp@noizy.ai" "pass"
else
  gate "RSP_001 email wrong" "warn"
fi

# ── LOCAL MESH: GOD.local ────────────────────────────────────────────────────
echo ""
printf "${C}── LOCAL MESH: GOD.local ──${N}\n"
for svc in "GABRIEL:9777" "DreamChamber:7777" "n8n:5678" "Ollama:11434"; do
  name="${svc%%:*}"; port="${svc##*:}"
  if curl -fsS --max-time 3 "http://localhost:$port" >/dev/null 2>&1 || \
     curl -fsS --max-time 3 "http://localhost:$port/health" >/dev/null 2>&1; then
    gate "$name (port $port)" "pass"
  else
    gate "$name (port $port) — offline" "warn"
  fi
done

# Ollama models
if curl -fsS --max-time 3 "http://localhost:11434/api/tags" >/dev/null 2>&1; then
  MODELS=$(curl -fsS "http://localhost:11434/api/tags" 2>/dev/null | python3 -c "import sys,json; ms=json.load(sys.stdin).get('models',[]); print(', '.join(m['name'].split(':')[0] for m in ms[:5]))" 2>/dev/null || echo "?")
  gate "Ollama models: $MODELS" "pass"
fi

# ── ZERO TRUST: Tunnel ───────────────────────────────────────────────────────
echo ""
printf "${C}── ZERO TRUST: Tunnel ──${N}\n"
if [ -f "$HOME/.cloudflared/cert.pem" ]; then
  gate "cloudflared authenticated" "pass"
  if cloudflared tunnel list 2>/dev/null | grep -q "noizy"; then
    gate "Tunnel exists" "pass"
  else
    gate "Tunnel not created — run: bash infra/tunnel/install-tunnel.sh" "warn"
  fi
else
  gate "cloudflared not authed — run: cloudflared tunnel login" "warn"
fi

# ── CONFIG ───────────────────────────────────────────────────────────────────
echo ""
printf "${C}── CONFIG ──${N}\n"
[ -f "wrangler.jsonc" ] && gate "wrangler.jsonc" "pass" || gate "wrangler.jsonc MISSING" "fail"
[ -f ".env" ] && gate ".env present" "pass" || gate ".env missing" "warn"
[ -f "smoke_test.sh" ] && gate "smoke_test.sh" "pass" || gate "smoke_test.sh missing" "warn"
[ -f "infra/recovery/Makefile" ] && gate "Recovery Makefile" "pass" || gate "Recovery Makefile missing" "fail"

# ── TOOLCHAIN ────────────────────────────────────────────────────────────────
echo ""
printf "${C}── TOOLCHAIN ──${N}\n"
for cmd in wrangler cloudflared node gh git docker ollama mlx_whisper ffmpeg minisign gcloud; do
  command -v "$cmd" >/dev/null 2>&1 && gate "$cmd" "pass" || gate "$cmd" "warn"
done

# ── VERDICT ──────────────────────────────────────────────────────────────────
echo ""
printf "${B}═══════════════════════════════════════════════════${N}\n"
printf " ${G}%d passed${N}  ${R}%d failed${N}  ${Y}%d warnings${N}\n" "$PASS" "$FAIL" "$WARN"

if [ "$FAIL" -eq 0 ]; then
  printf "\n ${G}${B}ALL GATES CLEAR — SOVEREIGN ACTIVATION READY${N}\n"
  printf " Deploy:  npx wrangler deploy --env=\"\"\n"
  printf " Verify:  bash smoke_test.sh\n"
  printf " Tunnel:  bash infra/tunnel/install-tunnel.sh\n"
else
  printf "\n ${R}${B}%d GATE(S) BLOCKED — fix failures before deploy${N}\n" "$FAIL"
fi
printf "${B}═══════════════════════════════════════════════════${N}\n"
