# NOIZYVOX Voice Pipeline — Architecture Specification

**Version:** 1.0.0  
**Author:** Robert Stephen Plowman  
**Date:** 2026-04-02  
**Status:** Active  

---

## Pipeline Overview

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────────┐     ┌─────────┐     ┌─────────┐
│   CAPTURE    │ ──▶ │   WHISPER   │ ──▶ │   LIBROSA   │ ──▶ │    XTTS     │ ──▶ │ GEMMA 4 │ ──▶ │  HUMAN  │
│  (WAV file)  │     │ (transcript) │     │ (acoustics)  │     │ (identity)  │     │ (interp) │     │(blessing)│
└─────────────┘     └─────────────┘     └─────────────┘     └─────────────┘     └─────────┘     └─────────┘
                                                                                                       │
                                                                                                       ▼
                                                                                                  ┌─────────┐
                                                                                                  │ GABRIEL │
                                                                                                  │ (truth)  │
                                                                                                  └─────────┘
```

## Engine Roles

| Engine | Role | Output | Runs On |
|--------|------|--------|---------|
| **Audio Hijack / AU / AirPlay / UAD** | Capture raw audio | WAV 48kHz/24bit mono | External target |
| **Whisper** (large-v3) | Transcription | Text + word timestamps + confidence | GOD |
| **Librosa** | Acoustic feature extraction | Pitch, energy, formants, MFCCs, spectral | GOD |
| **XTTS** / RVC | Voice identity + cleanup | Speaker embedding + identity confidence | GOD |
| **Gemma 4** (31B) | Interpretation + scoring + recommendation | Authenticity, character, dimensional alignment | GOD (Ollama) |
| **Human** | Blessing decision | approved / rejected | Human |
| **Gabriel** | Ingestion of blessed truth | D1 records | Cloudflare |

## Gemma 4 Specific Role

Gemma 4 is the **creative conscience**, not the judge. It:

- **Interprets** emotional quality, character consistency, and authenticity
- **Scores** across 6 dimensional axes (warmth, precision, humor, gravity, energy, emotion)
- **Recommends** take-lock decisions: `lock`, `retake`, `review`, `exceptional`
- **Explains** via reasoning chains — human-readable rationale for every score

Gemma 4 does **NOT**:

- Perform raw transcription (that's Whisper)
- Extract acoustic features (that's Librosa)
- Verify speaker identity (that's XTTS)
- Make final approval decisions (that's the Human)

## Gemma 4 Model Selection

| Variant | Size | Use Case |
|---------|------|----------|
| `gemma-4-31b` | 31B | Full reasoning on GOD — primary analysis engine |
| `gemma-4-26b-a4b` | 26B A4B | Alternative if memory-constrained |
| `gemma-4-e4b` | E4B | Edge/mobile experimentation |
| `gemma-4-e2b` | E2B | Lightest edge deployment |
| `gemma-3n` | 3n | Device-side quick checks, audio on small models |

**Default deployment:** `gemma-4-31b` on GOD via Ollama.

## Gemma 4 Analysis Schema

```json
{
  "gemma4_analysis": {
    "model": "gemma-4",
    "model_variant": "gemma-4-31b",
    "authenticity_score": 87,
    "character_consistency_score": 91,
    "dimensions": {
      "warmth_deviation": -0.11,
      "precision_alignment": 0.95,
      "humor_alignment": 0.74,
      "gravity_deviation": 0.02,
      "energy_match": 0.88,
      "emotional_clarity": 0.82
    },
    "recommendation": "lock",
    "confidence": 0.91,
    "reasoning_summary": "Character consistent. Warmth slightly reserved. Precision strong. Dry humor could be pushed further on next take.",
    "reasoning_chain": [
      "Transcript matches script with 97% word overlap",
      "Energy band detected as 'conversational' matches intended 'conversational'",
      "XTTS identity confidence 0.96 — confirmed RSP_001",
      "Warmth is 0.11 below imprint baseline — slightly more guarded than usual",
      "Precision in delivery is excellent — clear diction, intentional pacing",
      "Humor present but understated — imprint suggests more dry wit potential"
    ]
  }
}
```

## Composite Scoring Weights

| Dimension | Weight | Source |
|-----------|--------|--------|
| Authenticity | 30% | Gemma 4 |
| Identity confidence | 20% | XTTS |
| Character consistency | 25% | Gemma 4 |
| Energy match | 15% | Gemma 4 (60%) + Librosa (40%) |
| Emotional clarity | 10% | Gemma 4 |

## File Architecture

```
noizyvox/voice-capture/
├── src/
│   ├── schemas/
│   │   ├── capture-session.ts      # Session + take schemas (existing)
│   │   ├── gini-monitor.ts         # Gini coefficient (existing)
│   │   └── gemma4-analysis.ts      # NEW — Gemma 4 + composite schemas
│   ├── engine/
│   │   ├── capture-engine.ts       # Session management (existing)
│   │   ├── blessing-bridge.ts      # Governance staging (existing)
│   │   ├── gemma4-analyzer.ts      # NEW — Ollama bridge for Gemma 4
│   │   ├── take-scoring.ts         # NEW — Composite scoring engine
│   │   ├── session-writer.ts       # NEW — Governed JSON/MD writer
│   │   └── capture-watcher.ts      # NEW — File watcher for WAVs
│   ├── index.ts                    # Barrel export (needs update)
│   └── fixtures/
│       └── rsp001-35-takes.ts      # RSP_001 session plan (existing)
├── sessions/                        # Session data + analysis output
├── recordings/                      # Audio file references
└── logic-template-spec.md          # THIS FILE
```

## Storage Rules

1. **Raw WAVs** → external target only (`/Volumes/NOIZYLAB-EXT/voice-captures/`)
2. **Processed audio / fingerprints** → external pipeline directory
3. **Metadata / analysis JSON** → `noizyvox/voice-capture/sessions/`
4. **VS Code Insiders** → orchestration, file watching, metadata display, command execution, review UI
5. **System drive** → sacred. No heavy media. Code and governed artifacts only.

## Governance Rules

Every artifact written by this pipeline follows the blessing gate:

1. `gabriel_ingested = false` — ALWAYS on write
2. `blessed = false` — ALWAYS on write
3. SHA-256 content hash — on every governed JSON envelope
4. Only human blessing can set `blessed = true`
5. Only blessed records reach Gabriel
6. Gabriel never sees unblessed analysis, recommendations, or scores

## D1 Schema Additions

```sql
-- Gemma 4 analysis results
CREATE TABLE IF NOT EXISTS gemma4_analyses (
  analysis_id TEXT PRIMARY KEY,
  take_id TEXT NOT NULL,
  session_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  model TEXT NOT NULL DEFAULT 'gemma-4',
  model_variant TEXT NOT NULL DEFAULT 'gemma-4-31b',
  analysis_duration_ms INTEGER NOT NULL DEFAULT 0,
  authenticity_score INTEGER NOT NULL CHECK(authenticity_score BETWEEN 0 AND 100),
  character_consistency_score INTEGER NOT NULL CHECK(character_consistency_score BETWEEN 0 AND 100),
  warmth_deviation REAL NOT NULL,
  precision_alignment REAL NOT NULL,
  humor_alignment REAL NOT NULL,
  gravity_deviation REAL NOT NULL,
  energy_match REAL NOT NULL,
  emotional_clarity REAL NOT NULL,
  recommendation TEXT NOT NULL CHECK(recommendation IN ('lock','retake','review','exceptional')),
  confidence REAL NOT NULL CHECK(confidence BETWEEN 0 AND 1),
  reasoning_summary TEXT NOT NULL,
  reasoning_chain TEXT,
  relative_rank INTEGER,
  improvement_notes TEXT,
  analyzed_at TEXT NOT NULL,
  blessed INTEGER NOT NULL DEFAULT 0,
  gabriel_ingested INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (take_id) REFERENCES voice_takes(take_id),
  FOREIGN KEY (session_id) REFERENCES voice_capture_sessions(session_id)
);

-- Composite take analysis (all engines combined)
CREATE TABLE IF NOT EXISTS composite_take_analyses (
  take_id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  actor_id TEXT NOT NULL,
  composite_score INTEGER NOT NULL CHECK(composite_score BETWEEN 0 AND 100),
  weight_authenticity REAL NOT NULL DEFAULT 0.30,
  weight_character REAL NOT NULL DEFAULT 0.25,
  weight_energy REAL NOT NULL DEFAULT 0.15,
  weight_identity REAL NOT NULL DEFAULT 0.20,
  weight_emotion REAL NOT NULL DEFAULT 0.10,
  final_recommendation TEXT NOT NULL CHECK(final_recommendation IN ('lock','retake','review','exceptional')),
  whisper_transcript TEXT,
  whisper_duration_s REAL,
  librosa_pitch_mean REAL,
  librosa_energy_rms REAL,
  librosa_energy_band TEXT,
  xtts_identity_confidence REAL,
  xtts_voice_id TEXT,
  pipeline_version TEXT NOT NULL DEFAULT '1.0.0',
  analyzed_at TEXT NOT NULL,
  blessed INTEGER NOT NULL DEFAULT 0,
  gabriel_ingested INTEGER NOT NULL DEFAULT 0,
  FOREIGN KEY (take_id) REFERENCES voice_takes(take_id),
  FOREIGN KEY (session_id) REFERENCES voice_capture_sessions(session_id)
);

-- Index for session-level queries
CREATE INDEX IF NOT EXISTS idx_gemma4_session ON gemma4_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_gemma4_recommendation ON gemma4_analyses(recommendation);
CREATE INDEX IF NOT EXISTS idx_composite_session ON composite_take_analyses(session_id);
CREATE INDEX IF NOT EXISTS idx_composite_recommendation ON composite_take_analyses(final_recommendation);
```

## Next Steps

1. Pull Gemma 4 31B via Ollama on GOD: `ollama pull gemma4:31b`
2. Install crontab: `crontab /Users/m2ultra/NOIZYLAB/ops/noizy-crontab`
3. Enable R2 at dash.cloudflare.com
4. Configure external capture target: `/Volumes/NOIZYLAB-EXT/voice-captures/`
5. Record founding 35 takes with RSP_001
6. Run first Gemma 4 analysis pass on test takes
7. Wire n8n to composite analysis output for notification feeds
