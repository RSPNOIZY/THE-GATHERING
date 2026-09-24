#!/bin/bash
# 🚀 NOIZYWIN HOTROD BIDIRECTIONAL SYNC ENGINE
# Synchronizes NOIZYVAULT between Apple Mac Studio M2 Ultra and NOIZYWIN Hardware Node.
# Author: RSP_001 / NOIZYLAB

set -e

MAC_ROOT="/Users/m2ultra/Library/CloudStorage"
WIN_NODE="/Volumes/NOIZYWIN/Windows/MissionControl96/noizylab_2026"
WIN_VAULT="/Volumes/NOIZYWIN/NOIZY_HOTROD_VAULT"

echo "⚡ [HOTROD SYNC] Checking NOIZYWIN hardware node..."

if [ ! -d "/Volumes/NOIZYWIN" ]; then
    echo "⚠️ Warning: /Volumes/NOIZYWIN is not currently mounted."
    echo "Please connect the NOIZYWIN drive to complete hardware sync."
    exit 1
fi

echo "✅ NOIZYWIN Hardware Node detected."

# Create targets
mkdir -p "$WIN_NODE/NOIZYVOX"
mkdir -p "$WIN_VAULT"

# 1. Sync Presentations & Static Apps
echo "📦 Syncing NOIZYVOX Presentation Engine..."
rsync -av --update "$MAC_ROOT/apps/noizyvox-presentation/" "$WIN_NODE/NOIZYVOX/"
rsync -av --update "$MAC_ROOT/apps/noizyvox-presentation/index.html" "$WIN_VAULT/index.html"

# 2. Sync Documentation & Blueprints
echo "📄 Syncing Sovereign Documentation & Blueprints..."
rsync -av --update --include="*.md" --include="*.json" --exclude="*" "$MAC_ROOT/docs/" "$WIN_VAULT/"

# 3. Sync Scripts & Automation
echo "🛠️ Syncing Python Pipelines & FOSS Scripts..."
rsync -av --update "$MAC_ROOT/scripts/compile_noizyvox_presentation.py" "$WIN_VAULT/"
rsync -av --update "$MAC_ROOT/scripts/foss_"* "$WIN_VAULT/" 2>/dev/null || true
rsync -av --update "$MAC_ROOT/scripts/scan_and_collect_constructs.py" "$WIN_VAULT/"

# 4. Sync Catalogs & Schemas
echo "📊 Syncing Construct Catalogs..."
if [ -f "$MAC_ROOT/data/EMPIRE_AGENT_MCP_API_CONSTRUCT_CATALOG.json" ]; then
    cp "$MAC_ROOT/data/EMPIRE_AGENT_MCP_API_CONSTRUCT_CATALOG.json" "$WIN_NODE/"
    cp "$MAC_ROOT/data/EMPIRE_AGENT_MCP_API_CONSTRUCT_CATALOG.json" "$WIN_VAULT/"
fi

# 5. Timestamp receipt
STAMP=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
echo "{\"synced_at\": \"$STAMP\", \"status\": \"SUCCESS\", \"node\": \"NOIZYWIN\"}" > "$WIN_VAULT/sync_receipt.json"

echo "🎉 [HOTROD SYNC] Completed successfully at $STAMP."
