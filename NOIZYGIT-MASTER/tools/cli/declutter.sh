#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# GOD.local — Declutter Script
# Kill resource-heavy processes that aren't needed for active work.
# Run when CPU load is high or system feels sluggish.
#
# Usage:
#   bash scripts/declutter.sh          # Show what would be killed (dry run)
#   bash scripts/declutter.sh --exec   # Actually kill processes
#
# Author: GABRIEL | RSP_001 | GORUNFREE
# ═══════════════════════════════════════════════════════════════════════

DRY_RUN=true
[ "${1:-}" = "--exec" ] && DRY_RUN=false

GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo ""
echo -e "${CYAN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${CYAN}║  GOD.local — System Declutter                   ║${NC}"
echo -e "${CYAN}║  M2 Ultra · 192 GB · 24 cores                   ║${NC}"
echo -e "${CYAN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

# Current load
LOAD=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}')
TASKS=$(sysctl -n kern.num_tasks 2>/dev/null || echo "?")
echo -e "Current load: ${RED}${LOAD}${NC}  Tasks: ${RED}${TASKS}${NC}"
echo ""

# Process census
echo -e "${CYAN}── Process Census ──────────────────────────────────${NC}"
count_procs() {
  pgrep -l -f "$1" 2>/dev/null | wc -l | tr -d ' '
}

IDE_COUNT=0
for pattern in "Visual Studio" "Cursor" "Windsurf" "Antigravity" "Xcode" "git" "node" "Microsoft" "Firefox" "Safari" "Chrome" "mdworker" "ollama" "lsof"; do
  count=$(count_procs "$pattern")
  if [ "$count" -gt 0 ]; then
    color=$GREEN
    [ "$count" -gt 20 ] && color=$YELLOW
    [ "$count" -gt 50 ] && color=$RED
    printf "  %-20s ${color}%s${NC} processes\n" "$pattern" "$count"
  fi
  # Track IDE count
  case "$pattern" in
    "Visual Studio"|"Cursor"|"Windsurf") [ "$count" -gt 0 ] && IDE_COUNT=$((IDE_COUNT + 1)) ;;
  esac
done
echo ""

# Recommendations
echo -e "${CYAN}── Recommendations ─────────────────────────────────${NC}"

if [ $IDE_COUNT -gt 1 ]; then
  echo -e "  ${YELLOW}⚠${NC}  ${IDE_COUNT} IDEs running simultaneously — consider closing unused ones"
  echo -e "     Close Cursor:    ${YELLOW}osascript -e 'tell app \"Cursor\" to quit'${NC}"
  echo -e "     Close Windsurf:  ${YELLOW}osascript -e 'tell app \"Windsurf\" to quit'${NC}"
  echo -e "     Close VS Code:   ${YELLOW}osascript -e 'tell app \"Visual Studio Code\" to quit'${NC}"
fi

LSOF_COUNT=$(count_procs "lsof")
if [ "$LSOF_COUNT" -gt 5 ]; then
  echo -e "  ${RED}✗${NC}  ${LSOF_COUNT} stale lsof processes — these should be killed"
  if ! $DRY_RUN; then
    killall lsof 2>/dev/null && echo -e "  ${GREEN}✓${NC}  Killed stale lsof"
  fi
fi

XCODE_COUNT=$(count_procs "Xcode")
if [ "$XCODE_COUNT" -gt 10 ]; then
  echo -e "  ${YELLOW}⚠${NC}  ${XCODE_COUNT} Xcode processes — background builds consuming CPU"
  echo -e "     Close Xcode: ${YELLOW}osascript -e 'tell app \"Xcode\" to quit'${NC}"
fi

GIT_COUNT=$(count_procs "git")
if [ "$GIT_COUNT" -gt 20 ]; then
  echo -e "  ${YELLOW}⚠${NC}  ${GIT_COUNT} git processes — IDE git status polling is heavy"
  echo -e "     Tip: disable auto-fetch in IDE settings to reduce git load"
fi

NODE_COUNT=$(count_procs "node")
if [ "$NODE_COUNT" -gt 10 ]; then
  echo -e "  ${YELLOW}⚠${NC}  ${NODE_COUNT} node processes — check for zombie dev servers"
fi

# Quick wins
echo ""
echo -e "${CYAN}── Quick Wins ──────────────────────────────────────${NC}"
echo -e "  1. Close unused IDEs (saves ~200+ processes per IDE)"
echo -e "  2. Quit Xcode if not actively building (saves ~50 processes)"
echo -e "  3. Reduce browser tabs (each tab = 1 process)"
echo -e "  4. Disable IDE git auto-fetch (saves constant polling)"
echo ""

# Load assessment
LOAD_INT=$(echo "$LOAD" | awk '{printf "%d", $1}')
if [ "$LOAD_INT" -gt 100 ]; then
  echo -e "  ${RED}CRITICAL:${NC} Load ${LOAD} is ${LOAD_INT}x over 24-core capacity"
  echo -e "  Target: load < 24 (1x per core)"
elif [ "$LOAD_INT" -gt 24 ]; then
  echo -e "  ${YELLOW}HIGH:${NC} Load ${LOAD} is above optimal for 24 cores"
else
  echo -e "  ${GREEN}OPTIMAL:${NC} Load ${LOAD} is within 24-core capacity"
fi

echo ""
if $DRY_RUN; then
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
  echo -e "  This was a ${YELLOW}DRY RUN${NC}. To execute fixes:"
  echo -e "  ${CYAN}bash scripts/declutter.sh --exec${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════${NC}"
fi
echo ""
