-- NOIZYVOX voice engine schema (D1)
-- Run: wrangler d1 execute noisy-vox --file=schema.sql

CREATE TABLE IF NOT EXISTS voice_profiles (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  engine TEXT NOT NULL CHECK(engine IN ('kokoro', 'xtts_v2', 'gabriel')),
  language TEXT DEFAULT 'en',
  sample_rate INTEGER DEFAULT 24000,
  is_sovereign INTEGER DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Seed sovereign voices
INSERT OR IGNORE INTO voice_profiles (id, name, engine, language, sample_rate, is_sovereign, created_at, updated_at) VALUES
  ('voice-daniel', 'Daniel', 'gabriel', 'en', 24000, 0, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('voice-kate', 'Kate', 'kokoro', 'en', 24000, 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('voice-lucy', 'Lucy', 'kokoro', 'en', 24000, 1, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z'),
  ('voice-rob', 'Rob', 'xtts_v2', 'en', 22050, 0, '2026-01-01T00:00:00Z', '2026-01-01T00:00:00Z');

CREATE INDEX IF NOT EXISTS idx_voice_name ON voice_profiles(name);
CREATE INDEX IF NOT EXISTS idx_voice_engine ON voice_profiles(engine);
