#!/usr/bin/env bash
# ============================================================
# NOIZY PREFLIGHT — Full Infrastructure Verification
# Run this BEFORE and AFTER deploying to confirm state
# Non-destructive. Just checks and reports.
# ============================================================

set -euo pipefail
export PATH="/usr/local/bin:$PATH"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[0;33m'; CYAN='\033[0;36m'; NC='\033[0m'
PASS=0; FAIL=0; WARN=0

check() {
  local label="$1" result="$2" expected="${3:-}"
  if [[ -n "$expected" && "$result" == *"$expected"* ]]; then
    echo -e "  ${GREEN}✅${NC} $label: $result"; ((PASS++))
  elif [[ -z "$expected" && -n "$result" ]]; then
    echo -e "  ${GREEN}✅${NC} $label: $result"; ((PASS++))
  else
    echo -e "  ${RED}❌${NC} $label: ${result:-EMPTY}"; ((FAIL++))
  fi
}

warn() {
  local label="$1" msg="$2"
  echo -e "  ${YELLOW}⚠️${NC}  $label: $msg"; ((WARN++))
}

section() { echo -e "\n${CYAN}━━━ $1 ━━━${NC}"; }

echo "╔══════════════════════════════════════════════════╗"
echo "║  NOIZY PREFLIGHT — Infrastructure Verification  ║"
echo "║  $(date '+%Y-%m-%d %H:%M:%S')                          ║"
echo "╚══════════════════════════════════════════════════╝"

# ── 1. CLI TOOLS ──────────────────────────────────────────
section "CLI TOOLS"
check "node" "$(node --version 2>/dev/null || echo MISSING)" "v"
check "npm" "$(npm --version 2>/dev/null || echo MISSING)"
check "npx" "$(which npx 2>/dev/null || echo MISSING)" "npx"
check "wrangler" "$(npx wrangler --version 2>&1 | grep wrangler | head -1 || echo MISSING)" "wrangler"
check "cloudflared" "$(cloudflared --version 2>/dev/null || echo MISSING)" "cloudflared"
check "gh" "$(gh --version 2>/dev/null | head -1 || echo MISSING)" "gh"
check "docker" "$(docker --version 2>/dev/null || echo MISSING)" "Docker"
check "xcodegen" "$(xcodegen --version 2>/dev/null || echo MISSING)"
check "git" "$(git --version 2>/dev/null || echo MISSING)" "git"

# ── 2. AUTH STATUS ────────────────────────────────────────
section "AUTHENTICATION"
WRANGLER_AUTH=$(npx wrangler whoami 2>&1 | grep -i "account\|logged\|email\|not auth" | head -1 || echo "UNKNOWN")
if echo "$WRANGLER_AUTH" | grep -qi "not auth"; then
  echo -e "  ${RED}❌${NC} Wrangler: NOT AUTHENTICATED — run: npx wrangler login"; ((FAIL++))
else
  check "Wrangler auth" "$WRANGLER_AUTH"
fi

GH_AUTH=$(gh auth status 2>&1 | grep -i "logged\|account" | head -1 || echo "NOT AUTHENTICATED")
check "GitHub CLI" "$GH_AUTH" "Logged in"

CF_TUNNEL=$(cloudflared tunnel list 2>&1 | head -3 || echo "NOT INSTALLED")
check "cloudflared" "$(echo "$CF_TUNNEL" | head -1)"

# ── 3. DNS / DOMAINS ─────────────────────────────────────
section "DNS & DOMAINS"
for domain in noizy.ai noizyfish.com noizylab.ca; do
  NS=$(dig "$domain" NS +short 2>/dev/null | head -2 | tr '\n' ' ' || echo "TIMEOUT")
  MX=$(dig "$domain" MX +short 2>/dev/null | head -1 || echo "NONE")
  SPF=$(dig "$domain" TXT +short 2>/dev/null | grep "spf" | head -1 || echo "NONE")

  echo -e "  ${CYAN}$domain${NC}"
  if [[ "$NS" == *"cloudflare"* ]]; then
    echo -e "    ${GREEN}✅${NC} NS: $NS"; ((PASS++))
  elif [[ "$NS" == *"TIMEOUT"* || -z "$NS" ]]; then
    echo -e "    ${YELLOW}⚠️${NC}  NS: could not resolve"; ((WARN++))
  else
    echo -e "    ${RED}❌${NC} NS: $NS (not Cloudflare)"; ((FAIL++))
  fi

  if [[ "$MX" == *"GOOGLE"* || "$MX" == *"google"* ]]; then
    echo -e "    ${GREEN}✅${NC} MX: $MX"; ((PASS++))
  else
    echo -e "    ${YELLOW}⚠️${NC}  MX: $MX"; ((WARN++))
  fi

  if [[ "$SPF" == *"-all"* ]]; then
    echo -e "    ${GREEN}✅${NC} SPF: $SPF"; ((PASS++))
  elif [[ "$SPF" == *"~all"* ]]; then
    echo -e "    ${YELLOW}⚠️${NC}  SPF: $SPF (softfail — should be -all)"; ((WARN++))
  else
    echo -e "    ${RED}❌${NC} SPF: $SPF"; ((FAIL++))
  fi
done

# ── 4. WORKER DEPLOYMENT ─────────────────────────────────
section "CLOUDFLARE WORKER"
for url in "https://heaven.noizylab.workers.dev/health" "https://heaven.noizy.ai/health"; do
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 5 "$url" 2>/dev/null || echo "0")
  if [[ "$HTTP" == "200" ]]; then
    check "$url" "HTTP $HTTP" "200"
  elif [[ "$HTTP" == "404" ]]; then
    warn "$url" "404 — Worker not deployed yet"
  else
    echo -e "  ${RED}❌${NC} $url: HTTP $HTTP"; ((FAIL++))
  fi
done

# ── 5. NETWORK — MICKEY-P ────────────────────────────────
section "MICKEY-P (10.0.0.100)"
PING=$(ping -c 1 -t 3 10.0.0.100 2>/dev/null | grep "bytes from" | head -1 || echo "UNREACHABLE")
check "Ping" "$PING" "bytes from"

SSH=$(ssh -o ConnectTimeout=3 -o BatchMode=yes 10.0.0.100 'hostname' 2>/dev/null || echo "NO SSH")
if [[ "$SSH" != "NO SSH" ]]; then
  check "SSH" "hostname: $SSH"
else
  warn "SSH" "Port 22 not open — enable Remote Login on Mickey-P"
fi

for port in 548 5900 5000; do
  (echo >/dev/tcp/10.0.0.100/$port) 2>/dev/null && check "Port $port" "OPEN" "OPEN" || true
done

# ── 6. LOCAL SERVICES ─────────────────────────────────────
section "GOD LOCAL SERVICES"
for svc in "Ollama:11434" "Docker:2375" "n8n:5678" "Grafana:3000" "Heaven:8080" "Lucy:8081" "DreamChamber:7777"; do
  name="${svc%%:*}"; port="${svc##*:}"
  HTTP=$(curl -s -o /dev/null -w "%{http_code}" --connect-timeout 2 "http://localhost:$port" 2>/dev/null || echo "0")
  if [[ "$HTTP" != "0" && "$HTTP" != "000" ]]; then
    check "$name (:$port)" "HTTP $HTTP"
  else
    warn "$name (:$port)" "Not running"
  fi
done

# ── 7. PROJECT FILES ──────────────────────────────────────
section "PROJECT FILES"
check "Heaven Worker" "$(wc -l < /tmp/Heaven/worker/src/index.ts 2>/dev/null || echo 0) lines"
check "Lucy App" "$(find /tmp/Heaven/Lucy -name '*.swift' -exec cat {} + 2>/dev/null | wc -l | tr -d ' ') lines"
check "Gabriel App" "$(find /tmp/Heaven/Gabriel -name '*.swift' -exec cat {} + 2>/dev/null | wc -l | tr -d ' ') lines"
check "Micky App" "$(find /tmp/Heaven/Micky -name '*.swift' -exec cat {} + 2>/dev/null | wc -l | tr -d ' ') lines"
check "Recovery v3" "$(test -f /tmp/Heaven/tools/recovery/noizy_safe_recovery_v3.sh && echo 'installed' || echo 'missing')" "installed"
check "Mail Doctrine" "$(test -f /tmp/Heaven/tools/dns/MAIL_DOCTRINE.md && echo 'installed' || echo 'missing')" "installed"
check "DNS Checklist" "$(test -f /tmp/Heaven/tools/dns/DNS_CHECKLIST.md && echo 'installed' || echo 'missing')" "installed"

# ── SUMMARY ───────────────────────────────────────────────
echo ""
echo "╔══════════════════════════════════════════════════╗"
echo "║  RESULTS                                        ║"
printf "║  ${GREEN}PASS: %2d${NC}  ${RED}FAIL: %2d${NC}  ${YELLOW}WARN: %2d${NC}                  ║\n" "$PASS" "$FAIL" "$WARN"
echo "╚══════════════════════════════════════════════════╝"

if (( FAIL > 0 )); then
  echo ""
  echo "Next steps to fix failures:"
  echo "  1. npx wrangler login          (if auth failed)"
  echo "  2. npx wrangler deploy          (if worker not deployed)"
  echo "  3. Fix NS at registrar          (if DNS not Cloudflare)"
  echo "  4. Enable Remote Login on Mickey-P (if SSH failed)"
fi
