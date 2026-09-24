-- Fish Music Inc catalogue schema (D1)
-- Run: wrangler d1 execute fishmusicinc-db --file=schema.sql

CREATE TABLE IF NOT EXISTS catalogue (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  artist TEXT NOT NULL,
  album TEXT DEFAULT '',
  duration_ms INTEGER DEFAULT 0,
  fingerprint_hash TEXT DEFAULT '',
  c2pa_stamp TEXT,
  status TEXT DEFAULT 'active' CHECK(status IN ('active', 'archived')),
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_catalogue_artist ON catalogue(artist);
CREATE INDEX IF NOT EXISTS idx_catalogue_status ON catalogue(status);
CREATE INDEX IF NOT EXISTS idx_catalogue_created ON catalogue(created_at DESC);
