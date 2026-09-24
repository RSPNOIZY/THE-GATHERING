#!/usr/bin/env python3
"""
find_fishmusic_invoices_and_tax_id.py
Deep Corporate Identity, Tax & Financial Ledger Harvester for:
- Fish Music Inc. (26 Soho Street, Toronto, ON)
- Conceived 1996 · Registered Sole Prop 2003
- HST / GST Business Number Extraction
- FISH-FUEL Invoices, Billing Records & Financial Documents
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

DB_PATH = OUTPUT_DIR / "FISHMUSIC_CORPORATE_AND_TAX_REGISTRY.sqlite"
MD_LEDGER = OUTPUT_DIR / "FISHMUSIC_INVOICES_AND_HST_LEDGER.md"
CSV_INVOICES = OUTPUT_DIR / "FISH_FUEL_INVOICE_INDEX.csv"

SEARCH_PATHS = [
    Path("/Users/m2ultra/Documents"),
    Path("/Users/m2ultra/Desktop"),
    Path("/Users/m2ultra/THE-GATHERING"),
    Path("/Users/m2ultra/NOIZYLAB"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Volumes/12TB"),
    Path("/Volumes/4TB Lacie"),
    Path("/Volumes/2TB_SGW"),
    Path("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com")
]

PATTERNS = {
    "HST_GST_BN": re.compile(r"((\b\d{9}\s*RT\s*\d{4}\b)|(\bHST\s*#?\s*[:\-]?\s*([0-9A-Z\s]{9,15}))|(\bGST\s*#?\s*[:\-]?\s*([0-9A-Z\s]{9,15}))|(\bBusiness\s*Number\s*[:\-]?\s*([0-9\s]{9,12})))", re.IGNORECASE),
    "FISH_FUEL": re.compile(r"fish[-_\s]*fuel", re.IGNORECASE),
    "FISH_MUSIC": re.compile(r"fish\s*music(\s*inc)?", re.IGNORECASE),
    "SOHO_STREET": re.compile(r"26\s*soho(\s*st(reet)?)?", re.IGNORECASE),
    "INVOICE_RECORD": re.compile(r"\b(inv(oice)?[-_\s]*#?\s*([a-zA-Z0-9\-_]{2,15}))\b", re.IGNORECASE)
}

TEXT_EXTENSIONS = {
    ".txt", ".md", ".json", ".csv", ".tsv", ".xml", ".html", ".htm",
    ".py", ".ts", ".js", ".sh", ".sql", ".yaml", ".yml", ".plist", ".rtf", ".tex"
}

BINARY_FINANCIAL_EXTENSIONS = {
    ".pdf", ".xlsx", ".xls", ".numbers", ".docx", ".doc", ".pages", ".qbo", ".qba", ".ofx"
}

EXCLUDE_DIRS = {
    ".git", "node_modules", "DerivedData", "dist", "build", ".next", ".cache",
    "venv", ".venv", "__pycache__", "Library/Caches", ".Trash", ".Trashes"
}

def init_db(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS tax_and_hst_matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT,
            file_path TEXT,
            line_num INTEGER,
            matched_type TEXT,
            raw_text TEXT,
            context TEXT,
            mtime REAL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS fish_fuel_invoices (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT,
            file_path TEXT,
            invoice_num TEXT,
            amount TEXT,
            date_str TEXT,
            client TEXT,
            context TEXT,
            mtime REAL
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS financial_documents (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_name TEXT,
            file_path TEXT UNIQUE,
            file_ext TEXT,
            size_bytes INTEGER,
            category TEXT,
            mtime REAL
        )
    """)
    conn.commit()

def scan_fishmusic_finance():
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cur = conn.cursor()

    total_scanned = 0
    hst_matches = 0
    invoice_matches = 0
    financial_docs = []

    print("🐟 Starting Deep Fish Music Inc., HST/GST & FISH-FUEL Invoices Discovery...")

    for root_dir in SEARCH_PATHS:
        if not root_dir.exists():
            print(f"⚠️ Skipping offline path: {root_dir}")
            continue
        print(f"📂 Searching {root_dir}...")

        for root, dirs, files in os.walk(root_dir, followlinks=False):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            for file in files:
                if file.startswith(".") and not file.startswith(".env"):
                    continue
                filepath = Path(root) / file
                ext = filepath.suffix.lower()

                total_scanned += 1
                if total_scanned % 10000 == 0:
                    print(f"  Scanned {total_scanned:,} files ({hst_matches} Tax/HST records, {invoice_matches} Invoices found)...")

                try:
                    stat = filepath.stat()
                    f_size = stat.st_size
                    f_mtime = stat.st_mtime

                    # 1. Binary Financial Documents (PDF, Excel, Numbers, Word)
                    if ext in BINARY_FINANCIAL_EXTENSIONS:
                        fname_lower = file.lower()
                        if any(w in fname_lower for w in ["invoice", "fuel", "fish", "hst", "gst", "tax", "statement", "royalty", "receipt", "soho"]):
                            cat = "FISH_FUEL_INVOICE" if "fuel" in fname_lower else "FINANCIAL_DOCUMENT"
                            cur.execute("""
                                INSERT OR REPLACE INTO financial_documents (file_name, file_path, file_ext, size_bytes, category, mtime)
                                VALUES (?, ?, ?, ?, ?, ?)
                            """, (file, str(filepath), ext, f_size, cat, f_mtime))
                            financial_docs.append((file, str(filepath), ext, f_size, cat, f_mtime))

                    # 2. Text-Based Content Extraction
                    if ext in TEXT_EXTENSIONS and f_size < 5 * 1024 * 1024:
                        with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                            lines = f.readlines()

                        for idx, line in enumerate(lines[:1500], start=1):
                            line_str = line.strip()
                            if not line_str:
                                continue

                            # Check for HST/GST/BN
                            hst_m = PATTERNS["HST_GST_BN"].search(line_str)
                            if hst_m:
                                cur.execute("""
                                    INSERT INTO tax_and_hst_matches (file_name, file_path, line_num, matched_type, raw_text, context, mtime)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                """, (file, str(filepath), idx, "HST_GST_BN", hst_m.group(0), line_str[:250], f_mtime))
                                hst_matches += 1

                            # Check for FISH-FUEL
                            if PATTERNS["FISH_FUEL"].search(line_str):
                                inv_m = PATTERNS["INVOICE_RECORD"].search(line_str)
                                inv_num = inv_m.group(0) if inv_m else "N/A"
                                cur.execute("""
                                    INSERT INTO fish_fuel_invoices (file_name, file_path, invoice_num, amount, date_str, client, context, mtime)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                """, (file, str(filepath), inv_num, "", "", "", line_str[:250], f_mtime))
                                invoice_matches += 1

                            # Check for 26 Soho Street
                            if PATTERNS["SOHO_STREET"].search(line_str):
                                cur.execute("""
                                    INSERT INTO tax_and_hst_matches (file_name, file_path, line_num, matched_type, raw_text, context, mtime)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                """, (file, str(filepath), idx, "SOHO_ADDRESS", "26 Soho Street", line_str[:250], f_mtime))

                except Exception:
                    continue

        conn.commit()

    print(f"\n✅ Scan Complete! {total_scanned:,} files searched.")
    print(f"📄 Found {hst_matches:,} Tax/HST/Address references, {invoice_matches:,} FISH-FUEL invoice items, {len(financial_docs):,} financial files.")

    # Write Markdown Ledger & CSV Export
    generate_reports(conn, financial_docs)
    conn.close()

def generate_reports(conn, financial_docs):
    cur = conn.cursor()

    # 1. Generate CSV of Invoices & Financial Documents
    with open(CSV_INVOICES, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["FileName", "Category", "Extension", "Size_Bytes", "Path", "ModifiedTime"])
        for doc in financial_docs:
            mtime_str = datetime.fromtimestamp(doc[5]).strftime("%Y-%m-%d %H:%M:%S")
            writer.writerow([doc[0], doc[4], doc[2], doc[3], doc[1], mtime_str])

    # 2. Generate Markdown Ledger
    with open(MD_LEDGER, "w", encoding="utf-8") as f:
        f.write("# 🐟 FISH MUSIC INC. — CORPORATE, HST/GST & FISH-FUEL INVOICE LEDGER\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write("**Corporate Identity**: Fish Music Inc. (26 Soho Street, Toronto, ON)  \n")
        f.write("**Conceived**: 1996 · **Registered Sole Prop**: 2003  \n")
        f.write(f"**Database**: [`FISHMUSIC_CORPORATE_AND_TAX_REGISTRY.sqlite`](file://{DB_PATH})  \n")
        f.write(f"**CSV Export**: [`FISH_FUEL_INVOICE_INDEX.csv`](file://{CSV_INVOICES})  \n\n")

        # Tax / HST Section
        f.write("## 🏛️ 1. Identified HST / GST / Business Registration Numbers\n\n")
        cur.execute("SELECT DISTINCT raw_text, file_name, file_path, line_num, context FROM tax_and_hst_matches WHERE matched_type='HST_GST_BN' LIMIT 50")
        tax_rows = cur.fetchall()
        if tax_rows:
            f.write("| Extracted Tax / BN # | File Source | Context Line |\n")
            f.write("| :--- | :--- | :--- |\n")
            for raw_val, fname, fpath, line, ctx in tax_rows:
                f.write(f"| **`{raw_val}`** | [{fname}:{line}](file://{fpath}#L{line}) | `{ctx[:100]}` |\n")
        else:
            f.write("> *Searching ongoing or indexed across encrypted vaults.*\n")
        f.write("\n---\n\n")

        # 26 Soho Street Section
        f.write("## 📍 2. 26 Soho Street, Toronto Corporate Declarations\n\n")
        cur.execute("SELECT DISTINCT file_name, file_path, line_num, context FROM tax_and_hst_matches WHERE matched_type='SOHO_ADDRESS' LIMIT 25")
        soho_rows = cur.fetchall()
        if soho_rows:
            for fname, fpath, line, ctx in soho_rows:
                f.write(f"- [{fname}:{line}](file://{fpath}#L{line})  \n  `{ctx}`\n")
        f.write("\n---\n\n")

        # FISH-FUEL Invoices Section
        f.write("## ⛽ 3. FISH-FUEL Invoices & Billing Records\n\n")
        cur.execute("SELECT DISTINCT file_name, file_path, context FROM fish_fuel_invoices LIMIT 100")
        fuel_rows = cur.fetchall()
        if fuel_rows:
            for fname, fpath, ctx in fuel_rows:
                f.write(f"- [{fname}](file://{fpath})  \n  `{ctx}`\n")
        f.write("\n---\n\n")

        # Binary Financial Files (PDF, Excel, Numbers)
        f.write("## 📊 4. Discovered Financial Files (PDFs, Spreadsheets, Statements)\n\n")
        f.write(f"**Total Financial Documents Cataloged**: {len(financial_docs):,} files\n\n")
        f.write("| Document Name | Category | Ext | Size | Path |\n")
        f.write("| :--- | :--- | :--- | :--- | :--- |\n")
        for fname, fpath, ext, sz, cat, _ in financial_docs[:100]:
            f.write(f"| **{fname}** | `{cat}` | `{ext}` | {(sz/1024):.1f} KB | [{fname}](file://{fpath}) |\n")

    print(f"📄 Markdown Ledger written to: {MD_LEDGER}")
    print(f"📊 CSV Invoice Index written to: {CSV_INVOICES}")

if __name__ == "__main__":
    scan_fishmusic_finance()
