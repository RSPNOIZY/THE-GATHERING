#!/usr/bin/env bash
set -euo pipefail

# Request a migration DRM token from EdgeGovernor
# Usage: ./request-token.sh <operation> [ttl_minutes]

EDGE_GOVERNOR_URL="${EDGE_GOVERNOR_URL:-https://edge-governor.rsp-5f3.workers.dev}"

OPERATION="${1:-zone_migration}"
TTL_MINUTES="${2:-15}"
OWNER="${MIGRATION_OWNER:-RSP_001}"

echo "═══════════════════════════════════════════════════════════════════"
echo "  EdgeGovernor: Requesting Migration DRM Token"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  Operation:  $OPERATION"
echo "  Owner:      $OWNER"
echo "  TTL:        $TTL_MINUTES minutes"
echo ""

RESPONSE=$(curl -sf "${EDGE_GOVERNOR_URL}/issue" \
  -H "Content-Type: application/json" \
  -d "{\"owner\": \"${OWNER}\", \"operation\": \"${OPERATION}\", \"ttlMinutes\": ${TTL_MINUTES}}" \
  2>&1) || {
    echo "❌ Failed to request token"
    echo "   Response: $RESPONSE"
    exit 1
  }

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [[ "$SUCCESS" != "true" ]]; then
  ERROR=$(echo "$RESPONSE" | jq -r '.error')
  echo "❌ Token request denied: $ERROR"
  exit 1
fi

TOKEN=$(echo "$RESPONSE" | jq -r '.token')
EXPIRES_AT=$(echo "$RESPONSE" | jq -r '.expiresAt')
EXPIRES_IN=$(echo "$RESPONSE" | jq -r '.expiresIn')

echo "✅ Token issued successfully"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  TOKEN: $TOKEN"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  Expires: $EXPIRES_IN"
echo "  Single-use: Token is burned after first validation"
echo ""
echo "  To use in migration scripts:"
echo "    export MIGRATION_TOKEN=\"$TOKEN\""
echo ""
echo "  To validate manually:"
echo "    curl -X POST ${EDGE_GOVERNOR_URL}/validate \\"
echo "      -H \"Authorization: Bearer \$MIGRATION_TOKEN\""
echo ""

# Optionally export for immediate use
if [[ "${EXPORT_TOKEN:-false}" == "true" ]]; then
  echo "export MIGRATION_TOKEN=\"$TOKEN\"" >> "${GITHUB_ENV:-/dev/null}" 2>/dev/null || true
  echo "MIGRATION_TOKEN=$TOKEN"
fi
