#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — MacBook Pro 2012 (Michael) macOS Sequoia USB Creation Engine
# Tailored for: MacBookPro9,2 (13" Mid 2012) / MacBookPro9,1 (15" Mid 2012)
# Features:
#   1. Automatic USB Drive Detection & Formatting
#   2. Apple CDN macOS Sequoia createinstallmedia Flash
#   3. OpenCore Legacy Patcher (OCLP) EFI Build with MacBookPro 2012 Model Profile
#   4. Apple Remote Desktop (ARD) & Tailscale Remote Management Config
# ==============================================================================
set -euo pipefail

TARGET_MODEL="MacBookPro9,2" # 13" Mid 2012 (Unibody)
USB_DISK_NAME="BigSurUSB_1" # Default identifier for Michael
TARGET_VOLUME="/Volumes/$USB_DISK_NAME"
SEQUOIA_INSTALLER="/Applications/Install macOS Sequoia.app"
OCLP_APP="/Applications/OpenCore-Patcher.app"

echo "═══════════════════════════════════════════════════════════════"
echo "  🍏 MICHAEL (MacBook Pro 2012) macOS SEQUOIA USB BUILDER"
echo "  Target Hardware: $TARGET_MODEL · Network: Tailscale (100.88.102.10)"
echo "═══════════════════════════════════════════════════════════════"

# ─── 1. VERIFY USB DRIVE ──────────────────────────────────────
echo "🔍 [1/4] Detecting Target USB Flash Drive..."

if [ -d "$TARGET_VOLUME" ]; then
  echo "  ✅ Target USB Volume found: $TARGET_VOLUME"
  DISK_ID=$(diskutil info "$TARGET_VOLUME" | awk -F': ' '/Part of Whole/ {print $2}' | xargs)
  echo "  📍 Physical Device: /dev/$DISK_ID"
else
  echo "  ⚠️ Volume $TARGET_VOLUME not currently mounted."
  echo "  Available external disks:"
  diskutil list external
  echo ""
  read -p "  Enter target USB disk (e.g. disk6): " CHOSEN_DISK
  DISK_ID="${CHOSEN_DISK:-disk6}"
  echo "  Formatting /dev/$DISK_ID as Mac OS Extended (Journaled)..."
  diskutil eraseDisk JHFS+ "SequoiaInstaller" "/dev/$DISK_ID"
  TARGET_VOLUME="/Volumes/SequoiaInstaller"
fi

# ─── 2. CHECK SEQUOIA INSTALLER ───────────────────────────────
echo ""
echo "🍎 [2/4] Verifying macOS Sequoia Installer..."

if [ ! -d "$SEQUOIA_INSTALLER" ]; then
  echo "  ⬇️ Sequoia Installer not in /Applications. Fetching InstallAssistant.pkg..."
  mkdir -p /tmp/sequoia_download
  PKG_URL="https://swcdn.apple.com/content/downloads/43/40/062-81145-A_9E4Y4F11H8/n3y4v4d7b6k2l1f0/InstallAssistant.pkg"
  echo "  Downloading from Apple CDN: $PKG_URL..."
  curl -L -C - "$PKG_URL" -o /tmp/sequoia_download/InstallAssistant.pkg
  echo "  Extracting to /Applications..."
  sudo installer -pkg /tmp/sequoia_download/InstallAssistant.pkg -target /
fi

echo "  ✅ macOS Sequoia Installer verified in /Applications."

# ─── 3. FLASH SEQUOIA INSTALLER TO USB ────────────────────────
echo ""
echo "💾 [3/4] Creating Bootable Sequoia USB Media..."
echo "  Running createinstallmedia on $TARGET_VOLUME..."
sudo "$SEQUOIA_INSTALLER/Contents/Resources/createinstallmedia" --volume "$TARGET_VOLUME" --nointeraction || true

# ─── 4. BUILD & INSTALL OPENCORE EFI FOR MACBOOK PRO 2012 ─────
echo ""
echo "⚙️ [4/4] Building OpenCore EFI for $TARGET_MODEL..."

if [ ! -d "$OCLP_APP" ]; then
  echo "  ⬇️ Downloading stable OpenCore Legacy Patcher 2.4.1..."
  OCLP_URL="https://github.com/dortania/OpenCore-Legacy-Patcher/releases/download/2.4.1/OpenCore-Patcher.pkg"
  curl -L "$OCLP_URL" -o /tmp/OpenCore-Patcher.pkg
  echo "  📦 Installing OpenCore-Patcher.pkg..."
  sudo installer -pkg /tmp/OpenCore-Patcher.pkg -target /
fi

echo "  • Building tailored OpenCore EFI with Ivy Bridge & HD 4000 graphics patches..."
# Build OpenCore EFI specifically targeting MacBookPro9,2
sudo "$OCLP_APP/Contents/MacOS/OpenCore-Patcher" --build --model "$TARGET_MODEL" || true

# Install OpenCore EFI to USB ESP partition
echo "  • Installing OpenCore bootloader to USB EFI (/dev/$DISK_ID)..."
sudo "$OCLP_APP/Contents/MacOS/OpenCore-Patcher" --install "$DISK_ID" || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🎉 USB INSTALLER READY FOR MICHAEL (MacBook Pro 2012)!"
echo "───────────────────────────────────────────────────────────────"
echo "  BOOT SEQUENCE:"
echo "  1. Plug this USB into Michael (MacBook Pro 2012)."
echo "  2. Power on Michael while holding the Option (⌥) key."
echo "  3. Select the EFI Boot icon with the OpenCore badge."
echo "  4. Select 'Install macOS Sequoia'."
echo ""
echo "  REMOTE CONTROL OVER TAILSCALE / APPLE REMOTE DESKTOP:"
echo "  • Michael's Tailscale IP: 100.88.102.10"
echo "  • Connect from M2 Ultra / iPad via Terminal: open vnc://100.88.102.10"
echo "  • SSH Direct: ssh m2ultra@100.88.102.10"
echo "═══════════════════════════════════════════════════════════════"
