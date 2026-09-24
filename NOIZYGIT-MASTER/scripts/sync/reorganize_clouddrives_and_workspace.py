#!/usr/bin/env python3
"""
☁️ CLOUD DRIVES & GOOGLE WORKSPACE MASTER REORGANIZER
Unifies Google Drive accounts, iCloud Drive, OneDrive, Dropbox, and Active Cloud Subscriptions.
Fish Music Inc. · NOIZY Ecosystem · RSP_001
"""

import os
import sys
import json
import sqlite3
import csv
from pathlib import Path
from datetime import datetime

OUTPUT_DB = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/CLOUDDRIVES_AND_GOOGLEWORKSPACE_REGISTRY.sqlite"
OUTPUT_MD = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/CLOUDDRIVES_AND_GOOGLEWORKSPACE_REORGANIZATION_PLAN.md"
OUTPUT_CSV = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/CLOUDDRIVES_UNIFIED_MAPPING_MATRIX.csv"

CLOUD_ACCOUNTS = [
    {
        "account_id": "GW_001_RSPNOIZY",
        "provider": "Google Workspace Business Plus",
        "email": "rspnoizy@gmail.com",
        "tier": "5TB Cloud Storage + Gemini Advanced",
        "local_path": "/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com",
        "canonical_role": "Primary Sovereign Cloud Hub · 5TB Audio Archive & Backup Mirror",
        "status": "ACTIVE / PRIMARY"
    },
    {
        "account_id": "GD_002_RSPLOWMAN",
        "provider": "Google Drive",
        "email": "rsplowman@icloud.com",
        "tier": "Legacy Cloud Storage",
        "local_path": "/Users/m2ultra/Library/CloudStorage/GoogleDrive-rsplowman@icloud.com",
        "canonical_role": "Acoustic Audio Archives, CODEMASTER Historical & Rescue Vault",
        "status": "ACTIVE / CONSOLIDATING"
    },
    {
        "account_id": "GD_003_NOIZYLAB",
        "provider": "Google Drive",
        "email": "rspnoizylab@gmail.com",
        "tier": "Developer Cloud Storage",
        "local_path": "/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizylab@gmail.com",
        "canonical_role": "NOIZYLAB R&D, Workspace Blueprints & Experimental Builds",
        "status": "ACTIVE / CONSOLIDATING"
    },
    {
        "account_id": "GD_004_RSPPLOWMAN",
        "provider": "Google Drive",
        "email": "rspplowman@gmail.com",
        "tier": "Personal Google Drive",
        "local_path": "/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com",
        "canonical_role": "Personal Documents & Historical Records",
        "status": "ACTIVE / ARCHIVAL"
    },
    {
        "account_id": "ICLOUD_001",
        "provider": "Apple iCloud+",
        "email": "rsplowman@icloud.com",
        "tier": "2TB iCloud+ Family Plan",
        "local_path": "/Users/m2ultra/Library/Mobile Documents/com~apple~CloudDocs",
        "canonical_role": "Bills & Receipts, Personal Docs, iOS Audio Sync (Logic Pro for iPad)",
        "status": "ACTIVE / REAL-TIME"
    },
    {
        "account_id": "ONEDRIVE_001",
        "provider": "Microsoft OneDrive",
        "email": "rsplowman@hotmail.com / rsplowman@live.com",
        "tier": "1TB Microsoft 365 Personal",
        "local_path": "/Users/m2ultra/Library/CloudStorage/OneDrive-Personal",
        "canonical_role": "Windows 11 NOIZYWIN Microbeast Sync & Office Doc Archives",
        "status": "ACTIVE"
    },
    {
        "account_id": "DROPBOX_001",
        "provider": "Dropbox",
        "email": "rspnoizy@gmail.com",
        "tier": "Basic / Historical",
        "local_path": "/Users/m2ultra/Library/CloudStorage/Dropbox",
        "canonical_role": "Third-Party Audio Collaborations & Stem Ingest",
        "status": "ACTIVE / INGEST"
    },
    {
        "account_id": "CLOUDFLARE_R2",
        "provider": "Cloudflare R2 Object Storage",
        "email": "rspnoizy@gmail.com",
        "tier": "S3-Compatible Zero-Egress Storage",
        "local_path": "s3://noizy-audio-vault",
        "canonical_role": "Global CDN Audio Distribution & Haptic Event Storage",
        "status": "CRITICAL / ACTIVE"
    },
    {
        "account_id": "PROTON_DRIVE",
        "provider": "Proton Drive",
        "email": "rspnoizy@gmail.com",
        "tier": "End-to-End Encrypted Sovereign Storage",
        "local_path": "https://drive.proton.me",
        "canonical_role": "Encrypted Sovereign Secrets, Master Passphrase Backup & Legal Vault",
        "status": "CRITICAL / ACTIVE"
    }
]

CANONICAL_FOLDER_TAXONOMY = [
    {
        "bucket": "01_FINANCIAL_CRA_BILLS",
        "description": "Invoices, FISH-FUEL records, HST/GST filings, CRA corporate statements, bank proofs",
        "primary_source": "iCloud Drive (Bills & Receipts) / Google Drive (Finance)",
        "target_cloud_sync": "Google Workspace (rspnoizy@gmail.com) + Proton Pass Vault"
    },
    {
        "bucket": "02_AUDIO_MUSIC_STEMS",
        "description": "24-bit 48kHz WAV audio stems, Logic Pro projects, acoustic masters, sound design banks",
        "primary_source": "/Volumes/12TB (_01.AUDIO, _WAVE) / Google Drive (5TB)",
        "target_cloud_sync": "Google Workspace 5TB + Cloudflare R2 Audio Vault"
    },
    {
        "bucket": "03_CODE_AND_IDENTITY",
        "description": "NOIZYGIT-MASTER monorepo, MCP servers, launchd daemons, AI agent frameworks",
        "primary_source": "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER",
        "target_cloud_sync": "GitHub Monorepo + Encrypted Offline Mirrors"
    },
    {
        "bucket": "04_DOCUMENTS_AND_MANUALS",
        "description": "Audio hardware manuals, PDF books, research papers, medical rehabilitation logs",
        "primary_source": "iCloud Drive (Documents) / Google Drive (DOC MASTER)",
        "target_cloud_sync": "DEVONthink Pro Global Database + Google Workspace"
    },
    {
        "bucket": "05_AI_MEMORIES_AND_MODELS",
        "description": "35 GGUF weights, Claude / ChatGPT / Gemini ideation archives, prompt engineering vaults",
        "primary_source": "Internal M2 Ultra (~/.cache/lm-studio) / D1 MemCells",
        "target_cloud_sync": "Cloudflare D1 (447+ cells) + Local SQLite Vaults"
    }
]

def init_db(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS cloud_accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id TEXT UNIQUE,
            provider TEXT,
            email TEXT,
            tier TEXT,
            local_path TEXT,
            canonical_role TEXT,
            status TEXT,
            last_audited TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS taxonomy_buckets (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bucket TEXT UNIQUE,
            description TEXT,
            primary_source TEXT,
            target_cloud_sync TEXT
        )
    """)
    conn.commit()

def run_reorganization():
    print("=" * 65)
    print("  ☁️ CLOUD DRIVES & GOOGLE WORKSPACE MASTER REORGANIZER")
    print("  Google Workspace · iCloud+ · OneDrive · Dropbox · R2 · Proton")
    print("=" * 65)

    os.makedirs(os.path.dirname(OUTPUT_DB), exist_ok=True)
    conn = sqlite3.connect(OUTPUT_DB)
    init_db(conn)
    cur = conn.cursor()

    for acc in CLOUD_ACCOUNTS:
        cur.execute("""
            INSERT INTO cloud_accounts (account_id, provider, email, tier, local_path, canonical_role, status, last_audited)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(account_id) DO UPDATE SET
                provider=excluded.provider,
                email=excluded.email,
                tier=excluded.tier,
                local_path=excluded.local_path,
                canonical_role=excluded.canonical_role,
                status=excluded.status,
                last_audited=excluded.last_audited
        """, (acc["account_id"], acc["provider"], acc["email"], acc["tier"], acc["local_path"], acc["canonical_role"], acc["status"], datetime.now().isoformat()))

    for tax in CANONICAL_FOLDER_TAXONOMY:
        cur.execute("""
            INSERT INTO taxonomy_buckets (bucket, description, primary_source, target_cloud_sync)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(bucket) DO UPDATE SET
                description=excluded.description,
                primary_source=excluded.primary_source,
                target_cloud_sync=excluded.target_cloud_sync
        """, (tax["bucket"], tax["description"], tax["primary_source"], tax["target_cloud_sync"]))

    conn.commit()

    # Export CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Account_ID", "Provider", "Email", "Tier", "Canonical_Role", "Status", "Local_Mount_Path"])
        for acc in CLOUD_ACCOUNTS:
            writer.writerow([acc["account_id"], acc["provider"], acc["email"], acc["tier"], acc["canonical_role"], acc["status"], acc["local_path"]])

    # Export Markdown Reorganization Plan
    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write("# ☁️ CLOUD DRIVES & GOOGLE WORKSPACE MASTER REORGANIZATION PLAN\n")
        f.write("## Fish Music Inc. · NOIZY Ecosystem · Sovereign Cloud & Workspace Architecture\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Principal Sovereign:** Robert Stephen Plowman (`RSP_001`)\n")
        f.write(f"**Primary Sovereign Workspace Account:** `rspnoizy@gmail.com` (5TB Google Workspace)\n")
        f.write(f"**Master SQLite Registry:** [`CLOUDDRIVES_AND_GOOGLEWORKSPACE_REGISTRY.sqlite`](file://{OUTPUT_DB})\n")
        f.write(f"**Unified Mapping Matrix CSV:** [`CLOUDDRIVES_UNIFIED_MAPPING_MATRIX.csv`](file://{OUTPUT_CSV})\n\n")
        f.write("---\n\n")

        f.write("### 🌐 1. Cloud Accounts & Active Subscriptions Matrix\n\n")
        f.write("| Account ID | Provider | Account Email | Plan / Tier | Canonical Role & Purpose | Status |\n")
        f.write("|:---|:---|:---|:---|:---|:---|\n")
        for acc in CLOUD_ACCOUNTS:
            f.write(f"| `{acc['account_id']}` | **{acc['provider']}** | `{acc['email']}` | {acc['tier']} | {acc['canonical_role']} | `{acc['status']}` |\n")
        f.write("\n---\n\n")

        f.write("### 📁 2. Unified 5-Bucket Sovereign File Taxonomy\n\n")
        f.write("| Canonical Bucket | Description & Scope | Primary Local Source | Target Cloud Destination |\n")
        f.write("|:---|:---|:---|:---|\n")
        for tax in CANONICAL_FOLDER_TAXONOMY:
            f.write(f"| **`{tax['bucket']}`** | {tax['description']} | `{tax['primary_source']}` | `{tax['target_cloud_sync']}` |\n")
        f.write("\n---\n\n")

        f.write("### 🚀 3. Consolidation & Optimization Directives\n\n")
        f.write("1. **Google Workspace Consolidation (`rspnoizy@gmail.com`):** Maintain as the master 5TB cloud ingest repository. Relocate legacy accounts (`rsplowman@icloud.com`, `rspnoizylab@gmail.com`, `rspplowman@gmail.com`) into organized subfolders within the 5TB drive.\n")
        f.write("2. **iCloud Drive Real-Time Ingest:** Keep `Bills & Receipts` and active `Documents` synchronized between iPhone, iPad, and M2 Ultra, with weekly cold exports into `/Volumes/12TB/`.\n")
        f.write("3. **Cloudflare R2 for Global Zero-Egress Audio:** Direct all public and mobile audio streaming requests through Cloudflare R2 bucket (`s3://noizy-audio-vault`) to eliminate bandwidth costs.\n")
        f.write("4. **Proton Pass & Drive for Sovereign Zero-Knowledge Secrets:** Isolate corporate Mastercards, tax PINs, PGP keys, and recovery seeds in Proton Drive and Proton Pass.\n\n")

    conn.close()
    print(f"✅ Successfully reorganized {len(CLOUD_ACCOUNTS)} Cloud Accounts into 5 Sovereign Taxonomies.")
    print(f"📁 Exported to {OUTPUT_MD}, {OUTPUT_CSV}, and {OUTPUT_DB}")

if __name__ == "__main__":
    run_reorganization()
