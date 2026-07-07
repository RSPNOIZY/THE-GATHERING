/**
 * NOIZY.AI — 100-Year Immutable Royalty Ledger
 * 
 * Every royalty payment, from now until 2126, is recorded here.
 * Append-only. Immutable. SHA-256 chained.
 * 
 * The question this system answers: "Where did every cent go,
 * and can we prove it a century from now?"
 * 
 * Chain structure:
 *   Each entry's hash = SHA-256(previous_hash + entry_data)
 *   This creates a tamper-evident chain that spans generations.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

// ─── ROYALTY EVENT TYPES ─────────────────────────────────

export const RoyaltyEventTypeSchema = z.enum([
  'playback_earning',       // Per-second playback revenue
  'teaching_royalty',       // Teacher royalty from student share
  'collaboration_split',    // Collaboration revenue split
  'voice_licensing_fee',    // Voice licensing payment
  'character_licensing_fee',// Character licensing payment
  'community_pool_dist',    // Community pool distribution
  'descendant_inheritance', // Royalty passed to descendant (estate)
  'estate_transfer',        // Full estate transfer on death/incapacity
  'correction',             // Error correction (linked to original)
  'platform_fee',           // Platform's share (capped at 25%)
  'legal_reserve',          // Legal reserve allocation
]);

// ─── LEDGER ENTRY ────────────────────────────────────────

export const RoyaltyLedgerEntrySchema = z.object({
  // Identity
  entry_id: z.string().uuid(),
  sequence_number: z.number().int().positive()
    .describe('Monotonically increasing. Gaps are errors.'),
  
  // Chain integrity
  previous_hash: z.string().length(64)
    .describe('SHA-256 of the previous entry. Genesis = 64 zeros.'),
  entry_hash: z.string().length(64)
    .describe('SHA-256 of this entry (without entry_hash field)'),
  
  // What happened
  event_type: RoyaltyEventTypeSchema,
  
  // Who
  from_actor_id: z.string().optional()
    .describe('Source of funds (null for platform revenue)'),
  to_actor_id: z.string().regex(/^[A-Z]{2,6}_\d{3}$/)
    .describe('Recipient of this royalty'),
  
  // Money
  amount: z.number().nonnegative()
    .describe('Amount in base currency (USD)'),
  currency: z.string().default('USD'),
  
  // Source
  source_stream_id: z.string().optional()
    .describe('The revenue stream that generated this'),
  source_session_id: z.string().optional()
    .describe('The playback session if applicable'),
  
  // Constitutional enforcement
  creator_share_at_time: z.number().min(0.70)
    .describe('Creator share % when this entry was created'),
  platform_share_at_time: z.number().max(0.25)
    .describe('Platform share % when this entry was created'),
  
  // Teaching chain
  is_teaching_royalty: z.boolean().default(false),
  teacher_id: z.string().optional(),
  student_id: z.string().optional(),
  
  // Estate & inheritance
  generation: z.number().int().min(0).default(0)
    .describe('0 = original creator, 1 = first heir, etc.'),
  estate_id: z.string().optional()
    .describe('Estate identifier for inheritance tracking'),
  beneficiary_relationship: z.string().optional()
    .describe('Relationship to original creator'),
  
  // Correction link
  corrects_entry_id: z.string().uuid().optional()
    .describe('If this is a correction, link to original'),
  correction_reason: z.string().optional(),
  
  // Temporal
  earned_at: z.string().datetime()
    .describe('When the royalty was earned'),
  recorded_at: z.string().datetime()
    .describe('When this entry was written to the ledger'),
  
  // Governance
  blessed: z.boolean().default(false),
  blessed_by: z.string().optional(),
  gabriel_ingested: z.literal(false).default(false),
});

// ─── GENESIS HASH ────────────────────────────────────────

export const GENESIS_HASH = '0'.repeat(64);

// ─── HASH FUNCTION ───────────────────────────────────────

/**
 * Compute the SHA-256 hash of a ledger entry.
 * Excludes the entry_hash field itself to avoid circular dependency.
 */
export function computeEntryHash(entry: Omit<z.infer<typeof RoyaltyLedgerEntrySchema>, 'entry_hash'>): string {
  const data = JSON.stringify(entry, Object.keys(entry).filter(k => k !== 'entry_hash').sort());
  return createHash('sha256').update(data).digest('hex');
}

/**
 * Verify a chain of ledger entries.
 * Returns true if the chain is intact (no tampering).
 */
export function verifyChain(entries: z.infer<typeof RoyaltyLedgerEntrySchema>[]): {
  valid: boolean;
  broken_at?: number;
  reason?: string;
} {
  if (entries.length === 0) return { valid: true };
  
  // First entry must reference genesis
  if (entries[0].previous_hash !== GENESIS_HASH) {
    return { valid: false, broken_at: 0, reason: 'First entry does not reference genesis hash' };
  }
  
  for (let i = 0; i < entries.length; i++) {
    const entry = entries[i];
    
    // Verify sequence
    if (entry.sequence_number !== i + 1) {
      return { valid: false, broken_at: i, reason: `Sequence gap: expected ${i + 1}, got ${entry.sequence_number}` };
    }
    
    // Verify entry hash
    const { entry_hash, ...rest } = entry;
    const computed = computeEntryHash(rest as any);
    if (computed !== entry_hash) {
      return { valid: false, broken_at: i, reason: `Hash mismatch at entry ${i + 1}` };
    }
    
    // Verify chain link (except first)
    if (i > 0 && entry.previous_hash !== entries[i - 1].entry_hash) {
      return { valid: false, broken_at: i, reason: `Chain broken: entry ${i + 1} does not link to entry ${i}` };
    }
  }
  
  return { valid: true };
}

// ─── LEDGER WRITER ───────────────────────────────────────

let currentSequence = 0;
let lastHash = GENESIS_HASH;
const ledger: z.infer<typeof RoyaltyLedgerEntrySchema>[] = [];

/**
 * Append a new entry to the royalty ledger.
 * Returns the entry with hash and sequence computed.
 */
export function appendEntry(params: {
  event_type: z.infer<typeof RoyaltyEventTypeSchema>;
  to_actor_id: string;
  amount: number;
  from_actor_id?: string;
  source_stream_id?: string;
  source_session_id?: string;
  creator_share_at_time: number;
  platform_share_at_time: number;
  is_teaching_royalty?: boolean;
  teacher_id?: string;
  student_id?: string;
  generation?: number;
  estate_id?: string;
  beneficiary_relationship?: string;
  corrects_entry_id?: string;
  correction_reason?: string;
}): z.infer<typeof RoyaltyLedgerEntrySchema> {
  currentSequence++;
  const now = new Date().toISOString();
  
  const entryWithoutHash = {
    entry_id: uuidv4(),
    sequence_number: currentSequence,
    previous_hash: lastHash,
    event_type: params.event_type,
    from_actor_id: params.from_actor_id,
    to_actor_id: params.to_actor_id,
    amount: params.amount,
    currency: 'USD' as const,
    source_stream_id: params.source_stream_id,
    source_session_id: params.source_session_id,
    creator_share_at_time: params.creator_share_at_time,
    platform_share_at_time: params.platform_share_at_time,
    is_teaching_royalty: params.is_teaching_royalty ?? false,
    teacher_id: params.teacher_id,
    student_id: params.student_id,
    generation: params.generation ?? 0,
    estate_id: params.estate_id,
    beneficiary_relationship: params.beneficiary_relationship,
    corrects_entry_id: params.corrects_entry_id,
    correction_reason: params.correction_reason,
    earned_at: now,
    recorded_at: now,
    blessed: false,
    gabriel_ingested: false as const,
  };
  
  const entry_hash = computeEntryHash(entryWithoutHash);
  
  const entry = {
    ...entryWithoutHash,
    entry_hash,
  };
  
  lastHash = entry_hash;
  ledger.push(entry);
  
  return entry;
}

/**
 * Get the current ledger for verification.
 */
export function getLedger(): z.infer<typeof RoyaltyLedgerEntrySchema>[] {
  return [...ledger];
}

/**
 * Get the total paid to an actor across all entries.
 */
export function getActorTotal(actorId: string): {
  total_earned: number;
  by_type: Record<string, number>;
  entry_count: number;
  generation: number;
} {
  const entries = ledger.filter(e => e.to_actor_id === actorId);
  const byType: Record<string, number> = {};
  let maxGen = 0;
  
  for (const entry of entries) {
    byType[entry.event_type] = (byType[entry.event_type] || 0) + entry.amount;
    if (entry.generation > maxGen) maxGen = entry.generation;
  }
  
  return {
    total_earned: entries.reduce((sum, e) => sum + e.amount, 0),
    by_type: byType,
    entry_count: entries.length,
    generation: maxGen,
  };
}

/**
 * Reset ledger state (for testing only).
 */
export function resetLedger(): void {
  currentSequence = 0;
  lastHash = GENESIS_HASH;
  ledger.length = 0;
}

// ─── TYPES ───────────────────────────────────────────────

export type RoyaltyEventType = z.infer<typeof RoyaltyEventTypeSchema>;
export type RoyaltyLedgerEntry = z.infer<typeof RoyaltyLedgerEntrySchema>;
