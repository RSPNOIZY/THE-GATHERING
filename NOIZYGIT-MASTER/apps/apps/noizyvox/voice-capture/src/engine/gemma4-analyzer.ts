/**
 * NOIZYVOX — Gemma 4 Analyzer
 * 
 * Bridges to Ollama running Gemma 4 on GOD for:
 *   - Authenticity scoring
 *   - Character consistency scoring
 *   - Dimensional alignment (warmth, precision, humor, gravity, energy, emotion)
 *   - Take-lock recommendations with reasoning chains
 * 
 * Gemma 4 is the creative conscience. It interprets.
 * The human blesses. Gabriel only sees blessed truth.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { v4 as uuidv4 } from 'uuid';
import type {
  Gemma4Analysis,
  Gemma4ModelConfig,
  WhisperTranscript,
  LibrosaFeatures,
  XttsIdentity,
  DimensionalAlignment,
  TakeLockRecommendation,
} from '../schemas/gemma4-analysis';

// ─── CONFIG ──────────────────────────────────────────────

const DEFAULT_CONFIG: Gemma4ModelConfig = {
  model: 'gemma-4',
  model_variant: 'gemma-4-31b',
  ollama_endpoint: 'http://localhost:11434',
  temperature: 0.3,
  max_tokens: 2048,
};

// ─── PROMPT CONSTRUCTION ─────────────────────────────────

function buildAnalysisPrompt(params: {
  take_id: string;
  actor_id: string;
  character_id: string;
  script_line: string;
  direction_notes?: string;
  energy_band: string;
  performance_mode: string;
  transcript: WhisperTranscript;
  acoustics: LibrosaFeatures;
  identity: XttsIdentity;
  prior_takes_context?: string;
}): string {
  return `You are a voice performance analyst for NOIZY.AI. Your role is to evaluate a voice take for authenticity, character consistency, and dimensional alignment.

ACTOR: ${params.actor_id}
CHARACTER: ${params.character_id}
PERFORMANCE MODE: ${params.performance_mode}
INTENDED ENERGY BAND: ${params.energy_band}

SCRIPT LINE: "${params.script_line}"
${params.direction_notes ? `DIRECTION: ${params.direction_notes}` : ''}

WHISPER TRANSCRIPT: "${params.transcript.text}"
TRANSCRIPT CONFIDENCE: ${params.transcript.segments?.map(s => s.confidence ?? 'n/a').join(', ') || 'n/a'}

ACOUSTIC FEATURES:
- Pitch mean: ${params.acoustics.pitch_mean_hz} Hz (std: ${params.acoustics.pitch_std_hz})
- Energy RMS: ${params.acoustics.energy_rms}
- Detected energy band: ${params.acoustics.energy_band_detected}
- Spectral centroid: ${params.acoustics.spectral_centroid_mean}
- Duration: ${params.acoustics.duration_s}s

VOICE IDENTITY:
- Match confidence: ${params.identity.identity_confidence}
- Registered voice: ${params.identity.voice_id}

${params.prior_takes_context ? `PRIOR TAKES FOR THIS LINE:\n${params.prior_takes_context}` : 'This is the first take for this line.'}

Respond in EXACTLY this JSON format (no markdown, no explanation outside the JSON):
{
  "authenticity_score": <0-100>,
  "character_consistency_score": <0-100>,
  "dimensions": {
    "warmth_deviation": <-1.0 to 1.0>,
    "precision_alignment": <0.0 to 1.0>,
    "humor_alignment": <0.0 to 1.0>,
    "gravity_deviation": <-1.0 to 1.0>,
    "energy_match": <0.0 to 1.0>,
    "emotional_clarity": <0.0 to 1.0>
  },
  "recommendation": "<lock|retake|review|exceptional>",
  "confidence": <0.0 to 1.0>,
  "reasoning_summary": "<1-3 sentences explaining the assessment>",
  "reasoning_chain": ["<step 1>", "<step 2>", "..."]
}

RULES:
- authenticity_score: How genuinely "this person" the take sounds. Not technical quality — soul quality.
- character_consistency_score: How well it matches the character imprint and direction.
- recommendation "lock" = strong take, keep it. "retake" = notable issues. "review" = borderline, needs human ear. "exceptional" = exceeded expectations.
- Be honest. This is for the creator's benefit, not flattery.
- Consider the intended energy band vs. detected energy band.
- Consider transcript match to script line (exact words? natural variation? mistake?).`;
}

// ─── OLLAMA API CALL ─────────────────────────────────────

interface OllamaResponse {
  model: string;
  response: string;
  done: boolean;
  total_duration?: number;
}

async function callOllama(
  prompt: string,
  config: Gemma4ModelConfig = DEFAULT_CONFIG,
): Promise<{ response: string; duration_ms: number }> {
  const startTime = Date.now();

  const res = await fetch(`${config.ollama_endpoint}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: config.model_variant,
      prompt,
      stream: false,
      options: {
        temperature: config.temperature,
        num_predict: config.max_tokens,
      },
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Ollama API error (${res.status}): ${errorText}`);
  }

  const data = (await res.json()) as OllamaResponse;
  const duration_ms = Date.now() - startTime;

  return { response: data.response, duration_ms };
}

// ─── RESPONSE PARSING ────────────────────────────────────

interface ParsedGemma4Response {
  authenticity_score: number;
  character_consistency_score: number;
  dimensions: DimensionalAlignment;
  recommendation: TakeLockRecommendation;
  confidence: number;
  reasoning_summary: string;
  reasoning_chain?: string[];
}

function parseGemma4Response(raw: string): ParsedGemma4Response {
  // Extract JSON from response (Gemma may wrap in markdown code blocks)
  let jsonStr = raw.trim();

  // Strip markdown code fences if present
  const jsonMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (jsonMatch) {
    jsonStr = jsonMatch[1].trim();
  }

  // Try to find raw JSON object
  const braceMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (braceMatch) {
    jsonStr = braceMatch[0];
  }

  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (e) {
    throw new Error(`Failed to parse Gemma 4 response as JSON: ${raw.substring(0, 200)}`);
  }

  // Validate and clamp values
  const clamp = (v: unknown, min: number, max: number, fallback: number): number => {
    const n = Number(v);
    if (isNaN(n)) return fallback;
    return Math.min(max, Math.max(min, n));
  };

  const dims = (parsed.dimensions ?? {}) as Record<string, unknown>;

  const validRecommendations = ['lock', 'retake', 'review', 'exceptional'];
  const rec = String(parsed.recommendation ?? 'review').toLowerCase();

  return {
    authenticity_score: Math.round(clamp(parsed.authenticity_score, 0, 100, 50)),
    character_consistency_score: Math.round(clamp(parsed.character_consistency_score, 0, 100, 50)),
    dimensions: {
      warmth_deviation: clamp(dims.warmth_deviation, -1, 1, 0),
      precision_alignment: clamp(dims.precision_alignment, 0, 1, 0.5),
      humor_alignment: clamp(dims.humor_alignment, 0, 1, 0.5),
      gravity_deviation: clamp(dims.gravity_deviation, -1, 1, 0),
      energy_match: clamp(dims.energy_match, 0, 1, 0.5),
      emotional_clarity: clamp(dims.emotional_clarity, 0, 1, 0.5),
    },
    recommendation: (validRecommendations.includes(rec) ? rec : 'review') as TakeLockRecommendation,
    confidence: clamp(parsed.confidence, 0, 1, 0.5),
    reasoning_summary: String(parsed.reasoning_summary ?? 'Analysis completed.'),
    reasoning_chain: Array.isArray(parsed.reasoning_chain)
      ? parsed.reasoning_chain.map(String)
      : undefined,
  };
}

// ─── PUBLIC API ──────────────────────────────────────────

/**
 * Run Gemma 4 analysis on a voice take.
 * 
 * Requires upstream inputs from Whisper, Librosa, and XTTS.
 * Returns a full Gemma4Analysis record ready for governed storage.
 */
export async function analyzeWithGemma4(params: {
  take_id: string;
  session_id: string;
  actor_id: string;
  character_id: string;
  script_line: string;
  direction_notes?: string;
  energy_band: 'whisper' | 'conversational' | 'performance' | 'full_power';
  performance_mode: string;
  transcript: WhisperTranscript;
  acoustics: LibrosaFeatures;
  identity: XttsIdentity;
  prior_takes_context?: string;
  config?: Partial<Gemma4ModelConfig>;
}): Promise<Gemma4Analysis> {
  const config: Gemma4ModelConfig = { ...DEFAULT_CONFIG, ...params.config };

  const prompt = buildAnalysisPrompt({
    take_id: params.take_id,
    actor_id: params.actor_id,
    character_id: params.character_id,
    script_line: params.script_line,
    direction_notes: params.direction_notes,
    energy_band: params.energy_band,
    performance_mode: params.performance_mode,
    transcript: params.transcript,
    acoustics: params.acoustics,
    identity: params.identity,
    prior_takes_context: params.prior_takes_context,
  });

  const { response: rawResponse, duration_ms } = await callOllama(prompt, config);
  const parsed = parseGemma4Response(rawResponse);

  const analysis: Gemma4Analysis = {
    analysis_id: uuidv4(),
    take_id: params.take_id,
    session_id: params.session_id,
    actor_id: params.actor_id,

    model: config.model,
    model_variant: config.model_variant,
    analysis_duration_ms: duration_ms,

    authenticity_score: parsed.authenticity_score,
    character_consistency_score: parsed.character_consistency_score,
    dimensions: parsed.dimensions,

    recommendation: parsed.recommendation,
    confidence: parsed.confidence,

    reasoning_summary: parsed.reasoning_summary,
    reasoning_chain: parsed.reasoning_chain,

    analyzed_at: new Date().toISOString(),

    blessed: false as const,
    gabriel_ingested: false as const,
  };

  return analysis;
}

/**
 * Check if Gemma 4 is available on the Ollama endpoint.
 */
export async function checkGemma4Available(
  config: Partial<Gemma4ModelConfig> = {},
): Promise<{ available: boolean; models: string[]; error?: string }> {
  const endpoint = config.ollama_endpoint ?? DEFAULT_CONFIG.ollama_endpoint;

  try {
    const res = await fetch(`${endpoint}/api/tags`);
    if (!res.ok) {
      return { available: false, models: [], error: `Ollama returned ${res.status}` };
    }

    const data = (await res.json()) as { models: Array<{ name: string }> };
    const modelNames = data.models.map(m => m.name);
    const variant = config.model_variant ?? DEFAULT_CONFIG.model_variant;
    const available = modelNames.some(n => n.includes('gemma') && n.includes('4'));

    return { available, models: modelNames };
  } catch (e) {
    return {
      available: false,
      models: [],
      error: `Cannot reach Ollama at ${endpoint}: ${(e as Error).message}`,
    };
  }
}

export { DEFAULT_CONFIG as GEMMA4_DEFAULT_CONFIG };
