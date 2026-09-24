#!/usr/bin/env bash
# ============================================================
# NOIZYLAB — Cloudflare Zero Trust Setup Script
# Run on GOD (M2 Ultra) to wire Heaven through the tunnel
#
# Prerequisites:
#   brew install cloudflared
#   cloudflared tunnel login   (authenticates via browser)
# ============================================================

set -euo pipefail

TEAM_NAME="noizylab"
TUNNEL_NAME="noizylab"
CONFIG_SRC="/tmp/Heaven/cloudflare/tunnel-config.yml"
CONFIG_DST="$HOME/.cloudflared/config.yml"

echo "=============================================="
echo "🔒 NOIZYLAB Zero Trust Setup"
echo "=============================================="
echo ""

# ─── Step 1: Check cloudflared ─────────────────────────────
if ! command -v cloudflared &>/dev/null; then
  echo "❌ cloudflared not found. Installing..."
  brew install cloudflared
fi
echo "✅ cloudflared: $(cloudflared --version 2>&1 | head -1)"

# ─── Step 2: Check auth ───────────────────────────────────
if [ ! -f "$HOME/.cloudflared/cert.pem" ]; then
  echo ""
  echo "🔑 No auth cert found. Opening browser to authenticate..."
  cloudflared tunnel login
fi
echo "✅ Authenticated"

# ─── Step 3: Create tunnel ─────────────────────────────────
EXISTING=$(cloudflared tunnel list --output json 2>/dev/null | python3 -c "
import sys, json
tunnels = json.load(sys.stdin)
for t in tunnels:
    if t['name'] == '$TUNNEL_NAME':
        print(t['id'])
        break
" 2>/dev/null || echo "")

if [ -n "$EXISTING" ]; then
  TUNNEL_ID="$EXISTING"
  echo "✅ Tunnel '$TUNNEL_NAME' exists: $TUNNEL_ID"
else
  echo "🔧 Creating tunnel '$TUNNEL_NAME'..."
  TUNNEL_ID=$(cloudflared tunnel create "$TUNNEL_NAME" 2>&1 | grep -oE '[0-9a-f-]{36}')
  echo "✅ Tunnel created: $TUNNEL_ID"
fi

# ─── Step 4: Install config ───────────────────────────────
echo "📋 Installing tunnel config..."
mkdir -p "$HOME/.cloudflared"
sed "s|<TUNNEL-ID>|$TUNNEL_ID|g" "$CONFIG_SRC" > "$CONFIG_DST"
echo "✅ Config written to $CONFIG_DST"

# ─── Step 5: Route DNS ────────────────────────────────────
echo ""
echo "🌐 Routing DNS records..."

HOSTNAMES=(
  "heaven.noizy.ai"
  "gabriel.dreamchamber.noizy.ai"
  "lucy.noizy.ai"
  "dreamchamber.noizy.ai"
  "api.noizy.ai"
  "voice.noizy.ai"
  "n8n.noizy.ai"
  "ai.noizy.ai"
  "metrics.noizy.ai"
)

for hostname in "${HOSTNAMES[@]}"; do
  echo "  → $hostname"
  cloudflared tunnel route dns "$TUNNEL_NAME" "$hostname" 2>/dev/null || \
    echo "    (already exists or zone not active — verify in dashboard)"
done

echo ""
echo "✅ DNS routes configured"

# ─── Step 6: Verify ───────────────────────────────────────
echo ""
echo "=============================================="
echo "🎯 SETUP COMPLETE"
echo "=============================================="
echo ""
echo "Tunnel ID:     $TUNNEL_ID"
echo "Tunnel Name:   $TUNNEL_NAME"
echo "Config:        $CONFIG_DST"
echo ""
echo "Next steps:"
echo "  1. Start the Docker stack:"
echo "     cd /tmp/Heaven/Docker && docker compose up -d"
echo ""
echo "  2. Start the tunnel:"
echo "     cloudflared tunnel run $TUNNEL_NAME"
echo ""
echo "  3. Test:"
echo "     curl https://heaven.noizy.ai/health"
echo ""
echo "  4. Create Access apps in Cloudflare dashboard:"
echo "     → https://one.dash.cloudflare.com/"
echo "     → Access → Applications → Add an application"
echo "     → Self-hosted → heaven.noizy.ai"
echo "     → Set session duration (e.g., 24h)"
echo "     → Add policy: Allow → Email = rspnoizy@gmail.com"
echo "     → Repeat for gabriel.dreamchamber.noizy.ai"
echo ""
echo "  5. After Access apps are created, set CF_ACCESS_AUD:"
echo "     export CF_ACCESS_AUD=<your-app-aud-tag>"
echo "     # Restart Heaven with this env var to enforce JWT at origin"
echo ""
echo "GORUNFREE. 🔒"
