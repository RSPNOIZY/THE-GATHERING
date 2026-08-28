/**
 * MICHAEL — Sovereign Archivist, Historian & Digital Estate Manager
 * 
 * Part of Lucy v4.0 Personal Operating System
 * Ensures 100-year provenance, cryptographic integrity, and estate inheritance.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';
import * as crypto from 'crypto';

// ─── 1. STORAGE TIERS SPECIFICATION ───────────────────────

export const StorageTierPolicySchema = z.object({
  tier_name: z.enum(['HOT_EDGE_ACTIVE', 'WARM_M2_ANALYTICS', 'COLD_PERMANENT_VAULT', 'EPHEMERAL_PURGE']),
  description: z.string(),
  max_retention_days: z.number().nullable(), // null = forever
  physical_storage_path: z.string(),
  encryption_standard: z.string(),
  replication_target: z.string().optional(),
  scrub_frequency_days: z.number(),
});

export const MICHAEL_STORAGE_TIERS = {
  HOT_EDGE_ACTIVE: {
    tier_name: 'HOT_EDGE_ACTIVE',
    description: 'Fast local SQLite on iPad and God Rig for immediate shift queries and active production',
    max_retention_days: 90,
    physical_storage_path: '/Users/m2ultra/rideshare/db/rsp_rideshare.db',
    encryption_standard: 'AES-256-GCM',
    scrub_frequency_days: 7,
  },
  WARM_M2_ANALYTICS: {
    tier_name: 'WARM_M2_ANALYTICS',
    description: 'M2 Ultra God Rig fast NVMe for embedding search, cross-shift patterns, and model tuning',
    max_retention_days: 1825, // 5 years
    physical_storage_path: '/Users/m2ultra/THE-GATHERING/memory/warm_vault/',
    encryption_standard: 'AES-256-GCM',
    scrub_frequency_days: 30,
  },
  COLD_PERMANENT_VAULT: {
    tier_name: 'COLD_PERMANENT_VAULT',
    description: 'Immutable WORM optical / encrypted off-site cold archive with signed Merkle roots',
    max_retention_days: null, // Indefinite (100+ years)
    physical_storage_path: '/Users/m2ultra/THE-GATHERING/12TB_RESCUE/COLD_LEGACY_VAULT/',
    encryption_standard: 'ChaCha20-Poly1305 + Ed25519 Signed Manifest',
    replication_target: 'Fishmusicinc Sovereign Cloudflare R2 Archive',
    scrub_frequency_days: 180,
  },
  EPHEMERAL_PURGE: {
    tier_name: 'EPHEMERAL_PURGE',
    description: 'Raw conversational audio without explicit long-term consent',
    max_retention_days: 3, // 72 hours max
    physical_storage_path: '/Users/m2ultra/rideshare/logs/ephemeral_audio/',
    encryption_standard: 'AES-256-GCM',
    scrub_frequency_days: 1,
  }
} as const;

// ─── 2. PROVENANCE MANIFEST SCHEMA ────────────────────────

export const ArchivalBatchManifestSchema = z.object({
  manifest_id: z.string().uuid(),
  batch_sequence_number: z.number().int().positive(),
  archived_at: z.string().datetime(),
  curator_role: z.enum(['MICHAEL_HISTORIAN', 'LUCY_NIGHTLY_BATCH', 'GABRIEL_MANUAL_BLESS']),
  total_memory_objects_count: z.number().int().nonnegative(),
  tier: z.enum(['HOT_EDGE_ACTIVE', 'WARM_M2_ANALYTICS', 'COLD_PERMANENT_VAULT']),
  merkle_root_hash: z.string().describe('SHA-256 Merkle root of all object hashes in batch'),
  previous_batch_root_hash: z.string().describe('Chronological tamper-evident blockchain pointer'),
  ed25519_signature: z.string().describe('Cryptographic proof signed by sovereign hardware key'),
  object_manifest_entries: z.array(z.object({
    memory_object_id: z.string().uuid(),
    type: z.string(),
    sha256_hash: z.string(),
    storage_relative_path: z.string(),
    value_score: z.number(),
  })),
});

export type ArchivalBatchManifest = z.infer<typeof ArchivalBatchManifestSchema>;

// ─── 3. DIGITAL ESTATE INHERITANCE POLICY ─────────────────

export const DigitalEstatePolicySchema = z.object({
  estate_owner: z.literal('Robert Stephen Plowman'),
  primary_fiduciary: z.string().default('DESIGNATED_FAMILY_FIDUCIARY'),
  access_rules: z.array(z.object({
    category: z.enum(['UNRELEASED_CATALOG', 'CREATIVE_PROMPTS_TWIN', 'OPERATIONAL_JOURNALS', 'FINANCIAL_RECORDS', 'PERSONAL_WISDOM']),
    public_release_delay_years: z.number().int().nonnegative(),
    licensing_authorization_scope: z.array(z.string()),
    prohibited_uses: z.array(z.string()).describe('e.g. "Weapons manufacturing, unconsented deepfake voice defamation"'),
    perpetual_royalty_allocation: z.object({
      estate_beneficiaries_pct: z.number().min(0).max(100),
      noizykidz_foundation_pct: z.number().min(0).max(100),
    }),
  })),
  cryptographic_recovery_quorum: z.object({
    total_key_shards: z.number().int().min(3).default(5), // Shamir Secret Sharing (3-of-5)
    required_threshold: z.number().int().min(2).default(3),
    shard_holders: z.array(z.string()),
  }),
});

export type DigitalEstatePolicy = z.infer<typeof DigitalEstatePolicySchema>;

// ─── 4. MERKLE BATCH BUILDER HELPER ───────────────────────

export function buildMerkleRoot(hashes: string[]): string {
  if (hashes.length === 0) return crypto.createHash('sha256').update('EMPTY_TREE').digest('hex');
  let currentLevel = [...hashes];
  
  while (currentLevel.length > 1) {
    const nextLevel: string[] = [];
    for (let i = 0; i < currentLevel.length; i += 2) {
      const left = currentLevel[i];
      const right = (i + 1 < currentLevel.length) ? currentLevel[i + 1] : left;
      const combined = crypto.createHash('sha256').update(left + right).digest('hex');
      nextLevel.push(combined);
    }
    currentLevel = nextLevel;
  }
  return currentLevel[0];
}
