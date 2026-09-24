#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# NOIZY EMPIRE — HEALTH ALERTS
# Runs at 9am, 3pm, 9pm via launchd (com.noizylab.healthcheck)
# Checks all critical services and speaks alerts via GABRIEL
# RSP_001 | 2026
# ═══════════════════════════════════════════════════════════════

GABRIEL="http://localhost:7777"
HEAVEN="https://heaven.rsp-5f3.workers.dev"
LOG_DIR="/tmp/noizylab-health"
LOG="$LOG_DIR/healthcheck.log"
HOUR=$(date +%H)

mkdir -p "$LOG_DIR"
echo "" >> "$LOG"
echo "═══ HEALTH CHECK $(date '+%Y-%m-%d %H:%M:%S') ═══" >> "$LOG"

pass=0
fail=0
alerts=()

check() {
    local name="$1"
    local url="$2"
    local expect="$3"
    result=$(curl -s --max-time 8 "$url" 2>/dev/null)
    if echo "$result" | grep -q "$expect" 2>/dev/null; then
        echo "  ✅ $name" >> "$LOG"
        ((pass++))
    else
        echo "  ❌ $name OFFLINE" >> "$LOG"
        alerts+=("$name")
        ((fail++))
    fi
}

# Core services
check "GABRIEL"      "$GABRIEL/health"                    "ok"
check "Heaven"       "$HEAVEN/health"                     "LIVE"
check "Voice Bridge" "http://localhost:8080/health"        "healthy"
check "NOIZYVOX"     "http://localhost:8421/api/v1/health" "ok"
check "Ollama"       "http://localhost:11434/api/tags"     "models"

# GABRIEL speak alert if failures
if [ ${#alerts[@]} -gt 0 ]; then
    alert_msg="NOIZY HEALTH ALERT: ${#alerts[@]} service down: $(IFS=', '; echo "${alerts[*]}")"
    echo "  🚨 ALERTING: $alert_msg" >> "$LOG"
    curl -s -X POST "$GABRIEL/speak" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"$alert_msg\"}" >> "$LOG" 2>&1 || \
    /usr/bin/say -v Daniel "$alert_msg"
else
    # Morning check (9am) — speak all-clear
    if [ "$HOUR" = "09" ]; then
        /usr/bin/say -v Daniel "Good morning Rob. All NOIZY systems green. $(date '+%A %B %d')." &
    fi
fi

echo "  RESULT: $pass pass, $fail fail" >> "$LOG"
exit 0
