#!/usr/bin/env bash
# NOIZY KERNEL — build & install on MICHAEL (2012 Mac Pro, Intel x86-64)
# Target: /Users/m2ultra/NOIZYANTHROPIC/dreamchamber  (adjust if MICHAEL differs)
# RSP_001 | Verified cross-compile target: darwin/amd64, CGO disabled (static).
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$HERE"

echo "🦈 [MICHAEL] Building NOIZY core engine"

# Confirm Go is present
if ! command -v go >/dev/null 2>&1; then
  echo "❌ Go not found. Install with: brew install go   (or from go.dev/dl)"
  exit 1
fi

echo "── Go: $(go version)"

# Module is already pinned (go.mod + go.sum committed). Just verify + build.
go mod verify
go vet ./...

# Static build for this Intel Mac. CGO off = no dependency on the 2012 box's
# aging system libraries — the binary is self-contained.
GOOS=darwin GOARCH=amd64 CGO_ENABLED=0 go build -trimpath -o noizy-core-engine main.go

echo "✅ Built: $HERE/noizy-core-engine"
file noizy-core-engine || true

echo ""
echo "Run it foreground:   ./noizy-core-engine"
echo "Install as service:  ./install-launchd.sh"
