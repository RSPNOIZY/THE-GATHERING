#!/usr/bin/env bash
# ==============================================================================
# NOIZY EMPIRE — noizymobile Rideshare Append-Only Journal DB Interface
# Operates locally on Michael (MBP 2012) / iPad to log rideshare data in SQLite.
# ==============================================================================
set -euo pipefail

DB_PATH="$HOME/noizymobile_journal.db"

init_db() {
  sqlite3 "$DB_PATH" <<EOF
CREATE TABLE IF NOT EXISTS noizymobile_journal (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
  event_type TEXT NOT NULL CHECK(
    event_type IN (
      'SHIFT_START', 'TRIP_START', 'TRIP_END', 'MILEAGE', 
      'GPS_SUMMARY', 'FUEL', 'CHARGING', 'EXPENSE', 
      'VEHICLE_HEALTH', 'NETWORK_STATE', 'VOICE_COMMAND', 
      'LOST_ITEM_CHECK', 'DASHCAM_ARCHIVE', 'SHIFT_END', 
      'SYNC_COMPLETE'
    )
  ),
  payload TEXT NOT NULL,
  rule_zero_receipt TEXT,
  synced INTEGER DEFAULT 0
);
EOF
}

queue_log() {
  local event_type="$1"
  local payload="$2"
  local rule_zero_receipt="${3:-}"

  # Escape single quotes for SQL safety
  local escaped_payload=$(echo "$payload" | sed "s/'/''/g")
  local escaped_receipt=$(echo "$rule_zero_receipt" | sed "s/'/''/g")

  sqlite3 "$DB_PATH" "INSERT INTO noizymobile_journal (event_type, payload, rule_zero_receipt) VALUES ('$event_type', '$escaped_payload', '$escaped_receipt');"
  echo "✅ Event logged: $event_type"
}

list_queue() {
  echo "=== Current Local Queued Rideshare Records ==="
  sqlite3 "$DB_PATH" -header -column "SELECT * FROM noizymobile_journal WHERE synced = 0;"
}

clear_queue() {
  sqlite3 "$DB_PATH" "DELETE FROM noizymobile_journal WHERE synced = 1;"
  echo "🧹 Cleared synced records from local queue."
}

# Main routing
CMD="${1:-list}"
init_db

case "$CMD" in
  queue)
    if [ "$#" -lt 3 ]; then
      echo "Usage: $0 queue <event_type> <payload_json> [rule_zero_receipt]"
      exit 1
    fi
    queue_log "$2" "$3" "${4:-}"
    ;;
  list)
    list_queue
    ;;
  clear)
    clear_queue
    ;;
  *)
    echo "Usage: $0 {queue|list|clear}"
    exit 1
    ;;
esac
