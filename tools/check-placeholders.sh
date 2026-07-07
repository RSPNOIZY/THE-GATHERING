#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# CI Guard: Placeholder Config Scan
# NOIZY Empire | GORUNFREE
#
# Blocks deploy if any worker config contains forbidden placeholder strings.
# Run in CI before wrangler deploy, or locally before committing.
#
# Usage:
#   ./scripts/check-placeholders.sh
#   ./scripts/check-placeholders.sh workers/consent-gateway
#
# Exit codes:
#   0 — clean, no placeholders found
#   1 — placeholders detected, deploy blocked
# ═══════════════════════════════════════════════════════════════════════
set -euo pipefail

TARGET="${1:-workers}"
FAILED=0

# Strings that must NEVER appear in deployed worker configs
FORBIDDEN=(
  "PLACEHOLDER_KV_ID"
  "PLACEHOLDER_D1_ID"
  "TODO_KV_ID"
  "TODO_D1_ID"
  "REPLACE_ME"
  "YOUR_KV_ID"
  "YOUR_D1_ID"
  "INSERT_ID_HERE"
)

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  NOIZY CI — Placeholder Config Scan"
echo "  Target: ${TARGET}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

for TERM in "${FORBIDDEN[@]}"; do
  # Search wrangler.toml and .env files in target directory
  if grep -r --include="*.toml" --include="*.json" --include="*.env" \
      -l "${TERM}" "${TARGET}" 2>/dev/null | grep -q .; then

    echo "❌  BLOCKED: Found forbidden placeholder '${TERM}' in:"
    grep -r --include="*.toml" --include="*.json" --include="*.env" \
        -l "${TERM}" "${TARGET}" 2>/dev/null | sed 's/^/     /'
    FAILED=1
  else
    echo "✓  Clean: ${TERM}"
  fi
done

echo ""

if [ "${FAILED}" -eq 1 ]; then
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  echo "  DEPLOY BLOCKED — replace placeholder IDs with real values"
  echo "  Create KV:  wrangler kv namespace create CONSENT_KV"
  echo "  Create D1:  wrangler d1 create <name>"
  echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  ✓ Clean — no placeholder configs detected"
echo "  Safe to deploy."
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
exit 0
