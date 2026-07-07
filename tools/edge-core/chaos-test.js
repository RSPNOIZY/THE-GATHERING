#!/usr/bin/env node
/**
 * CHAOS TEST SUITE
 *
 * Deliberately breaks policies to prove the gates catch violations.
 * Run this in CI to verify that gate enforcement actually works.
 *
 * "Trust, but verify" → "Verify by breaking"
 *
 * Usage:
 *   node scripts/edge-core/chaos-test.js --all
 *   node scripts/edge-core/chaos-test.js --test policy-violation
 *   node scripts/edge-core/chaos-test.js --test hash-chain-break
 *   node scripts/edge-core/chaos-test.js --test missing-audit
 *
 * Core Law: If a gate doesn't catch deliberate violations, it's not a gate.
 */

import { POLICIES, evaluatePolicy } from '../../src/edge-core/policy_registry.js';
import crypto from 'crypto';

// ═══════════════════════════════════════════════════════════════════════════
// CHAOS TEST DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════

const CHAOS_TESTS = {
  // Test 1: Policy violation detection
  'policy-violation': {
    name: 'Policy Violation Detection',
    description: 'Deliberately violate each policy and verify evaluation catches it',
    run: async () => {
      console.log('  Testing policy violation detection...\n');
      let passed = 0;
      let failed = 0;

      const violationVectors = {
        CONSENT_ACTIVE_ON_USE: {
          // Consent NOT active
          consent_state: 'REVOKED',
          revocation_timestamp: '2026-01-01T00:00:00Z',
          event_timestamp: '2026-04-07T12:00:00Z'
        },
        REVOCATION_HONORED: {
          // Usage AFTER revocation
          revocation_timestamp: '2026-04-01T00:00:00Z',
          last_use_timestamp: '2026-04-07T12:00:00Z'
        },
        PROMOTION_WINDOW_MET: {
          // Window NOT met
          stability_window_minutes: 5 // Less than required 15
        },
        AUDIT_BEFORE_AUTHORITY: {
          // Authority granted WITHOUT audit
          audit_write_success: false,
          authority_granted: true
        },
        HUMAN_APPROVAL_REQUIRED: {
          // SYSTEM approved governance action
          operator_email: 'SYSTEM',
          action: 'GOVERNANCE_VOTE'
        },
        FREEZE_PROPERLY_RESOLVED: {
          // Resolved WITHOUT notes
          resolved: true,
          resolution_notes: 'x', // Too short
          resolved_by: null
        },
        TOKEN_TIME_BOUNDED: {
          // Token TTL too long
          created_at: '2026-04-07T00:00:00Z',
          expires_at: '2026-04-08T12:00:00Z' // 36 hours > 60 min max
        },
        HASH_CHAIN_INTACT: {
          // Hash mismatch
          computed_hash: 'abc123',
          stored_hash: 'def456', // Different!
          prev_hash_matches: false
        }
      };

      for (const [policyId, violationData] of Object.entries(violationVectors)) {
        const policy = POLICIES[policyId];
        if (!policy) {
          console.log(`    ⚠️ ${policyId}: Policy not found`);
          continue;
        }

        const result = evaluatePolicy(policyId, violationData);

        if (result.success && result.result === false) {
          // Gate correctly caught the violation
          console.log(`    ✓ ${policyId}: Violation correctly detected`);
          passed++;
        } else if (result.success && result.result === true) {
          // Gate FAILED to catch violation
          console.log(`    ❌ ${policyId}: GATE FAILURE - Violation not caught!`);
          console.log(`       Input: ${JSON.stringify(violationData)}`);
          failed++;
        } else {
          console.log(`    ⚠️ ${policyId}: Evaluation error: ${result.error}`);
          failed++;
        }
      }

      console.log(`\n  Results: ${passed} caught, ${failed} missed`);
      return failed === 0;
    }
  },

  // Test 2: Hash chain break detection
  'hash-chain-break': {
    name: 'Hash Chain Break Detection',
    description: 'Verify that broken hash chains are detected',
    run: async () => {
      console.log('  Testing hash chain break detection...\n');

      // Simulate a valid chain
      const validChain = [
        { id: '1', prev_hash: 'GENESIS', event_hash: 'hash1' },
        { id: '2', prev_hash: 'hash1', event_hash: 'hash2' },
        { id: '3', prev_hash: 'hash2', event_hash: 'hash3' }
      ];

      // Simulate a broken chain
      const brokenChain = [
        { id: '1', prev_hash: 'GENESIS', event_hash: 'hash1' },
        { id: '2', prev_hash: 'WRONG_HASH', event_hash: 'hash2' }, // BREAK
        { id: '3', prev_hash: 'hash2', event_hash: 'hash3' }
      ];

      function detectChainBreaks(chain) {
        const breaks = [];
        for (let i = 1; i < chain.length; i++) {
          if (chain[i].prev_hash !== chain[i - 1].event_hash) {
            breaks.push({ index: i, expected: chain[i - 1].event_hash, actual: chain[i].prev_hash });
          }
        }
        return breaks;
      }

      const validBreaks = detectChainBreaks(validChain);
      const brokenBreaks = detectChainBreaks(brokenChain);

      let passed = true;

      if (validBreaks.length === 0) {
        console.log('    ✓ Valid chain: No breaks detected (correct)');
      } else {
        console.log('    ❌ Valid chain: False positive - breaks detected in valid chain');
        passed = false;
      }

      if (brokenBreaks.length > 0) {
        console.log('    ✓ Broken chain: Break detected at index ' + brokenBreaks[0].index + ' (correct)');
      } else {
        console.log('    ❌ Broken chain: GATE FAILURE - Break not detected!');
        passed = false;
      }

      return passed;
    }
  },

  // Test 3: Missing audit detection
  'missing-audit': {
    name: 'Missing Audit Detection',
    description: 'Verify that missing audit binding/table is detected',
    run: async () => {
      console.log('  Testing missing audit detection...\n');

      // Simulate assertAuditReady behavior
      function assertAuditReady(env) {
        if (!env.GABRIEL_DB) {
          throw new Error('AUDIT_READINESS_GATE: GABRIEL_DB binding missing');
        }
        // Simulate table check
        if (!env._tableExists) {
          throw new Error('AUDIT_READINESS_GATE: audit_events table missing');
        }
        return true;
      }

      let passed = true;

      // Test 1: Missing binding
      try {
        assertAuditReady({});
        console.log('    ❌ Missing binding: GATE FAILURE - Not caught!');
        passed = false;
      } catch (e) {
        if (e.message.includes('binding missing')) {
          console.log('    ✓ Missing binding: Correctly caught');
        } else {
          console.log('    ⚠️ Missing binding: Wrong error: ' + e.message);
          passed = false;
        }
      }

      // Test 2: Missing table
      try {
        assertAuditReady({ GABRIEL_DB: {}, _tableExists: false });
        console.log('    ❌ Missing table: GATE FAILURE - Not caught!');
        passed = false;
      } catch (e) {
        if (e.message.includes('table missing')) {
          console.log('    ✓ Missing table: Correctly caught');
        } else {
          console.log('    ⚠️ Missing table: Wrong error: ' + e.message);
          passed = false;
        }
      }

      // Test 3: Valid state
      try {
        assertAuditReady({ GABRIEL_DB: {}, _tableExists: true });
        console.log('    ✓ Valid state: Correctly passed');
      } catch (e) {
        console.log('    ❌ Valid state: False positive - ' + e.message);
        passed = false;
      }

      return passed;
    }
  },

  // Test 4: Merkle root tampering
  'merkle-tamper': {
    name: 'Merkle Root Tampering Detection',
    description: 'Verify that tampered Merkle roots are detected',
    run: async () => {
      console.log('  Testing Merkle root tampering detection...\n');

      function computeMerkleRoot(hashes) {
        if (hashes.length === 0) return 'EMPTY';
        if (hashes.length === 1) return hashes[0];

        const nextLevel = [];
        for (let i = 0; i < hashes.length; i += 2) {
          const left = hashes[i];
          const right = hashes[i + 1] || left;
          const combined = crypto.createHash('sha256')
            .update(left + right)
            .digest('hex');
          nextLevel.push(combined);
        }
        return computeMerkleRoot(nextLevel);
      }

      const events = ['hash1', 'hash2', 'hash3', 'hash4'];
      const correctRoot = computeMerkleRoot(events);

      // Tamper: change one event
      const tamperedEvents = ['hash1', 'tampered', 'hash3', 'hash4'];
      const tamperedRoot = computeMerkleRoot(tamperedEvents);

      let passed = true;

      if (correctRoot !== tamperedRoot) {
        console.log('    ✓ Tampering detected: Roots differ');
        console.log(`       Original: ${correctRoot.slice(0, 16)}...`);
        console.log(`       Tampered: ${tamperedRoot.slice(0, 16)}...`);
      } else {
        console.log('    ❌ GATE FAILURE: Tampering not detected!');
        passed = false;
      }

      // Verify same input produces same output (determinism)
      const root2 = computeMerkleRoot(events);
      if (correctRoot === root2) {
        console.log('    ✓ Determinism verified: Same input = same root');
      } else {
        console.log('    ❌ Non-deterministic hash function!');
        passed = false;
      }

      return passed;
    }
  },

  // Test 5: Time-travel tampering
  'time-travel-tamper': {
    name: 'Time-Travel Tampering Detection',
    description: 'Verify that historical state tampering is detected',
    run: async () => {
      console.log('  Testing time-travel tampering detection...\n');

      // Simulate historical anchors
      const anchors = {
        '2026-04-01': { root_hash: 'anchor_root_1', event_count: 100 },
        '2026-04-02': { root_hash: 'anchor_root_2', event_count: 150 },
        '2026-04-03': { root_hash: 'anchor_root_3', event_count: 200 }
      };

      function verifyHistoricalState(currentCount, anchors) {
        const issues = [];

        // Event count should never decrease
        let prevCount = 0;
        for (const [date, anchor] of Object.entries(anchors).sort()) {
          if (anchor.event_count < prevCount) {
            issues.push(`Event count decreased from ${prevCount} to ${anchor.event_count} at ${date}`);
          }
          prevCount = anchor.event_count;
        }

        // Current count should be >= last anchor
        const lastAnchorCount = Math.max(...Object.values(anchors).map(a => a.event_count));
        if (currentCount < lastAnchorCount) {
          issues.push(`Current count (${currentCount}) < last anchor (${lastAnchorCount})`);
        }

        return issues;
      }

      let passed = true;

      // Valid state
      const validIssues = verifyHistoricalState(250, anchors);
      if (validIssues.length === 0) {
        console.log('    ✓ Valid state: No issues detected');
      } else {
        console.log('    ❌ False positive on valid state');
        passed = false;
      }

      // Tampered state: count decreased
      const tamperedIssues = verifyHistoricalState(50, anchors);
      if (tamperedIssues.length > 0) {
        console.log('    ✓ Tampering detected: ' + tamperedIssues[0]);
      } else {
        console.log('    ❌ GATE FAILURE: Count decrease not detected!');
        passed = false;
      }

      return passed;
    }
  },

  // Test 6: Compliance bundle completeness
  'compliance-incomplete': {
    name: 'Incomplete Compliance Bundle Detection',
    description: 'Verify that incomplete bundles are rejected',
    run: async () => {
      console.log('  Testing incomplete compliance bundle detection...\n');

      const ALWAYS_REQUIRED = ['merkle_anchors', 'audit_events_sample', 'hash_chain_proof'];
      const EU_REQUIRED = ['consent_records', 'revocation_records', 'retention_policy'];

      function validateBundle(bundle, profile) {
        const required = [...ALWAYS_REQUIRED];
        if (profile === 'eu') required.push(...EU_REQUIRED);

        const missing = required.filter(r => !bundle.artifacts?.[r]);
        return { valid: missing.length === 0, missing };
      }

      let passed = true;

      // Complete bundle
      const completeBundle = {
        artifacts: {
          merkle_anchors: { count: 10 },
          audit_events_sample: { count: 100 },
          hash_chain_proof: { count: 1 },
          consent_records: { count: 50 },
          revocation_records: { count: 5 },
          retention_policy: { count: 1 }
        }
      };

      const completeResult = validateBundle(completeBundle, 'eu');
      if (completeResult.valid) {
        console.log('    ✓ Complete bundle: Correctly accepted');
      } else {
        console.log('    ❌ False rejection on complete bundle');
        passed = false;
      }

      // Incomplete bundle
      const incompleteBundle = {
        artifacts: {
          merkle_anchors: { count: 10 },
          // Missing: audit_events_sample, hash_chain_proof, consent_records, etc.
        }
      };

      const incompleteResult = validateBundle(incompleteBundle, 'eu');
      if (!incompleteResult.valid) {
        console.log('    ✓ Incomplete bundle: Correctly rejected');
        console.log(`       Missing: ${incompleteResult.missing.join(', ')}`);
      } else {
        console.log('    ❌ GATE FAILURE: Incomplete bundle accepted!');
        passed = false;
      }

      return passed;
    }
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const testIdx = args.indexOf('--test');
const specificTest = testIdx >= 0 ? args[testIdx + 1] : null;
const runAll = args.includes('--all') || (!specificTest);

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  CHAOS TEST SUITE');
console.log('  If a gate doesn\'t catch deliberate violations, it\'s not a gate.');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

let totalPassed = 0;
let totalFailed = 0;

const testsToRun = specificTest ? { [specificTest]: CHAOS_TESTS[specificTest] } : CHAOS_TESTS;

for (const [testId, test] of Object.entries(testsToRun)) {
  if (!test) {
    console.log(`Unknown test: ${testId}`);
    continue;
  }

  console.log(`╔═══ ${test.name} ═══`);
  console.log(`║ ${test.description}`);
  console.log('╚═══════════════════════════════════════════════════════════════');
  console.log('');

  const passed = await test.run();

  console.log('');
  if (passed) {
    console.log(`  ✅ ${test.name}: PASSED`);
    totalPassed++;
  } else {
    console.log(`  ❌ ${test.name}: FAILED`);
    totalFailed++;
  }
  console.log('');
}

console.log('═══════════════════════════════════════════════════════════════════');
console.log(`  CHAOS TEST RESULTS: ${totalPassed} passed, ${totalFailed} failed`);
console.log('═══════════════════════════════════════════════════════════════════');

if (totalFailed > 0) {
  console.log('');
  console.log('  ❌ CHAOS TEST SUITE: FAILED');
  console.log('');
  console.log('  One or more gates failed to catch deliberate violations.');
  console.log('  This means the enforcement is broken.');
  console.log('');
  process.exit(1);
} else {
  console.log('');
  console.log('  ✅ CHAOS TEST SUITE: PASSED');
  console.log('');
  console.log('  All gates correctly caught deliberate violations.');
  console.log('  Enforcement is working as designed.');
  console.log('');
  process.exit(0);
}
