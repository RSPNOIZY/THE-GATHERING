/**
 * LUCY — Smoke Test Suite
 * 
 * Validates all schemas, compassion framework, nightly analysis,
 * and n8n bridge. Every test must pass before Lucy runs live.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { v4 as uuidv4 } from 'uuid';
import {
  LUCY_IDENTITY,
  InsightDimensionSchema,
  CreatorReadinessSchema,
  OpportunitySchema,
  NightlyReportSchema,
  WellbeingDimensionSchema,
  CompassionAssessmentSchema,
  AdaptationRecordSchema,
  assessCompassion,
  runNightlyAnalysis,
  convertToN8nFeed,
  generateCreatorNotifications,
} from './index';

// ─── TEST RUNNER ─────────────────────────────────────────

let passed = 0;
let failed = 0;
const failures: string[] = [];
const asyncTests: Promise<void>[] = [];

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

function testAsync(name: string, fn: () => Promise<void>) {
  const testPromise = (async () => {
    try {
      await fn();
      passed++;
      console.log(`  ✅ ${name}`);
    } catch (e: any) {
      failed++;
      failures.push(`${name}: ${e.message}`);
      console.log(`  ❌ ${name}: ${e.message}`);
    }
  })();
  asyncTests.push(testPromise);
}

function assert(condition: boolean, msg: string) {
  if (!condition) throw new Error(msg);
}

// ═══════════════════════════════════════════════════════════
console.log('═══════════════════════════════════════════════');
console.log('  LUCY — Smoke Test Suite');
console.log('═══════════════════════════════════════════════\n');

// ─── 1. IDENTITY ─────────────────────────────────────────
console.log('  § Identity\n');

test('Lucy identity is defined', () => {
  assert(LUCY_IDENTITY.name === 'Lucy', 'Name should be Lucy');
  assert(LUCY_IDENTITY.role === 'Nightly Deep Analysis Engine', 'Wrong role');
  assert(LUCY_IDENTITY.cadence === 'nightly', 'Should run nightly');
  assert(LUCY_IDENTITY.rule === 'Lucy thinks. n8n acts. Humans decide.', 'Wrong rule');
});

// ─── 2. INSIGHT DIMENSIONS ──────────────────────────────
console.log('\n  § Insight Dimensions\n');

test('All 10 insight dimensions valid', () => {
  const dims = [
    'creative_resonance', 'teaching_effectiveness', 'collaboration_chemistry',
    'audience_pattern', 'revenue_trajectory', 'consent_health',
    'community_sentiment', 'cultural_context', 'risk_signal', 'opportunity_emergence',
  ];
  dims.forEach(d => {
    const result = InsightDimensionSchema.safeParse(d);
    assert(result.success, `Dimension ${d} should be valid`);
  });
});

test('Invalid dimension rejected', () => {
  const result = InsightDimensionSchema.safeParse('not_a_dimension');
  assert(!result.success, 'Should reject invalid dimension');
});

// ─── 3. WELLBEING DIMENSIONS ────────────────────────────
console.log('\n  § Wellbeing Dimensions\n');

test('All 10 wellbeing dimensions valid', () => {
  const dims = [
    'creative_fulfillment', 'economic_stability', 'skill_growth',
    'community_belonging', 'autonomy', 'workload_health',
    'emotional_safety', 'legacy_alignment', 'family_impact', 'cultural_respect',
  ];
  dims.forEach(d => {
    const result = WellbeingDimensionSchema.safeParse(d);
    assert(result.success, `Dimension ${d} should be valid`);
  });
});

// ─── 4. COMPASSION ASSESSMENT ───────────────────────────
console.log('\n  § Compassion Framework\n');

test('Positive assessment clears gate', () => {
  const result = assessCompassion({
    actor_id: 'RSP_001',
    opportunity_id: uuidv4(),
    dimensions: [
      { dimension: 'creative_fulfillment', score: 0.8, reasoning: 'Aligned with vision' },
      { dimension: 'economic_stability', score: 0.6, reasoning: 'Revenue positive' },
      { dimension: 'autonomy', score: 0.7, reasoning: 'Increases independence' },
    ],
  });
  assert(result.cleared === true, 'Should clear gate');
  assert(result.composite_score > 0, 'Composite should be positive');
  assert(!result.requires_human_override, 'No override needed');
});

test('Negative assessment blocks gate', () => {
  const result = assessCompassion({
    actor_id: 'RSP_001',
    opportunity_id: uuidv4(),
    dimensions: [
      { dimension: 'workload_health', score: -0.8, reasoning: 'Would cause burnout' },
      { dimension: 'emotional_safety', score: -0.6, reasoning: 'Too stressful right now' },
      { dimension: 'economic_stability', score: 0.3, reasoning: 'Small upside' },
    ],
  });
  assert(result.cleared === false, 'Should block gate');
  assert(result.composite_score < 0, `Composite should be negative, got ${result.composite_score}`);
});

test('Critical negative triggers human override', () => {
  const result = assessCompassion({
    actor_id: 'RSP_001',
    opportunity_id: uuidv4(),
    dimensions: [
      { dimension: 'creative_fulfillment', score: 0.9, reasoning: 'Exciting' },
      { dimension: 'economic_stability', score: 0.8, reasoning: 'High revenue' },
      { dimension: 'family_impact', score: -0.7, reasoning: 'Would take time from family' },
      { dimension: 'autonomy', score: 0.5, reasoning: 'Some increase' },
    ],
  });
  assert(result.requires_human_override === true, 'Should require override');
  assert(result.cleared === false, 'Should not auto-clear with critical negative');
});

test('All-neutral assessment blocks (conservative)', () => {
  const result = assessCompassion({
    actor_id: 'RSP_001',
    opportunity_id: uuidv4(),
    dimensions: [
      { dimension: 'creative_fulfillment', score: 0, reasoning: 'No impact' },
      { dimension: 'economic_stability', score: 0, reasoning: 'No impact' },
    ],
  });
  assert(result.cleared === false, 'Zero composite should not clear');
  assert(result.composite_score === 0, 'Composite should be exactly 0');
});

test('Weighted dimensions shift composite', () => {
  const result = assessCompassion({
    actor_id: 'RSP_001',
    opportunity_id: uuidv4(),
    dimensions: [
      { dimension: 'creative_fulfillment', score: -0.3, reasoning: 'Slight negative', weight: 0.2 },
      { dimension: 'economic_stability', score: 0.9, reasoning: 'Strong positive', weight: 1.0 },
    ],
  });
  // Weighted: (-0.3 * 0.2 + 0.9 * 1.0) / (0.2 + 1.0) = 0.84 / 1.2 = 0.7
  assert(result.cleared === true, 'Heavy economic weight should clear');
  assert(result.composite_score > 0.5, `Expected > 0.5, got ${result.composite_score}`);
});

// ─── 5. SCHEMA VALIDATION ───────────────────────────────
console.log('\n  § Schema Validation\n');

test('CreatorReadiness validates RSP_001', () => {
  const result = CreatorReadinessSchema.safeParse({
    actor_id: 'RSP_001',
    ready_for: ['teaching_role', 'voice_licensing'],
    reasoning: 'Founding creator with locked imprint and tested pipeline',
    confidence: 0.9,
    evidence: [
      { source: 'actor-protocol', observation: '32/32 passing', weight: 0.8 },
    ],
    urgency: 'now',
    compassion_assessment: 'This serves RSP_001 mission and wellbeing',
  });
  assert(result.success, `CreatorReadiness should validate: ${result.error?.message}`);
});

test('CreatorReadiness rejects bad actor_id', () => {
  const result = CreatorReadinessSchema.safeParse({
    actor_id: 'invalid',
    ready_for: ['teaching_role'],
    reasoning: 'Testing',
    confidence: 0.5,
    evidence: [],
    urgency: 'now',
    compassion_assessment: 'Test',
  });
  assert(!result.success, 'Should reject invalid actor_id format');
});

test('Opportunity schema validates', () => {
  const result = OpportunitySchema.safeParse({
    id: uuidv4(),
    title: 'Test opportunity',
    description: 'A test opportunity for validation',
    insight_type: 'revenue_unlock',
    dimensions_analyzed: ['revenue_trajectory'],
    actors_involved: ['RSP_001'],
    brands_involved: ['NOIZYVOX'],
    reasoning_chain: [
      { step: 1, thought: 'Test thought', dimension: 'revenue_trajectory', confidence_delta: 0.1 },
    ],
    confidence: 0.8,
    urgency: 'this_week',
    suggested_actions: [
      { action: 'Test action', executor: 'human', priority: 1 },
    ],
    compassion_cleared: true,
    requires_decision: false,
    discovered_at: new Date().toISOString(),
    analysis_run_id: 'test-run',
    gabriel_ingested: false,
  });
  assert(result.success, `Opportunity should validate: ${result.error?.message}`);
});

test('CompassionAssessment schema validates', () => {
  const result = CompassionAssessmentSchema.safeParse({
    actor_id: 'RSP_001',
    opportunity_id: uuidv4(),
    dimensions: [
      { dimension: 'creative_fulfillment', score: 0.8, reasoning: 'Aligned', weight: 1 },
    ],
    composite_score: 0.8,
    cleared: true,
    gate_reasoning: 'Cleared with strong alignment',
    requires_human_override: false,
    assessed_at: new Date().toISOString(),
  });
  assert(result.success, `CompassionAssessment should validate: ${result.error?.message}`);
});

test('AdaptationRecord schema validates', () => {
  const result = AdaptationRecordSchema.safeParse({
    id: uuidv4(),
    actor_id: 'RSP_001',
    original_assessment_id: uuidv4(),
    original_decision: 'cleared',
    actual_outcome: 'positive',
    lesson: 'RSP_001 thrives when given teaching opportunities — weight creative_fulfillment higher',
    dimension_adjustments: [
      { dimension: 'creative_fulfillment', old_weight: 1.0, new_weight: 1.2, reason: 'Teaching energizes' },
    ],
    creator_insight: 'RSP_001 draws energy from mentoring others. Teaching is fuel, not drain.',
    recorded_at: new Date().toISOString(),
    gabriel_ingested: false,
  });
  assert(result.success, `AdaptationRecord should validate: ${result.error?.message}`);
});

// ─── 6. NIGHTLY ANALYSIS ────────────────────────────────
console.log('\n  § Nightly Analysis Engine\n');

test('Nightly analysis runs and produces report', () => {
  const report = runNightlyAnalysis();
  assert(report.report_id.length > 0, 'Should have report ID');
  assert(report.date.length === 10, 'Should have YYYY-MM-DD date');
  assert(report.opportunities.length > 0, 'Should find at least one opportunity');
  assert(report.risks.length > 0, 'Should flag at least one risk');
  assert(report.executive_summary.length > 20, 'Should have substantive summary');
  assert(report.top_three.length >= 1 && report.top_three.length <= 3, 'Should have 1-3 top actions');
});

test('Report validates against NightlyReportSchema', () => {
  const report = runNightlyAnalysis();
  const result = NightlyReportSchema.safeParse(report);
  assert(result.success, `Report should validate: ${result.error?.message}`);
});

test('All opportunities have compassion assessment', () => {
  const report = runNightlyAnalysis();
  for (const opp of report.opportunities) {
    assert(typeof opp.compassion_cleared === 'boolean', `${opp.title} missing compassion_cleared`);
  }
});

test('Report is not pre-blessed', () => {
  const report = runNightlyAnalysis();
  assert(report.blessed === false, 'Report should not be pre-blessed');
  assert(report.blessed_by === undefined, 'blessed_by should be undefined');
});

// ─── 7. N8N BRIDGE ──────────────────────────────────────
console.log('\n  § n8n Bridge\n');

testAsync('Converts report to n8n feed', async () => {
  const report = runNightlyAnalysis();
  const feed = await convertToN8nFeed(report);
  assert(feed.actions.length > 0, 'Should have actions');
  assert(feed.total_actions === feed.actions.length, 'Total should match');
  assert(
    feed.total_actions === feed.n8n_actions + feed.human_actions + feed.claude_code_actions,
    'Action counts should sum correctly',
  );
});

testAsync('Actions sorted by priority', async () => {
  const report = runNightlyAnalysis();
  const feed = await convertToN8nFeed(report);
  for (let i = 1; i < feed.actions.length; i++) {
    assert(
      feed.actions[i].priority >= feed.actions[i - 1].priority,
      'Actions should be sorted by priority ascending',
    );
  }
});

testAsync('Only compassion-cleared opportunities generate actions', async () => {
  const report = runNightlyAnalysis();
  const feed = await convertToN8nFeed(report);
  for (const action of feed.actions) {
    assert(action.compassion_cleared === true, 'All actions must be compassion-cleared');
  }
});

test('Creator notifications generated', () => {
  const report = runNightlyAnalysis();
  const notifications = generateCreatorNotifications(report);
  assert(notifications.length > 0, 'Should generate notifications');
  for (const n of notifications) {
    assert(n.actor_id.length > 0, 'Must have actor_id');
    assert(n.message.startsWith('Lucy discovered:'), 'Should start with Lucy discovered:');
  }
});

testAsync('All actions have governance fields', async () => {
  const report = runNightlyAnalysis();
  const feed = await convertToN8nFeed(report);
  for (const action of feed.actions) {
    assert(typeof action.requires_human_approval === 'boolean', 'Must have requires_human_approval');
    assert(typeof action.compassion_cleared === 'boolean', 'Must have compassion_cleared');
    assert(action.status === 'queued', 'New actions should be queued');
  }
});

// ─── RESULTS ─────────────────────────────────────────────
await Promise.all(asyncTests);
console.log('\n═══════════════════════════════════════════════');
console.log(`  Results: ${passed} passed, ${failed} failed of ${passed + failed}`);

if (failures.length > 0) {
  console.log('\n  Failures:');
  failures.forEach(f => console.log(`    ✗ ${f}`));
}

console.log('\n  Lucy thinks. n8n acts. Humans decide.');
console.log('═══════════════════════════════════════════════\n');

process.exit(failed > 0 ? 1 : 0);
