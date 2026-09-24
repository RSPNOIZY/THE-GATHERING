#!/usr/bin/env python3
"""
master_timeline_indexer.py
Sovereign Empire Master Grep, Timeline Chronology & Cloud Audio Manifest Indexer.
Builds EMPIRE_CHRONOLOGY_AND_CATALOG.sqlite, EMPIRE_MASTER_CHRONOLOGY.md, and AUDIO_GOOGLEWORKSPACE_MANIFEST.md.
"""

import os
import sqlite3
import time
from datetime import datetime
from pathlib import Path

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
DB_PATH = ROOT / "EMPIRE_CHRONOLOGY_AND_CATALOG.sqlite"
CHRONO_MD_PATH = ROOT / "EMPIRE_MASTER_CHRONOLOGY.md"
AUDIO_MD_PATH = ROOT / "AUDIO_GOOGLEWORKSPACE_MANIFEST.md"

SEARCH_ROOTS = [
    ("/Users/m2ultra/THE-GATHERING", "THE-GATHERING"),
    ("/Users/m2ultra/NOIZYANTHROPIC", "NOIZYANTHROPIC"),
    ("/Users/m2ultra/Desktop/CLAUDE TODAY", "CLAUDE_TODAY"),
    ("/Users/m2ultra/Music", "LOCAL_MUSIC"),
    ("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com", "GDRIVE_RSPNOIZY"),
]

AUDIO_EXTS = {".wav", ".mp3", ".logicx", ".aif", ".aiff", ".flac", ".nki", ".m4a", ".aac", ".midi", ".mid"}
DOC_EXTS = {".md", ".txt", ".pdf", ".docx", ".rtf", ".csv", ".pages", ".numbers"}
CODE_EXTS = {".ts", ".js", ".mjs", ".cjs", ".py", ".swift", ".sh", ".sql", ".html", ".css", ".json", ".yml", ".yaml", ".toml", ".c", ".cpp", ".rs", ".go"}
CONFIG_EXTS = {".plist", ".jsonc", ".env", ".xml", ".ini", ".conf"}
DB_EXTS = {".sqlite", ".sqlite3", ".db", ".d1"}
TRANSCRIPT_EXTS = {".jsonl"}

EXCLUDE_DIRS = {"node_modules", ".git", ".next", ".cache", "dist", "build", "DerivedData", ".terramate", ".gradle", "venv", ".venv", "my_project_venv"}

def get_category(ext, name, path_str):
    ext_lower = ext.lower()
    name_lower = name.lower()
    
    if ext_lower in AUDIO_EXTS or ".logicx" in path_str:
        return "Audio/Music"
    if "transcript" in name_lower or "history" in name_lower or ext_lower in TRANSCRIPT_EXTS:
        return "Transcripts & Sessions"
    if ext_lower in DB_EXTS:
        return "Database"
    if ext_lower in CONFIG_EXTS or "config" in name_lower or ".env" in name_lower:
        return "Config & Infrastructure"
    if ext_lower in DOC_EXTS:
        return "Docs & Specs"
    if ext_lower in CODE_EXTS:
        return "Code & Apps"
    return "Other"

def extract_title(file_path):
    try:
        if file_path.stat().st_size > 5 * 1024 * 1024:
            return ""
        with open(file_path, "r", encoding="utf-8", errors="ignore") as f:
            for _ in range(10):
                line = f.readline()
                if not line:
                    break
                line = line.strip()
                if line.startswith("# ") or line.startswith("## ") or line.startswith("// ") or line.startswith("/* "):
                    return line.lstrip("#/* ").strip()[:100]
    except Exception:
        pass
    return ""

def init_database(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS assets")
    cur.execute("DROP TABLE IF EXISTS audio_cloud_manifest")
    cur.execute("""
        CREATE TABLE assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            ext TEXT,
            category TEXT NOT NULL,
            source_root TEXT NOT NULL,
            date_ymd TEXT,
            year TEXT,
            month TEXT,
            size_bytes INTEGER,
            size_mb REAL,
            path TEXT UNIQUE NOT NULL,
            title TEXT,
            is_audio INTEGER DEFAULT 0
        )
    """)
    cur.execute("CREATE INDEX idx_assets_date ON assets(date_ymd)")
    cur.execute("CREATE INDEX idx_assets_category ON assets(category)")
    cur.execute("CREATE INDEX idx_assets_year ON assets(year)")
    cur.execute("CREATE INDEX idx_assets_is_audio ON assets(is_audio)")
    
    cur.execute("""
        CREATE TABLE audio_cloud_manifest (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            format TEXT,
            source_path TEXT NOT NULL,
            target_gdrive_path TEXT,
            size_bytes INTEGER,
            size_mb REAL,
            modified_date TEXT
        )
    """)
    conn.commit()
    return conn

def scan_all():
    print(f"Initializing SQLite database at: {DB_PATH}")
    conn = init_database(DB_PATH)
    cur = conn.cursor()
    
    total_scanned = 0
    total_audio = 0
    batch = []
    audio_batch = []
    
    start_time = time.time()
    
    for root_dir, source_tag in SEARCH_ROOTS:
        p_root = Path(root_dir)
        if not p_root.exists():
            print(f"Skipping non-existent root: {root_dir}")
            continue
        
        print(f"Scanning [{source_tag}]: {root_dir}...")
        for root, dirs, files in os.walk(root_dir, followlinks=False):
            # Prune excluded directories in place
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            # Check if directory itself is a package like .logicx
            if root.endswith(".logicx"):
                try:
                    stat = os.stat(root)
                    mtime = datetime.fromtimestamp(stat.st_mtime)
                    ymd = mtime.strftime("%Y-%m-%d")
                    year = mtime.strftime("%Y")
                    month = mtime.strftime("%Y-%m")
                    # rough dir size
                    size_bytes = sum(os.path.getsize(os.path.join(dirpath, f)) for dirpath, _, filenames in os.walk(root) for f in filenames if not f.startswith("."))
                    size_mb = round(size_bytes / (1024 * 1024), 2)
                    name = os.path.basename(root)
                    batch.append((name, ".logicx", "Audio/Music", source_tag, ymd, year, month, size_bytes, size_mb, root, "Logic Pro Project", 1))
                    audio_batch.append((name, "logicx", root, f"GoogleDrive-rspnoizy@gmail.com/NOIZY_AUDIO_VAULT/{name}", size_bytes, size_mb, ymd))
                    total_scanned += 1
                    total_audio += 1
                except Exception:
                    pass
                dirs[:] = [] # don't descend inside .logicx
                continue

            for f in files:
                if f.startswith("."):
                    continue
                file_path = os.path.join(root, f)
                try:
                    stat = os.stat(file_path)
                    mtime = datetime.fromtimestamp(stat.st_mtime)
                    ymd = mtime.strftime("%Y-%m-%d")
                    year = mtime.strftime("%Y")
                    month = mtime.strftime("%Y-%m")
                    size_bytes = stat.st_size
                    size_mb = round(size_bytes / (1024 * 1024), 3)
                    ext = os.path.splitext(f)[1].lower()
                    
                    cat = get_category(ext, f, file_path)
                    is_aud = 1 if cat == "Audio/Music" else 0
                    title = extract_title(Path(file_path)) if cat in ["Docs & Specs", "Code & Apps"] else ""
                    
                    batch.append((f, ext, cat, source_tag, ymd, year, month, size_bytes, size_mb, file_path, title, is_aud))
                    
                    if is_aud:
                        target_path = f"GoogleDrive-rspnoizy@gmail.com/NOIZY_AUDIO_VAULT/{year}/{f}"
                        audio_batch.append((f, ext.lstrip("."), file_path, target_path, size_bytes, size_mb, ymd))
                        total_audio += 1
                        
                    total_scanned += 1
                    
                    if len(batch) >= 2000:
                        cur.executemany("""
                            INSERT OR IGNORE INTO assets 
                            (name, ext, category, source_root, date_ymd, year, month, size_bytes, size_mb, path, title, is_audio)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, batch)
                        cur.executemany("""
                            INSERT OR IGNORE INTO audio_cloud_manifest
                            (name, format, source_path, target_gdrive_path, size_bytes, size_mb, modified_date)
                            VALUES (?, ?, ?, ?, ?, ?, ?)
                        """, audio_batch)
                        conn.commit()
                        batch = []
                        audio_batch = []
                        print(f"  Processed {total_scanned:,} files ({total_audio:,} audio)...")
                except Exception:
                    continue
                    
    if batch:
        cur.executemany("""
            INSERT OR IGNORE INTO assets 
            (name, ext, category, source_root, date_ymd, year, month, size_bytes, size_mb, path, title, is_audio)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, batch)
        cur.executemany("""
            INSERT OR IGNORE INTO audio_cloud_manifest
            (name, format, source_path, target_gdrive_path, size_bytes, size_mb, modified_date)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, audio_batch)
        conn.commit()

    elapsed = round(time.time() - start_time, 2)
    print(f"\n✅ Total Scanned & Indexed: {total_scanned:,} assets in {elapsed}s")
    print(f"🎵 Audio Assets Cataloged: {total_audio:,}")
    
    # Generate Markdown Chronology
    generate_markdown_chronology(conn)
    generate_audio_manifest(conn)
    conn.close()

def generate_markdown_chronology(conn):
    cur = conn.cursor()
    
    cur.execute("SELECT COUNT(*), SUM(size_mb) FROM assets")
    total_count, total_mb = cur.fetchone()
    total_gb = round((total_mb or 0) / 1024, 2)
    
    cur.execute("SELECT category, COUNT(*), SUM(size_mb) FROM assets GROUP BY category ORDER BY COUNT(*) DESC")
    cat_stats = cur.fetchall()
    
    cur.execute("SELECT year, COUNT(*), SUM(size_mb) FROM assets WHERE year >= '2023' GROUP BY year ORDER BY year DESC")
    year_stats = cur.fetchall()
    
    md = f"""# 🏛️ NOIZY EMPIRE — Master Chronology & Universal Catalog

- **Database**: [`EMPIRE_CHRONOLOGY_AND_CATALOG.sqlite`](file://{DB_PATH})
- **Total Indexed Assets**: `{total_count:,}` files ({total_gb} GB)
- **Generated**: `{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}`

---

## 📊 Summary by Category

| Category | Total Files | Total Size (MB) |
| :--- | :---: | :---: |
"""
    for cat, count, sz in cat_stats:
        md += f"| **{cat}** | `{count:,}` | `{round(sz or 0, 2):,}` MB |\n"

    md += "\n---\n\n## 📅 Timeline Distribution by Year\n\n| Year | Total Files | Total Size (MB) |\n| :---: | :---: | :---: |\n"
    for yr, count, sz in year_stats:
        md += f"| **{yr}** | `{count:,}` | `{round(sz or 0, 2):,}` MB |\n"

    md += "\n---\n\n## 🌟 Key Canonical Documents & Vault Assets (Recent Chronology)\n\n"
    
    cur.execute("""
        SELECT name, date_ymd, category, size_mb, path, title 
        FROM assets 
        WHERE category IN ('Docs & Specs', 'Transcripts & Sessions') 
        ORDER BY date_ymd DESC 
        LIMIT 60
    """)
    recent_docs = cur.fetchall()
    
    md += "| Date | Document Name | Category | Size | Title / Focus | Path |\n| :---: | :--- | :---: | :---: | :--- | :--- |\n"
    for name, dt, cat, sz, path, title in recent_docs:
        t = title or name
        md += f"| `{dt}` | **{name}** | {cat} | `{sz} MB` | {t} | [`link`](file://{path}) |\n"

    with open(CHRONO_MD_PATH, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"Generated Chronology Markdown: {CHRONO_MD_PATH}")

def generate_audio_manifest(conn):
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*), SUM(size_mb) FROM audio_cloud_manifest")
    count, total_mb = cur.fetchone()
    total_gb = round((total_mb or 0) / 1024, 2)
    
    cur.execute("SELECT format, COUNT(*), SUM(size_mb) FROM audio_cloud_manifest GROUP BY format ORDER BY COUNT(*) DESC")
    format_stats = cur.fetchall()
    
    cur.execute("SELECT name, format, modified_date, size_mb, source_path, target_gdrive_path FROM audio_cloud_manifest ORDER BY modified_date DESC LIMIT 100")
    recent_audio = cur.fetchall()
    
    md = f"""# 🎵 NOIZY Audio & Music IP Cloud Manifest (Google Workspace 5TB)

- **Target Cloud Account**: `rspnoizy@gmail.com` (5TB Google Workspace Cloud Storage)
- **Local Mount**: [`/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com`](file:///Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com)
- **Total Audio Files**: `{count:,}` ({total_gb} GB)
- **Generated**: `{datetime.utcnow().strftime('%Y-%m-%d %H:%M:%S UTC')}`

---

## 🎼 Audio Formats Breakdown

| Format | Files | Size (MB) |
| :--- | :---: | :---: |
"""
    for fmt, c, sz in format_stats:
        md += f"| **.{fmt}** | `{c:,}` | `{round(sz or 0, 2):,}` MB |\n"

    md += "\n---\n\n## 🎧 Top & Recent Audio Assets Mapped to Cloud\n\n"
    md += "| Date | Track / Session Name | Format | Size | Source Location | Cloud Destination |\n| :---: | :--- | :---: | :---: | :--- | :--- |\n"
    
    for name, fmt, dt, sz, src, dest in recent_audio:
        md += f"| `{dt}` | **{name}** | `.{fmt}` | `{sz} MB` | [`source`](file://{src}) | `{dest}` |\n"
        
    with open(AUDIO_MD_PATH, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"Generated Audio Cloud Manifest: {AUDIO_MD_PATH}")

if __name__ == "__main__":
    scan_all()
