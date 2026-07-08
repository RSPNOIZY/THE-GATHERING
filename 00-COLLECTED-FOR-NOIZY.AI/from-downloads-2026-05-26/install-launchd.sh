#!/usr/bin/env bash
# NOIZY KERNEL — install as a launchd LaunchAgent on MICHAEL.
# Keeps the core running on the dedicated audio service account and restarts
# it on crash or login. RSP_001.
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
BIN="$HERE/noizy-core-engine"
LABEL="ai.noizy.dreamchamber.core"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

if [ ! -x "$BIN" ]; then
  echo "❌ Binary not found at $BIN — run ./build-michael.sh first."
  exit 1
fi

mkdir -p "$HOME/Library/LaunchAgents" "$HERE/logs"

cat > "$PLIST" <<PLIST
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>$LABEL</string>
    <key>ProgramArguments</key>
    <array>
        <string>$BIN</string>
    </array>
    <key>WorkingDirectory</key>
    <string>$HERE</string>
    <key>RunAtLoad</key>
    <true/>
    <key>KeepAlive</key>
    <true/>
    <key>StandardOutPath</key>
    <string>$HERE/logs/core.out.log</string>
    <key>StandardErrorPath</key>
    <string>$HERE/logs/core.err.log</string>
    <key>ProcessType</key>
    <string>Interactive</string>
</dict>
</plist>
PLIST

echo "✅ Wrote $PLIST"

# Reload cleanly
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "✅ Loaded service: $LABEL"
echo ""
echo "Status:   launchctl list | grep noizy"
echo "Logs:     tail -f $HERE/logs/core.out.log"
echo "Stop:     launchctl unload $PLIST"
