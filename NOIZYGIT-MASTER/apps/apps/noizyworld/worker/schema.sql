-- NOIZYWORLD — Task & Delegation System
-- Tables prefixed nw_ live alongside heaven platform tables on the noizy-prod D1 database.
-- Apply: wrangler d1 execute noizy-prod --remote --file=./schema.sql

-- ── Agents (human + AI) ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nw_agents (
  id              TEXT PRIMARY KEY,         -- 'rsp', 'claude', 'gabriel', 'lucy', …
  display_name    TEXT NOT NULL,
  kind            TEXT NOT NULL,            -- 'human' | 'ai' | 'service'
  role            TEXT,                     -- e.g., 'Founding Actor', 'Release Commander'
  email           TEXT,
  avatar_url      TEXT,
  active          INTEGER NOT NULL DEFAULT 1,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── API keys (scoped per agent) ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nw_api_keys (
  id              TEXT PRIMARY KEY,         -- uuid
  agent_id        TEXT NOT NULL REFERENCES nw_agents(id),
  key_hash        TEXT NOT NULL UNIQUE,     -- sha256 of the bearer token
  label           TEXT,
  scopes          TEXT NOT NULL DEFAULT '["read","write"]', -- JSON array
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  last_used_at    TEXT,
  revoked_at      TEXT                      -- kill-switch: set this to revoke
);

-- ── Projects (optional grouping) ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nw_projects (
  id              TEXT PRIMARY KEY,
  name            TEXT NOT NULL,
  description     TEXT,
  color           TEXT,                     -- hex for UI accents
  archived_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  created_by      TEXT REFERENCES nw_agents(id)
);

-- ── Tasks (the core) ───────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nw_tasks (
  id              TEXT PRIMARY KEY,
  title           TEXT NOT NULL,
  body            TEXT,                     -- markdown
  status          TEXT NOT NULL DEFAULT 'inbox',
                                           -- inbox | triaged | assigned | doing | blocked | review | done | cancelled
  priority        TEXT NOT NULL DEFAULT 'normal',
                                           -- urgent | high | normal | low | idle
  labels          TEXT NOT NULL DEFAULT '[]',  -- JSON array
  project_id      TEXT REFERENCES nw_projects(id),
  parent_id       TEXT REFERENCES nw_tasks(id),
  assigned_to     TEXT REFERENCES nw_agents(id),
  created_by      TEXT NOT NULL REFERENCES nw_agents(id),
  scheduled_for   TEXT,
  due_at          TEXT,
  started_at      TEXT,
  completed_at    TEXT,
  deleted_at      TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Task status history (every transition is a row) ────────────────────────
CREATE TABLE IF NOT EXISTS nw_status_history (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id         TEXT NOT NULL REFERENCES nw_tasks(id),
  from_status     TEXT,
  to_status       TEXT NOT NULL,
  changed_by      TEXT NOT NULL REFERENCES nw_agents(id),
  note            TEXT,
  changed_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Delegations (who handed off to whom; max depth enforced at app level) ──
CREATE TABLE IF NOT EXISTS nw_delegations (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id         TEXT NOT NULL REFERENCES nw_tasks(id),
  from_agent      TEXT NOT NULL REFERENCES nw_agents(id),
  to_agent        TEXT NOT NULL REFERENCES nw_agents(id),
  reason          TEXT,
  accepted_at     TEXT,
  rejected_at     TEXT,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Comments / thread per task ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS nw_comments (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id         TEXT NOT NULL REFERENCES nw_tasks(id),
  author_id       TEXT NOT NULL REFERENCES nw_agents(id),
  body            TEXT NOT NULL,            -- markdown
  attachments     TEXT DEFAULT '[]',        -- JSON array of urls
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Ledger cross-post queue (mirrored to heaven ledger by worker) ──────────
CREATE TABLE IF NOT EXISTS nw_ledger_outbox (
  id              INTEGER PRIMARY KEY AUTOINCREMENT,
  event_type      TEXT NOT NULL,            -- 'task.created' | 'task.delegated' | 'task.status' | …
  task_id         TEXT,
  actor_id        TEXT NOT NULL,
  payload         TEXT NOT NULL DEFAULT '{}',
  posted_to_heaven INTEGER NOT NULL DEFAULT 0,
  created_at      TEXT NOT NULL DEFAULT (datetime('now'))
);

-- ── Indexes ────────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_nw_tasks_status ON nw_tasks(status) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_nw_tasks_assigned ON nw_tasks(assigned_to) WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_nw_tasks_project ON nw_tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_nw_tasks_due ON nw_tasks(due_at) WHERE deleted_at IS NULL AND due_at IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_nw_status_history_task ON nw_status_history(task_id);
CREATE INDEX IF NOT EXISTS idx_nw_delegations_task ON nw_delegations(task_id);
CREATE INDEX IF NOT EXISTS idx_nw_comments_task ON nw_comments(task_id);
CREATE INDEX IF NOT EXISTS idx_nw_api_keys_hash ON nw_api_keys(key_hash) WHERE revoked_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_nw_ledger_unposted ON nw_ledger_outbox(posted_to_heaven) WHERE posted_to_heaven = 0;

-- ── Seed the 9-agent fleet + RSP ──────────────────────────────────────────
INSERT OR IGNORE INTO nw_agents (id, display_name, kind, role, email) VALUES
  ('rsp',         'Robert Stephen Plowman', 'human',   'Founding Actor · RSP_001', 'rsp@noizy.ai'),
  ('claude',      'Claude',                 'ai',      'Base Model — Sovereign Intelligence', NULL),
  ('gabriel',     'GABRIEL',                'ai',      'Release Commander & Swarm Leader', NULL),
  ('lucy',        'Lucy',                   'ai',      'Guardian & Voice Estate',         NULL),
  ('shirl',       'Shirl',                  'ai',      'Sample Intelligence Analyst',     NULL),
  ('dream',       'Dream',                  'ai',      'Creative Assistant & DAW Whisperer', NULL),
  ('pops',        'Pops',                   'ai',      'No-Code Orchestrator',            NULL),
  ('engr_keith',  'ENGR_KEITH',             'ai',      'Infrastructure Engineer',         NULL),
  ('cb01',        'CB01',                   'ai',      'Consent & Contracts Bot',         NULL),
  ('heaven',      'Heaven',                 'service', 'DNS & Domain Sovereign',          NULL);
