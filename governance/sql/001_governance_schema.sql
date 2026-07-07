-- ═══════════════════════════════════════════════════════════
-- NOIZY.AI GOVERNANCE — D1 Schema
-- 
-- Two classes of tables:
--   CONSTITUTIONAL: creator profiles, consent snapshots
--   OPERATIONAL: blessed sessions, decisions, audits
--
-- Gabriel only sees blessed truth.
-- Raw capture never touches these tables.
--
-- Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
-- ═══════════════════════════════════════════════════════════

-- ─── CONSTITUTIONAL TABLES ───────────────────────────────
-- These enforce the Creator Covenant at the data layer.
-- Modification requires 75% supermajority + 90-day comment period.

CREATE TABLE IF NOT EXISTS creator_profiles (
  actor_id          TEXT PRIMARY KEY,
  display_name      TEXT NOT NULL,
  legal_name        TEXT NOT NULL,
  
  -- Economic constitution
  creator_share     REAL NOT NULL DEFAULT 0.70 CHECK (creator_share >= 0.70),
  platform_share    REAL NOT NULL DEFAULT 0.25 CHECK (platform_share <= 0.30),
  community_share   REAL NOT NULL DEFAULT 0.03,
  legal_share       REAL NOT NULL DEFAULT 0.02,
  
  -- Voice sovereignty
  voice_consent_key TEXT,
  voice_ip_owner    INTEGER NOT NULL DEFAULT 1 CHECK (voice_ip_owner = 1),
  
  -- Status
  active            INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consent_snapshots (
  id                TEXT PRIMARY KEY,
  actor_id          TEXT NOT NULL REFERENCES creator_profiles(actor_id),
  consent_type      TEXT NOT NULL CHECK (consent_type IN (
    'voice_synthesis', 'music_distribution', 'data_processing',
    'family_vault_access', 'character_assignment', 'revenue_split'
  )),
  
  -- Consent state
  granted           INTEGER NOT NULL DEFAULT 0,
  granted_at        TEXT,
  revoked           INTEGER NOT NULL DEFAULT 0,
  revoked_at        TEXT,
  revocation_ms     INTEGER,  -- must be <= 60000
  
  -- Scope
  scope             TEXT NOT NULL,  -- JSON: what exactly is consented
  expires_at        TEXT,           -- NULL = no expiry
  
  -- Audit
  snapshot_hash     TEXT NOT NULL,  -- SHA-256 of consent document
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  
  CHECK (revocation_ms IS NULL OR revocation_ms <= 60000)
);

-- ─── OPERATIONAL TABLES ──────────────────────────────────
-- These store blessed artifacts. Nothing raw. Nothing unreviewed.

CREATE TABLE IF NOT EXISTS blessed_sessions (
  id                TEXT PRIMARY KEY,
  session_id        TEXT NOT NULL UNIQUE,
  actor_id          TEXT NOT NULL REFERENCES creator_profiles(actor_id),
  character_id      TEXT,
  
  -- Content
  content_hash      TEXT NOT NULL,
  content_path      TEXT NOT NULL,
  session_type      TEXT NOT NULL CHECK (session_type IN (
    'performance', 'direction', 'review', 'governance', 'technical'
  )),
  
  -- Blessing chain
  reviewed_by       TEXT NOT NULL,
  reviewed_at       TEXT NOT NULL,
  blessed_by        TEXT NOT NULL,
  blessed_at        TEXT NOT NULL,
  blessing_locked   INTEGER NOT NULL DEFAULT 1 CHECK (blessing_locked = 1),
  
  -- Session metrics
  total_events      INTEGER NOT NULL DEFAULT 0,
  total_takes       INTEGER NOT NULL DEFAULT 0,
  blessed_takes     INTEGER NOT NULL DEFAULT 0,
  duration_ms       INTEGER,
  
  -- Summary
  summary           TEXT,  -- Human-readable session summary
  
  -- Audit
  ingested_at       TEXT NOT NULL DEFAULT (datetime('now')),
  source_run_id     TEXT
);

CREATE TABLE IF NOT EXISTS blessed_decisions (
  id                TEXT PRIMARY KEY,
  decision_id       TEXT NOT NULL UNIQUE,
  
  -- Decision
  title             TEXT NOT NULL,
  category          TEXT NOT NULL,
  urgency           TEXT NOT NULL,
  
  -- Resolution
  raised_by         TEXT NOT NULL,
  raised_at         TEXT NOT NULL,
  decided_by        TEXT NOT NULL,
  decided_at        TEXT NOT NULL,
  decision          TEXT NOT NULL,
  rationale         TEXT NOT NULL,
  
  -- Options that were considered
  options_json      TEXT NOT NULL,  -- JSON array of DecisionOption
  
  -- Blessing
  blessed_by        TEXT NOT NULL,
  blessed_at        TEXT NOT NULL,
  blessing_locked   INTEGER NOT NULL DEFAULT 1 CHECK (blessing_locked = 1),
  
  -- Audit
  ingested_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS blessed_takes (
  id                TEXT PRIMARY KEY,
  take_id           TEXT NOT NULL UNIQUE,
  session_id        TEXT NOT NULL,
  actor_id          TEXT NOT NULL REFERENCES creator_profiles(actor_id),
  character_id      TEXT NOT NULL,
  
  -- Take content
  take_number       INTEGER NOT NULL,
  text              TEXT NOT NULL,
  audio_path        TEXT,
  audio_duration_ms INTEGER,
  improvised        INTEGER NOT NULL DEFAULT 0,
  
  -- Direction context
  direction_applied TEXT,
  direction_category TEXT,
  
  -- Quality
  in_character      INTEGER,
  intensity_match   REAL,
  
  -- Approval
  approved_by       TEXT NOT NULL,
  approved_at       TEXT NOT NULL,
  
  -- Blessing
  blessed_by        TEXT NOT NULL,
  blessed_at        TEXT NOT NULL,
  blessing_locked   INTEGER NOT NULL DEFAULT 1 CHECK (blessing_locked = 1),
  
  -- Voice sovereignty
  voice_ip_retained INTEGER NOT NULL DEFAULT 1 CHECK (voice_ip_retained = 1),
  
  -- Audit
  ingested_at       TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── AUDIT TABLE ─────────────────────────────────────────
-- Every promotion, blessing, and ingest is logged here.

CREATE TABLE IF NOT EXISTS governance_audit_log (
  id                TEXT PRIMARY KEY,
  record_id         TEXT NOT NULL,
  action            TEXT NOT NULL CHECK (action IN (
    'staged', 'promoted_to_review', 'blessed', 'rejected',
    'ingested_to_d1', 'decision_raised', 'decision_resolved'
  )),
  performed_by      TEXT NOT NULL,
  performed_at      TEXT NOT NULL DEFAULT (datetime('now')),
  details           TEXT,  -- JSON with action-specific details
  content_hash      TEXT   -- Integrity snapshot at time of action
);

-- ─── INDEXES ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_consent_actor ON consent_snapshots(actor_id);
CREATE INDEX IF NOT EXISTS idx_consent_type ON consent_snapshots(consent_type);
CREATE INDEX IF NOT EXISTS idx_blessed_sessions_actor ON blessed_sessions(actor_id);
CREATE INDEX IF NOT EXISTS idx_blessed_takes_session ON blessed_takes(session_id);
CREATE INDEX IF NOT EXISTS idx_blessed_takes_actor ON blessed_takes(actor_id);
CREATE INDEX IF NOT EXISTS idx_audit_record ON governance_audit_log(record_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON governance_audit_log(action);

-- ─── SEED: RSP_001 ──────────────────────────────────────

INSERT OR IGNORE INTO creator_profiles (
  actor_id, display_name, legal_name,
  creator_share, platform_share, community_share, legal_share,
  voice_ip_owner
) VALUES (
  'RSP_001', 'RSP', 'Robert Stephen Plowman',
  0.85, 0.10, 0.03, 0.02,
  1
);

-- ═══════════════════════════════════════════════════════════
-- Capture writes files.
-- Humans bless memory.
-- Gabriel only sees blessed truth.
-- ═══════════════════════════════════════════════════════════
