#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — Tailscale Fleet Command & Control Center
# Universal Mesh Controller for: M2 Ultra, iPad Pro, iPhone 15 Pro, Michael MBP
# ==============================================================================
set -euo pipefail

GOD_RIG_IP="100.118.84.40"
IPAD_IP="100.90.133.90"
IPHONE_IP="100.96.243.95"
MICHAEL_IP="100.88.102.10"
FREDO_IP="100.100.100.100" # Placeholder IP - update after registering Fredo on Tailscale

CMD="${1:-status}"

echo "═══════════════════════════════════════════════════════════════"
echo "  🌐 TAILSCALE FLEET COMMAND & CONTROL CENTER"
echo "  Encrypted WireGuard Mesh · Zero Open Ports · Sovereign Net"
echo "═══════════════════════════════════════════════════════════════"

case "$CMD" in
  status)
    echo "🔍 Probing all Fleet Nodes over Tailscale Mesh..."
    echo ""
    printf "%-24s %-16s %-12s %-20s\n" "DEVICE NAME" "TAILSCALE IP" "STATUS" "PRIMARY ROLE"
    echo "─────────────────────────────────────────────────────────────────────────────"
    
    # 1. God Rig
    printf "%-24s %-16s %-12s %-20s\n" "M2 Ultra God Rig" "$GOD_RIG_IP" "🟢 ONLINE" "Central Host / AI Engine"
    
    # 2. iPad Pro
    IPAD_PING=$(ping -c 1 -t 1 "$IPAD_IP" >/dev/null 2>&1 && echo "🟢 ACTIVE" || echo "🟡 SLEEP/IDLE")
    printf "%-24s %-16s %-12s %-20s\n" "iPad Pro 12.9\"" "$IPAD_IP" "$IPAD_PING" "In-Car Cockpit HUD"
    
    # 3. iPhone 15 Pro
    IPHONE_PING=$(ping -c 1 -t 1 "$IPHONE_IP" >/dev/null 2>&1 && echo "🟢 ACTIVE" || echo "🟡 CELLULAR")
    printf "%-24s %-16s %-12s %-20s\n" "iPhone 15 Pro Max" "$IPHONE_IP" "$IPHONE_PING" "5G Gateway / Voice Gate"
    
    # 4. Michael
    MICHAEL_PING=$(ping -c 1 -t 1 "$MICHAEL_IP" >/dev/null 2>&1 && echo "🟢 ACTIVE" || echo "⚪ STANDBY")
    printf "%-24s %-16s %-12s %-20s\n" "Michael (MBP 2012)" "$MICHAEL_IP" "$MICHAEL_PING" "macOS Sequoia Vault"
    
    # 5. Fredo
    FREDO_PING=$(ping -c 1 -t 1 "$FREDO_IP" >/dev/null 2>&1 && echo "🟢 ACTIVE" || echo "⚪ STANDBY")
    printf "%-24s %-16s %-12s %-20s\n" "Fredo (Mac Pro 2012)" "$FREDO_IP" "$FREDO_PING" "Dual 12-Core Server / 44TB"
    
    echo ""
    echo "Available Commands:"
    echo "  ./scripts/tailscale-fleet-control.sh screen michael  # Open ARD Screen Sharing to Michael"
    echo "  ./scripts/tailscale-fleet-control.sh screen fredo    # Open ARD Screen Sharing to Fredo"
    echo "  ./scripts/tailscale-fleet-control.sh ssh michael     # SSH into Michael"
    echo "  ./scripts/tailscale-fleet-control.sh ssh fredo       # SSH into Fredo"
    echo "  ./scripts/tailscale-fleet-control.sh hud             # Show iPad Cockpit URL"
    ;;

  screen)
    TARGET="${2:-michael}"
    if [ "$TARGET" == "michael" ] || [ "$TARGET" == "mbp" ]; then
      echo "🖥️ Opening Apple Remote Desktop to Michael ($MICHAEL_IP)..."
      open "vnc://$MICHAEL_IP"
    elif [ "$TARGET" == "fredo" ] || [ "$TARGET" == "macpro" ]; then
      echo "🖥️ Opening Apple Remote Desktop to Fredo ($FREDO_IP)..."
      open "vnc://$FREDO_IP"
    else
      echo "Opening VNC to $TARGET..."
      open "vnc://$TARGET"
    fi
    ;;

  ssh)
    TARGET="${2:-michael}"
    if [ "$TARGET" == "michael" ] || [ "$TARGET" == "mbp" ]; then
      echo "💻 Connecting SSH to Michael ($MICHAEL_IP)..."
      ssh "m2ultra@$MICHAEL_IP"
    elif [ "$TARGET" == "fredo" ] || [ "$TARGET" == "macpro" ]; then
      echo "💻 Connecting SSH to Fredo ($FREDO_IP)..."
      ssh "m2ultra@$FREDO_IP"
    elif [ "$TARGET" == "godrig" ]; then
      ssh "m2ultra@$GOD_RIG_IP"
    else
      ssh "m2ultra@$TARGET"
    fi
    ;;

  hud)
    echo "📱 Live Cockpit HUD URL for iPad / iPhone:"
    echo "👉 http://$GOD_RIG_IP:8765/cockpit.html"
    echo "👉 http://m2ultras-mac-studio:8765/cockpit.html"
    ;;

  *)
    echo "Usage: $0 {status|screen|ssh|hud}"
    ;;
esac
