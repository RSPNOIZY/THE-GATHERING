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

// ─── LUCY V4.0 PERSONAL OS & MEMORY OBJECT KERNEL ─────────
export {
  MemoryObjectTypeSchema,
  MemoryActorSchema,
  MemoryLocationSchema,
  LanguageDetectionSchema,
  MemoryContentSchema,
  MemorySignalsSchema,
  ValueScoreSchema,
  RetentionTierSchema,
  GovernanceRecordSchema,
  ProvenanceAuditSchema,
  MemoryRelationSchema,
  MemoryObjectSchema,
  convertBlankBlackToMemoryObject,
} from './schemas/memory-object';

export type {
  MemoryObjectType,
  MemoryActor,
  MemoryLocation,
  LanguageDetection,
  MemoryContent,
  MemorySignals,
  ValueScore,
  RetentionTier,
  GovernanceRecord,
  ProvenanceAudit,
  MemoryRelation,
  MemoryObject,
  BlankBlackRow,
} from './schemas/memory-object';

// ─── NOIZY WORLD MODEL & LOCATION INTELLIGENCE ────────────
export {
  OttawaZoneTagSchema,
  ZoneNodeSchema,
  VenueNodeSchema,
  computeZoneScore,
} from './schemas/world-model';

export type {
  OttawaZoneTag,
  ZoneNode,
  VenueNode,
  ZoneScoringInput,
  ZoneScoringResult,
} from './schemas/world-model';

// ─── DREAMCHAMBER GRAPH & DIGITAL TWIN ────────────────────
export {
  PersonNodeSchema,
  IdeaNodeSchema,
  AssetNodeSchema,
  ProjectNodeSchema,
  GabrielProfileVectorSchema,
  CYPHER_TRAVERSAL_QUERIES,
  GRAPHQL_SCHEMA_DEFINITION,
} from './schemas/dreamchamber-graph';

export type {
  PersonNode,
  IdeaNode,
  AssetNode,
  ProjectNode,
  GabrielProfileVector,
} from './schemas/dreamchamber-graph';

// ─── MICHAEL ARCHIVIST & ESTATE MANAGER ───────────────────
export {
  StorageTierPolicySchema,
  MICHAEL_STORAGE_TIERS,
  ArchivalBatchManifestSchema,
  DigitalEstatePolicySchema,
  buildMerkleRoot,
} from './schemas/michael-archivist';

export type {
  ArchivalBatchManifest,
  DigitalEstatePolicy,
} from './schemas/michael-archivist';

// ─── ENGINE ──────────────────────────────────────────────
export { runNightlyAnalysis } from './engine/nightly-analysis';
export { convertToN8nFeed, generateCreatorNotifications } from './engine/n8n-bridge';
export type { N8nAction, OpportunityFeed } from './engine/n8n-bridge';

