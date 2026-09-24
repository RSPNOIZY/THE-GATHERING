/**
 * RSP001 ACTOR PROTOCOL — Smoke Test
 * 
 * Runs the full break-word → direction → preview → approval loop.
 * Validates the state machine, parser, and session logger.
 * 
 * Run: npx tsx src/fixtures/smoke-test.ts
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { RSP001_IMPRINT, STERN_BRITISH_GANGSTER } from './rsp001';
import { PerformanceStateMachine } from '../engine/stateMachine';
import { BreakWordParser } from '../engine/breakWordParser';

// ─── SETUP ───────────────────────────────────────────────

console.log('═══════════════════════════════════════════════');
console.log('  RSP001 ACTOR PROTOCOL — SMOKE TEST');
console.log('═══════════════════════════════════════════════\n');

const machine = new PerformanceStateMachine(RSP001_IMPRINT, STERN_BRITISH_GANGSTER);
const parser = new BreakWordParser({ phrase: RSP001_IMPRINT.break_word });

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

// ─── TEST 1: Initial state ───────────────────────────────

console.log('\n── Test 1: Initial State ──');
assert(machine.currentMode === 'CHARACTER', 'Starts in CHARACTER mode');
assert(machine.actorId === 'RSP_001', 'Actor ID is RSP_001');
assert(machine.characterId === 'stern_british_gangster', 'Character loaded');

// ─── TEST 2: Break-word parser ───────────────────────────

console.log('\n── Test 2: Break-Word Parser ──');

const exact = parser.parse('Break character.');
assert(exact.detected === true, 'Detects exact break-word');
assert(exact.match_type === 'exact', 'Match type is exact');
assert(exact.latency_ms < 5, `Latency under 5ms (${exact.latency_ms.toFixed(3)}ms)`);

const alt = parser.parse('Drop character, please.');
assert(alt.detected === true, 'Detects alternative phrase "drop character"');
assert(alt.match_type === 'alternative', 'Match type is alternative');

const embedded = parser.parse('I think we should break character here');
assert(embedded.detected === true, 'Detects embedded break-word');
assert(embedded.remaining_text === 'here', 'Extracts remaining text after break-word');

const negative = parser.parse('Keep going, this is great!');
assert(negative.detected === false, 'Does not false-positive on normal speech');

const quick = parser.detect('break character');
assert(quick === true, 'Quick detect returns true for break-word');

// ─── TEST 3: State transitions ───────────────────────────

console.log('\n── Test 3: State Transitions ──');

// CHARACTER → ACTOR (break-word)
const breakEvent = machine.breakCharacter();
assert(machine.currentMode === 'ACTOR', 'Break-word transitions to ACTOR');
assert(breakEvent.triggered_by_break_word === true, 'Event records break-word trigger');
assert(breakEvent.gabriel_ingested === false, 'Event not ingested by Gabriel');

// ACTOR → DIRECTION_INTAKE
const dirEvent = machine.receiveDirection(
  'Less aggressive. More confident. He doesn\'t need to prove it.',
  'Reduce threat, increase authority. Confidence without force.',
  'client',
  'tone',
  0.95,
);
assert(machine.currentMode === 'DIRECTION_INTAKE', 'Direction transitions to DIRECTION_INTAKE');
assert(dirEvent.category === 'tone', 'Direction category is tone');
assert(dirEvent.interpretation_confidence === 0.95, 'Confidence recorded');

// DIRECTION_INTAKE → RENDER_PREVIEW
const previewTake = machine.renderPreview(
  'Hello, my lovelies. I\'ve been doing this since I was knee-high to a fire hydrant.',
);
assert(machine.currentMode === 'RENDER_PREVIEW', 'Preview transitions to RENDER_PREVIEW');
assert(previewTake.status === 'preview', 'Take status is preview');
assert(previewTake.preview === true, 'Take is marked as preview');
assert(previewTake.voice_ip_retained === true, 'Voice IP retained');

// RENDER_PREVIEW → LOCKED_TAKE (approval)
const blessed = machine.approveTake(previewTake.take_id, 'client');
assert(machine.currentMode === 'LOCKED_TAKE', 'Approval transitions to LOCKED_TAKE');
assert(blessed.blessed === true, 'Take is blessed');
assert(blessed.status === 'blessed', 'Take status is blessed');
assert(blessed.approved_by === 'client', 'Approved by client');

// LOCKED_TAKE → CHARACTER (re-enter)
machine.enterCharacter();
assert(machine.currentMode === 'CHARACTER', 'Re-enters CHARACTER mode');

// ─── Test 4: Illegal transitions ─────────────────────────

console.log('\n── Test 4: Illegal Transitions ──');

let threw = false;
try {
  // CHARACTER cannot go directly to LOCKED_TAKE
  machine.approveTake('fake-id');
} catch (e) {
  threw = true;
}
assert(threw === true, 'Rejects illegal transition (CHARACTER → LOCKED_TAKE)');

// ─── Test 5: Session export ──────────────────────────────

console.log('\n── Test 5: Session Export ──');

const session = machine.exportSession();
assert(session.total_events === 2, 'Session has 2 events (break + direction)');
assert(session.total_takes === 1, 'Session has 1 take');
assert(session.blessed_takes === 1, 'Session has 1 blessed take');
assert(session.actor_id === 'RSP_001', 'Export contains correct actor_id');

// ─── RESULTS ─────────────────────────────────────────────

console.log('\n═══════════════════════════════════════════════');
console.log(`  RESULTS: ${passed} passed, ${failed} failed`);
console.log('═══════════════════════════════════════════════');

if (failed > 0) {
  console.log('\n  ⚠ SOME TESTS FAILED — review above');
  process.exit(1);
} else {
  console.log('\n  ✓ ALL TESTS PASSED — RSP001 Actor Protocol is operational');
  console.log('  The actor is sovereign. The character is a layer.');
  console.log('  Direction never overwrites identity.\n');
  process.exit(0);
}
