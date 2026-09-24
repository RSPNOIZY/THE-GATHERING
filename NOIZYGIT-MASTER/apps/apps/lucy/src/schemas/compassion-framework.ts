/**
 * LUCY — Compassion Framework
 * 
 * Lucy's compassion isn't sentiment analysis. It's understanding
 * whether an action serves the human involved. Adaptation plus learning.
 * 
 * Every opportunity Lucy surfaces must pass through this gate.
 * The question is never "can we?" — it's "should we, for them?"
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── WELLBEING DIMENSIONS ────────────────────────────────

export const WellbeingDimensionSchema = z.enum([
  'creative_fulfillment',  // Does this feed their creative soul?
  'economic_stability',    // Does this improve their financial position?
  'skill_growth',          // Does this help them grow as an artist?
  'community_belonging',   // Does this strengthen their community bonds?
  'autonomy',              // Does this increase or decrease their independence?
  'workload_health',       // Can they handle this without burning out?
  'emotional_safety',      // Is this emotionally safe for them right now?
  'legacy_alignment',      // Does this serve their long-term vision?
  'family_impact',         // How does this affect their family?
  'cultural_respect',      // Does this honor their cultural identity?
]);

// ─── COMPASSION ASSESSMENT ───────────────────────────────

export const CompassionAssessmentSchema = z.object({
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  opportunity_id: z.string().uuid(),
  
  // Score each dimension
  dimensions: z.array(z.object({
    dimension: WellbeingDimensionSchema,
    score: z.number().min(-1).max(1)
      .describe('-1 = harmful, 0 = neutral, 1 = beneficial'),
    reasoning: z.string(),
    weight: z.number().min(0).max(1).default(1)
      .describe('How relevant is this dimension to this creator?'),
  })),
  
  // Composite score
  composite_score: z.number().min(-1).max(1),
  
  // Gate decision
  cleared: z.boolean(),
  gate_reasoning: z.string()
    .describe('Why Lucy cleared or blocked this opportunity for this person'),
  
  // Adaptation history — Lucy learns from past assessments
  adapted_from: z.array(z.object({
    prior_assessment_id: z.string().uuid(),
    what_changed: z.string(),
    why: z.string(),
  })).optional(),
  
  // Flags
  requires_human_override: z.boolean().default(false),
  override_reason: z.string().optional(),
  
  assessed_at: z.string().datetime(),
});

// ─── ADAPTATION RECORD ───────────────────────────────────
// Lucy learns. When a compassion assessment was wrong, she adapts.

export const AdaptationRecordSchema = z.object({
  id: z.string().uuid(),
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  
  // What happened
  original_assessment_id: z.string().uuid(),
  original_decision: z.enum(['cleared', 'blocked']),
  actual_outcome: z.enum(['positive', 'negative', 'neutral', 'mixed']),
  
  // What Lucy learned
  lesson: z.string()
    .describe('What Lucy now understands about this creator that she didn\'t before'),
  
  // How Lucy will adapt
  dimension_adjustments: z.array(z.object({
    dimension: WellbeingDimensionSchema,
    old_weight: z.number(),
    new_weight: z.number(),
    reason: z.string(),
  })),
  
  // Creator-specific learning
  creator_insight: z.string()
    .describe('What is uniquely true about this creator that affects future assessments?'),
  
  recorded_at: z.string().datetime(),
  gabriel_ingested: z.literal(false).default(false),
});

// ─── COMPASSION ENGINE ───────────────────────────────────

/**
 * Run a compassion assessment.
 * Returns cleared: true only if composite score > 0.
 * Returns cleared: false with reasoning if it would harm the creator.
 */
export function assessCompassion(params: {
  actor_id: string;
  opportunity_id: string;
  dimensions: Array<{
    dimension: z.infer<typeof WellbeingDimensionSchema>;
    score: number;
    reasoning: string;
    weight?: number;
  }>;
}): z.infer<typeof CompassionAssessmentSchema> {
  const now = new Date().toISOString();
  
  // Calculate weighted composite
  let weightedSum = 0;
  let totalWeight = 0;
  
  const scoredDimensions = params.dimensions.map(d => {
    const weight = d.weight ?? 1;
    weightedSum += d.score * weight;
    totalWeight += weight;
    return { ...d, weight };
  });
  
  const composite = totalWeight > 0 ? weightedSum / totalWeight : 0;
  
  // Gate: composite must be positive
  const cleared = composite > 0;
  
  // Check for any critical negatives
  const criticalNegatives = scoredDimensions.filter(d => d.score < -0.5);
  const requiresOverride = criticalNegatives.length > 0 && cleared;
  
  let gateReasoning: string;
  if (cleared && !requiresOverride) {
    gateReasoning = `Cleared. Composite wellbeing score: ${composite.toFixed(3)}. ` +
      `This opportunity serves ${params.actor_id} across ${scoredDimensions.filter(d => d.score > 0).length} dimensions.`;
  } else if (cleared && requiresOverride) {
    gateReasoning = `Conditionally cleared (composite ${composite.toFixed(3)}) but has critical concerns in: ` +
      `${criticalNegatives.map(d => d.dimension).join(', ')}. Requires human review.`;
  } else {
    gateReasoning = `Blocked. Composite wellbeing score: ${composite.toFixed(3)}. ` +
      `This opportunity would not serve ${params.actor_id}. Primary concerns: ` +
      `${scoredDimensions.filter(d => d.score < 0).map(d => `${d.dimension} (${d.reasoning})`).join('; ')}.`;
  }
  
  return {
    actor_id: params.actor_id,
    opportunity_id: params.opportunity_id,
    dimensions: scoredDimensions,
    composite_score: Math.round(composite * 1000) / 1000,
    cleared: cleared && !requiresOverride,
    gate_reasoning: gateReasoning,
    requires_human_override: requiresOverride,
    override_reason: requiresOverride
      ? `Critical negative scores detected despite positive composite. Human judgment needed.`
      : undefined,
    assessed_at: now,
  };
}

// ─── TYPES ───────────────────────────────────────────────

export type WellbeingDimension = z.infer<typeof WellbeingDimensionSchema>;
export type CompassionAssessment = z.infer<typeof CompassionAssessmentSchema>;
export type AdaptationRecord = z.infer<typeof AdaptationRecordSchema>;
