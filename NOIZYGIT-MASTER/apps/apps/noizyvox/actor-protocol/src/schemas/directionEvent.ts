/**
 * RSP001 ACTOR PROTOCOL — Direction Event Schema
 * 
 * Every direction is an event. Every event is logged.
 * Every transition is auditable. No black boxes.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── PERFORMANCE MODES ───────────────────────────────────

export const PerformanceModeSchema = z.enum([
  'CHARACTER',         // In character, performing
  'ACTOR',             // Break-word triggered, out of character
  'DIRECTION_INTAKE',  // Actor is receiving and processing notes
  'RENDER_PREVIEW',    // Actor is generating a revised take
  'LOCKED_TAKE',       // Client approved, take is blessed
]);

// ─── DIRECTION SOURCE ────────────────────────────────────

export const DirectionSourceSchema = z.enum([
  'client',       // External client giving notes
  'director',     // Internal director (could be AI-assisted)
  'self',         // Actor self-directing (improv adjustment)
  'system',       // System-triggered (e.g., safety guardrail)
]);

// ─── DIRECTION CATEGORY ──────────────────────────────────

export const DirectionCategorySchema = z.enum([
  'tone',         // "less aggressive, more confident"
  'pacing',       // "slow it down, let the words breathe"
  'intensity',    // "dial it up to 8"
  'emotion',      // "find the sadness underneath the anger"
  'accent',       // "thicker cockney"
  'character',    // "he'd never say that — adjust"
  'technical',    // "hit the mark on the third word"
  'general',      // freeform note
]);

// ─── DIRECTION EVENT (ROOT) ──────────────────────────────

export const DirectionEventSchema = z.object({
  // Identity
  event_id: z.string().uuid(),
  session_id: z.string().uuid(),
  actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/),
  character_id: z.string().optional()
    .describe('Null if direction received while in ACTOR mode'),
  
  // Timing
  timestamp: z.string().datetime(),
  duration_ms: z.number().int().nonnegative().optional()
    .describe('How long the direction intake lasted'),
  
  // Source
  source: DirectionSourceSchema,
  
  // State transition
  prior_state: PerformanceModeSchema,
  new_state: PerformanceModeSchema,
  triggered_by_break_word: z.boolean().default(false),
  
  // Direction content
  raw_direction: z.string().min(1)
    .describe('Exact words spoken by the director/client'),
  interpreted_direction: z.string().min(1)
    .describe('System interpretation: what the actor understood'),
  category: DirectionCategorySchema,
  
  // Confidence
  interpretation_confidence: z.number().min(0).max(1)
    .describe('How confident the system is in its interpretation'),
  
  // Actor response
  actor_acknowledgment: z.string().optional()
    .describe('What the actor said in response to the direction'),
  
  // Audit
  logged: z.literal(true).default(true),
  gabriel_ingested: z.literal(false).default(false)
    .describe('Nothing goes to Gabriel by default — explicit opt-in only'),
});

// ─── TYPES ───────────────────────────────────────────────

export type PerformanceMode = z.infer<typeof PerformanceModeSchema>;
export type DirectionSource = z.infer<typeof DirectionSourceSchema>;
export type DirectionCategory = z.infer<typeof DirectionCategorySchema>;
export type DirectionEvent = z.infer<typeof DirectionEventSchema>;
