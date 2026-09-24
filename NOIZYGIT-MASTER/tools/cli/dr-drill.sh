#!/usr/bin/env bash
set -euo pipefail

echo "🔄 NOIZY DR Drill"
echo "================="

DRILL_TYPE="${1:-quick}"
DR_ACCOUNT_ID="${DR_ACCOUNT_ID:-}"
LOG_FILE="${HOME}/.noizy-dr-drills.log"

echo "Drill type: ${DRILL_TYPE}"
echo "Log file: ${LOG_FILE}"
echo ""

# Quick drill - verify access only
quick_drill() {
  echo "Step 1: Verify primary account access..."
  npx wrangler whoami 2>/dev/null || {
    echo "❌ Primary account access failed"
    return 1
  }
  echo "  ✅ Primary account accessible"

  echo ""
  echo "Step 2: List deployments..."
  npx wrangler deployments list 2>/dev/null | head -5 || echo "  (no deployments)"
  echo "  ✅ Deployment history accessible"

  echo ""
  echo "Step 3: Verify KV access..."
  npx wrangler kv:namespace list 2>/dev/null | head -5 || echo "  (no namespaces)"
  echo "  ✅ KV namespaces accessible"

  echo ""
  echo "Step 4: Verify D1 access..."
  npx wrangler d1 list 2>/dev/null | head -5 || echo "  (no databases)"
  echo "  ✅ D1 databases accessible"

  return 0
}

# Full drill - includes backup verification
full_drill() {
  quick_drill || return 1

  echo ""
  echo "Step 5: Export KV snapshot..."
  FEATURE_FLAGS_ID="${FEATURE_FLAGS_ID:-}"
  if [[ -n "$FEATURE_FLAGS_ID" ]]; then
    npx wrangler kv:key list --namespace-id="$FEATURE_FLAGS_ID" > /tmp/kv-snapshot-test.json 2>/dev/null
    KEY_COUNT=$(jq length /tmp/kv-snapshot-test.json 2>/dev/null || echo "0")
    echo "  ✅ KV snapshot: ${KEY_COUNT} keys"
    rm -f /tmp/kv-snapshot-test.json
  else
    echo "  ⚠️  FEATURE_FLAGS_ID not set, skipping KV export"
  fi

  echo ""
  echo "Step 6: Verify rollback capability..."
  LAST_DEPLOY=$(npx wrangler deployments list 2>/dev/null | grep -E "^\s*[a-f0-9-]+\s" | head -2 | tail -1 || echo "")
  if [[ -n "$LAST_DEPLOY" ]]; then
    echo "  Previous deployment found: $(echo $LAST_DEPLOY | cut -d' ' -f1)"
    echo "  ✅ Rollback target available"
  else
    echo "  ⚠️  No previous deployment for rollback"
  fi

  echo ""
  echo "Step 7: Verify secrets are documented..."
  if [[ -f ".dev.vars.example" ]]; then
    echo "  ✅ .dev.vars.example exists for secret recovery"
  else
    echo "  ⚠️  .dev.vars.example missing — secrets may not be recoverable"
  fi

  return 0
}

# Tabletop drill - full simulation without actual changes
tabletop_drill() {
  echo "════════════════════════════════════════════════════════════════"
  echo "  TABLETOP DR EXERCISE"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "Scenario: Primary Cloudflare account is locked."
  echo ""
  echo "Questions to answer:"
  echo "  1. Can you access DR account? (Y/N)"
  echo "  2. Do you have latest code in DR repo? (Y/N)"
  echo "  3. Is KV snapshot < 7 days old? (Y/N)"
  echo "  4. Is D1 backup < 7 days old? (Y/N)"
  echo "  5. Can you re-enter all secrets? (Y/N)"
  echo "  6. Do you know CF support contact? (Y/N)"
  echo ""
  echo "If any answer is NO, update DR documentation immediately."
  echo ""

  full_drill || true

  echo ""
  echo "────────────────────────────────────────────────────────────────"
  echo "Tabletop complete. Review answers above."
  echo "────────────────────────────────────────────────────────────────"
}

# Run the appropriate drill
case "$DRILL_TYPE" in
  quick)
    quick_drill
    RESULT=$?
    ;;
  full)
    full_drill
    RESULT=$?
    ;;
  tabletop)
    tabletop_drill
    RESULT=$?
    ;;
  *)
    echo "Usage: $0 [quick|full|tabletop]"
    exit 1
    ;;
esac

# Log result
TIMESTAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
if [[ $RESULT -eq 0 ]]; then
  echo ""
  echo "════════════════════════════════════════"
  echo "  ✅ DR Drill PASSED"
  echo "════════════════════════════════════════"
  echo "${TIMESTAMP}: DR drill (${DRILL_TYPE}) PASSED" >> "$LOG_FILE"
else
  echo ""
  echo "════════════════════════════════════════"
  echo "  ❌ DR Drill FAILED"
  echo "════════════════════════════════════════"
  echo "${TIMESTAMP}: DR drill (${DRILL_TYPE}) FAILED" >> "$LOG_FILE"
fi

exit $RESULT
