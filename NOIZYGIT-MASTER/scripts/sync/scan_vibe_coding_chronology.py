#!/usr/bin/env python3
"""
scan_vibe_coding_chronology.py
Master Chronological Scanner for 2 Years of Vibe Coding across NOIZYWORLD.

Detects and indexes:
- Rapid prototyping scripts, AI prompt templates, agent loops, ideas vaults
- Common NOIZY names: GABRIEL, LUCY, AEON, MC96, HEAVEN, CODEMASTER, GORUNFREE, NOIZYBEAST, NOIZYSTREAM, NOIZYVAULT, etc.
- Date Range: Past 2 Years (2024 - 2026)
- Formats: .py, .ts, .js, .mjs, .sh, .html, .swift, .json, .md, .prompt, .txt
"""

import os
import re
import sqlite3
from pathlib import Path
from datetime import datetime, timedelta

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
OUTPUT_DIR = ROOT / "docs" / "canonical"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = OUTPUT_DIR / "VIBE_CODING_MASTER_REGISTRY.sqlite"
MD_CHRONOLOGY = OUTPUT_DIR / "VIBE_CODING_2YEAR_MASTER_CHRONOLOGY.md"
MD_PERSONAS = OUTPUT_DIR / "VIBE_CODING_PERSONA_MATRIX.md"

SEARCH_PATHS = [
    Path("/Users/m2ultra/THE-GATHERING"),
    Path("/Users/m2ultra/NOIZYLAB"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Users/m2ultra/Desktop"),
    Path("/Users/m2ultra/Documents"),
    Path("/Users/m2ultra/Library/Application Support/Claude"),
    Path("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com")
]

VIBE_KEYWORDS = {
    "GABRIEL": re.compile(r"\bgabriel\b", re.IGNORECASE),
    "LUCY": re.compile(r"\blucy\b", re.IGNORECASE),
    "AEON": re.compile(r"\baeon(-god-kernel|-mega|-power)?\b", re.IGNORECASE),
    "MC96_MISSIONCONTROL": re.compile(r"\b(mc96|missioncontrol(96)?)\b", re.IGNORECASE),
    "CODEMASTER": re.compile(r"\bcodemaster\b", re.IGNORECASE),
    "GORUNFREE": re.compile(r"\bgorunfree\b", re.IGNORECASE),
    "NOIZY_CORE": re.compile(r"\bnoizy(beast|vault|stream|heaven|lab|win)?\b", re.IGNORECASE),
    "ALEX_WARDEN": re.compile(r"\balex\s+warden\b", re.IGNORECASE),
    "ENGR_KEITH": re.compile(r"\b(engr\s+keith|keith)\b", re.IGNORECASE),
    "POPS": re.compile(r"\bpops\b", re.IGNORECASE),
    "CORLEONE": re.compile(r"\b(corleone|michael\s+corleone)\b", re.IGNORECASE),
    "SHIRLEY_MARIE": re.compile(r"\bshirley\s+marie\b", re.IGNORECASE),
    "DREAM_MAGENTA": re.compile(r"\b(dream|magenta|dreamchamber)\b", re.IGNORECASE),
    "VIBE_PROMPT": re.compile(r"\b(vibe\s*coding|system_prompt|autonomous_agent|zero_latency|voice_bridge|sound_design)\b", re.IGNORECASE)
}

VIBE_EXTENSIONS = {
    ".py", ".ts", ".js", ".mjs", ".sh", ".html", ".swift", ".json", ".md", ".prompt", ".txt", ".sql", ".yaml", ".yml"
}

EXCLUDE_DIRS = {
    ".git", "node_modules", "DerivedData", "dist", "build", ".next", ".cache",
    "venv", ".venv", "__pycache__", "Library/Caches"
}

TWO_YEARS_AGO = (datetime.now() - timedelta(days=730)).timestamp()

def init_db(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS vibe_sessions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT,
            file_path TEXT UNIQUE,
            file_ext TEXT,
            size_bytes INTEGER,
            mtime REAL,
            mtime_str TEXT,
            matched_keywords TEXT,
            primary_persona TEXT,
            snippet TEXT,
            line_count INTEGER
        )
    """)
    conn.commit()

def scan_vibe_coding():
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cur = conn.cursor()

    total_scanned = 0
    vibe_files_found = 0
    records = []

    print("🚀 Starting 2-Year Vibe Coding Deep Scan across NOIZYWORLD...")

    for root_dir in SEARCH_PATHS:
        if not root_dir.exists():
            print(f"⚠️ Skipping offline path: {root_dir}")
            continue
        print(f"📂 Scanning vibe code in {root_dir}...")

        for root, dirs, files in os.walk(root_dir, followlinks=False):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            for file in files:
                if file.startswith(".") and not file.startswith(".env"):
                    continue
                filepath = Path(root) / file
                ext = filepath.suffix.lower()

                if ext not in VIBE_EXTENSIONS:
                    continue

                total_scanned += 1
                if total_scanned % 5000 == 0:
                    print(f"  Scanned {total_scanned:,} code files ({vibe_files_found:,} vibe sessions found)...")

                try:
                    stat = filepath.stat()
                    mtime = stat.st_mtime
                    
                    # Filter for past 2 years (or important canonical vaults)
                    if mtime < TWO_YEARS_AGO and "THE-GATHERING" not in str(filepath):
                        continue

                    f_size = stat.st_size
                    if f_size > 5 * 1024 * 1024 or f_size == 0:
                        continue

                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read(50000)  # read first 50KB

                    matched_keys = []
                    primary_persona = "GENERAL_NOIZY"
                    for kw_name, regex in VIBE_KEYWORDS.items():
                        if regex.search(content):
                            matched_keys.append(kw_name)
                            if kw_name in ["GABRIEL", "LUCY", "ALEX_WARDEN", "ENGR_KEITH", "POPS", "CORLEONE", "SHIRLEY_MARIE", "DREAM_MAGENTA"]:
                                primary_persona = kw_name

                    if matched_keys:
                        vibe_files_found += 1
                        mtime_str = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")
                        
                        # Extract first meaningful header or snippet
                        lines = [l.strip() for l in content.splitlines() if l.strip() and not l.strip().startswith("//") and not l.strip().startswith("#")]
                        snippet = lines[0][:150] if lines else file
                        line_count = content.count("\n") + 1

                        cur.execute("""
                            INSERT OR REPLACE INTO vibe_sessions (file_name, file_path, file_ext, size_bytes, mtime, mtime_str, matched_keywords, primary_persona, snippet, line_count)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """, (file, str(filepath), ext, f_size, mtime, mtime_str, ",".join(matched_keys), primary_persona, snippet, line_count))
                        
                        records.append({
                            "name": file,
                            "path": str(filepath),
                            "ext": ext,
                            "size": f_size,
                            "mtime": mtime,
                            "mtime_str": mtime_str,
                            "keywords": matched_keys,
                            "persona": primary_persona,
                            "snippet": snippet,
                            "lines": line_count
                        })

                except Exception:
                    continue

        conn.commit()

    print(f"\n✅ Scan Complete! {total_scanned:,} files scanned, {vibe_files_found:,} Vibe Coding artifacts indexed.")

    # Generate Markdown Chronology & Persona Matrix
    generate_markdown_chronology(conn, records)
    conn.close()

def generate_markdown_chronology(conn, records):
    cur = conn.cursor()

    # Sort records chronologically (newest first)
    records.sort(key=lambda x: x["mtime"], reverse=True)

    with open(MD_CHRONOLOGY, "w", encoding="utf-8") as f:
        f.write("# ⚡ 2-YEAR NOIZYWORLD VIBE CODING MASTER CHRONOLOGY\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Total Vibe Coding Artifacts**: {len(records):,} files  \n")
        f.write(f"**Database**: [`VIBE_CODING_MASTER_REGISTRY.sqlite`](file://{DB_PATH})  \n\n")

        f.write("## 📅 Chronological Timeline of Vibe Coding & Prompts\n\n")
        f.write("| Timestamp | Artifact / Script | Persona / Domain | Ext | Size | Lines |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- | :--- |\n")
        
        for r in records[:300]:
            f.write(f"| `{r['mtime_str']}` | [{r['name']}](file://{r['path']}) | **{r['persona']}** | `{r['ext']}` | {(r['size']/1024):.1f} KB | {r['lines']} |\n")

        f.write("\n> [!NOTE]\n> Full 2-year timeline containing all entries is persisted in `VIBE_CODING_MASTER_REGISTRY.sqlite`.\n")

    with open(MD_PERSONAS, "w", encoding="utf-8") as f:
        f.write("# 👑 VIBE CODING & PROMPT MATRIX BY COUNCIL PERSONA\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n\n")

        cur.execute("SELECT primary_persona, COUNT(*), SUM(size_bytes) FROM vibe_sessions GROUP BY primary_persona ORDER BY COUNT(*) DESC")
        persona_counts = cur.fetchall()

        f.write("## 📊 Persona Distribution\n\n")
        f.write("| Council Persona / Domain | Total Artifacts | Total Code Size |\n")
        f.write("| :--- | :--- | :--- |\n")
        for p, count, total_sz in persona_counts:
            mb = (total_sz or 0) / (1024**2)
            f.write(f"| **{p}** | {count:,} files | {mb:.2f} MB |\n")
        f.write("\n---\n\n")

        for p, _, _ in persona_counts:
            f.write(f"### 🌟 Persona: {p}\n\n")
            cur.execute("SELECT file_name, file_path, mtime_str, snippet FROM vibe_sessions WHERE primary_persona=? ORDER BY mtime DESC LIMIT 25", (p,))
            p_rows = cur.fetchall()
            for fname, fpath, mt_str, snip in p_rows:
                f.write(f"- `{mt_str}`: [{fname}](file://{fpath})  \n  `{snip}`\n")
            f.write("\n")

    print(f"📄 Vibe Chronology written to: {MD_CHRONOLOGY}")
    print(f"📄 Persona Matrix written to: {MD_PERSONAS}")

if __name__ == "__main__":
    scan_vibe_coding()
