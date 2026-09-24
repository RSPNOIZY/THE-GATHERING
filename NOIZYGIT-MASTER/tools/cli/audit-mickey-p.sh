#!/usr/bin/env bash
# ──────────────────────────────────────────────────────────────────────
# audit-mickey-p.sh — Portable macOS Fleet Audit Script
# Part of: RSP-NOIZY Infrastructure
# Purpose: Run on Mickey P (or any Mac) to capture a full machine
#          inventory for account-merge planning and disk health.
#
# Usage:
#   chmod +x audit-mickey-p.sh
#   ./audit-mickey-p.sh            # run as current user
#   sudo ./audit-mickey-p.sh       # run as root for full SMART + all users
#
# Output:  ./audit-<hostname>-<date>/
#          SFTP or AirDrop this directory back to NOIZYANTHROPIC/audits/
# ──────────────────────────────────────────────────────────────────────
set -euo pipefail

# ── Config ───────────────────────────────────────────────────────────
HOSTNAME=$(scutil --get ComputerName 2>/dev/null || hostname -s)
DATE=$(date +%Y%m%d-%H%M%S)
USER_NAME=$(whoami)
OUT_DIR="./audit-${HOSTNAME}-${DATE}"
mkdir -p "$OUT_DIR"

log() { printf "\033[1;36m▸ %s\033[0m\n" "$1"; }
warn() { printf "\033[1;33m⚠ %s\033[0m\n" "$1"; }

log "Starting audit: $HOSTNAME as $USER_NAME"
log "Output directory: $OUT_DIR"

# ── 1. System Profile ───────────────────────────────────────────────
log "Capturing system profile..."
system_profiler SPHardwareDataType SPSoftwareDataType SPStorageDataType \
  > "$OUT_DIR/system-profile.txt" 2>&1

# macOS version details
sw_vers > "$OUT_DIR/sw-vers.txt" 2>&1

# ── 2. Installed Applications ───────────────────────────────────────
log "Scanning installed applications..."

# Global apps
ls -1 /Applications/ > "$OUT_DIR/apps-global.txt" 2>&1 || true

# User apps
if [[ -d "$HOME/Applications" ]]; then
  ls -1 "$HOME/Applications/" > "$OUT_DIR/apps-user.txt" 2>&1
else
  echo "(none)" > "$OUT_DIR/apps-user.txt"
fi

# Full app inventory via system_profiler (includes versions, paths, sources)
system_profiler SPApplicationsDataType -json \
  > "$OUT_DIR/apps-full.json" 2>&1 || \
system_profiler SPApplicationsDataType \
  > "$OUT_DIR/apps-full.txt" 2>&1

# Homebrew (if installed)
if command -v brew &>/dev/null; then
  log "  Homebrew detected — capturing formula + cask lists..."
  brew list --formula > "$OUT_DIR/brew-formulae.txt" 2>&1 || true
  brew list --cask > "$OUT_DIR/brew-casks.txt" 2>&1 || true
  brew bundle dump --file="$OUT_DIR/Brewfile" 2>&1 || true
else
  echo "(homebrew not installed)" > "$OUT_DIR/brew-formulae.txt"
fi

# Mac App Store (if mas-cli installed)
if command -v mas &>/dev/null; then
  mas list > "$OUT_DIR/mas-apps.txt" 2>&1 || true
else
  echo "(mas not installed — skipping App Store inventory)" > "$OUT_DIR/mas-apps.txt"
fi

# ── 3. Plug-ins & Extensions ────────────────────────────────────────
log "Scanning plug-ins and extensions..."

PLUGIN_DIRS=(
  # System-level
  "/Library/Internet Plug-Ins"
  "/Library/Audio/Plug-Ins/Components"
  "/Library/Audio/Plug-Ins/VST"
  "/Library/Audio/Plug-Ins/VST3"
  "/Library/QuickLook"
  "/Library/Spotlight"
  "/Library/PreferencePanes"
  "/Library/Input Methods"
  "/Library/Extensions"
  "/Library/Frameworks"
  # User-level
  "$HOME/Library/Internet Plug-Ins"
  "$HOME/Library/Audio/Plug-Ins/Components"
  "$HOME/Library/Audio/Plug-Ins/VST"
  "$HOME/Library/Audio/Plug-Ins/VST3"
  "$HOME/Library/QuickLook"
  "$HOME/Library/Spotlight"
  "$HOME/Library/PreferencePanes"
  "$HOME/Library/Input Methods"
  "$HOME/Library/Screen Savers"
  "$HOME/Library/Services"
  "$HOME/Library/ColorPickers"
)

for dir in "${PLUGIN_DIRS[@]}"; do
  slug=$(echo "$dir" | tr '/' '_' | tr ' ' '-')
  if [[ -d "$dir" ]]; then
    find "$dir" -maxdepth 2 -type d \( -name "*.plugin" -o -name "*.component" \
      -o -name "*.vst" -o -name "*.vst3" -o -name "*.qlgenerator" \
      -o -name "*.mdimporter" -o -name "*.prefPane" -o -name "*.bundle" \
      -o -name "*.appex" -o -name "*.kext" \) \
      > "$OUT_DIR/plugins${slug}.txt" 2>&1 || true
    # Also just list everything
    ls -1 "$dir" >> "$OUT_DIR/plugins${slug}.txt" 2>&1 || true
  fi
done

# Audio Units via system_profiler
system_profiler SPAudioDataType > "$OUT_DIR/audio-devices.txt" 2>&1 || true

# ── 4. Launch Agents, Daemons, Login Items ───────────────────────────
log "Scanning launch agents, daemons, and login items..."

# LaunchAgents (user)
if [[ -d "$HOME/Library/LaunchAgents" ]]; then
  ls -la "$HOME/Library/LaunchAgents/" > "$OUT_DIR/launchagents-user.txt" 2>&1
  # Dump plist labels
  for plist in "$HOME/Library/LaunchAgents/"*.plist; do
    [[ -f "$plist" ]] && defaults read "$plist" Label 2>/dev/null
  done > "$OUT_DIR/launchagent-labels-user.txt" 2>&1 || true
else
  echo "(none)" > "$OUT_DIR/launchagents-user.txt"
fi

# LaunchAgents (system)
ls -la /Library/LaunchAgents/ > "$OUT_DIR/launchagents-system.txt" 2>&1 || true

# LaunchDaemons (system — may need sudo)
ls -la /Library/LaunchDaemons/ > "$OUT_DIR/launchdaemons-system.txt" 2>&1 || true

# Login items (modern macOS)
if command -v sfltool &>/dev/null; then
  sfltool list > "$OUT_DIR/login-items-sfltool.txt" 2>&1 || true
fi

# Login items via osascript
osascript -e 'tell application "System Events" to get the name of every login item' \
  > "$OUT_DIR/login-items-applescript.txt" 2>&1 || true

# Background items (macOS 13+)
if [[ -d "$HOME/Library/Application Support/com.apple.backgroundtaskmanagementagent" ]]; then
  ls -la "$HOME/Library/Application Support/com.apple.backgroundtaskmanagementagent/" \
    > "$OUT_DIR/background-items.txt" 2>&1 || true
fi

# All running services via launchctl
launchctl list > "$OUT_DIR/launchctl-list.txt" 2>&1 || true

# ── 5. User Accounts ────────────────────────────────────────────────
log "Enumerating user accounts..."

# List all users with UID >= 500 (real users)
dscl . -list /Users UniqueID | awk '$2 >= 500 { print $1, $2 }' \
  > "$OUT_DIR/user-accounts.txt" 2>&1

# Current user details
id > "$OUT_DIR/user-current.txt" 2>&1
groups > "$OUT_DIR/user-groups.txt" 2>&1

# ── 6. Hashed File Manifest (User Home) ─────────────────────────────
log "Building hashed file manifest for $HOME (this may take a while)..."

# File listing with sizes — skips caches, build artifacts, node_modules
find "$HOME" \
  -not -path "*/Library/Caches/*" \
  -not -path "*/.Trash/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/objects/*" \
  -not -path "*/DerivedData/*" \
  -not -path "*/.cache/*" \
  -not -path "*/Cache/*" \
  -not -path "*/__pycache__/*" \
  -maxdepth 5 \
  -type f \
  -printf '%s %p\n' 2>/dev/null | sort -k2 \
  > "$OUT_DIR/home-files.txt" 2>&1 || \
# macOS find doesn't have -printf, use stat instead
find "$HOME" \
  -not -path "*/Library/Caches/*" \
  -not -path "*/.Trash/*" \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/objects/*" \
  -not -path "*/DerivedData/*" \
  -not -path "*/.cache/*" \
  -not -path "*/Cache/*" \
  -not -path "*/__pycache__/*" \
  -maxdepth 5 \
  -type f \
  -exec stat -f '%z %N' {} \; 2>/dev/null | sort -k2 \
  > "$OUT_DIR/home-files.txt" 2>&1 || true

# Directory size summary
du -sh "$HOME"/* 2>/dev/null | sort -rh > "$OUT_DIR/home-dir-sizes.txt" 2>&1 || true

# Key directories hash — quick diff fingerprint
# Hash the sorted listing of Desktop, Documents, Music, Pictures, Movies
for dir in Desktop Documents Music Pictures Movies Downloads Projects Code; do
  target="$HOME/$dir"
  if [[ -d "$target" ]]; then
    find "$target" -maxdepth 3 -type f 2>/dev/null | sort | shasum -a 256 \
      > "$OUT_DIR/hash-${dir}.sha256" 2>&1 || true
    # Count + size
    echo "$dir: $(find "$target" -type f 2>/dev/null | wc -l | tr -d ' ') files, $(du -sh "$target" 2>/dev/null | cut -f1)" \
      >> "$OUT_DIR/home-summary.txt"
  fi
done

# ── 7. Disk Health ──────────────────────────────────────────────────
log "Checking disk health..."

# diskutil
diskutil list > "$OUT_DIR/diskutil-list.txt" 2>&1
diskutil info / > "$OUT_DIR/diskutil-info-root.txt" 2>&1 || true

# APFS container info
diskutil apfs list > "$OUT_DIR/diskutil-apfs.txt" 2>&1 || true

# Disk verification (non-destructive, read-only)
diskutil verifyVolume / > "$OUT_DIR/diskutil-verify-root.txt" 2>&1 || \
  warn "diskutil verifyVolume requires Full Disk Access or sudo"

# SMART status
if command -v smartctl &>/dev/null; then
  log "  smartctl detected — capturing SMART data..."
  # Find the main disk device
  BOOT_DISK=$(diskutil info / 2>/dev/null | grep "Device Node" | awk '{print $NF}')
  if [[ -n "$BOOT_DISK" ]]; then
    # Strip partition number to get base device
    BASE_DISK=$(echo "$BOOT_DISK" | sed 's/s[0-9]*$//')
    smartctl -a "$BASE_DISK" > "$OUT_DIR/smart-boot.txt" 2>&1 || \
      warn "smartctl may need sudo for SMART data"
  fi
  # Also try all disks
  smartctl --scan > "$OUT_DIR/smart-scan.txt" 2>&1 || true
else
  warn "smartctl not installed — install via: brew install smartmontools"
  echo "(smartctl not installed)" > "$OUT_DIR/smart-boot.txt"
  # Fallback: system_profiler SMART
  system_profiler SPNVMeDataType > "$OUT_DIR/nvme-profile.txt" 2>&1 || true
  system_profiler SPSerialATADataType > "$OUT_DIR/sata-profile.txt" 2>&1 || true
fi

# ── 8. Network & Sharing ────────────────────────────────────────────
log "Capturing network and sharing configuration..."

# Network interfaces
ifconfig -a > "$OUT_DIR/network-interfaces.txt" 2>&1 || true
networksetup -listallhardwareports > "$OUT_DIR/network-ports.txt" 2>&1 || true

# Sharing settings (screen sharing, file sharing, etc.)
# This tells us if SMB/AFP sharing is on (relevant for cross-machine access)
sharing -l > "$OUT_DIR/sharing-status.txt" 2>&1 || true

# Bonjour / mDNS name
scutil --get LocalHostName > "$OUT_DIR/bonjour-name.txt" 2>&1 || true

# ── 9. Security & Gatekeeper ────────────────────────────────────────
log "Checking security posture..."

# Gatekeeper
spctl --status > "$OUT_DIR/gatekeeper-status.txt" 2>&1 || true

# SIP status
csrutil status > "$OUT_DIR/sip-status.txt" 2>&1 || true

# FileVault
fdesetup status > "$OUT_DIR/filevault-status.txt" 2>&1 || true

# Firewall
/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate \
  > "$OUT_DIR/firewall-status.txt" 2>&1 || true

# ── 10. Package Receipts ────────────────────────────────────────────
log "Listing package receipts..."
pkgutil --pkgs > "$OUT_DIR/package-receipts.txt" 2>&1 || true

# ── 11. Developer Tools ─────────────────────────────────────────────
log "Checking developer tools..."

{
  echo "--- Xcode ---"
  xcode-select -p 2>&1 || echo "(not installed)"
  echo ""
  echo "--- git ---"
  git --version 2>&1 || echo "(not installed)"
  echo ""
  echo "--- node ---"
  node --version 2>&1 || echo "(not installed)"
  echo ""
  echo "--- npm ---"
  npm --version 2>&1 || echo "(not installed)"
  echo ""
  echo "--- python3 ---"
  python3 --version 2>&1 || echo "(not installed)"
  echo ""
  echo "--- ruby ---"
  ruby --version 2>&1 || echo "(not installed)"
  echo ""
  echo "--- docker ---"
  docker --version 2>&1 || echo "(not installed)"
  echo ""
  echo "--- gcloud ---"
  gcloud --version 2>&1 || echo "(not installed)"
  echo ""
  echo "--- wrangler ---"
  npx wrangler --version 2>&1 || echo "(not installed)"
} > "$OUT_DIR/dev-tools.txt" 2>&1

# ── 12. Generate Summary ────────────────────────────────────────────
log "Generating summary..."

cat > "$OUT_DIR/SUMMARY.md" << HEREDOC
# Audit: ${HOSTNAME}
**Date:** $(date -u '+%Y-%m-%dT%H:%M:%SZ')
**User:** ${USER_NAME}
**macOS:** $(sw_vers -productVersion)
**Machine:** $(sysctl -n hw.model 2>/dev/null || echo "unknown")

## Files Generated
$(ls -1 "$OUT_DIR/" | sed 's/^/- /')

## Quick Stats
- Global apps: $(wc -l < "$OUT_DIR/apps-global.txt" | tr -d ' ')
- User apps: $(cat "$OUT_DIR/apps-user.txt" | grep -v "(none)" | wc -l | tr -d ' ')
- User accounts (UID≥500): $(wc -l < "$OUT_DIR/user-accounts.txt" | tr -d ' ')
- LaunchAgents (user): $(wc -l < "$OUT_DIR/launchagents-user.txt" | tr -d ' ')
- LaunchAgents (system): $(wc -l < "$OUT_DIR/launchagents-system.txt" | tr -d ' ')
- Package receipts: $(wc -l < "$OUT_DIR/package-receipts.txt" | tr -d ' ')

## Next Steps
1. Run this script on Mickey P as EACH user (fish, RSP) to get per-user inventories
2. SFTP/AirDrop the output directories to NOIZYANTHROPIC/audits/
3. Claude will diff the inventories and produce a merge plan

## Usage for Merge Analysis
\`\`\`bash
# From NOIZYANTHROPIC repo on your main machine:
mkdir -p audits
# Copy audit directories here, then:
# diff audits/audit-MickeyP-*-fish/ audits/audit-MickeyP-*-RSP/
\`\`\`
HEREDOC

# ── 13. Create tarball for easy transfer ─────────────────────────────
log "Creating transfer archive..."
tar -czf "${OUT_DIR}.tar.gz" "$OUT_DIR" 2>/dev/null || true

# ── Done ─────────────────────────────────────────────────────────────
echo ""
log "═══════════════════════════════════════════════════════════"
log "  Audit complete: $OUT_DIR"
log "  Archive ready:  ${OUT_DIR}.tar.gz"
log "═══════════════════════════════════════════════════════════"
echo ""
echo "  To transfer to your main machine:"
echo "    scp ${OUT_DIR}.tar.gz you@main-machine:~/NOIZYANTHROPIC/audits/"
echo ""
echo "  Or AirDrop the .tar.gz file."
echo ""
log "Run this script as each user on Mickey P for the full merge picture."
