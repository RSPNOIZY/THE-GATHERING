# POLICY_COMPILER_GATE.md

## Purpose

This gate ensures that **no ZK-verifiable policy ships unless its circuit compiles and produces valid proofs**.

The gate covers four things:

1. Policy syntax validation
2. Circuit compilation check
3. Proof generation test
4. Verification roundtrip

Policy definitions are code. Code that doesn't compile doesn't ship.

---

## Core Law

> **If a policy cannot produce a valid proof, it cannot be enforced.**

Policy compilation is a deploy prerequisite, not a runtime hope.

---

## Scope

This gate applies to:

- All policies in `src/edge-core/policy_registry.js` marked with `verification_mode: 'zk'`
- All policies in `POLICY_LANGUAGE_SPEC.md` marked ZK-verifiable
- Any new policy added to the system that claims ZK provability

---

## 1. Policy Syntax Validation

### Goal

Verify that every policy definition in the registry is syntactically valid and complete.

### Required fields per policy

```javascript
{
  id: string,           // Unique identifier
  version: string,      // Semantic version
  scope: string,        // 'audit_event' | 'consent_token' | 'promotion' | 'freeze'
  description: string,  // Human-readable description
  verification_mode: string,  // 'zk' | 'reportable' | 'hybrid'
  inputs: string[],     // Required input fields
  evaluate: function    // Deterministic boolean function
}
```

### Validation check

```javascript
function validatePolicySyntax(policy) {
  const required = ['id', 'version', 'scope', 'description', 'verification_mode', 'inputs', 'evaluate'];
  for (const field of required) {
    if (!policy[field]) {
      throw new Error(`Policy ${policy.id || 'unknown'} missing required field: ${field}`);
    }
  }
  if (typeof policy.evaluate !== 'function') {
    throw new Error(`Policy ${policy.id} evaluate must be a function`);
  }
  if (!Array.isArray(policy.inputs) || policy.inputs.length === 0) {
    throw new Error(`Policy ${policy.id} must declare at least one input`);
  }
}
```

### Fail condition

If any policy fails syntax validation, deploy is blocked.

---

## 2. Circuit Compilation Check

### Goal

Verify that every ZK-verifiable policy can be compiled to a circuit.

### ZK-verifiable policies (from POLICY_VERIFICATION_MATRIX.md)

| Policy ID | Verification Mode |
|-----------|------------------|
| CONSENT_ACTIVE_ON_USE | zk |
| REVOCATION_HONORED | zk |
| PROMOTION_WINDOW_MET | zk |
| AUDIT_BEFORE_AUTHORITY | zk |
| HUMAN_APPROVAL_REQUIRED | zk |
| FREEZE_PROPERLY_RESOLVED | zk |
| TOKEN_TIME_BOUNDED | zk |
| HASH_CHAIN_INTACT | zk |

### Compilation check

For each ZK policy, the compiler must:

1. Parse the `evaluate` function
2. Extract input constraints
3. Generate circuit representation
4. Report any unsupported operations

### Unsupported operations in ZK circuits

- Network calls (fetch, HTTP)
- Non-deterministic functions (Math.random, Date.now without witness)
- Unbounded loops
- String operations beyond comparison

### Compilation command

```bash
node scripts/edge-core/compile-zk-policies.js --check
```

### Expected output

```
Compiling ZK policies...
  CONSENT_ACTIVE_ON_USE: compiled (2 constraints)
  REVOCATION_HONORED: compiled (2 constraints)
  PROMOTION_WINDOW_MET: compiled (1 constraint)
  AUDIT_BEFORE_AUTHORITY: compiled (2 constraints)
  HUMAN_APPROVAL_REQUIRED: compiled (3 constraints)
  FREEZE_PROPERLY_RESOLVED: compiled (3 constraints)
  TOKEN_TIME_BOUNDED: compiled (2 constraints)
  HASH_CHAIN_INTACT: compiled (2 constraints)
All 8 ZK policies compiled successfully.
```

### Fail condition

If any ZK policy fails to compile, deploy is blocked.

---

## 3. Proof Generation Test

### Goal

Verify that each compiled policy can generate a valid proof given test data.

### Test data per policy

```javascript
const TEST_VECTORS = {
  CONSENT_ACTIVE_ON_USE: {
    input: {
      consent_state: 'CLEARED',
      revocation_timestamp: null,
      event_timestamp: '2026-04-07T12:00:00Z'
    },
    expected: true
  },
  REVOCATION_HONORED: {
    input: {
      revocation_timestamp: '2026-04-07T12:00:00Z',
      last_use_timestamp: '2026-04-07T11:00:00Z'
    },
    expected: true
  },
  PROMOTION_WINDOW_MET: {
    input: {
      stability_window_minutes: 20,
      required_window: 15
    },
    expected: true
  },
  AUDIT_BEFORE_AUTHORITY: {
    input: {
      audit_write_success: true,
      authority_granted: true
    },
    expected: true
  },
  HUMAN_APPROVAL_REQUIRED: {
    input: {
      operator_email: 'rsp@noizy.ai',
      action: 'GOVERNANCE_VOTE'
    },
    expected: true
  },
  FREEZE_PROPERLY_RESOLVED: {
    input: {
      resolved: true,
      resolution_notes: 'Investigated and cleared by operator RSP_001',
      resolved_by: 'rsp@noizy.ai'
    },
    expected: true
  },
  TOKEN_TIME_BOUNDED: {
    input: {
      created_at: '2026-04-07T12:00:00Z',
      expires_at: '2026-04-07T12:30:00Z'
    },
    expected: true
  },
  HASH_CHAIN_INTACT: {
    input: {
      computed_hash: 'abc123',
      stored_hash: 'abc123',
      prev_hash_matches: true
    },
    expected: true
  }
};
```

### Proof generation command

```bash
node scripts/edge-core/compile-zk-policies.js --prove
```

### Expected output

```
Generating test proofs...
  CONSENT_ACTIVE_ON_USE: proof generated (1.2ms)
  REVOCATION_HONORED: proof generated (0.8ms)
  PROMOTION_WINDOW_MET: proof generated (0.5ms)
  AUDIT_BEFORE_AUTHORITY: proof generated (0.7ms)
  HUMAN_APPROVAL_REQUIRED: proof generated (1.1ms)
  FREEZE_PROPERLY_RESOLVED: proof generated (0.9ms)
  TOKEN_TIME_BOUNDED: proof generated (0.6ms)
  HASH_CHAIN_INTACT: proof generated (0.8ms)
All 8 proofs generated successfully.
```

### Fail condition

If any policy cannot generate a proof from valid test data, deploy is blocked.

---

## 4. Verification Roundtrip

### Goal

Prove that each generated proof can be verified.

### Verification roundtrip

For each policy:

1. Compile policy to circuit
2. Generate proof from test vector
3. Verify proof
4. Assert verification passes

### Verification command

```bash
node scripts/edge-core/compile-zk-policies.js --verify
```

### Expected output

```
Verifying proof roundtrips...
  CONSENT_ACTIVE_ON_USE: proof verified (0.3ms)
  REVOCATION_HONORED: proof verified (0.2ms)
  PROMOTION_WINDOW_MET: proof verified (0.1ms)
  AUDIT_BEFORE_AUTHORITY: proof verified (0.2ms)
  HUMAN_APPROVAL_REQUIRED: proof verified (0.3ms)
  FREEZE_PROPERLY_RESOLVED: proof verified (0.2ms)
  TOKEN_TIME_BOUNDED: proof verified (0.1ms)
  HASH_CHAIN_INTACT: proof verified (0.2ms)
All 8 proof roundtrips verified.
```

### Fail condition

If any proof fails verification, deploy is blocked.

---

## CI Integration

### GitHub Actions job

```yaml
policy-compiler-gate:
  name: Policy Compiler Gate
  runs-on: ubuntu-latest
  needs: [constitutional-check]

  steps:
    - uses: actions/checkout@v4

    - uses: actions/setup-node@v4
      with:
        node-version: '20'

    - name: Install dependencies
      working-directory: src/edge-core
      run: npm ci

    - name: Validate policy syntax
      run: node scripts/edge-core/compile-zk-policies.js --check-syntax

    - name: Compile ZK circuits
      run: node scripts/edge-core/compile-zk-policies.js --compile

    - name: Generate test proofs
      run: node scripts/edge-core/compile-zk-policies.js --prove

    - name: Verify proof roundtrips
      run: node scripts/edge-core/compile-zk-policies.js --verify

    - name: Gate passed
      run: |
        echo "═══════════════════════════════════════════════════════════════════"
        echo "  POLICY COMPILER GATE PASSED"
        echo "  All ZK policies compile, prove, and verify."
        echo "═══════════════════════════════════════════════════════════════════"
```

### Job dependencies

```yaml
build-node:
  needs: [constitutional-check, audit-readiness-gate, policy-compiler-gate]
```

---

## Local Gate Script

```bash
#!/usr/bin/env bash
set -euo pipefail

echo "═══════════════════════════════════════════════════════════════════"
echo "  POLICY COMPILER GATE"
echo "  If a policy cannot produce a valid proof, it cannot be enforced."
echo "═══════════════════════════════════════════════════════════════════"
echo ""

FAILED=0

echo "→ Validating policy syntax..."
node scripts/edge-core/compile-zk-policies.js --check-syntax || FAILED=1

if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Compiling ZK circuits..."
  node scripts/edge-core/compile-zk-policies.js --compile || FAILED=1
fi

if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Generating test proofs..."
  node scripts/edge-core/compile-zk-policies.js --prove || FAILED=1
fi

if [[ "$FAILED" -eq 0 ]]; then
  echo "→ Verifying proof roundtrips..."
  node scripts/edge-core/compile-zk-policies.js --verify || FAILED=1
fi

echo ""
echo "═══════════════════════════════════════════════════════════════════"

if [[ "$FAILED" -eq 0 ]]; then
  echo "  POLICY COMPILER GATE: PASSED"
  echo ""
  echo "  All ZK policies are enforceable."
  echo "═══════════════════════════════════════════════════════════════════"
  exit 0
else
  echo "  POLICY COMPILER GATE: FAILED"
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
```

---

## Human Review Checklist

Before approving deploy, reviewer must confirm:

- [ ] All policies in registry have required fields
- [ ] All ZK policies compile to circuits
- [ ] All test vectors pass proof generation
- [ ] All proofs pass verification roundtrip
- [ ] No unsupported operations in ZK policies
- [ ] CI gate is active and passing

---

## Relationship to Other Gates

| Gate | When | What |
|------|------|------|
| AUDIT_READINESS_GATE | Deploy prerequisite | Audit infrastructure ready |
| POLICY_COMPILER_GATE | Deploy prerequisite | Policies compile and prove |
| Constitutional Check | Deploy prerequisite | Never Clauses present |
| Error Budget Gate | Production deploy | Error rate acceptable |

### Dependency chain

```
constitutional-check
        ↓
audit-readiness-gate  ───→  build-node / build-python
        ↓
policy-compiler-gate
```

---

## Enforcement Summary

### Deploy allowed only when:

- All policy definitions are syntactically valid
- All ZK policies compile to circuits
- All policies generate valid test proofs
- All proofs verify successfully
- CI gate passes

### Deploy blocked when:

- Any policy missing required fields
- Any ZK policy contains unsupported operations
- Any circuit fails to compile
- Any proof fails to generate
- Any proof fails to verify

---

## Final Statement

Policy enforcement without proof generation is theater.

If a policy claims ZK verifiability, it must prove it — at compile time, not runtime hope.

**If a policy cannot produce a valid proof, it cannot be enforced.**

---

*This gate is grounded in the principle that ZK-proofs are only valuable if they can actually be generated. A policy that claims verifiability but cannot compile is worse than a policy that makes no claim at all — it creates false assurance.*
