#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# DREAMCHAMBER — iPhone Mic Bridge
# NOIZY Empire | GORUNFREE | RSP_001
#
# Bridges iPhone (via Continuity Camera or Airfoil) to the standalone
# dreamchamber-voice-pipeline.js TCP server (port 5555).
#
# Use this ONLY if running dreamchamber-voice-pipeline.js separately.
# The VSCode extension connects directly to port 7777 and does NOT
# need this script — it submits WAV files via the HTTP API.
#
# SETUP:
#   1. iPhone Continuity Mic (Zero Install):
#      - iPhone and Mac on same Wi-Fi + Bluetooth ON
#      - macOS Ventura+ / iOS 16+
#      - In System Settings → Sound → Input: select "iPhone Microphone"
#      - Run this script — sox captures the system default input
#
#   2. Airfoil ($29 one-time):
#      - Install Airfoil on Mac + Airfoil Satellite (free) on iPhone
#      - Open Airfoil, select iPhone mic as source
#      - Set output to "localhost:5555" or use the TCP stream
#      - Run dreamchamber-voice-pipeline.js (it listens on TCP 5555)
#
# USAGE:
#   chmod +x iphone-bridge.sh
#   ./iphone-bridge.sh
#   ./iphone-bridge.sh --host GOD.local --port 5555
# ═══════════════════════════════════════════════════════════════════════

set -euo pipefail

HOST="${DC_HOST:-127.0.0.1}"
PORT="${DC_PORT:-5555}"
RATE=16000
BITS=16
CHANNELS=1

# Parse args
while [[ $# -gt 0 ]]; do
  case "$1" in
    --host) HOST="$2"; shift 2;;
    --port) PORT="$2"; shift 2;;
    *) echo "Unknown arg: $1"; exit 1;;
  esac
done

# Check dependencies
if ! command -v sox &>/dev/null; then
  echo "❌  sox not found — install with: brew install sox"
  exit 1
fi
if ! command -v nc &>/dev/null; then
  echo "❌  nc (netcat) not found"
  exit 1
fi

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  DREAMCHAMBER iPhone Mic Bridge"
echo "  Streaming: system mic → ${HOST}:${PORT}"
echo "  Format: ${RATE}Hz ${BITS}-bit mono raw PCM"
echo ""
echo "  📱 iPhone Continuity Mic:"
echo "     System Settings → Sound → Input → iPhone Microphone"
echo ""
echo "  Press Ctrl+C to stop"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""

# Capture system default audio input → raw PCM → TCP socket
# sox -d = default audio input device (iPhone Continuity Mic when selected)
exec sox -d \
  -r "${RATE}" \
  -c "${CHANNELS}" \
  -b "${BITS}" \
  -e signed-integer \
  -t raw - \
  | nc "${HOST}" "${PORT}"
