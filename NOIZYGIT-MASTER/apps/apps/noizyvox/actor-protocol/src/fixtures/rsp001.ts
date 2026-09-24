/**
 * RSP001 ACTOR PROTOCOL — Founding Actor Fixture
 * 
 * Robert Stephen Plowman — Actor ID: RSP_001
 * The first actor in the NOIZYVOX system.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import type { ActorImprint } from '../schemas/actorImprint';
import type { CharacterProfile } from '../schemas/characterProfile';

// ─── RSP001: ACTOR IMPRINT ──────────────────────────────

export const RSP001_IMPRINT: ActorImprint = {
  actor_id: 'RSP_001',
  display_name: 'RSP',
  legal_name: 'Robert Stephen Plowman',

  core_traits: [
    'playful',
    'sharp',
    'warm',
    'directable',
    'imaginative',
    'confident',
    'deeply ethical',
    'systems thinker',
  ],

  signature_habits: [
    'quick pivots between energy levels',
    'character humor — breaks tension with wit',
    'confident phrasing — never hedges',
    'finds the human angle in any material',
    'improvises freely when the moment calls for it',
  ],

  signature_phrases: [
    'my lovelies',
    'let me try this',
    'here\'s the thing',
    'that\'s the shape of it',
    'lock it in',
  ],

  break_word: 'break character',

  energy_bands: [
    { label: 'whisper', floor: 0.0, ceiling: 0.2 },
    { label: 'conversational', floor: 0.2, ceiling: 0.5 },
    { label: 'performance', floor: 0.5, ceiling: 0.75 },
    { label: 'full power', floor: 0.75, ceiling: 1.0 },
  ],
  default_energy: 0.6,

  humor_profile: {
    style: 'sharp',
    frequency: 0.7,
    in_character_humor: true,
    break_tension_tendency: 0.65,
  },

  improvisation: {
    willingness: 0.85,
    quality_under_pressure: 0.8,
    default_mode: 'guided',
  },

  directability_style: 'responsive',

  voice_consent_key: undefined,  // Set when NOIZYVOX AVA is registered
  voice_ip_owner: true,

  created_at: '2026-04-02T19:00:00.000Z',
  updated_at: '2026-04-02T19:00:00.000Z',
  version: '1.0.0',
};

// ─── STERN BRITISH GANGSTER ─────────────────────────────

export const STERN_BRITISH_GANGSTER: CharacterProfile = {
  character_id: 'stern_british_gangster',
  actor_id: 'RSP_001',
  name: 'stern_british_gangster',
  description: 'A cockney gangster who doesn\'t need to prove anything. Authority through presence, not threat.',

  accent: 'cockney',
  accent_strength: 0.72,

  vocal_posture: {
    placement: 'chest',
    tension: 0.35,
    breath_pattern: 'controlled',
    resonance: 'gravelly',
  },

  cadence: {
    tempo: 'measured',
    pause_tendency: 0.6,
    rhythm: 'steady',
  },

  emotional_baseline: {
    primary: 'confident',
    secondary: 'amused',
    volatility: 0.3,
    mask: 'Projects calm authority. Underneath: sharp intelligence calculating every angle.',
  },

  intensity: 0.72,

  vocabulary_bias: {
    register: 'street',
    favorite_words: ['lovely', 'mate', 'proper', 'sort it', 'innit'],
    avoided_words: ['please', 'sorry', 'perhaps'],
    sentence_length: 'terse',
    profanity_level: 0.4,
  },

  directable_in_character: true,

  hard_constraints: [
    {
      description: 'Never beg or grovel',
      reason: 'This character has absolute self-possession. Begging destroys the core.',
      enforceable: true,
    },
    {
      description: 'Never explain himself at length',
      reason: 'Authority doesn\'t justify itself. Short sentences. Let them figure it out.',
      enforceable: true,
    },
  ],

  allowed_transformations: [
    {
      property: 'intensity',
      range: { min: 0.4, max: 0.9 },
      requires_break_word: false,
    },
    {
      property: 'accent',
      range: { min: 0.3, max: 0.9 },
      requires_break_word: false,
    },
    {
      property: 'pacing',
      range: { min: 0.3, max: 0.8 },
      requires_break_word: false,
    },
    {
      property: 'emotion',
      range: { min: 0.2, max: 0.8 },
      requires_break_word: true,  // Emotional shifts require stepping out
    },
  ],

  active: true,
  created_at: '2026-04-02T19:00:00.000Z',
  version: '1.0.0',
};

// ─── EXAMPLE DIRECTION SESSION ──────────────────────────

export const EXAMPLE_SESSION = {
  description: 'Demonstrates the full break-word → direction → preview → approval loop',
  steps: [
    {
      mode: 'CHARACTER',
      speaker: 'RSP_001 (as stern_british_gangster)',
      line: 'Listen, mate. I\'ve been running this manor since before you learned to tie your shoes.',
      note: 'Opening performance in character',
    },
    {
      mode: 'CLIENT',
      speaker: 'Client',
      line: 'Break character.',
      note: 'Client triggers break-word',
    },
    {
      mode: 'ACTOR',
      speaker: 'RSP_001',
      line: 'Okay, what do you need?',
      note: 'Actor drops character instantly, responds as themselves',
    },
    {
      mode: 'DIRECTION_INTAKE',
      speaker: 'Client',
      line: 'Less aggressive. More confident. He doesn\'t need to prove it.',
      note: 'Client gives direction',
    },
    {
      mode: 'DIRECTION_INTAKE',
      speaker: 'RSP_001',
      line: 'Got it. Less threat, more authority. Let me try this.',
      note: 'Actor acknowledges in plain language, proposes adjustment',
    },
    {
      mode: 'RENDER_PREVIEW',
      speaker: 'RSP_001 (re-entering character)',
      line: 'Hello, my lovelies. I\'ve been doing this since I was knee-high to a fire hydrant.',
      note: 'Preview take with direction applied',
    },
    {
      mode: 'LOCKED_TAKE',
      speaker: 'Client',
      line: 'That\'s it. Lock it.',
      note: 'Client approves → take is blessed',
    },
  ],
};
