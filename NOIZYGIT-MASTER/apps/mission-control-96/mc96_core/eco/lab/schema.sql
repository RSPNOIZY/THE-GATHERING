-- NOIZYLAB DevOps schema (D1)
-- Run: wrangler d1 execute noizylab-db --file=schema.sql

CREATE TABLE IF NOT EXISTS deploys (
  id TEXT PRIMARY KEY,
  service TEXT NOT NULL,
  environment TEXT NOT NULL DEFAULT 'staging',
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK(status IN ('pending', 'deploying', 'deployed', 'failed', 'rolled_back')),
  commit_sha TEXT NOT NULL,
  actor TEXT NOT NULL,
  started_at TEXT NOT NULL,
  finished_at TEXT,
  notes TEXT DEFAULT ''
);

CREATE TABLE IF NOT EXISTS health_snapshots (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp TEXT NOT NULL,
  services_json TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_deploys_service ON deploys(service);
CREATE INDEX IF NOT EXISTS idx_deploys_started ON deploys(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_health_timestamp ON health_snapshots(timestamp DESC);
