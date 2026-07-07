#!/usr/bin/env zsh
# turbo_git_sync.sh
# Global Code Synchronization to GitHub.com

echo "🌍 INITIATING GLOBAL CODE SYNC..."
TIMESTAMP=$(date "+%Y-%m-%d %H:%M:%S")

# 1. Define Targets
TARGETS=(
    "$HOME/NOIZYLAB"
    "$HOME/Documents/GABRIEL"
    "$HOME/Documents/PROJECTS"
)

# 2. Check for HP-OMEN (Gabriel Volume)
if [ -d "/Volumes/HP-OMEN" ]; then
    echo "✅ FOUND EXTERNAL VOLUME: HP-OMEN"
    TARGETS+=("/Volumes/HP-OMEN/NOIZYLAB")
    TARGETS+=("/Volumes/HP-OMEN/GABRIEL")
else
    echo "⚠️  MISSING EXTERNAL VOLUME: HP-OMEN"
    echo "   -> Skipping sync for HP-OMEN codebases."
fi

# 3. Sync Function
# 3. Sync Function
sync_repo() {
    local dir="$1"
    
    if [[ ! -d "$dir" ]]; then
        echo "❌ Directory not found: $dir"
        return
    fi

    echo "🔄 Checking: $dir"
    
    # Check if inside git repo
    if git -C "$dir" rev-parse --is-inside-work-tree >/dev/null 2>&1; then
        echo "   -> Is a Git Repo."
        
        # Check status
        if [[ -n "$(git -C "$dir" status --porcelain)" ]]; then
            echo "   -> Uncommitted changes found. Committing..."
            git -C "$dir" add .
            git -C "$dir" commit -m "Turbo Sync: $TIMESTAMP"
        else
            echo "   -> Clean working tree."
        fi
        
        # Push
        echo "   -> Pushing to remote..."
        if git -C "$dir" push; then
            echo "   ✅ PUSH SUCCESSFUL"
        else
            echo "   ⚠️  PUSH FAILED (Check auth/upstream)"
        fi
    else
        echo "   ⚠️  NOT A GIT REPO. Skipping."
    fi
}

# 4. Execute
for target in "${TARGETS[@]}"; do
    # If target is PROJECTS, iterate children
    if [[ "$target" == *"/PROJECTS" ]]; then
        for proj in "$target"/*; do
            if [ -d "$proj" ]; then
                sync_repo "$proj"
            fi
        done
    else
        sync_repo "$target"
    fi
done

echo "🌍 GLOBAL SYNC COMPLETE."
