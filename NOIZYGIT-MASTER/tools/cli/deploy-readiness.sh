#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# NOIZY Empire — Deploy Readiness Validator
# Pre-deploy checklist that catches what CI can't see locally.
# Run before any `wrangler deploy` to verify infrastructure sanity.
#
# Usage:
#   bash scripts/deploy-readiness.sh          # Full check
#   bash scripts/deploy-readiness.sh --quick  # Config-only (no network)
#
# Author: RSP_001 | GABRIEL | GORUNFREE
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
QUICK=false
[[ "${1:-}" == "--quick" ]] && QUICK=true

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

PASS=0
FAIL=0
WARN=0

check() {
  if eval "$1" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $2"
    PASS=$((PASS + 1))
  else
    echo -e "  ${RED}✗${NC} $2"
    FAIL=$((FAIL + 1))
  fi
}

warn_check() {
  if eval "$1" >/dev/null 2>&1; then
    echo -e "  ${GREEN}✓${NC} $2"
    PASS=$((PASS + 1))
  else
    echo -e "  ${YELLOW}⚠${NC} $2"
    WARN=$((WARN + 1))
  fi
}

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  NOIZY Empire — Deploy Readiness Validator      ║${NC}"
echo -e "${CYAN}║  Protocol > Promises   |   Proof > Vibes        ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# ── 1. Worker Name Collision Check ─────────────────────────────────
echo -e "${CYAN}[1/8] Worker Name Collision Check${NC}"
NAMES=$(grep -h '^name\s*=' "$ROOT"/wrangler.toml "$ROOT"/workers/*/wrangler.toml "$ROOT"/workers/*/wrangler.jsonc 2>/dev/null | sort)
DUPES=$(echo "$NAMES" | sort | uniq -d)
check '[ -z "'"$DUPES"'" ]' "No duplicate worker names across configs"
if [ -n "$DUPES" ]; then
  echo -e "    ${RED}COLLISION:${NC} $DUPES"
fi
echo ""

# ── 2. Placeholder Scan ─────────────────────────────────────────────
echo -e "${CYAN}[2/8] Placeholder & Credential Scan${NC}"
FORBIDDEN=(
  "REPLACE_WITH" "PLACEHOLDER" "YOUR_.*_ID" "INSERT_ID_HERE"
  "your-.*-key" "your-.*-id" "your-.*-webhook"
  "TODO_KV" "TODO_D1" "CHANGEME"
)
for term in "${FORBIDDEN[@]}"; do
  check "! grep -rEi '$term' \"$ROOT\"/wrangler.toml \"$ROOT\"/workers/*/wrangler.* 2>/dev/null | grep -v node_modules | grep -v .backup | grep -qv '^$'" \
    "No '$term' in wrangler configs"
done
echo ""

# ── 3. Config Integrity ─────────────────────────────────────────────
echo -e "${CYAN}[3/8] Config Integrity${NC}"
check '[ -f "$ROOT/wrangler.toml" ]' "Root wrangler.toml exists"
check '[ -f "$ROOT/src/index.js" ]' "Root entrypoint (src/index.js) exists"
check '[ -f "$ROOT/schema.sql" ]' "Root schema.sql exists"

# Check each worker has both config AND source
for w in "$ROOT"/workers/*/; do
  wname=$(basename "$w")
  has_config=false
  has_source=false
  [ -f "$w/wrangler.toml" ] || [ -f "$w/wrangler.jsonc" ] && has_config=true
  [ -f "$w/index.ts" ] || [ -f "$w/src/index.js" ] || [ -f "$w/src/index.ts" ] && has_source=true
  if $has_config && ! $has_source; then
    warn_check "false" "workers/$wname: config exists but NO source code"
  elif $has_config; then
    check "true" "workers/$wname: config ✓ source ✓"
  fi
done
echo ""

# ── 4. Schema Validation ────────────────────────────────────────────
echo -e "${CYAN}[4/8] Schema Validation${NC}"
check 'grep -q "CREATE TABLE" "$ROOT/schema.sql"' "Root schema has tables"
check 'grep -q "CREATE TABLE" "$ROOT/src/schema.sql"' "Src schema has tables"
for w in "$ROOT"/workers/*/schema.sql; do
  [ -f "$w" ] && check 'grep -q "CREATE TABLE" "$w"' "$(basename "$(dirname "$w")")/schema.sql has tables"
done
echo ""

# ── 5. Observability ────────────────────────────────────────────────
echo -e "${CYAN}[5/8] Observability${NC}"
check 'grep -q "enabled.*true\|\"enabled\": true" "$ROOT/wrangler.toml"' \
  "Root HEAVEN: observability enabled"
for w in "$ROOT"/workers/*/wrangler.*; do
  [ -f "$w" ] && wname=$(basename "$(dirname "$w")") && \
    warn_check 'grep -qi "observability\|enabled.*true" "'"$w"'"' \
      "workers/$wname: observability configured"
done
echo ""

# ── 6. Test Coverage ────────────────────────────────────────────────
echo -e "${CYAN}[6/8] Test Coverage${NC}"
check '[ -f "$ROOT/smoke_test.sh" ]' "Root HEAVEN: smoke test exists"
for w in "$ROOT"/workers/*/; do
  wname=$(basename "$w")
  warn_check '[ -d "$w/test" ] && ls "$w/test"/*.test.* >/dev/null 2>&1' \
    "workers/$wname: has test files"
done
echo ""

# ── 7. Git Status ──────────────────────────────────────────────────
echo -e "${CYAN}[7/8] Git Status${NC}"
warn_check '[ -z "$(cd "$ROOT" && git diff --name-only HEAD 2>/dev/null)" ]' \
  "No uncommitted changes in tracked files"
warn_check '! grep -q ".env" "$ROOT/.gitignore" 2>/dev/null || true' \
  ".env is in .gitignore"
echo ""

# ── 8. Network Checks (skip with --quick) ──────────────────────────
if ! $QUICK; then
  echo -e "${CYAN}[8/8] Live Endpoint Checks${NC}"
  for endpoint in "health" "gabriel" "dashboard"; do
    STATUS=$(curl -s -o /dev/null -w "%{http_code}" \
      "https://heaven.rsp-5f3.workers.dev/$endpoint" 2>/dev/null || echo "000")
    if [ "$STATUS" = "200" ]; then
      check "true" "heaven.rsp-5f3.workers.dev/$endpoint → $STATUS"
    else
      warn_check "false" "heaven.rsp-5f3.workers.dev/$endpoint → $STATUS"
    fi
  done
  echo ""
else
  echo -e "${CYAN}[8/8] Live Endpoint Checks — SKIPPED (--quick)${NC}"
  echo ""
fi

# ── Summary ────────────────────────────────────────────────────────
echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
echo -e "  Passed: ${GREEN}${PASS}${NC}  Warnings: ${YELLOW}${WARN}${NC}  Failed: ${RED}${FAIL}${NC}"
echo ""

if [ $FAIL -gt 0 ]; then
  echo -e "  ${RED}DEPLOY BLOCKED${NC} — fix $FAIL critical issue(s) before deploying"
  echo ""
  exit 1
elif [ $WARN -gt 0 ]; then
  echo -e "  ${YELLOW}DEPLOY CONDITIONAL${NC} — $WARN warning(s) to review"
  echo ""
  exit 0
else
  echo -e "  ${GREEN}DEPLOY CLEAR${NC} — all checks passed"
  echo ""
  exit 0
fi
