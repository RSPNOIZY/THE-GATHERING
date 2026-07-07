#!/usr/bin/env bash
set -euo pipefail

echo "════════════════════════════════════════════════════════════════════════"
echo "  EDGE CORE COMPLIANCE — FULL CHECK"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "  Core Law: If the edge cannot observe itself, choose restraint,"
echo "            and roll back safely, the edge cannot be trusted."
echo ""
echo "════════════════════════════════════════════════════════════════════════"
echo ""

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FAILURES=0

# Run all checks
run_check() {
  local name="$1"
  local script="$2"

  echo "─────────────────────────────────────────────────────────────────────────"
  echo "  CHECK: $name"
  echo "─────────────────────────────────────────────────────────────────────────"
  echo ""

  if bash "$script"; then
    echo ""
  else
    echo ""
    ((FAILURES++))
  fi
}

run_check "Observability" "$SCRIPT_DIR/check-observability.sh"
run_check "Rollback Capability" "$SCRIPT_DIR/check-rollback.sh"
run_check "Canary Execution Order" "$SCRIPT_DIR/check-route-canary-order.sh"
run_check "Error Budget" "$SCRIPT_DIR/check-error-budget.sh"
run_check "DR Visibility" "$SCRIPT_DIR/check-dr.sh"

echo ""
echo "════════════════════════════════════════════════════════════════════════"

if [[ $FAILURES -gt 0 ]]; then
  echo "  ❌ EDGE CORE COMPLIANCE: FAILED ($FAILURES violations)"
  echo "════════════════════════════════════════════════════════════════════════"
  echo ""
  echo "  This change violates EDGE CORE doctrine."
  echo "  It does not ship."
  echo ""
  echo "  Reference: docs/NOIZY_EDGE_CORE.md"
  echo ""
  exit 1
fi

echo "  ✅ EDGE CORE COMPLIANCE: PASSED"
echo "════════════════════════════════════════════════════════════════════════"
echo ""
echo "  This change is EDGE CORE compliant:"
echo "    ✓ Can be observed"
echo "    ✓ Can be slowed"
echo "    ✓ Can be rolled back"
echo "    ✓ Recovery is visible"
echo ""
