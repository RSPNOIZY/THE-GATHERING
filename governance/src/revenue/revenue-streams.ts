/**
 * NOIZY.AI GOVERNANCE — Revenue Stream Schema
 * 
 * Every revenue stream is typed, tracked, and constitutionally bound.
 * Teacher royalty + student credit. Collaboration remix splits.
 * Auto-split at creation time, not after.
 * 
 * The math is transparent. The splits are immutable once created.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── REVENUE STREAM TYPES ────────────────────────────────

export const RevenueStreamTypeSchema = z.enum([
  'teaching',              // RSP_001 teaches at NOIZY, student uses voice
  'mentorship',            // Ongoing mentorship relationship, recurring royalty
  'solo_performance',      // Single actor, single voice, no collaboration
  'collaboration_remix',   // RSP_001 voice + another creator's music
  'cross_actor',           // RSP_001 voice + another actor's character
  'student_project',       // Student creates using teacher's voice asset
  'community_pool',        // Community-generated content, pool split
  'licensing',             // External licensing of voice/music assets
]);

// ─── PARTICIPANT ROLE ────────────────────────────────────

export const ParticipantRoleSchema = z.enum([
  'voice_owner',           // Owns the voice being used
  'music_creator',         // Created the music/beat/composition
  'actor_performer',       // Performed a character using someone's voice
  'teacher',               // Taught the skill, gets teacher royalty
  'student',               // Learned and created, gets student credit
  'remixer',               // Remixed existing assets into new work
  'producer',              // Produced/directed the collaboration
  'platform',              // NOIZY.AI platform share
  'community',             // Community fund share
  'legal',                 // Legal reserve share
]);

// ─── PARTICIPANT ─────────────────────────────────────────

export const StreamParticipantSchema = z.object({
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  role: ParticipantRoleSchema,
  share_percent: z.number().min(0).max(100),
  
  // Consent
  consent_granted: z.boolean(),
  consent_key: z.string().optional(),
  consent_granted_at: z.string().datetime().optional(),
  
  // For teaching/mentorship
  is_teacher: z.boolean().default(false),
  is_student: z.boolean().default(false),
  teacher_royalty_percent: z.number().min(0).max(100).optional()
    .describe('Percentage of student revenue that flows to teacher'),
  
  // Voice contribution
  voice_contributed: z.boolean().default(false),
  voice_asset_id: z.string().optional()
    .describe('NOIZYVOX AVA ID if voice is contributed'),
});

// ─── REVENUE STREAM (ROOT) ──────────────────────────────

export const RevenueStreamSchema = z.object({
  stream_id: z.string().uuid(),
  project_id: z.string().min(1)
    .describe('The project that generates this revenue'),
  stream_type: RevenueStreamTypeSchema,
  
  // Participants — everyone who gets a share
  participants: z.array(StreamParticipantSchema).min(1),
  
  // Constitutional checks
  total_creator_share: z.number()
    .describe('Sum of all creator shares — must be >= 70%'),
  platform_share: z.number()
    .describe('Platform share — must be <= 25% public, <= 10% internal founding'),
  community_share: z.number().default(3),
  legal_share: z.number().default(2),
  
  // Teaching/mentorship metadata
  teaching_relationship: z.object({
    teacher_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
    student_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
    teacher_royalty_percent: z.number().min(0).max(50)
      .describe('Teacher gets this % of the student project revenue. Max 50% — student always gets majority of their own work.'),
    course_id: z.string().optional(),
    mentorship_start: z.string().datetime().optional(),
  }).optional(),
  
  // Collaboration metadata
  collaboration: z.object({
    voice_contributors: z.array(z.string())
      .describe('Actor IDs who contributed voice'),
    music_contributors: z.array(z.string())
      .describe('Actor IDs who contributed music'),
    character_contributors: z.array(z.string())
      .describe('Actor IDs whose character profiles are used'),
    split_method: z.enum([
      'equal',             // Equal split among contributors
      'voice_weighted',    // More weight to voice contributors
      'negotiated',        // Custom negotiated split
      'duration_weighted', // Split by seconds of contribution
    ]),
  }).optional(),
  
  // Immutability
  created_at: z.string().datetime(),
  locked: z.boolean().default(true)
    .describe('Revenue stream splits are immutable once created'),
  
  // Blessing
  blessed: z.boolean().default(false),
  blessed_by: z.string().optional(),
  blessed_at: z.string().datetime().optional(),
  
}).refine(data => {
  // Constitutional enforcement
  const totalShares = data.participants.reduce((sum, p) => sum + p.share_percent, 0);
  return Math.abs(totalShares - 100) < 0.01;
}, {
  message: 'Participant shares must sum to 100%',
}).refine(data => {
  return data.total_creator_share >= 70;
}, {
  message: 'Constitutional violation: total creator share must be >= 70%',
}).refine(data => {
  return data.platform_share <= 25;
}, {
  message: 'Constitutional violation: platform share must be <= 25%',
}).refine(data => {
  // All voice contributors must have consent
  const voiceParticipants = data.participants.filter(p => p.voice_contributed);
  return voiceParticipants.every(p => p.consent_granted);
}, {
  message: 'All voice contributors must have explicit consent',
});

// ─── TYPES ───────────────────────────────────────────────

export type RevenueStreamType = z.infer<typeof RevenueStreamTypeSchema>;
export type ParticipantRole = z.infer<typeof ParticipantRoleSchema>;
export type StreamParticipant = z.infer<typeof StreamParticipantSchema>;
export type RevenueStream = z.infer<typeof RevenueStreamSchema>;
