#!/usr/bin/env bash
# ================================================================
#  NOIZYNET DIAGNOSTIC TOOL — noizy-check.sh
#  MC96ECO UNIVERSE · Robert Stephen Plowman
#
#  Designed for Claude Code CLI (auto-accept mode):
#    claude "Run ./noizy-check.sh and fix any issues found."
#
#  What it checks:
#    1. Cloudflare WARP / ZeroTrust identity
#    2. cloudflared tunnel daemon + auth
#    3. Heaven Worker + all NOIZY domain endpoints
#    4. SSH ProxyCommand config for GOD node
#    5. Local services (Ollama, n8n, wrangler dev)
#    6. RTSP / AUNet stream latency + jitter
#    7. Wrangler auth + D1 binding health
#    8. Auto-fix 403 via cloudflared access login
#
#  Usage:
#    chmod +x noizy-check.sh
#    ./noizy-check.sh
#    ./noizy-check.sh --fix          # attempt auto-remediation
#    ./noizy-check.sh --rtsp-only    # audio network only
#    ./noizy-check.sh --json         # machine-readable output
# ================================================================

set -uo pipefail

# ── Flags ────────────────────────────────────────────────────────
FIX_MODE=false
RTSP_ONLY=false
JSON_MODE=false
for arg in "$@"; do
  case "$arg" in
    --fix)       FIX_MODE=true ;;
    --rtsp-only) RTSP_ONLY=true ;;
    --json)      JSON_MODE=true ;;
  esac
done

# ── Colors (suppressed in JSON mode) ────────────────────────────
if [[ "$JSON_MODE" == false ]]; then
  RED='\033[0;31m';   GREEN='\033[0;32m'; YELLOW='\033[1;33m'
  CYAN='\033[0;36m';  BOLD='\033[1m';     DIM='\033[2m';  NC='\033[0m'
  BLUE='\033[0;34m';  PURPLE='\033[0;35m'
else
  RED=''; GREEN=''; YELLOW=''; CYAN=''; BOLD=''; DIM=''; NC=''
  BLUE=''; PURPLE=''
fi

# ── Config ───────────────────────────────────────────────────────
HEAVEN_DOMAIN="noizy.ai"
WORKER_URL="https://workers.noizy.ai"
HEAVEN_ORIGIN_PORT="3000"
OLLAMA_PORT="11434"
N8N_PORT="5678"
WRANGLER_DEV_PORT="8787"
GOD_HOST="god.internal"                    # internal alias for M2 Ultra
USER_AGENT="Mozilla/5.0 (ClaudeCode/1.0; NOIZYNET-Diagnostic; MC96ECO)"
SSH_CONFIG="$HOME/.ssh/config"
CLOUDFLARED_CONFIG="$HOME/.cloudflared"
TIMEOUT=8                                  # curl timeout in seconds

# RTSP / AUNet targets — edit to match your audio bridge addresses
RTSP_HOSTS=(
  "localhost"
  "127.0.0.1"
  "$HEAVEN_DOMAIN"
)
RTSP_PORT=8554

# Domain health matrix — [label]="url|expected_code"
declare -A ENDPOINTS=(
  ["Heaven Worker"]="https://$HEAVEN_DOMAIN|200"
  ["Worker API"]="$WORKER_URL/health|200"
  ["NOIZYLAB"]="https://noizylab.com|200"
  ["NOIZYVOX"]="https://noizyvox.com|200"
  ["DreamChamber"]="https://dreamchamber.noizy.ai|200"
)

# ── State tracking ───────────────────────────────────────────────
PASS=0; WARN=0; FAIL=0
JSON_RESULTS=()

# ── Helpers ──────────────────────────────────────────────────────
step()  { [[ "$JSON_MODE" == false ]] && echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }
ok()    { echo -e "  ${GREEN}✅${NC} $1"; PASS=$((PASS+1));
          JSON_RESULTS+=("{\"check\":\"$1\",\"status\":\"pass\"}"); }
warn()  { echo -e "  ${YELLOW}⚠️${NC}  $1"; WARN=$((WARN+1));
          JSON_RESULTS+=("{\"check\":\"$1\",\"status\":\"warn\"}"); }
fail()  { echo -e "  ${RED}❌${NC} $1"; FAIL=$((FAIL+1));
          JSON_RESULTS+=("{\"check\":\"$1\",\"status\":\"fail\"}"); }
info()  { [[ "$JSON_MODE" == false ]] && echo -e "  ${DIM}   ↳ $1${NC}"; }
fix_hint() { [[ "$JSON_MODE" == false ]] && echo -e "  ${BLUE}🔧 FIX:${NC} $1"; }

# ── Banner ───────────────────────────────────────────────────────
if [[ "$JSON_MODE" == false ]]; then
  echo ""
  echo -e "${BOLD}${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${BOLD}  🔍 NOIZYNET DIAGNOSTIC TOOL — v2.0${NC}"
  echo -e "${BOLD}  MC96ECO UNIVERSE · GOD NODE · M2 Ultra${NC}"
  echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "  ${DIM}Domain:  $HEAVEN_DOMAIN${NC}"
  echo -e "  ${DIM}Time:    $(date '+%Y-%m-%d %H:%M:%S %Z')${NC}"
  echo -e "  ${DIM}Fix mode: $FIX_MODE${NC}"
  echo ""
fi

# ════════════════════════════════════════════════════════════════
# SKIP EVERYTHING BUT RTSP IF --rtsp-only
# ════════════════════════════════════════════════════════════════
if [[ "$RTSP_ONLY" == true ]]; then
  step "RTSP / AUNET ONLY MODE"
  for host in "${RTSP_HOSTS[@]}"; do
    result=$(nc -z -w3 "$host" "$RTSP_PORT" 2>&1 && echo "open" || echo "closed")
    ping_out=$(ping -c 5 -q "$host" 2>/dev/null | tail -1)
    jitter=$(echo "$ping_out" | grep -oE '[0-9]+\.[0-9]+/[0-9]+\.[0-9]+/[0-9]+\.[0-9]+/([0-9]+\.[0-9]+)' | cut -d'/' -f4)
    avg_ms=$(echo "$ping_out" | grep -oE '[0-9]+\.[0-9]+/([0-9]+\.[0-9]+)/' | cut -d'/' -f1)

    if [[ "$result" == "open" ]]; then
      ok "RTSP:$RTSP_PORT open on $host (avg ${avg_ms}ms, jitter ${jitter}ms)"
      # Audio quality warning thresholds
      jitter_int=${jitter%%.*}
      [[ -n "$jitter_int" && "$jitter_int" -gt 20 ]] && \
        warn "⚡ Jitter ${jitter}ms > 20ms — AUNet may crackle or drop frames"
      [[ -n "$avg_ms" && "${avg_ms%%.*}" -gt 50 ]] && \
        warn "⚡ Latency ${avg_ms}ms > 50ms — RTSP buffering risk"
    else
      fail "RTSP:$RTSP_PORT CLOSED on $host — audio bridge unreachable"
    fi
  done
  exit 0
fi

# ════════════════════════════════════════════════════════════════
# CHECK 1 — CLOUDFLARE WARP / ZERO TRUST
# ════════════════════════════════════════════════════════════════
step "1/8 — CLOUDFLARE WARP / ZEROTRUST IDENTITY"

if command -v warp-cli &>/dev/null; then
  WARP_OUT=$(warp-cli status 2>&1)
  WARP_STATUS=$(echo "$WARP_OUT" | grep -i "Status info:" | awk '{print $NF}' 2>/dev/null || echo "unknown")

  case "$WARP_STATUS" in
    Connected)  ok "WARP Connected — ZeroTrust perimeter: ACTIVE" ;;
    Connecting) warn "WARP is Connecting — waiting 5s..." ; sleep 5 ;;
    *)
      fail "WARP is: $WARP_STATUS"
      info "Raw: $WARP_OUT"
      if [[ "$FIX_MODE" == true ]]; then
        fix_hint "Attempting: warp-cli connect"
        warp-cli connect 2>&1 | head -3
        sleep 4
        WARP_STATUS2=$(warp-cli status 2>&1 | grep -i "Status info:" | awk '{print $NF}')
        [[ "$WARP_STATUS2" == "Connected" ]] && ok "WARP connected after retry" || fail "WARP still offline"
      else
        fix_hint "Run: warp-cli connect  OR  ./noizy-check.sh --fix"
      fi
      ;;
  esac

  # Check registered teams domain
  WARP_TEAM=$(warp-cli settings 2>/dev/null | grep -i "organization" | awk -F: '{print $2}' | xargs)
  [[ -n "$WARP_TEAM" ]] && info "Enrolled org: $WARP_TEAM" || warn "Not enrolled in a ZeroTrust org (teamsdomain missing)"
else
  warn "warp-cli not found — Cloudflare WARP not installed"
  fix_hint "brew install cloudflare-warp  (or download from: https://1.1.1.1)"
fi

# ════════════════════════════════════════════════════════════════
# CHECK 2 — CLOUDFLARED TUNNEL DAEMON
# ════════════════════════════════════════════════════════════════
step "2/8 — CLOUDFLARED TUNNEL DAEMON + AUTH"

if command -v cloudflared &>/dev/null; then
  CF_VERSION=$(cloudflared --version 2>&1 | head -1)
  info "cloudflared: $CF_VERSION"

  # Check if daemon is running
  if pgrep -x cloudflared &>/dev/null; then
    ok "cloudflared daemon is RUNNING"
    CF_PID=$(pgrep -x cloudflared | head -1)
    info "PID: $CF_PID"
  else
    fail "cloudflared daemon NOT running — tunnel is down"
    if [[ "$FIX_MODE" == true ]]; then
      fix_hint "Attempting: cloudflared service start"
      if [[ -f "$CLOUDFLARED_CONFIG/config.yml" ]]; then
        cloudflared tunnel run --config "$CLOUDFLARED_CONFIG/config.yml" &
        sleep 3
        pgrep -x cloudflared &>/dev/null && ok "cloudflared started" || fail "cloudflared failed to start"
      else
        fix_hint "No config.yml found. Run: cloudflared tunnel create noizy-god"
      fi
    else
      fix_hint "Run: cloudflared service start  OR  ./noizy-check.sh --fix"
    fi
  fi

  # Check auth cert
  if [[ -f "$CLOUDFLARED_CONFIG/cert.pem" ]]; then
    CERT_EXPIRY=$(openssl x509 -enddate -noout -in "$CLOUDFLARED_CONFIG/cert.pem" 2>/dev/null | cut -d= -f2)
    ok "cloudflared cert.pem present (expires: ${CERT_EXPIRY:-unknown})"
  else
    fail "No cert.pem — not authenticated with Cloudflare"
    fix_hint "Run: cloudflared login  →  then select your zone"
  fi

  # Check tunnel config
  if [[ -f "$CLOUDFLARED_CONFIG/config.yml" ]]; then
    TUNNEL_ID=$(grep -m1 "^tunnel:" "$CLOUDFLARED_CONFIG/config.yml" 2>/dev/null | awk '{print $2}')
    ok "Tunnel config present (ID: ${TUNNEL_ID:-unset})"
  elif [[ -f "$HOME/MC96ECO/heaven/cloudflare/tunnel-config.yml" ]]; then
    ok "Tunnel config found at ~/MC96ECO/heaven/cloudflare/"
    info "Symlink tip: ln -s ~/MC96ECO/heaven/cloudflare/tunnel-config.yml ~/.cloudflared/config.yml"
  else
    fail "No tunnel-config.yml found"
    fix_hint "Check ~/MC96ECO/heaven/cloudflare/ or run fix-everything.sh first"
  fi

else
  fail "cloudflared not installed"
  fix_hint "brew install cloudflared"
fi

# ════════════════════════════════════════════════════════════════
# CHECK 3 — HEAVEN DOMAINS & WORKER ENDPOINTS
# ════════════════════════════════════════════════════════════════
step "3/8 — HEAVEN WORKER + NOIZY DOMAIN HEALTH"

for label in "${!ENDPOINTS[@]}"; do
  IFS='|' read -r url expected <<< "${ENDPOINTS[$label]}"
  HTTP_CODE=$(curl -sI -o /dev/null -w "%{http_code}" \
    --max-time "$TIMEOUT" \
    -A "$USER_AGENT" \
    "$url" 2>/dev/null || echo "000")

  case "$HTTP_CODE" in
    200|201|204)
      ok "$label → $HTTP_CODE OK  ($url)"
      ;;
    301|302|307|308)
      ok "$label → $HTTP_CODE REDIRECT (acceptable)  ($url)"
      ;;
    403)
      fail "$label → 403 FORBIDDEN — Identity Policy blocking access"
      info "Tunnel is UP but Cloudflare Access rejected your identity"
      if [[ "$FIX_MODE" == true ]]; then
        fix_hint "Running: cloudflared access login $url"
        cloudflared access login "$url" 2>&1 | head -5
        # Retry after login
        sleep 2
        RETRY=$(curl -sI -o /dev/null -w "%{http_code}" --max-time $TIMEOUT -A "$USER_AGENT" "$url" 2>/dev/null)
        [[ "$RETRY" == "200" ]] && ok "$label → 200 OK after login" || \
          warn "$label → still $RETRY after login attempt"
      else
        fix_hint "Run: cloudflared access login $url  OR  ./noizy-check.sh --fix"
      fi
      ;;
    401)
      fail "$label → 401 UNAUTHORIZED — JWT/token missing or expired"
      fix_hint "Check Worker auth middleware — ensure CLOUDFLARE_ACCESS_JWT_AUD is set in wrangler.jsonc secrets"
      ;;
    502|503|504)
      fail "$label → $HTTP_CODE — Tunnel is down or origin unreachable"
      info "Heaven Express origin (port $HEAVEN_ORIGIN_PORT) may be stopped"
      fix_hint "Check: lsof -i :$HEAVEN_ORIGIN_PORT  →  cd ~/MC96ECO/heaven/Docker && docker compose up -d"
      ;;
    000)
      fail "$label → TIMEOUT/DNS fail — no response from $url"
      fix_hint "Check DNS: dig $HEAVEN_DOMAIN  →  should point to Cloudflare nameservers"
      ;;
    *)
      warn "$label → Unexpected $HTTP_CODE  ($url)"
      ;;
  esac
done

# ════════════════════════════════════════════════════════════════
# CHECK 4 — SSH CONFIG FOR GOD NODE
# ════════════════════════════════════════════════════════════════
step "4/8 — SSH CONFIG — GOD NODE ACCESS"

if [[ -f "$SSH_CONFIG" ]]; then
  if grep -q "cloudflared access ssh" "$SSH_CONFIG" 2>/dev/null; then
    ok "SSH ProxyCommand: cloudflared access ssh configured"
    # Find which host it's configured for
    PROXY_HOST=$(awk '/ProxyCommand.*cloudflared/{found=1} found && /Host /{print $2; exit}' "$SSH_CONFIG" 2>/dev/null || \
                 grep -B5 "cloudflared access ssh" "$SSH_CONFIG" | grep "^Host" | head -1 | awk '{print $2}')
    info "Configured for host: ${PROXY_HOST:-see ~/.ssh/config}"
  else
    warn "SSH ProxyCommand for cloudflared NOT configured"
    info "Direct SSH to GOD may fail through ZeroTrust"
    fix_hint "Add to ~/.ssh/config:"
    cat <<'SSH_HINT'
      Host god.noizy.ai
        ProxyCommand cloudflared access ssh --hostname %h
        User m2ultra
        StrictHostKeyChecking no
SSH_HINT
  fi

  # Check for stale known_hosts (common cause of SSH failures after tunnel rotations)
  if grep -q "$HEAVEN_DOMAIN" "$HOME/.ssh/known_hosts" 2>/dev/null; then
    info "known_hosts has entry for $HEAVEN_DOMAIN (remove if SSH fingerprint errors occur)"
  fi
else
  warn "~/.ssh/config does not exist — creating minimal config"
  if [[ "$FIX_MODE" == true ]]; then
    mkdir -p ~/.ssh && chmod 700 ~/.ssh
    cat >> "$SSH_CONFIG" <<EOF

# NOIZYNET — GOD Node via Cloudflare Access
Host $HEAVEN_DOMAIN god.noizy.ai $GOD_HOST
  ProxyCommand cloudflared access ssh --hostname %h
  User m2ultra
  StrictHostKeyChecking no
EOF
    chmod 600 "$SSH_CONFIG"
    ok "~/.ssh/config created with cloudflared ProxyCommand"
  else
    fix_hint "Create ~/.ssh/config or run: ./noizy-check.sh --fix"
  fi
fi

# ════════════════════════════════════════════════════════════════
# CHECK 5 — LOCAL SERVICES (GOD NODE)
# ════════════════════════════════════════════════════════════════
step "5/8 — LOCAL SERVICES — OLLAMA · N8N · WRANGLER"

check_local_port() {
  local label="$1" port="$2" fix="$3"
  if lsof -i ":$port" &>/dev/null 2>&1; then
    PROC=$(lsof -i ":$port" -sTCP:LISTEN 2>/dev/null | awk 'NR==2{print $1}')
    ok "$label listening on :$port (${PROC:-process found})"
  else
    fail "$label NOT running on :$port"
    [[ -n "$fix" ]] && fix_hint "$fix"
  fi
}

check_local_port "Ollama (Gemma 4 27B)" "$OLLAMA_PORT" "ollama serve  (or: ollama run gemma3:27b)"
check_local_port "n8n Automation" "$N8N_PORT" "n8n start  OR  docker run -d n8nio/n8n"
check_local_port "Wrangler Dev" "$WRANGLER_DEV_PORT" "cd ~/MC96ECO/heaven/worker && npm run dev"

# Heaven Express Origin
check_local_port "Heaven Express Origin" "$HEAVEN_ORIGIN_PORT" \
  "cd ~/MC96ECO/heaven/Docker && docker compose up -d heaven"

# Ollama model check
if lsof -i ":$OLLAMA_PORT" &>/dev/null 2>&1; then
  MODELS=$(curl -s --max-time 4 "http://localhost:$OLLAMA_PORT/api/tags" 2>/dev/null | \
           grep -o '"name":"[^"]*"' | cut -d'"' -f4 | head -5 | tr '\n' ', ')
  if [[ -n "$MODELS" ]]; then
    info "Available models: ${MODELS%,}"
    echo "$MODELS" | grep -qi "gemma" && ok "Gemma model detected" || \
      warn "Gemma model NOT found — run: ollama pull gemma3:27b"
  fi
fi

# ════════════════════════════════════════════════════════════════
# CHECK 6 — RTSP / AUNET AUDIO NETWORK
# ════════════════════════════════════════════════════════════════
step "6/8 — RTSP / AUNET STREAM LATENCY"

JITTER_WARNING_MS=20
LATENCY_WARNING_MS=50
RTSP_ISSUES=0

for host in "${RTSP_HOSTS[@]}"; do
  # Port reachability
  if nc -z -w3 "$host" "$RTSP_PORT" 2>/dev/null; then
    RTSP_OPEN=true
  else
    RTSP_OPEN=false
  fi

  # Ping stats (5 probes, quiet mode)
  ping_raw=$(ping -c 5 -q "$host" 2>/dev/null)
  # Parse: min/avg/max/stddev
  ping_stats=$(echo "$ping_raw" | grep -oE '[0-9]+\.[0-9]+/[0-9]+\.[0-9]+/[0-9]+\.[0-9]+/[0-9]+\.[0-9]+' | head -1)

  if [[ -n "$ping_stats" ]]; then
    p_min=$(echo "$ping_stats" | cut -d/ -f1)
    p_avg=$(echo "$ping_stats" | cut -d/ -f2)
    p_max=$(echo "$ping_stats" | cut -d/ -f3)
    p_jitter=$(echo "$ping_stats" | cut -d/ -f4)

    p_avg_int=${p_avg%%.*}
    p_jitter_int=${p_jitter%%.*}

    if [[ "$RTSP_OPEN" == true ]]; then
      ok "RTSP:$RTSP_PORT OPEN on $host  (avg ${p_avg}ms | jitter ${p_jitter}ms)"
    else
      warn "RTSP:$RTSP_PORT CLOSED on $host  (host reachable: avg ${p_avg}ms)"
      RTSP_ISSUES=$((RTSP_ISSUES+1))
    fi

    # Audio quality thresholds
    if [[ "$p_jitter_int" -gt "$JITTER_WARNING_MS" ]]; then
      warn "⚡ JITTER ${p_jitter}ms > ${JITTER_WARNING_MS}ms — AUNet audio may crackle or drop frames"
      info "Mitigation: increase RTSP buffer size, check for background bandwidth consumers"
      RTSP_ISSUES=$((RTSP_ISSUES+1))
    fi
    if [[ "$p_avg_int" -gt "$LATENCY_WARNING_MS" ]]; then
      warn "⚡ LATENCY ${p_avg}ms > ${LATENCY_WARNING_MS}ms — RTSP buffering risk (check route)"
      RTSP_ISSUES=$((RTSP_ISSUES+1))
    fi
    info "Ping stats → min:${p_min}ms avg:${p_avg}ms max:${p_max}ms jitter:${p_jitter}ms"
  else
    fail "Host unreachable: $host (no ping response)"
    RTSP_ISSUES=$((RTSP_ISSUES+1))
  fi
done

[[ "$RTSP_ISSUES" -eq 0 ]] && ok "AUNet routing: NOMINAL — no latency or jitter issues"

# ════════════════════════════════════════════════════════════════
# CHECK 7 — WRANGLER AUTH + D1 BINDING
# ════════════════════════════════════════════════════════════════
step "7/8 — WRANGLER AUTH + CLOUDFLARE D1 BINDING"

if command -v wrangler &>/dev/null; then
  WR_VERSION=$(wrangler --version 2>&1 | head -1)
  info "wrangler: $WR_VERSION"

  # Check auth
  WR_AUTH=$(wrangler whoami 2>&1)
  if echo "$WR_AUTH" | grep -q "You are logged in"; then
    WR_USER=$(echo "$WR_AUTH" | grep -o 'with email.*' | head -1)
    ok "wrangler: authenticated ($WR_USER)"
  elif echo "$WR_AUTH" | grep -qi "not authenticated\|error\|login"; then
    fail "wrangler: NOT authenticated"
    if [[ "$FIX_MODE" == true ]]; then
      fix_hint "Launching: wrangler login"
      wrangler login
    else
      fix_hint "Run: wrangler login  →  then re-run this diagnostic"
    fi
  else
    warn "wrangler auth status unclear: $(echo "$WR_AUTH" | head -2)"
  fi

  # Check D1 databases are bound
  WRANGLER_CONFIG="$HOME/MC96ECO/heaven/worker/wrangler.jsonc"
  [[ ! -f "$WRANGLER_CONFIG" ]] && WRANGLER_CONFIG="$HOME/MC96ECO/heaven/worker/wrangler.toml"
  if [[ -f "$WRANGLER_CONFIG" ]]; then
    if grep -q "d1_databases\|database_name" "$WRANGLER_CONFIG" 2>/dev/null; then
      DB_NAME=$(grep -m1 "database_name\|name" "$WRANGLER_CONFIG" 2>/dev/null | \
                grep -v "^//" | head -1 | sed 's/.*=[ "]*//;s/[",].*//;s/ *//')
      ok "D1 binding declared in wrangler config (${DB_NAME:-found})"
    else
      warn "No D1 database binding found in wrangler config"
      fix_hint "Add [[d1_databases]] section to your wrangler.jsonc"
    fi
  else
    warn "wrangler.jsonc not found at ~/MC96ECO/heaven/worker/"
    fix_hint "Run fix-everything.sh to move Heaven from /tmp to permanent home"
  fi

  # Check KV bindings
  if [[ -f "$WRANGLER_CONFIG" ]] && grep -q "kv_namespaces\|\[\[kv" "$WRANGLER_CONFIG" 2>/dev/null; then
    KV_BINDING=$(grep -A2 "kv_namespaces\|\[\[kv" "$WRANGLER_CONFIG" 2>/dev/null | \
                 grep "binding\s*=" | head -1 | sed 's/.*=[ "]*//;s/[",].*//')
    ok "KV namespace binding declared (${KV_BINDING:-found})"
  else
    warn "No KV namespace binding found"
  fi
else
  fail "wrangler not installed"
  fix_hint "npm install -g wrangler@latest"
fi

# ════════════════════════════════════════════════════════════════
# CHECK 8 — FULL SYSTEM TOOLCHAIN
# ════════════════════════════════════════════════════════════════
step "8/8 — SYSTEM TOOLCHAIN AUDIT"

check_cmd() {
  local cmd="$1" label="${2:-$1}" install="${3:-}"
  if command -v "$cmd" &>/dev/null; then
    VER=$("$cmd" --version 2>&1 | head -1 | sed 's/^[^0-9]*//' | cut -c1-30)
    ok "$label  (v${VER:-?})"
  else
    fail "$label — NOT INSTALLED"
    [[ -n "$install" ]] && fix_hint "brew install $install  OR  $install"
  fi
}

check_cmd "cloudflared" "cloudflared" "cloudflared"
check_cmd "wrangler"    "Wrangler CLI" "npm install -g wrangler"
check_cmd "gh"           "GitHub CLI" "gh"
check_cmd "ollama"       "Ollama (local AI)" "ollama"
check_cmd "docker"       "Docker" "Docker Desktop"
check_cmd "node"         "Node.js" "node"
check_cmd "git"          "Git" "git"

# Check if Heaven's node_modules are installed
if [[ -d "$HOME/MC96ECO/heaven/worker" ]] && \
   [[ ! -d "$HOME/MC96ECO/heaven/worker/node_modules" ]]; then
  warn "Heaven Worker: node_modules missing"
  fix_hint "cd ~/MC96ECO/heaven/worker && npm install"
fi

# ════════════════════════════════════════════════════════════════
# SUMMARY
# ════════════════════════════════════════════════════════════════

TOTAL=$((PASS + WARN + FAIL))

if [[ "$JSON_MODE" == true ]]; then
  # Output structured JSON for Claude Code / programmatic use
  printf '{\n  "timestamp": "%s",\n  "domain": "%s",\n  "summary": {"pass": %d, "warn": %d, "fail": %d, "total": %d},\n  "results": [\n' \
    "$(date -u '+%Y-%m-%dT%H:%M:%SZ')" "$HEAVEN_DOMAIN" "$PASS" "$WARN" "$FAIL" "$TOTAL"
  for i in "${!JSON_RESULTS[@]}"; do
    [[ $i -lt $((${#JSON_RESULTS[@]}-1)) ]] && \
      printf '    %s,\n' "${JSON_RESULTS[$i]}" || \
      printf '    %s\n'  "${JSON_RESULTS[$i]}"
  done
  printf '  ]\n}\n'
  exit 0
fi

echo ""
echo -e "${BOLD}${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BOLD}  NOIZYNET DIAGNOSTIC SUMMARY${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${GREEN}✅  PASS   $PASS${NC}"
echo -e "  ${YELLOW}⚠️   WARN   $WARN${NC}"
echo -e "  ${RED}❌  FAIL   $FAIL${NC}"
echo -e "  ${DIM}──────────────${NC}"
echo -e "  ${BOLD}    TOTAL  $TOTAL${NC} checks"
echo ""

if (( FAIL == 0 && WARN == 0 )); then
  echo -e "  ${GREEN}${BOLD}🌟 ALL SYSTEMS NOMINAL — GORUNFREE ✦${NC}"
elif (( FAIL == 0 )); then
  echo -e "  ${YELLOW}${BOLD}⚡ MINOR WARNINGS — review above${NC}"
  echo -e "  ${DIM}   Run: ./noizy-check.sh --fix  to auto-remediate${NC}"
else
  echo -e "  ${RED}${BOLD}🔥 CRITICAL ISSUES DETECTED${NC}"
  echo ""
  echo -e "  ${BOLD}Quick Fix Commands:${NC}"
  echo -e "  ${CYAN}  ./noizy-check.sh --fix${NC}      — auto-remediate all issues"
  echo -e "  ${CYAN}  cloudflared access login https://$HEAVEN_DOMAIN${NC}  — fix 403"
  echo -e "  ${CYAN}  wrangler login${NC}               — fix Cloudflare Worker auth"
  echo -e "  ${CYAN}  cloudflared service start${NC}   — restart tunnel daemon"
  echo -e "  ${CYAN}  cd ~/MC96ECO/heaven/worker && npm run deploy${NC}"
fi

echo ""
echo -e "  ${DIM}For Claude Code: 'Run ./noizy-check.sh --fix and resolve all failures'${NC}"
echo -e "  ${DIM}JSON output:      ./noizy-check.sh --json | jq .summary${NC}"
echo -e "  ${DIM}RTSP only:        ./noizy-check.sh --rtsp-only${NC}"
echo -e "${PURPLE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
