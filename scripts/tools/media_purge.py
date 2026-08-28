import os
import shutil
import datetime
from pathlib import Path

# Paths
ROOT = Path("/Users/m2ultra")
DEST_DIR = Path("/Volumes/12TB/M2_MEDIA_PURGE")
LOG_FILE = Path("/Users/m2ultra/THE-GATHERING/docs/media_purge_log.txt")

# Media Extensions
MEDIA_EXTS = {'.wav', '.mp3', '.mp4', '.mov', '.m4a', '.aiff', '.aif', '.flac', '.avi', '.mkv'}

# Exclusions to prevent breaking applications
EXCLUDE_DIRS = {
    'Library', 'Applications', '.Trash', 'node_modules', '.cache',
    'Pods', 'DerivedData', '.photoslibrary', '.musiclibrary',
    '.gemini', '.cursor', '.vscode', '.ollama', '.npm', 'THE-GATHERING', 'NOIZYANTHROPIC'
}

def purge_media():
    global DEST_DIR
    print("🚀 ENGAGING MEDIA PURGE (ZERO LATENCY PROTOCOL) 🚀")
    
    if not DEST_DIR.exists():
        try:
            DEST_DIR.mkdir(parents=True, exist_ok=True)
            print(f"Created destination: {DEST_DIR}")
        except Exception as e:
            print(f"⚠️ Could not create {DEST_DIR}: {e}")
            print("Falling back to local rescue folder...")
            # Fallback if 12TB is not mounted
            fallback = Path("/Users/m2ultra/THE-GATHERING/12TB_RESCUE/Media_Purge")
            fallback.mkdir(parents=True, exist_ok=True)
            DEST_DIR = fallback

    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    moved_count = 0
    total_size = 0
    
    with open(LOG_FILE, "a") as log:
        log.write(f"\n--- PURGE INITIATED: {datetime.datetime.now()} ---\n")
        
        for dirpath, dirnames, filenames in os.walk(ROOT):
            # Exclude hidden directories and system folders
            dirnames[:] = [d for d in dirnames if not d.startswith('.') and d not in EXCLUDE_DIRS]
            
            for file in filenames:
                ext = Path(file).suffix.lower()
                if ext in MEDIA_EXTS:
                    src_file = Path(dirpath) / file
                    
                    # Maintain relative path in destination
                    rel_path = src_file.relative_to(ROOT)
                    dest_file = DEST_DIR / rel_path
                    
                    try:
                        size = src_file.stat().st_size
                        dest_file.parent.mkdir(parents=True, exist_ok=True)
                        shutil.move(str(src_file), str(dest_file))
                        moved_count += 1
                        total_size += size
                        log.write(f"MOVED: {src_file} -> {dest_file} ({size / (1024*1024):.2f} MB)\n")
                        print(f"Moved: {file}")
                    except Exception as e:
                        log.write(f"ERROR moving {src_file}: {e}\n")
                        print(f"⚠️ Error moving {file}: {e}")
                        
    print(f"\n✅ PURGE COMPLETE.")
    print(f"Files Moved: {moved_count}")
    print(f"Space Reclaimed: {total_size / (1024*1024*1024):.2f} GB")
    print(f"Log written to: {LOG_FILE}")

if __name__ == "__main__":
    purge_media()
