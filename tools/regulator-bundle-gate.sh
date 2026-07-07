#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# REGULATOR BUNDLE GATE
# Blocks deploy if compliance bundles cannot be generated
#
# Core Law: If you can't prove compliance on demand, you can't claim it.
#
# Usage: ./scripts/regulator-bundle-gate.sh
# ═══════════════════════════════════════════════════════════════════════════

cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════════════════════════"
echo "  REGULATOR BUNDLE GATE"
echo "  If you can't prove compliance on demand, you can't claim it."
echo "═══════════════════════════════════════════════════════════════════"
echo ""

FAILED=0

# ───────────────────────────────────────────────────────────────────────────
# Check 1: Generate EU compliance bundle (dry-run)
# ───────────────────────────────────────────────────────────────────────────
echo "→ Generating EU compliance bundle (dry-run)..."
node scripts/edge-core/generate-compliance-bundle.js --profile eu --dry-run || FAILED=1

# ───────────────────────────────────────────────────────────────────────────
# Check 2: Generate US compliance bundle (dry-run)
# ───────────────────────────────────────────────────────────────────────────
if [[ "$FAILED" -eq 0 ]]; then
  echo ""
  echo "→ Generating US compliance bundle (dry-run)..."
  node scripts/edge-core/generate-compliance-bundle.js --profile us --dry-run || FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 3: Validate bundle schemas
# ───────────────────────────────────────────────────────────────────────────
if [[ "$FAILED" -eq 0 ]]; then
  echo ""
  echo "→ Validating bundle schemas..."
  node scripts/edge-core/validate-compliance-bundle.js --all-profiles || FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Result
# ───────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FAILED" -eq 0 ]]; then
  echo "  ✅ REGULATOR BUNDLE GATE: PASSED"
  echo ""
  echo "  Compliance bundles can be generated on demand."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ❌ REGULATOR BUNDLE GATE: FAILED"
  echo ""
  echo "  BLOCKING: Cannot generate compliance bundles."
  echo ""
  echo "  Core Law: If you can't prove compliance on demand,"
  echo "            you can't claim compliance at all."
  echo ""
  echo "  Fix the export path before deploying."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi
