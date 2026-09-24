#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# CHAOS TEST SUITE
# Deliberately breaks policies to prove gates catch violations
#
# Core Law: If a gate doesn't catch deliberate violations, it's not a gate.
#
# Usage: ./scripts/chaos-test.sh
# ═══════════════════════════════════════════════════════════════════════════

cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════════════════════════"
echo "  CHAOS TEST SUITE"
echo "  If a gate doesn't catch deliberate violations, it's not a gate."
echo "═══════════════════════════════════════════════════════════════════"
echo ""

node scripts/edge-core/chaos-test.js --all

EXIT_CODE=$?

echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$EXIT_CODE" -eq 0 ]]; then
  echo "  ✅ CHAOS TEST SUITE: All gates are enforceable"
  exit 0
else
  echo "  ❌ CHAOS TEST SUITE: Gate enforcement broken"
  exit 1
fi
