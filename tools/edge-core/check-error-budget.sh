#!/usr/bin/env bash
set -euo pipefail

echo "EDGE CORE: evaluating error budget"
echo ""

# Rule: If error budget is exhausted, feature promotion is forbidden.
# Reliability fixes and rollbacks remain allowed.

# Check if budget module exists
if [[ ! -f "src/error-budget.js" ]] && [[ ! -f "src/error-budget.ts" ]]; then
  echo "❌ EDGE CORE VIOLATION: error budget module missing"
  echo "   Required: src/error-budget.js"
  exit 1
fi

if [[ ! -f "scripts/check-error-budget.js" ]]; then
  echo "❌ EDGE CORE VIOLATION: budget check script missing"
  echo "   Required: scripts/check-error-budget.js"
  exit 1
fi

echo "✅ Error budget infrastructure present"
echo ""

# Run the actual budget check
echo "Evaluating current budget status..."
BUDGET_OUTPUT=$(node scripts/check-error-budget.js --mock 2>&1) || true

# Extract remaining value (macOS compatible)
REMAINING=$(echo "$BUDGET_OUTPUT" | grep "Remaining:" | sed 's/.*Remaining:[[:space:]]*//' | tr -d ',' || echo "0")

echo "$BUDGET_OUTPUT" | tail -15
echo ""

if [[ "$REMAINING" == "0" ]] || [[ -z "$REMAINING" ]]; then
  echo "════════════════════════════════════════════════════════════════"
  echo "  🧊 CHANGE FREEZE ACTIVE — ERROR BUDGET EXHAUSTED"
  echo "════════════════════════════════════════════════════════════════"
  echo ""
  echo "  Doctrine: Error budgets are permission boundaries."
  echo "  Allowed:  Rollbacks, reliability fixes"
  echo "  Blocked:  Feature promotions"
  echo ""
  echo "  Reference: docs/NOIZY_EDGE_CORE.md § 5"
  echo ""

  # Check if this is a reliability fix (allowed during freeze)
  COMMIT_MSG="${COMMIT_MSG:-$(git log -1 --pretty=%B 2>/dev/null || echo '')}"
  if echo "$COMMIT_MSG" | grep -qiE "(fix|hotfix|rollback|revert|reliability|security)"; then
    echo "  ✅ Reliability fix detected — proceeding"
    exit 0
  fi

  exit 1
fi

echo "✅ EDGE CORE: error budget available (${REMAINING} remaining)"
