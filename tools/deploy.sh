#!/bin/bash
# HEAVEN Deploy Script
# Run this from Terminal: bash ~/NOIZYLAB/deploy.sh
# Or double-click and open with Terminal

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

echo ""
echo "╔══════════════════════════════════════════╗"
echo "║  HEAVEN — NOIZY HVS Consent Kernel     ║"
echo "║  Deploy to Cloudflare Workers             ║"
echo "╚══════════════════════════════════════════╝"
echo ""

# Check if wrangler is available
if ! command -v npx &> /dev/null; then
  echo "❌  npx not found. Install Node.js from https://nodejs.org"
  exit 1
fi

# Check login status
echo "🔐  Checking Cloudflare auth..."
if ! npx wrangler whoami &> /dev/null 2>&1; then
  echo "⚠️   Not logged in. Opening browser for Cloudflare login..."
  npx wrangler login
fi

echo ""
echo "🚀  Deploying HEAVEN Worker..."
npx wrangler deploy

echo ""
echo "✅  HEAVEN deployed successfully."
echo ""
echo "🩺  Testing /health endpoint..."
sleep 2

HEALTH=$(curl -s https://heaven.rsp-5f3.workers.dev/health 2>/dev/null || echo "{}")
echo "$HEALTH" | python3 -m json.tool 2>/dev/null || echo "$HEALTH"

echo ""
echo "═══════════════════════════════════════════"
echo "  NOIZY Empire — Consent as executable code"
echo "═══════════════════════════════════════════"
echo ""
