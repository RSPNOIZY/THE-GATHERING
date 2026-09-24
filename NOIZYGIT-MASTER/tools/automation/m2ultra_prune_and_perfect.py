#!/usr/bin/env python3
"""
m2ultra_prune_and_perfect.py
Safe, surgical disk cleanup, cache pruning, and performance optimization for M2 Ultra.
Only targets volatile caches, interim build artifacts, and stale logs.
Never modifies source code, audio stems, databases, or active configuration files.
"""

import shutil
import subprocess
import time
from pathlib import Path

HOME = Path("/Users/m2ultra")

CLEANUP_TARGETS = [
    ("NPM Cache", HOME / ".npm" / "_cacache", True),
    ("Xcode DerivedData", HOME / "Library" / "Developer" / "Xcode" / "DerivedData", True),
    ("Pip Cache", HOME / "Library" / "Caches" / "pip", True),
    ("Swift PM Cache", HOME / "Library" / "Caches" / "org.swift.swiftpm", True),
    ("CocoaPods Cache", HOME / "Library" / "Caches" / "CocoaPods", True),
    ("Yarn Cache", HOME / "Library" / "Caches" / "Yarn", True),
    ("TypeScript Build Cache", HOME / "Library" / "Caches" / "typescript", True),
    ("Stale Diagnostic Reports", HOME / "Library" / "Logs" / "DiagnosticReports", False),
]

GREEN = "\033[0;32m"
YELLOW = "\033[1;33m"
CYAN = "\033[0;36m"
BOLD = "\033[1m"
NC = "\033[0m"

def get_dir_size(path_obj):
    if not path_obj.exists():
        return 0
    if path_obj.is_file():
        return path_obj.stat().st_size
    total = 0
    try:
        for f in path_obj.rglob("*"):
            if f.is_file():
                try:
                    total += f.stat().st_size
                except Exception:
                    pass
    except Exception:
        pass
    return total

def format_mb(size_bytes):
    return f"{round(size_bytes / (1024 * 1024), 2)} MB"

def prune_and_perfect(dry_run=False):
    print(f"\n{BOLD}═══════════════════════════════════════════════════════════════{NC}")
    print(f"{BOLD}  ⚡ M2 ULTRA — SAFE SYSTEM PRUNE & PERFORMANCE OPTIMIZER{NC}")
    print(f"{BOLD}  Mode: {'DRY RUN' if dry_run else 'EXECUTION & OPTIMIZATION'}{NC}")
    print(f"{BOLD}═══════════════════════════════════════════════════════════════{NC}\n")

    total_reclaimed = 0

    for label, target_path, is_full_wipe in CLEANUP_TARGETS:
        if not target_path.exists():
            print(f"  • {label}: {CYAN}Clean (0 MB){NC}")
            continue

        size = get_dir_size(target_path)
        if size == 0:
            print(f"  • {label}: {CYAN}Clean (0 MB){NC}")
            continue

        print(f"  • {label}: {YELLOW}{format_mb(size)}{NC} found at {target_path}")

        if not dry_run:
            try:
                if is_full_wipe:
                    for child in target_path.iterdir():
                        if child.is_dir():
                            shutil.rmtree(child, ignore_errors=True)
                        elif child.is_file():
                            child.unlink(missing_ok=True)
                else:
                    # Clean files older than 3 days in logs
                    now = time.time()
                    for f in target_path.glob("*"):
                        if f.is_file() and (now - f.stat().st_mtime > 3 * 86400):
                            try:
                                f.unlink()
                            except Exception:
                                pass
                print(f"    {GREEN}✓ Pruned successfully{NC}")
                total_reclaimed += size
            except Exception as e:
                print(f"    ⚠️ Could not fully prune: {e}")
        else:
            total_reclaimed += size

    # QuickLook cache reset
    if not dry_run:
        try:
            subprocess.run(["qlmanage", "-r", "cache"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
            print(f"  • macOS QuickLook Cache: {GREEN}✓ Reset{NC}")
        except Exception:
            pass

    reclaimed_gb = round(total_reclaimed / (1024 * 1024 * 1024), 2)
    print(f"\n{BOLD}───────────────────────────────────────────────────────────────{NC}")
    print(f"{GREEN}{BOLD}✨ M2 ULTRA OPTIMIZATION COMPLETE{NC}")
    print(f"Reclaimed Space: {BOLD}{reclaimed_gb} GB{NC} ({round(total_reclaimed / (1024 * 1024), 2)} MB)")
    print(f"{BOLD}───────────────────────────────────────────────────────────────{NC}\n")

if __name__ == "__main__":
    import sys
    dry = "--dry-run" in sys.argv
    prune_and_perfect(dry_run=dry)
