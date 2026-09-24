#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — iPhone Hotspot & Cellular Mesh Resilience Setup
# Optimizes: iPhone 5G/LTE Hotspot ↔ iPad Pro ↔ MacBook Pro ↔ M2 Ultra God Rig
# ==============================================================================
set -euo pipefail

echo "═══════════════════════════════════════════════════════════════"
echo "  📱 IPHONE HOTSPOT & CELLULAR CONTINUITY SETUP"
echo "  Fleet Mesh: iPhone Gateway · iPad Cockpit · MacBook · God Rig"
echo "═══════════════════════════════════════════════════════════════"

# 1. CONFIGURE SSH CLIENT PERSISTENCE OVER CELLULAR
SSH_CONFIG="$HOME/.ssh/config"
mkdir -p "$HOME/.ssh"
chmod 700 "$HOME/.ssh"

if [ ! -f "$SSH_CONFIG" ] || ! grep -q "ServerAliveInterval" "$SSH_CONFIG"; then
  echo "🔧 Configuring SSH Keep-Alive for Cellular Hotspot stability..."
  cat << 'EOF' >> "$SSH_CONFIG"

# --- NOIZY EMPIRE HOTSPOT PERSISTENCE ---
Host *
  ServerAliveInterval 15
  ServerAliveCountMax 6
  TCPKeepAlive yes
  IPQoS throughput
  ControlMaster auto
  ControlPath ~/.ssh/sockets/%r@%h-%p
  ControlPersist 1h
EOF
  chmod 600 "$SSH_CONFIG"
  mkdir -p "$HOME/.ssh/sockets"
  chmod 700 "$HOME/.ssh/sockets"
  echo "  ✅ SSH Cellular resilience configured."
else
  echo "  ✅ SSH Cellular keep-alive already active."
fi

# 2. CHECK TAILSCALE CELLULAR MESH STATUS
echo -n "🔍 Checking Tailscale WireGuard Mesh... "
if command -v tailscale >/dev/null 2>&1; then
  TS_STATUS=$(tailscale status 2>/dev/null || true)
  if [ -n "$TS_STATUS" ]; then
    echo "✅ Active"
    TS_IP=$(tailscale ip -4 2>/dev/null || echo "Unknown")
    echo "  📍 M2 Ultra God Rig Mesh IP: $TS_IP"
  else
    echo "⚠️ Tailscale installed but not logged in. Run: tailscale up"
  fi
else
  echo "⚠️ Tailscale CLI not found in standard PATH."
fi

# 3. IPHONE & IPAD COCKPIT STEP-BY-STEP INSTRUCTIONS
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  📋 3-STEP IPHONE & IPAD ON-THE-ROAD CHECKLIST"
echo "───────────────────────────────────────────────────────────────"
echo "  1. ON IPHONE:"
echo "     • Go to Settings → Personal Hotspot → Turn ON 'Allow Others to Join'"
echo "     • Turn ON 'Maximize Compatibility' (ensures stable 2.4/5GHz iPad handshake)"
echo "     • Ensure Tailscale iOS App is Connected (MagicDNS active)"
echo ""
echo "  2. ON IPAD PRO (COCKPIT):"
echo "     • Connect Wi-Fi to iPhone Hotspot"
echo "     • Tap Wi-Fi (i) info icon → Turn OFF 'Low Data Mode'"
echo "     • Launch Safari → Open: https://vscode.dev/tunnel/god-rig-m2ultra"
echo "     • Open Node-RED HUD: http://<M2-Tailscale-IP>:1880/ui"
echo ""
echo "  3. ON MACBOOK PRO (FIELD DAW):"
echo "     • Connect Wi-Fi / USB-C tether to iPhone"
echo "     • Terminal instant access: ssh m2ultra@god-rig"
echo "═══════════════════════════════════════════════════════════════"
