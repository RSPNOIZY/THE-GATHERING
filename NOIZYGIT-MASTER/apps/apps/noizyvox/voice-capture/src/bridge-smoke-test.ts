/**
 * NOIZYVOX — Blessing Bridge Smoke Test
 * 
 * Tests the full pipeline:
 *   Create Session → Record Takes → Approve → Stage → Verify Governance Envelope
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { existsSync, readFileSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import {
  createSession,
  startSession,
  recordTake,
  reviewTake,
  completeSession,
  getSessionStats,
  stageApprovedTakes,
  getBridgeStatus,
  getAllScriptLines,
} from './index';

// ─── TEST RUNNER ─────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];

function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✅ ${name}`);
  } catch (e: any) {
    failed++;
    failures.push(`${name}: ${e.message}`);
    console.log(`  ❌ ${name}: ${e.message}`);
  }
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// ─── SETUP ───────────────────────────────────────────────

const GOVERNANCE_STAGING = '/Users/m2ultra/NOIZYLAB/governance/staging';

function cleanStaging() {
  if (existsSync(GOVERNANCE_STAGING)) {
    rmSync(GOVERNANCE_STAGING, { recursive: true, force: true });
  }
}

// ═══════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════');
console.log('  NOIZYVOX — Blessing Bridge Smoke Test');
console.log('═══════════════════════════════════════════════\n');

// ─── 1. BRIDGE STATUS (NO SESSION) ─────────────────────
console.log('  § Bridge Status\n');

test('Bridge status for non-existent session', () => {
  const status = getBridgeStatus('nonexistent-session-id');
  assert(status.session_exists === false, 'Session should not exist');
  assert(status.session_completed === false, 'Should not be completed');
  assert(status.approved_count === 0, 'No approved takes');
  assert(status.staged_count === 0, 'No staged takes');
});

// ─── 2. FULL PIPELINE ──────────────────────────────────
console.log('\n  § Full Pipeline: Capture → Approve → Stage\n');

let testSessionId: string;

test('Create and run a complete capture session', () => {
  const lines = getAllScriptLines().slice(0, 5);
  const session = createSession({
    session_name: 'Bridge Test — Whisper',
    session_number: 100,
    actor_id: 'RSP_001',
    character_id: 'rsp_natural',
    script_lines: lines,
  });
  testSessionId = session.session_id;
  
  startSession(testSessionId);
  
  const takes = [];
  for (let i = 0; i < 5; i++) {
    takes.push(recordTake(testSessionId, {
      script_line: lines[i].text,
      performance_mode: 'CHARACTER',
      energy_band: 'whisper',
      audio_duration_ms: 2500 + Math.floor(Math.random() * 2000),
    }));
  }
  
  reviewTake(testSessionId, takes[0].take_id, 'approved', 'Perfect whisper', 0.95, true);
  reviewTake(testSessionId, takes[1].take_id, 'approved', 'Beautiful pause', 0.88, true);
  reviewTake(testSessionId, takes[2].take_id, 'rejected', 'Background noise');
  reviewTake(testSessionId, takes[3].take_id, 'approved', 'Good intensity', 0.82, true);
  reviewTake(testSessionId, takes[4].take_id, 'rejected', 'Broke character');
  
  completeSession(testSessionId);
  
  const stats = getSessionStats(testSessionId);
  assert(stats.approved === 3, `Expected 3 approved, got ${stats.approved}`);
  assert(stats.rejected === 2, `Expected 2 rejected, got ${stats.rejected}`);
  assert(stats.ready_for_blessing === true, 'Should be ready for blessing');
});

test('Stage approved takes into governance', () => {
  cleanStaging();
  
  const result = stageApprovedTakes(testSessionId);
  assert(result.session_id === testSessionId, 'Session ID should match');
  assert(result.approved_takes === 3, `Expected 3 approved, got ${result.approved_takes}`);
  assert(result.staged_takes === 3, `Expected 3 staged, got ${result.staged_takes}`);
  assert(result.skipped_takes === 0, 'No skipped takes');
  assert(result.ready_for_review === true, 'Should be ready for review');
});

test('Staged files exist in governance/staging', () => {
  assert(existsSync(GOVERNANCE_STAGING), 'Staging directory should exist');
  
  const manifestPath = join(GOVERNANCE_STAGING, `bridge-manifest-${testSessionId}.json`);
  assert(existsSync(manifestPath), 'Bridge manifest should exist');
  
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf-8'));
  assert(manifest.staged_takes === 3, 'Manifest should show 3 staged');
  assert(manifest.actor_id === 'RSP_001', 'Manifest actor should be RSP_001');
});

test('Governance envelope has correct structure', () => {
  const manifest = JSON.parse(
    readFileSync(join(GOVERNANCE_STAGING, `bridge-manifest-${testSessionId}.json`), 'utf-8')
  );
  
  const firstStagedFile = manifest.staged_files[0];
  assert(existsSync(firstStagedFile), 'Staged file should exist');
  
  const envelope = JSON.parse(readFileSync(firstStagedFile, 'utf-8'));
  
  assert(envelope.type === 'take', 'Type should be take');
  assert(envelope.status === 'staging', 'Status should be staging');
  assert(typeof envelope.content_hash === 'string', 'Should have content hash');
  assert(envelope.content_hash.length === 64, 'Content hash should be SHA-256 (64 chars)');
  assert(envelope.blessing_locked === false, 'Should not be blessed yet');
  assert(envelope.gabriel_ingested === false, 'Gabriel should not have ingested');
  assert(envelope.created_by === 'voice-capture-bridge', 'Creator should be bridge');
  
  assert(envelope.take_data.actor_id === 'RSP_001', 'Take actor should be RSP_001');
  assert(envelope.take_data.voice_ip_retained === true, 'Voice IP must be retained');
  assert(envelope.take_data.consent_confirmed === true, 'Consent must be confirmed');
});

// ─── 3. CONSENT INTEGRITY (before idempotent test overwrites manifest) ──
console.log('\n  § Consent & IP Integrity\n');

test('Every staged take retains voice IP and consent', () => {
  const manifest = JSON.parse(
    readFileSync(join(GOVERNANCE_STAGING, `bridge-manifest-${testSessionId}.json`), 'utf-8')
  );
  
  assert(manifest.staged_files.length === 3, `Expected 3 staged files, got ${manifest.staged_files.length}`);
  
  for (const filePath of manifest.staged_files) {
    const envelope = JSON.parse(readFileSync(filePath, 'utf-8'));
    assert(envelope.take_data.voice_ip_retained === true,
      `Take ${envelope.take_data.take_id} must retain voice IP`);
    assert(envelope.take_data.consent_confirmed === true,
      `Take ${envelope.take_data.take_id} must have consent confirmed`);
  }
});

test('SHA-256 content hashes are unique per take', () => {
  const manifest = JSON.parse(
    readFileSync(join(GOVERNANCE_STAGING, `bridge-manifest-${testSessionId}.json`), 'utf-8')
  );
  
  const hashes = new Set<string>();
  for (const filePath of manifest.staged_files) {
    const envelope = JSON.parse(readFileSync(filePath, 'utf-8'));
    assert(!hashes.has(envelope.content_hash),
      `Duplicate content hash found: ${envelope.content_hash}`);
    hashes.add(envelope.content_hash);
  }
  assert(hashes.size === 3, `Expected 3 unique hashes, got ${hashes.size}`);
});

test('Content hashes are valid SHA-256 hex strings', () => {
  const manifest = JSON.parse(
    readFileSync(join(GOVERNANCE_STAGING, `bridge-manifest-${testSessionId}.json`), 'utf-8')
  );
  
  const sha256Regex = /^[a-f0-9]{64}$/;
  for (const filePath of manifest.staged_files) {
    const envelope = JSON.parse(readFileSync(filePath, 'utf-8'));
    assert(sha256Regex.test(envelope.content_hash),
      `Hash ${envelope.content_hash} is not valid SHA-256`);
  }
});

// ─── 4. IDEMPOTENCY ─────────────────────────────────────
console.log('\n  § Idempotency\n');

test('Idempotent staging — skips already staged takes', () => {
  const result = stageApprovedTakes(testSessionId);
  assert(result.staged_takes === 0, 'Should stage 0 new takes');
  assert(result.skipped_takes === 3, 'Should skip 3 already staged');
  assert(result.ready_for_review === false, 'No new staging, so not ready');
});

test('Bridge status reflects staged state', () => {
  const status = getBridgeStatus(testSessionId);
  assert(status.session_exists === true, 'Session should exist');
  assert(status.session_completed === true, 'Session should be completed');
  assert(status.approved_count === 3, 'Should show 3 approved');
  assert(status.staged_count === 3, 'Should show 3 staged');
  assert(status.manifest_exists === true, 'Manifest should exist');
});

// ─── 5. ERROR HANDLING ──────────────────────────────────
console.log('\n  § Error Handling\n');

test('Cannot stage from incomplete session', () => {
  const lines = getAllScriptLines().slice(0, 2);
  const session = createSession({
    session_name: 'Incomplete Test',
    session_number: 101,
    actor_id: 'RSP_001',
    character_id: 'rsp_natural',
    script_lines: lines,
  });
  startSession(session.session_id);
  recordTake(session.session_id, {
    script_line: lines[0].text,
    performance_mode: 'CHARACTER',
  });
  
  let threw = false;
  try {
    stageApprovedTakes(session.session_id);
  } catch (e: any) {
    threw = true;
    assert(e.message.includes('completed'), 'Error should mention completed');
  }
  assert(threw, 'Should throw for incomplete session');
});

test('Cannot stage from non-existent session', () => {
  let threw = false;
  try {
    stageApprovedTakes('totally-fake-session-id');
  } catch (e: any) {
    threw = true;
    assert(e.message.includes('not found'), 'Error should mention not found');
  }
  assert(threw, 'Should throw for non-existent session');
});

// ─── CLEANUP ─────────────────────────────────────────────
cleanStaging();

// ─── RESULTS ─────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed of ${passed + failed}`);

if (failures.length > 0) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

console.log('\n  Capture → Stage → Bless → Gabriel.');
console.log('  Nothing passes without human blessing.');
console.log('═══════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
