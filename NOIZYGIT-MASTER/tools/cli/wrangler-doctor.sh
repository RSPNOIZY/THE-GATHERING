#!/usr/bin/env bash
set -euo pipefail

echo "🔍 NOIZY Wrangler Doctor"
echo "========================"

# Check Node
echo -n "Node.js: "
node -v || { echo "❌ MISSING"; exit 1; }

# Check Wrangler
echo -n "Wrangler: "
npx wrangler --version 2>/dev/null || { echo "❌ MISSING"; exit 1; }

# Check env vars
echo ""
echo "Environment:"
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo "  ✅ CLOUDFLARE_API_TOKEN is set"
else
  echo "  ❌ CLOUDFLARE_API_TOKEN not set"
  echo "     Run: source .dev.vars"
  exit 1
fi

if [[ -n "${CLOUDFLARE_ACCOUNT_ID:-}" ]]; then
  echo "  ✅ CLOUDFLARE_ACCOUNT_ID is set"
else
  echo "  ⚠️  CLOUDFLARE_ACCOUNT_ID not set (will use wrangler.toml)"
fi

# Verify auth
echo ""
echo "Auth check:"
if npx wrangler whoami >/dev/null 2>&1; then
  echo "  ✅ Wrangler auth OK"
else
  echo "  ❌ Wrangler auth failed"
  exit 1
fi

echo ""
echo "🚀 Ready to deploy"
