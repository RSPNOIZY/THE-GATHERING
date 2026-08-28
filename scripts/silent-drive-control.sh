#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — noizymobile Silent Drive Subsystem Controller
# Manages cockpit audio/visual alert suppression during active driving shifts.
# ==============================================================================
set -euo pipefail

STATE_FILE="$HOME/.silent_drive_state"
JOURNAL_SCRIPT="$HOME/THE-GATHERING/scripts/noizymobile-sync-queue.sh"

init_state() {
  if [ ! -f "$STATE_FILE" ]; then
    echo "INACTIVE" > "$STATE_FILE"
  fi
}

get_mode() {
  init_state
  cat "$STATE_FILE"
}

set_mode() {
  local mode="$1"
  echo "$mode" > "$STATE_FILE"
  echo "🎯 DRIVE_MODE set to $mode"
  
  # Log to noizymobile journal
  if [ -f "$JOURNAL_SCRIPT" ]; then
    bash "$JOURNAL_SCRIPT" queue "NETWORK_STATE" "{\"drive_mode\":\"$mode\"}" || true
  fi
}

send_alert() {
  local class="$1"      # CRITICAL, ACTION_REQUIRED, SILENT
  local msg="$2"
  local payload="${3:-{}}"
  
  local current_mode=$(get_mode)
  
  # 1. Log all alerts to local journal
  if [ -f "$JOURNAL_SCRIPT" ]; then
    bash "$JOURNAL_SCRIPT" queue "VEHICLE_HEALTH" "{\"class\":\"$class\",\"message\":\"$msg\",\"data\":$payload}" || true
  fi

  # 2. Process alert propagation based on current drive mode
  if [ "$current_mode" = "ACTIVE" ]; then
    case "$class" in
      CRITICAL)
        echo "🚨 [CRITICAL ALERT] $msg"
        # Trigger local voice alert (Samantha)
        say -v Samantha "Warning: Critical Alert. $msg" || true
        ;;
      ACTION_REQUIRED)
        echo "🟡 [ACTION REQUIRED] (Queued for safe moment) $msg"
        # We can write to a cockpit queue file for Lucy to display when stopped
        echo "[$class] $(date +%H:%M:%S): $msg" >> "$HOME/.cockpit_action_queue"
        ;;
      SILENT)
        # Suppress completely — do nothing
        echo "🔇 [SILENT LOGGED] $msg"
        ;;
    esac
  else
    # Mute is disabled: show/voice all alerts
    echo "🔔 [ALERT] ($class) $msg"
    say -v Samantha "$msg" || true
  fi
}

# Main routing
CMD="${1:-status}"
init_state

case "$CMD" in
  active|start)
    set_mode "ACTIVE"
    echo "🔇 Silent Drive is now ACTIVE. Only Critical and Action Required events will interrupt."
    ;;
  inactive|stop)
    set_mode "INACTIVE"
    echo "🔊 Silent Drive is now INACTIVE. All system notifications restored."
    ;;
  alert)
    if [ "$#" -lt 3 ]; then
      echo "Usage: $0 alert <CRITICAL|ACTION_REQUIRED|SILENT> <message_text> [payload_json]"
      exit 1
    fi
    send_alert "$2" "$3" "${4:-{}}"
    ;;
  status)
    echo "Current Mode: $(get_mode)"
    ;;
  *)
    echo "Usage: $0 {active|inactive|alert|status}"
    exit 1
    ;;
esac
