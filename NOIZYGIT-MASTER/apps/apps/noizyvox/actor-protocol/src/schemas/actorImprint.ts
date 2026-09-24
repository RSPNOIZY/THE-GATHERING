/**
 * RSP001 ACTOR PROTOCOL — Actor Imprint Schema
 * 
 * The actor is sovereign. The character is a layer.
 * Direction never overwrites identity.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── ENERGY BANDS ────────────────────────────────────────
// Actors operate across energy ranges. Direction shifts the band,
// never the identity.

export const EnergyBandSchema = z.object({
  label: z.string().min(1),
  floor: z.number().min(0).max(1),
  ceiling: z.number().min(0).max(1),
}).refine(data => data.ceiling > data.floor, {
  message: 'Ceiling must exceed floor — energy bands cannot collapse',
});

// ─── DIRECTABILITY STYLE ─────────────────────────────────
// How does this actor prefer to receive direction?

export const DirectabilityStyleSchema = z.enum([
  'responsive',     // takes direction immediately, adjusts fast
  'deliberate',     // needs a beat to process, then delivers
  'collaborative',  // pushes back constructively, offers alternatives
  'instinctive',    // prefers to find it themselves with minimal notes
]);

// ─── HUMOR PROFILE ───────────────────────────────────────

export const HumorProfileSchema = z.object({
  style: z.enum(['dry', 'warm', 'absurdist', 'physical', 'deadpan', 'sharp', 'none']),
  frequency: z.number().min(0).max(1).describe('How often humor surfaces naturally'),
  in_character_humor: z.boolean().describe('Can the actor inject humor while in character?'),
  break_tension_tendency: z.number().min(0).max(1).describe('Likelihood of using humor to defuse intensity'),
});

// ─── IMPROVISATION TENDENCY ──────────────────────────────

export const ImprovisationTendencySchema = z.object({
  willingness: z.number().min(0).max(1).describe('0 = strictly scripted, 1 = fully improvisational'),
  quality_under_pressure: z.number().min(0).max(1).describe('How well improv holds up when directed live'),
  default_mode: z.enum(['scripted', 'guided', 'freeform']),
});

// ─── ACTOR IMPRINT (ROOT) ────────────────────────────────
// This is the immutable core. Characters are applied on top.
// The imprint survives every character switch, every session,
// every direction. It is the human underneath.

export const ActorImprintSchema = z.object({
  // Identity
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/, 'Actor ID format: PREFIX_NNN'),
  display_name: z.string().min(1),
  legal_name: z.string().min(1),
  
  // Core personality traits — these never change with direction
  core_traits: z.array(z.string().min(1)).min(1).max(12)
    .describe('Immutable personality characteristics'),
  
  // Signature habits — recurring patterns in performance
  signature_habits: z.array(z.string().min(1)).max(10)
    .describe('Observable patterns: quick pivots, character humor, etc.'),
  
  // Signature phrases — language the actor naturally gravitates toward
  signature_phrases: z.array(z.string().min(1)).max(20).optional(),
  
  // Break word — the phrase that drops character and returns to actor
  break_word: z.string().min(1).default('break character'),
  
  // Energy
  energy_bands: z.array(EnergyBandSchema).min(1).max(5),
  default_energy: z.number().min(0).max(1),
  
  // Humor
  humor_profile: HumorProfileSchema,
  
  // Improvisation
  improvisation: ImprovisationTendencySchema,
  
  // Directability
  directability_style: DirectabilityStyleSchema,
  
  // Voice sovereignty (NOIZYVOX integration)
  voice_consent_key: z.string().optional()
    .describe('Cryptographic consent key — links to NOIZYVOX AVA'),
  voice_ip_owner: z.literal(true).default(true)
    .describe('The actor always owns their voice. Non-negotiable.'),
  
  // Metadata
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
  version: z.string().default('1.0.0'),
});

// ─── TYPES ───────────────────────────────────────────────

export type EnergyBand = z.infer<typeof EnergyBandSchema>;
export type DirectabilityStyle = z.infer<typeof DirectabilityStyleSchema>;
export type HumorProfile = z.infer<typeof HumorProfileSchema>;
export type ImprovisationTendency = z.infer<typeof ImprovisationTendencySchema>;
export type ActorImprint = z.infer<typeof ActorImprintSchema>;
