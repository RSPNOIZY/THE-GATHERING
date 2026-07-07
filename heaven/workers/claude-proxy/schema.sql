-- HEAVEN Worker — D1 Schema Extension
-- Run against existing gabriel-db (DO NOT create new D1)
-- wrangler d1 execute gabriel-db --file=schema.sql
-- Account: 2446d788cc4280f5ea22a9948410c355

-- Extends existing gabriel-db (13 tables already seeded)
-- Only adds HEAVEN-specific tables not in gabriel-db

-- ── Request log (Worker inference calls) ──────────────────────
CREATE TABLE IF NOT EXISTS heaven_request_log (
  id          TEXT    PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  tower       TEXT    NOT NULL CHECK(tower IN ('max','code','work')),
  model       TEXT    NOT NULL,
  actor_id    TEXT,
  msg_preview TEXT,
  source      TEXT    DEFAULT 'dashboard',
  latency_ms  INTEGER,
  tokens_in   INTEGER,
  tokens_out  INTEGER,
  ts          TEXT    NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_heaven_req_tower ON heaven_request_log(tower);
CREATE INDEX IF NOT EXISTS idx_heaven_req_ts    ON heaven_request_log(ts);

-- ── Voice transcript log ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS heaven_voice_log (
  id          TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  source      TEXT NOT NULL,
  transcript  TEXT NOT NULL,
  tower       TEXT NOT NULL,
  duration_s  REAL,
  pipeline_ms INTEGER,
  ts          TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Crew broadcast log ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS heaven_crew_log (
  id      TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
  from_id TEXT NOT NULL,
  message TEXT NOT NULL,
  ts      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Tool clearance seed (if not already in gabriel-db) ────────
INSERT OR IGNORE INTO tool_clearance_registry
  (id, tool_name, clearance_status, allowed_usage_types_json, commercial_status, review_owner, reviewed_at, notes)
VALUES
  ('TCR_005','Whisper',    'approved','["analysis"]',               'commercial_ok','RSP_001','2026-03-27','STT — voice pipeline only'),
  ('TCR_006','mlx-whisper','approved','["analysis"]',               'commercial_ok','RSP_001','2026-03-27','Apple Silicon optimized STT'),
  ('TCR_007','Gemma3',     'approved','["analysis","synthesis"]',   'commercial_ok','RSP_001','2026-03-27','Local inference via Ollama — GOD.local'),
  ('TCR_008','Mistral',    'approved','["analysis"]',               'commercial_ok','RSP_001','2026-03-27','Local inference via Ollama — GOD.local');
