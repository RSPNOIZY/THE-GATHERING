/**
 * NOIZY.AI — Gini Coefficient Monitor
 * 
 * Measures economic inequality across the creator ecosystem.
 * Constitutional target: Gini ≤ 0.35
 * DAO auto-intervention triggers at 0.37
 * 
 * The question isn't "are we profitable?" — it's "is the prosperity shared?"
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── GINI THRESHOLDS ─────────────────────────────────────

export const GINI_CONSTITUTION = {
  target: 0.35,           // Where we want to be
  warning: 0.37,          // DAO gets notified
  intervention: 0.40,     // DAO auto-review triggered
  critical: 0.45,         // Emergency redistribution review
  industry_average: 0.62, // What the old music industry looks like
} as const;

// ─── GINI SNAPSHOT ───────────────────────────────────────

export const GiniSnapshotSchema = z.object({
  id: z.string().uuid(),
  measured_at: z.string().datetime(),
  
  // The coefficient
  gini_coefficient: z.number().min(0).max(1),
  
  // Breakdown by brand
  brand_gini: z.record(z.string(), z.number().min(0).max(1)),
  
  // Distribution stats
  total_creators: z.number().int().nonnegative(),
  total_earnings: z.number().nonnegative(),
  median_earnings: z.number().nonnegative(),
  mean_earnings: z.number().nonnegative(),
  top_10_percent_share: z.number().min(0).max(1),
  bottom_50_percent_share: z.number().min(0).max(1),
  
  // Constitutional compliance
  within_target: z.boolean(),
  within_warning: z.boolean(),
  dao_intervention_triggered: z.boolean(),
  
  // Trend
  previous_gini: z.number().min(0).max(1).optional(),
  trend: z.enum(['improving', 'stable', 'worsening']).optional(),
  
  // Governance
  gabriel_ingested: z.literal(false).default(false),
});

// ─── GINI CALCULATOR ─────────────────────────────────────

/**
 * Calculate Gini coefficient from an array of earnings.
 * 
 * Gini = 0 → perfect equality (everyone earns the same)
 * Gini = 1 → perfect inequality (one person earns everything)
 * 
 * NOIZY target: ≤ 0.35
 */
export function calculateGini(earnings: number[]): number {
  if (earnings.length === 0) return 0;
  if (earnings.length === 1) return 0;
  
  const sorted = [...earnings].sort((a, b) => a - b);
  const n = sorted.length;
  const totalEarnings = sorted.reduce((sum, e) => sum + e, 0);
  
  if (totalEarnings === 0) return 0;
  
  let numerator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (2 * (i + 1) - n - 1) * sorted[i];
  }
  
  const gini = numerator / (n * totalEarnings);
  return Math.round(gini * 10000) / 10000; // 4 decimal places
}

/**
 * Calculate distribution stats for a set of earnings.
 */
export function calculateDistributionStats(earnings: number[]): {
  total: number;
  median: number;
  mean: number;
  top_10_percent_share: number;
  bottom_50_percent_share: number;
} {
  if (earnings.length === 0) {
    return { total: 0, median: 0, mean: 0, top_10_percent_share: 0, bottom_50_percent_share: 0 };
  }
  
  const sorted = [...earnings].sort((a, b) => a - b);
  const n = sorted.length;
  const total = sorted.reduce((sum, e) => sum + e, 0);
  const mean = total / n;
  
  // Median
  const mid = Math.floor(n / 2);
  const median = n % 2 === 0 ? (sorted[mid - 1] + sorted[mid]) / 2 : sorted[mid];
  
  // Top 10% share
  const top10Start = Math.floor(n * 0.9);
  const top10Earnings = sorted.slice(top10Start).reduce((sum, e) => sum + e, 0);
  const top_10_percent_share = total > 0 ? top10Earnings / total : 0;
  
  // Bottom 50% share
  const bottom50End = Math.floor(n * 0.5);
  const bottom50Earnings = sorted.slice(0, bottom50End).reduce((sum, e) => sum + e, 0);
  const bottom_50_percent_share = total > 0 ? bottom50Earnings / total : 0;
  
  return {
    total: Math.round(total * 100) / 100,
    median: Math.round(median * 100) / 100,
    mean: Math.round(mean * 100) / 100,
    top_10_percent_share: Math.round(top_10_percent_share * 10000) / 10000,
    bottom_50_percent_share: Math.round(bottom_50_percent_share * 10000) / 10000,
  };
}

/**
 * Assess Gini coefficient against constitutional thresholds.
 * Returns intervention level and recommended action.
 */
export function assessGini(gini: number): {
  level: 'healthy' | 'target' | 'warning' | 'intervention' | 'critical';
  message: string;
  dao_action_required: boolean;
  recommended_action: string;
} {
  if (gini <= GINI_CONSTITUTION.target) {
    return {
      level: 'healthy',
      message: `Gini ${gini.toFixed(4)} — within constitutional target (≤${GINI_CONSTITUTION.target})`,
      dao_action_required: false,
      recommended_action: 'No action needed. Distribution is equitable.',
    };
  }
  
  if (gini <= GINI_CONSTITUTION.warning) {
    return {
      level: 'target',
      message: `Gini ${gini.toFixed(4)} — above target but below warning threshold`,
      dao_action_required: false,
      recommended_action: 'Monitor closely. Consider increasing community pool allocation.',
    };
  }
  
  if (gini <= GINI_CONSTITUTION.intervention) {
    return {
      level: 'warning',
      message: `Gini ${gini.toFixed(4)} — WARNING: DAO notification triggered at ${GINI_CONSTITUTION.warning}`,
      dao_action_required: true,
      recommended_action: 'DAO review required. Analyze top earner concentration. Consider progressive rate adjustment.',
    };
  }
  
  if (gini <= GINI_CONSTITUTION.critical) {
    return {
      level: 'intervention',
      message: `Gini ${gini.toFixed(4)} — INTERVENTION: Auto-review triggered at ${GINI_CONSTITUTION.intervention}`,
      dao_action_required: true,
      recommended_action: 'Emergency DAO review. Freeze new revenue splits above 85%. Redistribute community pool.',
    };
  }
  
  return {
    level: 'critical',
    message: `Gini ${gini.toFixed(4)} — CRITICAL: Above ${GINI_CONSTITUTION.critical}. This is an emergency.`,
    dao_action_required: true,
    recommended_action: 'Emergency halt on new revenue streams. Full DAO vote on redistribution. Constitutional amendment review.',
  };
}

// ─── TYPES ───────────────────────────────────────────────

export type GiniSnapshot = z.infer<typeof GiniSnapshotSchema>;
