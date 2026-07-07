#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════════════════════════"
echo "  NOIZY EMPIRE STATUS REPORT"
echo "  $(date '+%Y-%m-%d %H:%M:%S')"
echo "═══════════════════════════════════════════════════════════"

HEAVEN_URL="${HEAVEN_URL:-https://heaven.rsp-5f3.workers.dev}"

# Heaven Worker
echo ""
echo "🌐 HEAVEN WORKER"
echo "   URL: ${HEAVEN_URL}"

HEALTH=$(curl -sf "${HEAVEN_URL}/health" 2>/dev/null || echo '{"status":"OFFLINE"}')
STATUS=$(echo "$HEALTH" | jq -r '.status' 2>/dev/null || echo "UNKNOWN")
VERSION=$(echo "$HEALTH" | jq -r '.version' 2>/dev/null || echo "?")
DB=$(echo "$HEALTH" | jq -r '.database' 2>/dev/null || echo "?")
ACTORS=$(echo "$HEALTH" | jq -r '.actors' 2>/dev/null || echo "?")

echo "   Status: $STATUS"
echo "   Version: $VERSION"
echo "   Database: $DB"
echo "   Actors: $ACTORS"

# Endpoints
echo ""
echo "📡 ENDPOINTS"
for endpoint in "/" "/api/v1" "/health" "/gabriel"; do
  CODE=$(curl -sf -o /dev/null -w "%{http_code}" "${HEAVEN_URL}${endpoint}" 2>/dev/null || echo "000")
  if [[ "$CODE" == "200" ]]; then
    echo "   ✅ ${endpoint}: $CODE"
  else
    echo "   ❌ ${endpoint}: $CODE"
  fi
done

# Custom domain
echo ""
echo "🔗 CUSTOM DOMAIN"
NOIZY_CODE=$(curl -sf -o /dev/null -w "%{http_code}" "https://noizy.ai/" 2>/dev/null || echo "000")
if [[ "$NOIZY_CODE" == "200" ]]; then
  echo "   ✅ noizy.ai: $NOIZY_CODE"
else
  echo "   ❌ noizy.ai: $NOIZY_CODE (zone not on rsp@noizy.ai account)"
fi

# Local tools
echo ""
echo "🔧 LOCAL TOOLS"
echo "   Node: $(node -v 2>/dev/null || echo 'NOT FOUND')"
echo "   Wrangler: $(npx wrangler --version 2>/dev/null || echo 'NOT FOUND')"

if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "   CLOUDFLARE_API_TOKEN: SET"
else
  echo "   CLOUDFLARE_API_TOKEN: NOT SET"
fi

echo ""
echo "═══════════════════════════════════════════════════════════"
