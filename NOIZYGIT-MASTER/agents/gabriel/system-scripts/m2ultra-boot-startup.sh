#!/bin/zsh
# M2Ultra Persistent Boot Startup Script
# This script runs automatically on system startup
# Initializes all services and aliases

echo "🚀 M2Ultra Boot Startup - $(date)" >> ~/.m2ultra-boot.log

# ============================================================================
# ENVIRONMENT INITIALIZATION
# ============================================================================

export NOIZYLAB_HOME="/Users/m2ultra/.claude-worktrees/NOIZYLAB/upbeat-moore"
export DRIVE_RED_DRAGON="/Volumes/RED DRAGON"
export DRIVE_RSP="/Volumes/RSP"
export DRIVE_DATA="/Volumes/RSP/NOISYLABZ"

# ============================================================================
# LOAD ALIASES & FUNCTIONS
# ============================================================================

if [ -f ~/.zsh_aliases ]; then
    source ~/.zsh_aliases
    echo "✅ Aliases loaded" >> ~/.m2ultra-boot.log
fi

# ============================================================================
# START ESSENTIAL SERVICES
# ============================================================================

# Enable SSH (if not already running)
sudo systemsetup -setremotelogin on 2>/dev/null
echo "✅ SSH enabled" >> ~/.m2ultra-boot.log

# Start Screen Sharing
if pgrep -x "ARDAgent" > /dev/null; then
    echo "✅ Screen Sharing already running" >> ~/.m2ultra-boot.log
else
    sudo /System/Library/CoreServices/RemoteManagement/ARDAgent.app/Contents/Resources/kickstart -activate -configure -access -on -users admin -privs -all -restart -agent -console 2>/dev/null
    echo "✅ Screen Sharing started" >> ~/.m2ultra-boot.log
fi

# ============================================================================
# MOUNT DRIVES
# ============================================================================

# Mount RED DRAGON if available
if [ ! -d "$DRIVE_RED_DRAGON" ]; then
    mount_afp "afp://RED_DRAGON_IP/RED_DRAGON" "$DRIVE_RED_DRAGON" 2>/dev/null
    echo "✅ RED DRAGON mounted (if available)" >> ~/.m2ultra-boot.log
fi

# Mount RSP if available
if [ ! -d "$DRIVE_RSP" ]; then
    mount_afp "afp://RSP_IP/RSP" "$DRIVE_RSP" 2>/dev/null
    echo "✅ RSP mounted (if available)" >> ~/.m2ultra-boot.log
fi

# ============================================================================
# LOG SYSTEM INFO
# ============================================================================

echo "Computer: $(scutil --get ComputerName)" >> ~/.m2ultra-boot.log
echo "IP: $(ipconfig getifaddr en0)" >> ~/.m2ultra-boot.log
echo "Uptime: $(uptime)" >> ~/.m2ultra-boot.log

# ============================================================================
# CLEANUP
# ============================================================================

# Keep log file manageable (last 100 lines)
tail -100 ~/.m2ultra-boot.log > ~/.m2ultra-boot.log.tmp && mv ~/.m2ultra-boot.log.tmp ~/.m2ultra-boot.log

echo "✨ Boot startup complete" >> ~/.m2ultra-boot.log
