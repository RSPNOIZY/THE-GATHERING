#!/usr/bin/env bash
# SHIRL & WINDOWS 11 PREPARATION SCRIPT for m2ultra
# Run this to prep the NOIZYWIN USB drive and Parallels.

echo "================================================="
echo "   SHIRL / HP-OMEN / WINDOWS 11 PREP SCRIPT"
echo "================================================="
echo ""

# 1. Download Windows 11 24H2 ISO
ISO_PATH="$HOME/Downloads/Win11_24H2_English_x64.iso"
if [ ! -f "$ISO_PATH" ]; then
    echo "[1/4] Downloading Windows 11 ISO (approx 6GB)..."
    curl -L "https://software.download.prss.microsoft.com/dbazure/Win11_24H2_English_x64.iso" -o "$ISO_PATH"
else
    echo "[1/4] Windows 11 ISO already downloaded."
fi

# 2. Check balenaEtcher for USB flashing
if [ ! -d "/Applications/balenaEtcher.app" ]; then
    echo "[2/4] Installing balenaEtcher to flash the NOIZYWIN USB drive..."
    brew install --cask balenaetcher
else
    echo "[2/4] balenaEtcher is installed."
fi

# 3. Parallels Dev Environment Check
echo "[3/4] Launching Parallels Desktop to create SHIRL Dev VM..."
open -a "Parallels Desktop"
echo "      -> In Parallels, click '+' and select 'Get Windows 11 from Microsoft'."

# 4. Final USB Instructions
echo ""
echo "[4/4] FLASHING THE NOIZYWIN USB DRIVE"
echo "      WARNING: This will erase all 178GB of data on NOIZYWIN."
echo "      1. Open balenaEtcher"
echo "      2. Select $ISO_PATH as the file"
echo "      3. Select NOIZYWIN (disk6) as the target"
echo "      4. Click Flash!"
echo ""
echo "      Once flashed, copy this entire SHIRL_DEPLOY folder to the USB drive,"
echo "      plug it into the HP-OMEN25L, and boot from it."
echo "================================================="
