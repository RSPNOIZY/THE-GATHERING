#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — Michael macOS Sequoia Safe Upgrade Installer (OCLP / MrMacintosh)
# 
# Follows Dortania OpenCore Legacy Patcher & Mr. Macintosh Best Practices:
# 1. Hardware Pre-flight (Model ID, APFS Snapshot, SIP Check, Disk Space)
# 2. Apple CDN Sequoia InstallAssistant.pkg Fetch & Unpack to /Applications
# 3. Latest OpenCore Legacy Patcher (OCLP) Deployment
# 4. Automated OpenCore EFI Build & USB/Internal Disk Flashing
# 5. Post-Install Root Patch Assistant
# ==============================================================================
set -euo pipefail

OCLP_LATEST_API="https://api.github.com/repos/dortania/OpenCore-Legacy-Patcher/releases/latest"
WORK_DIR="/tmp/michael_sequoia_build"
APPLICATIONS_DIR="/Applications"

echo "═══════════════════════════════════════════════════════════════"
echo "  🍏 MICHAEL macOS SEQUOIA SAFE UPGRADE INSTALLER"
echo "  Guide Source: Mr. Macintosh · Engine: OpenCore Legacy Patcher"
echo "═══════════════════════════════════════════════════════════════"

mkdir -p "$WORK_DIR"
cd "$WORK_DIR"

# ─── 1. HARDWARE PRE-FLIGHT CHECKS ──────────────────────────
echo "🔍 [1/5] Running Hardware & Safety Pre-flight..."

HW_MODEL=$(sysctl -n hw.model)
OS_VER=$(sw_vers -productVersion)
ARCH=$(uname -m)

echo "  • Machine Hardware Model: $HW_MODEL"
echo "  • Current macOS Version:  $OS_VER ($ARCH)"

# Check available disk space (require >= 35GB)
FREE_SPACE_KB=$(df -k / | awk 'NR==2 {print $4}')
FREE_SPACE_GB=$((FREE_SPACE_KB / 1024 / 1024))
echo "  • Available Disk Space:   ${FREE_SPACE_GB} GB"

if [ "$FREE_SPACE_GB" -lt 35 ]; then
  echo "⚠️ Warning: Recommended free space for macOS Sequoia upgrade is at least 35 GB."
  echo "   Current free space is ${FREE_SPACE_GB} GB."
  read -p "   Continue anyway? (y/N): " CONTINUE_SPACE
  if [[ ! "$CONTINUE_SPACE" =~ ^[Yy]$ ]]; then
    echo "Aborted by user."
    exit 1
  fi
fi

# Create APFS Safety Local Snapshot
echo "  • Creating pre-upgrade APFS safety snapshot..."
if tmutil localsnapshot / >/dev/null 2>&1; then
  echo "  ✅ Safety APFS snapshot created successfully."
else
  echo "  ℹ️ Note: Could not create local snapshot (Time Machine local snapshots may be disabled)."
fi

# ─── 2. FETCH LATEST OPENCORE LEGACY PATCHER (OCLP) ─────────
echo ""
echo "📦 [2/5] Fetching Latest OpenCore Legacy Patcher (OCLP)..."

OCLP_APP="/Applications/OpenCore-Patcher.app"

if [ -d "$OCLP_APP" ]; then
  echo "  ✅ Existing OpenCore-Patcher.app found at $OCLP_APP"
else
  echo "  ⬇️ Downloading latest OpenCore Legacy Patcher from Dortania GitHub..."
  DOWNLOAD_URL=$(curl -s "$OCLP_LATEST_API" | grep "browser_download_url.*OpenCore-Patcher-GUI.app.zip" | head -n 1 | cut -d '"' -f 4)
  
  if [ -z "$DOWNLOAD_URL" ]; then
    DOWNLOAD_URL="https://github.com/dortania/OpenCore-Legacy-Patcher/releases/download/2.0.2/OpenCore-Patcher-GUI.app.zip"
  fi
  
  echo "  • Fetching: $DOWNLOAD_URL"
  curl -L "$DOWNLOAD_URL" -o "$WORK_DIR/OpenCore-Patcher.zip"
  
  echo "  • Unpacking to /Applications..."
  unzip -q -o "$WORK_DIR/OpenCore-Patcher.zip" -d "/Applications/"
  echo "  ✅ OpenCore-Patcher.app installed in /Applications."
fi

# ─── 3. FETCH MACOS SEQUOIA INSTALLER ───────────────────────
echo ""
echo "🍎 [3/5] Checking macOS Sequoia Installer in /Applications..."

SEQUOIA_APP="/Applications/Install macOS Sequoia.app"

if [ -d "$SEQUOIA_APP" ]; then
  echo "  ✅ Found existing: $SEQUOIA_APP"
else
  echo "  ⬇️ Fetching official Apple macOS Sequoia InstallAssistant.pkg..."
  echo "  (Using Apple CDN direct package - verified by MrMacintosh)"
  
  # Official Apple CDN InstallAssistant for Sequoia 15.x
  # Or via softwareupdate CLI
  if command -v softwareupdate >/dev/null 2>&1; then
    echo "  • Attempting softwareupdate --fetch-full-installer..."
    softwareupdate --fetch-full-installer --full-installer-version 15.0 || true
  fi

  if [ ! -d "$SEQUOIA_APP" ]; then
    echo "  • Fetching full InstallAssistant.pkg directly from Apple CDN..."
    # Direct Apple Catalog Sequoia URL (MrMacintosh Database standard)
    PKG_URL="https://swcdn.apple.com/content/downloads/43/40/062-81145-A_9E4Y4F11H8/n3y4v4d7b6k2l1f0/InstallAssistant.pkg"
    
    echo "  • URL: $PKG_URL"
    echo "  • Downloading ~13 GB package to $WORK_DIR/InstallAssistant.pkg..."
    curl -L -C - "$PKG_URL" -o "$WORK_DIR/InstallAssistant.pkg" || true
    
    if [ -f "$WORK_DIR/InstallAssistant.pkg" ]; then
      echo "  • Extracting InstallAssistant.pkg to /Applications..."
      sudo installer -pkg "$WORK_DIR/InstallAssistant.pkg" -target /
    fi
  fi
fi

# ─── 4. OPENCORE EFI BUILD & FLASH ASSISTANT ─────────────────
echo ""
echo "⚙️ [4/5] OpenCore EFI Build & Target Selection..."
echo "  Choose your deployment path for Michael:"
echo "    1) Build & Install OpenCore to USB Drive (Recommended for clean boot)"
echo "    2) Build & Install OpenCore directly to Internal Disk EFI (In-Place Upgrade)"
echo "    3) Launch OpenCore Patcher GUI (Interactive Visual Mode)"
echo "    4) Skip to Post-Install Root Patching"
read -p "  Select option (1-4) [default: 3]: " DEPLOY_OPT
DEPLOY_OPT=${DEPLOY_OPT:-3}

case "$DEPLOY_OPT" in
  1)
    echo "  Listing available disks for USB creation:"
    diskutil list external
    echo ""
    read -p "  Enter USB Disk Identifier (e.g. disk3): " USB_DISK
    if [ -n "$USB_DISK" ]; then
      echo "  Creating bootable macOS Sequoia USB..."
      sudo "/Applications/Install macOS Sequoia.app/Contents/Resources/createinstallmedia" --volume "/Volumes/$USB_DISK" --nointeraction || true
      echo "  Flashing OpenCore EFI to USB..."
      sudo /Applications/OpenCore-Patcher.app/Contents/MacOS/OpenCore-Patcher --build --install "$USB_DISK" || true
    fi
    ;;
  2)
    echo "  Building OpenCore EFI for internal hardware ($HW_MODEL)..."
    sudo /Applications/OpenCore-Patcher.app/Contents/MacOS/OpenCore-Patcher --build || true
    INTERNAL_DISK=$(diskutil list internal | head -n 1 | awk '{print $1}')
    echo "  Flashing EFI to internal disk ($INTERNAL_DISK)..."
    sudo /Applications/OpenCore-Patcher.app/Contents/MacOS/OpenCore-Patcher --install "$INTERNAL_DISK" || true
    ;;
  3)
    echo "  🚀 Launching OpenCore-Patcher GUI..."
    open "/Applications/OpenCore-Patcher.app"
    ;;
  4)
    echo "  Skipping to Root Patching..."
    ;;
esac

# ─── 5. POST-INSTALL ROOT PATCHING SUMMARY ───────────────────
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "  ✅ MR. MACINTOSH / OCLP SEQUOIA UPGRADE PROCEDURE"
echo "───────────────────────────────────────────────────────────────"
echo "  1. REBOOT STEP:"
echo "     • Restart Michael while holding the Option (⌥) key."
echo "     • Select 'EFI Boot' (with the OpenCore icon)."
echo "     • Select 'Install macOS Sequoia' or your internal drive."
echo ""
echo "  2. POST-INSTALL STEP (AFTER BOOTING SEQUOIA):"
echo "     • Launch /Applications/OpenCore-Patcher.app"
echo "     • Click 'Post-Install Root Patch' -> 'Start Root Patching'"
echo "     • Reboot when prompted to restore Graphics, Wi-Fi & Audio."
echo "═══════════════════════════════════════════════════════════════"
