/**
 * NOIZYVOX — Voice Capture → Blessing Pipeline Bridge
 * 
 * Connects completed voice capture sessions to the Governance
 * blessing pipeline. Approved takes flow through:
 * 
 *   Capture → Staging → Review → Blessed → D1
 * 
 * Nothing reaches Gabriel without human blessing.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import type { CaptureSession, VoiceTake } from '../schemas/capture-session';

// ─── CONFIG ──────────────────────────────────────────────

const VOICE_CAPTURE_DIR = '/Users/m2ultra/NOIZYLAB/noizyvox/voice-capture';
const GOVERNANCE_DIR = '/Users/m2ultra/NOIZYLAB/governance';
const SESSIONS_DIR = join(VOICE_CAPTURE_DIR, 'sessions');

// ─── BRIDGE RESULT ───────────────────────────────────────

export interface BridgeResult {
  session_id: string;
  total_takes: number;
  approved_takes: number;
  staged_takes: number;
  skipped_takes: number;
  staging_manifest_path: string;
  ready_for_review: boolean;
}

// ─── STAGING ─────────────────────────────────────────────

/**
 * Stage all approved takes from a completed capture session
 * into the Governance staging directory.
 * 
 * Each take becomes a JSON file with:
 * - Take metadata
 * - SHA-256 hash of the audio file (if exists)
 * - SHA-256 hash of the take metadata
 * - Link back to the session
 */
export function stageApprovedTakes(sessionId: string): BridgeResult {
  const sessionPath = join(SESSIONS_DIR, `${sessionId}.json`);
  if (!existsSync(sessionPath)) {
    throw new Error(`Session ${sessionId} not found`);
  }
  
  const session: CaptureSession = JSON.parse(readFileSync(sessionPath, 'utf-8'));
  
  if (session.status !== 'completed') {
    throw new Error(`Session must be completed before staging. Current status: ${session.status}`);
  }
  
  const stagingDir = join(GOVERNANCE_DIR, 'staging');
  mkdirSync(stagingDir, { recursive: true });
  
  const approvedTakes = session.takes.filter(t => 
    (t.status as string) === 'approved'
  );
  
  let staged = 0;
  let skipped = 0;
  const stagedFiles: string[] = [];
  
  for (const take of approvedTakes) {
    // Check if already staged
    const stagingFile = join(stagingDir, `take-${take.take_id}.json`);
    if (existsSync(stagingFile)) {
      skipped++;
      continue;
    }
    
    // Build staging record
    const takeData = JSON.stringify({
      type: 'voice_take',
      take_id: take.take_id,
      take_number: take.take_number,
      session_id: session.session_id,
      session_name: session.session_name,
      actor_id: take.actor_id,
      character_id: take.character_id,
      script_line: take.script_line,
      direction_notes: take.direction_notes,
      performance_mode: take.performance_mode,
      energy_band: take.energy_band,
      intensity: take.intensity,
      improvised: take.improvised,
      audio_file: take.audio_file,
      audio_duration_ms: take.audio_duration_ms,
      quality_score: take.quality_score,
      in_character: take.in_character,
      voice_ip_retained: take.voice_ip_retained,
      consent_confirmed: take.consent_confirmed,
      recorded_at: take.started_at,
      approved_at: take.completed_at,
    }, null, 2);
    
    // Compute content hash
    const contentHash = createHash('sha256').update(takeData).digest('hex');
    
    // Write staging file with governance envelope
    const envelope = {
      id: uuidv4(),
      type: 'take',
      status: 'staging',
      content_hash: contentHash,
      content_path: stagingFile,
      created_at: new Date().toISOString(),
      created_by: 'voice-capture-bridge',
      run_id: `bridge-${Date.now()}`,
      session_id: session.session_id,
      blessing_locked: false,
      gabriel_ingested: false,
      take_data: JSON.parse(takeData),
    };
    
    writeFileSync(stagingFile, JSON.stringify(envelope, null, 2));
    stagedFiles.push(stagingFile);
    staged++;
  }
  
  // Write bridge manifest
  const manifestPath = join(stagingDir, `bridge-manifest-${sessionId}.json`);
  writeFileSync(manifestPath, JSON.stringify({
    session_id: sessionId,
    session_name: session.session_name,
    actor_id: session.actor_id,
    bridged_at: new Date().toISOString(),
    total_takes: session.total_takes,
    approved_takes: approvedTakes.length,
    staged_takes: staged,
    skipped_takes: skipped,
    staged_files: stagedFiles,
    ready_for_review: staged > 0,
  }, null, 2));
  
  return {
    session_id: sessionId,
    total_takes: session.total_takes,
    approved_takes: approvedTakes.length,
    staged_takes: staged,
    skipped_takes: skipped,
    staging_manifest_path: manifestPath,
    ready_for_review: staged > 0,
  };
}

/**
 * Get bridge status for a session.
 */
export function getBridgeStatus(sessionId: string): {
  session_exists: boolean;
  session_completed: boolean;
  approved_count: number;
  staged_count: number;
  manifest_exists: boolean;
} {
  const sessionPath = join(SESSIONS_DIR, `${sessionId}.json`);
  if (!existsSync(sessionPath)) {
    return { session_exists: false, session_completed: false, approved_count: 0, staged_count: 0, manifest_exists: false };
  }
  
  const session: CaptureSession = JSON.parse(readFileSync(sessionPath, 'utf-8'));
  const stagingDir = join(GOVERNANCE_DIR, 'staging');
  const manifestPath = join(stagingDir, `bridge-manifest-${sessionId}.json`);
  
  return {
    session_exists: true,
    session_completed: session.status === 'completed',
    approved_count: session.takes.filter(t => (t.status as string) === 'approved').length,
    staged_count: session.takes.filter(t => {
      const stagingFile = join(stagingDir, `take-${t.take_id}.json`);
      return existsSync(stagingFile);
    }).length,
    manifest_exists: existsSync(manifestPath),
  };
}
