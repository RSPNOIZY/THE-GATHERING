/**
 * RSP001 ACTOR PROTOCOL — Take Schema
 * 
 * A take is a single performance output.
 * Only approved takes become blessed candidates.
 * The actor always has final say.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';
import { PerformanceModeSchema } from './directionEvent';

// ─── TAKE STATUS ─────────────────────────────────────────

export const TakeStatusSchema = z.enum([
  'draft',       // Generated but not yet reviewed
  'preview',     // Shown to client for approval
  'approved',    // Client approved
  'blessed',     // Final — locked, immutable, ready for production
  'rejected',    // Client rejected — kept for session history
  'discarded',   // Actor chose to throw it away
]);

// ─── TAKE QUALITY MARKERS ────────────────────────────────

export const TakeQualitySchema = z.object({
  in_character: z.boolean().describe('Did the take stay in character?'),
  direction_applied: z.boolean().describe('Did the take incorporate the latest direction?'),
  actor_satisfied: z.boolean().optional().describe('Did the actor feel good about this one?'),
  technical_clean: z.boolean().optional().describe('No pops, clicks, room noise, etc.'),
  intensity_match: z.number().min(0).max(1).optional()
    .describe('How close the take intensity matches the target'),
});

// ─── TAKE (ROOT) ─────────────────────────────────────────

export const TakeSchema = z.object({
  // Identity
  take_id: z.string().uuid(),
  session_id: z.string().uuid(),
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  character_id: z.string().min(1),
  
  // Sequence
  take_number: z.number().int().positive()
    .describe('Sequential take number within the session'),
  
  // Performance context
  mode_used: PerformanceModeSchema
    .describe('Which mode was active when this take was generated'),
  direction_event_id: z.string().uuid().optional()
    .describe('Which direction event preceded this take, if any'),
  
  // Content
  text: z.string().min(1)
    .describe('The spoken text of the take'),
  script_line: z.string().optional()
    .describe('The original script line, if scripted'),
  improvised: z.boolean().default(false)
    .describe('Was this take improvised?'),
  
  // Audio
  audio_path: z.string().optional()
    .describe('Path to audio file on GOD filesystem'),
  audio_duration_ms: z.number().int().nonnegative().optional(),
  audio_format: z.enum(['wav', 'flac', 'mp3', 'aac', 'opus']).optional(),
  
  // Status
  status: TakeStatusSchema.default('draft'),
  preview: z.boolean().default(false)
    .describe('Is this a preview take (generated for approval before recording)?'),
  
  // Quality
  quality: TakeQualitySchema.optional(),
  
  // Approval chain
  approved_by: z.string().optional()
    .describe('Who approved this take: client, director, self'),
  approved_at: z.string().datetime().optional(),
  blessed: z.boolean().default(false)
    .describe('Blessed = final, immutable, ready for production'),
  blessed_at: z.string().datetime().optional(),
  
  // Audit
  created_at: z.string().datetime(),
  gabriel_ingested: z.literal(false).default(false)
    .describe('Nothing goes to Gabriel by default'),
  
  // Voice sovereignty
  voice_ip_retained: z.literal(true).default(true)
    .describe('The actor owns this take. Always.'),
});

// ─── TYPES ───────────────────────────────────────────────

export type TakeStatus = z.infer<typeof TakeStatusSchema>;
export type TakeQuality = z.infer<typeof TakeQualitySchema>;
export type Take = z.infer<typeof TakeSchema>;
