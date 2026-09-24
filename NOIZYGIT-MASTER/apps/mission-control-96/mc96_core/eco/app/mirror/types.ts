/**
 * NOIZY Mirror v1 — Data Objects
 *
 * Three core records:
 *   creative_brief   — the artist's raw input + structured interpretation
 *   mirror_analysis  — Claude's reflection (what changed, why, next moves)
 *   automation_run   — every automation writes back a run_id
 */

// ── Source types ──────────────────────────────────────────────────────────────

export type SourceType =
  | 'paragraph'
  | 'lyric_fragment'
  | 'voice_memo_transcript'
  | 'reference_track_note'
  | 'mood_phrase';

// ── Creative Brief ────────────────────────────────────────────────────────────

export interface CreativeBrief {
  brief_id: string;
  title: string;
  artist_name: string;
  source_type: SourceType;
  source_text: string;

  // Structured interpretation (filled by Mirror)
  emotional_target: string;
  sonic_palette: string[];
  structure_notes: string;
  production_cautions: string[];
  next_moves: string[];          // exactly 3

  // Metadata
  project_id?: string;           // Notion page ID of parent project
  tags: string[];
  created_at: number;            // epoch ms
  updated_at: number;
}

// ── Mirror Analysis ───────────────────────────────────────────────────────────

export interface MirrorAnalysis {
  analysis_id: string;
  brief_id: string;

  // The reflection
  interpretation: string;        // what you said → what it means creatively
  what_changed: string;          // delta from raw input to structured brief
  why_changed: string;           // reasoning behind the interpretation
  confidence_notes: string;      // where the model is uncertain

  // Route suggestions
  suggested_lane: 'signal' | 'forge' | 'ledger' | 'human_collab';
  next_moves: string[];          // 3 concrete next actions

  // Provenance
  model_used: string;            // e.g. "claude-opus-4-6"
  run_id: string;                // links to automation_run
  created_at: number;
}

// ── Automation Run ────────────────────────────────────────────────────────────

export type RunStatus = 'started' | 'completed' | 'failed' | 'skipped';

export interface AutomationRun {
  run_id: string;
  workflow_name: string;         // e.g. "mirror-brief-create", "mirror-to-spec"
  status: RunStatus;
  started_at: number;
  completed_at?: number;
  duration_ms?: number;
  artifact_links: string[];      // Notion page URLs, file paths, etc.
  error?: string;
  metadata?: Record<string, unknown>;
}

// ── API Request / Response ────────────────────────────────────────────────────

export interface MirrorRequest {
  source_text: string;
  source_type: SourceType;
  artist_name: string;
  title?: string;
  reference_notes?: string;
  voice_transcript?: string;
  project_id?: string;
}

export interface MirrorResponse {
  ok: boolean;
  brief: CreativeBrief;
  analysis: MirrorAnalysis;
  run: AutomationRun;
  ts: number;
}
