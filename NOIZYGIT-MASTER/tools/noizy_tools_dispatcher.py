#!/usr/bin/env python3
import sys
import os
import json

TOOLS_CATALOG = os.path.join(os.path.dirname(__file__), "LOCAL_TOOLS_CATALOG.json")

def list_tools():
    if os.path.exists(TOOLS_CATALOG):
        with open(TOOLS_CATALOG, "r") as f:
            data = json.load(f)
        print(f"=== NOIZY UNIVERSE TOOLS DISPATCHER ({data.get('total_tools', 0)} tools registered) ===")
        print("\n--- System & AI Binaries ---")
        for b in data.get("system_binaries", []):
            print(f"  • {b['binary']:<15} -> {b['path']}")
        print("\n--- Custom Scripts ---")
        for s in data.get("custom_scripts", [])[:20]:
            print(f"  • {s['name']:<25} [{s['category']}]")
        print("\n--- Agent Skills ---")
        for sk in data.get("agent_skills", [])[:15]:
            print(f"  • {sk['name']:<25}")

if __name__ == "__main__":
    if len(sys.argv) < 2 or sys.argv[1] in ["--help", "-h", "list"]:
        list_tools()
    else:
        cmd = sys.argv[1]
        args = sys.argv[2:]
        print(f"Dispatching tool: {cmd} with args {args}")
