/**
 * NOIZY.AI GOVERNANCE — Playback Tracking & Real-Time Monetization
 * 
 * Every second of playback is monetized. Every creator gets paid
 * for every second their voice, music, or character is heard.
 * 
 * Rate per second × duration ÷ voice count × collaboration adjustment.
 * 
 * The math is public. The splits are constitutional.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';
import { v4 as uuidv4 } from 'uuid';

// ─── PLAYBACK SESSION ────────────────────────────────────

export const PlaybackSessionSchema = z.object({
  session_id: z.string().uuid(),
  project_id: z.string().min(1),
  stream_id: z.string().uuid()
    .describe('Links to the revenue stream that governs splits'),
  
  // Who's in this playback
  creator_voices: z.array(z.string().regex(/^[A-Z]{2,6}_\d{3}$/)).min(1)
    .describe('Array of actor IDs whose voices are in this playback'),
  
  // Timing
  start_time: z.string().datetime(),
  end_time: z.string().datetime().optional(),
  duration_seconds: z.number().int().nonnegative().default(0),
  
  // Voice count
  voice_count: z.number().int().positive()
    .describe('How many creators contributed to this content'),
  
  // Monetization math
  rate_per_second: z.number().nonnegative()
    .describe('Base rate per second — set by creator consent profile'),
  collaboration_adjustment: z.number().min(0).max(1).default(1)
    .describe('Multiplier: divides rate by voice count to get per-creator rate. 1.0 = no adjustment, lower = shared economy'),
  
  // Computed earnings (filled after session ends)
  total_earned: z.number().nonnegative().default(0),
  per_creator_earned: z.record(z.string(), z.number().nonnegative()).default({})
    .describe('Map of actor_id → amount earned in this session'),
  
  // Status
  status: z.enum(['active', 'completed', 'disputed', 'voided']).default('active'),
  
  // Audit
  created_at: z.string().datetime(),
  completed_at: z.string().datetime().optional(),
  gabriel_ingested: z.literal(false).default(false),
});

// ─── MONETIZATION ENGINE ─────────────────────────────────

export interface MonetizationResult {
  session_id: string;
  total_earned: number;
  per_creator: Record<string, number>;
  rate_per_second: number;
  duration_seconds: number;
  voice_count: number;
  collaboration_adjustment: number;
  breakdown: CreatorEarning[];
}

export interface CreatorEarning {
  actor_id: string;
  role: string;
  share_percent: number;
  earned: number;
  is_teacher_royalty: boolean;
  teacher_royalty_from?: string;
}

/**
 * Calculate earnings for a completed playback session.
 * 
 * FORMULA:
 *   total = rate_per_second × duration_seconds
 *   per_creator_base = total × collaboration_adjustment / voice_count
 *   per_creator_actual = total × (creator_share_percent / 100)
 * 
 * Teacher royalty is calculated AFTER the student's share is determined:
 *   student_gross = total × student_share_percent / 100
 *   teacher_royalty = student_gross × teacher_royalty_percent / 100
 *   student_net = student_gross - teacher_royalty
 * 
 * Rounding correction is ALWAYS biased toward the creator.
 */
export function calculatePlaybackEarnings(params: {
  duration_seconds: number;
  rate_per_second: number;
  voice_count: number;
  collaboration_adjustment: number;
  participants: Array<{
    actor_id: string;
    role: string;
    share_percent: number;
    is_teacher?: boolean;
    is_student?: boolean;
    teacher_royalty_percent?: number;
    teacher_id?: string;
  }>;
}): MonetizationResult {
  const { duration_seconds, rate_per_second, voice_count, collaboration_adjustment, participants } = params;

  // Total pool
  const total = rate_per_second * duration_seconds;

  // Calculate each creator's share
  const breakdown: CreatorEarning[] = [];
  const perCreator: Record<string, number> = {};
  let allocated = 0;

  // First pass: calculate base shares
  for (const p of participants) {
    const baseEarned = total * (p.share_percent / 100);
    breakdown.push({
      actor_id: p.actor_id,
      role: p.role,
      share_percent: p.share_percent,
      earned: baseEarned,
      is_teacher_royalty: false,
    });
    perCreator[p.actor_id] = (perCreator[p.actor_id] || 0) + baseEarned;
    allocated += baseEarned;
  }

  // Second pass: calculate teacher royalties from student earnings
  for (const p of participants) {
    if (p.is_student && p.teacher_id && p.teacher_royalty_percent) {
      const studentGross = total * (p.share_percent / 100);
      const teacherRoyalty = studentGross * (p.teacher_royalty_percent / 100);
      
      // Teacher gets the royalty
      breakdown.push({
        actor_id: p.teacher_id,
        role: 'teacher',
        share_percent: 0,  // Already accounted for in base shares
        earned: teacherRoyalty,
        is_teacher_royalty: true,
        teacher_royalty_from: p.actor_id,
      });
      perCreator[p.teacher_id] = (perCreator[p.teacher_id] || 0) + teacherRoyalty;

      // Student's share is reduced
      perCreator[p.actor_id] = (perCreator[p.actor_id] || 0) - teacherRoyalty;
      
      // Update the student's breakdown entry
      const studentEntry = breakdown.find(
        b => b.actor_id === p.actor_id && !b.is_teacher_royalty
      );
      if (studentEntry) {
        studentEntry.earned -= teacherRoyalty;
      }
    }
  }

  // Rounding correction — biased toward creators (not platform)
  const totalAllocated = Object.values(perCreator).reduce((s, v) => s + v, 0);
  const rounding = total - totalAllocated;
  if (Math.abs(rounding) > 0.001) {
    // Find the first non-platform creator and give them the rounding
    const firstCreator = participants.find(
      p => p.role !== 'platform' && p.role !== 'community' && p.role !== 'legal'
    );
    if (firstCreator) {
      perCreator[firstCreator.actor_id] = (perCreator[firstCreator.actor_id] || 0) + rounding;
    }
  }

  return {
    session_id: uuidv4(),
    total_earned: total,
    per_creator: perCreator,
    rate_per_second,
    duration_seconds,
    voice_count,
    collaboration_adjustment,
    breakdown,
  };
}

// ─── SCENARIO BUILDERS ───────────────────────────────────

/**
 * Teaching scenario: RSP_001 teaches, student creates using RSP's voice.
 * Teacher gets 15% royalty from student's share.
 */
export function buildTeachingScenario(params: {
  teacher_id: string;
  student_id: string;
  duration_seconds: number;
  rate_per_second: number;
  teacher_royalty_percent?: number;
}): MonetizationResult {
  const royalty = params.teacher_royalty_percent ?? 15;

  return calculatePlaybackEarnings({
    duration_seconds: params.duration_seconds,
    rate_per_second: params.rate_per_second,
    voice_count: 1,  // Student's project, one voice
    collaboration_adjustment: 1.0,
    participants: [
      {
        actor_id: params.student_id,
        role: 'student',
        share_percent: 70,  // Constitutional minimum for creator
        is_student: true,
        teacher_id: params.teacher_id,
        teacher_royalty_percent: royalty,
      },
      {
        actor_id: params.teacher_id,
        role: 'voice_owner',
        share_percent: 5,  // Voice contribution share (on top of teacher royalty)
        is_teacher: true,
      },
      { actor_id: 'PLATFORM', role: 'platform', share_percent: 20 },
      { actor_id: 'COMMUNITY', role: 'community', share_percent: 3 },
      { actor_id: 'LEGAL', role: 'legal', share_percent: 2 },
    ],
  });
}

/**
 * Collaboration remix: RSP_001 voice + another creator's music.
 */
export function buildCollaborationScenario(params: {
  voice_actor_id: string;
  music_creator_id: string;
  duration_seconds: number;
  rate_per_second: number;
  split_method?: 'equal' | 'voice_weighted';
}): MonetizationResult {
  const method = params.split_method ?? 'equal';
  const voiceShare = method === 'voice_weighted' ? 45 : 37.5;
  const musicShare = method === 'voice_weighted' ? 30 : 37.5;

  return calculatePlaybackEarnings({
    duration_seconds: params.duration_seconds,
    rate_per_second: params.rate_per_second,
    voice_count: 2,
    collaboration_adjustment: 0.5,  // Split economy
    participants: [
      {
        actor_id: params.voice_actor_id,
        role: 'voice_owner',
        share_percent: voiceShare,
      },
      {
        actor_id: params.music_creator_id,
        role: 'music_creator',
        share_percent: musicShare,
      },
      { actor_id: 'PLATFORM', role: 'platform', share_percent: 20 },
      { actor_id: 'COMMUNITY', role: 'community', share_percent: 3 },
      { actor_id: 'LEGAL', role: 'legal', share_percent: 2 },
    ],
  });
}

/**
 * Cross-actor: RSP_001 voice + another actor's character.
 */
export function buildCrossActorScenario(params: {
  voice_actor_id: string;
  character_actor_id: string;
  duration_seconds: number;
  rate_per_second: number;
}): MonetizationResult {
  return calculatePlaybackEarnings({
    duration_seconds: params.duration_seconds,
    rate_per_second: params.rate_per_second,
    voice_count: 2,
    collaboration_adjustment: 0.5,
    participants: [
      {
        actor_id: params.voice_actor_id,
        role: 'voice_owner',
        share_percent: 40,
      },
      {
        actor_id: params.character_actor_id,
        role: 'actor_performer',
        share_percent: 35,
      },
      { actor_id: 'PLATFORM', role: 'platform', share_percent: 20 },
      { actor_id: 'COMMUNITY', role: 'community', share_percent: 3 },
      { actor_id: 'LEGAL', role: 'legal', share_percent: 2 },
    ],
  });
}

// ─── TYPES ───────────────────────────────────────────────

export type PlaybackSession = z.infer<typeof PlaybackSessionSchema>;
