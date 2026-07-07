#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════
# NOIZY Empire — Status Dashboard
# Single-command health check for the entire NOIZYBEAST infrastructure
#
# Usage:
#   bash scripts/empire-status.sh           # Full dashboard
#   bash scripts/empire-status.sh --quick   # Just service health
#   bash scripts/empire-status.sh --json    # JSON output for automation
#
# Author: RSP_001 | GABRIEL | GORUNFREE | 2026-03-31
# ═══════════════════════════════════════════════════════════════════════
set -uo pipefail

G='\033[0;32m' R='\033[0;31m' Y='\033[0;33m' C='\033[0;36m' M='\033[0;35m'
B='\033[1m' NC='\033[0m' DIM='\033[2m'

QUICK=false JSON=false
[[ "${1:-}" == "--quick" ]] && QUICK=true
[[ "${1:-}" == "--json" ]] && JSON=true

UP=0 DOWN=0 WARN=0
RESULTS=()

check_service() {
  local name="$1" url="$2" expect="$3" detail=""
  local status_code body
  body=$(curl -s --max-time 3 "$url" 2>/dev/null) || body=""
  if echo "$body" | grep -q "$expect" 2>/dev/null; then
    detail=$(echo "$body" | python3 -c "import sys,json; d=json.load(sys.stdin); parts=[]; [parts.append(f'{k}={v}') for k,v in d.items() if k in ('version','status','model','uptime','sessions','airplay_active')]; print(' | '.join(parts[:4]))" 2>/dev/null || echo "ok")
    UP=$((UP+1))
    RESULTS+=("✅|$name|$detail")
    $JSON || printf "  ${G}✅${NC} %-20s %s\n" "$name" "$detail"
  else
    DOWN=$((DOWN+1))
    RESULTS+=("❌|$name|down")
    $JSON || printf "  ${R}❌${NC} %-20s ${R}DOWN${NC}\n" "$name"
  fi
}

check_tool() {
  local name="$1" cmd="$2"
  if eval "$cmd" >/dev/null 2>&1; then
    UP=$((UP+1))
    RESULTS+=("✅|$name|installed")
    $JSON || printf "  ${G}✅${NC} %-20s installed\n" "$name"
  else
    DOWN=$((DOWN+1))
    RESULTS+=("❌|$name|missing")
    $JSON || printf "  ${R}❌${NC} %-20s ${R}MISSING${NC}\n" "$name"
  fi
}

# ── Header ────────────────────────────────────────────────────────────
$JSON || {
  echo ""
  echo -e "${B}${M}╔══════════════════════════════════════════════════════════╗${NC}"
  echo -e "${B}${M}║  NOIZY EMPIRE — GOD.local (M2 Ultra 192GB)              ║${NC}"
  echo -e "${B}${M}║  $(date '+%Y-%m-%d %H:%M:%S %Z')                              ║${NC}"
  echo -e "${B}${M}╚══════════════════════════════════════════════════════════╝${NC}"
  echo ""
}

# ── Services ──────────────────────────────────────────────────────────
$JSON || echo -e "${B}${C}LOCAL SERVICES${NC}"
check_service "GABRIEL :7777"     "http://localhost:7777/health"     '"status"'
check_service "Voice Bridge :8080" "http://localhost:8080/health"    '"healthy"'
check_service "NOIZYVOX :8421"    "http://localhost:8421/api/v1/health" '"ok"'
check_service "NOIZYSTREAM :4040" "http://localhost:4040/health"     '"LIVE"'
check_service "AirPlay :3001"     "http://localhost:3001/health"     '"ok"'
check_service "Ollama :11434"     "http://localhost:11434/api/tags"  '"models"'
check_service "N8N :5678"         "http://localhost:5678/healthz"    '"ok"'

$JSON || { echo ""; echo -e "${B}${C}CLOUDFLARE EDGE${NC}"; }
check_service "Heaven (edge)"     "https://heaven.rsp-5f3.workers.dev/health" '"LIVE"'
check_service "Webhooks"          "https://heaven.rsp-5f3.workers.dev/webhooks/status" '"operational"'

# ── Wrangler Auth ─────────────────────────────────────────────────────
$JSON || { echo ""; echo -e "${B}${C}AUTH & TOOLS${NC}"; }
if npx wrangler whoami 2>/dev/null | grep -q "rsp@noizyfish.com"; then
  UP=$((UP+1)); RESULTS+=("✅|Wrangler|authenticated")
  $JSON || printf "  ${G}✅${NC} %-20s authenticated\n" "Wrangler"
else
  DOWN=$((DOWN+1)); RESULTS+=("❌|Wrangler|expired")
  $JSON || printf "  ${R}❌${NC} %-20s ${R}TOKEN EXPIRED${NC} — run: npx wrangler login\n" "Wrangler"
fi

# ── PM2 Processes ─────────────────────────────────────────────────────
$JSON || { echo ""; echo -e "${B}${C}PM2 PROCESSES${NC}"; }
PM2="${HOME}/.npm-global/bin/pm2"
[ -x "$PM2" ] || PM2="$(command -v pm2 2>/dev/null || echo "")"
if [ -n "$PM2" ] && [ -x "$PM2" ]; then
  PM2_LIST=$("$PM2" jlist 2>/dev/null || echo "[]")
  for proc in voice-bridge gemma3-mcp noizy-airplay dreamchamber; do
    status=$(echo "$PM2_LIST" | python3 -c "
import sys,json
try:
    procs=json.load(sys.stdin)
    match=[p for p in procs if p.get('name')=='$proc']
    print(match[0]['pm2_env']['status'] if match else 'missing')
except: print('error')
" 2>/dev/null)
    if [ "$status" = "online" ]; then
      UP=$((UP+1)); RESULTS+=("✅|pm2:$proc|online")
      $JSON || printf "  ${G}✅${NC} %-20s online\n" "$proc"
    elif [ "$status" = "stopped" ]; then
      WARN=$((WARN+1)); RESULTS+=("⚠️|pm2:$proc|stopped")
      $JSON || printf "  ${Y}⚠️${NC} %-20s ${Y}stopped${NC}\n" "$proc"
    else
      WARN=$((WARN+1)); RESULTS+=("⚠️|pm2:$proc|$status")
      $JSON || printf "  ${Y}⚠️${NC} %-20s ${Y}${status}${NC}\n" "$proc"
    fi
  done
else
  WARN=$((WARN+4)); RESULTS+=("⚠️|pm2|not found in PATH")
  $JSON || printf "  ${Y}⚠️${NC} %-20s ${Y}pm2 not in PATH${NC}\n" "pm2"
fi

# ── Tests ─────────────────────────────────────────────────────────────
if ! $QUICK; then
  $JSON || { echo ""; echo -e "${B}${C}TEST SUITES${NC}"; }
  for worker in consent-gateway cb01-router claude-proxy; do
    dir="$HOME/NOIZYLAB/workers/$worker"
    if [ -f "$dir/package.json" ]; then
      result=$(cd "$dir" && npx vitest run 2>&1 | grep "Tests" | head -1)
      if echo "$result" | grep -q "passed"; then
        count=$(echo "$result" | grep -o '[0-9]* passed' | head -1)
        UP=$((UP+1)); RESULTS+=("✅|$worker|$count")
        $JSON || printf "  ${G}✅${NC} %-20s %s\n" "$worker" "$count"
      else
        DOWN=$((DOWN+1)); RESULTS+=("❌|$worker|failing")
        $JSON || printf "  ${R}❌${NC} %-20s ${R}FAILING${NC}\n" "$worker"
      fi
    fi
  done
fi

# ── System Health ─────────────────────────────────────────────────────
if ! $QUICK; then
  $JSON || { echo ""; echo -e "${B}${C}SYSTEM HEALTH${NC}"; }

  # CPU
  LOAD=$(sysctl -n vm.loadavg 2>/dev/null | awk '{print $2}')
  CORES=$(sysctl -n hw.ncpu 2>/dev/null || echo 24)
  if (( $(echo "$LOAD < $CORES" | bc -l) )); then
    $JSON || printf "  ${G}✅${NC} %-20s load avg: %s (%s cores)\n" "CPU" "$LOAD" "$CORES"
  else
    $JSON || printf "  ${R}❌${NC} %-20s ${R}HIGH LOAD${NC}: %s (%s cores)\n" "CPU" "$LOAD" "$CORES"
  fi

  # RAM
  RAM_USED=$(vm_stat 2>/dev/null | python3 -c "
import sys,re
d={}
for l in sys.stdin:
    m=re.match(r'(.+):\s+(\d+)',l)
    if m: d[m.group(1).strip()]=int(m.group(2))*4096
a=d.get('Pages active',0)+d.get('Pages wired down',0)
t=a+d.get('Pages free',0)+d.get('Pages inactive',0)
print(f'{a/1e9:.0f}GB / {t/1e9:.0f}GB ({a/t*100:.0f}%)')
" 2>/dev/null || echo "?")
  $JSON || printf "  ${G}✅${NC} %-20s %s\n" "RAM" "$RAM_USED"

  # Disk
  DISK_FREE=$(df -h ~/NOIZYLAB 2>/dev/null | tail -1 | awk '{print $4 " free / " $2 " total"}')
  SMART=$(diskutil info disk3s1 2>/dev/null | grep SMART | awk '{print $NF}')
  $JSON || printf "  ${G}✅${NC} %-20s %s (SMART: %s)\n" "SSD" "$DISK_FREE" "${SMART:-N/A}"
fi

# ── Score ─────────────────────────────────────────────────────────────
TOTAL=$((UP + DOWN + WARN))
PCT=$(( TOTAL > 0 ? UP * 100 / TOTAL : 0 ))

$JSON || {
  echo ""
  echo -e "${B}${M}═════════════════════════════════════════════════════════${NC}"
  if [ $PCT -ge 90 ]; then
    echo -e "${B}${G}  EMPIRE SCORE: ${UP}/${TOTAL} = ${PCT}% — EXCELLENT${NC}"
  elif [ $PCT -ge 70 ]; then
    echo -e "${B}${Y}  EMPIRE SCORE: ${UP}/${TOTAL} = ${PCT}% — GOOD${NC}"
  else
    echo -e "${B}${R}  EMPIRE SCORE: ${UP}/${TOTAL} = ${PCT}% — NEEDS ATTENTION${NC}"
  fi
  if [ $DOWN -gt 0 ]; then
    echo -e "  ${R}${DOWN} services down${NC}"
  fi
  echo -e "${B}${M}═════════════════════════════════════════════════════════${NC}"
  echo ""
}

if $JSON; then
  echo "{"
  echo "  \"timestamp\": \"$(date -u +%Y-%m-%dT%H:%M:%SZ)\","
  echo "  \"machine\": \"GOD.local\","
  echo "  \"score\": $PCT,"
  echo "  \"up\": $UP, \"down\": $DOWN, \"warn\": $WARN,"
  echo "  \"results\": ["
  first=true
  for r in "${RESULTS[@]}"; do
    IFS='|' read -r icon name detail <<< "$r"
    $first || echo ","
    printf '    {"status":"%s","name":"%s","detail":"%s"}' "$icon" "$name" "$detail"
    first=false
  done
  echo ""
  echo "  ]"
  echo "}"
fi

exit $DOWN
