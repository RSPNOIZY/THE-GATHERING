#!/usr/bin/env bash
set -euo pipefail

echo "🏆 NOIZY Variant Promotion"
echo "=========================="

EXPERIMENT="${1:-search_algo}"
METRICS_FILE="${2:-/tmp/experiment-metrics.json}"

# Check if metrics file exists
if [[ ! -f "$METRICS_FILE" ]]; then
  echo "Creating sample metrics file for demonstration..."
  cat > "$METRICS_FILE" <<'EOF'
{
  "control": { "errorRate": 0.004, "latencyP95": 210, "sampleSize": 10000 },
  "v2": { "errorRate": 0.001, "latencyP95": 180, "sampleSize": 8500 },
  "v3": { "errorRate": 0.006, "latencyP95": 260, "sampleSize": 1500 }
}
EOF
fi

echo "Experiment: ${EXPERIMENT}"
echo "Metrics file: ${METRICS_FILE}"
echo ""

# Read metrics
METRICS=$(cat "$METRICS_FILE")
echo "Current metrics:"
echo "$METRICS" | jq .
echo ""

# Select winner (lowest error rate, latency not worse than control)
select_winner() {
  local metrics="$1"

  # Get control baseline
  CONTROL_ERROR=$(echo "$metrics" | jq -r '.control.errorRate')
  CONTROL_LATENCY=$(echo "$metrics" | jq -r '.control.latencyP95')
  MIN_SAMPLE=1000

  echo "Control baseline:"
  echo "  Error rate: ${CONTROL_ERROR}"
  echo "  Latency P95: ${CONTROL_LATENCY}ms"
  echo ""

  WINNER="control"
  WINNER_ERROR="$CONTROL_ERROR"

  # Evaluate each variant
  for variant in $(echo "$metrics" | jq -r 'keys[]'); do
    ERROR=$(echo "$metrics" | jq -r ".[\"$variant\"].errorRate")
    LATENCY=$(echo "$metrics" | jq -r ".[\"$variant\"].latencyP95")
    SAMPLE=$(echo "$metrics" | jq -r ".[\"$variant\"].sampleSize")

    echo "Evaluating $variant:"
    echo "  Error rate: ${ERROR}"
    echo "  Latency P95: ${LATENCY}ms"
    echo "  Sample size: ${SAMPLE}"

    # Skip if sample too small
    if [[ "$SAMPLE" -lt "$MIN_SAMPLE" ]]; then
      echo "  ⚠️  Sample too small (< ${MIN_SAMPLE})"
      continue
    fi

    # Skip if latency worse than control
    LATENCY_OK=$(echo "$LATENCY <= $CONTROL_LATENCY * 1.1" | bc)
    if [[ "$LATENCY_OK" != "1" ]]; then
      echo "  ⚠️  Latency too high (> 110% of control)"
      continue
    fi

    # Check if error rate is better
    IS_BETTER=$(echo "$ERROR < $WINNER_ERROR" | bc)
    if [[ "$IS_BETTER" == "1" ]]; then
      WINNER="$variant"
      WINNER_ERROR="$ERROR"
      echo "  ✅ New best candidate"
    else
      echo "  ➖ Not better than current winner"
    fi
  done

  echo "$WINNER"
}

WINNER=$(select_winner "$METRICS" | tail -1)
echo ""
echo "════════════════════════════════════════"
echo "  Selected winner: ${WINNER}"
echo "════════════════════════════════════════"
echo ""

if [[ "$WINNER" == "control" ]]; then
  echo "Control wins — no promotion needed"
  exit 0
fi

# Generate promoted experiment config
# Winner becomes new control (100%), others removed
NEW_CONFIG=$(cat <<EOF
{
  "salt": "${EXPERIMENT}-promoted-$(date +%Y%m%d)",
  "variants": {
    "${WINNER}": 100
  },
  "promoted_at": "$(date -u +%Y-%m-%dT%H:%M:%SZ)",
  "previous_winner": "${WINNER}",
  "decision_metrics": ${METRICS}
}
EOF
)

echo "New experiment config:"
echo "$NEW_CONFIG" | jq .
echo ""

# Check if we should actually promote (dry-run by default)
if [[ "${DRY_RUN:-true}" == "true" ]]; then
  echo "DRY RUN — not writing to KV"
  echo ""
  echo "To promote for real:"
  echo "  DRY_RUN=false ./scripts/promote-variant.sh ${EXPERIMENT}"
  exit 0
fi

# Write to KV
echo "Promoting ${WINNER} to production..."
NAMESPACE_ID="${FEATURE_FLAGS_ID:-}"

if [[ -z "$NAMESPACE_ID" ]]; then
  echo "❌ FEATURE_FLAGS_ID not set"
  echo "   Set the namespace ID to promote"
  exit 1
fi

npx wrangler kv key put --namespace-id="$NAMESPACE_ID" "$EXPERIMENT" "$NEW_CONFIG"

echo ""
echo "════════════════════════════════════════"
echo "  ✅ ${WINNER} promoted to production"
echo "════════════════════════════════════════"
echo "  Experiment: ${EXPERIMENT}"
echo "  New control: ${WINNER}"
echo "  Effective immediately (KV global propagation)"
echo ""

# Log promotion
LOG_FILE="${HOME}/.noizy-promotions.log"
echo "$(date -u +%Y-%m-%dT%H:%M:%SZ): Promoted ${WINNER} for ${EXPERIMENT}" >> "$LOG_FILE"
