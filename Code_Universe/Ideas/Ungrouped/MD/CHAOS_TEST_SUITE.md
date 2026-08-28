# CHAOS_TEST_SUITE.md

## Purpose

This suite **deliberately breaks policies** to prove the gates catch violations.

The idea is simple: if a gate can't catch an intentional violation, it won't catch an accidental one.

---

## Core Law

> **If a gate doesn't catch deliberate violations, it's not a gate.**

Enforcement must be proven, not assumed.

---

## Test Coverage

### 1. Policy Violation Detection

**What it breaks:** Each ZK policy with intentionally invalid data.

**What it proves:** Policy evaluation correctly returns `false` for violations.

| Policy | Violation Vector | Expected Result |
|--------|-----------------|-----------------|
| CONSENT_ACTIVE_ON_USE | Revoked consent state | `false` |
| REVOCATION_HONORED | Usage after revocation | `false` |
| PROMOTION_WINDOW_MET | Window too short | `false` |
| AUDIT_BEFORE_AUTHORITY | Authority without audit | `false` |
| HUMAN_APPROVAL_REQUIRED | SYSTEM approved governance | `false` |
| FREEZE_PROPERLY_RESOLVED | Missing resolution notes | `false` |
| TOKEN_TIME_BOUNDED | TTL too long | `false` |
| HASH_CHAIN_INTACT | Hash mismatch | `false` |

### 2. Hash Chain Break Detection

**What it breaks:** Inserts a wrong `prev_hash` in the chain.

**What it proves:** Chain verification detects discontinuities.

### 3. Missing Audit Detection

**What it breaks:** Removes the D1 binding and table.

**What it proves:** `assertAuditReady` throws before any request proceeds.

### 4. Merkle Root Tampering Detection

**What it breaks:** Changes one event hash and recomputes root.

**What it proves:** Merkle root changes detectably when any leaf changes.

### 5. Time-Travel Tampering Detection

**What it breaks:** Decreases event count below anchored value.

**What it proves:** Historical state verification catches count regression.

### 6. Incomplete Compliance Bundle Detection

**What it breaks:** Removes required artifacts from bundle.

**What it proves:** Bundle validation rejects incomplete exports.

---

## Usage

### Run all tests

```bash
./scripts/chaos-test.sh
```

### Run specific test

```bash
node scripts/edge-core/chaos-test.js --test policy-violation
node scripts/edge-core/chaos-test.js --test hash-chain-break
node scripts/edge-core/chaos-test.js --test missing-audit
node scripts/edge-core/chaos-test.js --test merkle-tamper
node scripts/edge-core/chaos-test.js --test time-travel-tamper
node scripts/edge-core/chaos-test.js --test compliance-incomplete
```

---

## CI Integration

The chaos test runs in CI after the Policy Compiler Gate:

```yaml
chaos-test:
  name: Chaos Test Suite
  runs-on: ubuntu-latest
  needs: [policy-compiler-gate]
  steps:
    - uses: actions/checkout@v4
    - uses: actions/setup-node@v4
    - name: Run chaos tests
      run: node scripts/edge-core/chaos-test.js --all
```

---

## Interpreting Results

### Pass (✅)

```
  ✅ CHAOS TEST SUITE: PASSED

  All gates correctly caught deliberate violations.
  Enforcement is working as designed.
```

The gates are doing their job.

### Fail (❌)

```
  ❌ CHAOS TEST SUITE: FAILED

  One or more gates failed to catch deliberate violations.
  This means the enforcement is broken.
```

**Action required:**

1. Identify which test failed
2. Fix the gate logic
3. Re-run until all tests pass
4. Do not deploy until chaos tests pass

---

## Adding New Chaos Tests

To add a new test, add an entry to `CHAOS_TESTS` in `chaos-test.js`:

```javascript
'my-new-test': {
  name: 'My New Test',
  description: 'What it proves',
  run: async () => {
    // Deliberately break something
    // Verify the gate catches it
    // Return true if caught, false if not
    return true;
  }
}
```

---

## Philosophy

Traditional testing asks: "Does it work when used correctly?"

Chaos testing asks: "Does it fail when used incorrectly?"

Both are necessary. A system that only tests happy paths is not actually tested.

---

## Final Statement

Trust is earned by proving enforcement.

If a gate can be bypassed, it will be bypassed.

**If a gate doesn't catch deliberate violations, it's not a gate.**

---

*This suite exists because "it should work" is not the same as "we proved it works."*
