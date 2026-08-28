import os
import shutil
from pathlib import Path

source_list = "/Users/m2ultra/ideas_filtered.txt"
dest_base = "/Users/m2ultra/NOIZYANTHROPIC/Recovered_Ideas"

with open(source_list, 'r') as f:
    files = f.read().splitlines()

for file_path in files:
    if not file_path.strip():
        continue
        
    # The user strictly requested NO COPYING from GoogleDrive or OneDrive
    if 'GoogleDrive' in file_path or 'OneDrive' in file_path:
        print(f"Skipping cloud file (do not copy policy): {file_path}")
        continue

    src = Path(file_path)
    if not src.exists():
        print(f"File not found, skipping: {src}")
        continue
    
    # Preserve folder structure to prevent name collisions (e.g. multiple README.md)
    try:
        rel_path = src.relative_to("/Users/m2ultra")
    except ValueError:
        rel_path = src.relative_to("/")
        
    dest = Path(dest_base) / rel_path
    
    # Create the target parent directories if they don't exist
    dest.parent.mkdir(parents=True, exist_ok=True)
    
    # Move the file safely
    try:
        shutil.move(str(src), str(dest))
        print(f"Moved: {src.name} -> {dest}")
    except Exception as e:
        print(f"Error moving {src.name}: {e}")

print("\n100% Complete! Idea files consolidated.")
