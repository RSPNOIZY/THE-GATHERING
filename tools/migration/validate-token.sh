#!/usr/bin/env bash
set -euo pipefail

# Validate a migration DRM token with EdgeGovernor
# This BURNS the token (single-use)
# Usage: ./validate-token.sh

EDGE_GOVERNOR_URL="${EDGE_GOVERNOR_URL:-https://edge-governor.rsp-5f3.workers.dev}"

if [[ -z "${MIGRATION_TOKEN:-}" ]]; then
  echo "═══════════════════════════════════════════════════════════════════"
  echo "  ❌ EDGE CORE VIOLATION: Missing migration DRM token"
  echo "═══════════════════════════════════════════════════════════════════"
  echo ""
  echo "  Zone migration requires a valid DRM token from EdgeGovernor."
  echo "  This is cryptographic intent enforcement — not a checklist."
  echo ""
  echo "  To request a token:"
  echo "    ./scripts/migration/request-token.sh zone_migration"
  echo ""
  echo "  Then set the token:"
  echo "    export MIGRATION_TOKEN=\"<your-token>\""
  echo ""
  exit 1
fi

echo "═══════════════════════════════════════════════════════════════════"
echo "  EdgeGovernor: Validating Migration DRM Token"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  Token: ${MIGRATION_TOKEN:0:8}..."
echo "  Validator: ${HOSTNAME:-unknown}"
echo ""
echo "  ⚠️  WARNING: This will BURN the token (single-use)"
echo ""

RESPONSE=$(curl -sf "${EDGE_GOVERNOR_URL}/validate" \
  -X POST \
  -H "Authorization: Bearer ${MIGRATION_TOKEN}" \
  -H "X-Validator: ${HOSTNAME:-cli}" \
  2>&1) || {
    echo "❌ Token validation failed"
    echo "   Response: $RESPONSE"
    echo ""
    echo "   Possible reasons:"
    echo "   - Token not found (typo or never issued)"
    echo "   - Token already used (single-use)"
    echo "   - Token expired (default 15 minutes)"
    echo ""
    exit 1
  }

SUCCESS=$(echo "$RESPONSE" | jq -r '.success')
if [[ "$SUCCESS" != "true" ]]; then
  ERROR=$(echo "$RESPONSE" | jq -r '.error')
  echo "❌ Token validation denied: $ERROR"
  exit 1
fi

OWNER=$(echo "$RESPONSE" | jq -r '.owner')
OPERATION=$(echo "$RESPONSE" | jq -r '.operation')

echo "✅ Token validated and burned"
echo ""
echo "  Owner:     $OWNER"
echo "  Operation: $OPERATION"
echo ""
echo "═══════════════════════════════════════════════════════════════════"
echo "  ✅ MIGRATION AUTHORIZED"
echo "═══════════════════════════════════════════════════════════════════"
echo ""
echo "  You may now proceed with the $OPERATION."
echo "  This authorization is logged in EdgeGovernor audit trail."
echo ""
