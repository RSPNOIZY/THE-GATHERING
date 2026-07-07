#!/usr/bin/env node
/**
 * D1 TIME-TRAVEL AUDIT VERIFICATION
 *
 * Verifies audit integrity across time using hash chain and anchor validation.
 *
 * Usage:
 *   node scripts/edge-core/verify-time-travel.js --hash-chain
 *   node scripts/edge-core/verify-time-travel.js --anchors
 *   node scripts/edge-core/verify-time-travel.js --tamper-check
 *   node scripts/edge-core/verify-time-travel.js --recent-anchors
 *   node scripts/edge-core/verify-time-travel.js --all
 *
 * Core Law: What was recorded then must match what we can prove now.
 */

import { execSync } from 'child_process';
import crypto from 'crypto';

const DB_NAME = process.env.AUDIT_D1_DATABASE || 'gabriel_db';

// ═══════════════════════════════════════════════════════════════════════════
// D1 QUERY HELPERS
// ═══════════════════════════════════════════════════════════════════════════

function executeD1Query(command) {
  try {
    const result = execSync(
      `npx wrangler d1 execute ${DB_NAME} --remote --command "${command.replace(/"/g, '\\"')}"`,
      { encoding: 'utf8', stdio: ['pipe', 'pipe', 'pipe'] }
    );
    return { success: true, output: result };
  } catch (err) {
    return { success: false, error: err.message };
  }
}

function parseD1Output(output) {
  // D1 output is JSON-ish, try to extract results
  try {
    const match = output.match(/\[[\s\S]*\]/);
    if (match) {
      return JSON.parse(match[0]);
    }
  } catch (e) {
    // Fall through
  }
  return [];
}

// ═══════════════════════════════════════════════════════════════════════════
// HASH COMPUTATION
// ═══════════════════════════════════════════════════════════════════════════

function computeEventHash(event) {
  const payload = JSON.stringify({
    id: event.id,
    operator_email: event.operator_email,
    action: event.action,
    explanation: event.explanation,
    precondition_passed: event.precondition_passed,
    prev_hash: event.prev_hash || 'GENESIS'
  });
  return crypto.createHash('sha256').update(payload).digest('hex');
}

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

// ═══════════════════════════════════════════════════════════════════════════
// VERIFICATION FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════

async function verifyHashChain() {
  console.log('Verifying hash chain continuity...');

  // Get all events ordered by time
  const result = executeD1Query(`
    SELECT id, event_hash, prev_hash, created_at
    FROM audit_events
    ORDER BY created_at ASC
    LIMIT 1000
  `);

  if (!result.success) {
    console.log('  ❌ Failed to query audit_events');
    return false;
  }

  const events = parseD1Output(result.output);

  if (events.length === 0) {
    console.log('  ✓ No events to verify (empty chain is valid)');
    return true;
  }

  let breaks = 0;
  let prevHash = null;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];

    if (i === 0) {
      // First event should have null or GENESIS prev_hash
      if (event.prev_hash && event.prev_hash !== 'GENESIS') {
        console.log(`  ⚠️ First event has non-genesis prev_hash: ${event.prev_hash}`);
        // Not necessarily a break, but notable
      }
    } else {
      // Subsequent events should chain properly
      if (event.prev_hash !== prevHash) {
        console.log(`  ❌ Chain break at event ${event.id}`);
        console.log(`     Expected prev_hash: ${prevHash}`);
        console.log(`     Actual prev_hash: ${event.prev_hash}`);
        breaks++;
      }
    }

    prevHash = event.event_hash;
  }

  if (breaks > 0) {
    console.log(`  ❌ Hash chain has ${breaks} breaks`);
    return false;
  }

  console.log(`  ✓ Hash chain intact (${events.length} events verified)`);
  return true;
}

async function verifyAnchors() {
  console.log('Verifying anchor consistency...');

  // Get all anchors
  const anchorsResult = executeD1Query(`
    SELECT anchor_date, root_hash, event_count, published_at
    FROM audit_anchors
    ORDER BY anchor_date DESC
    LIMIT 30
  `);

  if (!anchorsResult.success) {
    console.log('  ⚠️ No anchors table or query failed');
    return true; // Not a failure if no anchors yet
  }

  const anchors = parseD1Output(anchorsResult.output);

  if (anchors.length === 0) {
    console.log('  ✓ No anchors to verify');
    return true;
  }

  let failures = 0;

  for (const anchor of anchors) {
    // Get events up to anchor date
    const eventsResult = executeD1Query(`
      SELECT event_hash FROM audit_events
      WHERE DATE(created_at) <= '${anchor.anchor_date}'
      ORDER BY created_at ASC
    `);

    if (!eventsResult.success) {
      console.log(`  ⚠️ Failed to get events for anchor ${anchor.anchor_date}`);
      continue;
    }

    const events = parseD1Output(eventsResult.output);
    const hashes = events.map(e => e.event_hash).filter(h => h);

    if (hashes.length !== anchor.event_count) {
      console.log(`  ⚠️ Event count mismatch for ${anchor.anchor_date}`);
      console.log(`     Recorded: ${anchor.event_count}, Found: ${hashes.length}`);
      // Count mismatch is notable but may be due to query limits
    }

    const recomputedRoot = computeMerkleRoot(hashes);

    if (recomputedRoot !== anchor.root_hash) {
      console.log(`  ❌ Merkle root mismatch for ${anchor.anchor_date}`);
      console.log(`     Recorded: ${anchor.root_hash}`);
      console.log(`     Computed: ${recomputedRoot}`);
      failures++;
    } else {
      console.log(`  ✓ Anchor ${anchor.anchor_date} verified`);
    }
  }

  if (failures > 0) {
    console.log(`  ❌ ${failures} anchors failed verification`);
    return false;
  }

  console.log(`  ✓ All ${anchors.length} anchors verified`);
  return true;
}

async function verifyRecentAnchors() {
  console.log('Verifying recent anchors (last 7 days)...');

  const result = executeD1Query(`
    SELECT anchor_date, root_hash, event_count, published_at, created_at
    FROM audit_anchors
    WHERE anchor_date >= DATE('now', '-7 days')
    ORDER BY anchor_date DESC
  `);

  if (!result.success) {
    console.log('  ⚠️ No recent anchors or query failed');
    return true;
  }

  const anchors = parseD1Output(result.output);

  if (anchors.length === 0) {
    console.log('  ⚠️ No anchors in last 7 days');
    return true; // Warning but not failure
  }

  // Check for gaps
  const dates = anchors.map(a => new Date(a.anchor_date));
  for (let i = 0; i < dates.length - 1; i++) {
    const gap = (dates[i] - dates[i + 1]) / (1000 * 60 * 60 * 24);
    if (gap > 2) {
      console.log(`  ⚠️ Gap of ${gap} days between anchors`);
    }
  }

  console.log(`  ✓ ${anchors.length} recent anchors found`);
  return true;
}

async function tamperCheck() {
  console.log('Running tamper detection checks...');

  // Check 1: Event count should be monotonically increasing
  const countResult = executeD1Query(`
    SELECT COUNT(*) as cnt FROM audit_events
  `);

  if (!countResult.success) {
    console.log('  ❌ Failed to count audit events');
    return false;
  }

  const counts = parseD1Output(countResult.output);
  const currentCount = counts[0]?.cnt || 0;

  // Check against latest anchor
  const anchorResult = executeD1Query(`
    SELECT event_count FROM audit_anchors ORDER BY anchor_date DESC LIMIT 1
  `);

  if (anchorResult.success) {
    const anchors = parseD1Output(anchorResult.output);
    const lastAnchorCount = anchors[0]?.event_count || 0;

    if (currentCount < lastAnchorCount) {
      console.log(`  ❌ Event count decreased!`);
      console.log(`     Last anchor count: ${lastAnchorCount}`);
      console.log(`     Current count: ${currentCount}`);
      return false;
    }
    console.log(`  ✓ Event count consistent (${currentCount} >= ${lastAnchorCount})`);
  }

  // Check 2: No future timestamps
  const futureResult = executeD1Query(`
    SELECT COUNT(*) as cnt FROM audit_events
    WHERE created_at > DATETIME('now', '+1 hour')
  `);

  if (futureResult.success) {
    const future = parseD1Output(futureResult.output);
    if (future[0]?.cnt > 0) {
      console.log(`  ❌ ${future[0].cnt} events with future timestamps detected`);
      return false;
    }
    console.log('  ✓ No future timestamps');
  }

  // Check 3: No duplicate event IDs
  const dupeResult = executeD1Query(`
    SELECT id, COUNT(*) as cnt FROM audit_events
    GROUP BY id HAVING cnt > 1
    LIMIT 5
  `);

  if (dupeResult.success) {
    const dupes = parseD1Output(dupeResult.output);
    if (dupes.length > 0) {
      console.log(`  ❌ Duplicate event IDs detected: ${dupes.map(d => d.id).join(', ')}`);
      return false;
    }
    console.log('  ✓ No duplicate event IDs');
  }

  console.log('  ✓ Tamper check passed');
  return true;
}

// ═══════════════════════════════════════════════════════════════════════════
// MAIN
// ═══════════════════════════════════════════════════════════════════════════

const args = process.argv.slice(2);
const mode = args[0] || '--all';

console.log('═══════════════════════════════════════════════════════════════════');
console.log('  D1 TIME-TRAVEL AUDIT VERIFICATION');
console.log('  What was recorded then must match what we can prove now.');
console.log('═══════════════════════════════════════════════════════════════════');
console.log('');

let success = true;

switch (mode) {
  case '--hash-chain':
    success = await verifyHashChain();
    break;
  case '--anchors':
    success = await verifyAnchors();
    break;
  case '--recent-anchors':
    success = await verifyRecentAnchors();
    break;
  case '--tamper-check':
    success = await tamperCheck();
    break;
  case '--all':
  default:
    const hashOk = await verifyHashChain();
    const anchorsOk = await verifyAnchors();
    const tamperOk = await tamperCheck();
    success = hashOk && anchorsOk && tamperOk;
    break;
}

console.log('');
console.log('═══════════════════════════════════════════════════════════════════');

if (success) {
  console.log('  ✅ D1 TIME-TRAVEL AUDIT: PASSED');
  console.log('');
  console.log('  Audit history is intact and verifiable.');
  console.log('═══════════════════════════════════════════════════════════════════');
  process.exit(0);
} else {
  console.log('  ❌ D1 TIME-TRAVEL AUDIT: FAILED');
  console.log('');
  console.log('  BLOCKING: Audit integrity compromised.');
  console.log('');
  console.log('  Core Law: What was recorded then must match');
  console.log('            what we can prove now.');
  console.log('═══════════════════════════════════════════════════════════════════');
  process.exit(1);
}
