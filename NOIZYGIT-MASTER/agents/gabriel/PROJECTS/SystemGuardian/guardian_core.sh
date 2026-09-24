#!/bin/zsh

LOG_DIR="$HOME/Library/SystemGuardian/logs"
MODULES="$HOME/Library/SystemGuardian/modules"
DATE=$(date "+%Y-%m-%d %H:%M:%S")

echo "[$DATE] Guardian: Starting Fusion Cycle" >> "$LOG_DIR/guardian.log"

run_safe() {
  "$MODULES/safe_scan.sh" >> "$LOG_DIR/safe.log" 2>&1
  "$MODULES/safe_optimize.sh" >> "$LOG_DIR/safe.log" 2>&1
}

run_balanced() {
  "$MODULES/balanced_scan.sh" >> "$LOG_DIR/balanced.log" 2>&1
  "$MODULES/balanced_fix.sh" >> "$LOG_DIR/balanced.log" 2>&1
}

run_aggressive() {
  "$MODULES/aggressive_clean.sh" >> "$LOG_DIR/aggressive.log" 2>&1
  "$MODULES/aggressive_repair.sh" >> "$LOG_DIR/aggressive.log" 2>&1
}

run_ultra() {
  "$MODULES/ultra_boost.sh" >> "$LOG_DIR/ultra.log" 2>&1
}

# Safety-first execution logic
run_safe
run_balanced

# Conditional escalation
if "$MODULES/detect_issues.sh"; then
  run_aggressive
fi

# Ultra mode only when stable
if "$MODULES/system_stable.sh"; then
  run_ultra
fi

echo "[$DATE] Guardian: Cycle Complete" >> "$LOG_DIR/guardian.log"

exit 0

