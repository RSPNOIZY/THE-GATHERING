-- NOIZY Consent Gateway — D1 Schema v2.0
-- Run: wrangler d1 execute noizy_consent_db --file=schema.sql
-- Author: RSP_001 — rsp@noizyfish.com — March 2026

-- ── Creators ──────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS creators (
  id TEXT PRIMARY KEY,
  legal_name TEXT NOT NULL,
  display_name TEXT,
  email TEXT,
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── HVS Records ───────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS hvs_records (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  sovereignty_status TEXT NOT NULL DEFAULT 'claimed'
    CHECK (sovereignty_status IN ('claimed', 'verified', 'contested', 'inactive')),
  estate_status TEXT NOT NULL DEFAULT 'active'
    CHECK (estate_status IN ('active', 'inactive', 'transferred', 'probate_pending')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_hvs_creator ON hvs_records(creator_id);

-- ── Voice Estates ─────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS voice_estates (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  hvs_id TEXT NOT NULL REFERENCES hvs_records(id),
  estate_status TEXT NOT NULL DEFAULT 'active'
    CHECK (estate_status IN ('active', 'inactive', 'transferred', 'probate_pending')),
  acoustic_fingerprint TEXT NOT NULL,
  voiceprints_json TEXT NOT NULL DEFAULT '[]',
  delegates_json TEXT NOT NULL DEFAULT '[]',
  heirs_json TEXT NOT NULL DEFAULT '[]',
  governance_json TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ve_creator ON voice_estates(creator_id);
CREATE INDEX IF NOT EXISTS idx_ve_hvs ON voice_estates(hvs_id);

-- ── Consent Records ───────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS consent_records (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL REFERENCES creators(id),
  hvs_id TEXT NOT NULL REFERENCES hvs_records(id),
  claimant_id TEXT NOT NULL,
  consent_status TEXT NOT NULL DEFAULT 'draft'
    CHECK (consent_status IN ('draft', 'pending_signature', 'active', 'expired', 'revoked', 'suspended', 'disputed')),
  usage_types_json TEXT NOT NULL DEFAULT '[]',
  authorized_tools_json TEXT NOT NULL DEFAULT '[]',
  term_start TEXT NOT NULL,
  term_end TEXT NOT NULL,
  auto_renew INTEGER NOT NULL DEFAULT 0,
  scope_json TEXT NOT NULL DEFAULT '{}',
  payment_terms_json TEXT NOT NULL DEFAULT '{}',
  provenance_required INTEGER NOT NULL DEFAULT 1,
  inheritance_rules_json TEXT NOT NULL DEFAULT '{}',
  dispute_status TEXT NOT NULL DEFAULT 'none'
    CHECK (dispute_status IN ('none', 'pending', 'under_review', 'resolved')),
  revoked_at TEXT,
  last_verified_at TEXT,
  signature_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cr_creator ON consent_records(creator_id);
CREATE INDEX IF NOT EXISTS idx_cr_claimant ON consent_records(claimant_id);
CREATE INDEX IF NOT EXISTS idx_cr_status ON consent_records(consent_status);
CREATE INDEX IF NOT EXISTS idx_cr_hvs ON consent_records(hvs_id);

-- ── Revocation Events ─────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS revocation_events (
  id TEXT PRIMARY KEY,
  consent_record_id TEXT NOT NULL REFERENCES consent_records(id),
  creator_id TEXT NOT NULL REFERENCES creators(id),
  reason TEXT NOT NULL,
  scope_json TEXT NOT NULL DEFAULT '{}',
  effective_at TEXT NOT NULL,
  enforced_at TEXT,
  enforcement_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (enforcement_status IN ('pending', 'in_progress', 'enforced', 'failed', 'sla_breach')),
  requested_by TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_rev_consent ON revocation_events(consent_record_id);
CREATE INDEX IF NOT EXISTS idx_rev_creator ON revocation_events(creator_id);

-- ── Tool Clearance Registry ───────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS tool_clearance_registry (
  tool_name TEXT PRIMARY KEY,
  clearance_status TEXT NOT NULL
    CHECK (clearance_status IN ('approved', 'restricted', 'blocked', 'pending_review')),
  allowed_usage_types_json TEXT NOT NULL DEFAULT '[]',
  commercial_status TEXT NOT NULL DEFAULT 'yes'
    CHECK (commercial_status IN ('yes', 'no', 'pending')),
  review_owner TEXT,
  reviewed_at TEXT,
  notes TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Seed tool clearance registry
INSERT OR IGNORE INTO tool_clearance_registry
  (tool_name, clearance_status, commercial_status, notes) VALUES
  ('XTTS_v2', 'approved', 'yes', 'Cleared for commercial synthesis'),
  ('RVC', 'approved', 'yes', 'Cleared for voice conversion'),
  ('Librosa', 'approved', 'yes', 'Cleared for acoustic analysis'),
  ('pedalboard', 'approved', 'yes', 'Cleared for audio effects'),
  ('MusicGen', 'pending_review', 'no', 'Non-commercial only — board review pending (Alex seat vacant)'),
  ('MaskGCT', 'pending_review', 'no', 'Non-commercial only — board review pending'),
  ('Tango2', 'pending_review', 'no', 'Non-commercial only — board review pending'),
  ('FishSpeech', 'pending_review', 'no', 'Non-commercial only — board review pending');

-- ── Usage Events ──────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS usage_events (
  id TEXT PRIMARY KEY,
  creator_id TEXT NOT NULL,
  consent_record_id TEXT REFERENCES consent_records(id),
  claimant_id TEXT NOT NULL,
  action_type TEXT NOT NULL,
  tool_name TEXT,
  model_version TEXT,
  output_asset_id TEXT,
  provenance_status TEXT NOT NULL DEFAULT 'missing'
    CHECK (provenance_status IN ('verified', 'missing', 'corrupted', 'mismatch', 'revoked_source', 'legacy_unverified')),
  decision TEXT NOT NULL CHECK (decision IN ('ALLOW', 'HOLD', 'DENY', 'ESCALATE')),
  reason_codes_json TEXT NOT NULL DEFAULT '[]',
  requested_at TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_ue_creator ON usage_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_ue_consent ON usage_events(consent_record_id);
CREATE INDEX IF NOT EXISTS idx_ue_decision ON usage_events(decision);

-- ── Royalty Events ────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS royalty_events (
  id TEXT PRIMARY KEY,
  usage_event_id TEXT NOT NULL REFERENCES usage_events(id),
  creator_id TEXT NOT NULL,
  gross_amount REAL NOT NULL,
  creator_amount REAL NOT NULL,
  platform_amount REAL NOT NULL,
  currency TEXT NOT NULL DEFAULT 'USD',
  payout_status TEXT NOT NULL DEFAULT 'pending'
    CHECK (payout_status IN ('pending', 'scheduled', 'paid', 'failed', 'held')),
  payout_due_at TEXT,
  paid_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_roy_creator ON royalty_events(creator_id);
CREATE INDEX IF NOT EXISTS idx_roy_status ON royalty_events(payout_status);

-- ── Provenance Records ────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS provenance_records (
  id TEXT PRIMARY KEY,
  output_asset_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  consent_record_id TEXT REFERENCES consent_records(id),
  manifest_ref TEXT,
  manifest_hash TEXT,
  provenance_status TEXT NOT NULL DEFAULT 'missing'
    CHECK (provenance_status IN ('verified', 'missing', 'corrupted', 'mismatch', 'revoked_source', 'legacy_unverified')),
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_prov_asset ON provenance_records(output_asset_id);
CREATE INDEX IF NOT EXISTS idx_prov_creator ON provenance_records(creator_id);

-- ── Audit Log ─────────────────────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS audit_log (
  id TEXT PRIMARY KEY,
  actor_type TEXT NOT NULL CHECK (actor_type IN ('creator', 'claimant', 'agent', 'admin', 'system')),
  actor_id TEXT NOT NULL,
  action TEXT NOT NULL,
  object_type TEXT NOT NULL,
  object_id TEXT NOT NULL,
  decision TEXT CHECK (decision IN ('ALLOW', 'HOLD', 'DENY', 'ESCALATE')),
  reason TEXT,
  reason_codes_json TEXT NOT NULL DEFAULT '[]',
  metadata_json TEXT NOT NULL DEFAULT '{}',
  prompt_version TEXT NOT NULL DEFAULT 'GABRIEL_EXECUTOR_v1.0',
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_object ON audit_log(object_id);
CREATE INDEX IF NOT EXISTS idx_audit_decision ON audit_log(decision);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);

-- ── SEED DATA ───────────────────────────────────────────────────────────────

-- RSP_001 — Founding Creator
INSERT OR IGNORE INTO creators (id, legal_name, display_name, email, status)
VALUES ('RSP_001', 'Robert Stephen Plowman', 'RSP', 'rsp@noizyfish.com', 'active');

INSERT OR IGNORE INTO hvs_records (id, creator_id, sovereignty_status, estate_status)
VALUES ('HVS_RSP_001', 'RSP_001', 'verified', 'active');

INSERT OR IGNORE INTO voice_estates (id, creator_id, hvs_id, estate_status, acoustic_fingerprint, governance_json)
VALUES (
  'VE_RSP_001',
  'RSP_001',
  'HVS_RSP_001',
  'active',
  'sha256:a9b8c7d6e5f4a3b2c1d0e9f8a7b6c5d4e3f2a1b0c9d8e7f6a5b4c3d2e1f0a9b8',
  '{"creator_primary_control": true, "delegate_control_enabled": false, "estate_transfer_enabled": true, "consent_required_for_commercial": true, "auto_renew_prohibited": false}'
);

-- T10 consent record — RSP_001 grants CLAIMANT_001 synthesis + derivative rights
INSERT OR IGNORE INTO consent_records (
  id, creator_id, hvs_id, claimant_id, consent_status,
  usage_types_json, authorized_tools_json,
  term_start, term_end, auto_renew,
  scope_json, payment_terms_json,
  provenance_required, dispute_status
) VALUES (
  'NCP_RSP_001_CLAIMANT_001',
  'RSP_001',
  'HVS_RSP_001',
  'CLAIMANT_001',
  'active',
  '["synthesis", "derivative"]',
  '["XTTS_v2", "RVC"]',
  '2026-03-01T00:00:00Z',
  '2030-03-25T00:00:00Z',
  0,
  '{"geographic": ["global"], "media": ["commercial", "non-commercial"], "channels": ["platform", "api"], "exclusions": ["political_speech", "deepfake_without_attribution"]}',
  '{"default_model": true, "creator_pct": 75, "platform_pct": 25, "override_applies": false, "currency": "USD", "payout_window_days": 7}',
  1,
  'none'
);

-- ── Consent Action Audit Log (append-only) ────────────────────────────────────
-- Written on every revoke, verify, and status-change event
-- Provides verifiable historical action lineage (doctrine: Revocation is sacred)

CREATE TABLE IF NOT EXISTS consent_audit_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  consent_id TEXT NOT NULL,
  creator_id TEXT NOT NULL,
  action TEXT NOT NULL CHECK (action IN ('revoke', 'verify', 'status_change', 'issue', 'expire')),
  actor_subject TEXT NOT NULL,
  actor_creator_id TEXT,
  actor_mode TEXT NOT NULL DEFAULT 'api-key' CHECK (actor_mode IN ('api-key', 'jwt', 'dev', 'system')),
  reason TEXT,
  result TEXT NOT NULL DEFAULT 'success',
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_cal_consent ON consent_audit_log(consent_id);
CREATE INDEX IF NOT EXISTS idx_cal_creator ON consent_audit_log(creator_id);
CREATE INDEX IF NOT EXISTS idx_cal_action  ON consent_audit_log(action);
CREATE INDEX IF NOT EXISTS idx_cal_created ON consent_audit_log(created_at);
