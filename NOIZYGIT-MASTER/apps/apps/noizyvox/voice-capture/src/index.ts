/**
 * NOIZYVOX — Voice Capture System
 * 
 * Barrel export for @noizy/voice-capture
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

// ─── Schemas: Capture Session ────────────────────────────

export {
  RecordingFormatSchema,
  TakeStatusSchema,
  VoiceTakeSchema,
  CaptureSessionSchema,
  SessionPlanSchema,
} from './schemas/capture-session';

export type {
  RecordingFormat,
  TakeStatus,
  VoiceTake,
  CaptureSession,
  SessionPlan,
} from './schemas/capture-session';

// ─── Schemas: Gini Monitor ──────────────────────────────

export {
  GINI_CONSTITUTION,
  GiniSnapshotSchema,
  calculateGini,
  calculateDistributionStats,
  assessGini,
} from './schemas/gini-monitor';

export type { GiniSnapshot } from './schemas/gini-monitor';

// ─── Schemas: Gemma 4 Analysis ──────────────────────────

export {
  Gemma4ModelConfigSchema,
  DimensionalAlignmentSchema,
  TakeLockRecommendationSchema,
  Gemma4AnalysisSchema,
  WhisperTranscriptSchema,
  LibrosaFeaturesSchema,
  XttsIdentitySchema,
  CompositeTakeAnalysisSchema,
} from './schemas/gemma4-analysis';

export type {
  Gemma4ModelConfig,
  DimensionalAlignment,
  TakeLockRecommendation,
  Gemma4Analysis,
  WhisperTranscript,
  LibrosaFeatures,
  XttsIdentity,
  CompositeTakeAnalysis,
} from './schemas/gemma4-analysis';

// ─── Engine: Capture ────────────────────────────────────

export {
  createSession,
  startSession,
  recordTake,
  reviewTake,
  completeSession,
  getSessionStats,
} from './engine/capture-engine';

// ─── Engine: Blessing Bridge ────────────────────────────

export {
  stageApprovedTakes,
  getBridgeStatus,
} from './engine/blessing-bridge';

export type { BridgeResult } from './engine/blessing-bridge';

// ─── Engine: Gemma 4 Analyzer ───────────────────────────

export {
  analyzeWithGemma4,
  checkGemma4Available,
  GEMMA4_DEFAULT_CONFIG,
} from './engine/gemma4-analyzer';

// ─── Engine: Take Scoring ───────────────────────────────

export {
  computeTranscriptAccuracy,
  computeEnergyBandMatch,
  computeCompositeScore,
  computeSessionStats,
  DEFAULT_WEIGHTS,
} from './engine/take-scoring';

export type { ScoringWeights } from './engine/take-scoring';

// ─── Engine: Session Writer ─────────────────────────────

export {
  writeGovernedJson,
  writeTakeAnalysis,
  writeCompositeAnalysis,
  writeSessionMarkdown,
  updateSessionJson,
  writeAnalysisManifest,
} from './engine/session-writer';

export type { GovernedJsonEnvelope } from './engine/session-writer';

// ─── Engine: Capture Watcher ────────────────────────────

export {
  validateWavFile,
  CaptureWatcher,
  DEFAULT_WATCHER_CONFIG,
} from './engine/capture-watcher';

export type {
  WatcherConfig,
  WavInfo,
  QueuedFile,
  WatcherEvent,
} from './engine/capture-watcher';

// ─── Fixtures ───────────────────────────────────────────

export { RSP001_SESSION_PLAN, RSP001_SCRIPT_LINES, getAllScriptLines } from './fixtures/rsp001-35-takes';
