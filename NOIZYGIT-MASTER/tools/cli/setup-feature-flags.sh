#!/usr/bin/env bash
set -euo pipefail

echo "🚩 NOIZY Feature Flags Setup"
echo "============================"

# Check if namespace exists
echo ""
echo "Step 1: Create FEATURE_FLAGS KV namespace..."

EXISTING=$(npx wrangler kv:namespace list 2>/dev/null | grep -c "FEATURE_FLAGS" || echo "0")

if [[ "$EXISTING" -gt 0 ]]; then
  echo "  ✓ FEATURE_FLAGS namespace already exists"
else
  echo "  Creating new namespace..."
  OUTPUT=$(npx wrangler kv:namespace create "FEATURE_FLAGS" 2>&1)
  echo "$OUTPUT"

  # Extract namespace ID
  NAMESPACE_ID=$(echo "$OUTPUT" | grep -oP 'id = "\K[^"]+' || echo "")

  if [[ -n "$NAMESPACE_ID" ]]; then
    echo ""
    echo "  ✓ Created with ID: $NAMESPACE_ID"
    echo ""
    echo "  UPDATE wrangler.toml:"
    echo "    [[kv_namespaces]]"
    echo "    binding = \"FEATURE_FLAGS\""
    echo "    id = \"$NAMESPACE_ID\""
  fi
fi

# Seed default flags
echo ""
echo "Step 2: Seed default feature flags..."

NAMESPACE_ID="${FEATURE_FLAGS_ID:-}"

if [[ -z "$NAMESPACE_ID" ]]; then
  echo "  ⚠️  Set FEATURE_FLAGS_ID env var to seed flags"
  echo "     export FEATURE_FLAGS_ID=<your-namespace-id>"
  echo "     ./scripts/setup-feature-flags.sh"
  exit 0
fi

# Default flags with safe fallbacks
declare -A FLAGS=(
  ["new_consent_flow"]="false"
  ["enhanced_logging"]="true"
  ["rate_limit_strict"]="true"
  ["maintenance_mode"]="false"
  ["api_v2_enabled"]="false"
  ["gradual_rollout_percent"]="0"
)

for flag in "${!FLAGS[@]}"; do
  value="${FLAGS[$flag]}"
  echo "  Setting $flag = $value"
  npx wrangler kv:key put --namespace-id="$NAMESPACE_ID" "$flag" "$value" 2>/dev/null || echo "    (failed)"
done

echo ""
echo "Step 3: Verify flags..."
npx wrangler kv:key list --namespace-id="$NAMESPACE_ID" 2>/dev/null | head -20

echo ""
echo "════════════════════════════════════════"
echo "  ✅ Feature flags configured"
echo ""
echo "  Usage in code:"
echo "    import { isEnabled } from './flags';"
echo "    if (await isEnabled(env, 'new_consent_flow')) { ... }"
echo ""
echo "  Toggle flags:"
echo "    npx wrangler kv:key put --namespace-id=$NAMESPACE_ID new_consent_flow true"
echo "════════════════════════════════════════"
