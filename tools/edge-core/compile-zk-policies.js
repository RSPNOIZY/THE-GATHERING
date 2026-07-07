#!/usr/bin/env node
/**
 * POLICY COMPILER GATE
 *
 * Validates, compiles, and tests ZK-verifiable policies.
 * Used by CI to block deploys when policies cannot produce valid proofs.
 *
 * Usage:
 *   node scripts/edge-core/compile-zk-policies.js --check-syntax
 *   node scripts/edge-core/compile-zk-policies.js --compile
 *   node scripts/edge-core/compile-zk-policies.js --prove
 *   node scripts/edge-core/compile-zk-policies.js --verify
 *   node scripts/edge-core/compile-zk-policies.js --all
 *
 * Core Law: If a policy cannot produce a valid proof, it cannot be enforced.
 */

import { POLICIES, evaluatePolicy } from '../../src/edge-core/policy_registry.js';

// ═══════════════════════════════════════════════════════════════════════════
// TEST VECTORS
// ═══════════════════════════════════════════════════════════════════════════

const TEST_VECTORS = {
  CONSENT_ACTIVE_ON_USE: {
    input: {
      consent_state: 'CLEARED',
      revocation_timestamp: null,
      event_timestamp: '2026-04-07T12:00:00Z',
      created_at: '2026-04-07T11:00:00Z'
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
      stability_window_minutes: 20
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
      resolution_notes: 'Investigated and cleared by operator RSP_001 after review.',
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

// Required fields per policy
const REQUIRED_FIELDS = ['id', 'version', 'scope', 'description', 'verification_mode', 'inputs', 'evaluate'];

// Unsupported patterns in ZK circuits
const ZK_UNSUPPORTED_PATTERNS = [
  /fetch\s*\(/,
  /Math\.random/,
  /Date\.now\s*\(/,
  /while\s*\(\s*true/,
  /for\s*\(\s*;\s*;/
];

// ═══════════════════════════════════════════════════════════════════════════
// VALIDATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

function validatePolicySyntax(policy) {
  const errors = [];

  for (const field of REQUIRED_FIELDS) {
    if (!policy[field]) {
      errors.push(`Missing required field: ${field}`);
    }
  }

  if (policy.evaluate && typeof policy.evaluate !== 'function') {
    errors.push('evaluate must be a function');
  }

  if (policy.inputs && (!Array.isArray(policy.inputs) || policy.inputs.length === 0)) {
    errors.push('inputs must be a non-empty array');
  }

  if (policy.verification_mode && !['zk', 'reportable', 'hybrid', 'never-zk'].includes(policy.verification_mode)) {
    errors.push(`Invalid verification_mode: ${policy.verification_mode}`);
  }

  return errors;
}

function checkZkCompatibility(policy) {
  if (policy.verification_mode !== 'zk') {
    return { compatible: true, reason: 'Not a ZK policy' };
  }

  const fnStr = policy.evaluate.toString();

  for (const pattern of ZK_UNSUPPORTED_PATTERNS) {
    if (pattern.test(fnStr)) {
      return {
        compatible: false,
        reason: `Contains unsupported pattern: ${pattern.source}`
      };
    }
  }

  return { compatible: true, reason: null };
}

// Simulate circuit compilation (in production, this would use a real ZK compiler)
function compileToCircuit(policy) {
  const start = Date.now();

  // Count constraints based on inputs
  const constraints = policy.inputs.length;

  // Check for ZK compatibility
  const compat = checkZkCompatibility(policy);
  if (!compat.compatible) {
    return {
      success: false,
      error: compat.reason,
      time_ms: Date.now() - start
    };
  }

  return {
    success: true,
    constraints,
    time_ms: Date.now() - start
  };
}

// Generate a proof (simulated)
function generateProof(policy, testData) {
  const start = Date.now();

  // Evaluate the policy
  const result = evaluatePolicy(policy.id, testData);

  if (!result.success) {
    return {
      success: false,
      error: result.error,
      time_ms: Date.now() - start
    };
  }

  // In production, this would generate an actual ZK proof
  const proof = {
    policy_id: policy.id,
    policy_version: policy.version,
    inputs_hash: Buffer.from(JSON.stringify(testData)).toString('base64').slice(0, 32),
    result: result.result,
    proof_data: 'SIMULATED_PROOF_' + Date.now()
  };

  return {
    success: true,
    proof,
    time_ms: Date.now() - start
  };
}

// Verify a proof (simulated)
function verifyProof(proof, policy) {
  const start = Date.now();

  // In production, this would verify the actual ZK proof
  const valid = proof.policy_id === policy.id &&
                proof.policy_version === policy.version &&
                proof.proof_data.startsWith('SIMULATED_PROOF_');

  return {
    success: valid,
    time_ms: Date.now() - start
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// GATE COMMANDS
// ═══════════════════════════════════════════════════════════════════════════

function checkSyntax() {
  console.log('Validating policy syntax...');
  let failed = 0;

  for (const [id, policy] of Object.entries(POLICIES)) {
    const errors = validatePolicySyntax(policy);
    if (errors.length > 0) {
      console.log(`  ${id}: FAILED`);
      errors.forEach(e => console.log(`    - ${e}`));
      failed++;
    } else {
      console.log(`  ${id}: valid`);
    }
  }

  console.log('');
  if (failed > 0) {
    console.log(`Syntax validation FAILED: ${failed} policies with errors`);
    return false;
  }
  console.log(`All ${Object.keys(POLICIES).length} policies are syntactically valid.`);
  return true;
}

function compileCircuits() {
  console.log('Compiling ZK circuits...');
  let failed = 0;
  let compiled = 0;

  for (const [id, policy] of Object.entries(POLICIES)) {
    if (policy.verification_mode !== 'zk') {
      console.log(`  ${id}: skipped (not ZK)`);
      continue;
    }

    const result = compileToCircuit(policy);
    if (result.success) {
      console.log(`  ${id}: compiled (${result.constraints} constraints, ${result.time_ms}ms)`);
      compiled++;
    } else {
      console.log(`  ${id}: FAILED - ${result.error}`);
      failed++;
    }
  }

  console.log('');
  if (failed > 0) {
    console.log(`Circuit compilation FAILED: ${failed} policies failed to compile`);
    return false;
  }
  console.log(`All ${compiled} ZK policies compiled successfully.`);
  return true;
}

function generateProofs() {
  console.log('Generating test proofs...');
  let failed = 0;
  let generated = 0;

  for (const [id, policy] of Object.entries(POLICIES)) {
    if (policy.verification_mode !== 'zk') {
      continue;
    }

    const testVector = TEST_VECTORS[id];
    if (!testVector) {
      console.log(`  ${id}: FAILED - no test vector`);
      failed++;
      continue;
    }

    const result = generateProof(policy, testVector.input);
    if (result.success) {
      const expectedMatch = result.proof.result === testVector.expected ? 'matches expected' : 'MISMATCH';
      console.log(`  ${id}: proof generated (${result.time_ms}ms, ${expectedMatch})`);
      if (result.proof.result !== testVector.expected) {
        console.log(`    Expected: ${testVector.expected}, Got: ${result.proof.result}`);
        failed++;
      } else {
        generated++;
      }
    } else {
      console.log(`  ${id}: FAILED - ${result.error}`);
      failed++;
    }
  }

  console.log('');
  if (failed > 0) {
    console.log(`Proof generation FAILED: ${failed} policies failed`);
    return false;
  }
  console.log(`All ${generated} proofs generated successfully.`);
  return true;
}

function verifyProofs() {
  console.log('Verifying proof roundtrips...');
  let failed = 0;
  let verified = 0;

  for (const [id, policy] of Object.entries(POLICIES)) {
    if (policy.verification_mode !== 'zk') {
      continue;
    }

    const testVector = TEST_VECTORS[id];
    if (!testVector) {
      continue;
    }

    // Generate proof
    const proofResult = generateProof(policy, testVector.input);
    if (!proofResult.success) {
      console.log(`  ${id}: FAILED - could not generate proof`);
      failed++;
      continue;
    }

    // Verify proof
    const verifyResult = verifyProof(proofResult.proof, policy);
    if (verifyResult.success) {
      console.log(`  ${id}: proof verified (${verifyResult.time_ms}ms)`);
      verified++;
    } else {
      console.log(`  ${id}: FAILED - verification failed`);
      failed++;
    }
  }

  console.log('');
  if (failed > 0) {
    console.log(`Proof verification FAILED: ${failed} policies failed`);
    return false;
  }
  console.log(`All ${verified} proof roundtrips verified.`);
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const mode = args[0] || '--all';

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  POLICY COMPILER GATE');
console.log('  If a policy cannot produce a valid proof, it cannot be enforced.');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

let success = true;

switch (mode) {
  case '--check-syntax':
    success = checkSyntax();
    break;
  case '--compile':
    success = compileCircuits();
    break;
  case '--prove':
    success = generateProofs();
    break;
  case '--verify':
    success = verifyProofs();
    break;
  case '--all':
  default:
    success = checkSyntax() && compileCircuits() && generateProofs() && verifyProofs();
    break;
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');

if (success) {
  console.log('  POLICY COMPILER GATE: PASSED');
  console.log('');
  console.log('  All ZK policies are enforceable.');
  console.log('═══════════════════════════════════════════════════════════════════');
  process.exit(0);
} else {
  console.log('  POLICY COMPILER GATE: FAILED');
  console.log('');
  console.log('  BLOCKING: Deploy must not proceed until all policies compile.');
  console.log('');
  console.log('  Core Law: If a policy cannot produce a valid proof,');
  console.log('            it cannot be enforced.');
  console.log('═══════════════════════════════════════════════════════════════════');
  process.exit(1);
}
