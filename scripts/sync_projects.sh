#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# sync_projects.sh — synchronize consolidated projects from workspace to central NOIZYANTHROPIC
# ─────────────────────────────────────────────────────────────────────────────
set -euo pipefail

SRC_DIR="/Users/m2ultra/Desktop/CLAUDE TODAY/14_NOIZYANTHROPIC/PROJECTS"
DEST_DIR="/Users/m2ultra/NOIZYANTHROPIC/projects"

echo ">>> Synchronizing projects..."
echo "    source: $SRC_DIR"
echo "    destination: $DEST_DIR"
echo

mkdir -p "$DEST_DIR"

# Copy all directories
for dir in "$SRC_DIR"/*; do
  if [ -d "$dir" ]; then
    name=$(basename "$dir")
    echo "  -> Copying $name..."
    rm -rf "$DEST_DIR/$name"
    cp -R "$dir" "$DEST_DIR/"
  fi
done

echo
echo "✓ Sync complete! All projects are now aligned in ~/NOIZYANTHROPIC/projects/"
