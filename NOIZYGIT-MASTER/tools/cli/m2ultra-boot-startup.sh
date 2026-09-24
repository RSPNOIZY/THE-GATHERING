#!/usr/bin/env zsh
# ═══════════════════════════════════════════════════════════════════════════
# M2 Ultra Boot Startup Script
# Loaded by: ~/Library/LaunchAgents/com.noizylab.m2ultra.boot.plist
# Fires: at login + every 3600 seconds
# ═══════════════════════════════════════════════════════════════════════════
# RECREATED 2026-04-26 by Plowman Crossing — original was missing.
# Skeleton stops the hourly failure. Add real boot tasks below as needed.
# ═══════════════════════════════════════════════════════════════════════════

set -uo pipefail

LOG_FILE="/Users/m2ultra/.m2ultra-boot.log"
exec >> "$LOG_FILE" 2>&1

echo ""
echo "═══ boot-startup tick @ $(date '+%Y-%m-%d %H:%M:%S %Z') ═══"

# Health checks (non-fatal; logged only)
echo "  ✓ user: $USER"
echo "  ✓ home: $HOME"
echo "  ✓ uptime: $(/usr/bin/uptime)"
echo "  ✓ disk:   $(/bin/df -h /Users/m2ultra | /usr/bin/tail -1 | /usr/bin/awk '{print $4 " free of " $2}')"
echo "  ✓ load:   $(/usr/sbin/sysctl -n vm.loadavg)"

# TODO (RSP): wire up actual boot tasks here.
# Suggestions:
#   - verify /Volumes/6TB is mounted (warn if not — backup target)
#   - tailscale status check
#   - ollama serve health probe
#   - wake key NOIZY services
#   - rotate ledgers / heartbeat to /Users/m2ultra/logs/heartbeat.log

echo "═══ boot-startup tick complete ═══"
exit 0
