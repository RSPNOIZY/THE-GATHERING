#!/bin/bash
# 🛡️ THE PERFECTION PROTOCOL: SYSTEM BOOTSTRAP
# This script is triggered by macOS launchd the moment the M2 Ultra turns on.

echo "======================================================="
echo "🛡️ INITIATING MC96 SWARM BOOTSTRAP..."
echo "======================================================="

# Wait 30 seconds for Google Drive and external drives to mount
echo "--> Waiting for volume mounts..."
sleep 30

TRANSPORT_DIR="/Users/m2ultra/NOIZYANTHROPIC/projects/mc96-transport"

# 1. Boot the Docker Swarm (n8n, ChromaDB, Node-RED, Grafana)
echo "--> Engaging Docker Swarm..."
cd "$TRANSPORT_DIR/docker" || exit 1
/usr/local/bin/docker compose up -d

# 2. Boot the Autonomous Colleague (The Watchdog AI)
echo "--> Arming Swarm Intelligence Colleague..."
cd "$TRANSPORT_DIR" || exit 1
nohup /usr/bin/python3 mc96_SWARM_COLLEAGUE.py > "$TRANSPORT_DIR/logs/colleague.log" 2>&1 &

echo "✅ SWARM ONLINE. The M2 Ultra is 100% Armed."
