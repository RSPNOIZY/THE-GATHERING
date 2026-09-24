#!/usr/bin/env python3
"""
scan_and_index_monorepo.py
Scans and indexes all domains, applications, agents, MCPs, audio IP, configs, and idea vaults in NOIZYGIT-MASTER.
Generates MONOREPO_CATALOG.json and MASTER_MANIFEST.md.
"""

import json
import time
from pathlib import Path

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")

DOMAINS = [
    ("apps", "User Interfaces, Dashboards & Client Applications"),
    ("agents", "Autonomous Multi-Agent Swarms & Cognitive Entities"),
    ("mcps", "Model Context Protocol Servers"),
    ("packages", "Shared SDKs, Core Libraries & Verification Engines"),
    ("audio_music", "Audio Architecture, Instruments & Sound Design"),
    ("docs", "Canonical Knowledge Base, Specs, Blueprints & Master Idea Vault"),
    ("config", "Unified Infrastructure & Deployment Configurations"),
    ("scripts", "Operational, Sync & Verification Utilities"),
    ("tools", "Internal Developer & Automation Tools"),
]

def scan_domain(domain_name, description):
    domain_path = ROOT / domain_name
    if not domain_path.exists():
        return {"name": domain_name, "description": description, "exists": False, "submodules": [], "total_files": 0, "size_bytes": 0}
    
    submodules = []
    total_files = 0
    total_bytes = 0
    
    for item in sorted(domain_path.iterdir()):
        if item.name.startswith("."):
            continue
        if item.is_dir():
            file_count = sum(1 for f in item.rglob("*") if f.is_file() and not f.name.startswith("."))
            byte_size = sum(f.stat().st_size for f in item.rglob("*") if f.is_file() and not f.name.startswith("."))
            submodules.append({
                "name": item.name,
                "relative_path": f"{domain_name}/{item.name}",
                "file_count": file_count,
                "size_bytes": byte_size,
                "size_mb": round(byte_size / (1024 * 1024), 2)
            })
            total_files += file_count
            total_bytes += byte_size
        elif item.is_file():
            total_files += 1
            total_bytes += item.stat().st_size
            
    return {
        "name": domain_name,
        "description": description,
        "exists": True,
        "submodule_count": len(submodules),
        "submodules": submodules,
        "total_files": total_files,
        "total_bytes": total_bytes,
        "total_mb": round(total_bytes / (1024 * 1024), 2)
    }

def main():
    print(f"Scanning NOIZYGIT-MASTER at {ROOT}...")
    manifest = {
        "monorepo_name": "NOIZYGIT-MASTER",
        "canonical_repository": "https://github.com/RSPNOIZY/THE-GATHERING/NOIZYGIT-MASTER",
        "architecture_version": "4.0.0-SOVEREIGN",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "domains": {}
    }
    
    total_empire_files = 0
    total_empire_bytes = 0
    
    for domain_name, desc in DOMAINS:
        info = scan_domain(domain_name, desc)
        manifest["domains"][domain_name] = info
        total_empire_files += info["total_files"]
        total_empire_bytes += info["total_bytes"]
        print(f"  ✓ {domain_name}: {info['total_files']} files ({info['total_mb']} MB) across {info.get('submodule_count', 0)} submodules")
        
    manifest["summary"] = {
        "total_domains": len(DOMAINS),
        "total_files": total_empire_files,
        "total_bytes": total_empire_bytes,
        "total_mb": round(total_empire_bytes / (1024 * 1024), 2)
    }
    
    # Write JSON Catalog
    catalog_path = ROOT / "MONOREPO_CATALOG.json"
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)
    print(f"\nSaved catalog to {catalog_path}")
    
    # Write Markdown Master Manifest
    manifest_md = f"""# 🏛️ NOIZYGIT-MASTER — Master Empire Manifest

- **Repository**: [`https://github.com/RSPNOIZY/THE-GATHERING/NOIZYGIT-MASTER`](https://github.com/RSPNOIZY/THE-GATHERING/NOIZYGIT-MASTER)
- **Architecture**: `4.0.0-SOVEREIGN`
- **Generated**: `{manifest['generated_at']}`
- **Total Tracked Assets**: `{total_empire_files:,} files` ({manifest['summary']['total_mb']} MB)

---

## 🌐 Primary Subsystems & Domains

| Domain | Description | Submodules | Files | Size (MB) |
| :--- | :--- | :---: | :---: | :---: |
"""
    for domain_name, desc in DOMAINS:
        d = manifest["domains"][domain_name]
        manifest_md += f"| [`{domain_name}/`](file://{ROOT}/{domain_name}) | {desc} | `{d.get('submodule_count', 0)}` | `{d['total_files']:,}` | `{d['total_mb']}` MB |\n"

    manifest_md += "\n---\n\n## 📦 Detailed Submodule Breakdown\n\n"
    
    for domain_name, _ in DOMAINS:
        d = manifest["domains"][domain_name]
        manifest_md += f"### 📂 [`{domain_name}/`](file://{ROOT}/{domain_name})\n\n"
        manifest_md += f"*{d['description']}*  \n"
        manifest_md += f"**Total Files:** {d['total_files']:,} · **Size:** {d['total_mb']} MB\n\n"
        if d.get("submodules"):
            manifest_md += "| Submodule | Files | Size | Path |\n| :--- | :---: | :---: | :--- |\n"
            for sm in d["submodules"]:
                manifest_md += f"| **`{sm['name']}`** | `{sm['file_count']}` | `{sm['size_mb']} MB` | [`{sm['relative_path']}`](file://{ROOT}/{sm['relative_path']}) |\n"
        manifest_md += "\n"

    manifest_md_path = ROOT / "MASTER_MANIFEST.md"
    with open(manifest_md_path, "w", encoding="utf-8") as f:
        f.write(manifest_md)
    print(f"Saved manifest to {manifest_md_path}")

if __name__ == "__main__":
    main()
