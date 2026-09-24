/**
 * NOIZYVOX — Take Scoring Engine
 * 
 * Computes a composite score from all four analysis engines:
 *   Whisper   → transcript accuracy
 *   Librosa   → acoustic fact alignment
 *   XTTS      → identity confidence
 *   Gemma 4   → interpretation + character consistency
 * 
 * The composite score is a weighted blend. Weights are configurable
 * but the defaults reflect NOIZY.AI's priorities:
 *   authenticity > identity > character > energy > emotion
 * 
 * The final recommendation may differ from Gemma 4's alone
 * because it factors in identity confidence and acoustic match.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  CompositeTakeAnalysis,
  Gemma4Analysis,
  WhisperTranscript,
  LibrosaFeatures,
  XttsIdentity,
  TakeLockRecommendation,
} from '../schemas/gemma4-analysis';

// ─── SCORING WEIGHTS ─────────────────────────────────────

export interface ScoringWeights {
  authenticity: number;      // Gemma 4 authenticity score
  character_consistency: number; // Gemma 4 character score
  energy_match: number;      // Gemma 4 energy dimension + Librosa energy band match
  identity_confidence: number;   // XTTS speaker identity match
  emotional_clarity: number; // Gemma 4 emotional clarity dimension
}

export const DEFAULT_WEIGHTS: ScoringWeights = {
  authenticity: 0.30,
  character_consistency: 0.25,
  energy_match: 0.15,
  identity_confidence: 0.20,
  emotional_clarity: 0.10,
};

// ─── TRANSCRIPT ACCURACY ─────────────────────────────────

/**
 * Simple word-level accuracy between script line and transcript.
 * Returns 0.0 to 1.0. Handles natural variation (ums, slight rewording)
 * by using word overlap rather than exact match.
 */
export function computeTranscriptAccuracy(
  scriptLine: string,
  transcript: string,
): number {
  const normalize = (s: string): string[] =>
    s.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(Boolean);

  const scriptWords = normalize(scriptLine);
  const transcriptWords = normalize(transcript);

  if (scriptWords.length === 0) return transcriptWords.length === 0 ? 1.0 : 0.0;

  // Count matching words (order-independent overlap)
  const scriptSet = new Set(scriptWords);
  const matchCount = transcriptWords.filter(w => scriptSet.has(w)).length;

  // Penalize both missing words and extra words
  const precision = transcriptWords.length > 0 ? matchCount / transcriptWords.length : 0;
  const recall = matchCount / scriptWords.length;

  if (precision + recall === 0) return 0;
  // F1 score as transcript accuracy
  return (2 * precision * recall) / (precision + recall);
}

// ─── ENERGY BAND MATCH ───────────────────────────────────

/**
 * Score how well the detected energy band matches the intended band.
 * Same band = 1.0, adjacent = 0.6, two steps = 0.3, opposite = 0.1.
 */
export function computeEnergyBandMatch(
  intended: string,
  detected: string,
): number {
  const bands = ['whisper', 'conversational', 'performance', 'full_power'];
  const intIdx = bands.indexOf(intended);
  const detIdx = bands.indexOf(detected);

  if (intIdx === -1 || detIdx === -1) return 0.5; // Unknown band, neutral score
  const distance = Math.abs(intIdx - detIdx);

  switch (distance) {
    case 0: return 1.0;
    case 1: return 0.6;
    case 2: return 0.3;
    default: return 0.1;
  }
}

// ─── COMPOSITE SCORING ───────────────────────────────────

/**
 * Compute the composite take score from all four engine outputs.
 */
export function computeCompositeScore(params: {
  take_id: string;
  session_id: string;
  actor_id: string;
  script_line: string;
  intended_energy_band: string;
  whisper: WhisperTranscript;
  librosa: LibrosaFeatures;
  xtts: XttsIdentity;
  gemma4: Gemma4Analysis;
  weights?: Partial<ScoringWeights>;
}): CompositeTakeAnalysis {
  const weights: ScoringWeights = { ...DEFAULT_WEIGHTS, ...params.weights };

  // Normalize weights to sum to 1.0
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const norm = (w: number) => w / totalWeight;

  // Individual dimension scores (0-100 scale)
  const authenticity = params.gemma4.authenticity_score;
  const characterConsistency = params.gemma4.character_consistency_score;

  // Energy match: blend Gemma 4's energy dimension with Librosa detected band
  const gemmaEnergyMatch = params.gemma4.dimensions.energy_match * 100;
  const librosaEnergyMatch = computeEnergyBandMatch(
    params.intended_energy_band,
    params.librosa.energy_band_detected,
  ) * 100;
  const energyMatch = (gemmaEnergyMatch * 0.6) + (librosaEnergyMatch * 0.4);

  // Identity confidence from XTTS
  const identityConfidence = params.xtts.identity_confidence * 100;

  // Emotional clarity from Gemma 4
  const emotionalClarity = params.gemma4.dimensions.emotional_clarity * 100;

  // Weighted composite
  const composite = Math.round(
    (authenticity * norm(weights.authenticity)) +
    (characterConsistency * norm(weights.character_consistency)) +
    (energyMatch * norm(weights.energy_match)) +
    (identityConfidence * norm(weights.identity_confidence)) +
    (emotionalClarity * norm(weights.emotional_clarity))
  );

  // Final recommendation — may override Gemma 4 based on identity/acoustic data
  const finalRec = determineFinalRecommendation(
    params.gemma4.recommendation,
    composite,
    params.xtts.identity_confidence,
    computeTranscriptAccuracy(params.script_line, params.whisper.text),
  );

  return {
    take_id: params.take_id,
    session_id: params.session_id,
    actor_id: params.actor_id,

    whisper: params.whisper,
    librosa: params.librosa,
    xtts: params.xtts,
    gemma4: params.gemma4,

    composite_score: composite,
    composite_weights: weights,

    final_recommendation: finalRec,

    pipeline_version: '1.0.0',
    analyzed_at: new Date().toISOString(),

    blessed: false as const,
    gabriel_ingested: false as const,
  };
}

// ─── RECOMMENDATION LOGIC ────────────────────────────────

/**
 * Determine final recommendation factoring in all signals.
 * 
 * Rules:
 *   - Identity confidence < 0.7 → always "review" (might not be the right person)
 *   - Transcript accuracy < 0.5 → downgrade to "retake" (wrong words)
 *   - Composite ≥ 90 and Gemma says "lock" → "exceptional" upgrade possible
 *   - Composite < 50 → "retake" regardless
 *   - Otherwise → trust Gemma 4's recommendation
 */
function determineFinalRecommendation(
  gemmaRec: TakeLockRecommendation,
  compositeScore: number,
  identityConfidence: number,
  transcriptAccuracy: number,
): TakeLockRecommendation {
  // Safety: identity too low — force human review
  if (identityConfidence < 0.7) {
    return 'review';
  }

  // Wrong words — force retake
  if (transcriptAccuracy < 0.5) {
    return 'retake';
  }

  // Outstanding performance
  if (compositeScore >= 90 && (gemmaRec === 'lock' || gemmaRec === 'exceptional')) {
    return 'exceptional';
  }

  // Failing score
  if (compositeScore < 50) {
    return 'retake';
  }

  // Borderline — push to review if Gemma was uncertain
  if (compositeScore < 65 && gemmaRec === 'lock') {
    return 'review';
  }

  // Trust Gemma 4
  return gemmaRec;
}

// ─── SESSION-LEVEL SCORING ───────────────────────────────

/**
 * Compute session-level statistics from an array of composite analyses.
 */
export function computeSessionStats(analyses: CompositeTakeAnalysis[]): {
  total_takes: number;
  mean_composite: number;
  median_composite: number;
  lock_count: number;
  retake_count: number;
  review_count: number;
  exceptional_count: number;
  best_take_id: string | null;
  weakest_take_id: string | null;
  mean_authenticity: number;
  mean_character_consistency: number;
  mean_identity_confidence: number;
  session_ready_for_blessing: boolean;
} {
  if (analyses.length === 0) {
    return {
      total_takes: 0,
      mean_composite: 0,
      median_composite: 0,
      lock_count: 0,
      retake_count: 0,
      review_count: 0,
      exceptional_count: 0,
      best_take_id: null,
      weakest_take_id: null,
      mean_authenticity: 0,
      mean_character_consistency: 0,
      mean_identity_confidence: 0,
      session_ready_for_blessing: false,
    };
  }

  const scores = analyses.map(a => a.composite_score);
  const sorted = [...scores].sort((a, b) => a - b);
  const median = sorted.length % 2 === 0
    ? (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2
    : sorted[Math.floor(sorted.length / 2)];

  const best = analyses.reduce((a, b) => a.composite_score >= b.composite_score ? a : b);
  const weakest = analyses.reduce((a, b) => a.composite_score <= b.composite_score ? a : b);

  const recCounts = { lock: 0, retake: 0, review: 0, exceptional: 0 };
  for (const a of analyses) {
    recCounts[a.final_recommendation]++;
  }

  const mean = (arr: number[]) => arr.reduce((a, b) => a + b, 0) / arr.length;

  // Session is ready for blessing if:
  //   - No retakes pending
  //   - At least one lock or exceptional
  //   - Mean composite ≥ 65
  const meanComposite = mean(scores);
  const readyForBlessing =
    recCounts.retake === 0 &&
    (recCounts.lock + recCounts.exceptional) > 0 &&
    meanComposite >= 65;

  return {
    total_takes: analyses.length,
    mean_composite: Math.round(meanComposite),
    median_composite: Math.round(median),
    lock_count: recCounts.lock,
    retake_count: recCounts.retake,
    review_count: recCounts.review,
    exceptional_count: recCounts.exceptional,
    best_take_id: best.take_id,
    weakest_take_id: weakest.take_id,
    mean_authenticity: Math.round(mean(analyses.map(a => a.gemma4.authenticity_score))),
    mean_character_consistency: Math.round(mean(analyses.map(a => a.gemma4.character_consistency_score))),
    mean_identity_confidence: Math.round(mean(analyses.map(a => a.xtts.identity_confidence * 100))),
    session_ready_for_blessing: readyForBlessing,
  };
}
