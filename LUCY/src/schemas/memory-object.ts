/**
 * LUCY v4.0 — Memory Object Model & Knowledge Kernel
 * 
 * Evolving Lucy from an assistant into a Personal Operating System.
 * Captures Experience → Knowledge → Wisdom → Legacy.
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';

// ─── 1. MEMORY OBJECT TYPE ENUM ───────────────────────────
export const MemoryObjectTypeSchema = z.enum([
  'trip',              // Operational rideshare shift / individual trip event
  'conversation',      // Passenger dialogue, language interaction, verbal spark
  'idea',              // Creative spark, musical concept, lyrical motif, technical insight
  'creative_asset',    // Stem, mix, artwork, prompt, master track, synthesis patch
  'event',             // Macro surge trigger, concert, festival, airport flight wave
  'system_metric',     // Telemetry, vehicle health, device battery, Lucy model latency
  'life_moment',       // Personal wisdom, milestone, health metric, reflective entry
  'market_signal',     // Pricing anomaly, competitive shift, platform policy delta
]);

export type MemoryObjectType = z.infer<typeof MemoryObjectTypeSchema>;

// ─── 2. ACTORS & ANONYMIZATION ────────────────────────────
export const MemoryActorSchema = z.object({
  driver_id: z.string().default('RSP_001'), // Robert Stephen Plowman / Gabriel
  driver_role: z.enum(['primary_operator', 'digital_twin', 'collaborator']).default('primary_operator'),
  passenger_pseudonym_id: z.string().optional().describe('Salted hash / anonymized ID (e.g. PAX_7a9f2c)'),
  passenger_count: z.number().int().min(0).max(8).default(1),
  passenger_demographic_hint: z.string().optional().describe('Non-PII context: e.g. "tech-conference-attendee", "tourist-group"'),
  consent_state: z.enum(['explicit_opt_in', 'passive_telemetry_only', 'opt_out', 'redacted']).default('passive_telemetry_only'),
});

export type MemoryActor = z.infer<typeof MemoryActorSchema>;

// ─── 3. SPATIAL & LOCATION INTELLIGENCE ───────────────────
export const MemoryLocationSchema = z.object({
  geohash: z.string().min(4).max(12).describe('Geohash encoding for spatial indexing'),
  latitude: z.number().min(-90).max(90).optional(),
  longitude: z.number().min(-180).max(180).optional(),
  zone_tag: z.string().describe('e.g. YOW_AIRPORT, DOWNTOWN_OTTAWA, BYWARD_MARKET, GLEBE_LANSDOWNE, KANATA_TECH'),
  venue_id: z.string().optional().describe('e.g. VENUE_NAC_01, VENUE_CANADIAN_TIRE_CTR, VENUE_CHATEAU_LAURIER'),
  city: z.string().default('Ottawa'),
  region: z.string().default('ON'),
  country: z.string().default('CA'),
  speed_kmh: z.number().nonnegative().optional(),
  heading_deg: z.number().min(0).max(360).optional(),
});

export type MemoryLocation = z.infer<typeof MemoryLocationSchema>;

// ─── 4. LANGUAGE & ACOUSTIC CONTEXT ───────────────────────
export const LanguageDetectionSchema = z.object({
  iso_code: z.string().min(2).max(5).describe('ISO 639-1 code: en, fr, es, ar, zh, etc.'),
  confidence: z.number().min(0).max(1),
  dialect: z.string().optional().describe('e.g. fr-CA, en-CA, ar-LEV'),
  is_multilingual: z.boolean().default(false),
  secondary_languages: z.array(z.string()).default([]),
  translation_active: z.boolean().default(false),
  target_language: z.string().optional(),
});

export type LanguageDetection = z.infer<typeof LanguageDetectionSchema>;

// ─── 5. CONTENT & ENCRYPTED POINTERS ──────────────────────
export const MemoryContentSchema = z.object({
  summary: z.string().min(1).describe('Concise high-level description of the memory object'),
  transcript_snippet: z.string().optional().describe('Redacted snippet if consent cleared, otherwise ephemeral'),
  creative_notes: z.string().optional().describe('Musical ideas, production concepts, philosophical thoughts'),
  keywords: z.array(z.string()).default([]),
  audio_pointer: z.object({
    vault_uri: z.string().describe('Encrypted vault path (e.g. vault://hot/2026/08/audio_uuid.enc)'),
    encryption_algorithm: z.enum(['AES-256-GCM', 'ChaCha20-Poly1305']).default('AES-256-GCM'),
    key_fingerprint: z.string().describe('Public key fingerprint or KMS key reference'),
    is_ephemeral: z.boolean().default(true).describe('If true, marked for automatic purge after extraction'),
    purge_after_timestamp: z.string().datetime().optional(),
  }).optional(),
  asset_attachments: z.array(z.object({
    asset_id: z.string().uuid(),
    asset_type: z.enum(['stem', 'midi', 'preset', 'prompt', 'image', 'contract', 'receipt']),
    file_path: z.string(),
    sha256_hash: z.string(),
    size_bytes: z.number().int().nonnegative(),
  })).default([]),
});

export type MemoryContent = z.infer<typeof MemoryContentSchema>;

// ─── 6. SIGNALS & OPERATIONAL TELEMETRY ───────────────────
export const MemorySignalsSchema = z.object({
  // Financial Signals (CAD standard)
  revenue_gross: z.number().default(0),
  revenue_net: z.number().default(0),
  platform_fee: z.number().default(0),
  tip_amount: z.number().default(0),
  surge_multiplier: z.number().min(1.0).default(1.0),
  hourly_earning_rate: z.number().default(0),
  
  // Physical & Vehicular
  distance_km: z.number().default(0),
  duration_minutes: z.number().default(0),
  fuel_liters: z.number().optional(),
  fuel_cost: z.number().optional(),
  vehicle_battery_pct: z.number().min(0).max(100).optional(),
  vehicle_health_status: z.enum(['nominal', 'advisory', 'warning', 'critical']).default('nominal'),
  
  // Cognitive & System Telemetry
  lucy_inference_latency_ms: z.number().int().nonnegative().default(0),
  edge_node_temperature_c: z.number().optional(),
  network_rtt_ms: z.number().int().nonnegative().optional(),
  battery_level_device: z.number().min(0).max(100).optional(),
});

export type MemorySignals = z.infer<typeof MemorySignalsSchema>;

// ─── 7. VALUE SCORING MATRIX ──────────────────────────────
export const ValueScoreSchema = z.object({
  total_score: z.number().min(0).max(100).describe('Computed overall importance metric (0-100)'),
  components: z.object({
    creative_yield_potential: z.number().min(0).max(100).describe('Sparks that feed albums, tracks, patents, writing'),
    business_intelligence_weight: z.number().min(0).max(100).describe('High revenue anomaly, strategic zone discovery'),
    linguistic_cultural_richness: z.number().min(0).max(100).describe('Rare dialect, profound dialogue, emotional resonance'),
    legacy_longevity_factor: z.number().min(0).max(100).describe('Timeless philosophical wisdom, pivotal life milestone'),
    operational_utility: z.number().min(0).max(100).describe('Vehicle maintenance clue, safety pattern, workflow friction'),
  }),
  computed_by: z.string().default('LUCY_HEURISTIC_V4'),
  computed_at: z.string().datetime(),
  curator_override: z.number().min(0).max(100).optional(),
  curator_notes: z.string().optional(),
});

export type ValueScore = z.infer<typeof ValueScoreSchema>;

// ─── 8. RETENTION TIERS & GOVERNANCE ──────────────────────
export const RetentionTierSchema = z.enum([
  'tier_hot_active',      // In-memory / fast local SQLite (0-90 days, daily queries)
  'tier_warm_analytics',  // 90 days - 5 years (M2 Ultra God rig, vector search, retraining)
  'tier_cold_legacy',     // Decades (Permanent Michael vault, signed Merkle manifests, cold storage)
  'tier_ephemeral_purge', // 24-72 hours auto-deletion (unconsented raw audio, transient logs)
]);

export type RetentionTier = z.infer<typeof RetentionTierSchema>;

export const GovernanceRecordSchema = z.object({
  retention_tier: RetentionTierSchema.default('tier_hot_active'),
  consent_flags: z.object({
    audio_recording_cleared: z.boolean().default(false),
    transcript_retention_cleared: z.boolean().default(true),
    digital_twin_training_cleared: z.boolean().default(true),
    public_anonymized_research_cleared: z.boolean().default(false),
    commercial_licensing_cleared: z.boolean().default(false),
  }),
  jurisdiction: z.string().default('CA-ON-OTTAWA'),
  privacy_compliance: z.object({
    pipeda_compliant: z.boolean().default(true),
    gdpr_ready: z.boolean().default(true),
    right_to_forget_supported: z.boolean().default(true),
    anonymization_salt_version: z.string().default('v1.0'),
  }),
});

export type GovernanceRecord = z.infer<typeof GovernanceRecordSchema>;

// ─── 9. PROVENANCE & IMMUTABLE AUDIT ───────────────────────
export const ProvenanceAuditSchema = z.object({
  device_node: z.string().default('IPAD_LUCY_COCKPIT_01'),
  host_machine: z.string().default('M2_ULTRA_GOD_RIG'),
  model_versions: z.object({
    whisper_engine: z.string().default('whisper-large-v3-turbo-mlx'),
    lucy_core: z.string().default('lucy-v4.0-extended-thinking'),
    gabriel_orchestrator: z.string().default('gabriel-v4.2'),
    embedding_model: z.string().default('nomic-embed-text-v1.5'),
  }),
  sha256_hash: z.string().describe('SHA-256 hash of canonical normalized object content'),
  prev_object_hash: z.string().optional().describe('Parent hash in immutable chronological chain'),
  ed25519_signature: z.string().optional().describe('Cryptographic signature from hardware enclave / key'),
  storage_location: z.string().describe('URI of physical primary record'),
  receipt_id: z.string().describe('FK -> THE-GATHERING receipts ledger'),
});

export type ProvenanceAudit = z.infer<typeof ProvenanceAuditSchema>;

// ─── 10. GRAPH RELATIONS & LINKAGES ───────────────────────
export const MemoryRelationSchema = z.object({
  target_id: z.string().uuid(),
  target_type: MemoryObjectTypeSchema,
  relation_type: z.enum([
    'parent_shift',        // Part of a larger shift session
    'sparked_by',          // Idea sparked by a specific conversation/trip
    'spawned_asset',       // Idea resulted in audio stem / track
    'spatial_neighbor',    // Occurred in same zone within temporal window
    'semantic_cluster',    // Similar topic or harmonic concept
    'supersedes_version',  // Version chain pointer
    'mitigates_risk',      // Action mitigates observed risk
  ]),
  weight: z.number().min(0).max(1).default(1.0),
  annotation: z.string().optional(),
});

export type MemoryRelation = z.infer<typeof MemoryRelationSchema>;

// ─── 11. PRIMARY MEMORY OBJECT SCHEMA ─────────────────────
export const MemoryObjectSchema = z.object({
  id: z.string().uuid(),
  schema_version: z.literal('4.0.0').default('4.0.0'),
  timestamp: z.string().datetime().describe('ISO 8601 creation timestamp'),
  type: MemoryObjectTypeSchema,
  
  actors: MemoryActorSchema,
  location: MemoryLocationSchema,
  languages: LanguageDetectionSchema,
  content: MemoryContentSchema,
  signals: MemorySignalsSchema,
  tags: z.object({
    event_tag: z.string().optional(),
    topic_tags: z.array(z.string()).default([]),
    sentiment: z.enum(['deeply_positive', 'positive', 'neutral', 'reflective', 'tense', 'inspirational']).default('neutral'),
    musical_keys_detected: z.array(z.string()).optional(),
    bpm_estimates: z.array(z.number()).optional(),
  }),
  value_score: ValueScoreSchema,
  governance: GovernanceRecordSchema,
  provenance: ProvenanceAuditSchema,
  relations: z.array(MemoryRelationSchema).default([]),
  
  // Immutability marker
  is_immutable: z.boolean().default(true),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export type MemoryObject = z.infer<typeof MemoryObjectSchema>;

// ─── 12. BLANK BLACK.NUMBERS TO MEMORY OBJECT MAPPING ─────
export interface BlankBlackRow {
  Date: string;                    // e.g. "2026-08-12"
  Time?: string;                   // e.g. "21:45"
  Platform: 'UBER' | 'LYFT' | 'PRIVATE' | 'OTHER';
  TripID?: string;                 // External platform ID
  PickupLocation: string;
  DropoffLocation: string;
  OttawaZone: string;              // e.g. "DOWNTOWN", "BYWARD", "YOW"
  GrossFareCAD: number;
  PlatformFeeCAD: number;
  NetFareCAD: number;
  TipsCAD: number;
  SurgeMultiplier: number;
  DistanceKM: number;
  DurationMinutes: number;
  DetectedLanguages?: string;      // e.g. "en (0.95), fr (0.80)"
  CreativeSparkNotes?: string;     // e.g. "Idea for 124 BPM bassline triggered by conversation"
  SentimentRating?: string;        // e.g. "inspirational"
  ReceiptID?: string;
}

export function convertBlankBlackToMemoryObject(row: BlankBlackRow, runId: string): Partial<MemoryObject> {
  const timestamp = row.Time 
    ? new Date(`${row.Date}T${row.Time}:00Z`).toISOString()
    : new Date(`${row.Date}T12:00:00Z`).toISOString();
    
  return {
    schema_version: '4.0.0',
    timestamp,
    type: row.CreativeSparkNotes ? 'idea' : 'trip',
    actors: {
      driver_id: 'RSP_001',
      driver_role: 'primary_operator',
      passenger_count: 1,
      consent_state: 'passive_telemetry_only',
    },
    location: {
      geohash: 'f244m', // Default Ottawa region geohash
      zone_tag: row.OttawaZone || 'DOWNTOWN_OTTAWA',
      city: 'Ottawa',
      region: 'ON',
      country: 'CA',
    },
    languages: {
      iso_code: (row.DetectedLanguages && row.DetectedLanguages.includes('fr')) ? 'fr' : 'en',
      confidence: 0.95,
      is_multilingual: Boolean(row.DetectedLanguages && row.DetectedLanguages.includes(',')),
      secondary_languages: [],
      translation_active: false,
    },
    content: {
      summary: `Shift Trip [${row.Platform}] - ${row.OttawaZone}: ${row.PickupLocation} -> ${row.DropoffLocation}`,
      creative_notes: row.CreativeSparkNotes,
      keywords: [row.Platform.toLowerCase(), row.OttawaZone.toLowerCase(), 'shift_log'],
      asset_attachments: [],
    },
    signals: {
      revenue_gross: row.GrossFareCAD || 0,
      revenue_net: row.NetFareCAD || 0,
      platform_fee: row.PlatformFeeCAD || 0,
      tip_amount: row.TipsCAD || 0,
      surge_multiplier: row.SurgeMultiplier || 1.0,
      hourly_earning_rate: row.DurationMinutes > 0 ? (row.NetFareCAD / (row.DurationMinutes / 60)) : 0,
      distance_km: row.DistanceKM || 0,
      duration_minutes: row.DurationMinutes || 0,
      vehicle_health_status: 'nominal',
      lucy_inference_latency_ms: 220,
    },
    tags: {
      event_tag: row.SurgeMultiplier > 1.3 ? 'SURGE_SURFACE' : undefined,
      topic_tags: ['rideshare', row.Platform, row.OttawaZone],
      sentiment: (row.SentimentRating as any) || 'neutral',
    },
    value_score: {
      total_score: row.CreativeSparkNotes ? 85 : (row.SurgeMultiplier > 1.5 ? 75 : 45),
      components: {
        creative_yield_potential: row.CreativeSparkNotes ? 90 : 10,
        business_intelligence_weight: row.SurgeMultiplier > 1.3 ? 80 : 40,
        linguistic_cultural_richness: (row.DetectedLanguages && row.DetectedLanguages.includes(',')) ? 75 : 30,
        legacy_longevity_factor: row.CreativeSparkNotes ? 80 : 20,
        operational_utility: 70,
      },
      computed_by: 'BLANK_BLACK_IMPORT_V4',
      computed_at: new Date().toISOString(),
    },
    governance: {
      retention_tier: row.CreativeSparkNotes ? 'tier_warm_analytics' : 'tier_hot_active',
      consent_flags: {
        audio_recording_cleared: false,
        transcript_retention_cleared: true,
        digital_twin_training_cleared: true,
        public_anonymized_research_cleared: false,
        commercial_licensing_cleared: false,
      },
      jurisdiction: 'CA-ON-OTTAWA',
      privacy_compliance: {
        pipeda_compliant: true,
        gdpr_ready: true,
        right_to_forget_supported: true,
        anonymization_salt_version: 'v1.0',
      },
    },
    provenance: {
      device_node: 'IPAD_LUCY_COCKPIT_01',
      host_machine: 'M2_ULTRA_GOD_RIG',
      model_versions: {
        whisper_engine: 'whisper-large-v3-turbo-mlx',
        lucy_core: 'lucy-v4.0-extended-thinking',
        gabriel_orchestrator: 'gabriel-v4.2',
        embedding_model: 'nomic-embed-text-v1.5',
      },
      sha256_hash: '',
      storage_location: 'sqlite:///Users/m2ultra/rideshare/db/rsp_rideshare.db',
      receipt_id: row.ReceiptID || `RCP_MEM_${Date.now()}`,
    },
    relations: [],
    is_immutable: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };
}
