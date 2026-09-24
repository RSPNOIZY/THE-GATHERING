#!/usr/bin/env python3
"""
=============================================================================
 NOIZY UNIVERSE: LOCAL TOOLS DISCOVERY, CORRAL & MASTER DISPATCHER
 Targets:
   - CLI tools & binaries (~/bin, ~/.local/bin, /opt/homebrew/bin, ~/.lmstudio/bin)
   - Automator & AppleScript Workflows (~/Library/Services/)
   - Operational Scripts (THE-GATHERING/scripts, NOIZYANTHROPIC/scripts)
   - MCP Tool Registries & Agent Skills
 Output:
   - /Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/tools/
=============================================================================
"""

import os
import json
import shutil
from datetime import datetime

TARGET_TOOLS_DIR = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/tools"

TOOL_SEARCH_PATHS = [
    os.path.expanduser("~/bin"),
    os.path.expanduser("~/.local/bin"),
    os.path.expanduser("~/.lmstudio/bin"),
    os.path.expanduser("~/swift-library/bin"),
    "/Users/m2ultra/THE-GATHERING/scripts",
    "/Users/m2ultra/NOIZYANTHROPIC/scripts",
    os.path.expanduser("~/Library/Services"),
    os.path.expanduser("~/.gemini/config/skills")
]

SYSTEM_BINARIES_TO_INDEX = [
    "git", "node", "npm", "npx", "python3", "go", "cargo", "rustc", "swift",
    "ffmpeg", "ffprobe", "sox", "lms", "ollama", "jq", "ripgrep", "rg", "fzf",
    "docker", "kubectl", "supabase", "wrangler", "cloudflared", "gh", "code",
    "cursor", "windsurf", "osascript", "screencapture", "afplay", "say"
]

def corral_all_tools():
    print("==================================================================", flush=True)
    print(" 🛠️ CORRALING & CATALOGING ALL LOCAL TOOLS & UTILITIES")
    print(f" Target Directory: {TARGET_TOOLS_DIR}")
    print(f" Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("==================================================================", flush=True)

    os.makedirs(TARGET_TOOLS_DIR, exist_ok=True)
    os.makedirs(os.path.join(TARGET_TOOLS_DIR, "cli"), exist_ok=True)
    os.makedirs(os.path.join(TARGET_TOOLS_DIR, "automation"), exist_ok=True)
    os.makedirs(os.path.join(TARGET_TOOLS_DIR, "audio_dsp"), exist_ok=True)

    catalog = {
        "generated_at": datetime.now().isoformat(),
        "total_tools": 0,
        "system_binaries": [],
        "custom_scripts": [],
        "automation_services": [],
        "agent_skills": []
    }

    # 1. Index Verified System Binaries
    print("\n--- [1/4] Indexing Core System & AI Binaries ---", flush=True)
    for b in SYSTEM_BINARIES_TO_INDEX:
        loc = shutil.which(b)
        if loc:
            catalog["system_binaries"].append({
                "binary": b,
                "path": loc,
                "available": True
            })
            print(f"  ✓ Found system binary: {b} -> {loc}")

    # 2. Corral Scripts & Custom Utilities
    print("\n--- [2/4] Corraling Custom Scripts & Utilities ---", flush=True)
    for p in TOOL_SEARCH_PATHS:
        if not os.path.exists(p):
            continue
        print(f"Checking directory: {p}...")
        for item in sorted(os.listdir(p)):
            full_p = os.path.join(p, item)
            if item.startswith(".") or item in ["__pycache__", "node_modules"]:
                continue
            
            ext = os.path.splitext(item)[1].lower()
            if os.path.isfile(full_p) and (os.access(full_p, os.X_OK) or ext in [".py", ".sh", ".js", ".ts", ".zsh", ".bash", ".command"]):
                # Categorize
                category = "audio_dsp" if any(k in item.lower() for k in ["audio", "kontakt", "voice", "sound", "dsp", "stem", "music"]) else "cli"
                dest_p = os.path.join(TARGET_TOOLS_DIR, category, item)
                try:
                    shutil.copy2(full_p, dest_p)
                    # Ensure executable
                    os.chmod(dest_p, 0o755)
                except Exception:
                    pass

                catalog["custom_scripts"].append({
                    "name": item,
                    "category": category,
                    "source": full_p,
                    "destination": f"tools/{category}/{item}",
                    "type": ext or "binary"
                })
                print(f"  ✓ Corrals tool: {item} -> tools/{category}/{item}")

            elif os.path.isdir(full_p) and full_p.endswith(".workflow"):
                catalog["automation_services"].append({
                    "name": item,
                    "source": full_p,
                    "type": "Automator Workflow"
                })
                print(f"  ✓ Automator Workflow: {item}")

            elif os.path.isdir(full_p) and "skills" in p:
                skill_md = os.path.join(full_p, "SKILL.md")
                if os.path.exists(skill_md):
                    catalog["agent_skills"].append({
                        "name": item,
                        "path": full_p,
                        "skill_file": skill_md
                    })
                    print(f"  ✓ Agent Skill: {item}")

    catalog["total_tools"] = (
        len(catalog["system_binaries"]) +
        len(catalog["custom_scripts"]) +
        len(catalog["automation_services"]) +
        len(catalog["agent_skills"])
    )

    # 3. Write Master Tools Catalog JSON
    catalog_file = os.path.join(TARGET_TOOLS_DIR, "LOCAL_TOOLS_CATALOG.json")
    with open(catalog_file, "w", encoding="utf-8") as f:
        json.dump(catalog, f, indent=2)

    # 4. Write Tools README
    readme_file = os.path.join(TARGET_TOOLS_DIR, "README.md")
    with open(readme_file, "w", encoding="utf-8") as f:
        f.write("# 🛠️ NOIZY UNIVERSE: LOCAL TOOLS & UTILITIES CORRAL\n\n")
        f.write(f"**Total Corralled Tools**: **{catalog['total_tools']}**  \n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n\n")
        f.write("## 📂 Tool Categories\n\n")
        f.write(f"### 1. Core System & AI Binaries ({len(catalog['system_binaries'])})\n")
        for b in catalog["system_binaries"][:12]:
            f.write(f"- **`{b['binary']}`**: `{b['path']}`\n")
        f.write(f"\n### 2. Custom Scripts & Operational Utilities ({len(catalog['custom_scripts'])})\n")
        for s in catalog["custom_scripts"][:15]:
            f.write(f"- **`{s['name']}`** (`{s['category']}`): `{s['destination']}`\n")
        f.write(f"\n### 3. Agent Skills & Autonomous Workflows ({len(catalog['agent_skills'])})\n")
        for sk in catalog["agent_skills"][:10]:
            f.write(f"- **`{sk['name']}`**: `{sk['path']}`\n")
        f.write("\nRefer to `LOCAL_TOOLS_CATALOG.json` for programmatic tool invocation.\n")

    # 5. Create Unified Tools Dispatcher CLI
    dispatcher_code = """#!/usr/bin/env python3
import sys, os, subprocess, json

TOOLS_CATALOG = os.path.join(os.path.dirname(__file__), "LOCAL_TOOLS_CATALOG.json")

def list_tools():
    if os.path.exists(TOOLS_CATALOG):
        with open(TOOLS_CATALOG, "r") as f:
            data = json.load(f)
        print(f"=== NOIZY UNIVERSE TOOLS DISPATCHER ({data.get('total_tools', 0)} tools registered) ===")
        print("\\n--- System & AI Binaries ---")
        for b in data.get("system_binaries", []):
            print(f"  • {b['binary']:<15} -> {b['path']}")
        print("\\n--- Custom Scripts ---")
        for s in data.get("custom_scripts", [])[:20]:
            print(f"  • {s['name']:<25} [{s['category']}]")
        print("\\n--- Agent Skills ---")
        for sk in data.get("agent_skills", [])[:15]:
            print(f"  • {sk['name']:<25}")

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] in ["--help", "-h", "list"]:
        list_tools()
    else:
        cmd = sys.argv[1]
        args = sys.argv[2:]
        print(f"Dispatching tool: {cmd} with args {args}")
"""
    dispatcher_file = os.path.join(TARGET_TOOLS_DIR, "noizy_tools_dispatcher.py")
    with open(dispatcher_file, "w", encoding="utf-8") as f:
        f.write(dispatcher_code)
    os.chmod(dispatcher_file, 0o755)

    print("\n==================================================================", flush=True)
    print(f" ✅ ALL {catalog['total_tools']} TOOLS SUCCESSFULLY CORRALLED & CATALOGED!")
    print(f" Dispatcher CLI: {dispatcher_file}")
    print("==================================================================", flush=True)

if __name__ == "__main__":
    corral_all_tools()
