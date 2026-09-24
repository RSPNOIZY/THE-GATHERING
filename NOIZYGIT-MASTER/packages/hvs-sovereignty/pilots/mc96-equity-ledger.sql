PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS artists (
  artist_id TEXT PRIMARY KEY,
  display_name TEXT NOT NULL,
  profile_id TEXT UNIQUE,
  tier TEXT NOT NULL CHECK (tier IN ('founding_actor', 'standard_actor')),
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS consent_tokens (
  token_id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL REFERENCES artists(artist_id) ON DELETE CASCADE,
  scope TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'revoked', 'expired')),
  issued_at TEXT NOT NULL,
  expires_at TEXT,
  revoked_at TEXT,
  revocation_reason TEXT,
  token_hash TEXT NOT NULL CHECK (token_hash LIKE 'sha256:%')
);

CREATE TABLE IF NOT EXISTS works (
  work_id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  work_type TEXT NOT NULL CHECK (work_type IN ('audio', 'video', 'voice', 'stem', 'composition')),
  c2pa_manifest_id TEXT,
  asset_hash TEXT CHECK (asset_hash IS NULL OR asset_hash LIKE 'sha256:%'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS royalty_splits (
  split_id TEXT PRIMARY KEY,
  work_id TEXT NOT NULL REFERENCES works(work_id) ON DELETE CASCADE,
  artist_id TEXT NOT NULL REFERENCES artists(artist_id) ON DELETE CASCADE,
  creator_share_bps INTEGER NOT NULL CHECK (creator_share_bps BETWEEN 7500 AND 10000),
  platform_share_bps INTEGER NOT NULL CHECK (platform_share_bps BETWEEN 0 AND 2500),
  effective_from TEXT NOT NULL,
  effective_to TEXT,
  CHECK (creator_share_bps + platform_share_bps = 10000)
);

CREATE TABLE IF NOT EXISTS ledger_events (
  event_id TEXT PRIMARY KEY,
  correlation_id TEXT NOT NULL,
  event_type TEXT NOT NULL,
  artist_id TEXT REFERENCES artists(artist_id),
  work_id TEXT REFERENCES works(work_id),
  amount_cents INTEGER CHECK (amount_cents IS NULL OR amount_cents >= 0),
  currency TEXT CHECK (currency IS NULL OR length(currency) = 3),
  receipt_hash TEXT NOT NULL CHECK (receipt_hash LIKE 'sha256:%'),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  UNIQUE (correlation_id, event_type)
);

CREATE INDEX IF NOT EXISTS idx_consent_tokens_artist_status
  ON consent_tokens (artist_id, status);

CREATE INDEX IF NOT EXISTS idx_royalty_splits_work
  ON royalty_splits (work_id);

CREATE INDEX IF NOT EXISTS idx_ledger_events_correlation
  ON ledger_events (correlation_id);

INSERT OR IGNORE INTO artists (
  artist_id,
  display_name,
  profile_id,
  tier,
  country
) VALUES (
  'RSP_001',
  'Robert Stephen Plowman',
  'RSP001',
  'founding_actor',
  'Canada'
);
