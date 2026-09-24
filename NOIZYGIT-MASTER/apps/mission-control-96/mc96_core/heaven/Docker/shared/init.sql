-- Heaven + Lucy — PostgreSQL Init Script
-- Runs on first boot via docker-entrypoint-initdb.d/

-- Create Lucy DB alongside Heaven DB
CREATE DATABASE lucydb;
GRANT ALL PRIVILEGES ON DATABASE lucydb TO heaven;

-- Create lucy user
CREATE USER lucy WITH PASSWORD 'lucypass';
GRANT ALL PRIVILEGES ON DATABASE lucydb TO lucy;

-- Connect to heavendb and create schema
\c heavendb;

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity    VARCHAR(16) NOT NULL DEFAULT 'heaven',
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  identity    VARCHAR(16) NOT NULL DEFAULT 'heaven',
  role        VARCHAR(16) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_messages_session ON messages(session_id);
CREATE INDEX idx_messages_identity ON messages(identity);
CREATE INDEX idx_sessions_identity ON sessions(identity);

-- Connect to lucydb and mirror schema
\c lucydb;

CREATE TABLE IF NOT EXISTS sessions (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  identity    VARCHAR(16) NOT NULL DEFAULT 'lucy',
  name        TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS messages (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id  UUID REFERENCES sessions(id) ON DELETE CASCADE,
  identity    VARCHAR(16) NOT NULL DEFAULT 'lucy',
  role        VARCHAR(16) NOT NULL,
  content     TEXT NOT NULL,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_lucy_messages_session ON messages(session_id);
CREATE INDEX idx_lucy_messages_identity ON messages(identity);

GRANT ALL ON ALL TABLES IN SCHEMA public TO lucy;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO lucy;
