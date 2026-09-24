#!/bin/bash
# ═══════════════════════════════════════════════════════
#  NOIZY EMPIRE — FULL STACK BOOT
#  Starts all local services. Run once per session.
#  RSP_001 Sovereign. GABRIEL Online. Constitutional.
# ═══════════════════════════════════════════════════════

set -e
GOLD="\033[33m"
GREEN="\033[92m"
RED="\033[91m"
BOLD="\033[1m"
RESET="\033[0m"

NOIZYLAB="$HOME/NOIZYLAB"
N8N="$HOME/.npm-global/lib/node_modules/n8n/bin/n8n"
AUDIO_VENV="$NOIZYLAB/venv/audio-stack/bin/activate"

echo -e "${BOLD}${GOLD}"
echo "  ███╗   ██╗ ██████╗ ██╗███████╗██╗   ██╗"
echo "  ████╗  ██║██╔═══██╗██║╚══███╔╝╚██╗ ██╔╝"
echo "  ██╔██╗ ██║██║   ██║██║  ███╔╝  ╚████╔╝ "
echo "  ██║╚██╗██║██║   ██║██║ ███╔╝    ╚██╔╝  "
echo "  ██║ ╚████║╚██████╔╝██║███████╗   ██║   "
echo "  ╚═╝  ╚═══╝ ╚═════╝ ╚═╝╚══════╝   ╚═╝  "
echo -e "  EMPIRE BOOT SEQUENCE${RESET}"
echo ""

# ── 1. HEAVEN STATUS ──────────────────────────────────
echo -n "  Checking HEAVEN...  "
HEALTH=$(curl -s --max-time 5 https://heaven.rsp-5f3.workers.dev/health 2>/dev/null)
if echo "$HEALTH" | grep -q '"LIVE"'; then
    VERSION=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('version','?'))" 2>/dev/null)
    ACTORS=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('actors','?'))" 2>/dev/null)
    LEDGER=$(echo "$HEALTH" | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('ledger_events','?'))" 2>/dev/null)
    echo -e "${GREEN}LIVE${RESET} v${VERSION} | ${ACTORS} actors | ${LEDGER} ledger events"
else
    echo -e "${RED}OFFLINE — check wrangler${RESET}"
fi

# ── 2. GABRIEL DB STATUS ────────────────────────────────
echo -n "  Checking gabriel_db... "
if command -v wrangler &>/dev/null; then
    ACTOR=$(wrangler d1 execute gabriel_db --remote \
        --command="SELECT actor_id, is_founding FROM hvs_actors LIMIT 1" 2>/dev/null \
        | python3 -c "import sys,re,json; m=re.search(r'\[.*\]',sys.stdin.read(),re.DOTALL); d=json.loads(m.group(0)); print(d[0]['results'][0]['actor_id'] if d else '?')" 2>/dev/null)
    echo -e "${GREEN}ONLINE${RESET} — RSP_001: ${ACTOR:-present}"
else
    echo -e "${RED}wrangler not found${RESET}"
fi

# ── 3. AUDIO STACK ──────────────────────────────────────
echo -n "  Audio stack (MPS)...   "
if [ -f "$AUDIO_VENV" ]; then
    MPS=$(source "$AUDIO_VENV" && python3 -c "import torch; print('LIVE' if torch.backends.mps.is_available() else 'CPU')" 2>/dev/null)
    echo -e "${GREEN}${MPS:-OK}${RESET} — venv ready"
else
    echo -e "${RED}venv missing — run: python3.11 -m venv $NOIZYLAB/venv/audio-stack${RESET}"
fi

# ── 4. START n8n ─────────────────────────────────────────
echo -n "  Starting n8n...        "
if curl -s --max-time 2 http://localhost:5678/healthz &>/dev/null; then
    echo -e "${GREEN}already running${RESET} → http://localhost:5678"
elif [ -f "$N8N" ]; then
    nohup node "$N8N" start > "$NOIZYLAB/logs/n8n.log" 2>&1 &
    sleep 4
    if curl -s --max-time 3 http://localhost:5678/healthz &>/dev/null; then
        echo -e "${GREEN}STARTED${RESET} → http://localhost:5678"
    else
        echo -e "${GOLD}starting...${RESET} check $NOIZYLAB/logs/n8n.log"
    fi
else
    echo -e "${RED}n8n not found${RESET}"
fi

# ── 5. VOICE SERVER (GORUNFREE) ─────────────────────────
echo -n "  Starting voice server... "
if curl -s --max-time 2 http://localhost:9099/status &>/dev/null; then
    echo -e "${GREEN}RUNNING${RESET} @ port 9099"
else
    nohup bash -c "source $AUDIO_VENV && python3 $NOIZYLAB/tools/voice_server.py" > "$NOIZYLAB/logs/voice_server.log" 2>&1 &
    sleep 2
    if curl -s --max-time 2 http://localhost:9099/status &>/dev/null; then
        echo -e "${GREEN}STARTED${RESET} @ port 9099"
    else
        echo -e "${GOLD}starting...${RESET} check logs"
    fi
fi

# ── 6. VOICE PROFILES ────────────────────────────────────
VP_COUNT=$(ls "$NOIZYLAB/voice-profiles/"*.json 2>/dev/null | wc -l | tr -d ' ')
echo -e "  Voice profiles:        ${GREEN}${VP_COUNT}${RESET} on disk"
if [ "$VP_COUNT" -eq 0 ]; then
    echo -e "  ${GOLD}→ Record RSP_001 voice: python3 $NOIZYLAB/tools/audio_pipeline.py --mode profile --input voice.wav --actor RSP_001${RESET}"
fi

# ── SUMMARY & DASHBOARD ──────────────────────────────────
echo ""
echo -e "${BOLD}  EMPIRE ENDPOINTS${RESET}"
echo "  Landing:    https://heaven.rsp-5f3.workers.dev"
echo "  Dashboard:  https://heaven.rsp-5f3.workers.dev/dashboard"
echo "  GABRIEL:    https://heaven.rsp-5f3.workers.dev/gabriel"
echo "  Stats:      https://heaven.rsp-5f3.workers.dev/api/v1/stats"
echo "  n8n:        http://localhost:5678"
echo "  Voice API:  http://localhost:9099"
echo ""
echo -e "${BOLD}  QUICK COMMANDS${RESET}"
echo "  Monitor:    source $NOIZYLAB/venv/activate-audio.sh && python3 $NOIZYLAB/tools/gabriel_monitor.py --watch"
echo "  Dashboard:  source $NOIZYLAB/venv/activate-audio.sh && python3 $NOIZYLAB/tools/empire_dashboard.py --watch"
echo "  Archivist:  python3 $NOIZYLAB/tools/archivist.py --report"
echo "  Deploy:     cd $NOIZYLAB && wrangler deploy"
echo ""
echo -e "${GOLD}${BOLD}  RSP_001 SOVEREIGN. GABRIEL ONLINE. EMPIRE ALIVE.${RESET}"
echo ""
echo -e "${GOLD}Showing EMPIRE DASHBOARD...${RESET}"
echo ""
source "$AUDIO_VENV" && python3 "$NOIZYLAB/tools/empire_dashboard.py"
