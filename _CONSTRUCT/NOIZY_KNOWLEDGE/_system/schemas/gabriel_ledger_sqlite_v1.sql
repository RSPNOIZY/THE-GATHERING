PRAGMA journal_mode=WAL;
PRAGMA foreign_keys=ON;

CREATE TABLE IF NOT EXISTS files (
  file_id TEXT PRIMARY KEY,
  current_path TEXT NOT NULL UNIQUE,
  original_path TEXT,
  volume_name TEXT,
  size_bytes INTEGER,
  modified_at TEXT,
  md5 TEXT,
  sha256 TEXT,
  status TEXT NOT NULL DEFAULT 'UNMANAGED',
  first_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  last_seen_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS jobs (
  job_id TEXT PRIMARY KEY,
  job_type TEXT NOT NULL,
  target_path TEXT,
  risk_level TEXT NOT NULL DEFAULT 'READ_ONLY',
  status TEXT NOT NULL DEFAULT 'QUEUED',
  requested_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  started_at TEXT,
  finished_at TEXT,
  error TEXT,
  result_json TEXT
);

CREATE TABLE IF NOT EXISTS audit_log (
  audit_id INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type TEXT NOT NULL,
  target_path TEXT,
  before_json TEXT,
  after_json TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS policy_rules (
  rule_id TEXT PRIMARY KEY,
  rule_text TEXT NOT NULL,
  enabled INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

INSERT OR IGNORE INTO policy_rules (rule_id, rule_text) VALUES
  ('no_delete_originals', 'Never delete originals automatically.'),
  ('no_destructive_normalize', 'Never destructively normalize audio without explicit approval.'),
  ('metadata_only_cloud', 'Do not upload source audio; cloud sync is metadata and reports only.'),
  ('moves_require_dry_run', 'File moves require a dry-run plan before apply.');
