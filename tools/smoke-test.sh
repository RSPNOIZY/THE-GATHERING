#!/usr/bin/env bash
set -euo pipefail

HEAVEN_URL="${HEAVEN_URL:-https://heaven.rsp-5f3.workers.dev}"

echo "🧪 NOIZY Smoke Test"
echo "==================="

PASSED=0
FAILED=0

check() {
  local name="$1"
  local url="$2"
  local expected="${3:-200}"

  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")

  if [[ "$STATUS" == "$expected" ]]; then
    echo "  ✅ $name: $STATUS"
    ((PASSED++))
  else
    echo "  ❌ $name: $STATUS (expected $expected)"
    ((FAILED++))
  fi
}

echo ""
echo "Heaven Worker:"
check "Health" "${HEAVEN_URL}/health"
check "Root" "${HEAVEN_URL}/"
check "API v1" "${HEAVEN_URL}/api/v1"
check "Gabriel" "${HEAVEN_URL}/gabriel"

echo ""
echo "Results: $PASSED passed, $FAILED failed"

if [[ $FAILED -gt 0 ]]; then
  exit 1
fi

echo ""
echo "✅ All smoke tests passed"
