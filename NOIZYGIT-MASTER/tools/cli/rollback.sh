#!/usr/bin/env bash
set -euo pipefail

echo "🧯 NOIZY Emergency Rollback"
echo "==========================="

MESSAGE="${1:-Manual rollback}"

echo "Rolling back to previous version..."
npx wrangler rollback --message "$MESSAGE" || {
  echo "❌ Rollback failed"
  exit 1
}

echo ""
echo "Verifying rollback..."
sleep 3
./scripts/smoke-test.sh || {
  echo "⚠️ Smoke test failed after rollback"
  exit 1
}

echo ""
echo "✅ Rollback complete"
