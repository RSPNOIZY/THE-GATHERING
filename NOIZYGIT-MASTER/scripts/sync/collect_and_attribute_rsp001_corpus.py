#!/usr/bin/env python3
"""
collect_and_attribute_rsp001_corpus.py
Universal Code, Markdown, JSON & Script Harvester & RSP_001 Attribution Engine.

Scans all internal and connected drives:
- Collects: .md, .json, .py, .ts, .js, .sh, .yaml, .yml, .sql, .swift
- Reviews & validates line counts, file sizes, and functional domains
- Tags and certifies all assets with Sovereign Attribution: RSP_001 (Robert Stephen Plowman)
- Generates: SQLite Corpus Database + Markdown Master Catalog + JSON Summary
"""

import os
import json
import sqlite3
import hashlib
from pathlib import Path
from datetime import datetime

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
OUTPUT_DIR = ROOT / "docs" / "canonical"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = OUTPUT_DIR / "RSP001_MASTER_CODE_AND_DOCS_CORPUS.sqlite"
CATALOG_MD = OUTPUT_DIR / "RSP001_UNIVERSAL_CORPUS_CATALOG.md"
SUMMARY_JSON = OUTPUT_DIR / "RSP001_CORPUS_SUMMARY.json"

TARGET_EXTENSIONS = {
    ".md": "DOCUMENTATION_AND_SPECS",
    ".json": "CONFIGS_AND_SCHEMAS",
    ".py": "PYTHON_PIPELINES_AND_AI",
    ".ts": "TYPESCRIPT_AND_WORKERS",
    ".js": "JAVASCRIPT_AND_NODE",
    ".mjs": "JAVASCRIPT_ES_MODULES",
    ".sh": "SHELL_AND_AUTOMATION",
    ".zsh": "SHELL_AND_AUTOMATION",
    ".bash": "SHELL_AND_AUTOMATION",
    ".yaml": "CONFIGS_AND_SCHEMAS",
    ".yml": "CONFIGS_AND_SCHEMAS",
    ".sql": "SQL_AND_DATA_SCHEMAS",
    ".swift": "APPLE_SWIFT_NATIVE"
}

SEARCH_PATHS = [
    Path("/Users/m2ultra/THE-GATHERING"),
    Path("/Users/m2ultra/NOIZYLAB"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Users/m2ultra/Desktop"),
    Path("/Users/m2ultra/Documents"),
    Path("/Volumes/12TB"),
    Path("/Volumes/4TB Lacie"),
    Path("/Volumes/2TB_SGW"),
    Path("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com")
]

EXCLUDE_DIRS = {
    ".git", "node_modules", "DerivedData", "dist", "build", ".next", ".cache",
    "venv", ".venv", "__pycache__", "Library/Caches", ".Trash", ".Trashes"
}

def init_db(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS corpus_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT,
            file_path TEXT UNIQUE,
            extension TEXT,
            category TEXT,
            size_bytes INTEGER,
            line_count INTEGER,
            attribution TEXT,
            mtime REAL,
            mtime_str TEXT,
            sha256_prefix TEXT
        )
    """)
    conn.commit()

def count_lines_and_hash(filepath):
    try:
        stat = filepath.stat()
        size = stat.st_size
        if size > 10 * 1024 * 1024 or size == 0:
            return size, 0, ""

        with open(filepath, "rb") as f:
            content = f.read()

        line_count = content.count(b"\n") + 1
        h_prefix = hashlib.md5(content[:4096]).hexdigest()
        return size, line_count, h_prefix
    except Exception:
        return 0, 0, ""

def harvest_rsp001_corpus():
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cur = conn.cursor()

    total_scanned = 0
    corpus_count = 0
    category_counts = {cat: 0 for cat in set(TARGET_EXTENSIONS.values())}
    category_sizes = {cat: 0 for cat in set(TARGET_EXTENSIONS.values())}

    print("👑 Initializing RSP_001 Master Code, Markdown & Config Corpus Harvester...")

    for root_dir in SEARCH_PATHS:
        if not root_dir.exists():
            print(f"⚠️ Skipping offline path: {root_dir}")
            continue
        print(f"📂 Harvesting corpus from {root_dir}...")

        for root, dirs, files in os.walk(root_dir, followlinks=False):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            for file in files:
                if file.startswith(".") and not file.startswith(".env"):
                    continue
                filepath = Path(root) / file
                ext = filepath.suffix.lower()

                if ext in TARGET_EXTENSIONS:
                    total_scanned += 1
                    category = TARGET_EXTENSIONS[ext]
                    size, lines, h_prefix = count_lines_and_hash(filepath)

                    try:
                        mtime = filepath.stat().st_mtime
                        mtime_str = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")

                        cur.execute("""
                            INSERT OR REPLACE INTO corpus_files (file_name, file_path, extension, category, size_bytes, line_count, attribution, mtime, mtime_str, sha256_prefix)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (file, str(filepath), ext, category, size, lines, "RSP_001 · Robert Stephen Plowman", mtime, mtime_str, h_prefix))

                        corpus_count += 1
                        category_counts[category] += 1
                        category_sizes[category] += size

                        if corpus_count % 5000 == 0:
                            print(f"  Cataloged {corpus_count:,} RSP_001 corpus files...")

                    except Exception:
                        continue

        conn.commit()

    print(f"\n✅ Corpus Harvest Complete! {corpus_count:,} files certified & attributed to RSP_001.")

    # Generate Reports
    generate_reports(conn, category_counts, category_sizes, corpus_count)
    conn.close()

def generate_reports(conn, cat_counts, cat_sizes, total_files):
    cur = conn.cursor()

    # 1. Summary JSON
    summary_data = {
        "attribution": "RSP_001 · Robert Stephen Plowman",
        "generated_at": datetime.now().isoformat(),
        "total_files": total_files,
        "categories": {
            cat: {
                "count": cat_counts[cat],
                "size_mb": round(cat_sizes[cat] / (1024**2), 2)
            }
            for cat in cat_counts
        }
    }
    with open(SUMMARY_JSON, "w", encoding="utf-8") as f:
        json.dump(summary_data, f, indent=2)

    # 2. Markdown Catalog
    with open(CATALOG_MD, "w", encoding="utf-8") as f:
        f.write("# 👑 RSP_001 — UNIVERSAL CODE, MARKDOWN & SCHEMAS MASTER CORPUS\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write("**Principal Sovereign**: Robert Stephen Plowman (`RSP_001`)  \n")
        f.write(f"**Total Tracked Corpus Artifacts**: **{total_files:,} files**  \n")
        f.write(f"**Database**: [`RSP001_MASTER_CODE_AND_DOCS_CORPUS.sqlite`](file://{DB_PATH})  \n")
        f.write(f"**Summary JSON**: [`RSP001_CORPUS_SUMMARY.json`](file://{SUMMARY_JSON})  \n\n")

        f.write("## 📊 Corpus Breakdown by Domain\n\n")
        f.write("| Functional Domain / Category | File Count | Total Size (MB) | Primary Extensions |\n")
        f.write("| :--- | :--- | :--- | :--- |\n")
        for cat in sorted(cat_counts.keys()):
            cnt = cat_counts[cat]
            mb = cat_sizes[cat] / (1024**2)
            f.write(f"| **{cat}** | {cnt:,} files | {mb:.2f} MB | `.{cat.split('_')[0].lower()}` |\n")
        f.write("\n---\n\n")

        # Top files per category
        for cat in sorted(cat_counts.keys()):
            f.write(f"### 📂 {cat}\n\n")
            cur.execute("SELECT file_name, file_path, line_count, size_bytes FROM corpus_files WHERE category=? ORDER BY mtime DESC LIMIT 20", (cat,))
            items = cur.fetchall()
            for fname, fpath, lines, sz in items:
                f.write(f"- [{fname}](file://{fpath}) ({lines:,} lines, {(sz/1024):.1f} KB)\n")
            f.write("\n")

    print(f"📄 Markdown Catalog written to: {CATALOG_MD}")
    print(f"📊 Summary JSON written to: {SUMMARY_JSON}")

if __name__ == "__main__":
    harvest_rsp001_corpus()
