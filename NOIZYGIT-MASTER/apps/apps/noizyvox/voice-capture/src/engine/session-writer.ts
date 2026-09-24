/**
 * NOIZYVOX — Session Writer
 * 
 * Writes governed .json and .md files for voice capture sessions.
 * All outputs respect the governance pipeline:
 *   - gabriel_ingest = false (ALWAYS)
 *   - blessed = false (until human reviews)
 *   - SHA-256 content hashes on every governed artifact
 * 
 * Output locations:
 *   JSON → noizyvox/voice-capture/sessions/{session_id}.json
 *   MD   → noizyvox/voice-capture/sessions/{session_id}.md
 *   Analysis → noizyvox/voice-capture/sessions/{session_id}/analysis/
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { writeFileSync, mkdirSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';
import type { CaptureSession, VoiceTake } from '../schemas/capture-session';
import type {
  CompositeTakeAnalysis,
  Gemma4Analysis,
} from '../schemas/gemma4-analysis';

// ─── CONFIG ──────────────────────────────────────────────

const VOICE_CAPTURE_DIR = '/Users/m2ultra/NOIZYLAB/noizyvox/voice-capture';
const SESSIONS_DIR = join(VOICE_CAPTURE_DIR, 'sessions');

// ─── SHA-256 ─────────────────────────────────────────────

function sha256(content: string): string {
  return createHash('sha256').update(content, 'utf-8').digest('hex');
}

// ─── GOVERNED JSON WRITER ────────────────────────────────

export interface GovernedJsonEnvelope {
  content_type: string;
  content_hash: string;
  created_at: string;
  blessed: false;
  gabriel_ingested: false;
  pipeline_version: string;
  data: unknown;
}

/**
 * Write a governed JSON file with SHA-256 content hash.
 * Returns the envelope including the hash.
 */
export function writeGovernedJson(
  filepath: string,
  contentType: string,
  data: unknown,
): GovernedJsonEnvelope {
  const dataStr = JSON.stringify(data, null, 2);
  const contentHash = sha256(dataStr);

  const envelope: GovernedJsonEnvelope = {
    content_type: contentType,
    content_hash: contentHash,
    created_at: new Date().toISOString(),
    blessed: false,
    gabriel_ingested: false,
    pipeline_version: '1.0.0',
    data,
  };

  const dir = filepath.substring(0, filepath.lastIndexOf('/'));
  mkdirSync(dir, { recursive: true });
  writeFileSync(filepath, JSON.stringify(envelope, null, 2));

  return envelope;
}

// ─── SESSION ANALYSIS WRITER ─────────────────────────────

/**
 * Write a Gemma 4 analysis result for a specific take.
 */
export function writeTakeAnalysis(
  sessionId: string,
  analysis: Gemma4Analysis,
): GovernedJsonEnvelope {
  const analysisDir = join(SESSIONS_DIR, sessionId, 'analysis');
  const filepath = join(analysisDir, `gemma4-${analysis.take_id}.json`);

  return writeGovernedJson(filepath, 'gemma4_analysis', analysis);
}

/**
 * Write a composite take analysis (all engines combined).
 */
export function writeCompositeAnalysis(
  sessionId: string,
  composite: CompositeTakeAnalysis,
): GovernedJsonEnvelope {
  const analysisDir = join(SESSIONS_DIR, sessionId, 'analysis');
  const filepath = join(analysisDir, `composite-${composite.take_id}.json`);

  return writeGovernedJson(filepath, 'composite_take_analysis', composite);
}

// ─── SESSION MARKDOWN WRITER ─────────────────────────────

/**
 * Generate a human-readable markdown report for a capture session.
 * Includes take-by-take analysis if available.
 */
export function writeSessionMarkdown(
  session: CaptureSession,
  analyses?: CompositeTakeAnalysis[],
): string {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push(`# Voice Capture Session Report`);
  lines.push(``);
  lines.push(`**Session:** ${session.session_name}`);
  lines.push(`**ID:** \`${session.session_id}\``);
  lines.push(`**Actor:** ${session.actor_id} → ${session.character_id}`);
  lines.push(`**Status:** ${session.status}`);
  lines.push(`**Generated:** ${now}`);
  lines.push(``);
  lines.push(`---`);
  lines.push(``);

  // Session summary
  lines.push(`## Summary`);
  lines.push(``);
  lines.push(`Total takes: ${session.total_takes}`);
  lines.push(`Approved: ${session.approved_takes}`);
  lines.push(`Rejected: ${session.rejected_takes}`);
  lines.push(`Pending review: ${session.takes.filter(t => t.status === 'captured').length}`);
  lines.push(`Total duration: ${(session.total_duration_ms / 1000).toFixed(1)}s`);
  lines.push(`Blessed: ${session.blessed ? 'YES' : 'NO'}`);
  lines.push(`Gabriel ingested: ${session.gabriel_ingested ? 'YES' : 'NO'}`);
  lines.push(``);

  // Take-by-take table
  lines.push(`## Takes`);
  lines.push(``);
  lines.push(`| # | Script Line | Status | Energy | Score | Rec |`);
  lines.push(`|---|-------------|--------|--------|-------|-----|`);

  for (const take of session.takes) {
    const analysis = analyses?.find(a => a.take_id === take.take_id);
    const score = analysis ? `${analysis.composite_score}` : '—';
    const rec = analysis ? analysis.final_recommendation.toUpperCase() : '—';
    const scriptPreview = take.script_line.length > 40
      ? take.script_line.substring(0, 37) + '...'
      : take.script_line;

    lines.push(
      `| ${take.take_number} | ${scriptPreview} | ${take.status} | ${take.energy_band} | ${score} | ${rec} |`
    );
  }
  lines.push(``);

  // Gemma 4 analysis details
  if (analyses && analyses.length > 0) {
    lines.push(`## Gemma 4 Analysis`);
    lines.push(``);

    for (const analysis of analyses) {
      const g = analysis.gemma4;
      lines.push(`### Take ${analysis.take_id.substring(0, 8)}`);
      lines.push(``);
      lines.push(`Authenticity: **${g.authenticity_score}** / Character: **${g.character_consistency_score}** / Composite: **${analysis.composite_score}**`);
      lines.push(``);
      lines.push(`Dimensions: warmth=${g.dimensions.warmth_deviation.toFixed(2)}, precision=${g.dimensions.precision_alignment.toFixed(2)}, humor=${g.dimensions.humor_alignment.toFixed(2)}, gravity=${g.dimensions.gravity_deviation.toFixed(2)}, energy=${g.dimensions.energy_match.toFixed(2)}, emotion=${g.dimensions.emotional_clarity.toFixed(2)}`);
      lines.push(``);
      lines.push(`Recommendation: **${g.recommendation.toUpperCase()}** (confidence: ${g.confidence.toFixed(2)})`);
      lines.push(``);
      lines.push(`> ${g.reasoning_summary}`);
      lines.push(``);
    }
  }

  // Governance footer
  lines.push(`---`);
  lines.push(``);
  lines.push(`*This report is governed. blessed=false, gabriel_ingested=false.*`);
  lines.push(`*Only blessed records reach Gabriel. Human review required.*`);
  lines.push(``);
  lines.push(`Content hash: \`${sha256(lines.join('\n'))}\``);

  const md = lines.join('\n');

  // Write the file
  const filepath = join(SESSIONS_DIR, `${session.session_id}.md`);
  mkdirSync(SESSIONS_DIR, { recursive: true });
  writeFileSync(filepath, md);

  return md;
}

// ─── SESSION JSON UPDATER ────────────────────────────────

/**
 * Update the session JSON with latest state.
 * Preserves governance flags.
 */
export function updateSessionJson(session: CaptureSession): GovernedJsonEnvelope {
  const filepath = join(SESSIONS_DIR, `${session.session_id}.json`);
  return writeGovernedJson(filepath, 'capture_session', session);
}

// ─── ANALYSIS MANIFEST ───────────────────────────────────

/**
 * Write a manifest listing all analysis files for a session.
 * Useful for the blessing pipeline to know what to review.
 */
export function writeAnalysisManifest(
  sessionId: string,
  analyses: CompositeTakeAnalysis[],
): GovernedJsonEnvelope {
  const manifest = {
    session_id: sessionId,
    total_analyses: analyses.length,
    takes: analyses.map(a => ({
      take_id: a.take_id,
      composite_score: a.composite_score,
      final_recommendation: a.final_recommendation,
      gemma4_authenticity: a.gemma4.authenticity_score,
      gemma4_character: a.gemma4.character_consistency_score,
      identity_confidence: a.xtts.identity_confidence,
    })),
    locks: analyses.filter(a => a.final_recommendation === 'lock').length,
    retakes: analyses.filter(a => a.final_recommendation === 'retake').length,
    reviews: analyses.filter(a => a.final_recommendation === 'review').length,
    exceptionals: analyses.filter(a => a.final_recommendation === 'exceptional').length,
    ready_for_blessing: analyses.every(a =>
      a.final_recommendation === 'lock' || a.final_recommendation === 'exceptional'
    ) && analyses.length > 0,
    generated_at: new Date().toISOString(),
  };

  const filepath = join(SESSIONS_DIR, sessionId, 'analysis', 'manifest.json');
  return writeGovernedJson(filepath, 'analysis_manifest', manifest);
}
