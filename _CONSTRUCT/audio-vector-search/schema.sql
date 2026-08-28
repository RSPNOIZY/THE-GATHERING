CREATE TABLE IF NOT EXISTS audio_tracks (
    id INTEGER PRIMARY KEY,
    path TEXT NOT NULL UNIQUE,
    title TEXT,
    file_size INTEGER NOT NULL DEFAULT 0,
    file_mtime_ns INTEGER NOT NULL DEFAULT 0,
    duration_seconds REAL,
    model_name TEXT NOT NULL DEFAULT 'laion/clap-htsat-fused',
    embedding_dim INTEGER NOT NULL DEFAULT 512,
    sample_rate INTEGER NOT NULL DEFAULT 48000,
    window_count INTEGER NOT NULL,
    window_seconds REAL NOT NULL DEFAULT 7.0,
    embedded_window_count INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TRIGGER IF NOT EXISTS audio_tracks_updated_at
AFTER UPDATE ON audio_tracks
BEGIN
    UPDATE audio_tracks
    SET updated_at = CURRENT_TIMESTAMP
    WHERE id = NEW.id;
END;

CREATE VIRTUAL TABLE IF NOT EXISTS vec_audio_tracks USING vec0(
    embedding float[512]
);
