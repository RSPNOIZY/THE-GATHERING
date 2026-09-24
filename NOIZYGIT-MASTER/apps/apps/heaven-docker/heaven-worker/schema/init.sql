-- Heaven Local Dev — Database Initialization
-- Creates all tables needed by the Heaven worker

CREATE TABLE IF NOT EXISTS gabriel_log (
    id TEXT PRIMARY KEY,
    event_type TEXT NOT NULL,
    actor_id TEXT,
    target_id TEXT,
    payload TEXT,
    sovereignty_check TEXT,
    logged_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS family_members (
    id TEXT PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    display_name TEXT NOT NULL,
    hvs_acknowledged INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS consent_matrix (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    use_cases TEXT NOT NULL,
    restrictions TEXT,
    beneficiary_ids TEXT NOT NULL,
    c2pa_stamp TEXT,
    expires_at TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES family_members(id)
);

CREATE TABLE IF NOT EXISTS beneficiaries (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    beneficiary_member_id TEXT NOT NULL,
    access_rules TEXT,
    granted_by TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES family_members(id),
    FOREIGN KEY (beneficiary_member_id) REFERENCES family_members(id)
);

CREATE TABLE IF NOT EXISTS voice_profiles (
    id TEXT PRIMARY KEY,
    member_id TEXT NOT NULL,
    file_ref TEXT NOT NULL,
    sample_rate INTEGER NOT NULL DEFAULT 48000,
    bit_depth INTEGER NOT NULL DEFAULT 32,
    duration_seconds REAL,
    emotional_tags TEXT,
    c2pa_stamp TEXT,
    model_version TEXT DEFAULT 'xtts_v2',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (member_id) REFERENCES family_members(id)
);

CREATE TABLE IF NOT EXISTS messages (
    id TEXT PRIMARY KEY,
    from_member_id TEXT NOT NULL,
    to_beneficiary_ids TEXT NOT NULL,
    message_type TEXT NOT NULL,
    file_ref TEXT NOT NULL,
    duration_seconds REAL,
    trigger_conditions TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (from_member_id) REFERENCES family_members(id)
);

CREATE TABLE IF NOT EXISTS healing_sessions (
    id TEXT PRIMARY KEY,
    beneficiary_member_id TEXT NOT NULL,
    protocol_type TEXT NOT NULL,
    voice_message_id TEXT,
    noizyfish_track_id TEXT,
    frequency_hz REAL,
    duration_seconds REAL,
    biometric_before TEXT,
    biometric_after TEXT,
    outcome TEXT DEFAULT 'pending',
    consent_verified INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (beneficiary_member_id) REFERENCES family_members(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_gabriel_actor ON gabriel_log(actor_id);
CREATE INDEX IF NOT EXISTS idx_gabriel_type ON gabriel_log(event_type);
CREATE INDEX IF NOT EXISTS idx_consent_member ON consent_matrix(member_id);
CREATE INDEX IF NOT EXISTS idx_voice_member ON voice_profiles(member_id);
CREATE INDEX IF NOT EXISTS idx_healing_beneficiary ON healing_sessions(beneficiary_member_id);
