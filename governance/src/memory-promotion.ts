/**
 * NOIZY.AI GOVERNANCE — Memory Promotion Pipeline
 * 
 * Moves records through the blessing lifecycle:
 *   staging → review → blessed → D1
 * 
 * Each transition is logged. Each transition is auditable.
 * Nothing reaches D1 without passing through the blessing gate.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { readFileSync, writeFileSync, existsSync, copyFileSync, mkdirSync, readdirSync } from 'fs';
import { join, basename } from 'path';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { canBless, bless, canIngest, markIngested, type MemoryRecord, type MemoryStatus } from './blessing-gate';

// ─── CONFIG ──────────────────────────────────────────────

const GOVERNANCE = '/Users/m2ultra/NOIZYLAB/governance';
const STAGING_DIR = join(GOVERNANCE, 'staging');
const REVIEW_DIR = join(GOVERNANCE, 'review');
const BLESSED_DIR = join(GOVERNANCE, 'blessed');
const MANIFEST_PATH = join(GOVERNANCE, 'manifest.json');

// ─── MANIFEST ────────────────────────────────────────────
// Tracks every record and its current lifecycle position.

export interface Manifest {
  version: string;
  last_updated: string;
  records: MemoryRecord[];
}

function loadManifest(): Manifest {
  if (!existsSync(MANIFEST_PATH)) {
    return { version: '1.0.0', last_updated: new Date().toISOString(), records: [] };
  }
  return JSON.parse(readFileSync(MANIFEST_PATH, 'utf-8'));
}

function saveManifest(manifest: Manifest): void {
  manifest.last_updated = new Date().toISOString();
  writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
}

// ─── HASH ────────────────────────────────────────────────

function hashFile(filepath: string): string {
  const content = readFileSync(filepath);
  return createHash('sha256').update(content).digest('hex');
}

// ─── STAGE ───────────────────────────────────────────────
// Raw capture → staging directory. First step. Automatic.

export function stage(
  filepath: string,
  type: MemoryRecord['type'],
  createdBy: string = 'claude_code',
  runId?: string,
  sessionId?: string,
): MemoryRecord {
  if (!existsSync(filepath)) {
    throw new Error(`File not found: ${filepath}`);
  }

  // Copy to staging
  const filename = basename(filepath);
  const stagingPath = join(STAGING_DIR, filename);
  mkdirSync(STAGING_DIR, { recursive: true });
  copyFileSync(filepath, stagingPath);

  const record: MemoryRecord = {
    id: uuidv4(),
    type,
    status: 'staging',
    content_hash: hashFile(filepath),
    content_path: stagingPath,
    created_at: new Date().toISOString(),
    created_by: createdBy,
    run_id: runId,
    session_id: sessionId,
    blessing_locked: false,
    gabriel_ingested: false,
  };

  const manifest = loadManifest();
  manifest.records.push(record);
  saveManifest(manifest);

  return record;
}

// ─── PROMOTE TO REVIEW ───────────────────────────────────
// staging → review. Human has looked at it.

export function promoteToReview(
  recordId: string,
  reviewedBy: string,
  notes?: string,
): MemoryRecord {
  const manifest = loadManifest();
  const record = manifest.records.find(r => r.id === recordId);

  if (!record) throw new Error(`Record not found: ${recordId}`);
  if (record.status !== 'staging') {
    throw new Error(`Cannot promote to review: status is '${record.status}', expected 'staging'`);
  }

  // Move file
  const filename = basename(record.content_path);
  const reviewPath = join(REVIEW_DIR, filename);
  mkdirSync(REVIEW_DIR, { recursive: true });
  copyFileSync(record.content_path, reviewPath);

  // Verify integrity
  const newHash = hashFile(reviewPath);
  if (newHash !== record.content_hash) {
    throw new Error(`Integrity violation: content hash changed during promotion. File may have been tampered with.`);
  }

  record.status = 'review';
  record.content_path = reviewPath;
  record.reviewed_by = reviewedBy;
  record.reviewed_at = new Date().toISOString();
  record.review_notes = notes;

  saveManifest(manifest);
  return record;
}

// ─── PROMOTE TO BLESSED ──────────────────────────────────
// review → blessed. Through the gate. Locked.

export function promoteToBlessed(
  recordId: string,
  blessedBy: string,
): MemoryRecord {
  const manifest = loadManifest();
  const record = manifest.records.find(r => r.id === recordId);

  if (!record) throw new Error(`Record not found: ${recordId}`);

  // Gate check
  const gateResult = canBless(record);
  if (!gateResult.allowed) {
    throw new Error(`Blessing gate denied: ${gateResult.reason}`);
  }

  // Bless
  const blessResult = bless(record, blessedBy);
  if (!blessResult.allowed || !blessResult.record) {
    throw new Error(`Blessing failed: ${blessResult.reason}`);
  }

  // Move file
  const filename = basename(record.content_path);
  const blessedPath = join(BLESSED_DIR, filename);
  mkdirSync(BLESSED_DIR, { recursive: true });
  copyFileSync(record.content_path, blessedPath);

  // Verify integrity
  const newHash = hashFile(blessedPath);
  if (newHash !== record.content_hash) {
    throw new Error(`Integrity violation during blessing. Aborting.`);
  }

  record.content_path = blessedPath;
  saveManifest(manifest);

  return record;
}

// ─── PROMOTE TO D1 ──────────────────────────────────────
// blessed → D1. Gabriel can see it.

export function promoteToD1(
  recordId: string,
  table: string,
): MemoryRecord {
  const manifest = loadManifest();
  const record = manifest.records.find(r => r.id === recordId);

  if (!record) throw new Error(`Record not found: ${recordId}`);

  // Ingest check
  const ingestResult = canIngest(record);
  if (!ingestResult.allowed) {
    throw new Error(`Ingest denied: ${ingestResult.reason}`);
  }

  // Mark ingested
  const result = markIngested(record, table);
  if (!result.allowed) {
    throw new Error(`Ingest failed: ${result.reason}`);
  }

  saveManifest(manifest);
  return record;
}

// ─── QUERY ───────────────────────────────────────────────

export function getRecordsByStatus(status: MemoryStatus): MemoryRecord[] {
  const manifest = loadManifest();
  return manifest.records.filter(r => r.status === status);
}

export function getRecord(recordId: string): MemoryRecord | undefined {
  const manifest = loadManifest();
  return manifest.records.find(r => r.id === recordId);
}

export function getManifestSummary(): {
  total: number;
  staging: number;
  review: number;
  blessed: number;
  rejected: number;
  ingested: number;
} {
  const manifest = loadManifest();
  return {
    total: manifest.records.length,
    staging: manifest.records.filter(r => r.status === 'staging').length,
    review: manifest.records.filter(r => r.status === 'review').length,
    blessed: manifest.records.filter(r => r.status === 'blessed').length,
    rejected: manifest.records.filter(r => r.status === 'rejected').length,
    ingested: manifest.records.filter(r => r.gabriel_ingested).length,
  };
}
