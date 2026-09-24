#!/usr/bin/env bash
set -euo pipefail

echo "🐤 NOIZY Canary Deploy"
echo "======================"

HEAVEN_URL="${HEAVEN_URL:-https://heaven.rsp-5f3.workers.dev}"

# Step 1: Preflight
echo ""
echo "Step 1/5: Preflight"
./scripts/wrangler-doctor.sh || exit 1

# Step 2: Deploy
echo ""
echo "Step 2/5: Deploy new version"
npx wrangler deploy || {
  echo "❌ Deploy failed"
  exit 1
}

# Step 3: Wait
echo ""
echo "Step 3/5: Waiting for edge propagation..."
sleep 5

# Step 4: Smoke test
echo ""
echo "Step 4/5: Smoke test"
./scripts/smoke-test.sh || {
  echo "❌ Smoke test failed"
  echo ""
  echo "🧯 Rolling back..."
  npx wrangler rollback --message "Auto-rollback: smoke test failed"
  exit 1
}

# Step 5: Verify
echo ""
echo "Step 5/5: Final verification"
HEALTH=$(curl -sf "${HEAVEN_URL}/health" | jq -r '.status' 2>/dev/null || echo "FAIL")

if [[ "$HEALTH" != "LIVE" ]]; then
  echo "❌ Health check returned: $HEALTH"
  echo "🧯 Rolling back..."
  npx wrangler rollback --message "Auto-rollback: health check failed"
  exit 1
fi

echo ""
echo "✅ Canary deploy complete"
echo "   URL: ${HEAVEN_URL}"
echo "   Status: LIVE"
