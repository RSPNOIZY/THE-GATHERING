/**
 * NOIZY.AI — 100-Year Immutable Royalty Ledger — Smoke Test
 * 
 * Tests chain integrity, constitutional enforcement,
 * teaching royalties, estate inheritance, corrections,
 * and tamper detection.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import {
  appendEntry,
  getLedger,
  verifyChain,
  getActorTotal,
  resetLedger,
  GENESIS_HASH,
  RoyaltyLedgerEntrySchema,
  computeEntryHash,
} from './royalty-ledger';

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

// ═══════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════');
console.log('  100-YEAR IMMUTABLE ROYALTY LEDGER — Tests');
console.log('═══════════════════════════════════════════════\n');

// ─── 1. CHAIN INTEGRITY ─────────────────────────────────
console.log('  § Chain Integrity\n');

resetLedger();

test('Genesis hash is 64 zeros', () => {
  assert(GENESIS_HASH === '0'.repeat(64), 'Genesis hash must be 64 zeros');
});

test('First entry links to genesis', () => {
  const entry = appendEntry({
    event_type: 'playback_earning',
    to_actor_id: 'RSP_001',
    amount: 1.50,
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
  });
  assert(entry.previous_hash === GENESIS_HASH, 'First entry must reference genesis');
  assert(entry.sequence_number === 1, 'First sequence must be 1');
  assert(entry.entry_hash.length === 64, 'Hash must be 64 chars');
});

test('Second entry chains to first', () => {
  const first = getLedger()[0];
  const entry = appendEntry({
    event_type: 'platform_fee',
    to_actor_id: 'PLT_001',
    amount: 0.30,
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
  });
  assert(entry.previous_hash === first.entry_hash, 'Second must chain to first');
  assert(entry.sequence_number === 2, 'Second sequence must be 2');
});

test('Chain verification passes on valid chain', () => {
  const result = verifyChain(getLedger());
  assert(result.valid === true, `Chain should be valid: ${result.reason}`);
});

test('Tampered chain is detected', () => {
  const chain = getLedger();
  // Tamper with amount
  const tampered = [...chain];
  tampered[0] = { ...tampered[0], amount: 9999 };
  const result = verifyChain(tampered);
  assert(result.valid === false, 'Tampered chain should be invalid');
  assert(result.broken_at === 0, 'Should detect tamper at entry 0');
});

test('Broken chain link is detected', () => {
  const chain = getLedger();
  const broken = [...chain];
  broken[1] = { ...broken[1], previous_hash: '0'.repeat(64) };
  const result = verifyChain(broken);
  assert(result.valid === false, 'Broken link should be detected');
});

// ─── 2. CONSTITUTIONAL ENFORCEMENT ──────────────────────
console.log('\n  § Constitutional Enforcement\n');

resetLedger();

test('Entry records constitutional shares at time of creation', () => {
  const entry = appendEntry({
    event_type: 'playback_earning',
    to_actor_id: 'RSP_001',
    amount: 2.55,
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
  });
  assert(entry.creator_share_at_time === 0.85, 'Must record 85%');
  assert(entry.platform_share_at_time === 0.10, 'Must record 10%');
});

test('Schema validates entry', () => {
  const entry = getLedger()[0];
  const result = RoyaltyLedgerEntrySchema.safeParse(entry);
  assert(result.success, `Entry should validate: ${result.error?.message}`);
});

test('Schema rejects creator share below 70%', () => {
  const entry = getLedger()[0];
  const bad = { ...entry, creator_share_at_time: 0.50 };
  const result = RoyaltyLedgerEntrySchema.safeParse(bad);
  assert(!result.success, 'Should reject < 70% creator share');
});

test('Schema rejects platform share above 25%', () => {
  const entry = getLedger()[0];
  const bad = { ...entry, platform_share_at_time: 0.30 };
  const result = RoyaltyLedgerEntrySchema.safeParse(bad);
  assert(!result.success, 'Should reject > 25% platform share');
});

// ─── 3. TEACHING ROYALTIES ──────────────────────────────
console.log('\n  § Teaching Royalties\n');

resetLedger();

test('Teaching royalty records teacher and student', () => {
  const entry = appendEntry({
    event_type: 'teaching_royalty',
    to_actor_id: 'RSP_001',
    from_actor_id: 'STU_001',
    amount: 0.47,
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
    is_teaching_royalty: true,
    teacher_id: 'RSP_001',
    student_id: 'STU_001',
  });
  assert(entry.is_teaching_royalty === true, 'Must flag as teaching royalty');
  assert(entry.teacher_id === 'RSP_001', 'Must record teacher');
  assert(entry.student_id === 'STU_001', 'Must record student');
});

// ─── 4. ESTATE INHERITANCE ──────────────────────────────
console.log('\n  § Estate & Inheritance\n');

resetLedger();

test('Descendant inheritance tracks generation', () => {
  // Original creator earns
  appendEntry({
    event_type: 'playback_earning',
    to_actor_id: 'RSP_001',
    amount: 100.00,
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
    generation: 0,
  });
  
  // Estate transfer to heir
  const transfer = appendEntry({
    event_type: 'estate_transfer',
    to_actor_id: 'RSP_002',
    from_actor_id: 'RSP_001',
    amount: 0, // Transfer event, not payment
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
    generation: 1,
    estate_id: 'ESTATE_RSP_001',
    beneficiary_relationship: 'child',
  });
  assert(transfer.generation === 1, 'Heir is generation 1');
  assert(transfer.estate_id === 'ESTATE_RSP_001', 'Estate ID recorded');
  
  // Heir earns descendant royalty
  const inheritance = appendEntry({
    event_type: 'descendant_inheritance',
    to_actor_id: 'RSP_002',
    amount: 50.00,
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
    generation: 1,
    estate_id: 'ESTATE_RSP_001',
    beneficiary_relationship: 'child',
  });
  assert(inheritance.generation === 1, 'Inheritance is gen 1');
});

test('Chain still valid after inheritance entries', () => {
  const result = verifyChain(getLedger());
  assert(result.valid === true, `Chain should remain valid: ${result.reason}`);
});

// ─── 5. CORRECTIONS ─────────────────────────────────────
console.log('\n  § Corrections (Append-Only)\n');

resetLedger();

test('Correction links to original entry', () => {
  const original = appendEntry({
    event_type: 'playback_earning',
    to_actor_id: 'RSP_001',
    amount: 1.50,
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
  });
  
  const correction = appendEntry({
    event_type: 'correction',
    to_actor_id: 'RSP_001',
    amount: 0.15, // Underpaid by $0.15
    creator_share_at_time: 0.85,
    platform_share_at_time: 0.10,
    corrects_entry_id: original.entry_id,
    correction_reason: 'Rounding error in collaboration split',
  });
  
  assert(correction.corrects_entry_id === original.entry_id, 'Must link to original');
  assert(correction.correction_reason !== undefined, 'Must have reason');
  assert(correction.event_type === 'correction', 'Type must be correction');
});

test('Corrections do not modify original (append-only)', () => {
  const chain = getLedger();
  assert(chain.length === 2, 'Should have 2 entries (original + correction)');
  assert(chain[0].amount === 1.50, 'Original amount unchanged');
  assert(chain[1].amount === 0.15, 'Correction is a new entry');
});

// ─── 6. ACTOR TOTALS ────────────────────────────────────
console.log('\n  § Actor Totals\n');

resetLedger();

test('Actor total aggregates correctly', () => {
  appendEntry({ event_type: 'playback_earning', to_actor_id: 'RSP_001', amount: 10, creator_share_at_time: 0.85, platform_share_at_time: 0.10 });
  appendEntry({ event_type: 'teaching_royalty', to_actor_id: 'RSP_001', amount: 5, creator_share_at_time: 0.85, platform_share_at_time: 0.10, is_teaching_royalty: true });
  appendEntry({ event_type: 'voice_licensing_fee', to_actor_id: 'RSP_001', amount: 25, creator_share_at_time: 0.85, platform_share_at_time: 0.10 });
  appendEntry({ event_type: 'platform_fee', to_actor_id: 'PLT_001', amount: 3, creator_share_at_time: 0.85, platform_share_at_time: 0.10 });
  
  const rspTotal = getActorTotal('RSP_001');
  assert(rspTotal.total_earned === 40, `RSP should earn $40, got $${rspTotal.total_earned}`);
  assert(rspTotal.entry_count === 3, 'RSP should have 3 entries');
  assert(rspTotal.by_type['playback_earning'] === 10, 'Playback should be $10');
  assert(rspTotal.by_type['teaching_royalty'] === 5, 'Teaching should be $5');
  assert(rspTotal.by_type['voice_licensing_fee'] === 25, 'Licensing should be $25');
  
  const pltTotal = getActorTotal('PLT_001');
  assert(pltTotal.total_earned === 3, 'Platform should earn $3');
});

test('Full chain still valid', () => {
  const result = verifyChain(getLedger());
  assert(result.valid === true, `Chain must be valid: ${result.reason}`);
});

// ─── 7. SCALE TEST ──────────────────────────────────────
console.log('\n  § Scale (100 entries)\n');

resetLedger();

test('100-entry chain builds and verifies', () => {
  for (let i = 0; i < 100; i++) {
    appendEntry({
      event_type: 'playback_earning',
      to_actor_id: 'RSP_001',
      amount: Math.round(Math.random() * 100) / 100,
      creator_share_at_time: 0.85,
      platform_share_at_time: 0.10,
    });
  }
  const chain = getLedger();
  assert(chain.length === 100, 'Should have 100 entries');
  
  const result = verifyChain(chain);
  assert(result.valid === true, `100-entry chain must verify: ${result.reason}`);
});

// ─── RESULTS ─────────────────────────────────────────────
console.log('\n═══════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed of ${passed + failed}`);

if (failures.length > 0) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

console.log('\n  One hundred years from now, the royalties still flow.');
console.log('  That\'s not a feature. That\'s a promise to the future.');
console.log('═══════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
