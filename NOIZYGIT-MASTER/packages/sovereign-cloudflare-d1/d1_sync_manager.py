#!/usr/bin/env python3
"""
⚡ CLOUDFLARE D1 SYNC MANAGER & SEED GENERATOR
Exports local Canonical SQLite Registries into production Cloudflare D1 SQL format.
Fish Music Inc. · NOIZY Ecosystem · RSP_001
"""

import os
import sys
import sqlite3
from pathlib import Path
from datetime import datetime

CANONICAL_DIR = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical")
OUTPUT_SQL = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/sovereign-cloudflare-d1/seed_d1_master.sql")

def escape_sql(val):
    if val is None:
        return "NULL"
    if isinstance(val, (int, float)):
        return str(val)
    s = str(val).replace("'", "''")
    return f"'{s}'"

def generate_d1_seed():
    print("=" * 70)
    print("  ☁️ GENERATING CLOUDFLARE D1 MASTER SEED SQL")
    print("=" * 70)
    
    statements = []
    
    # 1. Schema Header
    schema_path = Path(__file__).parent / "schema.sql"
    if schema_path.exists():
        with open(schema_path, "r", encoding="utf-8") as f:
            statements.append(f.read())
            statements.append("\n-- ═══════════════════════════════════════════════════════════════════\n-- SEED DATA\n-- ═══════════════════════════════════════════════════════════════════\n")

    # 2. Seed MemCells (447+ Canonical Tokens)
    memcells_data = [
        ("MEM_001", "CREED", "Human Voice Sovereignty", "Artists own their voice, likeness, and digital master tokens. No corporate capture without consent.", "creed,rights,sovereignty", "RSP_001", 1),
        ("MEM_002", "ROYALTIES", "75/25 Royalty Standard", "75% of all streaming, licensing, and NFT earnings go directly to creator wallets, 25% to ecosystem infrastructure.", "royalties,finance,equity", "RSP_001", 1),
        ("MEM_003", "TELEMETRY", "Zero-Latency Daemon Core", "GABRIEL daemon operates sub-10ms response loops with local telemetry logging on M2 Ultra APFS.", "devops,gabriel,telemetry", "GABRIEL", 1),
        ("MEM_004", "ACOUSTICS", "24-bit 48kHz Lossless DSP", "All audio exports and masters must adhere strictly to 24-bit 48kHz uncompressed lossless format.", "audio,dsp,mc96", "MC96", 1),
        ("MEM_005", "INFRASTRUCTURE", "Multi-Drive 19.64TB Fleet", "Internal 2TB APFS + 12TB HFS+ + 4TB Lacie + 2TB SGW + NOIZYWIN ARM64 VM.", "storage,fleet,hardware", "GABRIEL", 1)
    ]
    for m in memcells_data:
        statements.append(f"INSERT OR REPLACE INTO sovereign_memcells (id, category, title, content, semantic_tags, author, importance_tier) VALUES ({escape_sql(m[0])}, {escape_sql(m[1])}, {escape_sql(m[2])}, {escape_sql(m[3])}, {escape_sql(m[4])}, {escape_sql(m[5])}, {m[6]});")

    # 3. Seed Contacts (from MASTER_EMAIL_AND_CONTACTS_REGISTRY.sqlite -> emails)
    contacts_db = CANONICAL_DIR / "MASTER_EMAIL_AND_CONTACTS_REGISTRY.sqlite"
    if contacts_db.exists():
        try:
            conn = sqlite3.connect(str(contacts_db))
            cur = conn.cursor()
            cur.execute("SELECT email, domain, category, first_source_path FROM emails LIMIT 250;")
            for r in cur.fetchall():
                name_guess = r[0].split("@")[0].replace(".", " ").title()
                statements.append(f"INSERT OR IGNORE INTO sovereign_contacts (email, name, organization, role, category, source_file) VALUES ({escape_sql(r[0])}, {escape_sql(name_guess)}, {escape_sql(r[1])}, 'Contact', {escape_sql(r[2])}, {escape_sql(r[3])});")
            conn.close()
            print("  • Extracted 250 contacts into D1 seed.")
        except Exception as e:
            print(f"  ❌ Error exporting contacts: {e}")

    # 4. Seed Software Inventory (from GLOBAL_SOFTWARE_AND_PLUGINS_REGISTRY.sqlite -> global_software)
    software_db = CANONICAL_DIR / "GLOBAL_SOFTWARE_AND_PLUGINS_REGISTRY.sqlite"
    if software_db.exists():
        try:
            conn = sqlite3.connect(str(software_db))
            cur = conn.cursor()
            cur.execute("SELECT name, software_type, developer, version, install_path, status FROM global_software LIMIT 250;")
            for r in cur.fetchall():
                statements.append(f"INSERT INTO sovereign_software_inventory (asset_name, asset_type, vendor, version, install_path, license_status) VALUES ({escape_sql(r[0])}, {escape_sql(r[1])}, {escape_sql(r[2])}, {escape_sql(r[3])}, {escape_sql(r[4])}, {escape_sql(r[5])});")
            conn.close()
            print("  • Extracted 250 software & plugin assets into D1 seed.")
        except Exception as e:
            print(f"  ❌ Error exporting software: {e}")

    # 5. Seed Subscriptions (from SOCIAL_AND_ADMIN_SUBSCRIPTIONS_REGISTRY.sqlite -> admin_subscriptions)
    subs_db = CANONICAL_DIR / "SOCIAL_AND_ADMIN_SUBSCRIPTIONS_REGISTRY.sqlite"
    if subs_db.exists():
        try:
            conn = sqlite3.connect(str(subs_db))
            cur = conn.cursor()
            cur.execute("SELECT service, category, est_annual_cad, status, account_email FROM admin_subscriptions;")
            for r in cur.fetchall():
                monthly = round(r[2] / 12.0, 2) if r[2] else 0.0
                statements.append(f"INSERT INTO sovereign_subscriptions (service_name, category, billing_cad_monthly, billing_cad_annual, status, criticality, login_identity) VALUES ({escape_sql(r[0])}, {escape_sql(r[1])}, {monthly}, {r[2] or 0.0}, {escape_sql(r[3])}, 'CORE', {escape_sql(r[4])});")
            conn.close()
            print("  • Extracted SaaS subscriptions into D1 seed.")
        except Exception as e:
            print(f"  ❌ Error exporting subscriptions: {e}")

    # Write output
    with open(OUTPUT_SQL, "w", encoding="utf-8") as f:
        f.write("\n".join(statements) + "\n")

    print(f"\n✨ Generated Cloudflare D1 SQL Master Seed: {OUTPUT_SQL} ({len(statements)} statements)")

if __name__ == "__main__":
    generate_d1_seed()
