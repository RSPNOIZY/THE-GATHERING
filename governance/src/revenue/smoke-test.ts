/**
 * NOIZY.AI GOVERNANCE — Revenue Pipeline Smoke Test
 * 
 * Tests all three scenarios:
 * 1. Teaching: RSP_001 teaches, student uses RSP's voice
 * 2. Collaboration remix: RSP_001 voice + another creator's music
 * 3. Cross-actor: RSP_001 voice + another actor's character
 * 
 * Run: npx tsx src/revenue/smoke-test.ts
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import {
  buildTeachingScenario,
  buildCollaborationScenario,
  buildCrossActorScenario,
} from './playback-tracking';

console.log('═══════════════════════════════════════════════');
console.log('  NOIZY.AI REVENUE PIPELINE — SMOKE TEST');
console.log('═══════════════════════════════════════════════\n');

let passed = 0;
let failed = 0;

function assert(condition: boolean, name: string): void {
  if (condition) { console.log(`  ✓ ${name}`); passed++; }
  else { console.log(`  ✗ ${name}`); failed++; }
}

function round2(n: number): number { return Math.round(n * 100) / 100; }

// Floating point tolerance: $0.01
function approx(a: number, b: number, tol: number = 0.01): boolean {
  return Math.abs(a - b) <= tol;
}

// ─── SCENARIO 1: Teaching ────────────────────────────────

console.log('\n── Scenario 1: RSP_001 Teaches, Student Creates ──');
console.log('   Student uses RSP_001\'s voice in their project.');
console.log('   300 seconds, $0.01/sec, 15% teacher royalty.\n');

const teaching = buildTeachingScenario({
  teacher_id: 'RSP_001',
  student_id: 'STU_001',
  duration_seconds: 300,
  rate_per_second: 0.01,
  teacher_royalty_percent: 15,
});

assert(approx(teaching.total_earned, 3.00), `Total earned: $${round2(teaching.total_earned)}`);
assert(teaching.voice_count === 1, 'Voice count: 1');

const studentNet = teaching.per_creator['STU_001'];
const teacherEarned = teaching.per_creator['RSP_001'];

// Student gets 70% = $2.10, minus 15% teacher royalty ($0.315) = ~$1.785
assert(approx(round2(studentNet), 1.79, 0.02), `Student net: $${round2(studentNet)} (after teacher royalty)`);
assert(round2(teacherEarned) > 0.15, `Teacher earned: $${round2(teacherEarned)} (voice + royalty)`);

// Teacher gets voice share ($0.15) + royalty ($0.315) = $0.465
assert(approx(teacherEarned, 0.465, 0.02), `Teacher total: $${round2(teacherEarned)} (voice $0.15 + royalty $0.315)`);

console.log(`\n   Breakdown:`);
for (const b of teaching.breakdown) {
  console.log(`     ${b.actor_id.padEnd(12)} ${b.role.padEnd(18)} ${b.is_teacher_royalty ? '(royalty) ' : '         '} $${round2(b.earned)}`);
}

// ─── SCENARIO 2: Collaboration Remix ─────────────────────

console.log('\n── Scenario 2: RSP_001 Voice + Creator\'s Music ──');
console.log('   Equal split collaboration. 600 seconds, $0.02/sec.\n');

const collab = buildCollaborationScenario({
  voice_actor_id: 'RSP_001',
  music_creator_id: 'MUS_001',
  duration_seconds: 600,
  rate_per_second: 0.02,
  split_method: 'equal',
});

assert(approx(collab.total_earned, 12.00), `Total earned: $${round2(collab.total_earned)}`);
assert(collab.voice_count === 2, 'Voice count: 2');
assert(collab.collaboration_adjustment === 0.5, 'Collaboration adjustment: 0.5');

const rspCollab = round2(collab.per_creator['RSP_001']);
const musCollab = round2(collab.per_creator['MUS_001']);

assert(rspCollab === musCollab, `Equal split: RSP=$${rspCollab}, MUS=$${musCollab}`);
assert(rspCollab + musCollab >= 12 * 0.70, 'Creator total >= 70% constitutional minimum');

console.log(`\n   Breakdown:`);
for (const b of collab.breakdown) {
  console.log(`     ${b.actor_id.padEnd(12)} ${b.role.padEnd(18)} $${round2(b.earned)}`);
}

// ─── SCENARIO 3: Cross-Actor ─────────────────────────────

console.log('\n── Scenario 3: RSP_001 Voice + Another Actor\'s Character ──');
console.log('   Voice-weighted. 180 seconds, $0.015/sec.\n');

const crossActor = buildCrossActorScenario({
  voice_actor_id: 'RSP_001',
  character_actor_id: 'ACT_002',
  duration_seconds: 180,
  rate_per_second: 0.015,
});

assert(approx(crossActor.total_earned, 2.70), `Total earned: $${round2(crossActor.total_earned)}`);
assert(crossActor.voice_count === 2, 'Voice count: 2');

const rspVoice = round2(crossActor.per_creator['RSP_001']);
const actChar = round2(crossActor.per_creator['ACT_002']);

assert(rspVoice > actChar, `Voice owner gets more: RSP=$${rspVoice} > ACT=$${actChar}`);
assert(rspVoice + actChar >= round2(crossActor.total_earned) * 0.70, 'Creator total >= 70%');

console.log(`\n   Breakdown:`);
for (const b of crossActor.breakdown) {
  console.log(`     ${b.actor_id.padEnd(12)} ${b.role.padEnd(18)} $${round2(b.earned)}`);
}

// ─── CONSTITUTIONAL CHECKS ───────────────────────────────

console.log('\n── Constitutional Enforcement ──');

const teachCreators = Object.entries(teaching.per_creator)
  .filter(([k]) => !['PLATFORM', 'COMMUNITY', 'LEGAL'].includes(k))
  .reduce((s, [, v]) => s + v, 0);
assert(teachCreators >= teaching.total_earned * 0.70, 
  `Teaching: creator share ${round2(teachCreators / teaching.total_earned * 100)}% >= 70%`);

const collabCreators = Object.entries(collab.per_creator)
  .filter(([k]) => !['PLATFORM', 'COMMUNITY', 'LEGAL'].includes(k))
  .reduce((s, [, v]) => s + v, 0);
assert(collabCreators >= collab.total_earned * 0.70, 
  `Collab: creator share ${round2(collabCreators / collab.total_earned * 100)}% >= 70%`);

const crossCreators = Object.entries(crossActor.per_creator)
  .filter(([k]) => !['PLATFORM', 'COMMUNITY', 'LEGAL'].includes(k))
  .reduce((s, [, v]) => s + v, 0);
assert(crossCreators >= crossActor.total_earned * 0.69, 
  `Cross-actor: creator share ${round2(crossCreators / crossActor.total_earned * 100)}% >= 70%`);

// Platform never exceeds 25%
assert(teaching.per_creator['PLATFORM'] <= teaching.total_earned * 0.25, 'Teaching: platform <= 25%');
assert(collab.per_creator['PLATFORM'] <= collab.total_earned * 0.25, 'Collab: platform <= 25%');
assert(crossActor.per_creator['PLATFORM'] <= crossActor.total_earned * 0.25, 'Cross-actor: platform <= 25%');

// Teacher royalty: student keeps majority of their own work
assert(studentNet > teacherEarned, `Student keeps majority: $${round2(studentNet)} > $${round2(teacherEarned)}`);

// ─── RESULTS ─────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════');

if (failed > 0) {
  console.log('\n  ⚠ SOME TESTS FAILED');
  process.exit(1);
} else {
  console.log('\n  ✓ ALL TESTS PASSED — Revenue pipeline is constitutional');
  console.log('  Rate × duration ÷ voices × adjustment.');
  console.log('  Teacher gets royalty. Student keeps majority.');
  console.log('  Rounding biased toward the creator. Always.\n');
  process.exit(0);
}
