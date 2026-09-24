#!/bin/bash
# FIX: CryptoTokenKit Error -3 (TKErrorCodeObjectNotFound)
# RSP_001 · GOD.local · 2026-03-27

echo "╔══ CryptoTokenKit Error -3 Fix ══╗"

echo "→ Clearing broken wrangler keychain entry..."
security delete-generic-password -s "com.cloudflare.wrangler" 2>/dev/null && echo "  ✓ Cleared wrangler entry" || echo "  · No wrangler entry found"

echo "→ Clearing node/npm auth tokens..."
security delete-generic-password -a "$(whoami)" -s "node" 2>/dev/null || true

echo "→ Restarting CryptoTokenKit daemon..."
sudo launchctl kickstart -k system/com.apple.CryptoTokenKit.ctk 2>/dev/null && echo "  ✓ CTK daemon restarted" || echo "  · ctk restart skipped"

echo "→ Checking wrangler auth state..."
if command -v wrangler &>/dev/null; then
  wrangler whoami 2>&1 | head -5
else
  echo "  · wrangler not found — run: npm install -g wrangler"
fi

echo ""
echo "→ If still failing, run: wrangler login"
echo "→ CF Account: 2446d788cc4280f5ea22a9948410c355"
echo "╚══════════════════════════════════╝"
