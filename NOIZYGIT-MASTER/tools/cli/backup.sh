#!/usr/bin/env bash
###############################################################################
#  NOIZYLAB — BACKUP SCRIPT 💾
#  "The United Nations of Code"
#  
#  Backs up critical configs, scripts, and mission data.
###############################################################################

set -euo pipefail

BACKUP_ROOT="${BACKUP_ROOT:-/Volumes/12TB/NOIZYLAB_Backups}"
TIMESTAMP=$(date '+%Y%m%d_%H%M%S')
BACKUP_DIR="$BACKUP_ROOT/$TIMESTAMP"

echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   💾 NOIZYLAB BACKUP — $(date)      "
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""

# Ensure backup directory exists
mkdir -p "$BACKUP_DIR"

# Backup sources
SOURCES=(
  "$HOME/.zshrc"
  "$HOME/.zlogin"
  "$HOME/.config/noizylab"
  "/etc/pf.conf"
  "/etc/hosts"
)

# Backup each source
for src in "${SOURCES[@]}"; do
  if [ -e "$src" ]; then
    dst="$BACKUP_DIR$(dirname "$src")"
    mkdir -p "$dst"
    cp -R "$src" "$dst/"
    echo "✅ Backed up: $src"
  else
    echo "⚠️  Not found: $src (skipped)"
  fi
done

# Backup repo state
cd "$(dirname "$0")/.."
REPO_DIR=$(pwd)

echo ""
echo "📦 Creating repository archive..."
git archive --format=tar.gz --prefix="NOIZYLAB-repo/" HEAD > "$BACKUP_DIR/NOIZYLAB-repo.tar.gz"
echo "✅ Archived: $BACKUP_DIR/NOIZYLAB-repo.tar.gz"

# Save git info
git log --oneline -20 > "$BACKUP_DIR/git-log.txt"
git status > "$BACKUP_DIR/git-status.txt"
git remote -v > "$BACKUP_DIR/git-remotes.txt"
echo "✅ Saved git info"

# Backup network config
echo ""
echo "🌐 Saving network configuration..."
networksetup -getMTU Ethernet > "$BACKUP_DIR/mtu-ethernet.txt" 2>/dev/null || echo "N/A" > "$BACKUP_DIR/mtu-ethernet.txt"
networksetup -getMTU 'Thunderbolt Bridge' > "$BACKUP_DIR/mtu-thunderbolt.txt" 2>/dev/null || echo "N/A" > "$BACKUP_DIR/mtu-thunderbolt.txt"
networksetup -listallhardwareports > "$BACKUP_DIR/hardware-ports.txt" 2>/dev/null || true
ifconfig > "$BACKUP_DIR/ifconfig.txt" 2>/dev/null || true
echo "✅ Network config saved"

# Backup Parallels list (if available)
if command -v prlctl &>/dev/null; then
  prlctl list --all > "$BACKUP_DIR/parallels-vms.txt" 2>/dev/null || true
  echo "✅ Parallels VM list saved"
fi

# Create manifest
echo ""
echo "📋 Creating manifest..."
find "$BACKUP_DIR" -type f | sort > "$BACKUP_DIR/MANIFEST.txt"
echo "✅ Manifest created"

# Prune old backups (keep last 10)
echo ""
echo "🧹 Pruning old backups (keeping last 10)..."
ls -1dt "$BACKUP_ROOT"/*/ 2>/dev/null | tail -n +11 | xargs rm -rf 2>/dev/null || true
echo "✅ Cleanup complete"

# Summary
BACKUP_SIZE=$(du -sh "$BACKUP_DIR" | cut -f1)
echo ""
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║   ✅ BACKUP COMPLETE                                           ║"
echo "╠═══════════════════════════════════════════════════════════════╣"
echo "║   Location: $BACKUP_DIR"
echo "║   Size: $BACKUP_SIZE"
echo "║   Files: $(find "$BACKUP_DIR" -type f | wc -l | tr -d ' ')"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo ""
echo "GoRunFree! 💾🚀"
