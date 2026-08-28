from __future__ import annotations

import sqlite3
from dataclasses import dataclass
from pathlib import Path

import sqlite_vec


DEFAULT_DB_PATH = Path("audio_tracks.sqlite")
SCHEMA_PATH = Path(__file__).resolve().parent.parent / "schema.sql"


@dataclass(frozen=True)
class TrackFingerprint:
    path: Path
    file_size: int
    file_mtime_ns: int
    model_name: str
    sample_rate: int
    window_count: int
    window_seconds: float
    embedding_dim: int

    @classmethod
    def from_path(
        cls,
        path: Path,
        *,
        model_name: str,
        sample_rate: int,
        window_count: int,
        window_seconds: float,
        embedding_dim: int,
    ) -> "TrackFingerprint":
        stat = path.expanduser().resolve().stat()
        return cls(
            path=path.expanduser().resolve(),
            file_size=stat.st_size,
            file_mtime_ns=stat.st_mtime_ns,
            model_name=model_name,
            sample_rate=sample_rate,
            window_count=window_count,
            window_seconds=window_seconds,
            embedding_dim=embedding_dim,
        )


def connect(db_path: str | Path = DEFAULT_DB_PATH) -> sqlite3.Connection:
    """Open SQLite and load the sqlite-vec extension for this connection."""
    db = sqlite3.connect(str(db_path))
    db.row_factory = sqlite3.Row
    db.enable_load_extension(True)
    sqlite_vec.load(db)
    db.enable_load_extension(False)
    return db


def init_schema(db: sqlite3.Connection) -> None:
    db.executescript(SCHEMA_PATH.read_text(encoding="utf-8"))
    ensure_audio_track_columns(db)
    db.commit()


def ensure_audio_track_columns(db: sqlite3.Connection) -> None:
    """Add columns for users upgrading an existing database from an older schema."""
    existing = {
        row["name"]
        for row in db.execute("PRAGMA table_info(audio_tracks)").fetchall()
    }
    columns = {
        "file_size": "INTEGER NOT NULL DEFAULT 0",
        "file_mtime_ns": "INTEGER NOT NULL DEFAULT 0",
        "model_name": "TEXT NOT NULL DEFAULT 'laion/clap-htsat-fused'",
        "embedding_dim": "INTEGER NOT NULL DEFAULT 512",
        "window_seconds": "REAL NOT NULL DEFAULT 7.0",
        "embedded_window_count": "INTEGER NOT NULL DEFAULT 0",
    }
    for name, definition in columns.items():
        if name not in existing:
            db.execute(f"ALTER TABLE audio_tracks ADD COLUMN {name} {definition}")


def has_current_embedding(
    db: sqlite3.Connection,
    *,
    fingerprint: TrackFingerprint,
) -> bool:
    row = db.execute(
        """
        SELECT
            t.id,
            t.file_size,
            t.file_mtime_ns,
            t.model_name,
            t.sample_rate,
            t.window_count,
            t.window_seconds,
            t.embedding_dim,
            v.rowid AS vector_rowid
        FROM audio_tracks AS t
        LEFT JOIN vec_audio_tracks AS v ON v.rowid = t.id
        WHERE t.path = ?
        """,
        (str(fingerprint.path),),
    ).fetchone()
    if row is None or row["vector_rowid"] is None:
        return False
    return (
        row["file_size"] == fingerprint.file_size
        and row["file_mtime_ns"] == fingerprint.file_mtime_ns
        and row["model_name"] == fingerprint.model_name
        and row["sample_rate"] == fingerprint.sample_rate
        and row["window_count"] == fingerprint.window_count
        and float(row["window_seconds"]) == float(fingerprint.window_seconds)
        and row["embedding_dim"] == fingerprint.embedding_dim
    )


def upsert_track(
    db: sqlite3.Connection,
    *,
    fingerprint: TrackFingerprint,
    title: str | None,
    duration_seconds: float,
    embedded_window_count: int,
    embedding: bytes,
) -> int:
    """Insert or replace a track's metadata and vector."""
    db.execute(
        """
        INSERT INTO audio_tracks (
            path,
            title,
            file_size,
            file_mtime_ns,
            duration_seconds,
            model_name,
            embedding_dim,
            sample_rate,
            window_count,
            window_seconds,
            embedded_window_count
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(path) DO UPDATE SET
            title = excluded.title,
            file_size = excluded.file_size,
            file_mtime_ns = excluded.file_mtime_ns,
            duration_seconds = excluded.duration_seconds,
            model_name = excluded.model_name,
            embedding_dim = excluded.embedding_dim,
            sample_rate = excluded.sample_rate,
            window_count = excluded.window_count,
            window_seconds = excluded.window_seconds,
            embedded_window_count = excluded.embedded_window_count
        """,
        (
            str(fingerprint.path),
            title,
            fingerprint.file_size,
            fingerprint.file_mtime_ns,
            duration_seconds,
            fingerprint.model_name,
            fingerprint.embedding_dim,
            fingerprint.sample_rate,
            fingerprint.window_count,
            fingerprint.window_seconds,
            embedded_window_count,
        ),
    )
    track_id = db.execute(
        "SELECT id FROM audio_tracks WHERE path = ?",
        (str(fingerprint.path),),
    ).fetchone()["id"]

    db.execute("DELETE FROM vec_audio_tracks WHERE rowid = ?", (track_id,))
    db.execute(
        "INSERT INTO vec_audio_tracks(rowid, embedding) VALUES (?, ?)",
        (track_id, embedding),
    )
    db.commit()
    return int(track_id)
