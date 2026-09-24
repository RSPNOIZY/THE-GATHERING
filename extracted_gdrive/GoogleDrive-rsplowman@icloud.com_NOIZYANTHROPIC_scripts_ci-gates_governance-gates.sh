#!/usr/bin/env bash
# NOIZY Governance CI Gates
# BLOCKS deploy if governance guarantees are not met
# Exit 0 = pass, Exit 1 = fail

set -euo pipefail

GATE_FAILED=0

echo "═══════════════════════════════════════════════════════════"
echo "NOIZY GOVERNANCE GATES"
echo "═══════════════════════════════════════════════════════════"

# ─────────────────────────────────────────────────────────────────
# GATE 1: ZK Policy Compilation
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[GATE 1] ZK Policy Compilation"

REQUIRED_POLICIES=(
  "CONSENT_ACTIVE_ON_USE"
  "REVOCATION_HONORED"
  "HASH_CHAIN_INTACT"
  "TOKEN_TIME_BOUNDED"
)

for policy in "${REQUIRED_POLICIES[@]}"; do
  if ! node scripts/edge-core/compile-zk-policies.js --check "$policy" 2>/dev/null; then
    echo "  ✗ FAIL: $policy has no compiled circuit"
    GATE_FAILED=1
  else
    echo "  ✓ PASS: $policy"
  fi
done

# ─────────────────────────────────────────────────────────────────
# GATE 2: Consent Bypass Test
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[GATE 2] Consent Bypass Prevention"

BYPASS_RESULT=$(node -e "
const { evaluatePolicy } = require('./src/edge-core/policy_registry.js');
const result = evaluatePolicy('CONSENT_ACTIVE_ON_USE', {
  consent_state: null,
  event_timestamp: new Date().toISOString()
});
console.log(result.result ? 'BYPASSED' : 'BLOCKED');
" 2>/dev/null || echo "ERROR")

if [ "$BYPASS_RESULT" = "BLOCKED" ]; then
  echo "  ✓ PASS: Null consent blocked"
else
  echo "  ✗ FAIL: Consent check bypassed with null state"
  GATE_FAILED=1
fi

# ─────────────────────────────────────────────────────────────────
# GATE 3: Revocation Enforcement
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[GATE 3] Revocation Enforcement"

REVOKE_RESULT=$(node -e "
const { evaluatePolicy } = require('./src/edge-core/policy_registry.js');
const result = evaluatePolicy('REVOCATION_HONORED', {
  revocation_timestamp: '2026-01-01T00:00:00Z',
  event_timestamp: '2026-01-02T00:00:00Z'
});
console.log(result.result ? 'ALLOWED' : 'BLOCKED');
" 2>/dev/null || echo "ERROR")

if [ "$REVOKE_RESULT" = "BLOCKED" ]; then
  echo "  ✓ PASS: Post-revocation use blocked"
else
  echo "  ✗ FAIL: Post-revocation use allowed"
  GATE_FAILED=1
fi

# ─────────────────────────────────────────────────────────────────
# GATE 4: C2PA Manifest Verification
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[GATE 4] C2PA Manifest Verification"

C2PA_RESULT=$(node -e "
const { verifyC2PAManifest } = require('./src/chaos-arena/index.js');
const validManifest = {
  claim_generator: 'NOIZY-HVS/17.0.0',
  assertions: [{ label: 'c2pa.noizy.policy_proof', data: { proof_id: 'test', policy_id: 'TEST', result: true, verified_at: new Date().toISOString() }}]
};
const result = verifyC2PAManifest(validManifest);
console.log(result.valid ? 'VALID' : 'INVALID');
" 2>/dev/null || echo "ERROR")

if [ "$C2PA_RESULT" = "VALID" ]; then
  echo "  ✓ PASS: Valid manifest verifies"
else
  echo "  ✗ FAIL: Valid manifest rejected"
  GATE_FAILED=1
fi

# ─────────────────────────────────────────────────────────────────
# GATE 5: Receipt Replay Verification
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[GATE 5] Receipt Replay Verification"

RECEIPT_RESULT=$(node -e "
const { verifyProofBundle } = require('./src/chaos-arena/index.js');
const receipt = {
  proof_id: 'test_receipt_001',
  policy_id: 'CONSENT_ACTIVE_ON_USE',
  result: true,
  verified_at: new Date().toISOString()
};
const result = verifyProofBundle(receipt);
console.log(result.valid ? 'VERIFIED' : 'FAILED');
" 2>/dev/null || echo "ERROR")

if [ "$RECEIPT_RESULT" = "VERIFIED" ]; then
  echo "  ✓ PASS: Receipt replay verified"
else
  echo "  ✗ FAIL: Receipt replay failed"
  GATE_FAILED=1
fi

# ─────────────────────────────────────────────────────────────────
# GATE 6: Append-Only Mutation Detection
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[GATE 6] Append-Only Schema Check"

TRIGGER_CHECK=$(grep -c "RAISE(ABORT" migrations/0007_chaos_arena.sql 2>/dev/null || echo "0")

if [ "$TRIGGER_CHECK" -ge "2" ]; then
  echo "  ✓ PASS: DELETE/UPDATE triggers present"
else
  echo "  ✗ FAIL: Append-only triggers missing"
  GATE_FAILED=1
fi

# ─────────────────────────────────────────────────────────────────
# GATE 7: Regulator Bundle Generation
# ─────────────────────────────────────────────────────────────────
echo ""
echo "[GATE 7] Regulator Bundle Generation"

if [ -f "scripts/edge-core/generate-compliance-bundle.js" ]; then
  echo "  ✓ PASS: Bundle generator exists"
else
  echo "  ✗ FAIL: Bundle generator missing"
  GATE_FAILED=1
fi

# ─────────────────────────────────────────────────────────────────
# FINAL RESULT
# ─────────────────────────────────────────────────────────────────
echo ""
echo "═══════════════════════════════════════════════════════════"

if [ "$GATE_FAILED" -eq 0 ]; then
  echo "ALL GATES PASSED"
  exit 0
else
  echo "GOVERNANCE GATES FAILED — DEPLOY BLOCKED"
  exit 1
fi
