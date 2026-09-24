/**
 * NOIZYVOX — RSP_001 Founding Catalogue: 35 Takes Session Plan
 * 
 * The founding catalogue. 35 takes across 5 sessions that establish:
 * - RSP_001's voice in the NOIZY system
 * - The first teachable assets for NOIZYKIDZ
 * - Proof of the capture → bless → catalogue pipeline
 * - Revenue readiness for the teaching pipeline
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import type { SessionPlan } from '../schemas/capture-session';
import { v4 as uuidv4 } from 'uuid';

// ─── THE 35 SCRIPT LINES ────────────────────────────────
// Organized by energy band and teaching value.

export const RSP001_SCRIPT_LINES = {
  // Session 1: Whisper & Intimate (7 takes)
  whisper: [
    { line: 1, text: 'Every sound has a story. Listen close.', direction: 'Intimate, like sharing a secret with a student' },
    { line: 2, text: 'The silence between notes — that\'s where the music breathes.', direction: 'Reflective, let the pauses speak' },
    { line: 3, text: 'You don\'t find your voice. You remember it.', direction: 'Warm wisdom, like a teacher who believes in you' },
    { line: 4, text: 'Before you can make noise, you have to understand quiet.', direction: 'Gentle paradox, let it land slowly' },
    { line: 5, text: 'This is your sound. Nobody else\'s. Guard it.', direction: 'Protective, sovereign, paternal warmth' },
    { line: 6, text: 'Close your eyes. What do you hear? That\'s your starting point.', direction: 'Guided meditation energy, soothing' },
    { line: 7, text: 'The DreamChamber is open. Step inside.', direction: 'Invitational, mystical but grounded' },
  ],
  
  // Session 2: Conversational & Teaching (7 takes)
  conversational: [
    { line: 8, text: 'Right. So here\'s how this works. Your voice is yours. Full stop. Nobody borrows it without your say.', direction: 'Direct teaching, explaining consent to a student' },
    { line: 9, text: 'Think of it like this — every creator gets seventy percent minimum. That\'s not negotiable. That\'s constitutional.', direction: 'Confident explanation, founding father energy' },
    { line: 10, text: 'The fish doesn\'t ask permission to swim. Your creativity doesn\'t need anyone\'s approval either.', direction: 'NOIZYFISH philosophy, casual but meaningful' },
    { line: 11, text: 'When I was your age, nobody told me my voice was worth protecting. I\'m telling you now.', direction: 'Mentorship moment, real personal stake' },
    { line: 12, text: 'You\'re not just learning to make music. You\'re learning to own what you make.', direction: 'NOIZYKIDZ teaching module opener' },
    { line: 13, text: 'Let me show you something. Listen to this pattern. Now make it yours.', direction: 'Interactive teaching, energetic' },
    { line: 14, text: 'Good. That\'s really good. Now do it again, but this time — mean it.', direction: 'Coach energy, push with encouragement' },
  ],
  
  // Session 3: Performance & Character (7 takes)
  performance: [
    { line: 15, text: 'Ladies and gentlemen — welcome to the show that never ends. This is NOIZY.', direction: 'Full announcer energy, commanding stage presence' },
    { line: 16, text: 'You want to know what makes a sound dangerous? It\'s not the volume. It\'s the truth in it.', direction: 'Stern British gangster character, menacing warmth' },
    { line: 17, text: 'Every artist who walks through that door leaves with more than they came in with. That\'s a promise.', direction: 'Performance proclamation, TED talk energy' },
    { line: 18, text: 'The old music industry said shut up and sing. We say sing, and own every note.', direction: 'Revolutionary energy, controlled intensity' },
    { line: 19, text: 'Three, two, one — and we\'re live. This is NOIZYVOX. Your voice. Your rules.', direction: 'Radio host energy, professional but warm' },
    { line: 20, text: 'In Ottawa, in London, in Lagos, in Tokyo — the sound is the same. It\'s freedom.', direction: 'Global vision, sweeping but personal' },
    { line: 21, text: 'Break character. Step out. Remember — you are not the role. The role serves you.', direction: 'Actor protocol teaching moment, meta-aware' },
  ],
  
  // Session 4: Full Power & Declaration (7 takes)
  full_power: [
    { line: 22, text: 'THIS IS NOIZY! And we don\'t apologize for the volume!', direction: 'Full power opener, stadium energy' },
    { line: 23, text: 'Seventy percent to the creator! Twenty-five max to the platform! That is the law!', direction: 'Constitutional declaration, absolute conviction' },
    { line: 24, text: 'Your voice is sovereign territory. Consent is not optional. It is the foundation!', direction: 'Rights declaration, MLK meets tech founder energy' },
    { line: 25, text: 'We built this for the kids who were told their noise was worthless. It isn\'t. It never was.', direction: 'Emotional full power, nearly breaking voice' },
    { line: 26, text: 'One hundred years from now, the royalties still flow. That\'s not a feature. That\'s a promise to the future.', direction: 'Legacy declaration, temporal sweep' },
    { line: 27, text: 'The blessing gate is the line between chaos and canon. Nothing passes without human eyes.', direction: 'Governance declaration, iron conviction' },
    { line: 28, text: 'Robert Stephen Plowman. RSP zero zero one. The founding voice. And this — is just the beginning.', direction: 'Personal declaration, identity locked' },
  ],
  
  // Session 5: Mixed Energy & Signature Lines (7 takes)
  mixed: [
    { line: 29, text: 'Lucy thinks. n8n acts. Humans decide. That\'s the architecture of trust.', direction: 'Conversational → building to performance' },
    { line: 30, text: 'Gabriel only sees blessed truth. Everything else is noise. And we respect the noise — but we canonize the signal.', direction: 'Teaching → declaration crossover' },
    { line: 31, text: 'Capture writes files. Humans bless memory. That\'s the doctrine.', direction: 'Whisper → conversational, sacred but practical' },
    { line: 32, text: 'If you\'re listening to this in fifty years — hello. Your royalties are still coming. You\'re welcome.', direction: 'Playful → warm → meaningful, time capsule energy' },
    { line: 33, text: 'The Wisdom Project doesn\'t just preserve stories. It preserves the voice that told them.', direction: 'Reverent, elder respect, quiet power' },
    { line: 34, text: 'Family isn\'t just who you\'re born to. It\'s who you build with. Welcome to myFAMILY.', direction: 'Warm invitation, inclusive, final brand intro' },
    { line: 35, text: 'That\'s a wrap. Thirty-five takes. The founding catalogue. From Ottawa to the world. NOIZY forever.', direction: 'Closing take, triumphant but grounded, session closer' },
  ],
} as const;

// ─── SESSION PLAN ────────────────────────────────────────

export const RSP001_SESSION_PLAN: SessionPlan = {
  plan_id: uuidv4(),
  plan_name: 'RSP_001 Founding Catalogue — 35 Takes',
  actor_id: 'RSP_001',
  character_id: 'rsp_natural',  // RSP performing as himself
  total_planned_sessions: 5,
  total_planned_takes: 35,
  sessions: [
    {
      session_number: 1,
      session_name: 'Whisper & Intimate',
      planned_takes: 7,
      energy_focus: 'whisper',
      description: 'Quiet foundation. Teaching intimacy. The voice at its softest — where trust lives.',
    },
    {
      session_number: 2,
      session_name: 'Conversational & Teaching',
      planned_takes: 7,
      energy_focus: 'conversational',
      description: 'The teaching voice. How RSP_001 sounds when explaining NOIZY to a student.',
    },
    {
      session_number: 3,
      session_name: 'Performance & Character',
      planned_takes: 7,
      energy_focus: 'performance',
      description: 'Stage voice. Characters. The range that makes voice acting possible.',
    },
    {
      session_number: 4,
      session_name: 'Full Power & Declaration',
      planned_takes: 7,
      energy_focus: 'full_power',
      description: 'Constitutional declarations. Maximum intensity. The founding voice at full volume.',
    },
    {
      session_number: 5,
      session_name: 'Mixed Energy & Signature Lines',
      planned_takes: 7,
      energy_focus: 'mixed',
      description: 'Energy transitions. Brand signatures. The closing takes that seal the catalogue.',
    },
  ],
  catalogue_target: 20,  // 20 approved takes opens the catalogue
  teaching_ready_at: 14, // 14 approved takes enables teaching pipeline
  created_at: new Date().toISOString(),
  status: 'draft',
};

/**
 * Get all 35 script lines as a flat array for session creation.
 */
export function getAllScriptLines(): Array<{
  line_number: number;
  text: string;
  direction: string;
  energy_band: 'whisper' | 'conversational' | 'performance' | 'full_power';
}> {
  const lines: Array<{
    line_number: number;
    text: string;
    direction: string;
    energy_band: 'whisper' | 'conversational' | 'performance' | 'full_power';
  }> = [];
  
  const bands: Array<{ key: keyof typeof RSP001_SCRIPT_LINES; band: 'whisper' | 'conversational' | 'performance' | 'full_power' }> = [
    { key: 'whisper', band: 'whisper' },
    { key: 'conversational', band: 'conversational' },
    { key: 'performance', band: 'performance' },
    { key: 'full_power', band: 'full_power' },
    { key: 'mixed', band: 'conversational' }, // mixed defaults to conversational
  ];
  
  for (const { key, band } of bands) {
    for (const item of RSP001_SCRIPT_LINES[key]) {
      lines.push({
        line_number: item.line,
        text: item.text,
        direction: item.direction,
        energy_band: band,
      });
    }
  }
  
  return lines;
}
