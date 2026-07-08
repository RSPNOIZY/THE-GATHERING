-- ═══════════════════════════════════════════════════════════════════════════
-- HEAVEN D1 MIGRATION — aquarium-archive (DB_AQUARIUM)
-- Binding: DB_AQUARIUM  |  DB: aquarium-archive  |  ID: 01212e89-5422-4e45-a03a-f0a54495674e
--
-- Run via:
--   npx wrangler d1 execute aquarium-archive --file=db/migrations/0002_aquarium.sql --remote
--
-- The Aquarium is the healing/therapeutic audio catalog inside NOIZYFISH.
-- Tracks are referenced by healing_sessions.noizyfish_track_id in agent-memory.
-- ═══════════════════════════════════════════════════════════════════════════

PRAGMA journal_mode = WAL;
PRAGMA foreign_keys = ON;

-- ── 1. TRACKS — therapeutic audio catalog ────────────────────────────────
CREATE TABLE IF NOT EXISTS tracks (
  id              TEXT    PRIMARY KEY,              -- UUID (referenced by healing_sessions)
  title           TEXT    NOT NULL,
  artist_id       TEXT    NOT NULL,                 -- member UUID from agent-memory
  genre           TEXT    NOT NULL DEFAULT 'ambient',
  frequency_hz    REAL,                             -- primary healing frequency (432, 528, etc.)
  duration_seconds REAL   NOT NULL,
  bpm             REAL,
  tags            TEXT    NOT NULL DEFAULT '[]',    -- JSON array e.g. ["grief","sleep","432hz"]
  file_ref        TEXT    NOT NULL,                 -- local path on M2 Ultra
  c2pa_stamp      TEXT    NOT NULL UNIQUE,          -- c2pa:noizyfish:<id>:<ts>
  hvs_split       TEXT    NOT NULL DEFAULT '75/25', -- locked at protocol level
  play_count      INTEGER NOT NULL DEFAULT 0,
  status          TEXT    NOT NULL DEFAULT 'active',-- 'active' | 'archived' | 'draft'
  published_at    TEXT,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_track_artist    ON tracks (artist_id);
CREATE INDEX IF NOT EXISTS idx_track_genre     ON tracks (genre);
CREATE INDEX IF NOT EXISTS idx_track_freq      ON tracks (frequency_hz);
CREATE INDEX IF NOT EXISTS idx_track_status    ON tracks (status);
CREATE INDEX IF NOT EXISTS idx_track_tags      ON tracks (tags); -- partial text search

-- ── 2. PLAYLISTS — curated healing sequences ─────────────────────────────
CREATE TABLE IF NOT EXISTS playlists (
  id              TEXT    PRIMARY KEY,
  title           TEXT    NOT NULL,
  curator_id      TEXT    NOT NULL,                 -- member UUID
  protocol_type   TEXT    NOT NULL,                 -- 'grief' | 'sleep' | 'anxiety' | 'celebration'
  description     TEXT,
  track_ids       TEXT    NOT NULL DEFAULT '[]',    -- JSON ordered array of track UUIDs
  is_public       INTEGER NOT NULL DEFAULT 0,
  play_count      INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT    NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_playlist_curator ON playlists (curator_id);
CREATE INDEX IF NOT EXISTS idx_playlist_proto   ON playlists (protocol_type);
CREATE INDEX IF NOT EXISTS idx_playlist_public  ON playlists (is_public) WHERE is_public = 1;

-- ── 3. ROYALTIES — per-stream earnings ledger ────────────────────────────
-- Mirrors KV_ROYALTIES but provides durable queryable history.
CREATE TABLE IF NOT EXISTS aquarium_royalties (
  id              TEXT    PRIMARY KEY,
  track_id        TEXT    NOT NULL REFERENCES tracks(id),
  artist_id       TEXT    NOT NULL,
  listener_id     TEXT,                             -- member UUID or null (anonymous)
  amount_cents    INTEGER NOT NULL DEFAULT 0,
  hvs_split       TEXT    NOT NULL DEFAULT '75/25',
  source          TEXT    NOT NULL DEFAULT 'stream',-- 'stream' | 'sync' | 'license'
  period_start    TEXT    NOT NULL,
  period_end      TEXT    NOT NULL,
  paid_out        INTEGER NOT NULL DEFAULT 0,       -- 1 = disbursed
  created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_aquarium_royalty_track    ON aquarium_royalties (track_id);
CREATE INDEX IF NOT EXISTS idx_aquarium_royalty_artist   ON aquarium_royalties (artist_id);
CREATE INDEX IF NOT EXISTS idx_aquarium_royalty_unpaid   ON aquarium_royalties (paid_out) WHERE paid_out = 0;

-- ── 4. CATALOG EVENTS — gabriel mirror for aquarium ──────────────────────
-- Lightweight event log scoped to aquarium actions (play, skip, rate).
-- Full constitutional audit stays in agent-memory.gabriel_log.
CREATE TABLE IF NOT EXISTS catalog_events (
  id              TEXT    PRIMARY KEY,
  event_type      TEXT    NOT NULL,   -- 'PLAY' | 'SKIP' | 'RATE' | 'PUBLISH' | 'ARCHIVE'
  track_id        TEXT    REFERENCES tracks(id),
  actor_id        TEXT,               -- member UUID
  payload         TEXT    NOT NULL DEFAULT '{}',
  logged_at       TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_catalog_event_track ON catalog_events (track_id);
CREATE INDEX IF NOT EXISTS idx_catalog_event_type  ON catalog_events (event_type);
CREATE INDEX IF NOT EXISTS idx_catalog_event_time  ON catalog_events (logged_at DESC);
