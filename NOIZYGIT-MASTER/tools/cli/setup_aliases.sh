#!/bin/bash
# 🔗 NOIZYLAB PROJECT ALIAS SETUP
# Creates symlinks to external GitHub repos instead of committing them to git
# Keeps M2-Ultra repo CLEAN and FAST

set -euo pipefail

BASEDIR="/Users/m2ultra/.claude-worktrees/NOIZYLAB/xenodochial-almeida"
GITHUB_BASE="$HOME/GITHUB_REPOS"  # Where you clone GitHub repos
DRIVE_BASE="$HOME/GoogleDrive/NOIZYLAB-MEDIA"  # Where Google Drive media is mounted

echo "🔗 Setting up NOIZYLAB project aliases..."
echo ""

# Function to create alias
create_alias() {
    local category=$1
    local project=$2
    local source=$3
    
    if [ ! -d "$BASEDIR/PROJECTS/$category" ]; then
        mkdir -p "$BASEDIR/PROJECTS/$category"
        echo "  ✅ Created: ./PROJECTS/$category"
    fi
    
    # Remove old if exists
    [ -L "$BASEDIR/PROJECTS/$category/$project" ] && rm "$BASEDIR/PROJECTS/$category/$project"
    
    # Create symlink
    if [ -d "$source" ]; then
        ln -s "$source" "$BASEDIR/PROJECTS/$category/$project"
        echo "  ✅ Aliased: ./PROJECTS/$category/$project -> $source"
    else
        echo "  ⚠️  Source not found: $source"
    fi
}

echo "▶ AI/ML Systems:"
create_alias "AI_ML" "AEON-MEGA" "$GITHUB_BASE/AEON-MEGA"
create_alias "AI_ML" "repairrob" "$GITHUB_BASE/repairrob"

echo ""
echo "▶ Audio Systems:"
create_alias "AUDIO" "10CC-ROOM-v1" "$GITHUB_BASE/10CC-AUDIO"

echo ""
echo "▶ Networking:"
create_alias "NETWORK" "NOIZYLAB-TUNNEL" "$GITHUB_BASE/NOIZYLAB-TUNNEL"

echo ""
echo "▶ Data Pipeline:"
create_alias "DATA" "UNIVERSAL-INGESTION" "$GITHUB_BASE/UNIVERSAL-INGESTION"

echo ""
echo "▶ Core Platform:"
create_alias "CORE" "noizylab-ultimate" "$GITHUB_BASE/NOIZYLAB-ULTIMATE"

echo ""
echo "▶ Google Drive (Media):"
[ -d "$DRIVE_BASE" ] && ln -s "$DRIVE_BASE" "$BASEDIR/MEDIA/DRIVE" && echo "  ✅ Mounted: Google Drive NOIZYLAB-MEDIA" || echo "  ⚠️  Google Drive not found at: $DRIVE_BASE"

echo ""
echo "📊 ALIAS VERIFICATION:"
echo ""
find "$BASEDIR/PROJECTS" -maxdepth 2 -type l 2>/dev/null | while read link; do
    target=$(readlink "$link")
    echo "  🔗 $(basename $link) -> $target"
done

echo ""
echo "✅ Alias setup complete!"
echo ""
echo "Next steps:"
echo "  1. Clone GitHub repos: git clone https://github.com/Noizyfish/AEON-MEGA ~/GITHUB_REPOS/AEON-MEGA"
echo "  2. Run this script again to create aliases"
echo "  3. Verify: ls -la ./PROJECTS/ (should show symlinks with ->)"
