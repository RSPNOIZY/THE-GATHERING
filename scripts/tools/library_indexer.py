import os
import json
import datetime
from pathlib import Path

# Drives to scan
DRIVES = [
    Path("/Users/m2ultra"),  # System Drive
    Path("/Volumes/12TB"),
    Path("/Volumes/NOIZYWIN"),
    Path("/Users/m2ultra/Library/CloudStorage") # OneDrive, Google Drive
]

# Known vendors/keywords indicative of commercial libraries
VENDORS = {
    'spitfire', 'native instruments', 'output', 'spectrasonics', 'kontakt',
    'splice', 'cinesamples', 'orchestral tools', '8dio', 'heavyocity', 'projectsam',
    'izotope', 'waves', 'arturia', 'uvi', 'soundtoys', 'fabfilter', 'plugin alliance',
    'vsl', 'vienna symphonic', 'eastwest', 'play', 'opus', 'roland', 'korg', 'yamaha',
    'soundiron', 'cinebel', 'audiobro', 'sample logic', 'impact soundworks'
}

# Signatures for sample library files
LIB_EXTS = {'.nki', '.nkc', '.nkr', '.nksn', '.wav', '.aiff', '.flac'}

# Exclusions to speed up scanning
EXCLUDE_DIRS = {
    '.Trash', 'node_modules', '.cache', 'DerivedData', '.git', 'venv', 'env',
    '__pycache__', '.vscode', '.cursor', '.ollama', '.npm', 'THE-GATHERING'
}

def get_folder_size(folder_path):
    total_size = 0
    try:
        for dirpath, _, filenames in os.walk(folder_path):
            for f in filenames:
                fp = os.path.join(dirpath, f)
                if not os.path.islink(fp):
                    total_size += os.path.getsize(fp)
    except Exception:
        pass
    return total_size

def is_library_folder(dirpath, filenames):
    folder_name = os.path.basename(dirpath).lower()
    
    # Check if folder name matches a vendor
    for vendor in VENDORS:
        if vendor in folder_name:
            return True, vendor
            
    # Check if folder contains typical library files
    media_count = 0
    for file in filenames:
        ext = os.path.splitext(file)[1].lower()
        if ext in LIB_EXTS:
            media_count += 1
            if media_count > 10: # threshold to consider it a library component
                return True, "Unknown_Vendor"
                
    return False, None

def index_drives():
    print("🚀 ENGAGING GRAND INDEXER 🚀")
    
    index_data = {
        'scan_time': str(datetime.datetime.now()),
        'libraries': []
    }
    
    for drive in DRIVES:
        if not drive.exists():
            print(f"⚠️ Drive not found: {drive}")
            continue
            
        print(f"Scanning drive: {drive}")
        
        # We limit depth to avoid deep nesting analysis, we just want the root library folders
        # But os.walk is recursive. We'll use a set to skip subdirectories once a root is found.
        skip_dirs = set()
        
        for dirpath, dirnames, filenames in os.walk(drive):
            # Exclusions
            dirnames[:] = [d for d in dirnames if not d.startswith('.') and d not in EXCLUDE_DIRS]
            
            if dirpath in skip_dirs:
                continue
                
            is_lib, vendor = is_library_folder(dirpath, filenames)
            
            if is_lib:
                print(f"Found library: {dirpath} (Vendor: {vendor})")
                
                # Calculate size
                size_bytes = get_folder_size(dirpath)
                
                index_data['libraries'].append({
                    'path': dirpath,
                    'drive': str(drive),
                    'vendor': vendor,
                    'size_bytes': size_bytes,
                    'size_mb': size_bytes / (1024 * 1024)
                })
                
                # Skip subdirectories of this library to avoid redundant entries
                for d in dirnames:
                    skip_dirs.add(os.path.join(dirpath, d))
                    
    # Save the index
    output_path = Path("/Users/m2ultra/THE-GATHERING/docs/library_index.json")
    output_path.parent.mkdir(parents=True, exist_ok=True)
    
    with open(output_path, 'w') as f:
        json.dump(index_data, f, indent=2)
        
    print(f"\n✅ INDEXING COMPLETE.")
    print(f"Found {len(index_data['libraries'])} libraries.")
    print(f"Index saved to: {output_path}")

if __name__ == "__main__":
    index_drives()
