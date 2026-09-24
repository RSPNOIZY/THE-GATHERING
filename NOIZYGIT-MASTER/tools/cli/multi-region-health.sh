#!/usr/bin/env bash
set -euo pipefail

echo "🌍 NOIZY Multi-Region Health Check"
echo "==================================="

HEAVEN_URL="${HEAVEN_URL:-https://heaven.rsp-5f3.workers.dev}"

# Cloudflare edge locations to check from (using CF workers as proxies)
# For now, we check the single endpoint which Cloudflare routes globally
# In production, you could deploy health-check workers in different regions

ENDPOINTS=(
  "/health"
  "/api/v1"
  "/"
  "/gabriel"
)

PASSED=0
FAILED=0

echo ""
echo "Checking endpoints from edge..."

for endpoint in "${ENDPOINTS[@]}"; do
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${HEAVEN_URL}${endpoint}" 2>/dev/null || echo "000")

  if [[ "$STATUS" == "200" ]]; then
    echo "  ✅ ${endpoint}: $STATUS"
    ((PASSED++))
  else
    echo "  ❌ ${endpoint}: $STATUS"
    ((FAILED++))
  fi
done

echo ""
echo "Results: $PASSED passed, $FAILED failed"

# Check response times from different perspectives
echo ""
echo "Response time check..."
TIME=$(curl -sf -o /dev/null -w "%{time_total}" "${HEAVEN_URL}/health" 2>/dev/null || echo "0")
echo "  Health endpoint: ${TIME}s"

if [[ $FAILED -gt 0 ]]; then
  echo ""
  echo "❌ Health check FAILED"
  exit 1
fi

echo ""
echo "✅ All regions healthy"
