/**
 * DREAMCHAMBER KNOWLEDGE GRAPH & GABRIEL DIGITAL TWIN
 * 
 * Part of Lucy v4.0 Personal Operating System
 * Connects Life Experience → Creative Sparks → Production Assets → Commercial Streams → Wisdom Legacy
 * 
 * Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
 */

import { z } from 'zod';
import { MemoryObjectSchema, MemoryObjectTypeSchema } from './memory-object';

// ─── 1. DREAMCHAMBER GRAPH NODE PRIMITIVES ────────────────

export const PersonNodeSchema = z.object({
  person_id: z.string().describe('e.g. PERSON_RSP (Robert Stephen Plowman)'),
  full_name: z.string(),
  alias: z.string().default('Gabriel'),
  role: z.enum(['creator_architect', 'collaborator', 'mentor', 'audience', 'digital_twin']),
  creative_preferences: z.object({
    harmonic_signatures: z.array(z.string()).describe('e.g. D Minor, F# Minor Dorian, 432Hz tuning'),
    tempo_ranges_bpm: z.array(z.tuple([z.number(), z.number()])),
    production_methods: z.array(z.string()).describe('e.g. Hardware analog synth, Granular synthesis, Live acoustic resynthesis'),
    philosophical_anchors: z.array(z.string()).describe('e.g. Peace, Explicit Consent, Sonic Healing, Non-commodification of identity'),
  }),
  digital_twin_enabled: z.boolean().default(true),
});

export type PersonNode = z.infer<typeof PersonNodeSchema>;

export const IdeaNodeSchema = z.object({
  idea_id: z.string().uuid(),
  title: z.string(),
  spark_text: z.string(),
  origin_memory_object_id: z.string().uuid().describe('FK -> MemoryObject that triggered this spark'),
  origin_context: z.object({
    zone_tag: z.string(),
    conversation_topic: z.string().optional(),
    timestamp: z.string().datetime(),
  }),
  musical_attributes: z.object({
    key: z.string().optional(),
    bpm: z.number().optional(),
    genre_vector: z.array(z.string()).default([]),
    mood: z.string().optional(),
  }).optional(),
  target_brand: z.enum(['NOIZYVOX', 'NOIZYFISH', 'NOIZYKIDZ', 'NOIZYLAB', 'myFAMILY_AI', 'WISDOM_PROJECT', 'HEAVEN']),
  stage: z.enum(['spark', 'elaborated', 'in_production', 'mastered', 'archived']),
  tags: z.array(z.string()),
});

export type IdeaNode = z.infer<typeof IdeaNodeSchema>;

export const AssetNodeSchema = z.object({
  asset_id: z.string().uuid(),
  title: z.string(),
  asset_type: z.enum(['stem', 'mix_multitrack', 'master_audio', 'midi_file', 'synth_preset', 'lyrics', 'artwork', 'contract_pdf']),
  file_uri: z.string(),
  sha256_hash: z.string(),
  sample_rate_hz: z.number().optional().default(48000),
  bit_depth: z.number().optional().default(24),
  duration_seconds: z.number().optional(),
  parent_idea_id: z.string().uuid().optional(),
  isrc_code: z.string().optional(),
  rights_holder: z.string().default('Robert Stephen Plowman / Fishmusic Inc.'),
  consent_clearance_id: z.string().uuid().optional(),
});

export type AssetNode = z.infer<typeof AssetNodeSchema>;

export const ProjectNodeSchema = z.object({
  project_id: z.string().uuid(),
  title: z.string(),
  brand: z.enum(['NOIZYVOX', 'NOIZYFISH', 'NOIZYKIDZ', 'NOIZYLAB', 'myFAMILY_AI', 'WISDOM_PROJECT', 'HEAVEN']),
  status: z.enum(['conception', 'tracking', 'mixing', 'cleared_for_release', 'released', 'vaulted']),
  lead_architect: z.string().default('PERSON_RSP'),
  collaborator_ids: z.array(z.string()).default([]),
  revenue_streams: z.array(z.object({
    stream_type: z.enum(['sync_licensing', 'streaming_royalties', 'nft_sovereign', 'direct_patronage', 'ai_voice_license']),
    allocation_pct: z.number().min(0).max(100),
    platform_contract_id: z.string().optional(),
  })),
  created_at: z.string().datetime(),
});

export type ProjectNode = z.infer<typeof ProjectNodeSchema>;

// ─── 2. GABRIEL ARTIST DIGITAL TWIN SPECIFICATION ──────────

export const GabrielProfileVectorSchema = z.object({
  twin_version: z.literal('4.0.0').default('4.0.0'),
  base_identity: z.literal('Gabriel (Simulated Persona of Robert Stephen Plowman)'),
  decision_heuristics: z.array(z.object({
    rule_name: z.string(),
    weight: z.number().min(0).max(1.0),
    description: z.string(),
  })),
  phrasing_patterns: z.array(z.string()),
  harmonic_biases: z.object({
    preferred_progressions: z.array(z.string()),
    texture_density_preference: z.enum(['spacious_ambient', 'dense_layered_analog', 'rhythmic_pulsing', 'minimalist_acoustic']),
  }),
  safety_guardrails: z.object({
    watermark_required: z.literal(true).default(true),
    simulation_label: z.literal('SIMULATED_GABRIEL_REASONING').default('SIMULATED_GABRIEL_REASONING'),
    human_override_required_for_publishing: z.literal(true).default(true),
    maximum_autonomous_spend_cad: z.number().default(0.0),
  }),
});

export type GabrielProfileVector = z.infer<typeof GabrielProfileVectorSchema>;

// ─── 3. CYPHER TRAVERSALS & GRAPHQL SAMPLES ───────────────

export const CYPHER_TRAVERSAL_QUERIES = {
  // Query 1: Find creative sparks born from Ottawa Friday Night Downtown rides mentioning synth textures
  DOWNTOWN_FRIDAY_SYNTH_SPARKS: `
    MATCH (zone:Zone {tag: 'DOWNTOWN_CENTRETOWN'})<-[:LOCATED_IN]-(trip:MemoryObject {type: 'trip'})
    MATCH (trip)-[:SPARKED]->(idea:Idea)
    WHERE trip.timestamp CONTAINS 'Fri' OR datetime(trip.timestamp).dayOfWeek = 5
      AND (idea.spark_text =~ '(?i).*synth.*' OR idea.spark_text =~ '(?i).*texture.*')
    RETURN trip.id AS trip_id,
           trip.timestamp AS trip_time,
           trip.signals_revenue_gross AS gross_fare,
           idea.id AS idea_id,
           idea.title AS idea_title,
           idea.spark_text AS spark_text
    ORDER BY trip.timestamp DESC
  `,

  // Query 2: Full provenance lineage: Trip -> Conversation -> Idea -> Audio Asset -> Project -> Revenue
  EXPERIENCE_TO_REVENUE_LINEAGE: `
    MATCH (trip:MemoryObject {type: 'trip'})-[:CONTAINS_INTERACTION]->(conv:MemoryObject {type: 'conversation'})
    MATCH (conv)-[:SPARKED]->(idea:Idea)
    MATCH (idea)-[:REALIZED_AS]->(asset:Asset)
    MATCH (asset)<-[:INCLUDES_ASSET]-(proj:Project)
    MATCH (proj)-[:GENERATES_REVENUE]->(rev:RevenueEvent)
    RETURN trip.id AS origin_shift_trip,
           conv.languages_detected AS passenger_language,
           idea.title AS creative_spark,
           asset.title AS master_stem,
           proj.title AS release_project,
           SUM(rev.amount_cad) AS lifetime_revenue_cad
    GROUP BY proj.id
  `,

  // Query 3: Zone language correlation with tip percentage and high-value wisdom moments
  ZONE_LANGUAGE_WISDOM_CORRELATION: `
    MATCH (m:MemoryObject)
    WHERE m.value_score_total >= 75
    RETURN m.location_zone_tag AS zone,
           m.languages_iso_code AS dominant_language,
           COUNT(m) AS wisdom_spark_count,
           AVG(m.signals_tip_amount) AS avg_tip,
           AVG(m.value_score_creative_yield) AS avg_creative_yield
    ORDER BY wisdom_spark_count DESC
  `
};

export const GRAPHQL_SCHEMA_DEFINITION = `
  type MemoryObject {
    id: ID!
    timestamp: String!
    type: String!
    zoneTag: String!
    grossRevenue: Float!
    valueScore: Float!
    sparkedIdeas: [Idea!]!
    provenanceHash: String!
  }

  type Idea {
    id: ID!
    title: String!
    sparkText: String!
    targetBrand: String!
    stage: String!
    originMemory: MemoryObject!
    spawnedAssets: [Asset!]!
  }

  type Asset {
    id: ID!
    title: String!
    assetType: String!
    fileUri: String!
    sha256: String!
    parentIdea: Idea
    project: Project
  }

  type Project {
    id: ID!
    title: String!
    brand: String!
    status: String!
    assets: [Asset!]!
  }

  type Query {
    getCreativeSparksByZone(zoneTag: String!, minScore: Float): [Idea!]!
    getProvenaceTrail(assetId: ID!): MemoryObject
    getDigitalTwinRecommendations(contextPrompt: String!): DigitalTwinResponse!
  }

  type DigitalTwinResponse {
    simulatedReasoning: String!
    confidence: Float!
    heuristicProvenance: [String!]!
    simulationWatermark: String!
  }
`;
