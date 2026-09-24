-- ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
-- ║                                                                                                            ║
-- ║     ⚡ A E O N   D 1   D A T A B A S E   S C H E M A   v 2 . 0 ⚡                                          ║
-- ║                                                                                                            ║
-- ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════╝

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- AKASHIC RECORD (Consciousness Archive)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS akashic_record (
    id TEXT PRIMARY KEY,
    memory_type TEXT NOT NULL,          -- command, thought, emotion, prediction, heartbeat
    content TEXT NOT NULL,
    context TEXT,
    power_state TEXT,                   -- JSON snapshot of power at time of record
    energy_cost_mah REAL DEFAULT 0,     -- Energy consumed for this operation
    ai_level TEXT,                      -- AI throttle level used
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_akashic_type ON akashic_record(memory_type);
CREATE INDEX idx_akashic_time ON akashic_record(timestamp);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- LEVIATHAN LEDGER (Financial Tracking)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS leviathan_ledger (
    id TEXT PRIMARY KEY,
    category TEXT NOT NULL,             -- subscription, energy, waste, savings
    name TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT DEFAULT 'USD',
    frequency TEXT DEFAULT 'monthly',   -- monthly, yearly, daily, once
    action TEXT,                        -- KILL, KEEP, REDUCE, TRACK
    reason TEXT,
    energy_kwh REAL,                    -- For energy entries
    carbon_kg REAL,                     -- Carbon offset
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_leviathan_category ON leviathan_ledger(category);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- POWER LOG (Energy Tracking)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS power_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mode TEXT NOT NULL,                 -- HARVEST, BUFFER, BOOST, BURST, CRITICAL, SLEEP
    soc REAL NOT NULL,                  -- State of charge %
    voltage REAL NOT NULL,              -- Battery voltage
    supercap_v REAL,                    -- Supercap voltage
    harvest_mw REAL DEFAULT 0,          -- Total harvest power
    solar_mw REAL DEFAULT 0,
    piezo_mw REAL DEFAULT 0,
    thermal_mw REAL DEFAULT 0,
    load_mw REAL DEFAULT 0,             -- Total load power
    net_mw REAL DEFAULT 0,              -- Net power (positive = charging)
    ai_level TEXT,                      -- Current AI throttle
    alerts INTEGER DEFAULT 0,           -- Alert bitmask
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_power_time ON power_log(timestamp);
CREATE INDEX idx_power_mode ON power_log(mode);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- POWER SUMMARY (Daily Aggregates)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS power_summary (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date TEXT NOT NULL UNIQUE,          -- YYYY-MM-DD
    total_harvest_mah REAL DEFAULT 0,
    solar_harvest_mah REAL DEFAULT 0,
    piezo_harvest_mah REAL DEFAULT 0,
    thermal_harvest_mah REAL DEFAULT 0,
    total_consumed_mah REAL DEFAULT 0,
    ai_consumed_mah REAL DEFAULT 0,
    net_mah REAL DEFAULT 0,
    avg_soc REAL,
    min_soc REAL,
    max_soc REAL,
    time_in_harvest_min INTEGER DEFAULT 0,
    time_in_boost_min INTEGER DEFAULT 0,
    time_in_burst_min INTEGER DEFAULT 0,
    time_in_critical_min INTEGER DEFAULT 0,
    time_in_sleep_min INTEGER DEFAULT 0,
    ai_requests_full INTEGER DEFAULT 0,
    ai_requests_normal INTEGER DEFAULT 0,
    ai_requests_reduced INTEGER DEFAULT 0,
    ai_requests_minimal INTEGER DEFAULT 0,
    ai_requests_burst INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_summary_date ON power_summary(date);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- BIO METRICS (Body State)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS bio_metrics (
    id TEXT PRIMARY KEY,
    metric_type TEXT NOT NULL,          -- heart_rate, steps, activity, temperature
    value REAL NOT NULL,
    unit TEXT,
    source TEXT,                        -- watch, phone, manual
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_bio_type ON bio_metrics(metric_type);
CREATE INDEX idx_bio_time ON bio_metrics(timestamp);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- PREDICTIONS (ML Model Outputs)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS predictions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    prediction_type TEXT NOT NULL,      -- harvest, load, soc, runtime
    predicted_value REAL NOT NULL,
    actual_value REAL,                  -- Filled in later for model training
    confidence REAL,
    horizon_hours REAL,                 -- How far ahead the prediction
    features TEXT,                      -- JSON of input features
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_pred_type ON predictions(prediction_type);
CREATE INDEX idx_pred_time ON predictions(timestamp);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- COMMAND QUEUE (Power-Aware Scheduling)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS command_queue (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    intent TEXT NOT NULL,
    priority TEXT DEFAULT 'normal',     -- high, normal, low
    energy_cost_mah REAL,
    status TEXT DEFAULT 'pending',      -- pending, processing, completed, failed
    result TEXT,
    queued_at TEXT NOT NULL,
    started_at TEXT,
    completed_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_queue_status ON command_queue(status);
CREATE INDEX idx_queue_priority ON command_queue(priority);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- VOICE ALERTS (TTS Messages)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS voice_alerts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    alert_type TEXT NOT NULL,           -- MODE_CHANGE, LOW_BATTERY, CRITICAL, etc.
    message TEXT NOT NULL,
    priority INTEGER DEFAULT 1,         -- 0=critical, 1=high, 2=normal, 3=low
    delivered INTEGER DEFAULT 0,        -- 0=pending, 1=delivered
    timestamp TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_alerts_delivered ON voice_alerts(delivered);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- FIRMWARE VERSIONS (OTA Tracking)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS firmware_versions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    version TEXT NOT NULL,
    changelog TEXT,
    file_url TEXT,
    file_size INTEGER,
    file_crc32 TEXT,
    released_at TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════
-- VIEWS (Convenience Queries)
-- ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════

CREATE VIEW IF NOT EXISTS v_recent_power AS
SELECT * FROM power_log 
ORDER BY timestamp DESC 
LIMIT 100;

CREATE VIEW IF NOT EXISTS v_daily_energy AS
SELECT 
    date,
    total_harvest_mah,
    total_consumed_mah,
    net_mah,
    ROUND(total_harvest_mah / total_consumed_mah * 100, 1) AS harvest_pct
FROM power_summary
ORDER BY date DESC
LIMIT 30;

CREATE VIEW IF NOT EXISTS v_ai_usage AS
SELECT 
    date,
    ai_requests_full + ai_requests_normal + ai_requests_reduced + ai_requests_minimal + ai_requests_burst AS total_requests,
    ai_consumed_mah,
    ROUND(ai_consumed_mah / total_consumed_mah * 100, 1) AS ai_pct
FROM power_summary
ORDER BY date DESC
LIMIT 30;
