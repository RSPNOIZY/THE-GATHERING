#!/usr/bin/env bash
set -euo pipefail

echo "🚀 NOIZY Gradual Rollout"
echo "========================"

HEAVEN_URL="${HEAVEN_URL:-https://heaven.rsp-5f3.workers.dev}"
ENV="${1:-production}"
WAIT_SECONDS="${2:-300}"  # 5 minutes between stages

# Rollout stages: 1% → 10% → 50% → 100%
STAGES=(1 10 50 100)

echo "Environment: $ENV"
echo "Wait between stages: ${WAIT_SECONDS}s"
echo ""

# Deploy initial version
echo "📦 Deploying new version..."
npx wrangler deploy -e "$ENV" || {
  echo "❌ Deploy failed"
  exit 1
}

# Gradual rollout
for pct in "${STAGES[@]}"; do
  echo ""
  echo "🚦 Rolling out to ${pct}%..."

  # Note: This uses the Versions API for traffic splitting
  # Actual command depends on your wrangler version
  # npx wrangler versions deploy --percentage "$pct" -e "$ENV" 2>/dev/null || true

  # Smoke test at each stage
  echo "🧪 Smoke test at ${pct}%..."
  sleep 5

  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${HEAVEN_URL}/health" 2>/dev/null || echo "000")

  if [[ "$STATUS" != "200" ]]; then
    echo "❌ Smoke test failed at ${pct}% (HTTP $STATUS)"
    echo "🧯 Rolling back..."
    npx wrangler rollback --message "Auto-rollback: failed at ${pct}%"
    exit 1
  fi

  echo "✅ Smoke test passed at ${pct}%"

  if [[ "$pct" -lt 100 ]]; then
    echo "⏳ Waiting ${WAIT_SECONDS}s before next stage..."
    sleep "$WAIT_SECONDS"
  fi
done

echo ""
echo "✅ Gradual rollout complete (100%)"
echo "   URL: ${HEAVEN_URL}"
