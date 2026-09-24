#!/usr/bin/env bash
set -euo pipefail

echo "==> System Settings RESET (safe, reversible)"
echo "This script backs up prefs, clears caches, rebuilds panels, and reopens System Settings."

TS="$(date +%Y%m%d-%H%M%S)"
BACKUP_DIR="$HOME/Desktop/system-settings-backup-$TS"
mkdir -p "$BACKUP_DIR"

step() { echo; echo "[✓] $1"; }

# 0) Backup key prefs
cp -v "$HOME/Library/Preferences/com.apple.systempreferences.plist" "$BACKUP_DIR/" 2>/dev/null || true
cp -v "$HOME/Library/Preferences/com.apple.Spotlight.plist" "$BACKUP_DIR/" 2>/dev/null || true
step "Backed up prefs to $BACKUP_DIR"

# 1) Stop System Settings and preference daemons
killall "System Settings" 2>/dev/null || true
killall cfprefsd 2>/dev/null || true
step "Stopped System Settings and cfprefsd"

# 2) Clear caches and saved state
rm -rf "$HOME/Library/Caches/com.apple.systempreferences"* 2>/dev/null || true
rm -rf "$HOME/Library/Saved Application State/com.apple.systempreferences.savedState" 2>/dev/null || true
defaults delete com.apple.systempreferences 2>/dev/null || true
step "Cleared System Settings caches and domain"

# 3) Rebuild LaunchServices (restores Settings panels discovery)
sudo /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
  -kill -r -domain local -domain system -domain user || true
step "Rebuilt LaunchServices database"

# 4) Refresh ExtensionKit catalog (best-effort)
if command -v pluginkit >/dev/null 2>&1; then
  pluginkit -m >/dev/null 2>&1 || true
  step "Refreshed ExtensionKit catalog"
fi

# 5) Optional: mitigate iCloud Screen Time locking
echo "Tip: If panels re-lock, disable iCloud Screen Time:"
echo "System Settings > Apple ID > iCloud > Show All > Screen Time -> OFF"
echo "System Settings > Screen Time > Share Across Devices -> OFF"

# 6) Reopen System Settings
open -a "System Settings" 2>/dev/null || true
step "System Settings reopened"

echo
echo "✅ Reset complete. If panels still missing or greyed, restart the Mac."
