/**
 * LUCY — Nightly Deep Analysis Engine
 * 
 * Lucy reads everything. Surfaces the most human insight.
 * She doesn't execute. She discovers. She understands nuance.
 * Why one creator's teaching voice resonates and another's doesn't.
 * 
 * Lucy thinks. n8n acts. Humans decide.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── LUCY'S IDENTITY ─────────────────────────────────────

export const LUCY_IDENTITY = {
  name: 'Lucy',
  role: 'Nightly Deep Analysis Engine',
  purpose: 'Discovery through understanding, not workflow',
  runs_on: 'GOD (M2 Ultra) via Claude Code with extended thinking',
  cadence: 'nightly',
  output: 'Opportunity feed + insight reports',
  rule: 'Lucy thinks. n8n acts. Humans decide.',
} as const;

// ─── INSIGHT DIMENSIONS ──────────────────────────────────
// Lucy reasons across these dimensions simultaneously.

export const InsightDimensionSchema = z.enum([
  'creative_resonance',    // Why does this creator's voice connect?
  'teaching_effectiveness', // Which teaching approaches actually work?
  'collaboration_chemistry', // Which creators should work together?
  'audience_pattern',       // Who's listening, when, why?
  'revenue_trajectory',     // Where is the economic energy moving?
  'consent_health',         // Are consent patterns healthy or coerced?
  'community_sentiment',    // How does the community feel? Really?
  'cultural_context',       // What cultural moment makes this relevant?
  'risk_signal',            // What could go wrong that nobody sees?
  'opportunity_emergence',  // What's becoming possible that wasn't before?
]);

// ─── CREATOR READINESS ───────────────────────────────────
// Lucy assesses what each creator is ready for.

export const CreatorReadinessSchema = z.object({
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  
  // What are they ready for?
  ready_for: z.array(z.enum([
    'first_collaboration',
    'teaching_role',
    'mentorship_giving',
    'mentorship_receiving',
    'character_licensing',
    'voice_licensing',
    'community_leadership',
    'cross_brand_project',
    'revenue_scaling',
    'advanced_production',
  ])),
  
  // Why? Lucy's reasoning.
  reasoning: z.string().min(10)
    .describe('Lucy explains why, with nuance and empathy'),
  
  // Confidence
  confidence: z.number().min(0).max(1),
  
  // Evidence
  evidence: z.array(z.object({
    source: z.string(),
    observation: z.string(),
    weight: z.number().min(0).max(1),
  })),
  
  // Timing
  urgency: z.enum(['now', 'soon', 'when_ready', 'not_yet']),
  
  // Compassion check — is this good for the creator?
  compassion_assessment: z.string()
    .describe('Would pursuing this opportunity serve the creator\'s wellbeing?'),
});

// ─── OPPORTUNITY ─────────────────────────────────────────
// Something Lucy discovered that didn't exist before her analysis.

export const OpportunitySchema = z.object({
  id: z.string().uuid(),
  
  // What Lucy found
  title: z.string().min(1),
  description: z.string().min(10),
  insight_type: z.enum([
    'creator_match',         // Two creators who should collaborate
    'teaching_opportunity',  // A creator ready to teach
    'revenue_unlock',        // A new revenue path that opened up
    'community_need',        // Something the community needs that nobody's building
    'risk_mitigation',       // A risk that needs attention before it becomes a crisis
    'cultural_moment',       // An external cultural event that creates relevance
    'voice_demand',          // Someone needs a voice that exists in the system
    'healing_application',   // A therapeutic use case for sonic healing
    'legacy_preservation',   // A wisdom capture that should happen urgently
    'cross_brand_synergy',   // Two NOIZY brands that should connect
  ]),
  
  // Dimensions Lucy reasoned across
  dimensions_analyzed: z.array(InsightDimensionSchema).min(1),
  
  // Who's involved
  actors_involved: z.array(z.string()).min(1),
  brands_involved: z.array(z.enum([
    'NOIZYVOX', 'NOIZYFISH', 'NOIZYKIDZ', 'NOIZYLAB',
    'myFAMILY_AI', 'WISDOM_PROJECT', 'HEAVEN',
  ])).min(1),
  
  // Lucy's reasoning chain
  reasoning_chain: z.array(z.object({
    step: z.number().int().positive(),
    thought: z.string(),
    dimension: InsightDimensionSchema,
    confidence_delta: z.number().min(-1).max(1)
      .describe('How this step changed overall confidence'),
  })),
  
  // Actionability
  confidence: z.number().min(0).max(1),
  urgency: z.enum(['immediate', 'this_week', 'this_month', 'backlog']),
  
  // What n8n should do with this
  suggested_actions: z.array(z.object({
    action: z.string(),
    executor: z.enum(['n8n', 'human', 'claude_code']),
    priority: z.number().int().min(1).max(10),
  })),
  
  // Revenue potential
  estimated_revenue_impact: z.object({
    lower: z.number().nonnegative(),
    upper: z.number().nonnegative(),
    timeframe: z.string(),
    basis: z.string().describe('How Lucy estimated this'),
  }).optional(),
  
  // Compassion gate
  compassion_cleared: z.boolean()
    .describe('Does this opportunity serve the humans involved?'),
  compassion_notes: z.string().optional(),
  
  // Governance
  requires_decision: z.boolean().default(false),
  decision_queue_id: z.string().uuid().optional(),
  
  // Audit
  discovered_at: z.string().datetime(),
  analysis_run_id: z.string(),
  gabriel_ingested: z.literal(false).default(false),
});

// ─── NIGHTLY REPORT ──────────────────────────────────────

export const NightlyReportSchema = z.object({
  report_id: z.string().uuid(),
  date: z.string(),
  generated_at: z.string().datetime(),
  analysis_run_id: z.string(),
  
  // Duration
  analysis_duration_ms: z.number().int().nonnegative(),
  
  // What Lucy read
  sources_analyzed: z.object({
    blessed_sessions: z.number().int().nonnegative(),
    playback_sessions: z.number().int().nonnegative(),
    creator_profiles: z.number().int().nonnegative(),
    revenue_streams: z.number().int().nonnegative(),
    consent_events: z.number().int().nonnegative(),
    community_signals: z.number().int().nonnegative(),
    decision_queue_items: z.number().int().nonnegative(),
  }),
  
  // What Lucy found
  opportunities: z.array(OpportunitySchema),
  creator_readiness: z.array(CreatorReadinessSchema),
  
  // Pattern recognition
  patterns: z.array(z.object({
    pattern: z.string(),
    frequency: z.number().min(0).max(1),
    trend: z.enum(['emerging', 'stable', 'declining', 'new']),
    significance: z.number().min(0).max(1),
  })),
  
  // Risk signals
  risks: z.array(z.object({
    description: z.string(),
    severity: z.enum(['low', 'medium', 'high', 'critical']),
    affected_actors: z.array(z.string()),
    mitigation: z.string(),
  })),
  
  // Summary for the cockpit
  executive_summary: z.string()
    .describe('3-5 sentences for the morning decision window'),
  
  // Top 3 actions for today
  top_three: z.array(z.string()).min(1).max(3),
  
  // What needs human decision
  decisions_needed: z.number().int().nonnegative(),
  
  // Blessing status
  blessed: z.boolean().default(false),
  blessed_by: z.string().optional(),
  blessed_at: z.string().datetime().optional(),
});

// ─── TYPES ───────────────────────────────────────────────

export type InsightDimension = z.infer<typeof InsightDimensionSchema>;
export type CreatorReadiness = z.infer<typeof CreatorReadinessSchema>;
export type Opportunity = z.infer<typeof OpportunitySchema>;
export type NightlyReport = z.infer<typeof NightlyReportSchema>;
