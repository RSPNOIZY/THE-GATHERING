#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# smoke_test.sh — Automated Heaven + GABRIEL smoke test suite
# Runs against live endpoints. Reports pass/fail for every critical route.
# Usage: bash smoke_test.sh [heaven_url] [gabriel_port]
# ═══════════════════════════════════════════════════════════════════════════════
set -euo pipefail

HEAVEN="${1:-https://heaven.rsp-5f3.workers.dev}"
GABRIEL_PORT="${2:-9777}"
GABRIEL="http://localhost:${GABRIEL_PORT}"

# Auto-source .env if present
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
[ -f "$SCRIPT_DIR/.env" ] && source "$SCRIPT_DIR/.env"

API_KEY="${NOIZY_API_KEY:-test}"

PASS=0
FAIL=0
WARN=0
TOTAL=0
FAILURES=""

# Colors
G='\033[0;32m' R='\033[0;31m' Y='\033[0;33m' C='\033[0;36m' N='\033[0m'

check() {
  local label="$1" url="$2" expect="$3" headers="${4:-}"
  TOTAL=$((TOTAL + 1))
  local cmd="curl -fsS --max-time 8 $headers '$url' 2>/dev/null"
  local body
  body=$(eval "$cmd" 2>/dev/null) || body=""

  if echo "$body" | grep -q "$expect"; then
    printf "  ${G}PASS${N}  %s\n" "$label"
    PASS=$((PASS + 1))
  else
    printf "  ${R}FAIL${N}  %s  (expected: %s)\n" "$label" "$expect"
    FAIL=$((FAIL + 1))
    FAILURES="${FAILURES}\n  - ${label}"
  fi
}

check_status() {
  local label="$1" url="$2" expected_code="$3" headers="${4:-}"
  TOTAL=$((TOTAL + 1))
  local code
  code=$(curl -s -o /dev/null -w "%{http_code}" --max-time 8 $headers "$url" 2>/dev/null) || code="000"

  if [ "$code" = "$expected_code" ]; then
    printf "  ${G}PASS${N}  %s  (HTTP %s)\n" "$label" "$code"
    PASS=$((PASS + 1))
  else
    printf "  ${R}FAIL${N}  %s  (got HTTP %s, expected %s)\n" "$label" "$code" "$expected_code"
    FAIL=$((FAIL + 1))
    FAILURES="${FAILURES}\n  - ${label} (HTTP ${code})"
  fi
}

echo "═══════════════════════════════════════════════════"
echo " NOIZY SMOKE TEST — $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo " Heaven: $HEAVEN"
echo " GABRIEL: $GABRIEL"
echo "═══════════════════════════════════════════════════"

# ── HEAVEN (Cloudflare Edge) ─────────────────────────────────────────────────
echo ""
printf "${C}── HEAVEN ──${N}\n"

check "Health endpoint"          "$HEAVEN/health"           "LIVE"
check "Gabriel status"           "$HEAVEN/gabriel"          "ONLINE"
check "Mission statement"        "$HEAVEN/health"           "Consent as executable code"
check "Founding actor present"   "$HEAVEN/gabriel"          "RSP_001"
check "9 Never Clauses"          "$HEAVEN/gabriel"          "never_clauses_in_force.*9"
check "Database connected"       "$HEAVEN/health"           "gabriel_db"

# Auth-protected endpoints (should return 401 without key, 200 with key)
check_status "Actors (no auth)"  "$HEAVEN/api/v1/actors"    "401"
check "Actors (with auth)"       "$HEAVEN/api/v1/actors"    "RSP_001" "-H 'X-NOIZY-Key: $API_KEY'"
check "KPI trust"                "$HEAVEN/api/v1/kpi/trust" "active_tokens" "-H 'X-NOIZY-Key: $API_KEY'"
check "Never clauses"            "$HEAVEN/api/v1/actors/RSP_001/never-clauses" "NC_POLITICAL" "-H 'X-NOIZY-Key: $API_KEY'"
check "Rate table"               "$HEAVEN/api/v1/rate-table" "commercial_ad" "-H 'X-NOIZY-Key: $API_KEY'"
check "Ledger"                   "$HEAVEN/api/v1/ledger"     "system.genesis" "-H 'X-NOIZY-Key: $API_KEY'"

# Dashboard (public HTML)
check "Dashboard HTML"           "$HEAVEN/dashboard"         "DOCTYPE"

# ── GABRIEL (Local Daemon) ───────────────────────────────────────────────────
echo ""
printf "${C}── GABRIEL (port ${GABRIEL_PORT}) ──${N}\n"

GABRIEL_UP=true
if ! curl -fsS --max-time 3 "$GABRIEL/health" >/dev/null 2>&1; then
  printf "  ${Y}SKIP${N}  GABRIEL not running on port ${GABRIEL_PORT}\n"
  GABRIEL_UP=false
  WARN=$((WARN + 1))
fi

if [ "$GABRIEL_UP" = true ]; then
  check "Health"                 "$GABRIEL/health"           "GABRIEL"
  check "Status"                 "$GABRIEL/status"           "NOIZY EMPIRE"
  check "Voice status"           "$GABRIEL/voice/status"     "whisper"
  check "Tasks endpoint"         "$GABRIEL/tasks"            "tasks"
  check "Memory cells"           "$GABRIEL/memcell"          "cells"
  check "LUCY route exists"      "$GABRIEL/lucy"             "DOCTYPE"

  # n8n bridge
  n8n_status=$(curl -s --max-time 5 "$GABRIEL/n8n/status" 2>/dev/null)
  TOTAL=$((TOTAL + 1))
  if echo "$n8n_status" | grep -q "connected\|n8n"; then
    printf "  ${G}PASS${N}  n8n bridge\n"
    PASS=$((PASS + 1))
  else
    printf "  ${Y}WARN${N}  n8n bridge (n8n may not be running with API key)\n"
    WARN=$((WARN + 1))
  fi
fi

# ── SERVICES ─────────────────────────────────────────────────────────────────
echo ""
printf "${C}── SERVICES ──${N}\n"

for svc in "n8n:5678" "Ollama:11434"; do
  name="${svc%%:*}"
  port="${svc##*:}"
  TOTAL=$((TOTAL + 1))
  if curl -fsS --max-time 3 "http://localhost:$port" >/dev/null 2>&1; then
    printf "  ${G}PASS${N}  %s (port %s)\n" "$name" "$port"
    PASS=$((PASS + 1))
  else
    printf "  ${Y}WARN${N}  %s not responding on port %s\n" "$name" "$port"
    WARN=$((WARN + 1))
  fi
done

# ── SUMMARY ──────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════"
printf " RESULTS: ${G}%d passed${N}  ${R}%d failed${N}  ${Y}%d warnings${N}  (%d total)\n" "$PASS" "$FAIL" "$WARN" "$TOTAL"

if [ "$FAIL" -gt 0 ]; then
  printf "\n ${R}FAILURES:${N}%b\n" "$FAILURES"
  echo "═══════════════════════════════════════════════════"
  exit 1
else
  echo " ALL CRITICAL CHECKS PASSED"
  echo "═══════════════════════════════════════════════════"
fi
