// ═══════════════════════════════════════════════════════════════════════
// HEAVEN v18 — Type Definitions
// The consent kernel's type system IS the law.
// ═══════════════════════════════════════════════════════════════════════

/** Cloudflare Worker environment bindings */
export interface Env {
  DB_AGENT: D1Database;
  DB_HVS: D1Database;
  KV_VOICE: KVNamespace;
  KV_GABRIEL: KVNamespace;
  KV_FLAGS: KVNamespace;
  KV_GAPS: KVNamespace;
  ENVIRONMENT: string;
  API_VERSION: string;
  HEAVEN_VERSION: string;
}

// --- Never Clause Codes (constitutional, immutable) ---
export type NeverClauseCode =
  | 'NC_POLITICAL'
  | 'NC_SEXUAL'
  | 'NC_WEAPONS'
  | 'NC_DECEPTION'
  | 'NC_HATE'
  | 'NC_TRANSFER'
  | 'NC_SURVEILLANCE'
  | 'NC_SYSTEM_INTEGRITY'
  | 'NC_SYSTEM_TRANSFER';

/** A never clause — immutable constitutional law */
export interface NeverClause {
  clause_id: number;
  actor_id: string;
  clause_code: NeverClauseCode;
  clause_text: string;
  category: string;
  is_global: 0 | 1;
  created_at: string;
}

/** Voice actor registered in HVS */
export interface Actor {
  actor_id: string;
  display_name: string;
  legal_name: string;
  email: string;
  country: string;
  is_founding: 0 | 1;
  union_member: 0 | 1;
  union_name: string | null;
  status: 'active' | 'suspended' | 'revoked' | 'deceased';
  onboarded_at: string;
}

/** Actor's estate — preservation and succession */
export interface Estate {
  estate_id: string;
  actor_id: string;
  trustee_name: string;
  trustee_email: string;
  preservation_standard: string;
  retention_years: number;
  archive_uri: string | null;
  status: 'active' | 'executing' | 'closed';
  created_at: string;
}

/** Consent token — cryptographic proof of authorized use */
export interface ConsentToken {
  token_id: string;
  actor_id: string;
  licensee_id: string;
  scope: ConsentScope;
  status: 'active' | 'revoked' | 'expired';
  granted_at: string;
  expires_at: string | null;
  revoked_at: string | null;
}

/** Consent scope — what this token authorizes */
export interface ConsentScope {
  use_cases: string[];
  jurisdictions: string[];
  mediums: string[];
  duration_days: number | null;
  exclusions: NeverClauseCode[];
}

/** Synthesis request — a request to use a voice */
export interface SynthesisRequest {
  request_id: string;
  actor_id: string;
  licensee_id: string;
  consent_token_id: string;
  use_case: string;
  jurisdiction: string;
  medium: string;
  text_hash: string;
  status: 'pending' | 'approved' | 'denied' | 'completed';
  created_at: string;
}

/** Consent check result — the kernel's decision */
export interface ConsentDecision {
  allowed: boolean;
  actor_id: string;
  token_id: string | null;
  reason: string;
  violated_clauses: NeverClauseCode[];
  checked_at: string;
  latency_ms: number;
}

/** Ledger entry — append-only, immutable */
export interface LedgerEntry {
  event_id: string;
  actor_id: string;
  descendant_id: string | null;
  licensee_id: string | null;
  license_id: string | null;
  consent_token_id: string | null;
  event_type: string;
  payload_json: string;
  amount_cad: number;
  actor_share_cad: number;
  noizy_share_cad: number;
  union_share_cad: number;
  source_system: string;
  recorded_at: string;
}

/** Agent in the registry */
export interface Agent {
  id: number;
  agent_id: string;
  agent_name: string;
  role: string;
  persona: string;
  voice_id: string | null;
  device_target: string;
  powers: string;
  status: 'active' | 'suspended' | 'retired';
  created_at: string;
}

/** API error response */
export interface ApiError {
  error: string;
  code: string;
  status: number;
  heaven_version: string;
  timestamp: string;
}

/** Health check response */
export interface HealthResponse {
  status: 'ok' | 'degraded' | 'down';
  version: string;
  environment: string;
  databases: {
    agent_memory: boolean;
    gabriel_db: boolean;
  };
  kv: {
    voice: boolean;
    gabriel: boolean;
    flags: boolean;
    gaps: boolean;
  };
  timestamp: string;
  uptime_ms: number;
}

/** Idempotency record */
export interface IdempotencyRecord {
  key: string;
  response_json: string;
  status_code: number;
  created_at: string;
  expires_at: string;
}
