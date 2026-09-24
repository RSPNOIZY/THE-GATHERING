/**
 * RSP001 ACTOR PROTOCOL — Character Profile Schema
 * 
 * A character is a layer applied on top of the actor imprint.
 * The actor can shed it at any time with the break-word.
 * The character never overwrites the actor.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── VOCAL POSTURE ───────────────────────────────────────
// How the character holds their voice physically

export const VocalPostureSchema = z.object({
  placement: z.enum(['chest', 'throat', 'nasal', 'head', 'mixed']),
  tension: z.number().min(0).max(1).describe('0 = relaxed, 1 = tight/strained'),
  breath_pattern: z.enum(['steady', 'shallow', 'deep', 'irregular', 'controlled']),
  resonance: z.enum(['warm', 'thin', 'booming', 'raspy', 'smooth', 'gravelly']),
});

// ─── EMOTIONAL BASELINE ──────────────────────────────────
// The character's resting emotional state (before direction)

export const EmotionalBaselineSchema = z.object({
  primary: z.string().min(1).describe('Dominant emotion at rest: confident, anxious, amused, etc.'),
  secondary: z.string().optional().describe('Undertone emotion'),
  volatility: z.number().min(0).max(1).describe('How quickly the character shifts emotion'),
  mask: z.string().optional().describe('What they project vs. what they feel'),
});

// ─── VOCABULARY BIAS ─────────────────────────────────────
// Words and structures the character gravitates toward

export const VocabularyBiasSchema = z.object({
  register: z.enum(['street', 'formal', 'academic', 'casual', 'poetic', 'technical', 'mixed']),
  favorite_words: z.array(z.string()).max(20).optional(),
  avoided_words: z.array(z.string()).max(20).optional(),
  sentence_length: z.enum(['terse', 'medium', 'verbose', 'varied']),
  profanity_level: z.number().min(0).max(1).describe('0 = clean, 1 = heavy'),
});

// ─── CADENCE ─────────────────────────────────────────────

export const CadenceSchema = z.object({
  tempo: z.enum(['slow', 'measured', 'moderate', 'quick', 'rapid', 'varied']),
  pause_tendency: z.number().min(0).max(1).describe('How often they pause for effect'),
  rhythm: z.enum(['steady', 'staccato', 'flowing', 'syncopated', 'unpredictable']),
});

// ─── HARD CONSTRAINTS ────────────────────────────────────
// Things this character will NEVER do (even under direction)

export const HardConstraintSchema = z.object({
  description: z.string().min(1),
  reason: z.string().min(1).describe('Why this boundary exists'),
  enforceable: z.literal(true).default(true),
});

// ─── ALLOWED TRANSFORMATIONS ─────────────────────────────
// What direction can change about this character

export const AllowedTransformationSchema = z.object({
  property: z.string().min(1).describe('What can be adjusted: intensity, accent_strength, etc.'),
  range: z.object({
    min: z.number(),
    max: z.number(),
  }),
  requires_break_word: z.boolean().default(false)
    .describe('Does adjusting this require dropping to actor mode?'),
});

// ─── CHARACTER PROFILE (ROOT) ────────────────────────────

export const CharacterProfileSchema = z.object({
  // Identity
  character_id: z.string().min(1),
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  name: z.string().min(1),
  description: z.string().optional(),
  
  // Voice
  accent: z.string().min(1).describe('cockney, received_pronunciation, southern_us, etc.'),
  accent_strength: z.number().min(0).max(1).describe('0 = trace, 1 = thick'),
  vocal_posture: VocalPostureSchema,
  cadence: CadenceSchema,
  
  // Emotion
  emotional_baseline: EmotionalBaselineSchema,
  intensity: z.number().min(0).max(1).describe('Overall performance intensity'),
  
  // Language
  vocabulary_bias: VocabularyBiasSchema,
  
  // Direction rules
  directable_in_character: z.boolean().default(true)
    .describe('Can the client give notes without triggering break-word?'),
  hard_constraints: z.array(HardConstraintSchema).default([]),
  allowed_transformations: z.array(AllowedTransformationSchema).default([]),
  
  // Session
  active: z.boolean().default(false),
  created_at: z.string().datetime(),
  version: z.string().default('1.0.0'),
});

// ─── TYPES ───────────────────────────────────────────────

export type VocalPosture = z.infer<typeof VocalPostureSchema>;
export type EmotionalBaseline = z.infer<typeof EmotionalBaselineSchema>;
export type VocabularyBias = z.infer<typeof VocabularyBiasSchema>;
export type Cadence = z.infer<typeof CadenceSchema>;
export type HardConstraint = z.infer<typeof HardConstraintSchema>;
export type AllowedTransformation = z.infer<typeof AllowedTransformationSchema>;
export type CharacterProfile = z.infer<typeof CharacterProfileSchema>;
