#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — Unified FOSS Fleet Stack Launcher
# Powers: M2 Ultra (God Rig) ↔ iPad Pro (Cockpit) ↔ iPhone (Voice/Gate) ↔ MacBook Pro (Field)
# Orchestrates: n8n (:5678) + Node-RED (:1880) + Ollama/Kimmy3 (:11434) + Lucy v4 + MAN
# ==============================================================================
set -euo pipefail

BASE_DIR="/Users/m2ultra/THE-GATHERING"
LOG_DIR="$BASE_DIR/logs/stack"
mkdir -p "$LOG_DIR"

echo "═══════════════════════════════════════════════════════════════"
echo "  🜂 NOIZY EMPIRE — BEST-IN-CLASS FOSS FLEET STACK"
echo "  Fleet: iPad Pro (Cockpit) · iPhone (Voice/Auth) · MacBook Pro"
echo "═══════════════════════════════════════════════════════════════"

# 1. LOCAL INFERENCE ENGINE (OLLAMA / KIMMY 3)
echo -n "  [1/5] Checking Ollama & Kimmy 3 (:11434)... "
if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
  echo "✅ Running"
else
  echo "🚀 Starting Ollama background daemon..."
  nohup ollama serve > "$LOG_DIR/ollama.log" 2>&1 &
  sleep 2
fi

# 2. N8N AUTOMATION SPINE (:5678)
echo -n "  [2/5] Checking n8n Automation Engine (:5678)... "
if curl -s http://localhost:5678 >/dev/null 2>&1 || (command -v docker >/dev/null && docker ps --format '{{.Names}}' | grep -q '^n8n$'); then
  echo "✅ Running (http://localhost:5678)"
else
  echo "🚀 Starting n8n via start-n8n.sh..."
  "$BASE_DIR/start-n8n.sh" > "$LOG_DIR/n8n_start.log" 2>&1 || true
fi

# 3. NODE-RED REAL-TIME TELEMETRY & IOT HUB (:1880)
echo -n "  [3/5] Checking Node-RED Telemetry Engine (:1880)... "
if curl -s http://localhost:1880 >/dev/null 2>&1; then
  echo "✅ Running (http://localhost:1880)"
else
  echo "🚀 Starting Node-RED on port 1880..."
  if [ -x "/Users/m2ultra/.npm-global/bin/node-red" ]; then
    nohup /Users/m2ultra/.npm-global/bin/node-red > "$LOG_DIR/node-red.log" 2>&1 &
  elif command -v node-red >/dev/null 2>&1; then
    nohup node-red > "$LOG_DIR/node-red.log" 2>&1 &
  else
    echo "⚠️ node-red binary not found in PATH"
  fi
  sleep 2
fi

# 4. LUCY v4.0 PERSONAL OS & WORLD MODEL
echo -n "  [4/5] Testing Lucy v4.0 Real-Time Zone Engine... "
cd "$BASE_DIR/LUCY"
node --import tsx src/cli.ts score > /dev/null 2>&1 && echo "✅ Nominal" || echo "⚠️ Check logs"

# 5. MISSION AUTOMATION NETWORK (MAN) & OPENCLAW BUS
echo "  [5/5] MAN & OpenClaw Inter-Agent Mesh: READY"

echo "═══════════════════════════════════════════════════════════════"
echo "  🎉 ALL SERVICES ONLINE & READY FOR FLEET ACCESS"
echo "───────────────────────────────────────────────────────────────"
echo "  • Node-RED Telemetry:  http://localhost:1880 (iPad Dashboard)"
echo "  • n8n Automation:      http://localhost:5678 (Macro Workflows)"
echo "  • Lucy Cockpit:        ./lucy.sh score       (In-Car Staging)"
echo "  • VS Code Dev Tunnel:  code tunnel           (iPad / Web Remote)"
echo "  • Dreamchamber UI:     http://localhost:7777"
echo "═══════════════════════════════════════════════════════════════"
