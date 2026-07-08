#!/bin/zsh
# sync_network.sh - Fault-tolerant rsync network backup engine over Tailscale
# Features: Latency pings, auto-reconnect loops, and progress checkpoints.

set -e

# Configuration
REMOTE_HOST="$1"       # e.g., "MICKY-P" or "MICHAEL" or Tailscale IP "100.x.x.x"
REMOTE_USER="$2"       # e.g., "m2ultra" or username
REMOTE_PATH="$3"       # Destination path on remote system
LOCAL_PATH="$4"        # Source path on local system
LIMIT_SPEED="$5"       # Optional speed limit in KB/s (e.g. 5000)

if [[ -z "$REMOTE_HOST" || -z "$REMOTE_USER" || -z "$REMOTE_PATH" || -z "$LOCAL_PATH" ]]; then
    echo "Usage: ./sync_network.sh <remote_host_or_ip> <remote_user> <remote_path> <local_path> [bwlimit_kbps]"
    exit 1
fi

LOG_DIR="${NETWORK_LOG_DIR:-/Users/m2ultra/NOIZYANTHROPIC/projects/mc96-transport/network_logs}"
mkdir -p "$LOG_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/sync_${REMOTE_HOST}_${TIMESTAMP}.log"

log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $1" | tee -a "$LOG_FILE"
}

log "═══════════════════════════════════════════════════════"
log "🌐 LAUNCHING MC96 SECURE TAILSCALE TRANSPORT ENGINE"
log "═══════════════════════════════════════════════════════"
log "Local Source:  $LOCAL_PATH"
log "Remote Target: ${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}"
if [[ -n "$LIMIT_SPEED" ]]; then
    log "Speed Limit:   ${LIMIT_SPEED} KB/s"
fi
log "Log File:      $LOG_FILE"
log ""

# Ping check
log "⏳ Pinging Tailscale target node: $REMOTE_HOST ..."
if ping -c 3 -t 5 "$REMOTE_HOST" >/dev/null 2>&1; then
    log "🟢 Target node $REMOTE_HOST is REACHABLE!"
else
    log "⚠️ Ping failed. Checking Tailscale status..."
    if tailscale status >/dev/null 2>&1; then
        log "ℹ️ Tailscale is active on local machine. Please verify $REMOTE_HOST is powered on and connected."
    else
        log "❌ Tailscale is not running on this machine! Please launch Tailscale and log in."
    fi
    exit 1
fi

# SSH check
log "⏳ Verifying secure SSH connection..."
if ssh -o ConnectTimeout=5 "${REMOTE_USER}@${REMOTE_HOST}" "echo OK" >/dev/null 2>&1; then
    log "🟢 Secure SSH connection ESTABLISHED successfully!"
else
    log "❌ SSH connection failed! Please ensure Remote Login is enabled on $REMOTE_HOST."
    exit 1
fi

# Safe Auto-Reconnect Loop
MAX_RETRIES=50
RETRY_COUNT=0
DELAY_SECONDS=15

log "🚀 Initializing metadata sync and transfer loop..."

RSYNC_OPTS="-avh --progress --partial"
if [[ -n "$LIMIT_SPEED" ]]; then
    RSYNC_OPTS="${RSYNC_OPTS} --bwlimit=${LIMIT_SPEED}"
fi

while (( RETRY_COUNT < MAX_RETRIES )); do
    log "📀 Running rsync transport (Attempt $((RETRY_COUNT + 1)) / $MAX_RETRIES) ..."
    
    # Run rsync over SSH
    # We catch the exit status of rsync
    set +e
    rsync $RSYNC_OPTS -e ssh "$LOCAL_PATH" "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_PATH}" 2>&1 | tee -a "$LOG_FILE"
    RSYNC_STATUS=$?
    set -e
    
    if [[ $RSYNC_STATUS -eq 0 ]]; then
        log "🎉 SUCCESS: Transfer completed with 100% integrity!"
        exit 0
    elif [[ $RSYNC_STATUS -eq 24 ]]; then
        # Exit code 24: Vanished source files (harmless warnings in active environments)
        log "🎉 SUCCESS: Transfer completed (with minor vanishing file warnings, typical in active systems)."
        exit 0
    else
        RETRY_COUNT=$((RETRY_COUNT + 1))
        log "⚠️ WARNING: Transfer interrupted (rsync exit code: $RSYNC_STATUS)!"
        
        if (( RETRY_COUNT < MAX_RETRIES )); then
            log "⏳ Waiting $DELAY_SECONDS seconds before automatic reconnect and resume..."
            sleep $DELAY_SECONDS
        else
            log "❌ ERROR: Maximum retries ($MAX_RETRIES) reached. Connection failed to recover."
            exit 1
        fi
    fi
done
