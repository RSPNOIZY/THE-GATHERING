#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# D1 TIME-TRAVEL AUDIT GATE
# Blocks deploy if audit history integrity is compromised
#
# Core Law: What was recorded then must match what we can prove now.
#
# Usage: ./scripts/time-travel-audit-gate.sh
# ═══════════════════════════════════════════════════════════════════════════

cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════════════════════════"
echo "  D1 TIME-TRAVEL AUDIT GATE"
echo "  What was recorded then must match what we can prove now."
echo "═══════════════════════════════════════════════════════════════════"
echo ""

FAILED=0

# ───────────────────────────────────────────────────────────────────────────
# Check 1: Verify hash chain continuity
# ───────────────────────────────────────────────────────────────────────────
echo "→ Verifying hash chain continuity..."
node scripts/edge-core/verify-time-travel.js --hash-chain || FAILED=1

# ───────────────────────────────────────────────────────────────────────────
# Check 2: Verify anchor consistency
# ───────────────────────────────────────────────────────────────────────────
if [[ "$FAILED" -eq 0 ]]; then
  echo ""
  echo "→ Verifying anchor consistency..."
  node scripts/edge-core/verify-time-travel.js --anchors || FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 3: Run tamper detection
# ───────────────────────────────────────────────────────────────────────────
if [[ "$FAILED" -eq 0 ]]; then
  echo ""
  echo "→ Running tamper detection..."
  node scripts/edge-core/verify-time-travel.js --tamper-check || FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Result
# ───────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FAILED" -eq 0 ]]; then
  echo "  ✅ D1 TIME-TRAVEL AUDIT GATE: PASSED"
  echo ""
  echo "  Audit history is intact and verifiable."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ❌ D1 TIME-TRAVEL AUDIT GATE: FAILED"
  echo ""
  echo "  BLOCKING: Audit integrity compromised."
  echo ""
  echo "  Core Law: What was recorded then must match"
  echo "            what we can prove now."
  echo ""
  echo "  Investigate chain breaks before proceeding."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi
