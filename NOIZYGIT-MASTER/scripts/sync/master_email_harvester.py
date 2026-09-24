#!/usr/bin/env python3
"""
master_email_harvester.py
Master Email, Contact & Correspondence Harvester for MC96ECOUNIVERSE.

Scans all internal repositories, documents, mail directories, and external drives:
- Extracts valid email addresses and contact associations
- Classifies by Domain & Persona:
  • Sovereign Founder (rspnoizy@gmail.com, rsplowman@icloud.com)
  • Fish Music Inc. (*@fishmusicinc.com)
  • NOIZY Universe (*@noizy.ai, *@noizylab.ca, *@noizykids.com)
  • Cloud & Developer Infrastructure (Apple, Cloudflare, Anthropic, Stripe, etc.)
  • Collaborators, Clients & Invoicing Contacts
- Generates SQLite Database + Markdown Catalog + Clean CSV Directory
"""

import os
import re
import sqlite3
import csv
from pathlib import Path
from datetime import datetime

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
OUTPUT_DIR = ROOT / "docs" / "canonical"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = OUTPUT_DIR / "MASTER_EMAIL_AND_CONTACTS_REGISTRY.sqlite"
CATALOG_MD = OUTPUT_DIR / "MASTER_EMAIL_AND_CONTACTS_CATALOG.md"
CSV_CONTACTS = OUTPUT_DIR / "SOVEREIGN_CONTACTS_DIRECTORY.csv"

EMAIL_REGEX = re.compile(r"\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b")

SEARCH_PATHS = [
    Path("/Users/m2ultra/Documents"),
    Path("/Users/m2ultra/Desktop"),
    Path("/Users/m2ultra/THE-GATHERING"),
    Path("/Users/m2ultra/NOIZYLAB"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Users/m2ultra/Library/Mail"),
    Path("/Volumes/12TB"),
    Path("/Volumes/4TB Lacie"),
    Path("/Volumes/2TB_SGW"),
    Path("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com")
]

EXCLUDE_DIRS = {
    ".git", "node_modules", "DerivedData", "dist", "build", ".next", ".cache",
    "venv", ".venv", "__pycache__", "Library/Caches", ".Trash", ".Trashes"
}

DISCARD_PATTERNS = {
    "example.com", "your-email", "domain.com", "sentry.io", "w3.org", "schema.org",
    "github.com/users", "noreply", "no-reply", "email.com", "test.com", "foo.com",
    "sample.com", "tempuri.org", "w3schools", "2x.png", "1x.png", "placeholder"
}

def init_db(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS emails (
            email TEXT PRIMARY KEY,
            domain TEXT,
            category TEXT,
            occurrence_count INTEGER,
            first_source_path TEXT,
            last_seen_mtime REAL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS email_occurrences (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            email TEXT,
            file_path TEXT,
            line_num INTEGER,
            context TEXT,
            mtime REAL
        )
    """)
    conn.commit()

def classify_email(email):
    email_lower = email.lower()
    domain = email_lower.split("@")[-1]

    if "rspnoizy" in email_lower or "rsplowman" in email_lower:
        return "SOVEREIGN_FOUNDER"
    elif "fishmusic" in domain:
        return "FISH_MUSIC_INC"
    elif any(d in domain for d in ["noizy.ai", "noizylab.ca", "noizyvox.ai", "noizykids.com", "the-gathering.io", "myfamily.ai"]):
        return "NOIZY_ECOSYSTEM"
    elif any(d in domain for d in ["cloudflare.com", "anthropic.com", "openai.com", "apple.com", "google.com", "github.com", "stripe.com", "proton.me", "protonmail.com"]):
        return "INFRASTRUCTURE_AND_VENDOR"
    elif any(d in domain for d in ["cra-arc.gc.ca", "td.com", "rbc.com", "bmo.com", "scotiabank.com", "cibc.com"]):
        return "FINANCIAL_AND_TAX"
    else:
        return "COLLABORATOR_OR_CLIENT"

def is_valid_email(email):
    email_lower = email.lower()
    if len(email) > 100 or len(email) < 6:
        return False
    if any(d in email_lower for d in DISCARD_PATTERNS):
        return False
    if any(ext in email_lower for ext in [".png", ".jpg", ".gif", ".js", ".ts", ".css", ".wasm"]):
        return False
    return True

def harvest_emails():
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cur = conn.cursor()

    total_scanned = 0
    unique_emails = {}

    print("📧 Starting Master Email & Contact Harvester across NOIZYWORLD...")

    for root_dir in SEARCH_PATHS:
        if not root_dir.exists():
            print(f"⚠️ Skipping offline path: {root_dir}")
            continue
        print(f"📂 Harvesting emails from {root_dir}...")

        for root, dirs, files in os.walk(root_dir, followlinks=False):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            for file in files:
                if file.startswith(".") and not file.startswith(".env"):
                    continue
                filepath = Path(root) / file
                total_scanned += 1
                if total_scanned % 10000 == 0:
                    print(f"  Scanned {total_scanned:,} files ({len(unique_emails):,} unique emails cataloged)...")

                try:
                    ext = filepath.suffix.lower()
                    if ext in [".png", ".jpg", ".wav", ".mp3", ".flac", ".zip", ".tar", ".dmg", ".iso", ".bin"]:
                        continue

                    f_size = filepath.stat().st_size
                    if f_size > 5 * 1024 * 1024 or f_size == 0:
                        continue

                    f_mtime = filepath.stat().st_mtime

                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        lines = f.readlines()

                    for idx, line in enumerate(lines[:1000], start=1):
                        found_emails = EMAIL_REGEX.findall(line)
                        for em in found_emails:
                            if is_valid_email(em):
                                em_clean = em.lower()
                                domain = em_clean.split("@")[-1]
                                cat = classify_email(em_clean)

                                if em_clean in unique_emails:
                                    unique_emails[em_clean]["count"] += 1
                                    if f_mtime > unique_emails[em_clean]["last_seen"]:
                                        unique_emails[em_clean]["last_seen"] = f_mtime
                                else:
                                    unique_emails[em_clean] = {
                                        "domain": domain,
                                        "category": cat,
                                        "count": 1,
                                        "first_source": str(filepath),
                                        "last_seen": f_mtime
                                    }

                                cur.execute("""
                                    INSERT INTO email_occurrences (email, file_path, line_num, context, mtime)
                                    VALUES (?, ?, ?, ?, ?)
                                """, (em_clean, str(filepath), idx, line.strip()[:200], f_mtime))

                except Exception:
                    continue

        conn.commit()

    # Bulk insert unique emails
    print(f"\n📊 Persisting {len(unique_emails):,} unique emails to database...")
    for em, data in unique_emails.items():
        cur.execute("""
            INSERT OR REPLACE INTO emails (email, domain, category, occurrence_count, first_source_path, last_seen_mtime)
            VALUES (?, ?, ?, ?, ?, ?)
        """, (em, data["domain"], data["category"], data["count"], data["first_source"], data["last_seen"]))
    conn.commit()

    # Generate Markdown Catalog & CSV Export
    generate_reports(conn, unique_emails)
    conn.close()

def generate_reports(conn, unique_emails):
    cur = conn.cursor()

    # 1. Generate CSV Directory
    with open(CSV_CONTACTS, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Email", "Domain", "Category", "Occurrences", "FirstSource", "LastSeenDate"])
        for em, data in sorted(unique_emails.items(), key=lambda x: x[1]["count"], reverse=True):
            last_date = datetime.fromtimestamp(data["last_seen"]).strftime("%Y-%m-%d %H:%M:%S")
            writer.writerow([em, data["domain"], data["category"], data["count"], data["first_source"], last_date])

    # 2. Generate Markdown Catalog
    with open(CATALOG_MD, "w", encoding="utf-8") as f:
        f.write("# 📧 MASTER EMAIL & CONTACT DIRECTORY CATALOG\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Total Verified Contacts**: {len(unique_emails):,} unique email addresses  \n")
        f.write(f"**Database**: [`MASTER_EMAIL_AND_CONTACTS_REGISTRY.sqlite`](file://{DB_PATH})  \n")
        f.write(f"**CSV Export**: [`SOVEREIGN_CONTACTS_DIRECTORY.csv`](file://{CSV_CONTACTS})  \n\n")

        cur.execute("SELECT category, COUNT(*), SUM(occurrence_count) FROM emails GROUP BY category ORDER BY COUNT(*) DESC")
        cat_stats = cur.fetchall()

        f.write("## 📊 Summary by Contact Category\n\n")
        f.write("| Category | Unique Contacts | Total Occurrences |\n")
        f.write("| :--- | :--- | :--- |\n")
        for cat, u_cnt, occ_cnt in cat_stats:
            f.write(f"| **{cat}** | {u_cnt:,} | {occ_cnt:,} |\n")
        f.write("\n---\n\n")

        for cat, _, _ in cat_stats:
            f.write(f"### 📬 {cat}\n\n")
            cur.execute("SELECT email, domain, occurrence_count, first_source_path FROM emails WHERE category=? ORDER BY occurrence_count DESC LIMIT 30", (cat,))
            rows = cur.fetchall()
            f.write("| Email Address | Domain | Occurrences | Source Artifact |\n")
            f.write("| :--- | :--- | :--- | :--- |\n")
            for em, dom, occ, src in rows:
                f.write(f"| **`{em}`** | `{dom}` | {occ:,} | [{Path(src).name}](file://{src}) |\n")
            f.write("\n")

    print(f"📄 Markdown Directory written to: {CATALOG_MD}")
    print(f"📊 CSV Contacts written to: {CSV_CONTACTS}")

if __name__ == "__main__":
    harvest_emails()
