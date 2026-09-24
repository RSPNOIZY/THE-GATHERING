#!/usr/bin/env python3
"""
mc96_identity_master_scrape.py
Master search and indexing engine across all repos and vaults for:
- FISHMUSICINC.COM (Fish Music Inc. / domain / legacy & modern assets)
- NOIZY / NOIZY.AI / NOIZYLAB / NOIZYANTHROPIC
- ROBERT STEPHEN PLOWMAN (RSP / Identity / Copyrights / Registrations)

Outputs:
- docs/canonical/FISHMUSIC_NOIZY_RSP_MASTER_INDEX.md
- docs/canonical/IDENTITY_AND_CODE_DATABASE.sqlite
- docs/canonical/DUPLICATES_AND_PRUNING_MANIFEST.md
"""

import os
import re
import sqlite3
import hashlib
from pathlib import Path
from datetime import datetime

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
OUTPUT_DIR = ROOT / "docs" / "canonical"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = OUTPUT_DIR / "IDENTITY_AND_CODE_DATABASE.sqlite"
MD_INDEX = OUTPUT_DIR / "FISHMUSIC_NOIZY_RSP_MASTER_INDEX.md"
DUPES_MD = OUTPUT_DIR / "DUPLICATES_AND_PRUNING_MANIFEST.md"

SEARCH_PATHS = [
    Path("/Users/m2ultra/THE-GATHERING"),
    Path("/Users/m2ultra/NOIZYLAB"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Users/m2ultra/Desktop"),
    Path("/Users/m2ultra/Documents"),
    Path("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com/My Drive")
]

PATTERNS = {
    "FISHMUSIC": re.compile(r"fishmusic(inc)?(\.com)?", re.IGNORECASE),
    "RSP_IDENTITY": re.compile(r"robert\s+stephen\s+plowman|rsplowman|rspnoizy|rsp_001", re.IGNORECASE),
    "NOIZY_CORE": re.compile(r"noizy(\.ai|\.mesh|lab|beast|vault|stream|heaven)?", re.IGNORECASE),
    "CREDENTIAL_KEY": re.compile(r"(api[_-]?key|secret[_-]?key|token|auth[_-]?bearer|access[_-]?token|cf[_-]?token)\s*[:=]\s*['\"]?([a-zA-Z0-9_\-\.]{12,})['\"]?", re.IGNORECASE)
}

EXCLUDE_DIRS = {
    ".git", "node_modules", "DerivedData", "dist", "build", ".next", ".cache",
    "venv", ".venv", "env", "__pycache__", "Library/Caches"
}

def init_db(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            category TEXT,
            file_path TEXT,
            line_num INTEGER,
            matched_text TEXT,
            context TEXT,
            file_size INTEGER,
            modified_time REAL,
            file_hash TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS file_hashes (
            file_hash TEXT PRIMARY KEY,
            file_size INTEGER,
            first_path TEXT,
            occurrence_count INTEGER
        )
    """)
    conn.commit()

def compute_file_hash(filepath, block_size=65536):
    try:
        if filepath.stat().st_size > 50 * 1024 * 1024:  # Skip hashing >50MB
            return None
        hasher = hashlib.md5()
        with open(filepath, "rb") as f:
            for block in iter(lambda: f.read(block_size), b""):
                hasher.update(block)
        return hasher.hexdigest()
    except Exception:
        return None

def scan_ecosystem():
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cur = conn.cursor()

    total_scanned = 0
    matches_found = 0
    duplicate_files = []
    seen_hashes = {}

    print("🚀 Starting Deep Master Grep & Scrape for FishMusicInc, Noizy, & RSP Identity...")
    
    for base_dir in SEARCH_PATHS:
        if not base_dir.exists():
            print(f"⚠️ Skipping non-existent path: {base_dir}")
            continue
        print(f"📂 Scanning {base_dir} ...")

        for root, dirs, files in os.walk(base_dir, followlinks=False):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            for file in files:
                if file.startswith(".") and not file.startswith(".env"):
                    continue
                filepath = Path(root) / file
                total_scanned += 1
                if total_scanned % 5000 == 0:
                    print(f"  Scanned {total_scanned:,} files ({matches_found:,} matches found)...")

                try:
                    ext = filepath.suffix.lower()
                    if ext in [".png", ".jpg", ".jpeg", ".wav", ".mp3", ".aif", ".flac", ".zip", ".tar", ".gz", ".iso", ".dmg"]:
                        continue

                    stat = filepath.stat()
                    f_size = stat.st_size
                    f_mtime = stat.st_mtime

                    # Read text content safely
                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()

                    file_matched = False
                    for idx, line in enumerate(lines[:1000], start=1):  # Sample first 1000 lines
                        matched_cats = []
                        if PATTERNS["FISHMUSIC"].search(line):
                            matched_cats.append("FISHMUSIC")
                        if PATTERNS["RSP_IDENTITY"].search(line):
                            matched_cats.append("RSP_IDENTITY")
                        if PATTERNS["NOIZY_CORE"].search(line):
                            matched_cats.append("NOIZY_CORE")
                        if PATTERNS["CREDENTIAL_KEY"].search(line):
                            matched_cats.append("CREDENTIAL")

                        if matched_cats:
                            file_matched = True
                            for cat in matched_cats:
                                snippet = line.strip()[:200]
                                cur.execute("""
                                    INSERT INTO matches (category, file_path, line_num, matched_text, context, file_size, modified_time, file_hash)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                """, (cat, str(filepath), idx, snippet, snippet, f_size, f_mtime, ""))
                                matches_found += 1

                    if file_matched and f_size < 10 * 1024 * 1024:
                        f_hash = compute_file_hash(filepath)
                        if f_hash:
                            if f_hash in seen_hashes:
                                seen_hashes[f_hash].append(str(filepath))
                                duplicate_files.append((str(filepath), seen_hashes[f_hash][0], f_size))
                            else:
                                seen_hashes[f_hash] = [str(filepath)]

                except Exception:
                    continue

        conn.commit()

    print(f"\n✅ Scan complete! {total_scanned:,} files evaluated, {matches_found:,} matches indexed.")
    
    # Generate Markdown Summary
    generate_markdown_reports(conn, duplicate_files)
    conn.close()

def generate_markdown_reports(conn, duplicate_files):
    cur = conn.cursor()
    
    # Counts by category
    cur.execute("SELECT category, COUNT(DISTINCT file_path), COUNT(*) FROM matches GROUP BY category")
    cat_counts = cur.fetchall()

    with open(MD_INDEX, "w", encoding="utf-8") as f:
        f.write("# 🏛️ FISHMUSICINC.COM · NOIZY · ROBERT STEPHEN PLOWMAN MASTER CATALOG\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Database**: [`IDENTITY_AND_CODE_DATABASE.sqlite`](file://{DB_PATH})  \n\n")
        f.write("## 📊 Summary by Domain & Entity\n\n")
        f.write("| Entity / Category | Distinct Files | Total Matches |\n")
        f.write("| :--- | :--- | :--- |\n")
        for cat, f_count, m_count in cat_counts:
            f.write(f"| **{cat}** | {f_count:,} | {m_count:,} |\n")
        f.write("\n---\n\n")

        # Top FishMusic Findings
        f.write("## 🐟 1. FISHMUSICINC.COM Repos, Code & Assets\n\n")
        cur.execute("SELECT DISTINCT file_path, context FROM matches WHERE category='FISHMUSIC' LIMIT 50")
        rows = cur.fetchall()
        for path_str, ctx in rows:
            f.write(f"- [{Path(path_str).name}](file://{path_str})  \n  `{ctx}`\n")
        f.write("\n---\n\n")

        # Top RSP Identity Findings
        f.write("## 👑 2. Robert Stephen Plowman (RSP) Sovereign Identity & Copyrights\n\n")
        cur.execute("SELECT DISTINCT file_path, context FROM matches WHERE category='RSP_IDENTITY' LIMIT 50")
        rows = cur.fetchall()
        for path_str, ctx in rows:
            f.write(f"- [{Path(path_str).name}](file://{path_str})  \n  `{ctx}`\n")
        f.write("\n---\n\n")

        # Key Credential References
        f.write("## 🔐 3. Classified Sovereign Credentials & Secrets Targets\n\n")
        cur.execute("SELECT DISTINCT file_path, line_num FROM matches WHERE category='CREDENTIAL' LIMIT 50")
        rows = cur.fetchall()
        for path_str, line_num in rows:
            f.write(f"- [{Path(path_str).name}:{line_num}](file://{path_str}#L{line_num})\n")
        f.write("\n")

    with open(DUPES_MD, "w", encoding="utf-8") as f:
        f.write("# 🗑️ MC96 GLOBAL DUPLICATE & LOW-QUALITY PRUNING LEDGER\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Total Duplicates Identified**: {len(duplicate_files):,} files\n\n")
        f.write("| Duplicate Candidate (Secondary) | Canonical Source (Primary) | Size |\n")
        f.write("| :--- | :--- | :--- |\n")
        for dup_path, orig_path, size in duplicate_files[:200]:
            f.write(f"| [{Path(dup_path).name}](file://{dup_path}) | [{Path(orig_path).name}](file://{orig_path}) | {size:,} bytes |\n")
        f.write("\n> [!NOTE]\n> Duplicates are cataloged non-destructively for review before zero-loss archiving.\n")

    print(f"📄 Markdown index written to: {MD_INDEX}")
    print(f"📄 Duplicates manifest written to: {DUPES_MD}")

if __name__ == "__main__":
    scan_ecosystem()
