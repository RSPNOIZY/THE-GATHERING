-- Heaven D1 Schema
-- Run: wrangler d1 execute heaven-db --file=./schema.sql

CREATE TABLE IF NOT EXISTS dispatches (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  agent         TEXT NOT NULL,
  signal        TEXT NOT NULL,
  payload       TEXT DEFAULT '{}',
  dispatched_by TEXT NOT NULL,
  dispatched_at TEXT NOT NULL,
  result        TEXT,
  completed_at  TEXT
);

CREATE TABLE IF NOT EXISTS messages (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  identity   TEXT NOT NULL,
  role       TEXT NOT NULL,
  content    TEXT NOT NULL,
  session_id TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS sessions (
  id         TEXT PRIMARY KEY,
  identity   TEXT NOT NULL,
  title      TEXT,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_dispatches_agent ON dispatches(agent);
CREATE INDEX IF NOT EXISTS idx_messages_identity ON messages(identity);
CREATE INDEX IF NOT EXISTS idx_sessions_identity ON sessions(identity);
