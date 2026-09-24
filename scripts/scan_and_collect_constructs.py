#!/usr/bin/env python3
"""
EMPIRE CONSTRUCT SCANNER & COLLECTOR
Scans, extracts, and catalogs all Agents, MCPs, API Constructs, and Ideation documents
across Mac Studio M2 Ultra, CloudStorage, THE-GATHERING repos, and NOIZYWIN.
"""

import os
import sys
import json
import re
from pathlib import Path
from datetime import datetime, timezone

SCAN_ROOTS = [
    Path("/Users/m2ultra/Library/CloudStorage"),
    Path("/Users/m2ultra/NOIZYBEAST/THE-GATHERING"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Users/m2ultra/NOIZY_DREAMCHAMBER"),
    Path("/Users/m2ultra/RSPNOIZY"),
    Path("/Volumes/NOIZYWIN/Windows/MissionControl96/noizylab_2026"),
    Path("/Users/m2ultra/.gemini/antigravity/brain"),
    Path("/Users/m2ultra/.gemini/antigravity-ide/brain")
]

IGNORE_DIRS = {
    ".git", "node_modules", ".venv", "venv", "__pycache__",
    ".Spotlight-V100", "$RECYCLE.BIN", ".Trashes", "extracted_gdrive",
    ".build", "Pods", "Carthage", ".swiftpm", "DerivedData", "Playgrounds"
}

def scan_files():
    agents = []
    mcps = []
    apis = []
    ideation = []
    schemas = []
    workflows = []

    print("🔍 Beginning Empire-wide construct scan...")

    for root_dir in SCAN_ROOTS:
        if not root_dir.exists():
            print(f"  ⚠️ Skipping non-existent root: {root_dir}")
            continue

        print(f"  📂 Scanning: {root_dir}")
        for current_path, dirs, files in os.walk(root_dir, topdown=True):
            # Prune ignored directories
            dirs[:] = [d for d in dirs if d not in IGNORE_DIRS and not d.startswith(".autosave")]

            rel_root = Path(current_path)

            for file_name in files:
                if file_name.startswith("._") or file_name == ".DS_Store":
                    continue

                full_path = rel_root / file_name
                lower_name = file_name.lower()
                str_path = str(full_path).lower()

                try:
                    stat = full_path.stat()
                    size_kb = round(stat.st_size / 1024, 2)
                    mtime = datetime.fromtimestamp(stat.st_mtime, tz=timezone.utc).strftime("%Y-%m-%d %H:%M")
                except Exception:
                    size_kb = 0
                    mtime = "unknown"

                entry = {
                    "name": file_name,
                    "path": str(full_path),
                    "size_kb": size_kb,
                    "modified": mtime
                }

                # 1. MCP Categorization
                if "mcp" in lower_name or "/mcp/" in str_path or "mcp-" in lower_name:
                    if lower_name.endswith((".json", ".py", ".ts", ".js", ".md", ".toml")):
                        mcps.append(entry)

                # 2. Agent Categorization
                elif any(k in lower_name for k in ["agent", "gabriel", "lucy", "shirl", "trinity", "mc96", "orchestrator", "bot"]):
                    if lower_name.endswith((".py", ".ts", ".js", ".swift", ".json", ".yaml", ".yml", ".md", ".sh", ".talon")):
                        agents.append(entry)

                # 3. API & Cloudflare Workers & Network Constructs
                elif any(k in lower_name for k in ["wrangler.toml", "worker", "heaven", "route", "server", "router", "endpoint", "dispatch"]):
                    if lower_name.endswith((".toml", ".ts", ".js", ".py", ".json", ".md")):
                        apis.append(entry)

                # 4. Workflows (n8n, CI/CD, automation)
                elif "workflow" in lower_name or ".github/workflows" in str_path or "n8n" in str_path:
                    if lower_name.endswith((".json", ".yaml", ".yml")):
                        workflows.append(entry)

                # 5. Schemas
                elif lower_name.endswith(".schema.json") or "schema" in lower_name:
                    if lower_name.endswith(".json"):
                        schemas.append(entry)

                # 6. Ideation & Blueprints
                elif any(k in lower_name for k in ["manifesto", "blueprint", "architecture", "playbook", "constitution", "roadmap", "charter", "hvs"]):
                    if lower_name.endswith((".md", ".docx", ".gdoc", ".pdf", ".txt", ".html")):
                        ideation.append(entry)

    catalog = {
        "generated_at": datetime.now(timezone.utc).isoformat(),
        "scan_roots": [str(r) for r in SCAN_ROOTS if r.exists()],
        "metrics": {
            "total_agents_found": len(agents),
            "total_mcps_found": len(mcps),
            "total_apis_workers_found": len(apis),
            "total_workflows_found": len(workflows),
            "total_schemas_found": len(schemas),
            "total_ideation_found": len(ideation)
        },
        "agents": agents,
        "mcps": mcps,
        "apis_and_workers": apis,
        "workflows": workflows,
        "schemas": schemas,
        "ideation_and_blueprints": ideation
    }
    return catalog

def generate_markdown(catalog):
    m = catalog["metrics"]
    ts = catalog["generated_at"]
    
    md = f"""# 🏛️ NOIZY EMPIRE — AGENT, MCP & API CONSTRUCT CATALOG
**Generated:** `{ts}`  
**Node:** Apple Mac Studio M2 Ultra (192GB) & NOIZYWIN Node  
**Status:** Unified Sovereign Construct Index  

---

## 📊 Summary Metrics
| Domain | Count | Description |
| :--- | :--- | :--- |
| **Agents & Swarm Roles** | **{m['total_agents_found']}** | Gabriel, Lucy, Shirley, Trinity-AI, MC96, Orchestrators |
| **Model Context Protocol (MCP)** | **{m['total_mcps_found']}** | Tool servers, configs, DesktopCommander, DreamChamber audio |
| **API Constructs & Workers** | **{m['total_apis_workers_found']}** | HEAVEN API, Cloudflare Workers, D1 DB, routers, Swift conduits |
| **Automation Workflows** | **{m['total_workflows_found']}** | n8n event pipelines, Sentinel probes, GitHub CI/CD actions |
| **Data Schemas** | **{m['total_schemas_found']}** | Agent actions, voice sovereignty, data authority, consent |
| **Ideation & Master Blueprints** | **{m['total_ideation_found']}** | Manifestos, HVS reference, playbooks, legal charters |

---

## 🤖 1. Key Autonomous Agents
"""
    # Sample top unique agents
    seen_agents = set()
    for a in catalog["agents"]:
        base = a["name"].replace(".py", "").replace(".ts", "").replace(".swift", "").replace(".md", "")
        if base not in seen_agents and len(seen_agents) < 30:
            seen_agents.add(base)
            md += f"- **`{a['name']}`** ({a['size_kb']} KB) — `{a['path']}`\n"

    md += "\n---\n\n## 🔌 2. Model Context Protocol (MCP) Ecosystem\n"
    seen_mcps = set()
    for mcp in catalog["mcps"]:
        if mcp["name"] not in seen_mcps and len(seen_mcps) < 25:
            seen_mcps.add(mcp["name"])
            md += f"- **`{mcp['name']}`** (`{mcp['path']}`)\n"

    md += "\n---\n\n## 🌐 3. API Constructs, Workers & Gateways\n"
    seen_apis = set()
    for api in catalog["apis_and_workers"]:
        if api["name"] not in seen_apis and len(seen_apis) < 25:
            seen_apis.add(api["name"])
            md += f"- **`{api['name']}`** (`{api['path']}`)\n"

    md += "\n---\n\n## ⚡ 4. Automation & n8n Workflows\n"
    seen_wf = set()
    for wf in catalog["workflows"]:
        if wf["name"] not in seen_wf and len(seen_wf) < 20:
            seen_wf.add(wf["name"])
            md += f"- **`{wf['name']}`** (`{wf['path']}`)\n"

    md += "\n---\n\n## 📐 5. Data Authority & Action Schemas\n"
    seen_sch = set()
    for sch in catalog["schemas"]:
        if sch["name"] not in seen_sch and len(seen_sch) < 25:
            seen_sch.add(sch["name"])
            md += f"- **`{sch['name']}`** (`{sch['path']}`)\n"

    md += "\n---\n\n## 💡 6. Ideation, Constitutions & Architecture Blueprints\n"
    seen_idea = set()
    for idea in catalog["ideation_and_blueprints"]:
        if idea["name"] not in seen_idea and len(seen_idea) < 30:
            seen_idea.add(idea["name"])
            md += f"- **`{idea['name']}`** ({idea['size_kb']} KB) — `{idea['path']}`\n"

    md += """
---
### 🔒 Storage & Sovereign Parity
* **Primary Git Target:** `THE-GATHERING/NOIZYGIT-MASTER`
* **Local Hardware Node:** `/Volumes/NOIZYWIN/Windows/MissionControl96/noizylab_2026`
* **Rule Invariant:** All creative and architectural constructs are preserved across physical volumes and version-controlled Git remotes.
"""
    return md

def main():
    catalog = scan_files()
    
    # Paths for output
    json_path = Path("/Users/m2ultra/Library/CloudStorage/data/EMPIRE_AGENT_MCP_API_CONSTRUCT_CATALOG.json")
    md_path = Path("/Users/m2ultra/Library/CloudStorage/docs/EMPIRE_AGENT_MCP_API_CONSTRUCT_CATALOG.md")
    
    win_json_path = Path("/Volumes/NOIZYWIN/Windows/MissionControl96/noizylab_2026/EMPIRE_AGENT_MCP_API_CONSTRUCT_CATALOG.json")
    win_md_path = Path("/Volumes/NOIZYWIN/NOIZY_HOTROD_VAULT/EMPIRE_AGENT_MCP_API_CONSTRUCT_CATALOG.md")

    # Write JSON
    json_path.parent.mkdir(parents=True, exist_ok=True)
    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)
    print(f"✅ Saved Catalog JSON: {json_path}")

    # Write Markdown
    md_content = generate_markdown(catalog)
    md_path.parent.mkdir(parents=True, exist_ok=True)
    md_path.write_text(md_content, encoding="utf-8")
    print(f"✅ Saved Catalog Markdown: {md_path}")

    # Mirror to NOIZYWIN
    try:
        win_json_path.parent.mkdir(parents=True, exist_ok=True)
        with open(win_json_path, "w", encoding="utf-8") as f:
            json.dump(catalog, f, indent=2)
        print(f"✅ Mirrored to NOIZYWIN: {win_json_path}")
    except Exception as e:
        print(f"⚠️ Could not write to {win_json_path}: {e}")

    try:
        win_md_path.parent.mkdir(parents=True, exist_ok=True)
        win_md_path.write_text(md_content, encoding="utf-8")
        print(f"✅ Mirrored to NOIZYWIN Vault: {win_md_path}")
    except Exception as e:
        print(f"⚠️ Could not write to {win_md_path}: {e}")

    print("\n🎉 Empire Construct Scan & Collection Complete!")

if __name__ == "__main__":
    main()
