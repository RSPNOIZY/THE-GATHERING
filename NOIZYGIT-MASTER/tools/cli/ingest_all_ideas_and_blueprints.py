#!/usr/bin/env python3
"""
=============================================================================
 NOIZY MASTER IDEA & BLUEPRINT INGESTION ENGINE
 Target: /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/ideas_vault
=============================================================================
"""

import os
import shutil
import json
from datetime import datetime

TARGET_IDEAS_DIR = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/ideas_vault"
TARGET_CANONICAL_DIR = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical"
TARGET_RESEARCH_DIR = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/research"

IDEA_SOURCES = [
    ("/Users/m2ultra/NOIZYANTHROPIC/Recovered_Ideas", "Recovered_Ideas"),
    ("/Users/m2ultra/NOIZYANTHROPIC/docs", "Anthropic_Docs"),
    ("/Users/m2ultra/THE-GATHERING/docs", "Gathering_Docs"),
    ("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive", "GoogleDrive_MyDrive"),
    ("/Users/m2ultra/NOIZY_GD_BACKUP", "GD_Backup")
]

def safe_copy(src, dst):
    try:
        os.makedirs(os.path.dirname(dst), exist_ok=True)
        shutil.copy2(src, dst)
        return True
    except Exception:
        return False

def ingest_ideas():
    print("==================================================================", flush=True)
    print(" INGESTING ALL IDEAS, BLUEPRINTS & RAW CONCEPTS INTO NOIZYGIT-MASTER")
    print(f" Target: {TARGET_IDEAS_DIR}")
    print("==================================================================", flush=True)

    os.makedirs(TARGET_IDEAS_DIR, exist_ok=True)
    os.makedirs(TARGET_CANONICAL_DIR, exist_ok=True)
    os.makedirs(TARGET_RESEARCH_DIR, exist_ok=True)

    ingested_records = []

    for src_root, source_tag in IDEA_SOURCES:
        if not os.path.exists(src_root):
            continue
        print(f"Ingesting from [{source_tag}]: {src_root}...", flush=True)
        
        for root, dirs, files in os.walk(src_root):
            dirs[:] = [d for d in dirs if d not in {'.git', 'node_modules', 'Caches', 'DerivedData', '__pycache__'}]
            
            for f in files:
                if f.startswith("._") or f == ".DS_Store":
                    continue
                ext = os.path.splitext(f)[1].lower()
                name_upper = f.upper()
                
                # Check if it is an idea, doc, prompt, session, or blueprint
                is_target = (
                    ext in [".md", ".markdown", ".txt", ".docx", ".pdf", ".gdoc", ".pptx", ".xlsx"] or
                    any(k in name_upper for k in [
                        "IDEA", "BRAIN", "VISION", "BLUEPRINT", "CONCEPT", "WISDOM",
                        "DREAM", "MANIFESTO", "BIBLE", "HEAVEN", "PROTOCOL", "STRATEGY",
                        "FOUNDER", "EMPIRE", "VOX", "GABRIEL", "LUCY", "MC96", "NOTE",
                        "PROMPT", "SESSION", "TRANSCRIPT", "RESEARCH", "SPEC", "SWARM"
                    ])
                )
                
                if not is_target:
                    continue

                full_src = os.path.join(root, f)
                rel_path = os.path.relpath(full_src, src_root)
                
                # Clean destination filename / subpath
                dest_subpath = os.path.join(TARGET_IDEAS_DIR, source_tag, rel_path)
                
                # If it's a top-tier canonical blueprint, also mirror to canonical or research
                if any(k in name_upper for k in ["BIBLE", "FOUNDER", "BLUEPRINT", "CONSENT", "EMPIRE_MAP", "ENCYCLOPEDIA"]):
                    safe_copy(full_src, os.path.join(TARGET_CANONICAL_DIR, f))
                elif any(k in name_upper for k in ["WISDOM", "RESEARCH", "COMPETITIVE", "WHITE_PAPER"]):
                    safe_copy(full_src, os.path.join(TARGET_RESEARCH_DIR, f))

                if safe_copy(full_src, dest_subpath):
                    sz = os.path.getsize(full_src) if os.path.exists(full_src) else 0
                    ingested_records.append({
                        "filename": f,
                        "extension": ext,
                        "source": source_tag,
                        "rel_source": rel_path,
                        "size_bytes": sz,
                        "size_kb": round(sz / 1024.0, 2)
                    })

    print(f"\nTotal Idea and Blueprint files ingested: {len(ingested_records):,}", flush=True)

    # Write Master Ideas Catalog
    catalog_path = os.path.join(TARGET_IDEAS_DIR, "IDEAS_MASTER_CATALOG.json")
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "total_idea_files": len(ingested_records),
            "records": ingested_records
        }, f, indent=2)

    # Write Ideas README
    readme_path = os.path.join(TARGET_IDEAS_DIR, "README.md")
    with open(readme_path, "w", encoding="utf-8") as f:
        f.write("# 💡 NOIZY MASTER IDEA & BLUEPRINT VAULT\n\n")
        f.write(f"**Total Idea & Architecture Artifacts Preserved**: **{len(ingested_records):,}**  \n")
        f.write(f"**Last Synchronized**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## 📚 Ingested Knowledge Sources\n\n")
        f.write("- **`Recovered_Ideas/`**: Recovered iCloud Drive archive, NOIZY.AI sessions, raw brain dumps, and text-vault logs.\n")
        f.write("- **`Anthropic_Docs/`**: Full architectural specs, agent governance, and brand blueprints from NOIZYANTHROPIC.\n")
        f.write("- **`Gathering_Docs/`**: Active operational specs, CR-V mobile telemetry, and hardware contracts.\n")
        f.write("- **`GoogleDrive_MyDrive/`**: Cloud founder blueprints, Noizy Bible, and executive presentations.\n\n")
        f.write("Refer to `IDEAS_MASTER_CATALOG.json` for full machine-readable metadata.\n")

    print(f"Catalog and README generated at: {TARGET_IDEAS_DIR}", flush=True)

if __name__ == "__main__":
    ingest_ideas()
