#!/bin/bash
# ── GABRIEL LaunchAgent Installer ────────────────────────────────────────────
# Installs GABRIEL daemon to auto-start on login · GORUNFREE

set -e

PLIST_SRC="$(dirname "$0")/ai.noizy.gabriel.plist"
PLIST_DEST="$HOME/Library/LaunchAgents/ai.noizy.gabriel.plist"
DAEMON_DIR="$(dirname "$0")/../daemon"

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "GABRIEL LaunchAgent Installer · GORUNFREE"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"

# Install npm dependencies
echo "→ Installing daemon dependencies..."
cd "$DAEMON_DIR" && npm install --silent

# Create logs directory
mkdir -p "$(dirname "$0")/../logs"

# Copy plist
echo "→ Installing LaunchAgent..."
cp "$PLIST_SRC" "$PLIST_DEST"

# Unload existing if running
launchctl unload "$PLIST_DEST" 2>/dev/null || true

# Load the agent
launchctl load "$PLIST_DEST"

echo ""
echo "✓ GABRIEL daemon installed and started"
echo "✓ Will auto-start on every login"
echo ""
echo "Commands:"
echo "  Check health:   curl http://localhost:7777/health"
echo "  Send command:   curl -X POST http://localhost:7777/command -d '{\"text\":\"status\"}'"
echo "  View logs:      tail -f $(dirname "$0")/../logs/gabriel.log"
echo "  Stop daemon:    launchctl unload $PLIST_DEST"
echo "  Start daemon:   launchctl load $PLIST_DEST"
echo ""
echo "GORUNFREE."
