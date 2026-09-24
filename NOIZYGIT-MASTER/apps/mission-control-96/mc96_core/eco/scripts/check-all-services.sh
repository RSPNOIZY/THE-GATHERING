#!/usr/bin/env bash
# NOIZY Unified Health Dashboard
# Checks all local + cloud services and prints a pass/fail summary.
# Safe to run at any time — read-only, no side effects.
#
# Usage: bash scripts/check-all-services.sh
set -euo pipefail

PASS=0
FAIL=0
SKIP=0

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

pass() { echo -e "${GREEN}  PASS${NC}  $1"; ((PASS++)); }
fail() { echo -e "${RED}  FAIL${NC}  $1"; ((FAIL++)); }
skip() { echo -e "${YELLOW}  SKIP${NC}  $1"; ((SKIP++)); }

http_check() {
  local label="$1" url="$2" expect="${3:-200}"
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 3 "$url" 2>/dev/null || echo "000")
  if [[ "$code" == "$expect" ]]; then
    pass "$label → HTTP $code"
  elif [[ "$code" == "000" ]]; then
    fail "$label → connection refused / timeout ($url)"
  else
    fail "$label → HTTP $code (expected $expect) ($url)"
  fi
}

ws_check() {
  local label="$1" host="$2" port="$3"
  if nc -z -w 2 "$host" "$port" 2>/dev/null; then
    pass "$label → TCP $host:$port open"
  else
    fail "$label → TCP $host:$port unreachable"
  fi
}

echo "============================================================"
echo " NOIZY Service Health Dashboard"
echo " $(date '+%Y-%m-%d %H:%M:%S %Z')"
echo "============================================================"

# ── NOIZYSTREAM ───────────────────────────────────────────────────────────────
echo ""
echo "── NOIZYSTREAM ─────────────────────────────────────────────"
http_check "NOIZYSTREAM Control  (7778/health)" "http://localhost:7778/health"
ws_check   "NOIZYSTREAM Signaling (7779 WS)"    "localhost" "7779"

# ── Gabriel Daemon ────────────────────────────────────────────────────────────
echo ""
echo "── Gabriel ─────────────────────────────────────────────────"
http_check "Gabriel daemon       (7777)"        "http://localhost:7777/health"

# ── Ops Services (Docker) ─────────────────────────────────────────────────────
echo ""
echo "── Ops (Docker) ────────────────────────────────────────────"
http_check "STT faster-whisper   (8000)"        "http://localhost:8000/health"
http_check "Command bridge       (8888)"        "http://localhost:8888" "405"
# Bridge returns 405 on GET (POST-only). 405 means it's alive.

# ── n8n Cloud ─────────────────────────────────────────────────────────────────
echo ""
echo "── n8n Cloud ───────────────────────────────────────────────"
if curl -s --max-time 5 "https://noizy.app.n8n.cloud" -o /dev/null 2>/dev/null; then
  pass "n8n cloud (noizy.app.n8n.cloud) → reachable"
else
  fail "n8n cloud (noizy.app.n8n.cloud) → unreachable"
fi

# ── Wrangler Auth ─────────────────────────────────────────────────────────────
echo ""
echo "── Cloudflare / Wrangler ───────────────────────────────────"
if command -v npx &>/dev/null; then
  if npx wrangler whoami --quiet 2>/dev/null | grep -q "@"; then
    pass "Wrangler authenticated"
  else
    fail "Wrangler not authenticated (run: npx wrangler login)"
  fi
else
  skip "npx not found — skipping wrangler check"
fi

# ── Contracts & Proof Integrity ───────────────────────────────────────────────
echo ""
echo "── Contracts & Proof ───────────────────────────────────────"
if [[ -f "contracts/routes/consent-gateway.routes.json" ]]; then
  pass "Route contract present"
else
  fail "Route contract missing (contracts/routes/consent-gateway.routes.json)"
fi

if [[ -f "contracts/consent/scopes.stt.json" ]]; then
  pass "STT consent scope present"
else
  fail "STT consent scope missing (contracts/consent/scopes.stt.json)"
fi

PROOF_COUNT=$(find artifacts/proof -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
if [[ "$PROOF_COUNT" -gt 0 ]]; then
  pass "Proof bundles found ($PROOF_COUNT file(s) in artifacts/proof/)"
else
  skip "No proof bundles yet (run: node scripts/generate-proof-bundle.mjs)"
fi

# ── Tailscale ─────────────────────────────────────────────────────────────────
echo ""
echo "── Tailscale ───────────────────────────────────────────────"
if command -v tailscale &>/dev/null; then
  STATUS=$(tailscale status --json 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('BackendState','unknown'))" 2>/dev/null || echo "unknown")
  if [[ "$STATUS" == "Running" ]]; then
    pass "Tailscale running"
  else
    fail "Tailscale not running (state: $STATUS)"
  fi
else
  skip "tailscale CLI not found"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo ""
echo "============================================================"
echo -e " ${GREEN}PASS: $PASS${NC}  ${RED}FAIL: $FAIL${NC}  ${YELLOW}SKIP: $SKIP${NC}"
if [[ "$FAIL" -gt 0 ]]; then
  echo " STATUS: DEGRADED — $FAIL service(s) not healthy"
  echo "============================================================"
  exit 1
else
  echo " STATUS: ALL HEALTHY"
  echo "============================================================"
fi
