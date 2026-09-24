#!/usr/bin/env python3
"""
turbo_fishnet.py
The Global Fishnet.
Scans the universe for Heavy Media ("Big Fish") effectively.
Daily Catch Protocol.
"""
import os
import sys
import shutil
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor

# Configuration
SEARCH_DIRS = [
    Path.home() / "NOIZYANTHROPIC" / "NOIZYLAB",
    Path.home() / "Documents/PROJECTS"
]
TARGET_EXTENSIONS = {
    ".nki", ".nkm", ".nkc", ".nicnt", # Kontakt
    ".nkx", ".ncw",                   # Kontakt Samples
    ".wav", ".aif", ".aiff", ".flac", # Audio
    ".mp4", ".mov", ".mkv", ".avi",   # Video
    ".dmg", ".iso", ".img",           # Disk Images
    ".logicx", ".zip", ".tar.gz"      # Archives/Projects
}
ARCHIVE_ROOT = Path("/Volumes/HP-OMEN/ARCHIVE") # Default if mounted
LOCAL_ARCHIVE = Path.home() / "NOIZYANTHROPIC" / "NOIZYLAB" / "_ARCHIVE"

def get_size_mb(path):
    return path.stat().st_size / (1024 * 1024)

def _scan_one_dir(root_dir):
    """Scan a single directory for big media files."""
    hits = []
    if not root_dir.exists():
        return hits
    for path in root_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in TARGET_EXTENSIONS:
            if "_ARCHIVE" in str(path):
                continue
            try:
                size = get_size_mb(path)
                if size > 10:
                    hits.append((path, size))
            except OSError:
                pass
    return hits

def scan_ocean():
    print("🌊 CASTING THE GLOBAL FISHNET (PARALLEL)...")
    print(f"   Targets: {', '.join(TARGET_EXTENSIONS)}")
    
    big_fish = []
    total_size = 0
    
    with ThreadPoolExecutor(max_workers=len(SEARCH_DIRS)) as pool:
        results = pool.map(_scan_one_dir, SEARCH_DIRS)
    
    for hits in results:
        for path, size in hits:
            big_fish.append((path, size))
            total_size += size
            print(f"   🐟 CAUGHT: {path.name} ({size:.1f} MB)")

    print("-" * 40)
    print(f"🦈 TOTAL CATCH: {len(big_fish)} Fish")
    print(f"⚖️  TOTAL WEIGHT: {total_size:.1f} MB")
    print("-" * 40)
    return big_fish

def archive_catch(fish_list):
    dest_root = ARCHIVE_ROOT if ARCHIVE_ROOT.exists() else LOCAL_ARCHIVE
    dest_root.mkdir(parents=True, exist_ok=True)
    
    print(f"📦 ARCHIVING TO: {dest_root}")
    
    for fish, size in fish_list:
        # Create relative structure in archive
        try:
            rel_path = fish.relative_to(Path.home())
        except ValueError:
            rel_path = fish.name
            
        dest_path = dest_root / rel_path
        dest_path.parent.mkdir(parents=True, exist_ok=True)
        
        print(f"   -> Moving {fish.name}...")
        try:
            shutil.move(str(fish), str(dest_path))
        except Exception as e:
            print(f"   ❌ FAILED to move {fish.name}: {e}")

    print("✨ DECK CLEARED.")

def install_cron():
    """Installs daily cron job at 4AM."""
    script_path = Path(__file__).resolve()
    # Cron line: 0 4 * * * /usr/bin/python3 /path/to/script.py --scan >> /path/to/log
    cron_cmd = f"0 4 * * * /usr/bin/python3 {script_path} --scan >> {Path.home()}/NOIZYANTHROPIC/NOIZYLAB/logs/fishnet.log 2>&1"
    
    # Check if exists
    current_cron = subprocess.run(["crontab", "-l"], capture_output=True, text=True).stdout
    if str(script_path) in current_cron:
        print("✅ Fishnet Cron already active.")
        return

    # Add
    new_cron = current_cron + "\n" + cron_cmd + "\n"
    proc = subprocess.Popen(["crontab", "-"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    out, err = proc.communicate(input=new_cron)
    
    if proc.returncode == 0:
        print("✅ FISHNET SCHEDULED: Daily @ 04:00 AM")
    else:
        print(f"❌ Cron Install Failed: {err}")

def main():
    if len(sys.argv) > 1:
        if "--archive" in sys.argv:
            fish = scan_ocean()
            archive_catch(fish)
            return
        if "--install-cron" in sys.argv:
            install_cron()
            return
            
    # Configuration Updates for Kontakt Mode
    if "--kontakt-only" in sys.argv:
        print("🎹 KONTAKT MODE ENGAGED. Scanning for Instruments & Samples...")
        # Override extensions for Kontakt ecosystem
        global TARGET_EXTENSIONS
        TARGET_EXTENSIONS = {
            ".nki", ".nkm", ".nkc", ".nicnt", # Instruments/Banks
            ".nkx", ".ncw", ".wav", ".aif"    # Samples (Compressed/Uncompressed)
        }

    # Backup Mode
    if "--backup-drive" in sys.argv:
        # Detected Drive: GoogleDrive-rp@fishmusicinc.com
        drive_path = Path(os.path.expanduser("~/Library/CloudStorage/GoogleDrive-rp@fishmusicinc.com/My Drive"))
        if not drive_path.exists():
             # Fallback to Shared Drives if My Drive missing (Enterprise)
             drive_path = Path(os.path.expanduser("~/Library/CloudStorage/GoogleDrive-rp@fishmusicinc.com/Shared Drives"))
        
        if not drive_path.exists():
            print(f"❌ DRIVE NOT FOUND AT: {drive_path}")
            return

        dest = drive_path / "NOIZYLAB_LIBRARIES"
        print("♾️  INFINITE BACKUP STARTED.")
        print(f"   Destination: {dest}")
        
        # We start by scanning to find the fish
        fish_list = scan_ocean()
        
        # Then we copy them preserving structure using rsync logic (simulated via python)
        # Actually, for 100% Sync, rsync is better if we just sync the folders containing them.
        # But to follow "Fishnet" logic (selective), we copy specific files.
        archive_catch_to_drive(fish_list, dest)
        return

    scan_ocean()
    print("\nOptions: --archive (Move files), --install-cron (Schedule daily), --kontakt-only (Kontakt Analysis), --backup-drive (Google Drive Sync)")

def archive_catch_to_drive(fish_list, dest_root):
    dest_root.mkdir(parents=True, exist_ok=True)
    count = 0
    for fish, size in fish_list:
        try:
            rel_path = fish.relative_to(Path.home())
        except ValueError:
            rel_path = fish.name
        
        target = dest_root / rel_path
        target.parent.mkdir(parents=True, exist_ok=True)
        
        if not target.exists() or target.stat().st_size != fish.stat().st_size:
            print(f"   📤 UPLOADING: {fish.name} ({size:.1f} MB)...")
            shutil.copy2(str(fish), str(target))
            count += 1
        else:
            # print(f"   ✅ SKIPPING: {fish.name} (Already Synced)")
            pass
            
    print(f"✨ BACKUP COMPLETE. {count} Files Uploaded.")

if __name__ == "__main__":
    main()
