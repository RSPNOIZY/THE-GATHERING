#!/usr/bin/env python3
"""
🔍 FIND ALL UNCOMMITTED IDEATION & GIT REPOSITORIES ACROSS ENTIRE ECOSYSTEM
Scans internal M2 Ultra and all connected drives for uncommitted changes, untracked files,
dangling stashes, and loose ideation markdown/json files.
Fish Music Inc. · NOIZY Ecosystem · RSP_001
"""

import os
import sys
import subprocess
import sqlite3
import csv
from pathlib import Path
from datetime import datetime

OUTPUT_DB = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/UNCOMMITTED_IDEATION_AND_REPOS_REGISTRY.sqlite"
OUTPUT_MD = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/ALL_UNCOMMITTED_IDEATION_AND_GIT_REPOS.md"
OUTPUT_CSV = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/UNCOMMITTED_FILES_MASTER_INDEX.csv"

SEARCH_ROOTS = [
    Path.home(),
    Path.home() / "THE-GATHERING",
    Path.home() / "NOIZYLAB",
    Path.home() / "NOIZYANTHROPIC",
    Path.home() / "Desktop",
    Path.home() / "Documents",
    Path.home() / "Downloads",
    Path.home() / "Library/Mobile Documents/com~apple~CloudDocs",
    Path("/Volumes/12TB"),
    Path("/Volumes/4TB Lacie"),
    Path("/Volumes/2TB_SGW"),
    Path("/Volumes/FREDO"),
    Path("/Volumes/NOIZYWIN")
]

IDEATION_KEYWORDS = [
    "idea", "ideas", "brainstorm", "manifesto", "blueprint", "draft", "scratch",
    "prompt", "chat", "session", "conversations", "wisdom", "dreamchamber", "covenant",
    "todo", "notes", "plan", "roadmap", "concept", "spec", "architecture"
]

def init_db(conn):
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS git_repos (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repo_path TEXT UNIQUE,
            branch TEXT,
            uncommitted_count INTEGER,
            untracked_count INTEGER,
            unpushed_count INTEGER,
            stash_count INTEGER,
            status_summary TEXT,
            last_scanned TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS uncommitted_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            repo_path TEXT,
            file_path TEXT UNIQUE,
            change_type TEXT,
            file_size_bytes INTEGER,
            last_modified TEXT,
            category TEXT
        )
    """)
    cur.execute("""
        CREATE TABLE IF NOT EXISTS loose_ideation_files (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            file_path TEXT UNIQUE,
            title TEXT,
            file_size_bytes INTEGER,
            file_ext TEXT,
            source_root TEXT,
            snippet TEXT,
            last_modified TEXT
        )
    """)
    conn.commit()

def inspect_git_repo(repo_dir, conn):
    cur = conn.cursor()
    repo_path = str(repo_dir)
    try:
        # Branch
        res_br = subprocess.run(["git", "-C", repo_path, "branch", "--show-current"], capture_output=True, text=True, timeout=5)
        branch = res_br.stdout.strip() or "HEAD (detached)"

        # Status porcelain
        res_st = subprocess.run(["git", "-C", repo_path, "status", "--porcelain"], capture_output=True, text=True, timeout=10)
        lines = [l for l in res_st.stdout.splitlines() if l.strip()]
        
        uncommitted = len(lines)
        untracked = len([l for l in lines if l.startswith("??")])

        # Stash list
        res_stash = subprocess.run(["git", "-C", repo_path, "stash", "list"], capture_output=True, text=True, timeout=5)
        stashes = len(res_stash.stdout.strip().splitlines()) if res_stash.stdout.strip() else 0

        # Unpushed commits
        unpushed = 0
        try:
            res_unpushed = subprocess.run(["git", "-C", repo_path, "log", "@{u}..HEAD", "--oneline"], capture_output=True, text=True, timeout=5)
            if res_unpushed.returncode == 0 and res_unpushed.stdout.strip():
                unpushed = len(res_unpushed.stdout.strip().splitlines())
        except Exception:
            pass

        summary = f"{uncommitted} uncommitted ({untracked} untracked), {unpushed} unpushed, {stashes} stashes"
        
        cur.execute("""
            INSERT INTO git_repos (repo_path, branch, uncommitted_count, untracked_count, unpushed_count, stash_count, status_summary, last_scanned)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT(repo_path) DO UPDATE SET
                branch=excluded.branch,
                uncommitted_count=excluded.uncommitted_count,
                untracked_count=excluded.untracked_count,
                unpushed_count=excluded.unpushed_count,
                stash_count=excluded.stash_count,
                status_summary=excluded.status_summary,
                last_scanned=excluded.last_scanned
        """, (repo_path, branch, uncommitted, untracked, unpushed, stashes, summary, datetime.now().isoformat()))

        # Record individual uncommitted files
        for line in lines[:200]:
            code = line[:2].strip()
            rel_file = line[3:].strip()
            full_file = repo_dir / rel_file
            size = full_file.stat().st_size if full_file.exists() else 0
            mtime = datetime.fromtimestamp(full_file.stat().st_mtime).isoformat() if full_file.exists() else ""
            cat = "Ideation" if any(k in rel_file.lower() for k in IDEATION_KEYWORDS) else "Code/Asset"
            
            cur.execute("""
                INSERT INTO uncommitted_files (repo_path, file_path, change_type, file_size_bytes, last_modified, category)
                VALUES (?, ?, ?, ?, ?, ?)
                ON CONFLICT(file_path) DO UPDATE SET
                    change_type=excluded.change_type,
                    file_size_bytes=excluded.file_size_bytes,
                    last_modified=excluded.last_modified
            """, (repo_path, str(full_file), code, size, mtime, cat))

        conn.commit()
        return uncommitted, untracked, unpushed, stashes
    except Exception:
        return 0, 0, 0, 0

def scan_all():
    print("=" * 65)
    print("  🔍 DISCOVERING ALL UNCOMMITTED IDEATION & GIT REPOSITORIES")
    print(f"  Scanning internal M2 Ultra and all connected storage...")
    print("=" * 65)

    os.makedirs(os.path.dirname(OUTPUT_DB), exist_ok=True)
    conn = sqlite3.connect(OUTPUT_DB)
    init_db(conn)
    cur = conn.cursor()

    found_repos = set()
    total_uncommitted_files = 0
    total_loose_ideation = 0

    for root in SEARCH_ROOTS:
        if not root.exists():
            continue
        print(f"\n📂 Scanning Root: {root}...")
        
        # 1. Discover all .git repos
        for parent, dirs, files in os.walk(root):
            # Skip node_modules, cache, system dirs
            dirs[:] = [d for d in dirs if d not in ['.cache', 'node_modules', '.Trash', '__pycache__', '.pytest_cache', 'Caches']]
            
            if '.git' in dirs:
                repo_path = Path(parent)
                if repo_path not in found_repos:
                    found_repos.add(repo_path)
                    print(f"  🐙 Discovered Git Repo: {repo_path.name} ({repo_path})")
                    uncom, untrk, unp, st = inspect_git_repo(repo_path, conn)
                    total_uncommitted_files += uncom
                    if uncom > 0 or unp > 0 or st > 0:
                        print(f"     ⚠️ {uncom} uncommitted, {unp} unpushed, {st} stashed")
                    else:
                        print(f"     ✅ Clean & Synced")
                    # Don't recurse inside repo's subdirs for nested git repos unless deliberate
                    dirs.remove('.git')

            # 2. Check loose ideation markdown and json drafts outside git repos
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext in ['.md', '.txt', '.json', '.canvas']:
                    if any(k in f.lower() for k in IDEATION_KEYWORDS):
                        full_f = Path(parent) / f
                        try:
                            st_stat = full_f.stat()
                            if st_stat.st_size < 10 * 1024 * 1024: # <10MB
                                with open(full_f, 'r', encoding='utf-8', errors='ignore') as fp:
                                    snip = fp.read(300).strip()
                                cur.execute("""
                                    INSERT INTO loose_ideation_files (file_path, title, file_size_bytes, file_ext, source_root, snippet, last_modified)
                                    VALUES (?, ?, ?, ?, ?, ?, ?)
                                    ON CONFLICT(file_path) DO UPDATE SET
                                        file_size_bytes=excluded.file_size_bytes,
                                        snippet=excluded.snippet,
                                        last_modified=excluded.last_modified
                                """, (str(full_f), f, st_stat.st_size, ext, str(root), snip, datetime.fromtimestamp(st_stat.st_mtime).isoformat()))
                                total_loose_ideation += 1
                        except Exception:
                            pass

    conn.commit()

    # Generate Markdown Compendium
    cur.execute("SELECT repo_path, branch, uncommitted_count, untracked_count, unpushed_count, stash_count, status_summary FROM git_repos ORDER BY uncommitted_count DESC")
    repo_rows = cur.fetchall()

    cur.execute("SELECT file_path, change_type, category, last_modified FROM uncommitted_files WHERE category='Ideation' LIMIT 200")
    ideation_uncommitted = cur.fetchall()

    cur.execute("SELECT title, file_path, file_size_bytes, snippet FROM loose_ideation_files ORDER BY id DESC LIMIT 200")
    loose_rows = cur.fetchall()

    with open(OUTPUT_MD, "w", encoding="utf-8") as f:
        f.write("# 🔍 MASTER INVENTORY: UNCOMMITTED IDEATION & GIT REPOSITORIES\n")
        f.write("## Fish Music Inc. · NOIZY Ecosystem · Complete Workspace Discovery\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Principal Sovereign:** Robert Stephen Plowman (`RSP_001`)\n")
        f.write(f"**Total Git Repositories Discovered:** {len(repo_rows):,}\n")
        f.write(f"**Total Uncommitted Files Identified:** {total_uncommitted_files:,}\n")
        f.write(f"**Total Loose Ideation Drafts Cataloged:** {total_loose_ideation:,}\n")
        f.write(f"**Master SQLite Registry:** [`UNCOMMITTED_IDEATION_AND_REPOS_REGISTRY.sqlite`](file://{OUTPUT_DB})\n\n")
        f.write("---\n\n")

        f.write("### 🐙 1. Git Repositories & Uncommitted Working Trees\n\n")
        f.write("| Repository Path | Branch | Uncommitted Files | Untracked | Unpushed Commits | Stashes | Status Summary |\n")
        f.write("|:---|:---|:---|:---|:---|:---|:---|\n")
        for r in repo_rows:
            f.write(f"| `{r[0]}` | `{r[1]}` | **{r[2]}** | {r[3]} | {r[4]} | {r[5]} | `{r[6]}` |\n")
        f.write("\n---\n\n")

        f.write("### 💡 2. Uncommitted Ideation, Blueprints & Brainstorms in Repos\n\n")
        f.write("| File Path | Status | Category | Last Modified |\n")
        f.write("|:---|:---|:---|:---|\n")
        for uf in ideation_uncommitted:
            f.write(f"| [`{uf[0]}`](file://{uf[0]}) | `{uf[1]}` | {uf[2]} | {uf[3]} |\n")
        f.write("\n---\n\n")

        f.write("### 📄 3. Loose Ideation, Drafts & Scratchpads Outside Git\n\n")
        for title, path, sz, snip in loose_rows[:50]:
            f.write(f"#### 🌌 {title} (`{round(sz/1024, 1)} KB`)\n")
            f.write(f"- **Path:** [`{path}`](file://{path})\n\n")
            f.write(f"> {snip}...\n\n")
            f.write("---\n\n")

    # Export CSV
    with open(OUTPUT_CSV, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(["Type", "Repo_Or_Root", "File_Path", "Status_Or_Ext", "Size_Bytes", "Category"])
        for r in repo_rows:
            writer.writerow(["Git_Repo", r[0], r[0], r[1], r[2], r[6]])
        for uf in ideation_uncommitted:
            writer.writerow(["Uncommitted_File", "", uf[0], uf[1], 0, uf[2]])
        for lr in loose_rows:
            writer.writerow(["Loose_Ideation", "", lr[1], "", lr[2], lr[0]])

    conn.close()
    print(f"\n✅ Scan Complete! Discovered {len(repo_rows)} repos, {total_uncommitted_files} uncommitted files, {total_loose_ideation} loose drafts.")
    print(f"📁 Exported to {OUTPUT_MD}, {OUTPUT_CSV}, and {OUTPUT_DB}")

if __name__ == "__main__":
    scan_all()
