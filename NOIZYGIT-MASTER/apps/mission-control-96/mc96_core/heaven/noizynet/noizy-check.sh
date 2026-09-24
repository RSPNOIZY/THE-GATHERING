#!/usr/bin/env bash
# ============================================================
# NOIZYNET PRE-FLIGHT DIAGNOSTIC
# Heaven Infrastructure · MC96ECO Empire
#
# Usage:
#   chmod +x noizy-check.sh && ./noizy-check.sh
#   ./noizy-check.sh --full      # include RTSP stream checks
#   ./noizy-check.sh --fix       # attempt auto-remediation
#
# With Claude Code:
#   claude "Run ./noizynet/noizy-check.sh --full and fix any issues"
# ============================================================

set -uo pipefail

# ─── Config ───────────────────────────────────────────────────
DOMAIN="noizy.ai"
HEAVEN_WORKER_URL="https://heaven.noizy.ai"
HEAVEN_HEALTH_ENDPOINT="/health"
USER_AGENT="NOIZYNET-Diagnostic/1.0 (MC96ECO; Heaven-Worker)"
TUNNEL_PID_FILE="$HOME/.cloudflared/tunnel.pid"
SSH_CONFIG="$HOME/.ssh/config"
CLOUDFLARE_CRED_DIR="$HOME/.cloudflared"
FIX_MODE=false
FULL_MODE=false
ERRORS=0
WARNINGS=0

# RTSP / AUNet nodes — add your actual stream IPs/ports here
RTSP_NODES=(
  # "rtsp://localhost:8554/dreamchamber"   # uncomment when live
  # "rtsp://aunet.local:8554/studio"
)
AUNET_PEERS=(
  # "aunet-node-1.local"
  # "aunet-node-2.local"
)

# ─── Flags ────────────────────────────────────────────────────
for arg in "$@"; do
  case $arg in
    --fix)  FIX_MODE=true ;;
    --full) FULL_MODE=true ;;
  esac
done

# ─── Colors ───────────────────────────────────────────────────
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; GOLD='\033[0;33m'
BOLD='\033[1m'; DIM='\033[2m'; NC='\033[0m'

ok()   { echo -e "  ${GREEN}✅${NC} $1"; }
warn() { echo -e "  ${YELLOW}⚠️ ${NC} $1"; WARNINGS=$((WARNINGS+1)); }
fail() { echo -e "  ${RED}❌${NC} $1"; ERRORS=$((ERRORS+1)); }
info() { echo -e "  ${CYAN}ℹ️ ${NC} $1"; }
step() { echo -e "\n${GOLD}${BOLD}━━━ $1${NC}"; }

timestamp() { date '+%Y-%m-%d %H:%M:%S'; }

echo ""
echo -e "${BOLD}╔════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║  🔍 NOIZYNET PRE-FLIGHT CHECK              ║${NC}"
echo -e "${BOLD}║  MC96ECO Heaven Infrastructure             ║${NC}"
echo -e "${BOLD}╚════════════════════════════════════════════╝${NC}"
echo -e "  ${DIM}$(timestamp) | fix=$FIX_MODE full=$FULL_MODE${NC}"
echo ""

# ══════════════════════════════════════════════════════════════
# CHECK 1: Cloudflare WARP / VPN
# ══════════════════════════════════════════════════════════════
step "1/6 — CLOUDFLARE WARP STATUS"

if command -v warp-cli &>/dev/null; then
  WARP_STATUS=$(warp-cli status 2>/dev/null | grep -i "Status" | awk '{print $NF}' || echo "Unknown")
  echo -e "  Status: ${BOLD}$WARP_STATUS${NC}"

  if [[ "$WARP_STATUS" == "Connected" ]]; then
    ok "WARP connected — traffic routing through Cloudflare edge"

    # Check which account WARP is connected to
    WARP_ACCOUNT=$(warp-cli account 2>/dev/null | grep "Account type" || echo "")
    [[ -n "$WARP_ACCOUNT" ]] && info "$WARP_ACCOUNT"

  else
    warn "WARP not connected (status: $WARP_STATUS)"
    if $FIX_MODE; then
      echo -e "  ${CYAN}→ Attempting warp-cli connect...${NC}"
      warp-cli connect && sleep 3
      NEW_STATUS=$(warp-cli status 2>/dev/null | grep -i "Status" | awk '{print $NF}' || echo "Unknown")
      [[ "$NEW_STATUS" == "Connected" ]] && ok "WARP connected" || fail "WARP connect failed — check Cloudflare One dashboard"
    else
      info "Run with --fix to auto-connect, or: warp-cli connect"
    fi
  fi
else
  warn "warp-cli not found — WARP not installed"
  info "Install: brew install --cask cloudflare-warp (or check one.one.one.one)"
fi

# ══════════════════════════════════════════════════════════════
# CHECK 2: cloudflared CLI + Tunnel Auth
# ══════════════════════════════════════════════════════════════
step "2/6 — CLOUDFLARED TUNNEL"

if command -v cloudflared &>/dev/null; then
  CLOUDFLARED_VER=$(cloudflared --version 2>&1 | head -1)
  ok "cloudflared found: $CLOUDFLARED_VER"

  # Check credentials exist
  if [[ -d "$CLOUDFLARE_CRED_DIR" ]]; then
    CRED_FILES=$(find "$CLOUDFLARE_CRED_DIR" -name "*.json" 2>/dev/null | wc -l | tr -d ' ')
    if (( CRED_FILES > 0 )); then
      ok "$CRED_FILES tunnel credential file(s) found in ~/.cloudflared/"
    else
      warn "No tunnel credential files in ~/.cloudflared/"
      info "Run: cloudflared login  (opens browser to authenticate)"
    fi
  else
    warn "~/.cloudflared/ directory not found"
    if $FIX_MODE; then
      echo -e "  ${CYAN}→ Running: cloudflared login${NC}"
      cloudflared login
    fi
  fi

  # Check if a tunnel process is running
  if pgrep -x cloudflared &>/dev/null; then
    TUNNEL_PID=$(pgrep -x cloudflared | head -1)
    ok "cloudflared process running (PID: $TUNNEL_PID)"
  else
    warn "No cloudflared tunnel process running"
    info "Start tunnel: cloudflared tunnel run noizy-tunnel"
    info "Or check: ~/MC96ECO/heaven/cloudflare/tunnel-config.yml"
  fi

else
  fail "cloudflared not installed"
  info "Install: brew install cloudflared"
fi

# ══════════════════════════════════════════════════════════════
# CHECK 3: SSH Config for Cloudflare Access
# ══════════════════════════════════════════════════════════════
step "3/6 — SSH PROXY CONFIG"

if [[ -f "$SSH_CONFIG" ]]; then
  if grep -q "cloudflared access ssh" "$SSH_CONFIG" 2>/dev/null; then
    ok "SSH ProxyCommand configured for Cloudflare Access"
    # Show which hosts are configured
    grep -B2 "cloudflared access ssh" "$SSH_CONFIG" | grep "^Host " | while read -r line; do
      info "  Tunneled host: $line"
    done
  else
    warn "~/.ssh/config missing Cloudflare Access ProxyCommand"
    info "Add to ~/.ssh/config:"
    echo -e "    ${DIM}Host *.noizy.ai${NC}"
    echo -e "    ${DIM}  ProxyCommand cloudflared access ssh --hostname %h${NC}"
  fi
else
  warn "~/.ssh/config not found"
fi

# ══════════════════════════════════════════════════════════════
# CHECK 4: Domain HTTP/S Connectivity (the 403 test)
# ══════════════════════════════════════════════════════════════
step "4/6 — DOMAIN CONNECTIVITY"

check_url() {
  local label="$1"
  local url="$2"
  local HTTP_CODE
  HTTP_CODE=$(curl -I -s -o /dev/null -w "%{http_code}" \
    --max-time 10 \
    -A "$USER_AGENT" \
    "$url" 2>/dev/null || echo "000")

  case "$HTTP_CODE" in
    200|201|204)
      ok "$label → ${GREEN}HTTP $HTTP_CODE${NC}"
      ;;
    301|302|307|308)
      ok "$label → ${CYAN}HTTP $HTTP_CODE (redirect)${NC}"
      ;;
    401)
      warn "$label → HTTP 401 Unauthorized — JWT token missing or expired"
      info "Run: cloudflared access login $url"
      ;;
    403)
      fail "$label → HTTP 403 Forbidden — Access Policy is blocking you"
      info "Fix options:"
      info "  1. cloudflared access login $url"
      info "  2. Check your Cloudflare Zero Trust policy in the dashboard"
      info "  3. Verify your email is in the Access policy allow-list"
      if $FIX_MODE; then
        echo -e "  ${CYAN}→ Running: cloudflared access login $url${NC}"
        cloudflared access login "$url" || true
      fi
      ;;
    404)
      warn "$label → HTTP 404 — Route not found (tunnel up, Worker routing issue)"
      info "Check: wrangler tail (in your worker/ directory)"
      ;;
    521|522|523|524)
      fail "$label → HTTP $HTTP_CODE — Origin unreachable (tunnel down or GOD offline)"
      info "Check: is the cloudflared tunnel running on GOD (M2 Ultra)?"
      ;;
    000)
      fail "$label → Connection failed (DNS or network error)"
      info "Check: dig $DOMAIN +short"
      ;;
    *)
      warn "$label → Unexpected HTTP $HTTP_CODE"
      ;;
  esac
}

check_url "noizy.ai" "https://$DOMAIN"
check_url "heaven.noizy.ai/health" "$HEAVEN_WORKER_URL$HEAVEN_HEALTH_ENDPOINT"
check_url "heaven.noizy.ai/api" "$HEAVEN_WORKER_URL/api"

# DNS check
echo ""
info "DNS resolution:"
DNS_RESULT=$(dig +short "$DOMAIN" 2>/dev/null | head -3)
if [[ -n "$DNS_RESULT" ]]; then
  echo -e "    ${DIM}$DOMAIN → $DNS_RESULT${NC}"
  # Check if pointing to Cloudflare
  if echo "$DNS_RESULT" | grep -q "cloudflare\|1\.1\.1\|104\."; then
    ok "DNS points to Cloudflare"
  else
    warn "DNS may not be pointing to Cloudflare — check nameservers"
  fi
else
  fail "DNS lookup failed for $DOMAIN"
  info "Nameservers may still be propagating — check registrar"
fi

# ══════════════════════════════════════════════════════════════
# CHECK 5: Network Latency
# ══════════════════════════════════════════════════════════════
step "5/6 — NETWORK LATENCY"

PING_RESULT=$(ping -c 4 -q "$DOMAIN" 2>/dev/null | tail -1)
if [[ -n "$PING_RESULT" ]]; then
  # Extract avg from: round-trip min/avg/max/stddev = X/Y/Z/W ms
  AVG_MS=$(echo "$PING_RESULT" | awk -F'/' '{print $5}' | sed 's/ ms//')
  echo -e "  Round-trip: ${BOLD}$PING_RESULT${NC}"

  if (( $(echo "$AVG_MS < 50" | bc -l 2>/dev/null || echo 0) )); then
    ok "Excellent latency ($AVG_MS ms) — AUNet audio will be crisp"
  elif (( $(echo "$AVG_MS < 100" | bc -l 2>/dev/null || echo 1) )); then
    ok "Acceptable latency ($AVG_MS ms)"
  else
    warn "High latency ($AVG_MS ms) — AUNet audio may experience jitter/dropouts"
    info "Check: is WARP routing through a distant edge node?"
    info "Run: warp-cli get-mdm-config (to check region)"
  fi
else
  warn "Ping to $DOMAIN failed (may be ICMP-blocked by Cloudflare)"
  # Fallback: measure HTTP latency instead
  HTTP_TIME=$(curl -o /dev/null -s -w "%{time_total}" --max-time 10 "https://$DOMAIN" 2>/dev/null || echo "error")
  if [[ "$HTTP_TIME" != "error" ]]; then
    HTTP_MS=$(echo "$HTTP_TIME * 1000" | bc -l 2>/dev/null | xargs printf "%.0f" 2>/dev/null || echo "?")
    info "HTTP response time: ${HTTP_MS}ms (ICMP blocked, using HTTP latency)"
  fi
fi

# ══════════════════════════════════════════════════════════════
# CHECK 6: RTSP Streams + AUNet Nodes (--full only)
# ══════════════════════════════════════════════════════════════
step "6/6 — RTSP / AUNET ${FULL_MODE:+[ACTIVE]}"

if ! $FULL_MODE; then
  info "RTSP/AUNet checks skipped (run with --full to enable)"
else
  # RTSP stream checks
  if (( ${#RTSP_NODES[@]} > 0 )); then
    echo -e "  ${BOLD}RTSP Streams:${NC}"
    for stream in "${RTSP_NODES[@]}"; do
      # Use ffprobe to check stream health if available
      if command -v ffprobe &>/dev/null; then
        STREAM_INFO=$(ffprobe -v quiet -print_format json -show_streams "$stream" 2>/dev/null)
        if [[ -n "$STREAM_INFO" ]]; then
          CODEC=$(echo "$STREAM_INFO" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['streams'][0].get('codec_name','?'))" 2>/dev/null || echo "?")
          ok "RTSP: $stream (codec: $codec)"
        else
          fail "RTSP: $stream — stream not accessible"
        fi
      else
        # Fallback: TCP connect to RTSP port
        HOST=$(echo "$stream" | sed 's|rtsp://||' | cut -d: -f1)
        PORT=$(echo "$stream" | sed 's|rtsp://||' | cut -d: -f2 | cut -d/ -f1)
        PORT=${PORT:-554}
        if nc -z -w3 "$HOST" "$PORT" 2>/dev/null; then
          ok "RTSP port $PORT reachable on $HOST"
        else
          fail "RTSP port $PORT unreachable on $HOST"
        fi
      fi
    done
  else
    info "No RTSP nodes configured — add stream URLs to RTSP_NODES[] in this script"
    info "Example: rtsp://localhost:8554/dreamchamber"
  fi

  # AUNet peer checks
  echo ""
  echo -e "  ${BOLD}AUNet Peers:${NC}"
  if (( ${#AUNET_PEERS[@]} > 0 )); then
    for peer in "${AUNET_PEERS[@]}"; do
      PEER_PING=$(ping -c 3 -q "$peer" 2>/dev/null | tail -1)
      if [[ -n "$PEER_PING" ]]; then
        PEER_AVG=$(echo "$PEER_PING" | awk -F'/' '{print $5}')
        if (( $(echo "$PEER_AVG < 5" | bc -l 2>/dev/null || echo 0) )); then
          ok "AUNet: $peer — ${PEER_AVG}ms (local network, ideal for audio)"
        else
          warn "AUNet: $peer — ${PEER_AVG}ms (higher than expected for local)"
        fi
      else
        fail "AUNet: $peer — unreachable"
        info "Is the AUNet node running? Is mDNS resolving $peer?"
      fi
    done
  else
    info "No AUNet peers configured — add hostnames/IPs to AUNET_PEERS[] in this script"
  fi
fi

# ══════════════════════════════════════════════════════════════
# SUMMARY
# ══════════════════════════════════════════════════════════════
echo ""
echo -e "${BOLD}════════════════════════════════════════════${NC}"

if (( ERRORS == 0 && WARNINGS == 0 )); then
  echo -e "${GREEN}${BOLD}✅ ALL SYSTEMS OPERATIONAL${NC}"
elif (( ERRORS == 0 )); then
  echo -e "${YELLOW}${BOLD}⚠️  OPERATIONAL WITH $WARNINGS WARNING(S)${NC}"
else
  echo -e "${RED}${BOLD}❌ $ERRORS ERROR(S) · $WARNINGS WARNING(S)${NC}"
  echo ""
  echo -e "${BOLD}Quick fixes:${NC}"
  echo -e "  ${CYAN}cloudflared access login https://$DOMAIN${NC}  # 403 fix"
  echo -e "  ${CYAN}warp-cli connect${NC}                           # WARP fix"
  echo -e "  ${CYAN}./noizy-check.sh --fix${NC}                     # auto-remediate"
fi

echo -e "${BOLD}════════════════════════════════════════════${NC}"
echo -e "${DIM}$(timestamp) · GORUNFREE ✦${NC}"
echo ""
