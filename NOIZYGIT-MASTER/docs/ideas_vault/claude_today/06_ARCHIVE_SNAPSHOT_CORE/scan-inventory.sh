#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
#  scan-inventory.sh — READ-ONLY. Moves nothing. Deletes nothing.
#  Inventories code + documents across your home folder so we can plan a safe
#  consolidation into ~/NOIZYANTHROPIC.
#
#  🔴 EXTERNAL: run this in Terminal/Warp. Terminal may need Full Disk Access
#     (System Settings → Privacy & Security → Full Disk Access → enable Terminal)
#     so it can read everywhere. Without it, some folders are skipped silently.
#
#  Run:  bash scan-inventory.sh            # scans $HOME
#        bash scan-inventory.sh /some/dir  # scans a specific folder
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail
ROOT="${1:-$HOME}"
OUT="$HOME/NOIZYANTHROPIC/_scan"
mkdir -p "$OUT"
TS="$(date +%Y%m%d-%H%M%S)"
CSV="$OUT/files-$TS.csv"
REPORT="$OUT/inventory-$TS.md"

# Paths we never touch / never count (system, app-managed, dependencies, media libs)
EXCLUDE='/(Library|Applications|\.Trash|node_modules|\.git/|\.cache|\.npm|\.cargo|\.rustup|\.venv|venv|Pods|DerivedData|\.gradle|\.m2|\.cocoapods|\.bun|\.deno)/|\.photoslibrary/|\.musiclibrary/|/Music/iTunes/|/Movies/'

CODE='py js mjs cjs ts tsx jsx go rs rb java kt c cc cpp h hpp cs swift lua php sh bash zsh html css scss sql r ipynb vue svelte json yaml yml toml'
DOCS='doc docx odt rtf pdf md txt pages'

echo "Scanning $ROOT (read-only)…"

# Build the -iname expression
expr=()
for e in $CODE $DOCS; do expr+=( -iname "*.$e" -o ); done
unset 'expr[${#expr[@]}-1]'   # drop trailing -o

find "$ROOT" -type f \( "${expr[@]}" \) 2>/dev/null \
  | grep -vE "$EXCLUDE" \
  > "$CSV" || true

TOTAL=$(wc -l < "$CSV" | tr -d ' ')

{
  echo "# Inventory — $ROOT"
  echo "_Generated $TS · READ-ONLY scan · $TOTAL files_"
  echo
  echo "## Count by type"
  echo '```'
  sed 's/.*\.//' "$CSV" | tr 'A-Z' 'a-z' | sort | uniq -c | sort -rn
  echo '```'
  echo
  echo "## Likely project folders (contain a .git)"
  echo '```'
  find "$ROOT" -maxdepth 4 -type d -name .git 2>/dev/null \
    | grep -vE "$EXCLUDE" \
    | sed 's#/\.git$##' | sort | head -200
  echo '```'
  echo
  echo "## Biggest 30 files found"
  echo '```'
  # portable size sort
  while IFS= read -r f; do
    sz=$(stat -f '%z' "$f" 2>/dev/null || echo 0)
    printf '%012d\t%s\n' "$sz" "$f"
  done < "$CSV" | sort -rn | head -30 | awk -F'\t' '{printf "%10.1f MB  %s\n", $1/1048576, $2}'
  echo '```'
  echo
  echo "Full file list: $CSV"
} > "$REPORT"

echo "✓ Done."
echo "  Report:    $REPORT"
echo "  File list: $CSV"
echo "  Nothing was moved or changed."
