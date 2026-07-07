-- ═══════════════════════════════════════════════════════════
-- NOIZY.AI GOVERNANCE — Migration 003
-- Voice Capture + Gini Monitor + Creator Onboarding + Royalty Ledger
-- 
-- Applied: 2026-04-02
-- Database: agent-memory (7b813205-fd12-4a23-84a6-ce83bc49ec70)
-- 
-- Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
-- ═══════════════════════════════════════════════════════════

-- ─── GINI SNAPSHOTS ──────────────────────────────────────
-- Constitutional inequality monitoring.
-- Target: 0.35 | Warning: 0.37 | DAO Intervention: 0.40

CREATE TABLE IF NOT EXISTS gini_snapshots (
  id                TEXT PRIMARY KEY,
  measured_at       TEXT NOT NULL DEFAULT (datetime('now')),
  gini_coefficient  REAL NOT NULL CHECK (gini_coefficient >= 0 AND gini_coefficient <= 1),
  brand_gini_json   TEXT,
  total_creators    INTEGER NOT NULL DEFAULT 0,
  total_earnings    REAL NOT NULL DEFAULT 0,
  median_earnings   REAL NOT NULL DEFAULT 0,
  mean_earnings     REAL NOT NULL DEFAULT 0,
  top_10_pct_share  REAL NOT NULL DEFAULT 0 CHECK (top_10_pct_share >= 0 AND top_10_pct_share <= 1),
  bottom_50_pct_share REAL NOT NULL DEFAULT 0 CHECK (bottom_50_pct_share >= 0 AND bottom_50_pct_share <= 1),
  within_target     INTEGER NOT NULL DEFAULT 1,
  within_warning    INTEGER NOT NULL DEFAULT 1,
  dao_intervention  INTEGER NOT NULL DEFAULT 0,
  previous_gini     REAL,
  trend             TEXT CHECK (trend IS NULL OR trend IN ('improving', 'stable', 'worsening')),
  gabriel_ingested  INTEGER NOT NULL DEFAULT 0
);

-- ─── VOICE CAPTURE SESSIONS ──────────────────────────────
-- Recording session management tied to Actor Protocol.

CREATE TABLE IF NOT EXISTS voice_capture_sessions (
  session_id        TEXT PRIMARY KEY,
  session_name      TEXT NOT NULL,
  session_number    INTEGER NOT NULL,
  actor_id          TEXT NOT NULL REFERENCES creator_profiles(actor_id),
  character_id      TEXT NOT NULL,
  planned_takes     INTEGER NOT NULL,
  total_takes       INTEGER NOT NULL DEFAULT 0,
  approved_takes    INTEGER NOT NULL DEFAULT 0,
  rejected_takes    INTEGER NOT NULL DEFAULT 0,
  total_duration_ms INTEGER NOT NULL DEFAULT 0,
  recording_format  TEXT NOT NULL DEFAULT 'wav/48000/24/mono',
  recording_device  TEXT NOT NULL DEFAULT 'GOD M2 Ultra',
  recording_env     TEXT NOT NULL DEFAULT 'Home Studio — Ottawa',
  status            TEXT NOT NULL DEFAULT 'planning' CHECK (status IN ('planning','active','paused','completed','archived')),
  voice_ip_owner    INTEGER NOT NULL DEFAULT 1 CHECK (voice_ip_owner = 1),
  consent_confirmed INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  started_at        TEXT,
  completed_at      TEXT,
  blessed           INTEGER NOT NULL DEFAULT 0,
  blessed_by        TEXT,
  gabriel_ingested  INTEGER NOT NULL DEFAULT 0
);

-- ─── VOICE TAKES ─────────────────────────────────────────
-- Individual voice recordings within a session.

CREATE TABLE IF NOT EXISTS voice_takes (
  take_id           TEXT PRIMARY KEY,
  take_number       INTEGER NOT NULL,
  session_id        TEXT NOT NULL REFERENCES voice_capture_sessions(session_id),
  actor_id          TEXT NOT NULL REFERENCES creator_profiles(actor_id),
  character_id      TEXT NOT NULL,
  script_line       TEXT NOT NULL,
  direction_notes   TEXT,
  performance_mode  TEXT NOT NULL CHECK (performance_mode IN ('CHARACTER','ACTOR','DIRECTION_INTAKE','RENDER_PREVIEW','LOCKED_TAKE')),
  intensity         REAL NOT NULL DEFAULT 0.5 CHECK (intensity >= 0 AND intensity <= 1),
  energy_band       TEXT NOT NULL DEFAULT 'conversational' CHECK (energy_band IN ('whisper','conversational','performance','full_power')),
  improvised        INTEGER NOT NULL DEFAULT 0,
  audio_file        TEXT,
  audio_duration_ms INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'captured' CHECK (status IN ('recording','captured','reviewed','approved','rejected','blessed')),
  quality_score     REAL CHECK (quality_score IS NULL OR (quality_score >= 0 AND quality_score <= 1)),
  in_character      INTEGER,
  notes             TEXT,
  voice_ip_retained INTEGER NOT NULL DEFAULT 1 CHECK (voice_ip_retained = 1),
  consent_confirmed INTEGER NOT NULL DEFAULT 1,
  started_at        TEXT NOT NULL,
  completed_at      TEXT,
  blessed           INTEGER NOT NULL DEFAULT 0,
  blessed_by        TEXT,
  blessed_at        TEXT,
  gabriel_ingested  INTEGER NOT NULL DEFAULT 0
);

-- ─── CREATOR ONBOARDING ──────────────────────────────────
-- Ottawa-first onboarding pipeline.

CREATE TABLE IF NOT EXISTS creator_onboarding (
  id                TEXT PRIMARY KEY,
  actor_id          TEXT NOT NULL REFERENCES creator_profiles(actor_id),
  onboarding_type   TEXT NOT NULL CHECK (onboarding_type IN ('creator','student','teacher','agency','community_leader')),
  region            TEXT NOT NULL DEFAULT 'ottawa',
  city              TEXT NOT NULL DEFAULT 'Ottawa',
  country           TEXT NOT NULL DEFAULT 'CA',
  brand             TEXT NOT NULL CHECK (brand IN ('NOIZYVOX','NOIZYFISH','NOIZYKIDZ','NOIZYLAB','myFAMILY_AI','WISDOM_PROJECT')),
  referral_source   TEXT,
  institution       TEXT,
  consent_completed INTEGER NOT NULL DEFAULT 0,
  voice_registered  INTEGER NOT NULL DEFAULT 0,
  first_take_at     TEXT,
  teaching_eligible INTEGER NOT NULL DEFAULT 0,
  status            TEXT NOT NULL DEFAULT 'invited' CHECK (status IN ('invited','registered','active','paused','graduated','archived')),
  invited_at        TEXT NOT NULL DEFAULT (datetime('now')),
  registered_at     TEXT,
  activated_at      TEXT,
  creator_share     REAL NOT NULL DEFAULT 0.70 CHECK (creator_share >= 0.70),
  gabriel_ingested  INTEGER NOT NULL DEFAULT 0
);

-- ─── 100-YEAR IMMUTABLE ROYALTY LEDGER ───────────────────
-- SHA-256 chained. Append-only. Tamper-evident.
-- Every cent, from now until 2126, is provable.

CREATE TABLE IF NOT EXISTS royalty_ledger (
  entry_id          TEXT PRIMARY KEY,
  sequence_number   INTEGER NOT NULL UNIQUE,
  previous_hash     TEXT NOT NULL CHECK (length(previous_hash) = 64),
  entry_hash        TEXT NOT NULL CHECK (length(entry_hash) = 64),
  event_type        TEXT NOT NULL CHECK (event_type IN (
    'playback_earning', 'teaching_royalty', 'collaboration_split',
    'voice_licensing_fee', 'character_licensing_fee', 'community_pool_dist',
    'descendant_inheritance', 'estate_transfer', 'correction',
    'platform_fee', 'legal_reserve'
  )),
  from_actor_id     TEXT,
  to_actor_id       TEXT NOT NULL,
  amount            REAL NOT NULL CHECK (amount >= 0),
  currency          TEXT NOT NULL DEFAULT 'USD',
  source_stream_id  TEXT,
  source_session_id TEXT,
  creator_share_at_time REAL NOT NULL CHECK (creator_share_at_time >= 0.70),
  platform_share_at_time REAL NOT NULL CHECK (platform_share_at_time <= 0.25),
  is_teaching_royalty INTEGER NOT NULL DEFAULT 0,
  teacher_id        TEXT,
  student_id        TEXT,
  generation        INTEGER NOT NULL DEFAULT 0 CHECK (generation >= 0),
  estate_id         TEXT,
  beneficiary_relationship TEXT,
  corrects_entry_id TEXT,
  correction_reason TEXT,
  earned_at         TEXT NOT NULL,
  recorded_at       TEXT NOT NULL DEFAULT (datetime('now')),
  blessed           INTEGER NOT NULL DEFAULT 0,
  blessed_by        TEXT,
  gabriel_ingested  INTEGER NOT NULL DEFAULT 0
);

-- ─── INDEXES ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_gini_date ON gini_snapshots(measured_at);
CREATE INDEX IF NOT EXISTS idx_capture_sessions_actor ON voice_capture_sessions(actor_id);
CREATE INDEX IF NOT EXISTS idx_voice_takes_session ON voice_takes(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_takes_actor ON voice_takes(actor_id);
CREATE INDEX IF NOT EXISTS idx_onboarding_region ON creator_onboarding(region);
CREATE INDEX IF NOT EXISTS idx_onboarding_brand ON creator_onboarding(brand);
CREATE INDEX IF NOT EXISTS idx_onboarding_status ON creator_onboarding(status);
CREATE INDEX IF NOT EXISTS idx_onboarding_type ON creator_onboarding(onboarding_type);
CREATE INDEX IF NOT EXISTS idx_royalty_to_actor ON royalty_ledger(to_actor_id);
CREATE INDEX IF NOT EXISTS idx_royalty_from_actor ON royalty_ledger(from_actor_id);
CREATE INDEX IF NOT EXISTS idx_royalty_event_type ON royalty_ledger(event_type);
CREATE INDEX IF NOT EXISTS idx_royalty_sequence ON royalty_ledger(sequence_number);
CREATE INDEX IF NOT EXISTS idx_royalty_estate ON royalty_ledger(estate_id);
CREATE INDEX IF NOT EXISTS idx_royalty_generation ON royalty_ledger(generation);
CREATE INDEX IF NOT EXISTS idx_royalty_earned_at ON royalty_ledger(earned_at);

-- ═══════════════════════════════════════════════════════════
-- One hundred years from now, the royalties still flow.
-- That's not a feature. That's a promise to the future.
-- ═══════════════════════════════════════════════════════════
