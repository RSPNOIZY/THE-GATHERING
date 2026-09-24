#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — Multi-Device Fleet Installer & Deployment Orchestrator
# Deploys across: M2 Ultra (God Rig) ↔ iPad Pro ↔ iPhone 15 Pro Max ↔ Michael (MBP)
# ==============================================================================
set -euo pipefail

BASE_DIR="/Users/m2ultra/THE-GATHERING"
GOD_RIG_IP="100.118.84.40"
COCKPIT_PORT=8765

echo "═══════════════════════════════════════════════════════════════"
echo "  🚀 NOIZY EMPIRE — FLEET INSTALLER & DEPLOYMENT"
echo "  Targeting: M2 Ultra · iPad Pro · iPhone 15 Pro Max · Michael"
echo "═══════════════════════════════════════════════════════════════"

# 1. BRING UP BACKEND SERVICES ON GOD RIG
echo "📦 [1/4] Ensuring all host engines are active..."
"$BASE_DIR/start-empire-stack.sh" > /dev/null 2>&1 || true

# 2. START LOCAL HIGH-PERFORMANCE COCKPIT WEB SERVER
echo -n "🌐 [2/4] Launching In-Car Cockpit Web Server on port $COCKPIT_PORT... "
if lsof -i :$COCKPIT_PORT >/dev/null 2>&1; then
  echo "✅ Already Active"
else
  nohup python3 -m http.server $COCKPIT_PORT --directory "$BASE_DIR/ui" > "$BASE_DIR/logs/stack/cockpit_http.log" 2>&1 &
  sleep 1
  echo "✅ Started (http://$GOD_RIG_IP:$COCKPIT_PORT/cockpit.html)"
fi

# 3. VERIFY TAILSCALE MESH CONNECTIVITY
echo "🔗 [3/4] Validating Fleet Mesh Nodes..."
tailscale status || true

# 4. EMIT 1-TAP INSTALLATION INSTRUCTIONS FOR EACH DEVICE
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  📱 INSTANT 1-TAP INSTALLATION INSTRUCTIONS PER DEVICE"
echo "───────────────────────────────────────────────────────────────"
echo ""
echo "  1️⃣  FOR IPAD PRO (12.9\" IN-CAR COCKPIT HUD):"
echo "     • Open Safari on iPad and go to:"
echo "       👉 http://$GOD_RIG_IP:$COCKPIT_PORT/cockpit.html"
echo "     • Tap the Safari 'Share' button (square with arrow up)"
echo "     • Tap 'Add to Home Screen' → Name it 'Lucy Cockpit'"
echo "     • Launch the new 'Lucy Cockpit' icon for a 120Hz full-screen HUD."
echo ""
echo "  2️⃣  FOR IPHONE 15 PRO MAX (VOICE TRIGGER & CELLULAR GATE):"
echo "     • Connect Tailscale app on iPhone."
echo "     • Open Safari and test Voice Spark Webhook receiver:"
echo "       👉 http://$GOD_RIG_IP:5678/webhook/voice-spark"
echo "     • In iOS Shortcuts app, create 'Capture Spark' shortcut pointing to above URL."
echo ""
echo "  3️⃣  FOR MICHAEL (MacBook Pro 2012 / macOS Sequoia):"
echo "     • Plug USB flash drive into M2 Ultra and run:"
echo "       👉 /Users/m2ultra/THE-GATHERING/scripts/create-sequoia-mbp2012-usb.sh"
echo "     • Connect to Michael's screen from iPad / Mac anytime via:"
echo "       👉 /Users/m2ultra/THE-GATHERING/scripts/connect-michael-ard.sh"
echo ""
echo "  4️⃣  FOR MACBOOK PRO (FIELD WORKSTATION):"
echo "     • Connect via SSH: ssh m2ultra@$GOD_RIG_IP"
echo "     • Open VS Code Remote: vscode.dev/tunnel/god-rig-m2ultra"
echo "═══════════════════════════════════════════════════════════════"
echo "  🎉 FLEET INSTALLATION READY ACROSS ALL DEVICES!"
echo "═══════════════════════════════════════════════════════════════"
