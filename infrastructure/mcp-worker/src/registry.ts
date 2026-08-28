/**
 * Model Context Protocol (MCP) Tool & Resource Registry
 * Spec Version: 2024-11-05 / 2025-03-20
 */

export interface MCPToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, any>;
    required?: string[];
  };
  requiredTier: 'T0_PUBLIC' | 'T1_SANDBOX' | 'T2_INTERNAL' | 'T3_PRODUCTION' | 'T4_SOVEREIGN';
}

export const MCP_TOOLS: MCPToolDefinition[] = [
  {
    name: 'lucy_telemetry_query',
    description: 'Query live vehicular telemetry, recent trips, and active Ottawa/YOW zone coordinates.',
    requiredTier: 'T0_PUBLIC',
    inputSchema: {
      type: 'object',
      properties: {
        vehicle_id: { type: 'string', description: 'Vehicle UUID or VIN' },
        limit: { type: 'number', description: 'Number of recent frames to fetch (default: 10)' },
        include_multimodal: { type: 'boolean', description: 'Include audio acoustic and dashcam hashes' },
      },
    },
  },
  {
    name: 'lucy_telemetry_ingest',
    description: 'Ingest a high-frequency vehicular telemetry packet (OBD-II, CAN, GPS, IMU).',
    requiredTier: 'T2_INTERNAL',
    inputSchema: {
      type: 'object',
      properties: {
        session_id: { type: 'string', description: 'Active shift session UUID' },
        latitude: { type: 'number', description: 'GPS Latitude' },
        longitude: { type: 'number', description: 'GPS Longitude' },
        speed_kmh: { type: 'number', description: 'Vehicle speed in km/h' },
        engine_rpm: { type: 'number', description: 'Engine RPM' },
        ev_battery_soc_pct: { type: 'number', description: 'EV battery state of charge' },
        accel_x_g: { type: 'number', description: 'Lateral acceleration in G' },
        accel_y_g: { type: 'number', description: 'Longitudinal acceleration in G' },
        zone_tag: { type: 'string', description: 'Zone code e.g. YOW_AIRPORT' },
      },
      required: ['session_id', 'latitude', 'longitude', 'speed_kmh'],
    },
  },
  {
    name: 'c2pa_manifest_create',
    description: 'Generate, anchor, and sign a C2PA provenance manifest with embedded ZK policy proofs.',
    requiredTier: 'T2_INTERNAL',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: { type: 'string', description: 'Asset identifier e.g. track ISRC or session URN' },
        asset_title: { type: 'string', description: 'Human-readable title' },
        asset_sha256: { type: 'string', description: 'SHA-256 hash of original binary' },
        creator_split_pct: { type: 'number', description: 'Creator split percentage (must be >= 75.0)' },
        policy_ids: {
          type: 'array',
          items: { type: 'string' },
          description: 'Policies enforced e.g. ["POL-75-25-SPLIT", "POL-NEVER-CLAUSE"]',
        },
      },
      required: ['asset_id', 'asset_title', 'asset_sha256'],
    },
  },
  {
    name: 'c2pa_verify_proof',
    description: 'Cryptographically verify an asset C2PA manifest, Merkle proof anchor, and consent status.',
    requiredTier: 'T0_PUBLIC',
    inputSchema: {
      type: 'object',
      properties: {
        manifest_urn: { type: 'string', description: 'C2PA Manifest URN or proof ID' },
        asset_sha256: { type: 'string', description: 'Asset SHA-256 to verify integrity against' },
      },
      required: ['manifest_urn'],
    },
  },
  {
    name: 'swarm_mission_dispatch',
    description: 'Dispatch a high-level goal to the NOIZYARMY swarm engine (Commander, Architect, Debugger, Sentinel).',
    requiredTier: 'T3_PRODUCTION',
    inputSchema: {
      type: 'object',
      properties: {
        title: { type: 'string', description: 'Mission headline' },
        objective: { type: 'string', description: 'Detailed objective for swarm decomposition' },
        target_bees: {
          type: 'array',
          items: { type: 'string' },
          description: 'Archetypes e.g. ["architect", "debugger", "tester", "sentinel"]',
        },
        max_token_budget: { type: 'number', description: 'Max token budget for mission run' },
      },
      required: ['title', 'objective'],
    },
  },
  {
    name: 'consent_oracle_query',
    description: 'Query the HEAVEN consent ledger for creator rights, active terms, and revocation status.',
    requiredTier: 'T0_PUBLIC',
    inputSchema: {
      type: 'object',
      properties: {
        asset_id: { type: 'string', description: 'Asset ID or ISRC' },
        creator_id: { type: 'string', description: 'Creator profile UUID' },
      },
      required: ['asset_id'],
    },
  },
  {
    name: 'zone_scorer_evaluate',
    description: 'Calculate real-time zone score, surge multiplier, and revenue velocity for Ottawa / YOW coordinates.',
    requiredTier: 'T0_PUBLIC',
    inputSchema: {
      type: 'object',
      properties: {
        latitude: { type: 'number', description: 'Target latitude' },
        longitude: { type: 'number', description: 'Target longitude' },
        current_time_iso: { type: 'string', description: 'Timestamp for temporal multiplier' },
      },
      required: ['latitude', 'longitude'],
    },
  },
];
