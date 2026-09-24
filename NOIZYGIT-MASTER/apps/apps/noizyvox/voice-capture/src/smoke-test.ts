/**
 * NOIZYVOX — Voice Capture Smoke Test
 * 
 * Tests capture sessions, take workflow, Gini monitor,
 * and the RSP_001 35-take session plan.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import {
  CaptureSessionSchema,
  VoiceTakeSchema,
  SessionPlanSchema,
  createSession,
  startSession,
  recordTake,
  reviewTake,
  completeSession,
  getSessionStats,
  calculateGini,
  calculateDistributionStats,
  assessGini,
  GINI_CONSTITUTION,
  RSP001_SESSION_PLAN,
  RSP001_SCRIPT_LINES,
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

function approx(a: number, b: number, tolerance = 0.01): boolean {
  return Math.abs(a - b) <= tolerance;
}

// ═══════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════');
console.log('  NOIZYVOX — Voice Capture Smoke Test');
console.log('═══════════════════════════════════════════════\n');

// ─── 1. SESSION PLAN ────────────────────────────────────
console.log('  § RSP_001 Session Plan\n');

test('Session plan has 5 sessions totalling 35 takes', () => {
  assert(RSP001_SESSION_PLAN.total_planned_sessions === 5, 'Should have 5 sessions');
  assert(RSP001_SESSION_PLAN.total_planned_takes === 35, 'Should have 35 takes');
  const totalFromSessions = RSP001_SESSION_PLAN.sessions.reduce((s, sess) => s + sess.planned_takes, 0);
  assert(totalFromSessions === 35, `Sessions sum to ${totalFromSessions}, expected 35`);
});

test('Session plan validates against schema', () => {
  const result = SessionPlanSchema.safeParse(RSP001_SESSION_PLAN);
  assert(result.success, `Plan should validate: ${result.error?.message}`);
});

test('All 35 script lines present', () => {
  const lines = getAllScriptLines();
  assert(lines.length === 35, `Expected 35 lines, got ${lines.length}`);
  // Check line numbers are 1-35
  for (let i = 0; i < 35; i++) {
    assert(lines[i].line_number === i + 1, `Line ${i} has number ${lines[i].line_number}, expected ${i + 1}`);
  }
});

test('Each energy band has 7 lines', () => {
  assert(RSP001_SCRIPT_LINES.whisper.length === 7, 'Whisper should have 7');
  assert(RSP001_SCRIPT_LINES.conversational.length === 7, 'Conversational should have 7');
  assert(RSP001_SCRIPT_LINES.performance.length === 7, 'Performance should have 7');
  assert(RSP001_SCRIPT_LINES.full_power.length === 7, 'Full power should have 7');
  assert(RSP001_SCRIPT_LINES.mixed.length === 7, 'Mixed should have 7');
});

test('Catalogue target < total takes', () => {
  assert(RSP001_SESSION_PLAN.catalogue_target < RSP001_SESSION_PLAN.total_planned_takes,
    'Catalogue target should be less than total');
  assert(RSP001_SESSION_PLAN.teaching_ready_at < RSP001_SESSION_PLAN.catalogue_target,
    'Teaching ready should be less than catalogue target');
});

// ─── 2. CAPTURE SESSION ─────────────────────────────────
console.log('\n  § Capture Session Workflow\n');

test('Create session from script lines', () => {
  const lines = getAllScriptLines().slice(0, 7); // First 7 (whisper)
  const session = createSession({
    session_name: 'Smoke Test — Whisper Session',
    session_number: 1,
    actor_id: 'RSP_001',
    character_id: 'rsp_natural',
    script_lines: lines,
  });
  assert(session.status === 'planning', 'Should be in planning');
  assert(session.planned_takes === 7, 'Should plan 7 takes');
  assert(session.actor_id === 'RSP_001', 'Actor should be RSP_001');
  assert(session.voice_ip_owner === true, 'Voice IP must be retained');
});

test('Full session lifecycle: create → start → record → review → complete', () => {
  const lines = getAllScriptLines().slice(0, 3);
  const session = createSession({
    session_name: 'Lifecycle Test',
    session_number: 99,
    actor_id: 'RSP_001',
    character_id: 'rsp_natural',
    script_lines: lines,
  });
  
  // Start
  const started = startSession(session.session_id);
  assert(started.status === 'active', 'Should be active');
  
  // Record 3 takes
  const take1 = recordTake(session.session_id, {
    script_line: lines[0].text,
    performance_mode: 'CHARACTER',
    energy_band: 'whisper',
    audio_duration_ms: 3200,
  });
  assert(take1.take_number === 1, 'First take should be 1');
  assert(take1.voice_ip_retained === true, 'Voice IP must be retained');
  
  const take2 = recordTake(session.session_id, {
    script_line: lines[1].text,
    performance_mode: 'CHARACTER',
    energy_band: 'whisper',
    audio_duration_ms: 4100,
  });
  assert(take2.take_number === 2, 'Second take should be 2');
  
  const take3 = recordTake(session.session_id, {
    script_line: lines[2].text,
    performance_mode: 'CHARACTER',
    energy_band: 'whisper',
    improvised: true,
    audio_duration_ms: 2800,
  });
  assert(take3.improvised === true, 'Third take should be improvised');
  
  // Review
  reviewTake(session.session_id, take1.take_id, 'approved', 'Strong whisper', 0.92, true);
  reviewTake(session.session_id, take2.take_id, 'approved', 'Good pause work', 0.85, true);
  reviewTake(session.session_id, take3.take_id, 'rejected', 'Broke character mid-line');
  
  // Stats
  const stats = getSessionStats(session.session_id);
  assert(stats.total_takes === 3, 'Should have 3 takes');
  assert(stats.approved === 2, 'Should have 2 approved');
  assert(stats.rejected === 1, 'Should have 1 rejected');
  assert(approx(stats.approval_rate, 0.667, 0.01), `Approval rate should be ~0.667, got ${stats.approval_rate}`);
  
  // Complete
  const completed = completeSession(session.session_id);
  assert(completed.status === 'completed', 'Should be completed');
  
  // Check blessing readiness
  const finalStats = getSessionStats(session.session_id);
  assert(finalStats.ready_for_blessing === true, 'Should be ready for blessing');
});

test('Cannot record on inactive session', () => {
  const lines = getAllScriptLines().slice(0, 2);
  const session = createSession({
    session_name: 'Inactive Test',
    session_number: 98,
    actor_id: 'RSP_001',
    character_id: 'rsp_natural',
    script_lines: lines,
  });
  
  let threw = false;
  try {
    recordTake(session.session_id, {
      script_line: 'test',
      performance_mode: 'CHARACTER',
    });
  } catch { threw = true; }
  assert(threw, 'Should throw when recording on planning session');
});

test('VoiceTake schema validates', () => {
  const lines = getAllScriptLines().slice(0, 1);
  const session = createSession({
    session_name: 'Schema Test',
    session_number: 97,
    actor_id: 'RSP_001',
    character_id: 'rsp_natural',
    script_lines: lines,
  });
  startSession(session.session_id);
  const take = recordTake(session.session_id, {
    script_line: lines[0].text,
    performance_mode: 'CHARACTER',
    energy_band: 'whisper',
    audio_duration_ms: 3000,
  });
  const result = VoiceTakeSchema.safeParse(take);
  assert(result.success, `Take should validate: ${result.error?.message}`);
});

// ─── 3. GINI COEFFICIENT MONITOR ────────────────────────
console.log('\n  § Gini Coefficient Monitor\n');

test('Perfect equality = Gini 0', () => {
  const gini = calculateGini([100, 100, 100, 100, 100]);
  assert(gini === 0, `Expected 0, got ${gini}`);
});

test('Maximum inequality has high Gini', () => {
  const gini = calculateGini([0, 0, 0, 0, 1000]);
  assert(gini > 0.7, `Expected > 0.7, got ${gini}`);
});

test('Empty earnings = Gini 0', () => {
  assert(calculateGini([]) === 0, 'Empty should be 0');
  assert(calculateGini([100]) === 0, 'Single earner should be 0');
});

test('NOIZY-like distribution stays within target', () => {
  // Simulate 100 creators with NOIZY-style distribution
  const earnings = [];
  for (let i = 0; i < 100; i++) {
    // Most creators earn between $50-$200, some earn more
    earnings.push(50 + Math.random() * 150 + (i > 90 ? Math.random() * 200 : 0));
  }
  const gini = calculateGini(earnings);
  assert(gini < GINI_CONSTITUTION.intervention,
    `Simulated NOIZY distribution should be < ${GINI_CONSTITUTION.intervention}, got ${gini}`);
});

test('Distribution stats calculate correctly', () => {
  const stats = calculateDistributionStats([10, 20, 30, 40, 50]);
  assert(stats.total === 150, `Total should be 150, got ${stats.total}`);
  assert(stats.median === 30, `Median should be 30, got ${stats.median}`);
  assert(stats.mean === 30, `Mean should be 30, got ${stats.mean}`);
});

test('Gini assessment: healthy', () => {
  const result = assessGini(0.30);
  assert(result.level === 'healthy', `Expected healthy, got ${result.level}`);
  assert(result.dao_action_required === false, 'No DAO action needed');
});

test('Gini assessment: warning triggers DAO', () => {
  const result = assessGini(0.38);
  assert(result.level === 'warning', `Expected warning, got ${result.level}`);
  assert(result.dao_action_required === true, 'DAO action should be required');
});

test('Gini assessment: intervention at 0.41', () => {
  const result = assessGini(0.41);
  assert(result.level === 'intervention', `Expected intervention, got ${result.level}`);
  assert(result.dao_action_required === true, 'DAO action required');
});

test('Gini assessment: critical above 0.45', () => {
  const result = assessGini(0.50);
  assert(result.level === 'critical', `Expected critical, got ${result.level}`);
});

test('Constitutional thresholds are ordered', () => {
  assert(GINI_CONSTITUTION.target < GINI_CONSTITUTION.warning, 'target < warning');
  assert(GINI_CONSTITUTION.warning < GINI_CONSTITUTION.intervention, 'warning < intervention');
  assert(GINI_CONSTITUTION.intervention < GINI_CONSTITUTION.critical, 'intervention < critical');
  assert(GINI_CONSTITUTION.critical < GINI_CONSTITUTION.industry_average, 'critical < industry');
});

// ─── RESULTS ─────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed of ${passed + failed}`);

if (failures.length > 0) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

console.log('\n  Your voice is sovereign territory.');
console.log('  Consent is not optional. It is the foundation.');
console.log('═══════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
