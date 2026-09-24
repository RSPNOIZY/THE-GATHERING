#!/usr/bin/env bash
# ============================================================
# PASTE THIS ENTIRE BLOCK INTO YOUR TERMINAL
# It executes go-100.sh which does everything.
# ============================================================

echo "🚀 STARTING NOIZY 100% DEPLOY..."
echo ""

# Make executable and run
chmod +x /tmp/Heaven/go-100.sh
/tmp/Heaven/go-100.sh

echo ""
echo "🏁 Deploy script complete."
echo ""
echo "Next: fix noizy.ai nameservers at your registrar."
echo "Then:  cd /tmp/Heaven && xcodegen generate && open Heaven.xcodeproj"
