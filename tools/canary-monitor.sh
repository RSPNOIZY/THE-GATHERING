#!/usr/bin/env bash
set -euo pipefail

echo "🐤 NOIZY Canary Monitor"
echo "======================="

HEAVEN_URL="${HEAVEN_URL:-https://heaven.rsp-5f3.workers.dev}"
CANARY_URL="${CANARY_URL:-https://heaven-canary.rsp-5f3.workers.dev}"
DURATION="${1:-5m}"
THRESHOLD="${2:-0.01}"  # 1% error threshold
INTERVAL=10  # seconds between checks

# Parse duration to seconds
parse_duration() {
  local dur="$1"
  case "$dur" in
    *m) echo $(( ${dur%m} * 60 )) ;;
    *h) echo $(( ${dur%h} * 3600 )) ;;
    *s) echo "${dur%s}" ;;
    *)  echo "$dur" ;;
  esac
}

DURATION_SECS=$(parse_duration "$DURATION")
END_TIME=$((SECONDS + DURATION_SECS))

echo "Duration: ${DURATION} (${DURATION_SECS}s)"
echo "Error threshold: ${THRESHOLD}"
echo "Checking every ${INTERVAL}s"
echo ""

PROD_ERRORS=0
PROD_TOTAL=0
CANARY_ERRORS=0
CANARY_TOTAL=0

check_endpoint() {
  local url="$1"
  local status
  status=$(curl -sf -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || echo "000")
  echo "$status"
}

while [[ $SECONDS -lt $END_TIME ]]; do
  remaining=$((END_TIME - SECONDS))

  # Check production
  prod_status=$(check_endpoint "${HEAVEN_URL}/health")
  ((PROD_TOTAL++))
  if [[ "$prod_status" != "200" ]]; then
    ((PROD_ERRORS++))
    echo "⚠️  Production error: HTTP $prod_status"
  fi

  # Check canary
  canary_status=$(check_endpoint "${CANARY_URL}/health")
  ((CANARY_TOTAL++))
  if [[ "$canary_status" != "200" ]]; then
    ((CANARY_ERRORS++))
    echo "⚠️  Canary error: HTTP $canary_status"
  fi

  # Calculate error rates
  if [[ $PROD_TOTAL -gt 0 ]]; then
    prod_rate=$(echo "scale=4; $PROD_ERRORS / $PROD_TOTAL" | bc)
  else
    prod_rate="0"
  fi

  if [[ $CANARY_TOTAL -gt 0 ]]; then
    canary_rate=$(echo "scale=4; $CANARY_ERRORS / $CANARY_TOTAL" | bc)
  else
    canary_rate="0"
  fi

  # Check if canary error rate exceeds threshold above production
  error_delta=$(echo "scale=4; $canary_rate - $prod_rate" | bc)
  threshold_exceeded=$(echo "$error_delta > $THRESHOLD" | bc)

  if [[ "$threshold_exceeded" == "1" ]]; then
    echo ""
    echo "❌ CANARY FAILURE"
    echo "   Canary error rate (${canary_rate}) exceeds production (${prod_rate}) by more than ${THRESHOLD}"
    echo "   Recommend: npx wrangler rollback -e canary"
    exit 1
  fi

  # Progress update
  printf "\r[%3ds remaining] prod: %s/%s (%s%%) | canary: %s/%s (%s%%)" \
    "$remaining" "$PROD_ERRORS" "$PROD_TOTAL" "$(echo "scale=1; $prod_rate * 100" | bc)" \
    "$CANARY_ERRORS" "$CANARY_TOTAL" "$(echo "scale=1; $canary_rate * 100" | bc)"

  sleep "$INTERVAL"
done

echo ""
echo ""
echo "════════════════════════════════════════"
echo "  Canary Monitor Results"
echo "════════════════════════════════════════"
echo "  Duration:       ${DURATION}"
echo "  Production:     ${PROD_ERRORS}/${PROD_TOTAL} errors"
echo "  Canary:         ${CANARY_ERRORS}/${CANARY_TOTAL} errors"
echo "────────────────────────────────────────"

if [[ $CANARY_ERRORS -gt 0 ]]; then
  echo "  ⚠️  Canary had errors, review before promoting"
else
  echo "  ✅ Canary healthy — safe to promote"
fi
echo "════════════════════════════════════════"
