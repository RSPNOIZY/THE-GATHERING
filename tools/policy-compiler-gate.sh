#!/usr/bin/env bash
set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# POLICY COMPILER GATE
# Blocks deploy if ZK policies cannot compile, prove, and verify
#
# Core Law: If a policy cannot produce a valid proof, it cannot be enforced.
#
# Usage: ./scripts/policy-compiler-gate.sh
# ═══════════════════════════════════════════════════════════════════════════

cd "$(dirname "$0")/.."

echo "═══════════════════════════════════════════════════════════════════"
echo "  POLICY COMPILER GATE"
echo "  If a policy cannot produce a valid proof, it cannot be enforced."
echo "═══════════════════════════════════════════════════════════════════"
echo ""

FAILED=0

# ───────────────────────────────────────────────────────────────────────────
# Check 1: Policy registry exists
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking policy registry exists..."

if [[ -f "src/edge-core/policy_registry.js" ]]; then
  echo "  ✓ policy_registry.js exists"
else
  echo "  ❌ policy_registry.js MISSING"
  FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 2: Compile script exists
# ───────────────────────────────────────────────────────────────────────────
echo "→ Checking compile script exists..."

if [[ -f "scripts/edge-core/compile-zk-policies.js" ]]; then
  echo "  ✓ compile-zk-policies.js exists"
else
  echo "  ❌ compile-zk-policies.js MISSING"
  FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Check 3: Run full compilation gate
# ───────────────────────────────────────────────────────────────────────────
if [[ "$FAILED" -eq 0 ]]; then
  echo ""
  echo "→ Running policy compilation gate..."
  echo ""

  node scripts/edge-core/compile-zk-policies.js --all || FAILED=1
fi

# ───────────────────────────────────────────────────────────────────────────
# Result
# ───────────────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FAILED" -eq 0 ]]; then
  echo "  ✅ POLICY COMPILER GATE: PASSED"
  echo ""
  echo "  All ZK policies are enforceable."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  ❌ POLICY COMPILER GATE: FAILED"
  echo ""
  echo "  BLOCKING: Deploy must not proceed until all policies compile."
  echo ""
  echo "  Core Law: If a policy cannot produce a valid proof,"
  echo "            it cannot be enforced."
  echo ""
  echo "  Fix the policy issues above and re-run this gate."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 1
fi
