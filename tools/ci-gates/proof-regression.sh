#!/usr/bin/env bash
# NOIZY Proof Regression Gate
# Detects when governance guarantees weaken over time
# Exit 0 = pass, Exit 1 = regression detected

set -euo pipefail

SNAPSHOT_DIR=".governance-snapshots"
REGRESSION_DETECTED=0

echo "═══════════════════════════════════════════════════════════"
echo "PROOF REGRESSION CHECK"
echo "═══════════════════════════════════════════════════════════"

mkdir -p "$SNAPSHOT_DIR"

# ─────────────────────────────────────────────────────────────────
# CHECK 1: Required Policy Downgrade
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[CHECK 1] Policy Requirement Regression"

CURRENT_POLICIES=$(node -e "
const { POLICIES } = require('./src/edge-core/policy_registry.js');
const required = Object.entries(POLICIES)
  .filter(([k,v]) => v.verification_mode === 'zk')
  .map(([k]) => k)
  .sort()
  .join('\n');
console.log(required);
" 2>/dev/null || echo "")

SNAPSHOT_FILE="$SNAPSHOT_DIR/required_policies.txt"

if [ -f "$SNAPSHOT_FILE" ]; then
  PREVIOUS_POLICIES=$(cat "$SNAPSHOT_FILE")

  # Check for removed policies
  while IFS= read -r policy; do
    if ! echo "$CURRENT_POLICIES" | grep -q "^$policy$"; then
      echo "  ✗ REGRESSION: Required policy '$policy' was removed"
      REGRESSION_DETECTED=1
    fi
  done <<< "$PREVIOUS_POLICIES"

  if [ "$REGRESSION_DETECTED" -eq 0 ]; then
    echo "  ✓ PASS: No policy downgrades"
  fi
else
  echo "  ℹ No previous snapshot — creating baseline"
fi

echo "$CURRENT_POLICIES" > "$SNAPSHOT_FILE"

# ─────────────────────────────────────────────────────────────────
# CHECK 2: Proof Format Version
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[CHECK 2] Proof Format Version"

CURRENT_VERSION=$(grep -o '"version": "[0-9.]*"' src/edge-core/c2pa_proof_export.js 2>/dev/null | head -1 | grep -o '[0-9.]*' || echo "unknown")
VERSION_FILE="$SNAPSHOT_DIR/proof_version.txt"

if [ -f "$VERSION_FILE" ]; then
  PREVIOUS_VERSION=$(cat "$VERSION_FILE")

  if [ "$CURRENT_VERSION" != "$PREVIOUS_VERSION" ]; then
    echo "  ⚠ VERSION CHANGE: $PREVIOUS_VERSION → $CURRENT_VERSION"
    # Not a regression if version increased
    if [ "$CURRENT_VERSION" \< "$PREVIOUS_VERSION" ]; then
      echo "  ✗ REGRESSION: Proof version downgraded"
      REGRESSION_DETECTED=1
    else
      echo "  ✓ PASS: Version increment detected"
    fi
  else
    echo "  ✓ PASS: Proof format unchanged"
  fi
else
  echo "  ℹ No previous snapshot — creating baseline"
fi

echo "$CURRENT_VERSION" > "$VERSION_FILE"

# ─────────────────────────────────────────────────────────────────
# CHECK 3: Verification Independence
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[CHECK 3] Independent Verification"

VERIFY_RESULT=$(node -e "
const { verifyProofBundle } = require('./src/chaos-arena/index.js');

// Test with minimal data (no NOIZY infrastructure access)
const proof = {
  proof_id: 'independent_test',
  policy_id: 'CONSENT_ACTIVE_ON_USE',
  result: true,
  verified_at: '2026-04-07T00:00:00Z'
};

const result = verifyProofBundle(proof);

// Should verify without external calls
if (result.valid && result.checks.length > 0) {
  console.log('INDEPENDENT');
} else {
  console.log('DEPENDENT');
}
" 2>/dev/null || echo "ERROR")

if [ "$VERIFY_RESULT" = "INDEPENDENT" ]; then
  echo "  ✓ PASS: Verification works independently"
else
  echo "  ✗ REGRESSION: Verification requires infrastructure access"
  REGRESSION_DETECTED=1
fi

# ─────────────────────────────────────────────────────────────────
# CHECK 4: Failure Mode Strictness
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[CHECK 4] Fail-Closed Behavior"

FAIL_CLOSED=$(node -e "
const { evaluatePolicy } = require('./src/edge-core/policy_registry.js');

// Test with missing data — should fail closed
try {
  const result = evaluatePolicy('CONSENT_ACTIVE_ON_USE', {});
  console.log(result.result ? 'FAIL_OPEN' : 'FAIL_CLOSED');
} catch (e) {
  console.log('FAIL_CLOSED');
}
" 2>/dev/null || echo "ERROR")

if [ "$FAIL_CLOSED" = "FAIL_CLOSED" ]; then
  echo "  ✓ PASS: System fails closed"
else
  echo "  ✗ REGRESSION: System fails open with missing data"
  REGRESSION_DETECTED=1
fi

# ─────────────────────────────────────────────────────────────────
# FINAL RESULT
# ─────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"

if [ "$REGRESSION_DETECTED" -eq 0 ]; then
  echo "NO REGRESSIONS DETECTED"
  exit 0
else
  echo "PROOF REGRESSION DETECTED — DEPLOY BLOCKED"
  exit 1
fi
