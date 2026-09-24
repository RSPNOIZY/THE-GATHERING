export interface AudioFingerprint {
  id: string;
  fingerprint: string;
  algorithm: string;
  created_at: string;
  file_hash: string;
  duration_ms?: number;
  sample_rate?: number;
  bit_depth?: number;
  channels?: number;
}

export interface C2PAManifest {
  id: string;
  audio_fingerprint_id: string;
  manifest_data: string;
  signature: string;
  certificate_chain?: string;
  created_at: string;
}

export interface ConsentRecord {
  id: string;
  creator_id: string;
  consented_entity_id: string;
  consent_type: 'voice_clone' | 'sample_use' | 'derivative_work';
  granted_at: string;
  expires_at?: string;
  revoked_at?: string;
  consent_hash: string;
  terms_version: string;
}

export interface Watermark {
  id: string;
  audio_fingerprint_id: string;
  watermark_type: string;
  payload: string;
  strength: number;
  frequency_range?: string;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  event_type: string;
  actor_id: string;
  resource_type: string;
  resource_id: string;
  action: string;
  metadata?: string;
  timestamp: string;
  block_hash?: string;
  previous_hash?: string;
}

export interface ProvenanceChain {
  id: string;
  child_fingerprint_id: string;
  parent_fingerprint_id: string;
  relationship_type: 'derived' | 'sampled' | 'cloned' | 'mixed';
  transformation_metadata?: string;
  created_at: string;
}

export interface VoiceIdentity {
  id: string;
  creator_id: string;
  voice_fingerprint: string;
  verification_method: 'biometric' | 'manual' | 'ai_verified';
  verified_at: string;
  metadata?: string;
}

// C2PA specific types
export interface C2PAAssertion {
  label: string;
  data: any;
  signature?: string;
}

export interface C2PAClaim {
  dc_title?: string;
  dc_creator?: string;
  claim_generator: string;
  claim_generator_info?: {
    name: string;
    version: string;
  };
  assertions: C2PAAssertion[];
  signature_info?: {
    alg: string;
    issuer: string;
    time: string;
  };
}
