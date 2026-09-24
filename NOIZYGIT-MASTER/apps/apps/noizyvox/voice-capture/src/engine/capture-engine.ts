/**
 * NOIZYVOX — Voice Capture Engine
 * 
 * Manages the recording workflow for voice takes.
 * Ties into Actor Protocol state machine and Governance blessing pipeline.
 * 
 * Flow: Plan → Record → Review → Approve → Bless → Catalogue
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { writeFileSync, readFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { CaptureSession, VoiceTake, SessionPlan } from '../schemas/capture-session';

// ─── CONFIG ──────────────────────────────────────────────

const VOICE_CAPTURE_DIR = '/Users/m2ultra/NOIZYLAB/noizyvox/voice-capture';
const SESSIONS_DIR = join(VOICE_CAPTURE_DIR, 'sessions');
const RECORDINGS_DIR = join(VOICE_CAPTURE_DIR, 'recordings');

// ─── SESSION MANAGEMENT ──────────────────────────────────

/**
 * Create a new capture session from a script.
 */
export function createSession(params: {
  session_name: string;
  session_number: number;
  actor_id: string;
  character_id: string;
  script_lines: Array<{
    line_number: number;
    text: string;
    direction?: string;
    energy_band?: 'whisper' | 'conversational' | 'performance' | 'full_power';
  }>;
}): CaptureSession {
  const now = new Date().toISOString();
  const sessionId = uuidv4();
  
  const session: CaptureSession = {
    session_id: sessionId,
    session_name: params.session_name,
    session_number: params.session_number,
    actor_id: params.actor_id,
    character_id: params.character_id,
    actor_imprint_version: 'v1',
    planned_takes: params.script_lines.length,
    script_lines: params.script_lines.map(l => ({
      ...l,
      energy_band: l.energy_band ?? 'conversational',
    })),
    recording_format: {
      codec: 'wav',
      sample_rate: 48000,
      bit_depth: 24,
      channels: 'mono',
    },
    recording_device: 'GOD M2 Ultra — Built-in Microphone',
    recording_environment: 'Home Studio — Ottawa',
    takes: [],
    total_takes: 0,
    approved_takes: 0,
    rejected_takes: 0,
    total_duration_ms: 0,
    status: 'planning',
    all_consent_confirmed: true,
    voice_ip_owner: true,
    created_at: now,
    blessed: false,
    gabriel_ingested: false as const,
  };

  // Save session
  mkdirSync(SESSIONS_DIR, { recursive: true });
  writeFileSync(
    join(SESSIONS_DIR, `${sessionId}.json`),
    JSON.stringify(session, null, 2),
  );

  return session;
}

/**
 * Start a capture session.
 */
export function startSession(sessionId: string): CaptureSession {
  const session = loadSession(sessionId);
  if (session.status !== 'planning') {
    throw new Error(`Cannot start session in status '${session.status}'`);
  }
  
  session.status = 'active';
  session.started_at = new Date().toISOString();
  saveSession(session);
  return session;
}

/**
 * Record a take within a session.
 */
export function recordTake(sessionId: string, params: {
  script_line: string;
  direction_notes?: string;
  performance_mode: 'CHARACTER' | 'ACTOR' | 'DIRECTION_INTAKE' | 'RENDER_PREVIEW' | 'LOCKED_TAKE';
  intensity?: number;
  energy_band?: 'whisper' | 'conversational' | 'performance' | 'full_power';
  improvised?: boolean;
  audio_duration_ms?: number;
}): VoiceTake {
  const session = loadSession(sessionId);
  if (session.status !== 'active') {
    throw new Error(`Cannot record — session status is '${session.status}'`);
  }
  
  const now = new Date().toISOString();
  const takeNumber = session.total_takes + 1;
  const takeId = uuidv4();
  
  // Create recording directory for this session
  const sessionRecDir = join(RECORDINGS_DIR, sessionId);
  mkdirSync(sessionRecDir, { recursive: true });
  
  const take: VoiceTake = {
    take_id: takeId,
    take_number: takeNumber,
    session_id: sessionId,
    actor_id: session.actor_id,
    character_id: session.character_id,
    script_line: params.script_line,
    direction_notes: params.direction_notes,
    performance_mode: params.performance_mode,
    intensity: params.intensity ?? 0.5,
    energy_band: params.energy_band ?? 'conversational',
    improvised: params.improvised ?? false,
    audio_file: `${sessionId}/take-${takeNumber.toString().padStart(3, '0')}.wav`,
    audio_duration_ms: params.audio_duration_ms ?? 0,
    status: 'captured',
    voice_ip_retained: true,
    consent_confirmed: true,
    started_at: now,
    blessed: false,
    gabriel_ingested: false as const,
  };
  
  session.takes.push(take);
  session.total_takes = takeNumber;
  session.total_duration_ms += take.audio_duration_ms;
  saveSession(session);
  
  return take;
}

/**
 * Review and approve/reject a take.
 */
export function reviewTake(
  sessionId: string,
  takeId: string,
  decision: 'approved' | 'rejected',
  notes?: string,
  qualityScore?: number,
  inCharacter?: boolean,
): VoiceTake {
  const session = loadSession(sessionId);
  const take = session.takes.find(t => t.take_id === takeId);
  if (!take) throw new Error(`Take ${takeId} not found in session ${sessionId}`);
  
  take.status = decision;
  take.notes = notes;
  take.quality_score = qualityScore;
  take.in_character = inCharacter;
  take.completed_at = new Date().toISOString();
  
  if (decision === 'approved') session.approved_takes++;
  if (decision === 'rejected') session.rejected_takes++;
  
  saveSession(session);
  return take;
}

/**
 * Complete a capture session.
 */
export function completeSession(sessionId: string): CaptureSession {
  const session = loadSession(sessionId);
  session.status = 'completed';
  session.completed_at = new Date().toISOString();
  saveSession(session);
  return session;
}

/**
 * Get session statistics.
 */
export function getSessionStats(sessionId: string): {
  total_takes: number;
  approved: number;
  rejected: number;
  pending_review: number;
  total_duration_ms: number;
  approval_rate: number;
  ready_for_blessing: boolean;
} {
  const session = loadSession(sessionId);
  const pending = session.takes.filter(t => t.status === 'captured').length;
  
  return {
    total_takes: session.total_takes,
    approved: session.approved_takes,
    rejected: session.rejected_takes,
    pending_review: pending,
    total_duration_ms: session.total_duration_ms,
    approval_rate: session.total_takes > 0 ? session.approved_takes / session.total_takes : 0,
    ready_for_blessing: session.status === 'completed' && pending === 0 && session.approved_takes > 0,
  };
}

// ─── HELPERS ─────────────────────────────────────────────

function loadSession(sessionId: string): CaptureSession {
  const path = join(SESSIONS_DIR, `${sessionId}.json`);
  if (!existsSync(path)) throw new Error(`Session ${sessionId} not found`);
  return JSON.parse(readFileSync(path, 'utf-8'));
}

function saveSession(session: CaptureSession): void {
  mkdirSync(SESSIONS_DIR, { recursive: true });
  writeFileSync(
    join(SESSIONS_DIR, `${session.session_id}.json`),
    JSON.stringify(session, null, 2),
  );
}
