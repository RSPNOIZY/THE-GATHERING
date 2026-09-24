#!/usr/bin/env python3
"""
MC96ECOUNIVERSE non-destructive audio inventory, recovery triage, and prune planning.

This tool never moves or deletes source files. It writes a SQLite catalog plus CSV
reports that can be reviewed before any later manual recovery or pruning pass.
"""

from __future__ import annotations

import argparse
import csv
import hashlib
import json
import os
import sqlite3
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Iterable


DEFAULT_CONFIG = Path(__file__).resolve().parents[1] / "config" / "drives.json"
DEFAULT_DB_NAME = "catalog.sqlite"
REPORT_DIR_NAME = "reports"


@dataclass(frozen=True)
class Drive:
    name: str
    path: Path
    role: str
    priority: int


def load_config(path: Path) -> dict:
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def configured_drives(config: dict) -> list[Drive]:
    return [
        Drive(
            name=item["name"],
            path=Path(item["path"]),
            role=item.get("role", "unspecified"),
            priority=int(item.get("priority", 0)),
        )
        for item in config.get("drives", [])
    ]


def output_root(config: dict) -> Path:
    root = Path(config["output_root"])
    root.mkdir(parents=True, exist_ok=True)
    (root / REPORT_DIR_NAME).mkdir(parents=True, exist_ok=True)
    return root


def connect(db_path: Path) -> sqlite3.Connection:
    conn = sqlite3.connect(db_path)
    conn.execute("PRAGMA journal_mode=WAL")
    conn.execute("PRAGMA synchronous=NORMAL")
    conn.execute("PRAGMA temp_store=MEMORY")
    conn.executescript(
        """
        CREATE TABLE IF NOT EXISTS scan_runs (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          started_at TEXT NOT NULL,
          finished_at TEXT,
          mode TEXT NOT NULL,
          hash_mode TEXT NOT NULL,
          config_path TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS files (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id INTEGER NOT NULL,
          drive TEXT NOT NULL,
          role TEXT NOT NULL,
          path TEXT NOT NULL,
          extension TEXT NOT NULL,
          detected_type TEXT NOT NULL,
          size_bytes INTEGER NOT NULL,
          mtime REAL NOT NULL,
          sha256 TEXT,
          flags TEXT NOT NULL,
          UNIQUE(run_id, path)
        );

        CREATE TABLE IF NOT EXISTS scan_errors (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          run_id INTEGER NOT NULL,
          drive TEXT NOT NULL,
          path TEXT NOT NULL,
          error TEXT NOT NULL
        );

        CREATE INDEX IF NOT EXISTS idx_files_run_drive ON files(run_id, drive);
        CREATE INDEX IF NOT EXISTS idx_files_run_ext ON files(run_id, extension);
        CREATE INDEX IF NOT EXISTS idx_files_run_hash ON files(run_id, sha256);
        CREATE INDEX IF NOT EXISTS idx_files_run_size ON files(run_id, size_bytes);
        """
    )
    return conn


def utc_now() -> str:
    return time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime())


def create_run(conn: sqlite3.Connection, mode: str, hash_mode: str, config_path: Path) -> int:
    cur = conn.execute(
        "INSERT INTO scan_runs(started_at, mode, hash_mode, config_path) VALUES (?, ?, ?, ?)",
        (utc_now(), mode, hash_mode, str(config_path)),
    )
    conn.commit()
    return int(cur.lastrowid)


def finish_run(conn: sqlite3.Connection, run_id: int) -> None:
    conn.execute("UPDATE scan_runs SET finished_at = ? WHERE id = ?", (utc_now(), run_id))
    conn.commit()


def normalize_extensions(config: dict) -> set[str]:
    return {ext.lower() if ext.startswith(".") else f".{ext.lower()}" for ext in config["audio_extensions"]}


def excluded(name: str, exclude_names: set[str]) -> bool:
    return name in exclude_names or name.endswith("-bad-1")


def walk_files(root: Path, exclude_names: set[str]) -> Iterable[Path]:
    for current_root, dirs, files in os.walk(root, topdown=True):
        dirs[:] = [name for name in dirs if not excluded(name, exclude_names)]
        for filename in files:
            yield Path(current_root) / filename


def detect_audio_type(path: Path, ext: str) -> str:
    try:
        with path.open("rb") as handle:
            header = handle.read(32)
    except OSError:
        return "unreadable"

    if len(header) >= 12 and header[:4] == b"RIFF" and header[8:12] == b"WAVE":
        return "wav"
    if len(header) >= 12 and header[:4] == b"FORM" and header[8:12] in {b"AIFF", b"AIFC"}:
        return "aiff"
    if header.startswith(b"ID3") or (len(header) >= 2 and header[0] == 0xFF and (header[1] & 0xE0) == 0xE0):
        return "mp3"
    if header.startswith(b"fLaC"):
        return "flac"
    if header.startswith(b"OggS"):
        return "ogg"
    if header.startswith(b"caff"):
        return "caf"
    if len(header) >= 12 and header[4:8] == b"ftyp":
        return "mp4_family"
    if ext in {".au", ".snd"} and header.startswith(b".snd"):
        return "au_snd"
    return "unknown"


def sha256_file(path: Path, chunk_size: int = 1024 * 1024) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as handle:
        for chunk in iter(lambda: handle.read(chunk_size), b""):
            digest.update(chunk)
    return digest.hexdigest()


def flags_for(path: Path, ext: str, detected: str, size: int, audio_extensions: set[str]) -> list[str]:
    flags: list[str] = []
    if ext not in audio_extensions and detected != "unknown":
        flags.append("audio_magic_wrong_or_missing_extension")
    if ext in audio_extensions and detected == "unknown":
        flags.append("extension_audio_magic_unknown")
    if detected == "unreadable":
        flags.append("unreadable_header")
    if size == 0:
        flags.append("zero_bytes")
    elif size < 4096:
        flags.append("very_small_audio_candidate")
    if any(part.lower() in {"undo data", "audio files", "rendered files"} for part in path.parts):
        flags.append("daw_generated_asset")
    return flags


def should_record(path: Path, mode: str, audio_extensions: set[str], detected: str) -> bool:
    ext = path.suffix.lower()
    if ext in audio_extensions:
        return True
    return mode == "deep" and detected != "unknown" and detected != "unreadable"


def insert_error(conn: sqlite3.Connection, run_id: int, drive: Drive, path: Path, error: str) -> None:
    conn.execute(
        "INSERT INTO scan_errors(run_id, drive, path, error) VALUES (?, ?, ?, ?)",
        (run_id, drive.name, str(path), error),
    )


def scan_drive(
    conn: sqlite3.Connection,
    run_id: int,
    drive: Drive,
    mode: str,
    hash_mode: str,
    audio_extensions: set[str],
    exclude_names: set[str],
    limit: int | None,
) -> int:
    if not drive.path.exists():
        insert_error(conn, run_id, drive, drive.path, "drive_not_mounted")
        conn.commit()
        return 0

    inserted = 0
    batch: list[tuple] = []
    for path in walk_files(drive.path, exclude_names):
        try:
            stat = path.stat()
            if not stat or not path.is_file():
                continue
            ext = path.suffix.lower()
            detected = detect_audio_type(path, ext) if mode == "deep" or ext in audio_extensions else "not_checked"
            if not should_record(path, mode, audio_extensions, detected):
                continue
            digest = sha256_file(path) if hash_mode == "full" else None
            flags = flags_for(path, ext, detected, stat.st_size, audio_extensions)
            batch.append(
                (
                    run_id,
                    drive.name,
                    drive.role,
                    str(path),
                    ext,
                    detected,
                    int(stat.st_size),
                    float(stat.st_mtime),
                    digest,
                    ",".join(flags),
                )
            )
            inserted += 1
            if len(batch) >= 1000:
                conn.executemany(
                    """
                    INSERT OR IGNORE INTO files(
                      run_id, drive, role, path, extension, detected_type,
                      size_bytes, mtime, sha256, flags
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                    """,
                    batch,
                )
                conn.commit()
                batch.clear()
            if limit and inserted >= limit:
                break
        except OSError as exc:
            insert_error(conn, run_id, drive, path, repr(exc))

    if batch:
        conn.executemany(
            """
            INSERT OR IGNORE INTO files(
              run_id, drive, role, path, extension, detected_type,
              size_bytes, mtime, sha256, flags
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            batch,
        )
    conn.commit()
    return inserted


def latest_run_id(conn: sqlite3.Connection) -> int:
    row = conn.execute("SELECT id FROM scan_runs ORDER BY id DESC LIMIT 1").fetchone()
    if not row:
        raise SystemExit("No scan runs found. Run `scan` first.")
    return int(row[0])


def write_csv(path: Path, headers: list[str], rows: Iterable[tuple]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", newline="", encoding="utf-8") as handle:
        writer = csv.writer(handle)
        writer.writerow(headers)
        writer.writerows(rows)


def generate_reports(conn: sqlite3.Connection, output: Path, run_id: int) -> None:
    report_root = output / REPORT_DIR_NAME
    write_csv(
        report_root / f"run_{run_id}_by_drive.csv",
        ["drive", "role", "files", "bytes"],
        conn.execute(
            """
            SELECT drive, role, COUNT(*), SUM(size_bytes)
            FROM files
            WHERE run_id = ?
            GROUP BY drive, role
            ORDER BY COUNT(*) DESC
            """,
            (run_id,),
        ),
    )
    write_csv(
        report_root / f"run_{run_id}_by_extension.csv",
        ["extension", "files", "bytes"],
        conn.execute(
            """
            SELECT extension, COUNT(*), SUM(size_bytes)
            FROM files
            WHERE run_id = ?
            GROUP BY extension
            ORDER BY COUNT(*) DESC
            """,
            (run_id,),
        ),
    )
    write_csv(
        report_root / f"run_{run_id}_flagged.csv",
        ["drive", "path", "extension", "detected_type", "size_bytes", "flags"],
        conn.execute(
            """
            SELECT drive, path, extension, detected_type, size_bytes, flags
            FROM files
            WHERE run_id = ? AND flags <> ''
            ORDER BY drive, flags, path
            LIMIT 50000
            """,
            (run_id,),
        ),
    )
    write_csv(
        report_root / f"run_{run_id}_duplicate_candidates.csv",
        ["size_bytes", "sha256", "copies", "example_paths"],
        conn.execute(
            """
            SELECT size_bytes, COALESCE(sha256, 'hash_not_recorded'), COUNT(*),
                   GROUP_CONCAT(path, ' || ')
            FROM files
            WHERE run_id = ? AND size_bytes > 0
            GROUP BY size_bytes,
                     CASE
                       WHEN sha256 IS NOT NULL THEN sha256
                       ELSE 'size_only_candidate'
                     END
            HAVING COUNT(*) > 1
            ORDER BY COUNT(*) DESC, size_bytes DESC
            LIMIT 20000
            """,
            (run_id,),
        ),
    )
    write_csv(
        report_root / f"run_{run_id}_scan_errors.csv",
        ["drive", "path", "error"],
        conn.execute(
            """
            SELECT drive, path, error
            FROM scan_errors
            WHERE run_id = ?
            ORDER BY drive, path
            """,
            (run_id,),
        ),
    )


def print_summary(conn: sqlite3.Connection, run_id: int) -> None:
    total = conn.execute("SELECT COUNT(*), COALESCE(SUM(size_bytes), 0) FROM files WHERE run_id = ?", (run_id,)).fetchone()
    errors = conn.execute("SELECT COUNT(*) FROM scan_errors WHERE run_id = ?", (run_id,)).fetchone()[0]
    print(f"run_id={run_id}")
    print(f"files={total[0]}")
    print(f"bytes={total[1]}")
    print(f"errors={errors}")
    print("top_drives:")
    for drive, count in conn.execute(
        "SELECT drive, COUNT(*) FROM files WHERE run_id = ? GROUP BY drive ORDER BY COUNT(*) DESC LIMIT 12",
        (run_id,),
    ):
        print(f"  {drive}: {count}")


def cmd_list_drives(args: argparse.Namespace) -> None:
    config = load_config(args.config)
    for drive in configured_drives(config):
        status = "mounted" if drive.path.exists() else "missing"
        print(f"{drive.name}\t{status}\t{drive.path}\t{drive.role}")


def cmd_scan(args: argparse.Namespace) -> None:
    config = load_config(args.config)
    output = output_root(config)
    conn = connect(output / DEFAULT_DB_NAME)
    run_id = create_run(conn, args.mode, args.hash, args.config)
    audio_extensions = normalize_extensions(config)
    exclude_names = set(config.get("exclude_dir_names", []))
    selected = set(args.drive or [])

    drives = configured_drives(config)
    if args.root:
        drives = [
            Drive(
                name=args.root_name,
                path=args.root,
                role="ad_hoc_scan_root",
                priority=999,
            )
        ]
    if selected:
        drives = [drive for drive in drives if drive.name in selected]
    if not drives:
        raise SystemExit("No matching drives selected.")

    print(f"Starting run {run_id}. mode={args.mode} hash={args.hash}")
    for drive in sorted(drives, key=lambda item: item.priority, reverse=True):
        before = time.time()
        count = scan_drive(conn, run_id, drive, args.mode, args.hash, audio_extensions, exclude_names, args.limit_per_drive)
        elapsed = time.time() - before
        print(f"{drive.name}: recorded={count} elapsed_seconds={elapsed:.1f}")
    finish_run(conn, run_id)
    generate_reports(conn, output, run_id)
    print_summary(conn, run_id)
    print(f"reports={output / REPORT_DIR_NAME}")


def cmd_report(args: argparse.Namespace) -> None:
    config = load_config(args.config)
    output = output_root(config)
    conn = connect(output / DEFAULT_DB_NAME)
    run_id = args.run_id or latest_run_id(conn)
    generate_reports(conn, output, run_id)
    print_summary(conn, run_id)
    print(f"reports={output / REPORT_DIR_NAME}")


def build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="MC96ECOUNIVERSE audio recovery control plane")
    parser.add_argument("--config", type=Path, default=DEFAULT_CONFIG)
    sub = parser.add_subparsers(dest="command", required=True)

    sub.add_parser("list-drives")

    scan = sub.add_parser("scan")
    scan.add_argument("--mode", choices=["extensions", "deep"], default="extensions")
    scan.add_argument("--hash", choices=["none", "full"], default="none")
    scan.add_argument("--drive", action="append", help="Drive name from config. Repeat to select multiple drives.")
    scan.add_argument("--root", type=Path, help="Ad-hoc root path for targeted smoke tests or recovery folders.")
    scan.add_argument("--root-name", default="AD_HOC_ROOT", help="Name used in reports when --root is provided.")
    scan.add_argument("--limit-per-drive", type=int, help="Smoke-test limit for each selected drive.")

    report = sub.add_parser("report")
    report.add_argument("--run-id", type=int)
    return parser


def main(argv: list[str] | None = None) -> int:
    parser = build_parser()
    args = parser.parse_args(argv)
    if args.command == "list-drives":
        cmd_list_drives(args)
    elif args.command == "scan":
        cmd_scan(args)
    elif args.command == "report":
        cmd_report(args)
    else:
        parser.error(f"Unknown command: {args.command}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
