#!/usr/bin/env bash
# =============================================================================
# NOIZY EMPIRE — Voice Army File Watcher
# Monitors Audio Hijack output → tags BWF metadata → pipes to GABRIEL
# Watch path: /Volumes/AQUARIUM/RSP_001/captures/  (adjust as needed)
# =============================================================================

WATCH_DIR="${1:-/Volumes/AQUARIUM/RSP_001/captures}"
GABRIEL_LOG="${2:-/Users/m2ultra/NOIZYANTHROPIC/GABRIEL/audit/provenance_log.jsonl}"
POLL_INTERVAL=3  # seconds

echo "[VOICE ARMY WATCHER] Monitoring: $WATCH_DIR"
echo "[VOICE ARMY WATCHER] Provenance log: $GABRIEL_LOG"

# Track seen files
SEEN_FILES=$(mktemp)

log_provenance() {
    local filepath="$1"
    local filename=$(basename "$filepath")
    local filesize=$(stat -f%z "$filepath" 2>/dev/null || echo 0)
    local checksum=$(md5 -q "$filepath" 2>/dev/null || echo "unknown")
    local ts=$(date -u +"%Y-%m-%dT%H:%M:%SZ")

    local entry=$(cat <<JSON
{"timestamp":"$ts","event":"capture_landed","file":"$filename","path":"$filepath","size_bytes":$filesize,"md5":"$checksum","project":"RSP_001","agent":"GABRIEL","status":"pending_review"}
JSON
)
    echo "$entry" >> "$GABRIEL_LOG"
    echo "[GABRIEL] Logged: $filename ($filesize bytes)"
}

notify_gabriel() {
    local filepath="$1"
    # Hook point: call GABRIEL API, post to n8n webhook, etc.
    # Example: curl -s -X POST http://localhost:8091/intake -d "{\"file\":\"$filepath\"}"
    echo "[GABRIEL] Notify: $filepath"
}

while true; do
    if [[ -d "$WATCH_DIR" ]]; then
        # Find .wav/.mp3/.flac/.aiff files newer than SEEN_FILES tracker
        find "$WATCH_DIR" \
            \( -name "*.wav" -o -name "*.mp3" -o -name "*.flac" -o -name "*.aiff" -o -name "*.m4a" \) \
            -newer "$SEEN_FILES" -print 2>/dev/null | while read -r newfile; do
            echo "[NEW CAPTURE] $newfile"
            log_provenance "$newfile"
            notify_gabriel "$newfile"
        done
        touch "$SEEN_FILES"
    else
        echo "[WATCHER] Waiting for $WATCH_DIR to mount..."
    fi
    sleep "$POLL_INTERVAL"
done
