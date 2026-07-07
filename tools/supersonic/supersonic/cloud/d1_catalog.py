"""
SUPERSONIC D1 Catalog — The Cloud Brain
========================================
Stores the complete audio catalog in Cloudflare D1.
Every scan, every asset, every consent record — searchable from anywhere.
"""

from __future__ import annotations
import json
import sqlite3
from pathlib import Path
from datetime import datetime
from typing import Optional
from ..models import AudioAsset, ScanReport


# D1 Schema — mirrors the AudioAsset model for cloud storage
D1_SCHEMA = """
-- SUPERSONIC Audio Catalog for Cloudflare D1
-- Robert Stephen Plowman | NOIZY.AI | 2026

CREATE TABLE IF NOT EXISTS audio_assets (
    id TEXT PRIMARY KEY,
    file_path TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_extension TEXT NOT NULL,
    file_size_bytes INTEGER NOT NULL,
    sha256 TEXT,

    -- Classification
    format TEXT NOT NULL DEFAULT 'unknown',
    category TEXT NOT NULL DEFAULT 'unknown',
    category_confidence REAL DEFAULT 0.0,

    -- Quality
    sample_rate INTEGER,
    bit_depth INTEGER,
    channels INTEGER,
    bitrate INTEGER,
    codec TEXT,
    duration_seconds REAL,
    is_lossless INTEGER DEFAULT 0,

    -- Waveform signature
    chromaprint TEXT,
    rms_energy REAL,
    spectral_centroid REAL,
    tempo_bpm REAL,
    musical_key TEXT,
    is_silence INTEGER DEFAULT 0,
    peak_db REAL,

    -- Metadata tags
    title TEXT,
    artist TEXT,
    album TEXT,
    genre TEXT,
    year INTEGER,
    comment TEXT,
    tags TEXT,  -- JSON array

    -- Project association
    project TEXT,
    sub_project TEXT,
    track_number INTEGER,
    track_title TEXT,

    -- Consent (NCP)
    owner_id TEXT DEFAULT 'RSP_001',
    owner_name TEXT DEFAULT 'Robert Stephen Plowman',
    consent_granted INTEGER DEFAULT 1,
    consent_date TEXT,
    split_artist REAL DEFAULT 0.75,
    split_platform REAL DEFAULT 0.25,
    license_type TEXT DEFAULT 'full_ownership',
    governing_law TEXT DEFAULT 'Canada',

    -- Duplicate tracking
    duplicate_group_id TEXT,
    is_primary_copy INTEGER DEFAULT 1,
    duplicate_paths TEXT,  -- JSON array

    -- Location
    source_machine TEXT DEFAULT 'GOD',
    original_path TEXT,
    canonical_path TEXT,
    cloud_r2_key TEXT,

    -- Timestamps
    file_created TEXT,
    file_modified TEXT,
    scanned_at TEXT NOT NULL,
    last_verified TEXT,

    -- Flags
    is_empty INTEGER DEFAULT 0,
    is_noise INTEGER DEFAULT 0,
    needs_review INTEGER DEFAULT 0,
    needs_consent INTEGER DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_assets_category ON audio_assets(category);
CREATE INDEX IF NOT EXISTS idx_assets_project ON audio_assets(project);
CREATE INDEX IF NOT EXISTS idx_assets_sha256 ON audio_assets(sha256);
CREATE INDEX IF NOT EXISTS idx_assets_format ON audio_assets(format);
CREATE INDEX IF NOT EXISTS idx_assets_machine ON audio_assets(source_machine);
CREATE INDEX IF NOT EXISTS idx_assets_duplicate ON audio_assets(duplicate_group_id);
CREATE INDEX IF NOT EXISTS idx_assets_owner ON audio_assets(owner_id);

CREATE TABLE IF NOT EXISTS scan_reports (
    scan_id TEXT PRIMARY KEY,
    started_at TEXT NOT NULL,
    completed_at TEXT,
    machine TEXT NOT NULL,
    scan_paths TEXT,  -- JSON array
    total_files_found INTEGER DEFAULT 0,
    total_audio_files INTEGER DEFAULT 0,
    total_size_bytes INTEGER DEFAULT 0,
    total_duplicates INTEGER DEFAULT 0,
    total_empty INTEGER DEFAULT 0,
    total_noise INTEGER DEFAULT 0,
    total_real_audio INTEGER DEFAULT 0,
    categories TEXT,  -- JSON object
    formats TEXT,  -- JSON object
    errors TEXT  -- JSON array
);

CREATE TABLE IF NOT EXISTS consent_ledger (
    id TEXT PRIMARY KEY,
    asset_id TEXT NOT NULL,
    owner_id TEXT NOT NULL,
    owner_name TEXT NOT NULL,
    action TEXT NOT NULL,  -- 'grant', 'revoke', 'transfer', 'verify'
    timestamp TEXT NOT NULL,
    split_artist REAL,
    split_platform REAL,
    license_type TEXT,
    governing_law TEXT,
    notes TEXT,
    FOREIGN KEY (asset_id) REFERENCES audio_assets(id)
);

CREATE INDEX IF NOT EXISTS idx_consent_asset ON consent_ledger(asset_id);
CREATE INDEX IF NOT EXISTS idx_consent_owner ON consent_ledger(owner_id);
"""


class LocalCatalog:
    """
    Local SQLite catalog — same schema as D1, works offline.
    Syncs to Cloudflare D1 when connected.
    """

    def __init__(self, db_path: str = "~/.noizy/supersonic/catalog.db"):
        self.db_path = Path(db_path).expanduser()
        self.db_path.parent.mkdir(parents=True, exist_ok=True)
        self.conn = sqlite3.connect(str(self.db_path))
        self.conn.row_factory = sqlite3.Row
        self._init_schema()

    def _init_schema(self):
        """Initialize database schema."""
        self.conn.executescript(D1_SCHEMA)
        self.conn.commit()

    def store_asset(self, asset: AudioAsset):
        """Store or update a single audio asset."""
        self.conn.execute("""
            INSERT OR REPLACE INTO audio_assets (
                id, file_path, file_name, file_extension, file_size_bytes, sha256,
                format, category, category_confidence,
                sample_rate, bit_depth, channels, bitrate, codec, duration_seconds, is_lossless,
                chromaprint, rms_energy, spectral_centroid, tempo_bpm, musical_key, is_silence, peak_db,
                title, artist, album, genre, year, comment, tags,
                project, sub_project, track_number, track_title,
                owner_id, owner_name, consent_granted, consent_date,
                split_artist, split_platform, license_type, governing_law,
                duplicate_group_id, is_primary_copy, duplicate_paths,
                source_machine, original_path, canonical_path, cloud_r2_key,
                file_created, file_modified, scanned_at, last_verified,
                is_empty, is_noise, needs_review, needs_consent
            ) VALUES (
                ?, ?, ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?,
                ?, ?, ?, ?
            )
        """, (
            asset.id, asset.file_path, asset.file_name, asset.file_extension,
            asset.file_size_bytes, asset.sha256,
            asset.format.value, asset.category.value, asset.category_confidence,
            asset.quality.sample_rate, asset.quality.bit_depth, asset.quality.channels,
            asset.quality.bitrate, asset.quality.codec, asset.quality.duration_seconds,
            1 if asset.quality.is_lossless else 0,
            asset.waveform.chromaprint, asset.waveform.rms_energy,
            asset.waveform.spectral_centroid, asset.waveform.tempo_bpm,
            asset.waveform.key, 1 if asset.waveform.is_silence else 0,
            asset.waveform.peak_db,
            asset.title, asset.artist, asset.album, asset.genre, asset.year,
            asset.comment, json.dumps(asset.tags),
            asset.project.project, asset.project.sub_project,
            asset.project.track_number, asset.project.track_title,
            asset.consent.owner_id, asset.consent.owner_name,
            1 if asset.consent.consent_granted else 0,
            asset.consent.consent_date.isoformat() if asset.consent.consent_date else None,
            asset.consent.split_artist, asset.consent.split_platform,
            asset.consent.license_type, asset.consent.governing_law,
            asset.duplicate_group_id, 1 if asset.is_primary_copy else 0,
            json.dumps(asset.duplicate_paths),
            asset.source_machine, asset.original_path, asset.canonical_path,
            asset.cloud_r2_key,
            asset.file_created.isoformat() if asset.file_created else None,
            asset.file_modified.isoformat() if asset.file_modified else None,
            asset.scanned_at.isoformat(),
            asset.last_verified.isoformat() if asset.last_verified else None,
            1 if asset.is_empty else 0, 1 if asset.is_noise else 0,
            1 if asset.needs_review else 0, 1 if asset.needs_consent else 0,
        ))
        self.conn.commit()

    def store_scan_report(self, report: ScanReport):
        """Store a scan report."""
        self.conn.execute("""
            INSERT OR REPLACE INTO scan_reports (
                scan_id, started_at, completed_at, machine, scan_paths,
                total_files_found, total_audio_files, total_size_bytes,
                total_duplicates, total_empty, total_noise, total_real_audio,
                categories, formats, errors
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            report.scan_id,
            report.started_at.isoformat(),
            report.completed_at.isoformat() if report.completed_at else None,
            report.machine,
            json.dumps(report.scan_paths),
            report.total_files_found,
            report.total_audio_files,
            report.total_size_bytes,
            report.total_duplicates,
            report.total_empty,
            report.total_noise,
            report.total_real_audio,
            json.dumps(report.categories),
            json.dumps(report.formats),
            json.dumps(report.errors),
        ))
        self.conn.commit()

    def search(self, query: str = "", category: str = "", project: str = "",
               format_: str = "", limit: int = 100) -> list[dict]:
        """Search the catalog."""
        conditions = []
        params = []

        if query:
            conditions.append("(file_name LIKE ? OR title LIKE ? OR artist LIKE ? OR album LIKE ?)")
            q = f"%{query}%"
            params.extend([q, q, q, q])
        if category:
            conditions.append("category = ?")
            params.append(category)
        if project:
            conditions.append("project = ?")
            params.append(project)
        if format_:
            conditions.append("format = ?")
            params.append(format_)

        where = "WHERE " + " AND ".join(conditions) if conditions else ""
        sql = f"SELECT * FROM audio_assets {where} ORDER BY scanned_at DESC LIMIT ?"
        params.append(limit)

        cursor = self.conn.execute(sql, params)
        return [dict(row) for row in cursor.fetchall()]

    def stats(self) -> dict:
        """Get catalog statistics."""
        cursor = self.conn.execute("SELECT COUNT(*) as total FROM audio_assets")
        total = cursor.fetchone()["total"]

        cursor = self.conn.execute("""
            SELECT category, COUNT(*) as count
            FROM audio_assets GROUP BY category ORDER BY count DESC
        """)
        by_category = {row["category"]: row["count"] for row in cursor.fetchall()}

        cursor = self.conn.execute("""
            SELECT project, COUNT(*) as count
            FROM audio_assets WHERE project IS NOT NULL GROUP BY project ORDER BY count DESC
        """)
        by_project = {row["project"]: row["count"] for row in cursor.fetchall()}

        cursor = self.conn.execute("""
            SELECT format, COUNT(*) as count
            FROM audio_assets GROUP BY format ORDER BY count DESC
        """)
        by_format = {row["format"]: row["count"] for row in cursor.fetchall()}

        cursor = self.conn.execute("SELECT SUM(file_size_bytes) as total FROM audio_assets")
        total_size = cursor.fetchone()["total"] or 0

        cursor = self.conn.execute("SELECT COUNT(*) as count FROM audio_assets WHERE duplicate_group_id IS NOT NULL AND is_primary_copy = 0")
        duplicates = cursor.fetchone()["count"]

        return {
            "total_assets": total,
            "total_size_bytes": total_size,
            "total_size_human": self._human_size(total_size),
            "duplicates": duplicates,
            "by_category": by_category,
            "by_project": by_project,
            "by_format": by_format,
        }

    def export_d1_sql(self, output_path: str = "supersonic_d1_export.sql") -> str:
        """Export the catalog as SQL statements for Cloudflare D1 import."""
        path = Path(output_path)
        with open(path, "w") as f:
            f.write("-- SUPERSONIC D1 Export\n")
            f.write(f"-- Generated: {datetime.now().isoformat()}\n")
            f.write(f"-- Machine: GOD\n\n")
            f.write(D1_SCHEMA)
            f.write("\n\n-- Data\n")

            cursor = self.conn.execute("SELECT * FROM audio_assets")
            for row in cursor:
                d = dict(row)
                cols = ", ".join(d.keys())
                vals = ", ".join(
                    f"'{str(v).replace(chr(39), chr(39)+chr(39))}'" if v is not None else "NULL"
                    for v in d.values()
                )
                f.write(f"INSERT OR REPLACE INTO audio_assets ({cols}) VALUES ({vals});\n")

        return str(path)

    @staticmethod
    def _human_size(size_bytes: int) -> str:
        """Convert bytes to human-readable size."""
        for unit in ["B", "KB", "MB", "GB", "TB"]:
            if abs(size_bytes) < 1024.0:
                return f"{size_bytes:.1f} {unit}"
            size_bytes /= 1024.0
        return f"{size_bytes:.1f} PB"

    def close(self):
        self.conn.close()
