-- ═══════════════════════════════════════════════════════════════
-- AEON GOD-KERNEL DATABASE SCHEMA
-- Complete schema for all subsystems
-- ═══════════════════════════════════════════════════════════════

-- GOD COMMANDS LOG
CREATE TABLE IF NOT EXISTS god_commands (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    session_id TEXT NOT NULL,
    intent TEXT NOT NULL,
    vision_response TEXT,
    logic_response TEXT,
    voice_response TEXT,
    physical_actions TEXT,
    background_tasks TEXT,
    latency_ms INTEGER,
    timestamp INTEGER NOT NULL
);

-- POLTERGEIST IoT DEVICES
CREATE TABLE IF NOT EXISTS poltergeist_devices (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    device_id TEXT UNIQUE NOT NULL,
    device_type TEXT NOT NULL,
    name TEXT,
    location TEXT,
    status TEXT DEFAULT 'OFFLINE',
    last_command TEXT,
    last_ping INTEGER,
    capabilities TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- DNA ARCHIVE (CONSCIOUSNESS BACKUP)
CREATE TABLE IF NOT EXISTS dna_archive (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    memory_hash TEXT UNIQUE NOT NULL,
    memory_type TEXT DEFAULT 'general',
    encoded_data TEXT,
    base_pairs TEXT,
    importance INTEGER DEFAULT 5,
    timestamp INTEGER NOT NULL
);

-- LEVIATHAN SCANS (FINANCIAL)
CREATE TABLE IF NOT EXISTS leviathan_scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    scan_type TEXT NOT NULL,
    findings TEXT,
    amount_saved REAL DEFAULT 0,
    action_taken TEXT,
    timestamp INTEGER NOT NULL
);

-- DIGITAL ACCOUNTS (SUBSCRIPTIONS)
CREATE TABLE IF NOT EXISTS digital_accounts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    provider TEXT,
    monthly_cost REAL DEFAULT 0,
    annual_cost REAL DEFAULT 0,
    status TEXT DEFAULT 'active',
    category TEXT,
    last_used INTEGER,
    verdict TEXT,
    created_at INTEGER DEFAULT (strftime('%s', 'now') * 1000)
);

-- BIO READINGS
CREATE TABLE IF NOT EXISTS bio_readings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    reading_type TEXT NOT NULL,
    value REAL,
    unit TEXT,
    source TEXT,
    timestamp INTEGER NOT NULL
);

-- POWER HARVESTING LOG
CREATE TABLE IF NOT EXISTS power_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    harvester TEXT NOT NULL,
    output_mw REAL,
    soc_before REAL,
    soc_after REAL,
    mode TEXT,
    timestamp INTEGER NOT NULL
);

-- SEED DATA: DEVICES
INSERT OR IGNORE INTO poltergeist_devices (device_id, device_type, name, status) VALUES
('CLAYTRONICS_01', 'claytronics', 'Helmet Shell', 'STANDARD'),
('DRONE_ALPHA', 'drone', 'Overwatch Drone', 'DOCKED'),
('MESH_STIM_01', 'bio_stim', 'Caffeine Dispenser', 'STANDBY'),
('LIDAR_REAR', 'sensor', 'Rear Threat Detector', 'ACTIVE'),
('GOD_MAC', 'computer', 'GOD Mac Studio', 'ONLINE'),
('GABRIEL_OMEN', 'computer', 'GABRIEL HP Omen', 'ONLINE'),
('DAFIXER', 'computer', 'DaFixer MacBook', 'ONLINE'),
('MC96_SWITCH', 'network', 'MC96 DLink Switch', 'ONLINE'),
('PLANAR_2495', 'display', 'PLANAR Touchscreen', 'ONLINE');

-- SEED DATA: SAMPLE SUBSCRIPTIONS
INSERT OR IGNORE INTO digital_accounts (name, provider, monthly_cost, category, verdict) VALUES
('iCloud+ 2TB', 'Apple', 12.99, 'storage', 'KEEP'),
('Apple Music Family', 'Apple', 16.99, 'entertainment', 'KEEP'),
('Claude Pro', 'Anthropic', 20.00, 'ai', 'ESSENTIAL'),
('ChatGPT Plus', 'OpenAI', 20.00, 'ai', 'EVALUATE'),
('Cloudflare Pro', 'Cloudflare', 0.00, 'hosting', 'ESSENTIAL');
