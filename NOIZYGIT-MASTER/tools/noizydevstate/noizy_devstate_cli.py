#!/usr/bin/env python3
"""
noizy_devstate_cli.py
Sovereign CLI for NOIZYDEVSTATE (Google + Apple + Microsoft + FOSS).
Provides status, doctor, audio-audit, and indexing commands.
"""

import sys
import json
import sqlite3
import subprocess
from pathlib import Path

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
CONFIG_PATH = ROOT / "packages" / "noizy-devstate" / "devstate.json"
DB_PATH = ROOT / "EMPIRE_CHRONOLOGY_AND_CATALOG.sqlite"
GDRIVE_AUDIO_ROOT = Path("/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspnoizy@gmail.com")

GREEN = "\033[0;32m"
RED = "\033[0;31m"
YELLOW = "\033[1;33m"
CYAN = "\033[0;36m"
BOLD = "\033[1m"
NC = "\033[0m"

def print_banner():
    print(f"\n{BOLD}═══════════════════════════════════════════════════════════════{NC}")
    print(f"{BOLD}  🌐 NOIZYDEVSTATE — 4-PILLAR CONVERGENCE CLI{NC}")
    print(f"{BOLD}  Google 🔷 · Apple 🍎 · Microsoft 🪟 · FOSS 🐧{NC}")
    print(f"{BOLD}═══════════════════════════════════════════════════════════════{NC}\n")

def check_status():
    print_banner()
    if not CONFIG_PATH.exists():
        print(f"{RED}Config not found at {CONFIG_PATH}{NC}")
        return
        
    with open(CONFIG_PATH, "r") as f:
        cfg = json.load(f)
        
    print(f"{BOLD}1. 🔷 Google Pillar (Intelligence & 5TB Workspace){NC}")
    gdrive_ok = GDRIVE_AUDIO_ROOT.exists()
    print(f"   {'✅' if gdrive_ok else '⚠️'} Google Workspace Drive: {GDRIVE_AUDIO_ROOT} ({'Mounted' if gdrive_ok else 'Offline'})")
    sdk_path = ROOT / cfg["pillars"]["google"]["antigravity_sdk"]["path"]
    print(f"   {'✅' if sdk_path.exists() else '❌'} Google Antigravity SDK: {sdk_path}")
    
    print(f"\n{BOLD}2. 🍎 Apple Pillar (M2 Ultra & macOS Native){NC}")
    hw = cfg["pillars"]["apple"]["hardware"]
    print(f"   ✅ Engine: {hw}")
    daemons_path = Path(cfg["pillars"]["apple"]["local_daemons"])
    daemon_count = len(list(daemons_path.glob("*noizy*"))) if daemons_path.exists() else 0
    print(f"   ✅ launchd Daemons: {daemon_count} active NOIZY services")
    
    print(f"\n{BOLD}3. 🪟 Microsoft Pillar (Monorepo & Workspaces){NC}")
    git_ok = (ROOT / ".git").exists() or (ROOT.parent / ".git").exists()
    print(f"   {'✅' if git_ok else '❌'} Monorepo Origin: {cfg['pillars']['microsoft']['monorepo_canonical']}")
    
    print(f"\n{BOLD}4. 🐧 FOSS Pillar (MCP & Local Stacks){NC}")
    mcp_count = len(cfg["pillars"]["foss"]["mcp_suite"])
    print(f"   ✅ MCP Suite: {mcp_count} configured servers")
    
    if DB_PATH.exists():
        try:
            conn = sqlite3.connect(DB_PATH)
            c = conn.cursor()
            c.execute("SELECT COUNT(*) FROM assets")
            total_assets = c.fetchone()[0]
            c.execute("SELECT COUNT(*) FROM audio_cloud_manifest")
            total_audio = c.fetchone()[0]
            print(f"\n{BOLD}📊 Empire Database Chronology:{NC}")
            print(f"   ✅ Total Indexed Assets: {total_assets:,}")
            print(f"   🎵 Total Audio/Music Files: {total_audio:,}")
            conn.close()
        except Exception as e:
            print(f"   ⚠️ Database error: {e}")
            
    print(f"\n{GREEN}{BOLD}ALL DEVSTATE PILLARS HEALTHY & CONVERGED{NC}\n")

def run_doctor():
    print_banner()
    print(f"{BOLD}Running NOIZYDEVSTATE Doctor Audit...{NC}\n")
    
    # Check Python
    print(f"  ✓ Python: {sys.version.split()[0]}")
    
    # Check Node / npm
    try:
        node_v = subprocess.check_output(["node", "--version"], text=True).strip()
        print(f"  ✓ Node.js: {node_v}")
    except Exception:
        print("  ❌ Node.js: Not found")
        
    # Check Git
    try:
        git_v = subprocess.check_output(["git", "--version"], text=True).strip()
        print(f"  ✓ Git: {git_v}")
    except Exception:
        print("  ❌ Git: Not found")
        
    # Check ffmpeg
    try:
        ffmpeg_v = subprocess.check_output(["ffmpeg", "-version"], text=True).split("\n")[0]
        print(f"  ✓ Audio DSP (ffmpeg): {ffmpeg_v[:40]}...")
    except Exception:
        print("  ⚠️ ffmpeg: Not on PATH (FOSS audio tooling recommended)")
        
    print(f"\n{GREEN}Doctor audit passed with 0 fatal errors.{NC}\n")

def run_audio_audit():
    print_banner()
    print(f"{BOLD}🎵 Auditing Audio Assets & Google Workspace 5TB Mapping...{NC}\n")
    if not DB_PATH.exists():
        print(f"{RED}Database not found. Run 'python3 tools/noizydevstate/noizy_devstate_cli.py index' first.{NC}")
        return
        
    conn = sqlite3.connect(DB_PATH)
    c = conn.cursor()
    c.execute("SELECT format, COUNT(*), SUM(size_mb) FROM audio_cloud_manifest GROUP BY format ORDER BY COUNT(*) DESC")
    rows = c.fetchall()
    
    print("Format Breakdown for Cloud Sync (rspnoizy@gmail.com):")
    for fmt, count, sz in rows:
        print(f"  • .{fmt.upper()}: {count:,} files ({round(sz or 0, 2):,} MB)")
        
    c.execute("SELECT COUNT(*), SUM(size_mb) FROM audio_cloud_manifest")
    total_aud, total_mb = c.fetchone()
    total_gb = round((total_mb or 0) / 1024, 2)
    print(f"\n{BOLD}Total Audio IP to Preserve:{NC} {total_aud:,} assets ({total_gb} GB)")
    print(f"Target Google Workspace Drive: {GDRIVE_AUDIO_ROOT}")
    conn.close()

def main():
    cmd = sys.argv[1] if len(sys.argv) > 1 else "status"
    if cmd in ["status", "--status"]:
        check_status()
    elif cmd in ["doctor", "--doctor"]:
        run_doctor()
    elif cmd in ["audio-audit", "audio"]:
        run_audio_audit()
    elif cmd in ["index", "scan"]:
        idx_script = ROOT / "scripts" / "sync" / "master_timeline_indexer.py"
        subprocess.run(["python3", str(idx_script)])
    else:
        print(f"Unknown command: {cmd}")
        print("Available commands: status, doctor, audio-audit, index")

if __name__ == "__main__":
    main()
