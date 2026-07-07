/**
 * NOIZY.AI GOVERNANCE — Blessing Gate
 * 
 * One function. One rule.
 * If status !== blessed → no Gabriel ingest.
 * If lock.locked !== true → cannot become blessed.
 * 
 * This is the single chokepoint between working memory and canonical memory.
 * Nothing gets through without human blessing.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

// ─── MEMORY STATES ───────────────────────────────────────
// Raw capture is evidence.
// Reviewed capture is working memory.
// Blessed capture is canonical memory.
// Canonical memory is the only thing Gabriel can ingest.

export type MemoryStatus = 'staging' | 'review' | 'blessed' | 'rejected' | 'archived';

// ─── MEMORY RECORD ───────────────────────────────────────

export interface MemoryRecord {
  id: string;
  type: 'session' | 'decision' | 'take' | 'consent_event' | 'actor_imprint' | 'character_profile';
  status: MemoryStatus;
  
  // Content
  content_hash: string;  // SHA-256 of the content — immutability proof
  content_path: string;  // Where the file lives on disk
  
  // Provenance
  created_at: string;
  created_by: string;    // 'claude_code' | 'human' | 'system'
  run_id?: string;
  session_id?: string;
  
  // Review
  reviewed_by?: string;
  reviewed_at?: string;
  review_notes?: string;
  
  // Blessing
  blessed_by?: string;
  blessed_at?: string;
  blessing_locked: boolean;
  
  // Gabriel
  gabriel_ingested: boolean;
  gabriel_ingested_at?: string;
  gabriel_table?: string;
}

// ─── BLESSING RESULT ─────────────────────────────────────

export interface BlessingResult {
  allowed: boolean;
  reason: string;
  record?: MemoryRecord;
}

// ─── THE GATE ────────────────────────────────────────────

/**
 * Can this record be blessed?
 * 
 * Requirements:
 * 1. Status must be 'review' (cannot bless raw staging)
 * 2. Must have been reviewed by a human
 * 3. Content hash must be present (integrity)
 * 4. Cannot bless something already blessed
 */
export function canBless(record: MemoryRecord): BlessingResult {
  if (record.status === 'blessed') {
    return { allowed: false, reason: 'Already blessed. Immutable.' };
  }

  if (record.status !== 'review') {
    return {
      allowed: false,
      reason: `Status is '${record.status}'. Only 'review' records can be blessed. Move to review first.`,
    };
  }

  if (!record.reviewed_by) {
    return { allowed: false, reason: 'No reviewer recorded. A human must review before blessing.' };
  }

  if (!record.content_hash) {
    return { allowed: false, reason: 'No content hash. Integrity cannot be verified.' };
  }

  return { allowed: true, reason: 'Record meets all blessing requirements.' };
}

/**
 * Bless a record. Locks it permanently.
 * 
 * After blessing:
 * - status becomes 'blessed'
 * - blessing_locked becomes true
 * - blessed_by and blessed_at are set
 * - Record is eligible for Gabriel ingest
 */
export function bless(record: MemoryRecord, blessedBy: string): BlessingResult {
  const check = canBless(record);
  if (!check.allowed) {
    return check;
  }

  record.status = 'blessed';
  record.blessing_locked = true;
  record.blessed_by = blessedBy;
  record.blessed_at = new Date().toISOString();

  return {
    allowed: true,
    reason: `Blessed by ${blessedBy} at ${record.blessed_at}. Eligible for Gabriel ingest.`,
    record,
  };
}

/**
 * Can this record be ingested by Gabriel?
 * 
 * THE RULE: if status !== blessed → no Gabriel ingest.
 *           if blessing_locked !== true → no Gabriel ingest.
 */
export function canIngest(record: MemoryRecord): BlessingResult {
  if (record.status !== 'blessed') {
    return {
      allowed: false,
      reason: `Status is '${record.status}'. Gabriel only sees blessed truth.`,
    };
  }

  if (!record.blessing_locked) {
    return {
      allowed: false,
      reason: 'Blessing lock is not set. Cannot ingest unlocked record.',
    };
  }

  if (record.gabriel_ingested) {
    return {
      allowed: false,
      reason: 'Already ingested. Cannot double-ingest.',
    };
  }

  return { allowed: true, reason: 'Record is blessed and locked. Clear for Gabriel ingest.' };
}

/**
 * Mark a record as ingested by Gabriel.
 * Only works on blessed, locked records.
 */
export function markIngested(record: MemoryRecord, table: string): BlessingResult {
  const check = canIngest(record);
  if (!check.allowed) {
    return check;
  }

  record.gabriel_ingested = true;
  record.gabriel_ingested_at = new Date().toISOString();
  record.gabriel_table = table;

  return {
    allowed: true,
    reason: `Ingested into Gabriel table '${table}' at ${record.gabriel_ingested_at}.`,
    record,
  };
}

/**
 * Reject a record. Removes it from the blessing pipeline.
 */
export function reject(record: MemoryRecord, rejectedBy: string, reason: string): MemoryRecord {
  if (record.status === 'blessed') {
    throw new Error('Cannot reject a blessed record. Blessed is immutable.');
  }

  record.status = 'rejected';
  record.review_notes = `Rejected by ${rejectedBy}: ${reason}`;

  return record;
}
