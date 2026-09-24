#!/bin/bash
# NOIZY Deploy — runs inside admin container
set -e

echo "═══ NOIZY DEPLOY — $(date '+%Y-%m-%d %H:%M:%S') ═══"
echo ""

cd /workspace

echo "▸ Step 1: Smoke tests..."
bash smoke_test.sh 2>&1 || { echo "❌ Smoke tests failed. Aborting."; exit 1; }
echo ""

echo "▸ Step 2: Deploy Heaven..."
npx wrangler deploy 2>&1
echo "  ✅ Heaven deployed"
echo ""

echo "▸ Step 3: Deploy Landing Page..."
cd /workspace/noizy-landing
npx wrangler deploy 2>&1
echo "  ✅ Landing page deployed"
echo ""

echo "▸ Step 4: Post-deploy verification..."
sleep 3
echo "  Heaven: $(curl -s --max-time 5 https://heaven.rsp-5f3.workers.dev/health | head -c 80)"
echo "  Landing: $(curl -sI --max-time 5 https://noizy.ai/ 2>/dev/null | head -1)"
echo ""

echo "═══ DEPLOY COMPLETE ═══"
