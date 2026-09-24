#!/usr/bin/env bash
# ============================================================
# CLEAN & ORGANIZE ~/Downloads
# Sorts files by type into clean subfolders
# Safe: moves files, never deletes. Dry-run mode available.
#
# Usage:
#   ./clean-downloads.sh              # live run
#   ./clean-downloads.sh --dry-run    # preview only
# ============================================================

set -euo pipefail

DL="$HOME/Downloads"
DRY_RUN=false

[[ "${1:-}" == "--dry-run" ]] && DRY_RUN=true

# Category → extensions mapping
declare -A CATEGORIES
CATEGORIES=(
  ["Images"]="jpg jpeg png gif svg webp heic heif ico bmp tiff tif avif"
  ["Documents"]="pdf doc docx xls xlsx ppt pptx txt rtf odt ods odp pages numbers keynote md csv"
  ["Audio"]="mp3 wav flac aac m4a ogg opus aif aiff wma mid midi"
  ["Video"]="mp4 mov avi mkv wmv flv webm m4v mpg mpeg 3gp"
  ["Archives"]="zip tar gz bz2 xz 7z rar dmg iso pkg sit sitx"
  ["Code"]="py js ts jsx tsx json html css sh bash zsh rb go rs java c cpp h swift toml yaml yml xml sql"
  ["Installers"]="dmg pkg app exe msi deb rpm"
  ["Fonts"]="ttf otf woff woff2 eot"
  ["Design"]="psd ai sketch fig xd eps indd blend"
  ["Data"]="db sqlite sqlite3 csv tsv parquet"
)

# Counters
moved=0
skipped=0
errors=0

echo ""
echo "🧹 CLEAN & ORGANIZE ~/Downloads"
echo "================================"
$DRY_RUN && echo "   MODE: DRY RUN (no files will be moved)"
echo ""

# Count files first
total=$(find "$DL" -maxdepth 1 -type f -not -name ".*" -not -name "clean-downloads.sh" 2>/dev/null | wc -l | tr -d ' ')
echo "📦 Files to sort: $total"
echo ""

if [[ "$total" -eq 0 ]]; then
  echo "✅ Downloads is already clean!"
  exit 0
fi

# Get category for a file extension
get_category() {
  local ext="${1,,}"  # lowercase
  for cat in "${!CATEGORIES[@]}"; do
    for e in ${CATEGORIES[$cat]}; do
      [[ "$e" == "$ext" ]] && echo "$cat" && return
    done
  done
  echo "Other"
}

# Process each file
find "$DL" -maxdepth 1 -type f -not -name ".*" -not -name "clean-downloads.sh" | while read -r file; do
  filename=$(basename "$file")
  ext="${filename##*.}"

  # Skip files without extensions
  if [[ "$filename" == "$ext" ]]; then
    category="Other"
  else
    category=$(get_category "$ext")
  fi

  target_dir="$DL/$category"
  target_file="$target_dir/$filename"

  # Handle name collisions
  if [[ -e "$target_file" ]]; then
    base="${filename%.*}"
    counter=1
    while [[ -e "$target_dir/${base}_${counter}.${ext}" ]]; do
      ((counter++))
    done
    target_file="$target_dir/${base}_${counter}.${ext}"
  fi

  if $DRY_RUN; then
    echo "  → $filename → $category/"
  else
    mkdir -p "$target_dir"
    if mv "$file" "$target_file" 2>/dev/null; then
      echo "  ✅ $filename → $category/"
      ((moved++)) || true
    else
      echo "  ❌ $filename — could not move"
      ((errors++)) || true
    fi
  fi
done

echo ""
echo "================================"
if $DRY_RUN; then
  echo "🔍 DRY RUN COMPLETE — run without --dry-run to execute"
else
  echo "✅ DONE"
  echo "   Moved:   $moved"
  echo "   Errors:  $errors"
fi
echo ""

# Show resulting folder structure
echo "📁 Result:"
find "$DL" -maxdepth 1 -type d -not -name "." -not -path "$DL" | sort | while read -r dir; do
  count=$(find "$dir" -maxdepth 1 -type f 2>/dev/null | wc -l | tr -d ' ')
  echo "   $(basename "$dir")/ — $count files"
done
echo ""
