#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# GABRIEL MERGE — Collect and merge agent worktree results
# ═══════════════════════════════════════════════════════════════
# After agents complete their work in isolated worktrees,
# Gabriel merges their branches back to main.
#
# Usage:
#   bash scripts/gabriel-merge.sh <mission-name>
#
# This will:
#   1. List all agent branches for the mission
#   2. Show diffs for review
#   3. Merge each (with conflict detection)
#   4. Clean up worktrees
#   5. Run smoke tests on the merged result
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ROOT="${NOIZY_PROJECT_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
WORKTREE_BASE="$PROJECT_ROOT/.worktrees"
MISSION="${1:-}"

if [ -z "$MISSION" ]; then
    echo "Usage: gabriel-merge.sh <mission-name>"
    echo ""
    echo "Active missions (worktrees):"
    ls -1 "$WORKTREE_BASE" 2>/dev/null || echo "  (none)"
    exit 1
fi

echo "═══════════════════════════════════════════════════════"
echo "  GABRIEL MERGE — Mission: $MISSION"
echo "═══════════════════════════════════════════════════════"

cd "$PROJECT_ROOT"

# Find all agent branches for this mission
BRANCHES=$(git branch --list "agent/${MISSION}/*" | sed 's/^[* ]*//')

if [ -z "$BRANCHES" ]; then
    echo "No agent branches found for mission: $MISSION"
    exit 1
fi

echo "Agent branches found:"
echo "$BRANCHES" | while read -r branch; do
    agent=$(echo "$branch" | sed "s|agent/${MISSION}/||")
    commits=$(git log main.."$branch" --oneline 2>/dev/null | wc -l | tr -d ' ')
    echo "  → $agent ($commits commits)"
done
echo ""

# Show combined diff
echo "Combined changes:"
echo "$BRANCHES" | while read -r branch; do
    echo "--- $branch ---"
    git diff main.."$branch" --stat 2>/dev/null || echo "  (no changes)"
done
echo ""

# Merge each branch
FAILED=()
MERGED=()

echo "$BRANCHES" | while read -r branch; do
    agent=$(echo "$branch" | sed "s|agent/${MISSION}/||")
    echo "Merging $agent..."

    if git merge "$branch" --no-edit 2>/dev/null; then
        echo "  ✓ $agent merged successfully"
        MERGED+=("$agent")
    else
        echo "  ✗ $agent has conflicts — aborting merge"
        git merge --abort 2>/dev/null || true
        FAILED+=("$agent")
    fi
done

# Clean up worktrees
echo ""
echo "Cleaning up worktrees..."
for dir in "$WORKTREE_BASE"/${MISSION}-*; do
    if [ -d "$dir" ]; then
        worktree_name=$(basename "$dir")
        git worktree remove "$dir" --force 2>/dev/null && echo "  ✓ Removed $worktree_name" || echo "  ⚠ Could not remove $worktree_name"
    fi
done

# Clean up branches
echo ""
echo "Cleaning up branches..."
echo "$BRANCHES" | while read -r branch; do
    git branch -d "$branch" 2>/dev/null && echo "  ✓ Deleted $branch" || echo "  ⚠ Could not delete $branch"
done

# Run smoke tests on merged result
echo ""
echo "═══════════════════════════════════════════════════════"
echo "  Running smoke tests on merged result..."
echo "═══════════════════════════════════════════════════════"
if [ -f "$PROJECT_ROOT/smoke_test.sh" ]; then
    bash "$PROJECT_ROOT/smoke_test.sh" && echo "✓ Smoke tests PASSED" || echo "✗ Smoke tests FAILED"
else
    echo "⚠ smoke_test.sh not found — skipping"
fi

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  GABRIEL MERGE COMPLETE — Mission: $MISSION"
echo "═══════════════════════════════════════════════════════"
