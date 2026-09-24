#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# LAUNCH_NOIZYLAB_COMPLETE.sh — Full NOIZYLAB Stack Boot
# Starts all services not managed by launchd or pm2
# RSP_001 | NOIZY Empire | 2026
# ═══════════════════════════════════════════════════════════════

NOIZYLAB="$HOME/NOIZYLAB"
LOG="$NOIZYLAB/logs/noizylab_services.log"
PM2="$HOME/.npm-global/bin/pm2"

mkdir -p "$NOIZYLAB/logs"
TS=$(date '+%Y-%m-%d %H:%M:%S')

log() { echo "[$TS] $1" | tee -a "$LOG"; }

log "═══ NOIZYLAB COMPLETE BOOT ═══"
log "Machine: GOD.local | RSP_001"

# ── Verify GABRIEL daemon (port 9777) ─────────────────────────
GABRIEL_UP=$(curl -s --max-time 5 http://localhost:9777/healthz | grep -c "ok" 2>/dev/null || echo 0)
if [ "$GABRIEL_UP" -ge 1 ]; then
    log "✅ GABRIEL daemon: online (port 9777)"
else
    log "⏳ GABRIEL daemon: starting via launchd..."
    launchctl start com.noizy.gabriel 2>/dev/null
    sleep 5
fi

# ── Verify DreamChamber (port 7777) ───────────────────────────
DC_UP=$(curl -s --max-time 5 http://localhost:7777/health | grep -c "ok" 2>/dev/null || echo 0)
if [ "$DC_UP" -ge 1 ]; then
    log "✅ DreamChamber: online (port 7777)"
else
    log "⏳ DreamChamber: starting..."
    cd "$HOME/NOIZYANTHROPIC/apps/dreamchamber" && node src/server.js >> "$NOIZYLAB/logs/dreamchamber.log" 2>&1 &
    sleep 4
    DC_UP2=$(curl -s --max-time 3 http://localhost:7777/health | grep -c "ok" 2>/dev/null || echo 0)
    if [ "$DC_UP2" -ge 1 ]; then
        log "✅ DreamChamber: started"
    else
        log "⚠ DreamChamber: starting... check $NOIZYLAB/logs/dreamchamber.log"
    fi
fi

# ── pm2 Services ──────────────────────────────────────────────
if command -v "$PM2" &>/dev/null; then
    PM2_PROCS=$("$PM2" list 2>/dev/null | grep -c "online" || echo 0)
    if [ "$PM2_PROCS" -lt 2 ]; then
        log "⏳ pm2: starting ecosystem..."
        cd "$NOIZYLAB" && "$PM2" start ecosystem.config.cjs 2>&1 | grep -E "App|ERROR" >> "$LOG"
    else
        log "✅ pm2: $PM2_PROCS processes online"
    fi
else
    log "⚠ pm2 not found at $PM2"
fi

# ── Ollama ────────────────────────────────────────────────────
OLLAMA_UP=$(curl -s --max-time 5 http://localhost:11434/api/tags | grep -c "models" 2>/dev/null || echo 0)
if [ "$OLLAMA_UP" -ge 1 ]; then
    log "✅ Ollama: ready"
else
    log "⏳ Ollama: starting..."
    ollama serve > /dev/null 2>&1 &
    sleep 3
fi

# ── NOIZYVOX ──────────────────────────────────────────────────
NOIZYVOX_UP=$(curl -s --max-time 5 http://localhost:8421/api/v1/health | grep -c "ok" 2>/dev/null || echo 0)
if [ "$NOIZYVOX_UP" -ge 1 ]; then
    log "✅ NOIZYVOX: port 8421 healthy"
else
    log "⏳ NOIZYVOX: starting..."
    NOIZYVOX_DIR="$HOME/NOIZYANTHROPIC/NOIZYEMPIRE/codemaster/projects/noizyvox-platform"
    if [ -d "$NOIZYVOX_DIR/.venv" ]; then
        cd "$NOIZYVOX_DIR" && .venv/bin/python -m uvicorn app.main:app --port 8421 --host 0.0.0.0 >> "$LOG" 2>&1 &
    fi
fi

# ── Final Status ───────────────────────────────────────────────
sleep 2
log ""
log "═══ BOOT COMPLETE ═══"
for svc in "GABRIEL:http://localhost:7777/health:ok" "VoiceBridge:http://localhost:8080/health:healthy" "NOIZYVOX:http://localhost:8421/api/v1/health:ok" "Ollama:http://localhost:11434/api/tags:models"; do
    name=$(echo $svc | cut -d: -f1)
    url=$(echo $svc | cut -d: -f2-3)
    expect=$(echo $svc | cut -d: -f4)
    if curl -s --max-time 4 "$url" | grep -q "$expect" 2>/dev/null; then
        log "  ✅ $name"
    else
        log "  ❌ $name"
    fi
done

exit 0
