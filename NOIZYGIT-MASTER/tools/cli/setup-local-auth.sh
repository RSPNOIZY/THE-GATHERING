#!/usr/bin/env bash
set -euo pipefail

echo "🔐 NOIZY Local Auth Setup"
echo "========================="

DEV_VARS=".dev.vars"

if [[ -f "$DEV_VARS" ]]; then
  echo "⚠️  $DEV_VARS already exists"
  read -p "Overwrite? (y/N) " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

echo ""
echo "Enter your Cloudflare API token:"
echo "(Create at: https://dash.cloudflare.com/profile/api-tokens)"
echo "(Template: Edit Cloudflare Workers)"
echo ""
read -s -p "Token: " TOKEN
echo ""

if [[ -z "$TOKEN" ]]; then
  echo "❌ Token cannot be empty"
  exit 1
fi

ACCOUNT_ID="5f36aa9795348ea681d0b21910dfc82a"

cat > "$DEV_VARS" << EOF
# NOIZY Cloudflare Auth (rsp@noizy.ai account)
# Generated: $(date -u +%Y-%m-%dT%H:%M:%SZ)
# DO NOT COMMIT THIS FILE

CLOUDFLARE_API_TOKEN=$TOKEN
CLOUDFLARE_ACCOUNT_ID=$ACCOUNT_ID
EOF

chmod 600 "$DEV_VARS"

echo ""
echo "✅ Created $DEV_VARS"
echo ""
echo "To use:"
echo "  source $DEV_VARS"
echo "  make doctor"
echo "  make deploy"
