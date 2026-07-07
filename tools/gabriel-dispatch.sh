#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# GABRIEL DISPATCH — Worktree + tmux Parallel Agent Teams
# ═══════════════════════════════════════════════════════════════
# Dispatches specialist subagents into isolated git worktrees,
# each running in a named tmux pane for real-time monitoring.
#
# Usage:
#   bash scripts/gabriel-dispatch.sh <mission-name> <agent1> [agent2] [agent3] ...
#
# Example:
#   bash scripts/gabriel-dispatch.sh deploy-heaven engr-keith consent-auditor test-runner
#   bash scripts/gabriel-dispatch.sh full-audit consent-auditor engr-keith shirley
#
# Each agent gets:
#   1. Its own git worktree (isolated copy of the repo)
#   2. Its own tmux pane (visible, monitorable)
#   3. Its agent definition from .claude/agents/<name>.md
#   4. Access to all MCP servers
#
# After all agents complete, Gabriel merges results.
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

PROJECT_ROOT="${NOIZY_PROJECT_ROOT:-$(cd "$(dirname "$0")/.." && pwd)}"
WORKTREE_BASE="$PROJECT_ROOT/.worktrees"
AGENTS_DIR="$PROJECT_ROOT/.claude/agents"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# ── Validate inputs ──────────────────────────────────────────
MISSION="${1:-}"
shift || true
AGENTS=("$@")

if [ -z "$MISSION" ] || [ ${#AGENTS[@]} -eq 0 ]; then
    echo "═══════════════════════════════════════════════════"
    echo "  GABRIEL DISPATCH — Parallel Agent Teams"
    echo "═══════════════════════════════════════════════════"
    echo ""
    echo "Usage: gabriel-dispatch.sh <mission> <agent1> [agent2] ..."
    echo ""
    echo "Available agents:"
    for f in "$AGENTS_DIR"/*.md; do
        name=$(basename "$f" .md)
        echo "  - $name"
    done
    echo ""
    echo "Example:"
    echo "  gabriel-dispatch.sh deploy-v2 engr-keith consent-auditor test-runner"
    exit 1
fi

SESSION_NAME="gabriel-${MISSION}-${TIMESTAMP}"

echo "═══════════════════════════════════════════════════════"
echo "  GABRIEL DISPATCH — Mission: $MISSION"
echo "  Agents: ${AGENTS[*]}"
echo "  Session: $SESSION_NAME"
echo "  Time: $(date -u +%Y-%m-%dT%H:%M:%SZ)"
echo "═══════════════════════════════════════════════════════"

# ── Ensure worktree base exists ──────────────────────────────
mkdir -p "$WORKTREE_BASE"

# ── Create tmux session ──────────────────────────────────────
tmux new-session -d -s "$SESSION_NAME" -n "gabriel"

# Gabriel lead pane — monitors all agents
tmux send-keys -t "$SESSION_NAME:gabriel" "echo '🔱 GABRIEL LEAD — Mission: $MISSION'" Enter
tmux send-keys -t "$SESSION_NAME:gabriel" "echo 'Dispatching ${#AGENTS[@]} agents...'" Enter

# ── Dispatch each agent into its own worktree + tmux pane ────
for AGENT in "${AGENTS[@]}"; do
    AGENT_DEF="$AGENTS_DIR/${AGENT}.md"
    WORKTREE_PATH="$WORKTREE_BASE/${MISSION}-${AGENT}"
    BRANCH_NAME="agent/${MISSION}/${AGENT}"

    # Validate agent definition exists
    if [ ! -f "$AGENT_DEF" ]; then
        echo "⚠ Agent definition not found: $AGENT_DEF — skipping"
        continue
    fi

    echo "  → Dispatching $AGENT to worktree: $WORKTREE_PATH"

    # Create worktree (isolated copy of the repo)
    if [ -d "$WORKTREE_PATH" ]; then
        echo "    Cleaning existing worktree..."
        git -C "$PROJECT_ROOT" worktree remove "$WORKTREE_PATH" --force 2>/dev/null || true
    fi

    git -C "$PROJECT_ROOT" worktree add "$WORKTREE_PATH" -b "$BRANCH_NAME" 2>/dev/null || \
    git -C "$PROJECT_ROOT" worktree add "$WORKTREE_PATH" "$BRANCH_NAME" 2>/dev/null || \
    git -C "$PROJECT_ROOT" worktree add "$WORKTREE_PATH" HEAD

    # Create tmux window for this agent
    tmux new-window -t "$SESSION_NAME" -n "$AGENT"

    # Send agent startup commands
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "cd $WORKTREE_PATH" Enter
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "echo '═══════════════════════════════════════'" Enter
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "echo '  Agent: $AGENT'" Enter
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "echo '  Mission: $MISSION'" Enter
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "echo '  Worktree: $WORKTREE_PATH'" Enter
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "echo '  Branch: $BRANCH_NAME'" Enter
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "echo '═══════════════════════════════════════'" Enter

    # The agent is ready — Claude Code can be launched here with:
    # claude --agent-definition "$AGENT_DEF" --project-dir "$WORKTREE_PATH"
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "echo 'Ready for Claude Code agent launch.'" Enter
    tmux send-keys -t "$SESSION_NAME:${AGENT}" "echo 'Run: claude --agent .claude/agents/${AGENT}.md'" Enter
done

# ── Back to Gabriel lead pane ────────────────────────────────
tmux select-window -t "$SESSION_NAME:gabriel"
tmux send-keys -t "$SESSION_NAME:gabriel" "echo ''" Enter
tmux send-keys -t "$SESSION_NAME:gabriel" "echo '✓ All ${#AGENTS[@]} agents dispatched.'" Enter
tmux send-keys -t "$SESSION_NAME:gabriel" "echo 'Windows: $(tmux list-windows -t "$SESSION_NAME" -F "#{window_name}" | tr "\n" " ")'" Enter
tmux send-keys -t "$SESSION_NAME:gabriel" "echo ''" Enter
tmux send-keys -t "$SESSION_NAME:gabriel" "echo 'To monitor: tmux attach -t $SESSION_NAME'" Enter
tmux send-keys -t "$SESSION_NAME:gabriel" "echo 'To merge:   bash scripts/gabriel-merge.sh $MISSION'" Enter

echo ""
echo "═══════════════════════════════════════════════════════"
echo "  ✓ DISPATCH COMPLETE"
echo "  Session: $SESSION_NAME"
echo "  Agents:  ${#AGENTS[@]} dispatched"
echo ""
echo "  Monitor:  tmux attach -t $SESSION_NAME"
echo "  Kill all: tmux kill-session -t $SESSION_NAME"
echo "═══════════════════════════════════════════════════════"
