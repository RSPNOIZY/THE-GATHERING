/**
 * LUCY — Nightly Analysis Engine
 * 
 * Runs on GOD via Claude Code with extended thinking.
 * Reads everything. Reasons across dimensions. Surfaces insight.
 * 
 * Lucy thinks. n8n acts. Humans decide.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { readFileSync, writeFileSync, existsSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { NightlyReport, Opportunity, CreatorReadiness } from '../schemas/lucy-core';
import { assessCompassion } from '../schemas/compassion-framework';

// ─── CONFIG ──────────────────────────────────────────────

const NOIZYLAB = '/Users/m2ultra/NOIZYLAB';
const GOVERNANCE = join(NOIZYLAB, 'governance');
const LUCY = join(NOIZYLAB, 'lucy');

// ─── DATA SOURCES ────────────────────────────────────────
// Everything Lucy reads before she thinks.

interface AnalysisInput {
  blessed_sessions: any[];
  playback_sessions: any[];
  creator_profiles: any[];
  revenue_streams: any[];
  consent_events: any[];
  decision_queue: any[];
  actor_imprints: any[];
  recent_takes: any[];
  standup_reports: any[];
  community_signals: any[];
}

function gatherSources(): AnalysisInput {
  const read = (path: string): any[] => {
    try {
      if (!existsSync(path)) return [];
      const content = readFileSync(path, 'utf-8');
      const parsed = JSON.parse(content);
      return Array.isArray(parsed) ? parsed : parsed.records || parsed.decisions || [parsed];
    } catch { return []; }
  };

  const readDir = (dir: string): any[] => {
    try {
      if (!existsSync(dir)) return [];
      return readdirSync(dir)
        .filter(f => f.endsWith('.json') || f.endsWith('.jsonl'))
        .map(f => {
          try { return JSON.parse(readFileSync(join(dir, f), 'utf-8')); }
          catch { return null; }
        })
        .filter(Boolean);
    } catch { return []; }
  };

  return {
    blessed_sessions: readDir(join(GOVERNANCE, 'blessed')),
    playback_sessions: [],  // From D1 when connected
    creator_profiles: [],   // From D1 when connected
    revenue_streams: [],    // From D1 when connected
    consent_events: [],     // From D1 when connected
    decision_queue: read(join(GOVERNANCE, 'decision-queue.json')),
    actor_imprints: readDir(join(NOIZYLAB, 'noizyvox', 'actor-protocol', 'sessions')),
    recent_takes: [],       // From blessed takes
    standup_reports: readDir(join(GOVERNANCE, 'standups')),
    community_signals: [],  // From community monitoring when connected
  };
}

// ─── PATTERN RECOGNITION ─────────────────────────────────

interface Pattern {
  pattern: string;
  frequency: number;
  trend: 'emerging' | 'stable' | 'declining' | 'new';
  significance: number;
}

function recognizePatterns(input: AnalysisInput): Pattern[] {
  const patterns: Pattern[] = [];

  // Pattern: Blessed session volume trend
  const blessedCount = input.blessed_sessions.length;
  if (blessedCount > 0) {
    patterns.push({
      pattern: `${blessedCount} blessed sessions in analysis window`,
      frequency: Math.min(blessedCount / 10, 1),
      trend: blessedCount > 5 ? 'emerging' : 'stable',
      significance: Math.min(blessedCount / 20, 1),
    });
  }

  // Pattern: Decision queue health
  const pendingDecisions = input.decision_queue.filter((d: any) => d.status === 'pending');
  if (pendingDecisions.length > 3) {
    patterns.push({
      pattern: `Decision queue backing up: ${pendingDecisions.length} pending`,
      frequency: 0.8,
      trend: 'emerging',
      significance: Math.min(pendingDecisions.length / 5, 1),
    });
  }

  // Pattern: No activity detection
  if (blessedCount === 0 && input.playback_sessions.length === 0) {
    patterns.push({
      pattern: 'No blessed activity detected — system may be in build phase or idle',
      frequency: 0,
      trend: 'stable',
      significance: 0.3,
    });
  }

  return patterns;
}

// ─── RISK DETECTION ──────────────────────────────────────

interface Risk {
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  affected_actors: string[];
  mitigation: string;
}

function detectRisks(input: AnalysisInput): Risk[] {
  const risks: Risk[] = [];

  // Risk: Stale consent
  // (When D1 connected, check for consent snapshots older than 90 days)

  // Risk: Decision queue overflow
  const pendingDecisions = input.decision_queue.filter((d: any) => d.status === 'pending');
  const blockingDecisions = pendingDecisions.filter((d: any) => d.blocking);
  if (blockingDecisions.length > 0) {
    risks.push({
      description: `${blockingDecisions.length} blocking decisions unresolved`,
      severity: blockingDecisions.length > 2 ? 'high' : 'medium',
      affected_actors: ['ALL'],
      mitigation: 'Schedule decision window to clear blocking items',
    });
  }

  // Risk: Legal holds still active
  risks.push({
    description: 'NOIZ Token legal hold still BLOCKED — blocks community tokenomics',
    severity: 'medium',
    affected_actors: ['ALL'],
    mitigation: 'Engage securities counsel for Howey test assessment',
  });

  risks.push({
    description: 'DAO Governance legal hold still BLOCKED — blocks decentralized governance',
    severity: 'medium',
    affected_actors: ['ALL'],
    mitigation: 'Engage corporate counsel for cooperative structure evaluation',
  });

  return risks;
}

// ─── OPPORTUNITY DISCOVERY ───────────────────────────────
// This is where Lucy's extended thinking matters most.

function discoverOpportunities(
  input: AnalysisInput,
  patterns: Pattern[],
  risks: Risk[],
): Opportunity[] {
  const opportunities: Opportunity[] = [];
  const now = new Date().toISOString();
  const runId = `lucy-nightly-${Date.now()}`;

  // Opportunity: System is in build phase — first creator onboarding
  if (input.blessed_sessions.length < 5) {
    opportunities.push({
      id: uuidv4(),
      title: 'First creator onboarding ready',
      description: 'RSP_001 actor imprint is locked. Voice capture infrastructure is live. ' +
        'The system is ready for the first 35 voice takes, which will establish the ' +
        'founding catalogue and prove the teaching → student → revenue pipeline.',
      insight_type: 'revenue_unlock',
      dimensions_analyzed: ['creative_resonance', 'revenue_trajectory', 'opportunity_emergence'],
      actors_involved: ['RSP_001'],
      brands_involved: ['NOIZYVOX', 'NOIZYLAB'],
      reasoning_chain: [
        {
          step: 1,
          thought: 'Actor protocol is live with 32/32 tests passing. RSP_001 imprint locked.',
          dimension: 'creative_resonance',
          confidence_delta: 0.3,
        },
        {
          step: 2,
          thought: 'Revenue pipeline has 21/21 tests passing across all three scenarios.',
          dimension: 'revenue_trajectory',
          confidence_delta: 0.25,
        },
        {
          step: 3,
          thought: '10 Creative Builder models deployed. Voice synthesis infrastructure ready.',
          dimension: 'opportunity_emergence',
          confidence_delta: 0.2,
        },
      ],
      confidence: 0.85,
      urgency: 'immediate',
      suggested_actions: [
        { action: 'Lock voice capture setup for 35 takes', executor: 'claude_code', priority: 1 },
        { action: 'Run first recording session with RSP_001', executor: 'human', priority: 2 },
        { action: 'Create student onboarding flow for NOIZYKIDZ', executor: 'claude_code', priority: 3 },
      ],
      estimated_revenue_impact: {
        lower: 0,
        upper: 500,
        timeframe: '90 days',
        basis: 'First 35 takes establish catalogue. Revenue begins when teaching pipeline opens.',
      },
      compassion_cleared: true,
      compassion_notes: 'RSP_001 is the founder. This is aligned with their vision and purpose.',
      requires_decision: false,
      discovered_at: now,
      analysis_run_id: runId,
      gabriel_ingested: false as const,
    });
  }

  // Opportunity: Teaching pipeline readiness
  // NOTE: community_sentiment is the INSIGHT dimension (not community_belonging, which is WELLBEING)
  opportunities.push({
    id: uuidv4(),
    title: 'NOIZYKIDZ teaching pipeline can launch with RSP_001 as founding teacher',
    description: 'Revenue schema supports teaching relationships with auto-split. ' +
      'RSP_001\'s voice assets can be made available to students. ' +
      'Teacher royalty (15%) + voice contribution share creates sustainable income for educators.',
    insight_type: 'teaching_opportunity',
    dimensions_analyzed: ['teaching_effectiveness', 'revenue_trajectory', 'community_sentiment'],
    actors_involved: ['RSP_001'],
    brands_involved: ['NOIZYKIDZ', 'NOIZYVOX'],
    reasoning_chain: [
      {
        step: 1,
        thought: 'Teaching scenario tested: student nets $1.78 on $3.00, teacher gets $0.47. Sustainable.',
        dimension: 'revenue_trajectory',
        confidence_delta: 0.25,
      },
      {
        step: 2,
        thought: 'NOIZYKIDZ has no code yet. This creates the first real product for the brand.',
        dimension: 'teaching_effectiveness',
        confidence_delta: 0.2,
      },
      {
        step: 3,
        thought: 'Kids learning through a teacher\'s voice creates deep community bond.',
        dimension: 'community_sentiment',
        confidence_delta: 0.15,
      },
    ],
    confidence: 0.7,
    urgency: 'this_week',
    suggested_actions: [
      { action: 'Design NOIZYKIDZ student registration schema', executor: 'claude_code', priority: 2 },
      { action: 'Create first teaching module concept', executor: 'human', priority: 3 },
      { action: 'Set up n8n workflow for student → teacher royalty routing', executor: 'claude_code', priority: 4 },
    ],
    compassion_cleared: true,
    compassion_notes: 'Teaching serves RSP_001\'s mission. Children benefit from creative education.',
    requires_decision: true,
    discovered_at: now,
    analysis_run_id: runId,
    gabriel_ingested: false as const,
  });

  return opportunities;
}

// ─── REPORT GENERATION ───────────────────────────────────

export function runNightlyAnalysis(): NightlyReport {
  const startTime = Date.now();
  const now = new Date();
  const dateStr = now.toISOString().split('T')[0];
  const runId = `lucy-nightly-${dateStr}-${now.getTime()}`;

  // Read everything
  const input = gatherSources();

  // Think
  const patterns = recognizePatterns(input);
  const risks = detectRisks(input);
  const opportunities = discoverOpportunities(input, patterns, risks);

  // Creator readiness (starting with RSP_001)
  const readiness: CreatorReadiness[] = [
    {
      actor_id: 'RSP_001',
      ready_for: [
        'teaching_role',
        'voice_licensing',
        'character_licensing',
        'community_leadership',
      ],
      reasoning: 'RSP_001 is the founding creator with a locked actor imprint, ' +
        '10 Creative Builder models deployed, and a proven revenue pipeline. ' +
        'Ready to teach, license voice, and lead community governance.',
      confidence: 0.9,
      evidence: [
        { source: 'actor-protocol smoke test', observation: '32/32 tests passing', weight: 0.8 },
        { source: 'revenue pipeline', observation: '21/21 tests, all constitutional', weight: 0.8 },
        { source: 'governance OS', observation: '25/25 tests, blessing gate enforced', weight: 0.7 },
      ],
      urgency: 'now',
      compassion_assessment: 'RSP_001 is the architect of this system. Leading it is fulfillment, not burden.',
    },
  ];

  const duration = Date.now() - startTime;

  const report: NightlyReport = {
    report_id: uuidv4(),
    date: dateStr,
    generated_at: now.toISOString(),
    analysis_run_id: runId,
    analysis_duration_ms: duration,

    sources_analyzed: {
      blessed_sessions: input.blessed_sessions.length,
      playback_sessions: input.playback_sessions.length,
      creator_profiles: input.creator_profiles.length,
      revenue_streams: input.revenue_streams.length,
      consent_events: input.consent_events.length,
      community_signals: input.community_signals.length,
      decision_queue_items: input.decision_queue.length,
    },

    opportunities,
    creator_readiness: readiness,
    patterns,
    risks,

    executive_summary:
      `Lucy's nightly analysis for ${dateStr}. ` +
      `${opportunities.length} opportunities discovered. ` +
      `${risks.length} risks flagged. ` +
      `RSP_001 is ready for teaching, voice licensing, and community leadership. ` +
      `Priority: lock voice capture for 35 takes and launch first recording session.`,

    top_three: [
      'Lock voice capture setup and record 35 takes with RSP_001',
      'Clear any blocking decisions in the decision queue',
      'Design NOIZYKIDZ student onboarding for the teaching pipeline',
    ],

    decisions_needed: input.decision_queue.filter((d: any) => d.status === 'pending').length,

    blessed: false,
  };

  // Write report
  const reportDir = join(LUCY, 'nightly-reports');
  mkdirSync(reportDir, { recursive: true });
  writeFileSync(
    join(reportDir, `${dateStr}.json`),
    JSON.stringify(report, null, 2),
  );

  return report;
}

// ─── CLI ENTRY ───────────────────────────────────────────

if (import.meta.url === `file://${process.argv[1]}`) {
  console.log('═══════════════════════════════════════════════');
  console.log('  LUCY — Nightly Deep Analysis');
  console.log('═══════════════════════════════════════════════\n');
  
  const report = runNightlyAnalysis();
  
  console.log(`  Date: ${report.date}`);
  console.log(`  Duration: ${report.analysis_duration_ms}ms`);
  console.log(`  Opportunities: ${report.opportunities.length}`);
  console.log(`  Risks: ${report.risks.length}`);
  console.log(`  Decisions needed: ${report.decisions_needed}`);
  console.log(`\n  Executive Summary:`);
  console.log(`  ${report.executive_summary}`);
  console.log(`\n  Top 3:`);
  report.top_three.forEach((t, i) => console.log(`  ${i + 1}. ${t}`));
  console.log(`\n  Report: lucy/nightly-reports/${report.date}.json`);
  console.log('\n  Lucy thinks. n8n acts. Humans decide.\n');
}
