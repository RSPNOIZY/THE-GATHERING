#!/usr/bin/env python3
"""
☁️ MASTER CLOUD STORAGE & GOOGLE WORKSPACE AUDITOR & REORGANIZER
Deep scan of Google Workspace (5TB), iCloud Drive, OneDrive, Dropbox, and Connected Fleet.
Fish Music Inc. · NOIZY Ecosystem · RSP_001
"""

import os
import sys
import csv
import json
import sqlite3
import time
from pathlib import Path
from datetime import datetime

SQLITE_PATH = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/CLOUDDRIVES_AND_GOOGLEWORKSPACE_REGISTRY.sqlite")
CSV_PATH = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/CLOUD_FLEET_MASTER_INDEX.csv")
DOC_PATH = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/MASTER_CLOUD_REORGANIZATION_AND_AUDIT.md")

CLOUD_HUBS = {
    "GoogleDrive_Primary_5TB": Path.home() / "Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com",
    "GoogleDrive_NoizyLab": Path.home() / "Library/CloudStorage/GoogleDrive-rspnoizylab@gmail.com",
    "GoogleDrive_Personal_RSPP": Path.home() / "Library/CloudStorage/GoogleDrive-rspplowman@gmail.com",
    "GoogleDrive_iCloud_Linked": Path.home() / "Library/CloudStorage/GoogleDrive-rsplowman@icloud.com",
    "iCloud_CloudDocs": Path.home() / "Library/Mobile Documents/com~apple~CloudDocs",
    "OneDrive_Personal": Path.home() / "Library/CloudStorage/OneDrive-Personal",
    "OneDrive_Personal_2": Path.home() / "Library/CloudStorage/OneDrive-Personal(2)",
    "Dropbox_Home": Path.home() / "Dropbox",
    "Dropbox_CloudStorage": Path.home() / "Library/CloudStorage/Dropbox",
}

def determine_canonical_target(name, relative_path):
    name_l = name.lower()
    rel_l = relative_path.lower()
    
    if any(k in name_l or k in rel_l for k in ["fish music", "wdc", "receipt", "bill", "invoice", "tax", "corporate"]):
        return "GDRIVE_5TB://FishMusic_Corporate_Finance/"
    elif any(k in name_l or k in rel_l for k in ["noizy.ai", "noizyworld", "dreamchamber", "gabriel", "agent"]):
        return "GDRIVE_5TB://NoizyAI_Sovereign_Ecosystem/"
    elif any(k in name_l or k in rel_l for k in ["audio", "sound", "dsp", "plugin", "sample", "stem", "vst", "daw"]):
        return "GDRIVE_5TB://MC96_Lossless_Audio_Vault/"
    elif any(k in name_l or k in rel_l for k in ["personal", "documents", "desktop", "downloads", "uhh", "for_bf"]):
        return "GDRIVE_5TB://RSP001_Personal_Archive/"
    elif any(k in name_l or k in rel_l for k in ["backup", "rescue", "snapshot", "old"]):
        return "12TB_OFFLINE://Historical_Snapshots/"
    return "GDRIVE_5TB://General_Ingest/"

def run_scan():
    print("=" * 70)
    print("  ☁️ MASTER CLOUD STORAGE & GOOGLE WORKSPACE SCANNER")
    print("=" * 70)
    
    conn = sqlite3.connect(str(SQLITE_PATH))
    cur = conn.cursor()
    
    now_str = datetime.now().isoformat()
    scanned_items = []
    
    # 1. Register Accounts
    accounts = [
        ("ACC_001", "Google Workspace", "rspnoizy@gmail.com", "5TB Business Plus", str(CLOUD_HUBS["GoogleDrive_Primary_5TB"]), "Primary Sovereign Cloud Hub", "ACTIVE_PRIMARY"),
        ("ACC_002", "Google Workspace / Lab", "rspnoizylab@gmail.com", "15GB Free Tier", str(CLOUD_HUBS["GoogleDrive_NoizyLab"]), "Staging & Integration Testing", "ACTIVE_STAGING"),
        ("ACC_003", "Google Personal", "rspplowman@gmail.com", "15GB Free Tier", str(CLOUD_HUBS["GoogleDrive_Personal_RSPP"]), "Legacy Personal Storage", "ACTIVE_ARCHIVE"),
        ("ACC_004", "Apple iCloud", "rsplowman@icloud.com", "2TB Apple One / iCloud+", str(CLOUD_HUBS["iCloud_CloudDocs"]), "Desktop & Mobile Documents", "ACTIVE_PRIMARY"),
        ("ACC_005", "Microsoft OneDrive", "OneDrive-Personal", "100GB", str(CLOUD_HUBS["OneDrive_Personal"]), "Office Documents & Backup", "ACTIVE_SECONDARY"),
        ("ACC_006", "Dropbox", "Dropbox-Personal", "2GB", str(CLOUD_HUBS["Dropbox_Home"]), "Legacy Staging", "ACTIVE_LEGACY")
    ]
    for acc in accounts:
        cur.execute("""
            INSERT OR REPLACE INTO cloud_accounts (account_id, provider, email, tier, local_path, canonical_role, status, last_audited)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (acc[0], acc[1], acc[2], acc[3], acc[4], acc[5], acc[6], now_str))
    conn.commit()
    
    # 2. Scan Hub Folders
    print("\n[1] 🔍 Scanning Cloud Hubs & Containers...")
    for hub_name, hub_path in CLOUD_HUBS.items():
        if not hub_path.exists():
            print(f"  • {hub_name:.<30} ⚪ NOT MOUNTED")
            continue
        print(f"  • {hub_name:.<30} 🟢 SCANNING...")
        try:
            for root, dirs, files in os.walk(str(hub_path)):
                rel_root = os.path.relpath(root, str(hub_path))
                if rel_root.count(os.sep) > 2:
                    del dirs[:] # don't descend deeper than 3 levels
                
                for d in dirs:
                    d_path = Path(root) / d
                    rel_p = os.path.relpath(str(d_path), str(hub_path))
                    target = determine_canonical_target(d, rel_p)
                    scanned_items.append({
                        "cloud_hub": hub_name,
                        "relative_path": rel_p,
                        "absolute_path": str(d_path),
                        "item_type": "DIRECTORY",
                        "size_bytes": 0,
                        "canonical_target_zone": target,
                        "status": "MAPPED"
                    })
                for f in files:
                    if f.startswith("."):
                        continue
                    f_path = Path(root) / f
                    try:
                        sz = f_path.stat().st_size
                    except Exception:
                        sz = 0
                    rel_p = os.path.relpath(str(f_path), str(hub_path))
                    target = determine_canonical_target(f, rel_p)
                    scanned_items.append({
                        "cloud_hub": hub_name,
                        "relative_path": rel_p,
                        "absolute_path": str(f_path),
                        "item_type": "FILE",
                        "size_bytes": sz,
                        "canonical_target_zone": target,
                        "status": "MAPPED"
                    })
        except Exception as e:
            print(f"    ❌ Error scanning {hub_name}: {e}")

    # Insert into SQLite
    cur.execute("DELETE FROM cloud_assets;")
    for item in scanned_items:
        cur.execute("""
            INSERT INTO cloud_assets (cloud_hub, relative_path, absolute_path, item_type, size_bytes, canonical_target_zone, status, scanned_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """, (item["cloud_hub"], item["relative_path"], item["absolute_path"], item["item_type"], item["size_bytes"], item["canonical_target_zone"], item["status"], now_str))
    
    # Insert Migration Rules
    cur.execute("DELETE FROM migration_rules;")
    rules = [
        ("iCloud_CloudDocs", "Bills & Receipts*", "GoogleDrive_Primary_5TB", "FishMusic_Corporate_Finance/Invoices_And_Receipts", "MERGE_AND_DEDUPLICATE", "Consolidate scattered tax and bill records into 5TB corporate hub."),
        ("iCloud_CloudDocs", "2025 FISH WDC*", "GoogleDrive_Primary_5TB", "FishMusic_Corporate_Finance/WDC_Filings_2025", "MIGRATE_AND_ARCHIVE", "Place corporate working documents in high-capacity cloud."),
        ("iCloud_CloudDocs", "Desktop 1/2/3", "GoogleDrive_Primary_5TB", "RSP001_Personal_Archive/Desktop_Consolidated", "FLATTEN_AND_DEDUPE", "Unify split iCloud desktop branches."),
        ("GoogleDrive_Personal_RSPP", "All Folders", "GoogleDrive_Primary_5TB", "RSP001_Personal_Archive/GoogleDrive_RSPP_Archive", "ONE_WAY_SYNC", "Archive personal Google Drive into 5TB business hub."),
        ("OneDrive_Personal*", "All Folders", "GoogleDrive_Primary_5TB", "CrossCloud_Sync/OneDrive_Mirrors", "MIRROR_SYNC", "Backup Microsoft Office documents into Google Drive.")
    ]
    for r in rules:
        cur.execute("""
            INSERT INTO migration_rules (source_hub, source_folder, destination_hub, destination_folder, action, rationale)
            VALUES (?, ?, ?, ?, ?, ?)
        """, r)
        
    conn.commit()
    conn.close()

    # 3. Export CSV
    with open(CSV_PATH, "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["cloud_hub", "relative_path", "item_type", "size_bytes", "canonical_target_zone", "status"])
        writer.writeheader()
        for item in scanned_items:
            writer.writerow({
                "cloud_hub": item["cloud_hub"],
                "relative_path": item["relative_path"],
                "item_type": item["item_type"],
                "size_bytes": item["size_bytes"],
                "canonical_target_zone": item["canonical_target_zone"],
                "status": item["status"]
            })

    print(f"\n[2] ✨ Cataloged {len(scanned_items)} Cloud Assets across {len(CLOUD_HUBS)} Hubs.")
    print(f"  • SQLite: {SQLITE_PATH}")
    print(f"  • CSV:    {CSV_PATH}")

if __name__ == "__main__":
    run_scan()
