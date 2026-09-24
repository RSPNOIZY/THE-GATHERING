/**
 * RSP001 ACTOR PROTOCOL v1.0
 * 
 * A two-layer performance system:
 *   1. Actor layer (RSP001 personality imprint) — sovereign, immutable
 *   2. Character layer (session-specific role) — directable, removable
 * 
 * The actor is sovereign.
 * The character is a layer.
 * Direction never overwrites identity.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

// ─── SCHEMAS ─────────────────────────────────────────────
export {
  ActorImprintSchema,
  EnergyBandSchema,
  DirectabilityStyleSchema,
  HumorProfileSchema,
  ImprovisationTendencySchema,
  type ActorImprint,
  type EnergyBand,
  type DirectabilityStyle,
  type HumorProfile,
  type ImprovisationTendency,
} from './schemas/actorImprint';

export {
  CharacterProfileSchema,
  VocalPostureSchema,
  EmotionalBaselineSchema,
  VocabularyBiasSchema,
  CadenceSchema,
  HardConstraintSchema,
  AllowedTransformationSchema,
  type CharacterProfile,
  type VocalPosture,
  type EmotionalBaseline,
  type VocabularyBias,
  type Cadence,
  type HardConstraint,
  type AllowedTransformation,
} from './schemas/characterProfile';

export {
  DirectionEventSchema,
  PerformanceModeSchema,
  DirectionSourceSchema,
  DirectionCategorySchema,
  type DirectionEvent,
  type PerformanceMode,
  type DirectionSource,
  type DirectionCategory,
} from './schemas/directionEvent';

export {
  TakeSchema,
  TakeStatusSchema,
  TakeQualitySchema,
  type Take,
  type TakeStatus,
  type TakeQuality,
} from './schemas/take';

// ─── ENGINE ──────────────────────────────────────────────
export {
  PerformanceStateMachine,
  type SessionState,
} from './engine/stateMachine';

export {
  BreakWordParser,
  type BreakWordConfig,
  type BreakWordResult,
} from './engine/breakWordParser';

export {
  SessionLogger,
  type SessionLog,
  type SessionSummary,
} from './engine/sessionLogger';

export {
  PreviewGenerator,
  type PreviewRequest,
  type PreviewResponse,
} from './engine/previewGenerator';

// ─── FIXTURES ────────────────────────────────────────────
export {
  RSP001_IMPRINT,
  STERN_BRITISH_GANGSTER,
  EXAMPLE_SESSION,
} from './fixtures/rsp001';
