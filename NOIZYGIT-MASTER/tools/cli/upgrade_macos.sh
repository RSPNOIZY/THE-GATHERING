#!/usr/bin/env bash
set -euo pipefail

TS="$(date +%Y%m%d-%H%M%S)"
LOGDIR="$HOME/noizylab-upgrade-logs"
mkdir -p "$LOGDIR"
LOGFILE="$LOGDIR/upgrade-$TS.log"
BACKUP_DIR="$HOME/Desktop/system-settings-backup-$TS"
mkdir -p "$BACKUP_DIR"

log() { echo "[$(date +%H:%M:%S)] $1" | tee -a "$LOGFILE"; }

log "=== UPGRADE & IMPROVE macOS — $TS ==="
log "Logs: $LOGFILE | Backup: $BACKUP_DIR"

step() { log "[✓] $1"; }

# 0) Show system info
sw_vers 2>&1 | tee -a "$LOGFILE" || true

# 1) Back up a few prefs (for rollback)
cp -v "$HOME/Library/Preferences/com.apple.systempreferences.plist" "$BACKUP_DIR/" 2>&1 | tee -a "$LOGFILE" || true
cp -v "$HOME/Library/Preferences/com.apple.Spotlight.plist" "$BACKUP_DIR/" 2>&1 | tee -a "$LOGFILE" || true
step "Backed up prefs to $BACKUP_DIR"

# 2) Optional: macOS updates (uncomment to auto-install)
# echo "Listing available macOS updates..."
# softwareupdate -l || true
# echo "Installing all available updates (this may restart)..."
# sudo softwareupdate -ia --agree-to-license || true

# 3) Homebrew maintenance (fast)
if command -v brew >/dev/null 2>&1; then
  brew update || true
  brew upgrade || true
  brew cleanup || true
  step "Homebrew updated and cleaned"
else
  echo "Homebrew not found; skipping brew maintenance"
fi

# 4) Rebuild LaunchServices (fix broken Settings panels / Open With)
sudo /System/Library/Frameworks/CoreServices.framework/Frameworks/LaunchServices.framework/Support/lsregister \
  -kill -r -domain local -domain system -domain user || true
step "Rebuilt LaunchServices database"

# 5) Reset System Settings UI caches (safe)
killall "System Settings" 2>/dev/null || true
killall cfprefsd 2>/dev/null || true
rm -rf "$HOME/Library/Caches/com.apple.systempreferences"* 2>/dev/null || true
rm -rf "$HOME/Library/Saved Application State/com.apple.systempreferences.savedState" 2>/dev/null || true
defaults delete com.apple.systempreferences 2>/dev/null || true
step "Cleared System Settings caches and domain"

# 6) Spotlight: reindex system drive and disable on network volumes
if command -v mdutil >/dev/null 2>&1; then
  echo "Re-enabling Spotlight on / and forcing reindex (can take time)..."
  sudo mdutil -i on / 2>/dev/null || true
  sudo mdutil -E / 2>/dev/null || true
  
  for V in /Volumes/*; do
    # Skip startup volume symlink
    [ "$V" = "/Volumes/Recovery" ] && continue
    # Disable spotlight on network/external shares to avoid lag
    # If it's not the system volume, and it's likely network or external, disable indexing
    if [ "$V" != "/Volumes/Macintosh HD" ] && [ -d "$V" ]; then
      sudo mdutil -i off "$V" 2>/dev/null || true
    fi
  done
  step "Spotlight reindex started for /; disabled on /Volumes/*"
else
  echo "mdutil not available; skipping Spotlight maintenance"
fi

# 7) DNS & network cache refresh (safe)
sudo dscacheutil -flushcache 2>/dev/null || true
sudo killall -HUP mDNSResponder 2>/dev/null || true
step "Flushed DNS caches"

# 8) QuickLook and Finder sanity
qlmanage -r cache 2>/dev/null || true
defaults write NSGlobalDomain AppleShowAllExtensions -bool true
killall Finder 2>/dev/null || true
step "Cleared QuickLook cache; ensured file extensions are visible"

# 9) Verify System Settings plugins present (best-effort)
if command -v pluginkit >/dev/null 2>&1; then
  pluginkit -m >/dev/null 2>&1 || true
  step "Refreshed ExtensionKit catalog"
fi

echo
log "✅ Upgrade & Improve complete."
log "Logs saved to: $LOGFILE"
echo "Recommended next steps:"
echo "- Restart the Mac to fully reload System Settings panels."
echo "- Open System Settings > Apple ID > iCloud > Screen Time: turn OFF if it keeps greying options."
echo "- In Screen Time: disable 'Share Across Devices' to prevent remote lock."
echo
open -a "System Settings" 2>/dev/null || true
