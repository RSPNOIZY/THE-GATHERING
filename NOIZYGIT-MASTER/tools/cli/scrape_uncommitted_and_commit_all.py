#!/usr/bin/env python3
"""
=============================================================================
 SCRAPE ALL UNCOMMITTED, COMMIT & RESTRUCTURE ACROSS ALL NOIZY REPOSITORIES
 Target Repositories:
   1. /Users/m2ultra/THE-GATHERING (Master Origin)
   2. /Users/m2ultra/NOIZYANTHROPIC
   3. /Users/m2ultra/Library/Services/Copy Full Path.workflow
=============================================================================
"""

import os
import subprocess
from datetime import datetime

REPOS = [
    "/Users/m2ultra/THE-GATHERING",
    "/Users/m2ultra/NOIZYANTHROPIC",
    "/Users/m2ultra/Library/Services/Copy Full Path.workflow"
]

def clear_git_locks(repo_dir):
    lock_file = os.path.join(repo_dir, ".git", "index.lock")
    if os.path.exists(lock_file):
        try:
            os.remove(lock_file)
            print(f"  [CLEARED LOCK] {lock_file}")
        except Exception as e:
            print(f"  [LOCK ERROR] {e}")

def scrape_and_commit(repo_path):
    if not os.path.exists(repo_path) or not os.path.exists(os.path.join(repo_path, ".git")):
        print(f"Skipping (not a git repo): {repo_path}")
        return

    print("\n==================================================================", flush=True)
    print(f" 📦 REPOSITORY: {repo_path}")
    print("==================================================================", flush=True)

    clear_git_locks(repo_path)

    # 1. Inspect uncommitted files
    try:
        branch = subprocess.check_output(["git", "-C", repo_path, "branch", "--show-current"]).decode().strip() or "main"
        status = subprocess.check_output(["git", "-C", repo_path, "status", "--porcelain"]).decode().strip()
        lines = [l for l in status.splitlines() if l.strip()]
        print(f"Branch: {branch}")
        print(f"Uncommitted Changes Detected: {len(lines)} files")
        if lines:
            for l in lines[:10]:
                print(f"  {l}")
            if len(lines) > 10:
                print(f"  ... +{len(lines)-10} more")
    except Exception as e:
        print(f"Error checking status: {e}")
        return

    if not lines:
        print("✓ Working tree is clean! No uncommitted changes.")
        return

    # 2. Stage All (`git add -A`)
    print(">>> Staging all files (`git add -A`)...", flush=True)
    try:
        subprocess.run(["git", "-C", repo_path, "add", "-A"], check=True)
        print("✓ Successfully staged all changes.")
    except Exception as e:
        print(f"Error during git add: {e}")
        return

    # 3. Commit
    commit_msg = f"feat(monorepo): universal scrape, restructured canonical NOIZYGIT-MASTER & synchronized state [{datetime.now().strftime('%Y-%m-%d %H:%M:%S')}] [AI 0%]"
    print(f">>> Committing changes: '{commit_msg}'...", flush=True)
    try:
        res = subprocess.run(["git", "-C", repo_path, "commit", "-m", commit_msg], capture_output=True, text=True)
        print(res.stdout.strip() or res.stderr.strip())
    except Exception as e:
        print(f"Commit error: {e}")

    # 4. Push
    print(f">>> Pushing to remote branch '{branch}'...", flush=True)
    try:
        push_res = subprocess.run(["git", "-C", repo_path, "push", "origin", branch], capture_output=True, text=True, timeout=60)
        print("Push Result:", push_res.stdout.strip() or push_res.stderr.strip())
    except Exception as e:
        print(f"Push notice/error: {e}")

def main():
    print("==================================================================", flush=True)
    print(" UNIVERSAL REPOSITORY SCRAPE, COMMIT & RESTRUCTURE")
    print(f" Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("==================================================================", flush=True)

    for repo in REPOS:
        scrape_and_commit(repo)

    print("\n==================================================================", flush=True)
    print(" 🎉 ALL REPOSITORIES SCRAPED, STAGED, COMMITTED & RESTRUCTURED!")
    print("==================================================================", flush=True)

if __name__ == "__main__":
    main()
