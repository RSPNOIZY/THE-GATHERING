#!/bin/bash
# NOIZYLAB — Heaven + Lucy Launch Script
# Double-click this file to launch everything
# OR run from Terminal: bash launch-heaven-lucy.command

set -e

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo ""
echo "╔══════════════════════════════════════════════════════════╗"
echo "║     NOIZYLAB — Heaven & Lucy Platform Launcher           ║"
echo "║     DreamChamber iOS Backend + Services                  ║"
echo "╚══════════════════════════════════════════════════════════╝"
echo ""

# ── Fix PATH
export PATH="/opt/homebrew/bin:/opt/homebrew/sbin:/usr/local/bin:$PATH"
export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"

# ── 1. Start Heaven + Lucy Docker Stack
echo "🐳 Starting Heaven + Lucy Docker stack..."
cd "$PROJECT_ROOT/Docker"
docker compose up -d --build 2>&1 | grep -E "✓|✗|error|Error|done|Done|Starting|Started|Created|Building" || true
echo ""

# Wait for health
sleep 8
echo "── Checking services ───────────────────────────────────────"
for name_port in "heaven17:17017" "DreamChamber:7777" "Heaven:8080" "Lucy:8081" "GORUNFREE:9099" "Bridge:7778"; do
  name="${name_port%:*}"
  port="${name_port#*:}"
  status=$(curl -sf "http://localhost:$port/health" -o /dev/null -w "%{http_code}" 2>/dev/null)
  if [ "$status" = "200" ]; then
    echo "  ✅ $name (:$port)"
  else
    echo "  ⚠️  $name (:$port) — $status"
  fi
done

# ── 2. Start cloudflared tunnel (if configured)
echo ""
if cloudflared tunnel list 2>/dev/null | grep -q "dreamchamber"; then
  echo "🌐 Starting Cloudflare ZeroTrust tunnel..."
  cloudflared tunnel run dreamchamber &
  echo "  ✅ Tunnel running"
else
  echo "⚠️  Cloudflare tunnel not configured (run: cloudflared tunnel create dreamchamber)"
fi

# ── 3. Generate Xcode project
echo ""
echo "📱 Regenerating Xcode project..."
cd "$PROJECT_ROOT"
xcodegen generate 2>/dev/null && echo "  ✅ Heaven.xcodeproj regenerated" || echo "  ⚠️  xcodegen not found"

echo ""
echo "═══════════════════════════════════════════════════════════"
echo "  NOIZYLAB Services:"
echo "    🌌 Heaven:       http://localhost:8080"
echo "    💜 Lucy:         http://localhost:8081"
echo "    🎙️  heaven17:     http://localhost:17017"
echo "    🧠 DreamChamber: http://localhost:7777"
echo "    🎤 GORUNFREE:    http://localhost:9099"
echo "    🔗 Bridge:       http://localhost:7778"
echo "    🤖 Ollama:       http://localhost:11434"
echo "    📊 n8n:          http://localhost:5678"
echo "    📈 Grafana:      http://localhost:3000"
echo "    🌐 Traefik:      http://localhost:8888"
echo "═══════════════════════════════════════════════════════════"
echo ""
echo "  Open Xcode: open $PROJECT_ROOT/Heaven.xcodeproj"
echo "  Stop all:   cd $PROJECT_ROOT/Docker && docker compose down"
echo ""
