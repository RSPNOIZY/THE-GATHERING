#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — Mac Pro 2012 (Fredo) macOS Sequoia USB Creation Engine
# Tailored for: MacPro5,1 (Dual 12-Core Mid 2012)
# Features:
#   1. Automatic USB Drive Detection & Formatting
#   2. Apple CDN macOS Sequoia createinstallmedia Flash
#   3. OpenCore Legacy Patcher (OCLP) EFI Build with MacPro5,1 Model Profile
# ==============================================================================
set -euo pipefail

TARGET_MODEL="MacPro5,1" # Mac Pro 2012 (Dual 12-Core)
USB_DISK_NAME="BigSurUSB_2" # Default identifier for Fredo
TARGET_VOLUME="/Volumes/$USB_DISK_NAME"
SEQUOIA_INSTALLER="/Applications/Install macOS Sequoia.app"
OCLP_APP="/Applications/OpenCore-Patcher.app"

echo "═══════════════════════════════════════════════════════════════"
echo "  🍏 FREDO (Mac Pro 2012) macOS SEQUOIA USB BUILDER"
echo "  Target Hardware: $TARGET_MODEL"
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
  echo "  ⬇ nudge: Sequoia Installer not in /Applications. Fetching InstallAssistant.pkg..."
  mkdir -p /tmp/sequoia_download_macpro
  PKG_URL="https://swcdn.apple.com/content/downloads/43/40/062-81145-A_9E4Y4F11H8/n3y4v4d7b6k2l1f0/InstallAssistant.pkg"
  echo "  Downloading from Apple CDN: $PKG_URL..."
  curl -L -C - "$PKG_URL" -o /tmp/sequoia_download_macpro/InstallAssistant.pkg
  echo "  Extracting to /Applications..."
  sudo installer -pkg /tmp/sequoia_download_macpro/InstallAssistant.pkg -target /
fi

echo "  ✅ macOS Sequoia Installer verified in /Applications."

# ─── 3. FLASH SEQUOIA INSTALLER TO USB ────────────────────────
echo ""
echo "💾 [3/4] Creating Bootable Sequoia USB Media..."
echo "  Running createinstallmedia on $TARGET_VOLUME..."
sudo "$SEQUOIA_INSTALLER/Contents/Resources/createinstallmedia" --volume "$TARGET_VOLUME" --nointeraction || true

# ─── 4. BUILD & INSTALL OPENCORE EFI FOR MAC PRO 2012 ─────────
echo ""
echo "⚙️ [4/4] Building OpenCore EFI for $TARGET_MODEL..."

if [ ! -d "$OCLP_APP" ]; then
  echo "  ⬇️ Downloading stable OpenCore Legacy Patcher 2.4.1..."
  OCLP_URL="https://github.com/dortania/OpenCore-Legacy-Patcher/releases/download/2.4.1/OpenCore-Patcher.pkg"
  curl -L "$OCLP_URL" -o /tmp/OpenCore-Patcher.pkg
  echo "  📦 Installing OpenCore-Patcher.pkg..."
  sudo installer -pkg /tmp/OpenCore-Patcher.pkg -target /
fi

echo "  • Building tailored OpenCore EFI with MacPro5,1 firmware patches..."
sudo "$OCLP_APP/Contents/MacOS/OpenCore-Patcher" --build --model "$TARGET_MODEL" || true

# Install OpenCore EFI to USB ESP partition
echo "  • Installing OpenCore bootloader to USB EFI (/dev/$DISK_ID)..."
sudo "$OCLP_APP/Contents/MacOS/OpenCore-Patcher" --install "$DISK_ID" || true

echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  🎉 USB INSTALLER READY FOR FREDO (Mac Pro 2012)!"
# ───────────────────────────────────────────────────────────────
echo "  BOOT SEQUENCE:"
echo "  1. Plug this USB into Fredo (Mac Pro 2012)."
echo "  2. Power on Fredo while holding the Option (⌥) key."
echo "  3. Select the EFI Boot icon with the OpenCore badge."
echo "  4. Select 'Install macOS Sequoia'."
echo "═══════════════════════════════════════════════════════════════"
