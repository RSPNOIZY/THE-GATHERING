import os
import shutil
import datetime
from pathlib import Path

# Paths
ROOT = Path("/Users/m2ultra")
DEST_DIR = Path("/Users/m2ultra/THE-GATHERING/Code_Universe/Ideas")
LOG_FILE = Path("/Users/m2ultra/THE-GATHERING/docs/idea_harvester_log.txt")

# Target Extensions for Ideas/Documents
IDEA_EXTS = {'.md', '.txt', '.pdf', '.docx', '.json', '.rtf', '.csv', '.pages', '.odt'}

# Known Brands for grouping
BRANDS = ['NOIZY', 'NOIZYFISH', 'NOIZYVOX', 'NOIZYKIDZ', 'FISHMUSIC', 'DREAMCHAMBER', 'GABRIEL', 'LUCY', 'MC96', 'AQUARIUM']

# Exclusions
EXCLUDE_DIRS = {
    'Library', 'Applications', '.Trash', 'node_modules', '.cache',
    'Pods', 'DerivedData', '.photoslibrary', '.musiclibrary',
    '.gemini', '.cursor', '.vscode', '.ollama', '.npm', 'THE-GATHERING', 'NOIZYANTHROPIC',
    '.git', 'venv', 'env', '__pycache__', '.pytest_cache', 'build', 'dist', '.idea'
}

def get_brand_group(filename):
    upper_name = filename.upper()
    for brand in BRANDS:
        if brand in upper_name:
            return brand
    return "Ungrouped"

def harvest_ideas():
    print("🚀 ENGAGING IDEA HARVESTER 🚀")
    
    DEST_DIR.mkdir(parents=True, exist_ok=True)
    LOG_FILE.parent.mkdir(parents=True, exist_ok=True)
    
    moved_count = 0
    
    with open(LOG_FILE, "a") as log:
        log.write(f"\n--- HARVEST INITIATED: {datetime.datetime.now()} ---\n")
        
        for dirpath, dirnames, filenames in os.walk(ROOT):
            # Prune excluded directories
            dirnames[:] = [d for d in dirnames if not d.startswith('.') and d not in EXCLUDE_DIRS]
            
            # Skip if we are inside a .git directory (handled by dirnames prune, but just in case)
            if '.git' in Path(dirpath).parts:
                continue
                
            for file in filenames:
                # Skip hidden files
                if file.startswith('.'):
                    continue
                    
                ext = Path(file).suffix.lower()
                if ext in IDEA_EXTS:
                    src_file = Path(dirpath) / file
                    
                    # Determine grouping
                    brand = get_brand_group(file)
                    ext_folder = ext.replace('.', '').upper()
                    if not ext_folder:
                        ext_folder = "NO_EXT"
                        
                    # Create destination path: THE-GATHERING/Code_Universe/Ideas/<Brand>/<Extension>/
                    dest_folder = DEST_DIR / brand / ext_folder
                    dest_folder.mkdir(parents=True, exist_ok=True)
                    
                    # Handle naming collisions
                    dest_file = dest_folder / file
                    counter = 1
                    while dest_file.exists():
                        dest_file = dest_folder / f"{src_file.stem}_{counter}{ext}"
                        counter += 1
                        
                    try:
                        shutil.move(str(src_file), str(dest_file))
                        moved_count += 1
                        log.write(f"HARVESTED: {src_file} -> {dest_file}\n")
                        print(f"Harvested: {file} -> {brand}/{ext_folder}")
                    except Exception as e:
                        log.write(f"ERROR harvesting {src_file}: {e}\n")
                        print(f"⚠️ Error harvesting {file}: {e}")
                        
    print(f"\n✅ HARVEST COMPLETE.")
    print(f"Ideas Harvested: {moved_count}")
    print(f"Log written to: {LOG_FILE}")

if __name__ == "__main__":
    harvest_ideas()
