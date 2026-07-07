#!/usr/bin/env bash
set -euo pipefail

echo "🧊 NOIZY Change Freeze Gate"
echo "============================"

# Configuration
SLO="${SLO:-0.999}"
ALLOW_RELIABILITY_FIXES="${ALLOW_RELIABILITY_FIXES:-true}"
COMMIT_MSG="${COMMIT_MSG:-$(git log -1 --pretty=%B 2>/dev/null || echo '')}"

# Check if this is a reliability fix (allowed during freeze)
is_reliability_fix() {
  local msg="$1"
  if echo "$msg" | grep -qiE "(fix|hotfix|rollback|revert|reliability|security|urgent)"; then
    return 0
  fi
  return 1
}

echo "SLO: ${SLO}"
echo ""

# Run budget check
echo "Checking error budget..."
BUDGET_OUTPUT=$(node scripts/check-error-budget.js --mock 2>&1) || true
BUDGET_STATUS=$?

echo "$BUDGET_OUTPUT"
echo ""

# Extract remaining budget from output (macOS compatible)
REMAINING=$(echo "$BUDGET_OUTPUT" | grep "Remaining:" | sed 's/.*Remaining:[[:space:]]*//' | tr -d ',' || echo "0")

if [[ "$REMAINING" == "0" || "$BUDGET_STATUS" != "0" ]]; then
  echo ""
  echo "════════════════════════════════════════"
  echo "  🧊 CHANGE FREEZE ACTIVE"
  echo "════════════════════════════════════════"
  echo ""
  echo "  Error budget: EXHAUSTED"
  echo "  Normal feature deploys: BLOCKED"
  echo ""

  if [[ "$ALLOW_RELIABILITY_FIXES" == "true" ]] && is_reliability_fix "$COMMIT_MSG"; then
    echo "  ✅ Reliability fix detected — ALLOWED"
    echo "     Commit: $(echo "$COMMIT_MSG" | head -1)"
    echo ""
    exit 0
  fi

  echo "  Only the following are permitted:"
  echo "    - Rollbacks"
  echo "    - Reliability fixes"
  echo "    - Security patches"
  echo ""
  echo "  To proceed, fix reliability issues first."
  echo "════════════════════════════════════════"
  exit 1
fi

echo ""
echo "════════════════════════════════════════"
echo "  ✅ CHANGE ALLOWED"
echo "════════════════════════════════════════"
echo "  Budget remaining: ${REMAINING}"
echo "  Feature deploys: PERMITTED"
echo "════════════════════════════════════════"
exit 0
