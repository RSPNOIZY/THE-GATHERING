/**
 * NOIZYVOX — Voice Capture Session Schema
 * 
 * Each session records a batch of voice takes for a specific actor
 * performing a specific character. Sessions tie into the Actor Protocol
 * state machine and the Governance blessing pipeline.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── RECORDING FORMAT ────────────────────────────────────

export const RecordingFormatSchema = z.object({
  codec: z.enum(['wav', 'flac', 'opus', 'mp3']).default('wav'),
  sample_rate: z.number().int().min(16000).max(96000).default(48000),
  bit_depth: z.number().int().min(16).max(32).default(24),
  channels: z.enum(['mono', 'stereo']).default('mono'),
});

// ─── TAKE ────────────────────────────────────────────────

export const TakeStatusSchema = z.enum([
  'recording',    // Currently capturing
  'captured',     // Audio saved, not yet reviewed
  'reviewed',     // Human has listened
  'approved',     // Approved for blessing pipeline
  'rejected',     // Not usable
  'blessed',      // Through the blessing gate
]);

export const VoiceTakeSchema = z.object({
  take_id: z.string().uuid(),
  take_number: z.number().int().positive(),
  session_id: z.string().uuid(),
  
  // Actor Protocol link
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  character_id: z.string().min(1),
  
  // Content
  script_line: z.string().min(1)
    .describe('The text being performed'),
  direction_notes: z.string().optional()
    .describe('Direction given before this take'),
  
  // Performance metadata
  performance_mode: z.enum(['CHARACTER', 'ACTOR', 'DIRECTION_INTAKE', 'RENDER_PREVIEW', 'LOCKED_TAKE']),
  intensity: z.number().min(0).max(1).default(0.5),
  energy_band: z.enum(['whisper', 'conversational', 'performance', 'full_power']).default('conversational'),
  improvised: z.boolean().default(false),
  
  // Audio
  audio_file: z.string().optional()
    .describe('Path to audio file relative to recordings/'),
  audio_duration_ms: z.number().int().nonnegative().default(0),
  audio_format: RecordingFormatSchema.optional(),
  
  // Quality
  status: TakeStatusSchema.default('captured'),
  quality_score: z.number().min(0).max(1).optional(),
  in_character: z.boolean().optional(),
  notes: z.string().optional(),
  
  // Voice sovereignty
  voice_ip_retained: z.literal(true).default(true),
  consent_confirmed: z.boolean().default(true),
  
  // Timestamps
  started_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  
  // Governance
  blessed: z.boolean().default(false),
  blessed_by: z.string().optional(),
  blessed_at: z.string().datetime().optional(),
  gabriel_ingested: z.literal(false).default(false),
});

// ─── CAPTURE SESSION ─────────────────────────────────────

export const CaptureSessionSchema = z.object({
  session_id: z.string().uuid(),
  session_name: z.string().min(1),
  session_number: z.number().int().positive(),
  
  // Actor Protocol
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  character_id: z.string().min(1),
  actor_imprint_version: z.string().default('v1'),
  
  // Session plan
  planned_takes: z.number().int().positive(),
  script_lines: z.array(z.object({
    line_number: z.number().int().positive(),
    text: z.string().min(1),
    direction: z.string().optional(),
    energy_band: z.enum(['whisper', 'conversational', 'performance', 'full_power']).default('conversational'),
    target_duration_ms: z.number().int().positive().optional(),
  })),
  
  // Recording config
  recording_format: RecordingFormatSchema,
  recording_device: z.string().default('GOD M2 Ultra — Built-in Microphone'),
  recording_environment: z.string().default('Home Studio — Ottawa'),
  
  // Takes
  takes: z.array(VoiceTakeSchema).default([]),
  
  // Session stats
  total_takes: z.number().int().nonnegative().default(0),
  approved_takes: z.number().int().nonnegative().default(0),
  rejected_takes: z.number().int().nonnegative().default(0),
  total_duration_ms: z.number().int().nonnegative().default(0),
  
  // Status
  status: z.enum(['planning', 'active', 'paused', 'completed', 'archived']).default('planning'),
  
  // Voice sovereignty
  all_consent_confirmed: z.boolean().default(true),
  voice_ip_owner: z.literal(true).default(true),
  
  // Timestamps
  created_at: z.string().datetime(),
  started_at: z.string().datetime().optional(),
  completed_at: z.string().datetime().optional(),
  
  // Governance
  blessed: z.boolean().default(false),
  blessed_by: z.string().optional(),
  gabriel_ingested: z.literal(false).default(false),
});

// ─── SESSION PLAN (35 TAKES) ─────────────────────────────

export const SessionPlanSchema = z.object({
  plan_id: z.string().uuid(),
  plan_name: z.string(),
  
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  character_id: z.string(),
  
  // The 35 takes
  total_planned_sessions: z.number().int().positive(),
  total_planned_takes: z.number().int().positive(),
  
  sessions: z.array(z.object({
    session_number: z.number().int().positive(),
    session_name: z.string(),
    planned_takes: z.number().int().positive(),
    energy_focus: z.enum(['whisper', 'conversational', 'performance', 'full_power', 'mixed']),
    description: z.string(),
  })),
  
  // Revenue readiness
  catalogue_target: z.number().int().positive()
    .describe('Minimum takes needed to open the catalogue'),
  teaching_ready_at: z.number().int().positive()
    .describe('Takes needed before teaching pipeline can launch'),
  
  created_at: z.string().datetime(),
  status: z.enum(['draft', 'approved', 'active', 'completed']).default('draft'),
});

// ─── TYPES ───────────────────────────────────────────────

export type RecordingFormat = z.infer<typeof RecordingFormatSchema>;
export type TakeStatus = z.infer<typeof TakeStatusSchema>;
export type VoiceTake = z.infer<typeof VoiceTakeSchema>;
export type CaptureSession = z.infer<typeof CaptureSessionSchema>;
export type SessionPlan = z.infer<typeof SessionPlanSchema>;
