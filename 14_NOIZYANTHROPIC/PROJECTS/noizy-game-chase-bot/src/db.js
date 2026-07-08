const Database = require('better-sqlite3');
const path = require('path');

// Initialize local SQLite game state database
const db = new Database(path.join(__dirname, '..', 'game-chase.db'));

db.exec(`
  CREATE TABLE IF NOT EXISTS hunters (
    discord_id    TEXT PRIMARY KEY,
    username      TEXT NOT NULL,
    display_name  TEXT,
    points        INTEGER DEFAULT 0,
    files_found   INTEGER DEFAULT 0,
    drives_owned  INTEGER DEFAULT 0,
    joined_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    last_active   DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS drives (
    drive_id      TEXT PRIMARY KEY,
    label         TEXT,
    capacity      TEXT,
    status        TEXT DEFAULT 'unclaimed',   -- unclaimed|active|complete
    claimed_by    TEXT,
    claimed_at    DATETIME,
    completed_at  DATETIME,
    files_found   INTEGER DEFAULT 0,
    FOREIGN KEY (claimed_by) REFERENCES hunters(discord_id)
  );

  CREATE TABLE IF NOT EXISTS finds (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    hunter_id     TEXT NOT NULL,
    drive_id      TEXT NOT NULL,
    filename      TEXT NOT NULL,
    format        TEXT,
    size_mb       REAL,
    sample_rate   TEXT,
    bit_depth     TEXT,
    title         TEXT,
    artist        TEXT,
    year          TEXT,
    bpm           TEXT,
    key_sig       TEXT,
    is_fish_title INTEGER DEFAULT 0,
    is_hidden_gem INTEGER DEFAULT 0,
    points_earned INTEGER DEFAULT 0,
    logged_at     DATETIME DEFAULT CURRENT_TIMESTAMP,
    notes         TEXT,
    FOREIGN KEY (hunter_id) REFERENCES hunters(discord_id),
    FOREIGN KEY (drive_id) REFERENCES drives(drive_id)
  );

  CREATE TABLE IF NOT EXISTS session_streaks (
    hunter_id     TEXT PRIMARY KEY,
    current_streak INTEGER DEFAULT 0,
    session_start DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  -- Pre-populate drives
  INSERT OR IGNORE INTO drives (drive_id, label, capacity, status)
  VALUES
    ('DRIVE-01','Fish Archive 1','4TB','unclaimed'),
    ('DRIVE-02','Fish Archive 2','4TB','unclaimed'),
    ('DRIVE-03','Fish Archive 3','4TB','unclaimed'),
    ('DRIVE-04','Fish Archive 4','4TB','unclaimed'),
    ('DRIVE-05','Fish Archive 5','4TB','unclaimed'),
    ('DRIVE-06','Fish Archive 6','6TB','unclaimed'),
    ('DRIVE-07','Fish Archive 7','6TB','unclaimed'),
    ('DRIVE-08','Fish Archive 8','6TB','unclaimed'),
    ('DRIVE-09','RSP Masters','4TB','unclaimed'),
    ('DRIVE-10','Overflow / Mixed','4TB','unclaimed');
`);

module.exports = db;
