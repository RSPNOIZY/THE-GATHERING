/**
 * NOIZYVOX — Gemma 4 Analysis Schema
 * 
 * Defines the contract for Gemma 4's role in the voice pipeline:
 *   - Authenticity scoring (is this genuinely RSP?)
 *   - Character consistency (does this match the imprint?)
 *   - Dimensional alignment (warmth, precision, humor, gravity)
 *   - Take-lock recommendation (lock / retake / review)
 * 
 * Gemma 4 is the creative conscience, not the judge.
 * It interprets. The human blesses.
 * 
 * Pipeline position:
 *   Whisper → transcript
 *   Librosa → acoustic facts
 *   XTTS    → identity vector
 *   Gemma 4 → interpretation, scoring, recommendation  ← THIS
 *   Human   → blessing
 *   Gabriel → blessed truth only
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── GEMMA 4 MODEL CONFIG ────────────────────────────────

export const Gemma4ModelConfigSchema = z.object({
  model: z.string().default('gemma-4'),
  model_variant: z.enum(['gemma-4-e2b', 'gemma-4-e4b', 'gemma-4-26b-a4b', 'gemma-4-31b'])
    .default('gemma-4-31b')
    .describe('Gemma 4 variant running on GOD. 31B for full reasoning, smaller for edge.'),
  ollama_endpoint: z.string().url().default('http://localhost:11434'),
  temperature: z.number().min(0).max(1).default(0.3)
    .describe('Low temperature for consistent analytical scoring'),
  max_tokens: z.number().int().positive().default(2048),
});

// ─── DIMENSIONAL ALIGNMENT ───────────────────────────────
// Each dimension scored as deviation from the actor imprint baseline.
// 0.0 = perfect match, negative = below baseline, positive = above baseline.
// Range: -1.0 to +1.0

export const DimensionalAlignmentSchema = z.object({
  warmth_deviation: z.number().min(-1).max(1)
    .describe('Deviation from imprint warmth baseline. Negative = colder than expected.'),
  precision_alignment: z.number().min(0).max(1)
    .describe('How precisely the delivery matches the intended script/direction. 1.0 = exact.'),
  humor_alignment: z.number().min(0).max(1)
    .describe('How well humor/irony lands relative to the imprint voice. 1.0 = nailed it.'),
  gravity_deviation: z.number().min(-1).max(1)
    .describe('Deviation from imprint gravity/seriousness. Positive = heavier than baseline.'),
  energy_match: z.number().min(0).max(1)
    .describe('How well the energy level matches the intended energy_band. 1.0 = perfect match.'),
  emotional_clarity: z.number().min(0).max(1)
    .describe('How clearly the intended emotion comes through. 1.0 = unmistakable.'),
});

// ─── TAKE-LOCK RECOMMENDATION ────────────────────────────

export const TakeLockRecommendationSchema = z.enum([
  'lock',         // This take is strong — recommend locking it
  'retake',       // Notable issues — recommend another attempt
  'review',       // Borderline — needs human ear, could go either way
  'exceptional',  // Rare flag: this exceeded the imprint in a meaningful way
]);

// ─── GEMMA 4 ANALYSIS RESULT ─────────────────────────────

export const Gemma4AnalysisSchema = z.object({
  // Identity
  analysis_id: z.string().uuid(),
  take_id: z.string().uuid(),
  session_id: z.string().uuid(),
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),

  // Model metadata
  model: z.string().default('gemma-4'),
  model_variant: z.string().default('gemma-4-31b'),
  analysis_duration_ms: z.number().int().nonnegative()
    .describe('How long the Gemma 4 analysis took'),

  // Core scores
  authenticity_score: z.number().int().min(0).max(100)
    .describe('How authentically "this person" the take sounds. 0-100.'),
  character_consistency_score: z.number().int().min(0).max(100)
    .describe('How well the take matches the character imprint. 0-100.'),

  // Dimensional alignment
  dimensions: DimensionalAlignmentSchema,

  // Recommendation
  recommendation: TakeLockRecommendationSchema,
  confidence: z.number().min(0).max(1)
    .describe('How confident Gemma 4 is in this assessment. 1.0 = very sure.'),

  // Reasoning
  reasoning_summary: z.string().min(1).max(1000)
    .describe('Human-readable explanation. Why this score? What to adjust?'),
  reasoning_chain: z.array(z.string()).optional()
    .describe('Step-by-step reasoning chain if available'),

  // Comparison to prior takes
  relative_rank: z.number().int().min(1).optional()
    .describe('Rank within this session (1 = best so far for this line)'),
  improvement_notes: z.string().optional()
    .describe('What changed vs. prior takes of the same line'),

  // Timestamps
  analyzed_at: z.string().datetime(),

  // Governance — Gemma 4 output is NOT blessed, NOT ingested
  blessed: z.literal(false).default(false),
  gabriel_ingested: z.literal(false).default(false),
});

// ─── WHISPER TRANSCRIPT (upstream input) ─────────────────

export const WhisperTranscriptSchema = z.object({
  text: z.string(),
  language: z.string().default('en'),
  segments: z.array(z.object({
    start: z.number(),
    end: z.number(),
    text: z.string(),
    confidence: z.number().min(0).max(1).optional(),
  })).optional(),
  duration_s: z.number().nonnegative(),
  model: z.string().default('whisper-large-v3'),
});

// ─── LIBROSA ACOUSTIC FEATURES (upstream input) ──────────

export const LibrosaFeaturesSchema = z.object({
  pitch_mean_hz: z.number().nonnegative(),
  pitch_std_hz: z.number().nonnegative(),
  energy_rms: z.number().nonnegative(),
  energy_band_detected: z.enum(['whisper', 'conversational', 'performance', 'full_power']),
  tempo_bpm: z.number().nonnegative().optional(),
  spectral_centroid_mean: z.number().nonnegative(),
  spectral_bandwidth_mean: z.number().nonnegative(),
  zero_crossing_rate: z.number().nonnegative(),
  formant_f1_hz: z.number().nonnegative().optional(),
  formant_f2_hz: z.number().nonnegative().optional(),
  mfcc_vector: z.array(z.number()).length(13).optional()
    .describe('13-coefficient MFCC vector for voice characterization'),
  duration_s: z.number().positive(),
});

// ─── XTTS IDENTITY VECTOR (upstream input) ───────────────

export const XttsIdentitySchema = z.object({
  speaker_embedding: z.array(z.number())
    .describe('Speaker embedding vector from XTTS/RVC'),
  identity_confidence: z.number().min(0).max(1)
    .describe('How confidently this matches the registered voice. 1.0 = certain match.'),
  voice_id: z.string()
    .describe('Registered voice identity label, e.g., RSP_001'),
  model: z.string().default('xtts-v2'),
});

// ─── COMPOSITE TAKE ANALYSIS (all engines combined) ──────

export const CompositeTakeAnalysisSchema = z.object({
  take_id: z.string().uuid(),
  session_id: z.string().uuid(),
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),

  // Upstream inputs
  whisper: WhisperTranscriptSchema,
  librosa: LibrosaFeaturesSchema,
  xtts: XttsIdentitySchema,
  gemma4: Gemma4AnalysisSchema,

  // Composite score (weighted blend)
  composite_score: z.number().min(0).max(100),
  composite_weights: z.object({
    authenticity: z.number().default(0.30),
    character_consistency: z.number().default(0.25),
    energy_match: z.number().default(0.15),
    identity_confidence: z.number().default(0.20),
    emotional_clarity: z.number().default(0.10),
  }),

  // Final recommendation (may differ from Gemma 4 alone)
  final_recommendation: TakeLockRecommendationSchema,

  // Pipeline metadata
  pipeline_version: z.string().default('1.0.0'),
  analyzed_at: z.string().datetime(),

  // Governance
  blessed: z.literal(false).default(false),
  gabriel_ingested: z.literal(false).default(false),
});

// ─── TYPES ───────────────────────────────────────────────

export type Gemma4ModelConfig = z.infer<typeof Gemma4ModelConfigSchema>;
export type DimensionalAlignment = z.infer<typeof DimensionalAlignmentSchema>;
export type TakeLockRecommendation = z.infer<typeof TakeLockRecommendationSchema>;
export type Gemma4Analysis = z.infer<typeof Gemma4AnalysisSchema>;
export type WhisperTranscript = z.infer<typeof WhisperTranscriptSchema>;
export type LibrosaFeatures = z.infer<typeof LibrosaFeaturesSchema>;
export type XttsIdentity = z.infer<typeof XttsIdentitySchema>;
export type CompositeTakeAnalysis = z.infer<typeof CompositeTakeAnalysisSchema>;
