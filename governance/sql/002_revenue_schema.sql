-- ═══════════════════════════════════════════════════════════
-- NOIZY.AI GOVERNANCE — Revenue & Playback D1 Schema
-- 
-- Every second monetized. Every split immutable at creation.
-- Teacher royalty + student credit. Collaboration auto-split.
-- 
-- Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber
-- ═══════════════════════════════════════════════════════════

-- ─── REVENUE STREAMS ─────────────────────────────────────
-- Immutable once created. The split is locked at birth.

CREATE TABLE IF NOT EXISTS revenue_streams (
  stream_id         TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL,
  stream_type       TEXT NOT NULL CHECK (stream_type IN (
    'teaching', 'mentorship', 'solo_performance',
    'collaboration_remix', 'cross_actor', 'student_project',
    'community_pool', 'licensing'
  )),
  
  -- Constitutional totals
  total_creator_share   REAL NOT NULL CHECK (total_creator_share >= 70),
  platform_share        REAL NOT NULL CHECK (platform_share <= 25),
  community_share       REAL NOT NULL DEFAULT 3,
  legal_share           REAL NOT NULL DEFAULT 2,
  
  -- Teaching relationship (NULL if not teaching/mentorship)
  teacher_id            TEXT REFERENCES creator_profiles(actor_id),
  student_id            TEXT REFERENCES creator_profiles(actor_id),
  teacher_royalty_pct   REAL CHECK (teacher_royalty_pct IS NULL OR teacher_royalty_pct <= 50),
  
  -- Collaboration metadata (JSON)
  collaboration_json    TEXT,  -- voice_contributors, music_contributors, split_method
  voice_count           INTEGER NOT NULL DEFAULT 1,
  
  -- Immutability
  locked                INTEGER NOT NULL DEFAULT 1 CHECK (locked = 1),
  created_at            TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Blessing
  blessed               INTEGER NOT NULL DEFAULT 0,
  blessed_by            TEXT,
  blessed_at            TEXT,
  
  -- Constitutional constraint: shares must sum to 100
  CHECK (
    ABS(total_creator_share + platform_share + community_share + legal_share - 100) < 0.01
  )
);

-- ─── REVENUE STREAM PARTICIPANTS ─────────────────────────
-- Who gets what. Locked at stream creation.

CREATE TABLE IF NOT EXISTS revenue_participants (
  id                TEXT PRIMARY KEY,
  stream_id         TEXT NOT NULL REFERENCES revenue_streams(stream_id),
  actor_id          TEXT NOT NULL,
  role              TEXT NOT NULL CHECK (role IN (
    'voice_owner', 'music_creator', 'actor_performer',
    'teacher', 'student', 'remixer', 'producer',
    'platform', 'community', 'legal'
  )),
  share_percent     REAL NOT NULL CHECK (share_percent >= 0 AND share_percent <= 100),
  
  -- Consent
  consent_granted   INTEGER NOT NULL DEFAULT 0,
  consent_key       TEXT,
  consent_at        TEXT,
  
  -- Voice contribution
  voice_contributed INTEGER NOT NULL DEFAULT 0,
  voice_asset_id    TEXT,
  
  -- Teaching flags
  is_teacher        INTEGER NOT NULL DEFAULT 0,
  is_student        INTEGER NOT NULL DEFAULT 0,
  teacher_royalty_pct REAL,
  
  -- Immutability
  created_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── PLAYBACK SESSIONS ───────────────────────────────────
-- Real-time monetization. Every second counts.

CREATE TABLE IF NOT EXISTS playback_sessions (
  session_id        TEXT PRIMARY KEY,
  project_id        TEXT NOT NULL,
  stream_id         TEXT NOT NULL REFERENCES revenue_streams(stream_id),
  
  -- Who's playing
  creator_voices    TEXT NOT NULL,  -- JSON array of actor IDs
  voice_count       INTEGER NOT NULL CHECK (voice_count >= 1),
  
  -- Timing
  start_time        TEXT NOT NULL,
  end_time          TEXT,
  duration_seconds  INTEGER NOT NULL DEFAULT 0 CHECK (duration_seconds >= 0),
  
  -- Monetization math
  rate_per_second       REAL NOT NULL CHECK (rate_per_second >= 0),
  collaboration_adj     REAL NOT NULL DEFAULT 1.0 CHECK (
    collaboration_adj >= 0 AND collaboration_adj <= 1
  ),
  
  -- Computed earnings
  total_earned      REAL NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  earnings_json     TEXT,  -- JSON: { "RSP_001": 0.45, "STU_001": 0.30, ... }
  
  -- Status
  status            TEXT NOT NULL DEFAULT 'active' CHECK (status IN (
    'active', 'completed', 'disputed', 'voided'
  )),
  
  -- Audit
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  completed_at      TEXT
);

-- ─── EARNINGS LEDGER ─────────────────────────────────────
-- Every payout line item. Append-only. Immutable.

CREATE TABLE IF NOT EXISTS earnings_ledger (
  id                TEXT PRIMARY KEY,
  playback_session_id TEXT NOT NULL REFERENCES playback_sessions(session_id),
  actor_id          TEXT NOT NULL,
  role              TEXT NOT NULL,
  earned            REAL NOT NULL CHECK (earned >= 0),
  share_percent     REAL NOT NULL,
  
  -- Teacher royalty tracking
  is_teacher_royalty  INTEGER NOT NULL DEFAULT 0,
  teacher_royalty_from TEXT,  -- student actor_id if this is a teacher royalty
  
  -- Immutable
  created_at        TEXT NOT NULL DEFAULT (datetime('now')),
  
  -- Constraint: earnings ledger is append-only, never updated
  CHECK (earned >= 0)
);

-- ─── CREATOR BALANCE ─────────────────────────────────────
-- Running balance per creator. Updated on each playback completion.

CREATE TABLE IF NOT EXISTS creator_balances (
  actor_id          TEXT PRIMARY KEY REFERENCES creator_profiles(actor_id),
  total_earned      REAL NOT NULL DEFAULT 0 CHECK (total_earned >= 0),
  total_paid_out    REAL NOT NULL DEFAULT 0 CHECK (total_paid_out >= 0),
  balance           REAL NOT NULL DEFAULT 0,
  
  -- Breakdown
  earned_as_voice_owner   REAL NOT NULL DEFAULT 0,
  earned_as_teacher       REAL NOT NULL DEFAULT 0,
  earned_as_student       REAL NOT NULL DEFAULT 0,
  earned_as_collaborator  REAL NOT NULL DEFAULT 0,
  earned_as_performer     REAL NOT NULL DEFAULT 0,
  
  -- Stats
  total_playback_seconds  INTEGER NOT NULL DEFAULT 0,
  total_sessions          INTEGER NOT NULL DEFAULT 0,
  
  last_earning_at   TEXT,
  updated_at        TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ─── INDEXES ─────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_revenue_project ON revenue_streams(project_id);
CREATE INDEX IF NOT EXISTS idx_revenue_type ON revenue_streams(stream_type);
CREATE INDEX IF NOT EXISTS idx_revenue_teacher ON revenue_streams(teacher_id);
CREATE INDEX IF NOT EXISTS idx_participants_stream ON revenue_participants(stream_id);
CREATE INDEX IF NOT EXISTS idx_participants_actor ON revenue_participants(actor_id);
CREATE INDEX IF NOT EXISTS idx_playback_stream ON playback_sessions(stream_id);
CREATE INDEX IF NOT EXISTS idx_playback_status ON playback_sessions(status);
CREATE INDEX IF NOT EXISTS idx_ledger_session ON earnings_ledger(playback_session_id);
CREATE INDEX IF NOT EXISTS idx_ledger_actor ON earnings_ledger(actor_id);

-- ─── SEED: RSP_001 BALANCE ──────────────────────────────

INSERT OR IGNORE INTO creator_balances (
  actor_id, total_earned, total_paid_out, balance
) VALUES (
  'RSP_001', 0, 0, 0
);

-- ═══════════════════════════════════════════════════════════
-- Rate per second × duration ÷ voice count × collaboration adjustment.
-- Teacher royalty flows from student share. Student always keeps majority.
-- Rounding correction biased toward the creator. Always.
-- ═══════════════════════════════════════════════════════════
