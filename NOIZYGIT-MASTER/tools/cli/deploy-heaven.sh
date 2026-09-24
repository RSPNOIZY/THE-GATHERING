#!/usr/bin/env bash
set -euo pipefail

echo "🚀 NOIZY Heaven Deploy"
echo "======================"

# Preflight
echo ""
echo "Step 1/4: Preflight check"
./scripts/wrangler-doctor.sh || exit 1

# Deploy
echo ""
echo "Step 2/4: Deploying Heaven Worker"
cd /Users/m2ultra/NOIZYANTHROPIC
npx wrangler deploy || {
  echo "❌ Deploy failed"
  exit 1
}

# Wait for propagation
echo ""
echo "Step 3/4: Waiting for edge propagation..."
sleep 5

# Smoke test
echo ""
echo "Step 4/4: Running smoke tests"
./scripts/smoke-test.sh || {
  echo "❌ Smoke test failed - consider rollback"
  echo "   Run: npx wrangler rollback"
  exit 1
}

echo ""
echo "✅ Heaven deployed successfully"
echo "   URL: https://heaven.rsp-5f3.workers.dev"
