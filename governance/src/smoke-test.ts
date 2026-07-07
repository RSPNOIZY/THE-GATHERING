/**
 * NOIZY.AI GOVERNANCE — Smoke Test
 * 
 * Tests the full lifecycle:
 *   staging → review → blessed → D1-ready
 * 
 * Plus: blessing gate enforcement, decision queue, and standup generation.
 * 
 * Run: npx tsx src/smoke-test.ts
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { writeFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { canBless, bless, canIngest, markIngested, reject, type MemoryRecord } from './blessing-gate';
import { raiseDecision, resolveDecision, getPendingDecisions, getQueueSummary } from './decision-queue';
import { stage, promoteToReview, promoteToBlessed, getManifestSummary } from './memory-promotion';

// ─── SETUP ───────────────────────────────────────────────

console.log('═══════════════════════════════════════════════');
console.log('  NOIZY.AI GOVERNANCE — SMOKE TEST');
console.log('═══════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string): void {
  if (condition) {
    console.log(`  ✓ ${name}`);
    passed++;
  } else {
    console.log(`  ✗ ${name}`);
    failed++;
  }
}

/** Runtime status check — avoids TS narrowing false positives in tests */
function statusIs(record: MemoryRecord, expected: string): boolean {
  return (record.status as string) === expected;
}

// ─── TEST 1: Blessing Gate ───────────────────────────────

console.log('\n── Test 1: Blessing Gate ──');

const rawRecord: MemoryRecord = {
  id: 'test-001',
  type: 'session',
  status: 'staging',
  content_hash: 'abc123',
  content_path: '/tmp/test.json',
  created_at: new Date().toISOString(),
  created_by: 'claude_code',
  blessing_locked: false,
  gabriel_ingested: false,
};

// Cannot bless staging
const r1 = canBless(rawRecord);
assert(r1.allowed === false, 'Cannot bless staging record');

// Cannot ingest unblessed
const r2 = canIngest(rawRecord);
assert(r2.allowed === false, 'Cannot ingest unblessed record');

// Move to review
rawRecord.status = 'review';
rawRecord.reviewed_by = 'Robert Stephen Plowman';

// Can bless reviewed record
const r3 = canBless(rawRecord);
assert(r3.allowed === true, 'Can bless reviewed record');

// Bless it
const r4 = bless(rawRecord, 'Robert Stephen Plowman');
assert(r4.allowed === true, 'Blessing succeeds');
assert(statusIs(rawRecord, 'blessed'), 'Status is now blessed');
assert(rawRecord.blessing_locked === true, 'Blessing is locked');

// Can ingest blessed record
const r5 = canIngest(rawRecord);
assert(r5.allowed === true, 'Can ingest blessed record');

// Mark ingested
const r6 = markIngested(rawRecord, 'blessed_sessions');
assert(r6.allowed === true, 'Ingest succeeds');
assert(rawRecord.gabriel_ingested === true, 'Gabriel ingested flag set');
assert(rawRecord.gabriel_table === 'blessed_sessions', 'Gabriel table recorded');

// Cannot double-ingest
const r7 = canIngest(rawRecord);
assert(r7.allowed === false, 'Cannot double-ingest');

// Cannot reject blessed
let threwOnReject = false;
try { reject(rawRecord, 'test', 'test'); } catch { threwOnReject = true; }
assert(threwOnReject === true, 'Cannot reject blessed record (immutable)');

// ─── TEST 2: Decision Queue ─────────────────────────────

console.log('\n── Test 2: Decision Queue ──');

const decision = raiseDecision({
  title: 'Schema fork: actor_imprint needs voice_model_id field',
  category: 'schema_fork',
  urgency: 'medium',
  blocking: false,
  reason: 'Voice model selection requires linking actor to specific XTTS model',
  context: 'Actor protocol v1 has no voice model reference',
  options: [
    { label: 'Add to actor_imprint', description: 'Direct field on imprint', risk: 'low', reversible: true },
    { label: 'Separate voice_models table', description: 'Many-to-many relationship', risk: 'medium', reversible: true },
  ],
  recommendation: 'Separate table — actors may have multiple voice models',
});

assert(decision.status === 'pending', 'Decision created as pending');
assert(decision.gabriel_ingested === false, 'Decision not ingested by default');

const pending = getPendingDecisions();
assert(pending.length >= 1, 'Pending queue has at least 1 decision');

const resolved = resolveDecision(
  decision.id,
  'Robert Stephen Plowman',
  'Separate voice_models table',
  'Actors will have multiple voice models. Many-to-many is correct.',
);
assert(resolved.status === 'decided', 'Decision resolved');
assert(resolved.decided_by === 'Robert Stephen Plowman', 'Decided by RSP');

const summary = getQueueSummary();
assert(summary.decided >= 1, 'Queue shows decided count');

// ─── TEST 3: Memory Promotion Pipeline ──────────────────

console.log('\n── Test 3: Memory Promotion Pipeline ──');

// Create a test file to stage
const testDir = '/Users/m2ultra/NOIZYLAB/governance/staging';
mkdirSync(testDir, { recursive: true });
const testFile = join(testDir, 'test-session.json');
writeFileSync(testFile, JSON.stringify({ test: true, session: 'smoke-test' }));

// Stage
const staged = stage(testFile, 'session', 'claude_code', 'smoke-test-run');
assert(statusIs(staged, 'staging'), 'Record staged');
assert(staged.content_hash.length === 64, 'SHA-256 hash generated');

// Promote to review
const reviewed = promoteToReview(staged.id, 'Robert Stephen Plowman', 'Smoke test — looks good');
assert(statusIs(reviewed, 'review'), 'Record promoted to review');
assert(reviewed.reviewed_by === 'Robert Stephen Plowman', 'Reviewer recorded');

// Promote to blessed
const blessedRecord = promoteToBlessed(reviewed.id, 'Robert Stephen Plowman');
assert(statusIs(blessedRecord, 'blessed'), 'Record promoted to blessed');
assert(blessedRecord.blessing_locked === true, 'Blessing locked');

// Check manifest
const manifest = getManifestSummary();
assert(manifest.blessed >= 1, 'Manifest shows blessed records');

// ─── RESULTS ─────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════');

if (failed > 0) {
  console.log('\n  ⚠ SOME TESTS FAILED — review above');
  process.exit(1);
} else {
  console.log('\n  ✓ ALL TESTS PASSED — Governance OS is operational');
  console.log('  Capture writes files.');
  console.log('  Humans bless memory.');
  console.log('  Gabriel only sees blessed truth.\n');
  process.exit(0);
}
