#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────
#  GABRIEL — install as 24/7 macOS LaunchAgent
#
#  Usage: bash scripts/install-launch-agent.sh
#  Effect: loads com.noizy.gabriel — starts on login, restarts on crash
#
#  Prereqs: npm install && npm run build must have succeeded
# ─────────────────────────────────────────────────────────────
set -euo pipefail

GABRIEL_HOME="/Users/m2ultra/NOIZYANTHROPIC/GABRIEL"
PLIST_SRC="$GABRIEL_HOME/launch/com.noizy.gabriel.plist"
PLIST_DST="$HOME/Library/LaunchAgents/com.noizy.gabriel.plist"

echo "── GABRIEL LaunchAgent installer ──"

# Preflight
[ -f "$GABRIEL_HOME/dist/index.js" ] || {
  echo "✗ $GABRIEL_HOME/dist/index.js missing. Run: npm install && npm run build first."
  exit 1
}
[ -f "$GABRIEL_HOME/.env" ] || {
  echo "✗ $GABRIEL_HOME/.env missing. Copy .env.example → .env and fill in ANTHROPIC_API_KEY."
  exit 1
}
grep -q "^ANTHROPIC_API_KEY=.\+" "$GABRIEL_HOME/.env" || {
  echo "✗ ANTHROPIC_API_KEY empty in .env. Required."
  exit 1
}
[ -f "$PLIST_SRC" ] || { echo "✗ plist source missing: $PLIST_SRC"; exit 1; }

mkdir -p "$HOME/Library/LaunchAgents" "$GABRIEL_HOME/logs"

# Unload existing if present (idempotent)
if launchctl list | grep -q "com.noizy.gabriel"; then
  echo "→ unloading existing com.noizy.gabriel"
  launchctl unload "$PLIST_DST" 2>/dev/null || true
fi

cp "$PLIST_SRC" "$PLIST_DST"
chmod 644 "$PLIST_DST"

echo "→ loading LaunchAgent"
launchctl load -w "$PLIST_DST"

sleep 1
if launchctl list | grep -q "com.noizy.gabriel"; then
  echo "✓ GABRIEL LaunchAgent loaded. Tail logs:"
  echo "    tail -f $GABRIEL_HOME/logs/gabriel.log"
  echo "    tail -f $GABRIEL_HOME/logs/gabriel.err"
else
  echo "✗ Load failed. Check $GABRIEL_HOME/logs/gabriel.err"
  exit 1
fi
