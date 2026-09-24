#!/bin/bash
# ⚡ AEON GOD-KERNEL DEPLOYMENT - GORUNFREE
set -e
echo ""
echo "⚡⚡⚡ AEON GOD-KERNEL DEPLOYMENT ⚡⚡⚡"
echo ""

if [ ! -f "wrangler.toml" ]; then
    echo "❌ Run from aeon-god-kernel directory"
    exit 1
fi

[ ! -d "node_modules" ] && npm install --silent

echo "🚀 Deploying GOD-KERNEL..."
npx wrangler deploy --env=""

echo ""
echo "════════════════════════════════════════════════════════════════════════════"
echo ""
echo "⚡ GOD-KERNEL DEPLOYED!"
echo ""
echo "Dashboard: https://aeon-god-kernel.workers.dev/"
echo "Quick:     https://aeon-god-kernel.workers.dev/q?q=status"
echo "Status:    https://aeon-god-kernel.workers.dev/status"
echo ""
echo "THE OMNIPOTENT IS ONLINE. BATTERY: ∞"
echo ""
