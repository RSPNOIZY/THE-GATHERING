#!/bin/bash
set -e
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║  🌌 NOIZYLAB UNIVERSAL INGESTION                              ║"
echo "║  Multi-Source • Multi-Format • AI • Knowledge Lake           ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
cd "$(dirname "$0")"
wrangler deploy --minify
echo ""
echo "✅ https://noizylab-ingestion.fishmusicinc.workers.dev"
