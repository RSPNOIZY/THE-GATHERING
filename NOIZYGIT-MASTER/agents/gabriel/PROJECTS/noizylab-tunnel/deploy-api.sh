#!/bin/bash
# Deploy NOIZYLAB EDGE via Cloudflare API (no wrangler needed)
# Requires: CLOUDFLARE_API_TOKEN, CLOUDFLARE_ACCOUNT_ID

set -e

ACCOUNT_ID="${CLOUDFLARE_ACCOUNT_ID:-2446d788cc4280f5ea22a9948410c355}"
WORKER_NAME="noizylab-edge"
SCRIPT_FILE="src/index.js"

if [ -z "$CLOUDFLARE_API_TOKEN" ]; then
    echo "ERROR: Set CLOUDFLARE_API_TOKEN first"
    echo ""
    echo "Get token from: https://dash.cloudflare.com/profile/api-tokens"
    echo "Permissions needed: Workers Scripts:Edit"
    echo ""
    echo "Then run:"
    echo "  export CLOUDFLARE_API_TOKEN='your_token'"
    echo "  ./deploy-api.sh"
    exit 1
fi

echo "Deploying $WORKER_NAME..."

# Upload worker script
curl -s -X PUT \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/javascript" \
  --data-binary @"$SCRIPT_FILE" | jq .

echo ""
echo "Enabling workers.dev subdomain..."

# Enable workers.dev route
curl -s -X POST \
  "https://api.cloudflare.com/client/v4/accounts/$ACCOUNT_ID/workers/scripts/$WORKER_NAME/subdomain" \
  -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"enabled": true}' | jq .

echo ""
echo "✅ Deployed to: https://$WORKER_NAME.fishmusicinc.workers.dev"
