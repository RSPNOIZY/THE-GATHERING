#!/usr/bin/env python3
"""
turbo_recall.py
Total Recall Protocol.
Scans User Projects and ingests metadata into MemCell V3 (Overlap Engine).
"""
import os
import sys
from pathlib import Path

# Configuration
PROJECTS_ROOT = Path(os.path.expanduser("~/Documents/PROJECTS"))
MEMCELL_PATH = Path(os.path.expanduser("~/NOIZYANTHROPIC/NOIZYLAB/scripts/core"))

# Add core to path
sys.path.append(str(MEMCELL_PATH))
try:
    from MemCell_V3 import MemCell
    mc = MemCell()
except ImportError:
    print("❌ Critical: MemCell_V3 not found.")
    sys.exit(1)

def identify_project_type(path):
    """Heuristic to determine project type."""
    if (path / "Assets").exists() and (path / "ProjectSettings").exists():
        return "Unity Game"
    if path.suffix == ".logicx":
        return "Logic Pro Project"
    if (path / "package.json").exists():
        return "Web/Node App"
    if (path / "requirements.txt").exists() or (path / "main.py").exists():
        return "Python App"
    if (path / ".git").exists():
        return "Git Repository"
    return "Unknown Project"

def scan_projects():
    print("🔭 INITIATING TOTAL RECALL SCANS...")
    if not PROJECTS_ROOT.exists():
        print(f"❌ Project Root not found: {PROJECTS_ROOT}")
        return

    projects_found = []
    
    # 1. Scan Top Level Directories
    for item in PROJECTS_ROOT.iterdir():
        if item.name.startswith('.'): continue
        
        project_type = "Folder"
        if item.is_dir():
            project_type = identify_project_type(item)
            # If it's just a generic folder, check one level deeper?
            # For now, treat top-level folders as "Project Containers" or Projects themselves.
            
            # Logic Projects are directories acting as packages
            if item.suffix == ".logicx":
                project_type = "Logic Pro Project"
                
            projects_found.append({
                "name": item.name,
                "type": project_type,
                "path": str(item)
            })

    print(f"✨ FOUND {len(projects_found)} POTENTIAL PROJECTS.")
    
    # 2. Ingest into MemCell
    print("🧠 INGESTING METADATA...")
    for proj in projects_found:
        # Simplify type for memory efficiency
        p_type = proj['type'].replace(" ", "_").lower()
        
        # Track in MemCell
        # Subject: project:<name>
        # Action: ingest_<type>
        mc.track(f"ingest_{p_type}", f"project:{proj['name']}")
        print(f"   -> Recall: {proj['name']} ({proj['type']})")

    print("-" * 40)
    print("✅ TOTAL RECALL COMPLETE.")
    print("   The System now recognizes your work.")

if __name__ == "__main__":
    scan_projects()
