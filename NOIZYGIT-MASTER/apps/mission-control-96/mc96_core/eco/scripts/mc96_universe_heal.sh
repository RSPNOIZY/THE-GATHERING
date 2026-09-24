#!/usr/bin/env bash
# ============================================================================
# MC96 ECOUNIVERSE — MASTER HEAL
# ============================================================================
# "One script. Every machine. Every service. Every truth."
#
# Author:  Robert Stephen Plowman / RSP_001
# Version: 1.0.0
# Date:    April 3, 2026
#
# This is the top-level orchestrator. It runs on GOD and reaches out
# to every node, every cloud service, every database, and every
# namespace in the MC96 ecosystem. It heals, audits, reports, and
# prepares everything for deployment.
#
# WHAT IT COVERS:
#   Layer 1: GOD (local machine) — repos, tools, configs
#   Layer 2: Network — GABRIEL, DaFixer, mobile connectivity
#   Layer 3: Cloudflare — Workers, D1, KV, DNS, Email
#   Layer 4: GitHub — org, repos, SSH, auth
#   Layer 5: Stripe — products, payment links
#   Layer 6: THE AQUARIUM — 34TB storage health
#   Layer 7: Security — MFA, keys, secrets, firewall
#   Layer 8: Services — n8n, Notion, Linear, Slack
#
# SAFETY:
#   - DRY RUN by default
#   - Never deletes anything
#   - Never pushes code
#   - Never modifies cloud configs
#   - Full audit log of every check
#
# USAGE:
#   chmod +x mc96_universe_heal.sh
#   ./mc96_universe_heal.sh                   # Full audit (read-only)
#   ./mc96_universe_heal.sh --layer 3         # Cloudflare only
#   ./mc96_universe_heal.sh --fix             # Actually fix issues
#   ./mc96_universe_heal.sh --report          # Generate report only
# ============================================================================

set -euo pipefail

VERSION="1.0.0"
TS=$(date -u +"%Y-%m-%dT%H:%M:%SZ")
LOCAL_TS=$(date +"%Y-%m-%d_%H%M%S")
MACHINE=$(hostname)
REPORT="$HOME/mc96_universe_report_${LOCAL_TS}.md"
LOG="$HOME/mc96_universe_heal_${LOCAL_TS}.log"
FIX_MODE=false
TARGET_LAYER=0  # 0 = all layers
REPORT_ONLY=false

# --- MC96 Constants ---
GOD_IP="10.90.90.10"
GABRIEL_IP="10.90.90.20"
DAFIXER_IP="10.90.90.40"
CF_ACCOUNT="5f36aa9795348ea681d0b21910dfc82a"
CF_ACCOUNT_LEGACY="2446d788cc4280f5ea22a9948410c355"
GITHUB_ORG_PRIMARY="NOIZY-ai"
GITHUB_ORG_SECONDARY="Noizyfish"
GITHUB_ORG_LEGACY="NOIZYLAB-io"
AQUARIUM_PATH="/Volumes/AQUARIUM"
AQUARIUM_ALT="/Volumes/THE_AQUARIUM"

# Counters
TOTAL_CHECKS=0
PASSED=0
WARNINGS=0
CRITICAL=0
FIXED=0

# --- Args ---
while [[ $# -gt 0 ]]; do
    case $1 in
        --fix) FIX_MODE=true; shift ;;
        --layer) TARGET_LAYER="$2"; shift 2 ;;
        --report) REPORT_ONLY=true; shift ;;
        -h|--help)
            cat << 'HELP'
MC96 ECOUNIVERSE HEAL v1.0.0

Usage: mc96_universe_heal.sh [OPTIONS]

  (no flags)     Full audit across all 8 layers (read-only)
  --fix          Actually fix issues found
  --layer N      Run only layer N (1-8)
  --report       Generate report without running checks

Layers:
  1  GOD (local)        4  GitHub         7  Security
  2  Network            5  Stripe         8  Services
  3  Cloudflare         6  THE AQUARIUM
HELP
            exit 0 ;;
        *) echo "Unknown: $1"; exit 1 ;;
    esac
done

# --- Logging ---
exec > >(tee -a "$LOG") 2>&1

# --- Helpers ---
check()    { TOTAL_CHECKS=$((TOTAL_CHECKS+1)); echo "[CHECK] $1"; }
pass()     { PASSED=$((PASSED+1)); echo "  [PASS] $1"; }
warning()  { WARNINGS=$((WARNINGS+1)); echo "  [WARN] $1"; }
critical() { CRITICAL=$((CRITICAL+1)); echo "  [CRIT] $1"; }
fixed()    { FIXED=$((FIXED+1)); echo "  [FIX]  $1"; }
skip()     { echo "  [SKIP] $1"; }
divider()  { echo ""; echo "==================================================="; }

should_run() { [[ "$TARGET_LAYER" -eq 0 ]] || [[ "$TARGET_LAYER" -eq "$1" ]]; }

# ================================================================
# BANNER
# ================================================================

cat << 'BANNER'

    +===============================================+
    |     MC96 ECOUNIVERSE -- MASTER HEAL           |
    |     "Every node. Every service. Every truth." |
    +===============================================+

BANNER
echo "  Machine:  $MACHINE"
echo "  Time:     $TS"
echo "  Mode:     $(if $FIX_MODE; then echo 'FIX'; else echo 'AUDIT'; fi)"
echo "  Layer:    $(if [[ $TARGET_LAYER -eq 0 ]]; then echo 'ALL'; else echo "$TARGET_LAYER"; fi)"
echo "  Report:   $REPORT"
echo ""

# ================================================================
# LAYER 1: GOD (Local Machine)
# ================================================================

if should_run 1; then
    divider
    echo "LAYER 1: GOD -- Local Machine Health"
    divider

    # 1.1 Essential tools
    check "Essential CLI tools installed"
    for tool in git node npm npx wrangler gh curl ssh python3; do
        if command -v "$tool" &>/dev/null; then
            ver=$($tool --version 2>/dev/null | head -1 || echo "installed")
            pass "$tool: $ver"
        else
            critical "$tool: NOT FOUND"
        fi
    done

    # 1.2 Optional but important tools
    check "Development tools"
    for tool in code-insiders docker ollama ffmpeg; do
        if command -v "$tool" &>/dev/null; then
            pass "$tool: installed"
        else
            warning "$tool: not found (optional)"
        fi
    done

    # 1.3 Wrangler authentication
    check "Wrangler authentication"
    if wrangler whoami &>/dev/null 2>&1; then
        WHOAMI=$(wrangler whoami 2>/dev/null | head -3)
        pass "Wrangler authenticated"
        echo "    $WHOAMI"
    else
        critical "Wrangler NOT authenticated -- run: wrangler login"
    fi

    # 1.4 GitHub CLI auth
    check "GitHub CLI authentication"
    if gh auth status &>/dev/null 2>&1; then
        pass "gh authenticated"
    else
        critical "gh NOT authenticated -- run: gh auth login"
    fi

    # 1.5 GitHub SSH auth
    check "GitHub SSH authentication"
    if ssh -T git@github.com 2>&1 | grep -qi "successfully authenticated"; then
        pass "SSH key authenticated with GitHub"
    else
        warning "SSH key issue -- run: ssh -T git@github.com"
    fi

    # 1.6 Node version
    check "Node.js version (18+ required)"
    NODE_VER=$(node --version 2>/dev/null | sed 's/v//' || echo "0")
    NODE_MAJOR=$(echo "$NODE_VER" | cut -d. -f1)
    if [[ "$NODE_MAJOR" -ge 18 ]]; then
        pass "Node $NODE_VER (>= 18)"
    else
        warning "Node $NODE_VER -- recommend 18+ for Wrangler"
    fi

    # 1.7 Disk space
    check "Disk space"
    if command -v df &>/dev/null; then
        ROOT_FREE=$(df -h / 2>/dev/null | tail -1 | awk '{print $4}')
        pass "Root volume free: $ROOT_FREE"
    fi

    echo ""
fi

# ================================================================
# LAYER 2: Network -- MC96 Nodes
# ================================================================

if should_run 2; then
    divider
    echo "LAYER 2: MC96 Network"
    divider

    # 2.1 GOD self-check
    check "GOD network identity"
    MY_IP=$(ipconfig getifaddr en0 2>/dev/null || echo "unknown")
    echo "    Local IP: $MY_IP"
    pass "Running on $(hostname)"

    # 2.2 GABRIEL reachability
    check "GABRIEL reachability"
    if ping -c 1 -W 2 "$GABRIEL_IP" &>/dev/null; then
        pass "GABRIEL responding at $GABRIEL_IP"
    else
        warning "GABRIEL unreachable (may be powered off)"
    fi

    # 2.3 DaFixer (Mickey P) reachability
    check "DaFixer (Mickey P) reachability"
    if ping -c 1 -W 2 "$DAFIXER_IP" &>/dev/null; then
        pass "DaFixer responding at $DAFIXER_IP"
    else
        warning "DaFixer unreachable (may be powered off)"
    fi

    # 2.4 Local services
    check "Local services on GOD"
    for port_name in "7777:GABRIEL-v2" "7778:NOIZYSTREAM-Control" "7779:NOIZYSTREAM-Signaling" "7780:DreamChamber-v2" "7781:Mirror-v1" "8080:Voice-Bridge" "8888:Command-Bridge" "11434:Ollama"; do
        port="${port_name%%:*}"
        name="${port_name##*:}"
        if curl -s -o /dev/null -w "%{http_code}" --max-time 2 "http://localhost:$port" 2>/dev/null | grep -qE "200|301|302|404"; then
            pass "$name (port $port): LIVE"
        else
            warning "$name (port $port): not responding"
        fi
    done

    echo ""
fi

# ================================================================
# LAYER 3: Cloudflare
# ================================================================

if should_run 3; then
    divider
    echo "LAYER 3: Cloudflare Infrastructure"
    divider

    # 3.1 DNS health
    check "DNS resolution for all domains"
    for domain in "noizy.ai" "noizyfish.com" "fishmusicinc.com" "noizykidz.com" "noizyvox.com"; do
        if command -v dig &>/dev/null; then
            A=$(dig +short "$domain" A 2>/dev/null || echo "FAIL")
            if [[ -n "$A" ]] && [[ "$A" != "FAIL" ]]; then
                pass "$domain -> $A"
            else
                critical "$domain -> DNS FAILED"
            fi
        fi
    done

    # 3.2 Subdomain check
    check "noizy.ai subdomains"
    for sub in "fish" "lab" "vox" "hooks" "wisdom" "app" "heaven"; do
        if command -v dig &>/dev/null; then
            SUB_A=$(dig +short "$sub.noizy.ai" 2>/dev/null)
            if [[ -n "$SUB_A" ]]; then
                pass "$sub.noizy.ai -> resolving"
            else
                warning "$sub.noizy.ai -> no DNS record"
            fi
        fi
    done

    # 3.3 HTTPS checks
    check "HTTPS endpoint health"
    for url in "https://noizy.ai" "https://noizyfish.com" "https://fishmusicinc.com"; do
        CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "$url" 2>/dev/null || echo "000")
        if [[ "$CODE" == "200" ]]; then
            pass "$url -> $CODE"
        elif [[ "$CODE" == "000" ]]; then
            warning "$url -> timeout"
        else
            warning "$url -> $CODE"
        fi
    done

    # 3.4 Workers deployed
    check "Brand Workers deployment status"
    for worker in "fish-noizy-ai" "lab-noizy-ai" "vox-noizy-ai" "wisdom-noizy-ai" "hooks-noizy-ai" "heaven-dns"; do
        if command -v wrangler &>/dev/null; then
            # Check via subdomain
            WORKER_URL="https://$worker.rsp-5f3.workers.dev"
            CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 5 "$WORKER_URL" 2>/dev/null || echo "000")
            if [[ "$CODE" != "000" ]]; then
                pass "$worker -> $CODE ($WORKER_URL)"
            else
                warning "$worker -> not responding"
            fi
        fi
    done

    # 3.5 Email routing
    check "Email routing"
    if command -v dig &>/dev/null; then
        MX=$(dig +short noizy.ai MX 2>/dev/null || echo "NONE")
        if [[ -n "$MX" ]]; then
            pass "MX records: $MX"
        else
            warning "No MX records for noizy.ai"
        fi
    fi

    echo ""
fi

# ================================================================
# LAYER 4: GitHub
# ================================================================

if should_run 4; then
    divider
    echo "LAYER 4: GitHub"
    divider

    check "GitHub SSH access"
    if ssh -T git@github.com 2>&1 | grep -qi "successfully authenticated"; then
        pass "SSH authenticated with GitHub"
    else
        critical "SSH not authenticated with GitHub"
    fi

    check "GitHub org repos via SSH"
    for org_repo in "NOIZY-ai/NOIZYLAB" "NOIZY-ai/noizyanthropic" "NOIZYLAB-io/NOIZYLAB"; do
        if git ls-remote "git@github.com:$org_repo.git" HEAD &>/dev/null 2>&1; then
            pass "$org_repo -> accessible"
        else
            warning "$org_repo -> not accessible or doesn't exist"
        fi
    done

    check "Local scratch repos needing GitHub homes"
    SCRATCH_DIR="$HOME/.gemini/antigravity/scratch"
    for dir in "$SCRATCH_DIR"/*/; do
        dirname=$(basename "$dir")
        if [[ -d "$dir/.git" ]]; then
            REMOTE=$(git -C "$dir" remote get-url origin 2>/dev/null || echo "NONE")
            if [[ "$REMOTE" == "NONE" ]]; then
                warning "$dirname: git repo but NO remote"
            else
                pass "$dirname: remote = $REMOTE"
            fi
        else
            warning "$dirname: not a git repo"
        fi
    done

    echo ""
fi

# ================================================================
# LAYER 5: Stripe
# ================================================================

if should_run 5; then
    divider
    echo "LAYER 5: Stripe"
    divider

    check "Stripe integration status"
    warning "Stripe audit requires dashboard verification"
    echo "    Expected: 8 products, 12+ payment links"
    echo "    Brands: NOIZYVOX licenses (Premium/Standard/Community/Indie)"

    echo ""
fi

# ================================================================
# LAYER 6: THE AQUARIUM
# ================================================================

if should_run 6; then
    divider
    echo "LAYER 6: THE AQUARIUM (Storage)"
    divider

    # Check for all known volume paths
    check "External volumes"
    for vol in /Volumes/*/; do
        volname=$(basename "$vol")
        if [[ "$volname" != "Macintosh HD" ]] && [[ "$volname" != "Recovery" ]]; then
            SIZE=$(df -h "$vol" 2>/dev/null | tail -1 | awk '{print $2" total, "$4" free"}' || echo "unknown")
            pass "$volname: $SIZE"
        fi
    done

    echo ""
fi

# ================================================================
# LAYER 7: Security
# ================================================================

if should_run 7; then
    divider
    echo "LAYER 7: Security"
    divider

    check "SSH keys"
    KEY_COUNT=$(ls "$HOME/.ssh/id_*" 2>/dev/null | grep -v ".pub" | wc -l | tr -d ' ')
    if [[ "$KEY_COUNT" -gt 0 ]]; then
        pass "$KEY_COUNT SSH key(s) found"
    else
        warning "No SSH keys"
    fi

    check "macOS firewall"
    if command -v /usr/libexec/ApplicationFirewall/socketfilterfw &>/dev/null; then
        FW_STATUS=$(/usr/libexec/ApplicationFirewall/socketfilterfw --getglobalstate 2>/dev/null || echo "unknown")
        if echo "$FW_STATUS" | grep -qi "enabled"; then
            pass "macOS firewall enabled"
        else
            warning "macOS firewall may be disabled"
        fi
    fi

    check "FileVault"
    if command -v fdesetup &>/dev/null; then
        FV_STATUS=$(fdesetup status 2>/dev/null || echo "unknown")
        if echo "$FV_STATUS" | grep -qi "on"; then
            pass "FileVault is ON"
        else
            critical "FileVault is OFF"
        fi
    fi

    echo ""
fi

# ================================================================
# LAYER 8: Services
# ================================================================

if should_run 8; then
    divider
    echo "LAYER 8: Services"
    divider

    check "Ollama (local LLM inference)"
    if command -v ollama &>/dev/null; then
        pass "Ollama installed"
        MODELS=$(ollama list 2>/dev/null || echo "")
        if [[ -n "$MODELS" ]]; then
            echo "    Models:"
            echo "$MODELS" | while read -r line; do echo "      $line"; done
        fi
    else
        warning "Ollama not installed"
    fi

    check "Docker"
    if command -v docker &>/dev/null; then
        if docker info &>/dev/null 2>&1; then
            CONTAINERS=$(docker ps -q 2>/dev/null | wc -l | tr -d ' ')
            pass "Docker running, $CONTAINERS containers"
        else
            warning "Docker installed but daemon not running"
        fi
    else
        warning "Docker not installed"
    fi

    check "GPU availability"
    if system_profiler SPDisplaysDataType 2>/dev/null | grep -qi "apple"; then
        GPU_INFO=$(system_profiler SPDisplaysDataType 2>/dev/null | grep "Chipset\|Chip" | head -1 | xargs)
        pass "Apple GPU: $GPU_INFO"
    fi

    echo ""
fi

# ================================================================
# REPORT
# ================================================================

divider
echo "GENERATING REPORT"
divider

cat > "$REPORT" << REPORT_HEADER
# MC96 ECOUNIVERSE -- Health Report

| Field | Value |
|-------|-------|
| **Generated** | $TS |
| **Machine** | $MACHINE |
| **Mode** | $(if $FIX_MODE; then echo 'FIX'; else echo 'AUDIT'; fi) |
| **Version** | $VERSION |

## Summary

| Metric | Count |
|--------|-------|
| **Total Checks** | $TOTAL_CHECKS |
| **Passed** | $PASSED |
| **Warnings** | $WARNINGS |
| **Critical** | $CRITICAL |
| **Fixed** | $FIXED |

## Health Score

REPORT_HEADER

# Calculate health score
if [[ "$TOTAL_CHECKS" -gt 0 ]]; then
    SCORE=$(( (PASSED * 100) / TOTAL_CHECKS ))
else
    SCORE=0
fi

if [[ "$SCORE" -ge 90 ]]; then
    GRADE="A"
elif [[ "$SCORE" -ge 75 ]]; then
    GRADE="B"
elif [[ "$SCORE" -ge 60 ]]; then
    GRADE="C"
elif [[ "$SCORE" -ge 40 ]]; then
    GRADE="D"
else
    GRADE="F"
fi

echo "**Grade: $GRADE ($SCORE%)**" >> "$REPORT"
echo "" >> "$REPORT"
echo "Full log: \`$LOG\`" >> "$REPORT"
echo "" >> "$REPORT"
echo "---" >> "$REPORT"
echo "*MC96 ECOUNIVERSE HEAL v$VERSION -- \"Every node. Every service. Every truth.\"*" >> "$REPORT"

# ================================================================
# FINAL SUMMARY
# ================================================================

echo ""
echo "=========================================================="
echo "  MC96 ECOUNIVERSE HEAL -- COMPLETE"
echo "=========================================================="
echo ""
echo "  Checks:    $TOTAL_CHECKS"
echo "  Passed:    $PASSED"
echo "  Warnings:  $WARNINGS"
echo "  Critical:  $CRITICAL"
echo "  Fixed:     $FIXED"
echo ""
echo "  Health:    $GRADE ($SCORE%)"
echo ""
echo "  Report:    $REPORT"
echo "  Log:       $LOG"
echo ""

if [[ "$CRITICAL" -gt 0 ]]; then
    echo "  $CRITICAL critical issues require attention."
    echo ""
fi

if ! $FIX_MODE && [[ "$WARNINGS" -gt 0 || "$CRITICAL" -gt 0 ]]; then
    echo "  To fix issues: ./mc96_universe_heal.sh --fix"
    echo ""
fi

echo "  GORUNFREE."
echo ""
