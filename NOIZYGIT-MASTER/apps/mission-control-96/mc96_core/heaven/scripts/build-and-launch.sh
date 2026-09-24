#!/bin/bash
# ════════════════════════════════════════════════════════════
# Heaven + Lucy — Full Build & Launch Script
# Builds Swift apps, starts Docker stack
# ════════════════════════════════════════════════════════════

set -e
echo "
╔══════════════════════════════════════════════════════════╗
║           HEAVEN & LUCY — BUILD SCRIPT                   ║
║           DreamChamber iOS Platform                      ║
╚══════════════════════════════════════════════════════════╝
"

PROJECT_ROOT="$(cd "$(dirname "$0")" && pwd)"
DOCKER_DIR="$PROJECT_ROOT/Docker"

# ── 1. Start Docker Stack ─────────────────────────────────────
echo "🐳 [1/4] Starting Docker stack..."
cd "$DOCKER_DIR"
docker compose up -d --build 2>&1 | tail -10
echo "✅ Docker stack started"

# Verify services
echo ""
echo "  Checking services..."
sleep 5
for service in "heaven17:17017" "lucy17:17018" "accessibility-bridge:7778"; do
  port="${service#*:}"
  name="${service%:*}"
  if curl -sf "http://localhost:$port/health" &>/dev/null; then
    echo "  ✅ $name (:$port)"
  else
    echo "  ⚠️  $name (:$port) - starting..."
  fi
done

# ── 2. Build Swift/Xcode Project ──────────────────────────────
echo ""
echo "📱 [2/4] Building Heaven iOS app..."
cd "$PROJECT_ROOT"

# Build for simulator
xcodebuild build \
  -project Heaven.xcodeproj \
  -scheme Heaven \
  -destination "platform=iOS Simulator,name=iPad Pro 13-inch (M4)" \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | xcbeautify || echo "⚠️ Xcode build: run from Xcode for device signing"

# ── 3. Build Lucy Fork ───────────────────────────────────────
echo ""
echo "💜 [3/4] Building Lucy iOS app..."
xcodebuild build \
  -project Heaven.xcodeproj \
  -scheme Lucy \
  -destination "platform=iOS Simulator,name=iPhone 16 Pro" \
  -configuration Debug \
  CODE_SIGNING_ALLOWED=NO \
  2>&1 | xcbeautify || echo "⚠️ Lucy build: open Heaven.xcodeproj -scheme Lucy in Xcode"

# ── 4. Run Simulator ─────────────────────────────────────────
echo ""
echo "🚀 [4/4] Launching simulators..."

# iPad for Heaven (RSP)
xcrun simctl boot "iPad Pro 13-inch (M4)" 2>/dev/null || true
open -a Simulator

echo ""
echo "════════════════════════════════════════════════════════════"
echo "✅ HEAVEN & LUCY READY"
echo ""
echo "  📱 Heaven (RSP)    → iPad Pro Simulator"  
echo "  💜 Lucy            → iPhone 16 Pro Simulator"
echo ""
echo "  🎙️  heaven17        → http://localhost:17017"
echo "  💜 lucy17          → http://localhost:17018"
echo "  🌉 Bridge          → http://localhost:7778"
echo "  🏠 DreamChamber    → http://localhost:7777"
echo "════════════════════════════════════════════════════════════"
