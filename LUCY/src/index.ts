/**
 * LUCY — Nightly Deep Analysis Engine
 * 
 * Barrel export for @noizy/lucy
 * 
 * Lucy reads everything. Surfaces the most human insight.
 * Lucy thinks. n8n acts. Humans decide.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

// ─── SCHEMAS ─────────────────────────────────────────────
export {
  LUCY_IDENTITY,
  InsightDimensionSchema,
  CreatorReadinessSchema,
  OpportunitySchema,
  NightlyReportSchema,
} from './schemas/lucy-core';

export type {
  InsightDimension,
  CreatorReadiness,
  Opportunity,
  NightlyReport,
} from './schemas/lucy-core';

// ─── COMPASSION FRAMEWORK ────────────────────────────────
export {
  WellbeingDimensionSchema,
  CompassionAssessmentSchema,
  AdaptationRecordSchema,
  assessCompassion,
} from './schemas/compassion-framework';

export type {
  WellbeingDimension,
  CompassionAssessment,
  AdaptationRecord,
} from './schemas/compassion-framework';

// ─── ENGINE ──────────────────────────────────────────────
export { runNightlyAnalysis } from './engine/nightly-analysis';
export { convertToN8nFeed, generateCreatorNotifications } from './engine/n8n-bridge';
export type { N8nAction, OpportunityFeed } from './engine/n8n-bridge';
