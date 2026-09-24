-- HooksHQ webhook logging schema (D1)
-- Run: wrangler d1 execute noizyai-db --file=schema.sql

CREATE TABLE IF NOT EXISTS webhook_logs (
  id TEXT PRIMARY KEY,
  source TEXT NOT NULL,
  intent TEXT NOT NULL,
  status TEXT NOT NULL CHECK(status IN ('received', 'forwarded', 'failed')),
  payload_hash TEXT NOT NULL,
  response_code INTEGER,
  created_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_logs_source ON webhook_logs(source);
CREATE INDEX IF NOT EXISTS idx_logs_intent ON webhook_logs(intent);
CREATE INDEX IF NOT EXISTS idx_logs_created ON webhook_logs(created_at DESC);
