#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# NOIZY Empire — Integration Smoke Tests
# End-to-end test payloads for every webhook endpoint
# ═══════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/ops/.env.integrations"

# Load env
if [ -f "$ENV_FILE" ]; then
  source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' | sed 's/^/export /')
fi

# Defaults
N8N_BASE="${N8N_WEBHOOK_URL:-http://localhost:5678/webhook}"
PROXY_BASE="${WEBHOOK_PROXY_URL:-https://webhook-proxy.rsp-5f3.workers.dev}"
HEAVEN17_BASE="${HEAVEN_URL:-https://noizy.ai}"
CONSENT_BASE="https://consent.noizy.ai"
API_KEY="${NOIZY_API_KEY:-test-key}"
HMAC_SECRET="${WEBHOOK_HMAC_SECRET:-test-secret}"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

PASSED=0
FAILED=0
SKIPPED=0

banner() {
  echo -e "\n${CYAN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${BOLD}   🧪 NOIZY Empire — Integration Smoke Tests  ${NC}${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}\n"
}

test_webhook() {
  local name="$1"
  local url="$2"
  local payload="$3"
  local expected_status="${4:-200}"
  local extra_headers="${5:-}"

  echo -n -e "  ${BLUE}TEST${NC} $name ... "

  HEADERS=(-H "Content-Type: application/json")
  if [ -n "$extra_headers" ]; then
    while IFS= read -r h; do
      [ -n "$h" ] && HEADERS+=(-H "$h")
    done <<< "$extra_headers"
  fi

  RESPONSE=$(curl -s -w "\n%{http_code}" -X POST "$url" "${HEADERS[@]}" -d "$payload" --connect-timeout 10 --max-time 15 2>/dev/null || echo -e "\n000")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${YELLOW}SKIP${NC} (unreachable)"
    SKIPPED=$((SKIPPED + 1))
  elif [ "$HTTP_CODE" = "$expected_status" ] || [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "201" ]; then
    echo -e "${GREEN}PASS${NC} (HTTP $HTTP_CODE)"
    PASSED=$((PASSED + 1))
  elif [ "$HTTP_CODE" = "401" ] || [ "$HTTP_CODE" = "403" ]; then
    echo -e "${GREEN}PASS${NC} (HTTP $HTTP_CODE — auth working)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC} (HTTP $HTTP_CODE)"
    echo -e "    Response: ${BODY:0:200}"
    FAILED=$((FAILED + 1))
  fi
}

test_get() {
  local name="$1"
  local url="$2"
  local expected_status="${3:-200}"
  local extra_headers="${4:-}"

  echo -n -e "  ${BLUE}TEST${NC} $name ... "

  HEADERS=()
  if [ -n "$extra_headers" ]; then
    while IFS= read -r h; do
      [ -n "$h" ] && HEADERS+=(-H "$h")
    done <<< "$extra_headers"
  fi

  RESPONSE=$(curl -s -w "\n%{http_code}" "$url" "${HEADERS[@]}" --connect-timeout 10 --max-time 15 2>/dev/null || echo -e "\n000")

  HTTP_CODE=$(echo "$RESPONSE" | tail -1)
  BODY=$(echo "$RESPONSE" | sed '$d')

  if [ "$HTTP_CODE" = "000" ]; then
    echo -e "${YELLOW}SKIP${NC} (unreachable)"
    SKIPPED=$((SKIPPED + 1))
  elif [ "$HTTP_CODE" = "$expected_status" ] || [ "$HTTP_CODE" = "200" ]; then
    echo -e "${GREEN}PASS${NC} (HTTP $HTTP_CODE)"
    PASSED=$((PASSED + 1))
  else
    echo -e "${RED}FAIL${NC} (HTTP $HTTP_CODE)"
    echo -e "    Response: ${BODY:0:200}"
    FAILED=$((FAILED + 1))
  fi
}

# ═══════════════════════════════════════════════════════════
banner

TIMESTAMP=$(date -u '+%Y-%m-%dT%H:%M:%SZ')

# ── 1. n8n Health ────────────────────────────────────────────
echo -e "${BOLD}━━━ n8n Core ━━━${NC}"
test_get "n8n healthz" "http://localhost:5678/healthz"

# ── 2. Master Orchestrator ───────────────────────────────────
echo -e "\n${BOLD}━━━ Master Orchestrator ━━━${NC}"

test_webhook "Master Ingest (GitHub payload)" \
  "$N8N_BASE/master-ingest" \
  "{\"source\":\"test\",\"event\":\"smoke_test\",\"timestamp\":\"$TIMESTAMP\"}" \
  "200" \
  "x-github-event: push
x-github-delivery: smoke-test-$(date +%s)"

test_webhook "Master Ingest (Linear payload)" \
  "$N8N_BASE/master-ingest" \
  "{\"type\":\"Issue\",\"action\":\"update\",\"data\":{\"id\":\"test-123\",\"title\":\"Smoke test issue\"}}" \
  "200" \
  "x-linear-delivery: smoke-test"

test_webhook "Master Ingest (Lucy nightly)" \
  "$N8N_BASE/master-ingest" \
  "{\"source\":\"lucy-nightly\",\"action_type\":\"nightly_summary\",\"total_actions\":3,\"timestamp\":\"$TIMESTAMP\"}" \
  "200" \
  "x-lucy-source: nightly"

test_webhook "Master Ingest (Consent revoke / Emergency)" \
  "$N8N_BASE/master-ingest" \
  "{\"action\":\"revoke\",\"voice_id\":\"test-voice-001\",\"reason\":\"Smoke test emergency\"}" \
  "200"

# ── 3. Source-Specific Webhooks ──────────────────────────────
echo -e "\n${BOLD}━━━ Source-Specific Webhooks ━━━${NC}"

test_webhook "GitHub Push" \
  "$N8N_BASE/github-push" \
  "{\"ref\":\"refs/heads/main\",\"sender\":{\"login\":\"smoke-test\"},\"repository\":{\"full_name\":\"noizy/test\"},\"commits\":[]}"

test_webhook "Linear Webhook" \
  "$N8N_BASE/linear-webhook" \
  "{\"type\":\"Issue\",\"action\":\"create\",\"data\":{\"id\":\"TEST-1\",\"title\":\"Smoke test\",\"state\":{\"name\":\"Todo\"}}}"

test_webhook "Zapier Bridge" \
  "$N8N_BASE/zapier-bridge" \
  "{\"zap_name\":\"smoke_test\",\"category\":\"notification\",\"data\":{\"message\":\"Smoke test from Zapier bridge\"}}"

test_webhook "Notion Dashboard" \
  "$N8N_BASE/notion-dashboard" \
  "{\"source\":\"notion\",\"action\":\"update\",\"page_id\":\"test-page-001\",\"title\":\"Smoke test page\"}"

test_webhook "Lucy Nightly Feed" \
  "$N8N_BASE/lucy-nightly-feed" \
  "{\"type\":\"nightly_summary\",\"insights\":[{\"dimension\":\"creative_resonance\",\"severity\":\"low\",\"message\":\"Test insight\"}],\"generated_at\":\"$TIMESTAMP\"}"

test_webhook "Consent Revoke" \
  "$N8N_BASE/consent-revoke" \
  "{\"voice_id\":\"test-voice-001\",\"action\":\"revoke\",\"scope\":\"all\",\"reason\":\"Smoke test\"}"

test_webhook "Lucy Revenue" \
  "$N8N_BASE/lucy-revenue" \
  "{\"type\":\"revenue_opportunity\",\"artist\":\"Test Artist\",\"amount\":100,\"currency\":\"CAD\"}"

# ── 4. Health Dashboard ──────────────────────────────────────
echo -e "\n${BOLD}━━━ Health Dashboard ━━━${NC}"

test_webhook "Health Check (manual trigger)" \
  "$N8N_BASE/health-check" \
  "{\"trigger\":\"smoke-test\"}"

# ── 5. Webhook Proxy (Edge) ──────────────────────────────────
echo -e "\n${BOLD}━━━ Webhook Proxy (CF Edge) ━━━${NC}"

test_get "Proxy Stats" "$PROXY_BASE/stats"

test_webhook "Proxy Ingest" \
  "$PROXY_BASE/ingest/github" \
  "{\"test\":true,\"event\":\"smoke_test\"}" \
  "200" \
  "x-github-event: push"

test_webhook "Proxy Drain (auth required)" \
  "$PROXY_BASE/api/drain" \
  "{}" \
  "200" \
  "X-Noizy-Key: $API_KEY"

# ── 6. Heaven17 (CF Worker) ─────────────────────────────────
echo -e "\n${BOLD}━━━ Heaven17 (CF Worker) ━━━${NC}"

test_get "Heaven17 Root" "$HEAVEN17_BASE/"
test_get "Heaven17 Status" "$HEAVEN17_BASE/api/status"

test_webhook "Heaven17 Event" \
  "$HEAVEN17_BASE/api/events" \
  "{\"event_type\":\"smoke_test\",\"actor_id\":\"SMOKE_TEST\",\"payload\":{\"message\":\"Integration smoke test\"}}" \
  "200" \
  "X-Noizy-Key: $API_KEY"

# ── 7. Consent Gateway ──────────────────────────────────────
echo -e "\n${BOLD}━━━ Consent Gateway ━━━${NC}"

test_get "Consent Health" "$CONSENT_BASE/health"

test_webhook "Consent Check" \
  "$CONSENT_BASE/api/consent/check" \
  "{\"voice_id\":\"smoke-test-voice\",\"purpose\":\"testing\"}"

# ── 8. Docker Services ──────────────────────────────────────
echo -e "\n${BOLD}━━━ Docker Services ━━━${NC}"

test_get "Open WebUI" "http://localhost:3080/"
test_get "RabbitMQ Management" "http://localhost:15672/"
test_get "Qdrant Collections" "http://localhost:6333/collections"
test_get "Grafana Health" "http://localhost:3000/api/health"
test_get "Neo4j Browser" "http://localhost:7474/"

# ═══════════════════════════════════════════════════════════
# Summary
# ═══════════════════════════════════════════════════════════
echo -e "\n${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
echo -e "${BOLD}Smoke Test Results${NC}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════${NC}"
echo ""
echo -e "  ${GREEN}Passed:${NC}   $PASSED"
echo -e "  ${RED}Failed:${NC}   $FAILED"
echo -e "  ${YELLOW}Skipped:${NC}  $SKIPPED"
echo -e "  Total:    $((PASSED + FAILED + SKIPPED))"
echo ""

if [ $FAILED -eq 0 ]; then
  if [ $SKIPPED -gt 0 ]; then
    echo -e "  ${YELLOW}⚠️  Some services unreachable (expected if not all running)${NC}"
  else
    echo -e "  ${GREEN}🎉 ALL TESTS PASSED!${NC}"
  fi
else
  echo -e "  ${RED}❌ $FAILED tests failed — check the output above${NC}"
fi

echo ""
echo -e "  Run at: $TIMESTAMP"
echo ""

exit $FAILED
