#!/bin/bash
# ============================================================
# NOIZY EMPIRE — GitHub Migration Script
# Date: April 3, 2026
# Author: Claude (co-architect with Robert Stephen Plowman)
#
# ⚠️  DO NOT RUN THIS SCRIPT WITHOUT REVIEW
# ⚠️  Each phase requires manual confirmation
# ============================================================

set -euo pipefail

ORG="NOIZY-ai"  # Change this if using a different org
REPOS_DIR="$HOME/NOIZYLAB/repos"

echo "============================================"
echo "  NOIZY EMPIRE — GitHub Migration"
echo "  Target Org: $ORG"
echo "============================================"
echo ""

# -------------------------------------------------------
# PHASE 0: Pre-flight checks
# -------------------------------------------------------
echo "=== PHASE 0: Pre-flight checks ==="

# Check SSH
echo -n "  SSH auth: "
ssh -T git@github.com 2>&1 | head -1 || true

# Check gh CLI
echo -n "  gh CLI: "
if gh auth status 2>&1 | grep -q "Logged in"; then
    echo "✅ Authenticated"
else
    echo "❌ Not authenticated — run: gh auth login -h github.com --git-protocol ssh"
    echo ""
    echo "Cannot proceed without gh CLI authentication."
    echo "Run: gh auth login"
    exit 1
fi

echo ""
read -p "Pre-flight passed. Continue to Phase 1? (y/n): " confirm
[[ "$confirm" != "y" ]] && echo "Aborted." && exit 0

# -------------------------------------------------------
# PHASE 1: Commit uncommitted work
# -------------------------------------------------------
echo ""
echo "=== PHASE 1: Commit uncommitted work ==="

commit_if_dirty() {
    local dir="$1"
    local name="$2"
    cd "$dir"
    if [[ -n $(git status --porcelain 2>/dev/null) ]]; then
        echo "  $name: $(git status --porcelain | wc -l | tr -d ' ') modified files"
        read -p "    Commit all changes in $name? (y/n/s=skip): " choice
        case "$choice" in
            y) git add -A && git commit -m "pre-migration: commit pending work [$(date +%Y-%m-%d)]"
               echo "    ✅ Committed" ;;
            *) echo "    ⏭️  Skipped" ;;
        esac
    else
        echo "  $name: ✅ Clean"
    fi
}

commit_if_dirty "$HOME/NOIZYANTHROPIC" "NOIZYANTHROPIC"
commit_if_dirty "$HOME/NOIZYLAB" "NOIZYLAB"

echo ""
read -p "Phase 1 complete. Continue to Phase 2? (y/n): " confirm
[[ "$confirm" != "y" ]] && echo "Aborted." && exit 0

# -------------------------------------------------------
# PHASE 2: Create remote repos for local-only repos
# -------------------------------------------------------
echo ""
echo "=== PHASE 2: Create remote repos on $ORG ==="

LOCAL_REPOS=(
    "noizy-ai"
    "noizy-aquarium"
    "noizy-consent"
    "noizy-docs"
    "noizy-fish"
    "noizy-gabriel"
    "noizy-heaven"
    "noizy-infra"
    "noizy-kidz"
    "noizy-lab"
    "noizy-supersonic"
    "noizy-voice"
    "noizy-vox"
    "noizy-wisdom"
)

for repo in "${LOCAL_REPOS[@]}"; do
    echo -n "  Creating $ORG/$repo... "
    if gh repo view "$ORG/$repo" &>/dev/null; then
        echo "already exists ✅"
    else
        gh repo create "$ORG/$repo" --private \
            --description "NOIZY EMPIRE — $repo" \
            && echo "created ✅" \
            || echo "FAILED ❌"
    fi
done

echo ""
read -p "Phase 2 complete. Continue to Phase 3? (y/n): " confirm
[[ "$confirm" != "y" ]] && echo "Aborted." && exit 0

# -------------------------------------------------------
# PHASE 3: Set remotes and push
# -------------------------------------------------------
echo ""
echo "=== PHASE 3: Set remotes and push ==="

for repo in "${LOCAL_REPOS[@]}"; do
    echo "  Pushing $repo..."
    cd "$REPOS_DIR/$repo"

    # Add remote if not exists
    if ! git remote get-url origin &>/dev/null; then
        git remote add origin "git@github.com:$ORG/$repo.git"
    fi

    # Push all branches and tags
    git push -u origin main 2>&1 | sed 's/^/    /'
    git push origin --tags 2>&1 | sed 's/^/    /' || true
    echo "    ✅ Done"
done

echo ""
read -p "Phase 3 complete. Continue to Phase 4? (y/n): " confirm
[[ "$confirm" != "y" ]] && echo "Aborted." && exit 0

# -------------------------------------------------------
# PHASE 4: Push existing repos with remotes
# -------------------------------------------------------
echo ""
echo "=== PHASE 4: Push existing repos ==="

echo "  Pushing NOIZYANTHROPIC..."
cd "$HOME/NOIZYANTHROPIC"
git push origin main 2>&1 | sed 's/^/    /'
echo "    ✅ Done"

echo "  Pushing NOIZYLAB..."
cd "$HOME/NOIZYLAB"
git push NOIZY-ai main 2>&1 | sed 's/^/    /'
echo "    ✅ Done (NOIZY-ai remote)"
git push origin main 2>&1 | sed 's/^/    /' || echo "    ⚠️  origin push failed (NOIZYLAB-io)"
echo "    ✅ Done"

echo ""

# -------------------------------------------------------
# PHASE 5: Verification
# -------------------------------------------------------
echo "=== PHASE 5: Verification ==="

echo "  Checking all repos on $ORG..."
gh repo list "$ORG" --limit 50 2>&1 | sed 's/^/    /'

echo ""
echo "============================================"
echo "  Migration Complete"
echo "  Review the output above for any errors."
echo "============================================"
