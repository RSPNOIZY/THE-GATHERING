#!/usr/bin/env python3
"""
scan_sovereign_domains.py
Master Harvester & Cataloger for the 10 Sovereign Domain Pillars:
- NOIZYFISH
- NOIZYVOX
- NOIZYKIDS.COM
- NOIZYLAB.CA
- myFAMILY.ai
- OXYGEN.io
- AQ.IO
- AQuarium.io
- THE-GATHERING.io
- THE-DREAMCHAMBER.io
"""

import os
import re
import json
import sqlite3
from pathlib import Path
from datetime import datetime

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
DOMAINS_HUB = ROOT / "packages" / "sovereign-domains-hub"
DOMAINS_SPEC = DOMAINS_HUB / "sovereign_domains_registry.json"
OUTPUT_DIR = ROOT / "docs" / "canonical"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = OUTPUT_DIR / "SOVEREIGN_DOMAINS_AND_BRANDS.sqlite"
CATALOG_MD = OUTPUT_DIR / "SOVEREIGN_DOMAINS_AND_BRANDS_CATALOG.md"

SEARCH_PATHS = [
    Path("/Users/m2ultra/THE-GATHERING"),
    Path("/Users/m2ultra/NOIZYLAB"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Users/m2ultra/Desktop"),
    Path("/Users/m2ultra/Documents"),
    Path("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com")
]

DOMAIN_PATTERNS = {
    "NOIZYFISH": re.compile(r"\b(noizyfish|fishmusic(inc)?(\.com)?)\b", re.IGNORECASE),
    "NOIZYVOX": re.compile(r"\bnoizyvox(\.ai)?\b", re.IGNORECASE),
    "NOIZYKIDS.COM": re.compile(r"\bnoizykids(\.com)?\b", re.IGNORECASE),
    "NOIZYLAB.CA": re.compile(r"\bnoizylab(\.ca)?\b", re.IGNORECASE),
    "myFAMILY.ai": re.compile(r"\bmyfamily(\.ai)?\b", re.IGNORECASE),
    "OXYGEN.io": re.compile(r"\boxygen(\.io)?\b", re.IGNORECASE),
    "AQ.IO": re.compile(r"\baq\.io\b", re.IGNORECASE),
    "AQuarium.io": re.compile(r"\baquarium(\.io)?\b", re.IGNORECASE),
    "THE-GATHERING.io": re.compile(r"\b(the-gathering(\.io)?|gathering\.io)\b", re.IGNORECASE),
    "THE-DREAMCHAMBER.io": re.compile(r"\b(the-dreamchamber(\.io)?|dreamchamber(\.io)?)\b", re.IGNORECASE)
}

EXCLUDE_DIRS = {
    ".git", "node_modules", "DerivedData", "dist", "build", ".next", ".cache",
    "venv", ".venv", "__pycache__", "Library/Caches"
}

def init_db(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS domain_assets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            domain_key TEXT,
            file_name TEXT,
            file_path TEXT,
            line_num INTEGER,
            snippet TEXT,
            file_size INTEGER,
            mtime REAL
        )
    """)
    conn.commit()

def scan_domains():
    with open(DOMAINS_SPEC, "r") as f:
        spec = json.load(f)["domains"]

    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cur = conn.cursor()

    total_scanned = 0
    matches_found = 0
    domain_match_counts = {k: 0 for k in DOMAIN_PATTERNS}

    print("🌐 Scanning ecosystem for 10 Sovereign Domain Pillars...")

    for root_dir in SEARCH_PATHS:
        if not root_dir.exists():
            continue
        print(f"📂 Searching {root_dir}...")

        for root, dirs, files in os.walk(root_dir, followlinks=False):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            for file in files:
                if file.startswith(".") and not file.startswith(".env"):
                    continue
                filepath = Path(root) / file
                total_scanned += 1

                try:
                    ext = filepath.suffix.lower()
                    if ext in [".png", ".jpg", ".jpeg", ".wav", ".mp3", ".flac", ".zip", ".dmg", ".tar", ".gz"]:
                        continue

                    f_size = filepath.stat().st_size
                    if f_size > 5 * 1024 * 1024:
                        continue

                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()

                    for idx, line in enumerate(lines[:1000], start=1):
                        for d_key, regex in DOMAIN_PATTERNS.items():
                            if regex.search(line):
                                snippet = line.strip()[:200]
                                cur.execute("""
                                    INSERT INTO domain_assets (domain_key, file_name, file_path, line_num, snippet, file_size, mtime)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                """, (d_key, file, str(filepath), idx, snippet, f_size, filepath.stat().st_mtime))
                                matches_found += 1
                                domain_match_counts[d_key] += 1

                except Exception:
                    continue

        conn.commit()

    print(f"\n✅ Scan Complete! {total_scanned:,} files scanned, {matches_found:,} domain references found.")
    
    # Generate Markdown Catalog
    generate_catalog_markdown(conn, spec, domain_match_counts)
    conn.close()

def generate_catalog_markdown(conn, spec, match_counts):
    cur = conn.cursor()

    with open(CATALOG_MD, "w", encoding="utf-8") as f:
        f.write("# 👑 MC96ECOUNIVERSE — 10 SOVEREIGN DOMAINS & BRANDS MASTER CATALOG\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write("**Architecture**: 4.0.0-SOVEREIGN  \n")
        f.write(f"**Database**: [`SOVEREIGN_DOMAINS_AND_BRANDS.sqlite`](file://{DB_PATH})  \n\n")

        f.write("## 🌐 Portfolio Matrix Overview\n\n")
        f.write("| Pillar Key | Canonical Domain | Domain Category | Council Persona | Code & Asset References |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        
        for k, d in spec.items():
            cnt = match_counts.get(k, 0)
            f.write(f"| **{k}** | `{d['canonical_domain']}` | {d['category']} | {d['persona_alignment']} | **{cnt:,} matches** |\n")
            
        f.write("\n---\n\n")

        f.write("## 🏛️ Deep Sovereign Domain Specifications\n\n")
        for k, d in spec.items():
            f.write(f"### 🚀 {k} (`{d['canonical_domain']}`)\n\n")
            f.write(f"- **Category**: {d['category']}\n")
            f.write(f"- **Council Persona**: `{d['persona_alignment']}`\n")
            f.write(f"- **Technical Architecture**: `{d['architecture']}`\n")
            f.write(f"- **Core Assets**: {d['assets']}\n\n")
            f.write("#### 📂 Key Code & Architecture References:\n\n")
            
            cur.execute("SELECT DISTINCT file_name, file_path, line_num, snippet FROM domain_assets WHERE domain_key=? LIMIT 15", (k,))
            rows = cur.fetchall()
            if rows:
                for fname, fpath, line, snip in rows:
                    f.write(f"- [{fname}:{line}](file://{fpath}#L{line}) — `{snip}`\n")
            else:
                f.write("- *Ready for canonical deployment from monorepo master templates.*\n")
            f.write("\n---\n\n")

    print(f"📄 Catalog written to: {CATALOG_MD}")

if __name__ == "__main__":
    scan_domains()
