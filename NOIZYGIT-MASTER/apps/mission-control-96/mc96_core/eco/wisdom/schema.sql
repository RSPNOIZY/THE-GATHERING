-- Wisdom Project schema (D1)
-- Run: wrangler d1 execute noizyai-db --file=schema.sql

CREATE TABLE IF NOT EXISTS strategy_briefs (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK(category IN ('agi_alignment', 'mc96_universe', 'gorunfree', 'policy', 'governance', 'empire_strategy')),
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'review', 'published', 'archived')),
  summary TEXT DEFAULT '',
  content TEXT NOT NULL,
  author TEXT DEFAULT 'RSP',
  tags TEXT DEFAULT '',
  target_audience TEXT DEFAULT 'internal',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS governance_votes (
  id TEXT PRIMARY KEY,
  proposal_id TEXT NOT NULL,
  proposal_title TEXT DEFAULT '',
  vote TEXT NOT NULL CHECK(vote IN ('approve', 'reject', 'abstain')),
  voter TEXT NOT NULL,
  reason TEXT DEFAULT '',
  voted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_briefs_category ON strategy_briefs(category);
CREATE INDEX IF NOT EXISTS idx_briefs_status ON strategy_briefs(status);
CREATE INDEX IF NOT EXISTS idx_briefs_updated ON strategy_briefs(updated_at DESC);
CREATE INDEX IF NOT EXISTS idx_votes_proposal ON governance_votes(proposal_id);
CREATE INDEX IF NOT EXISTS idx_votes_voted ON governance_votes(voted_at DESC);
