#!/bin/bash
set -euo pipefail
# MC96ECO M2 Ultra Disk Space Reclamation & Ollama Alignment Script
# Run this script in your macOS Terminal or iTerm2.

echo "🌌 Starting MC96ECO Space Reclamation..."
echo ""

df -h /Users/m2ultra || true

# 1. Kill AnythingLLM and private Ollama instances if running
echo "Stopping AnythingLLM and private Ollama instances..."
killall "AnythingLLM" 2>/dev/null
killall "ollama" 2>/dev/null
sleep 2

# 2. Ensure destination exists
DEST="/Volumes/SOUND_DESIGN/ollama-models"
SRC="/Users/m2ultra/Library/Application Support/anythingllm-desktop/storage/models/ollama"

if [ ! -d "/Volumes/SOUND_DESIGN" ]; then
    echo "❌ SOUND_DESIGN is not mounted. Refusing to move models onto the system drive."
    exit 1
fi

echo "Ensuring external directory exists at: $DEST"
mkdir -p "$DEST"

# 3. Migrate models if they exist in source and not in destination
if [ -d "$SRC" ] && [ ! -L "$SRC" ]; then
    BEFORE_SIZE=$(du -sk "$SRC" | awk '{print $1}')
    echo "Moving private AnythingLLM models to external drive (this might take a few minutes for 58GB)..."
    rsync -a --info=progress2 "$SRC/" "$DEST/"
    AFTER_SIZE=$(du -sk "$DEST" | awk '{print $1}')
    if [ "$AFTER_SIZE" -lt "$BEFORE_SIZE" ]; then
        echo "❌ Destination is smaller than source after copy. Leaving source untouched."
        echo "Source KB: $BEFORE_SIZE"
        echo "Destination KB: $AFTER_SIZE"
        exit 1
    fi
    
    echo "Copy verified. Removing local model folder..."
    rm -rf "$SRC"
    
    echo "Creating symlink back to Application Support..."
    ln -sf "$DEST" "$SRC"
    echo "✅ Symlink created successfully!"
else
    echo "AnythingLLM models folder is already moved, symlinked, or absent."
    if [ -L "$SRC" ]; then
        echo "Existing symlink:"
        ls -l "$SRC"
    elif [ ! -e "$SRC" ]; then
        mkdir -p "$(dirname "$SRC")"
        ln -sf "$DEST" "$SRC"
        echo "✅ Symlink created!"
    fi
    echo "✅ Symlink created/verified!"
fi

# 4. Restart system-wide Ollama with external storage
echo "Configuring and starting system-wide Ollama..."
# Unload first
launchctl bootout gui/$(id -u) ~/Library/LaunchAgents/homebrew.mxcl.ollama.plist 2>/dev/null
launchctl unload ~/Library/LaunchAgents/homebrew.mxcl.ollama.plist 2>/dev/null

# Load again to start
launchctl bootstrap gui/$(id -u) ~/Library/LaunchAgents/homebrew.mxcl.ollama.plist
launchctl load ~/Library/LaunchAgents/homebrew.mxcl.ollama.plist 2>/dev/null

echo ""
echo "Checking Ollama status..."
sleep 3
if curl -s http://localhost:11434/api/tags &>/dev/null; then
    echo "✅ System-wide Ollama is running on http://localhost:11434"
    echo "Models list:"
    /opt/homebrew/bin/ollama list
else
    echo "❌ System-wide Ollama failed to respond on port 11434. Checking logs:"
    tail -n 10 /opt/homebrew/var/log/ollama.log
fi

echo ""
echo "Current disk space status:"
df -h /Users/m2ultra
echo ""
echo "✅ Space reclamation completed!"
