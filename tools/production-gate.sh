#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════════════════════
# NOIZY EMPIRE — Production Gate Script
# Checks all production readiness criteria against LIVE systems.
#
# Usage:  ./scripts/production-gate.sh
# Exit:   0 = all critical checks pass, 1 = one or more critical failures
#
# Created: 2026-04-13
# ═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ── Colors & Symbols ─────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
RESET='\033[0m'

PASS="${GREEN}[PASS]${RESET}"
FAIL="${RED}[FAIL]${RESET}"
SKIP="${YELLOW}[SKIP]${RESET}"

# ── Counters ─────────────────────────────────────────────────────────────────
TOTAL=0
PASSED=0
FAILED_CRITICAL=0
FAILED_ADVISORY=0
CRITICAL_CHECKS=0
ADVISORY_CHECKS=0

# ── Project root ─────────────────────────────────────────────────────────────
PROJECT_ROOT="${NOIZY_PROJECT_ROOT:-/Users/m2ultra/NOIZYANTHROPIC}"

# ── Check runner ─────────────────────────────────────────────────────────────
# Usage: run_check "CRITICAL|ADVISORY" "Description" "command"
run_check() {
    local severity="$1"
    local description="$2"
    local cmd="$3"
    local output=""
    local exit_code=0

    TOTAL=$((TOTAL + 1))

    if [ "$severity" = "CRITICAL" ]; then
        CRITICAL_CHECKS=$((CRITICAL_CHECKS + 1))
        local tag="${RED}CRIT${RESET}"
    else
        ADVISORY_CHECKS=$((ADVISORY_CHECKS + 1))
        local tag="${YELLOW}ADV ${RESET}"
    fi

    # Run the command, capture output and exit code
    output=$(eval "$cmd" 2>&1) && exit_code=0 || exit_code=$?

    if [ $exit_code -eq 0 ]; then
        PASSED=$((PASSED + 1))
        # Truncate output to first line, max 60 chars for display
        local short_output
        short_output=$(echo "$output" | head -1 | cut -c1-60)
        printf "  ${PASS}  [${tag}]  %-42s ${DIM}%s${RESET}\n" "$description" "$short_output"
    else
        if [ "$severity" = "CRITICAL" ]; then
            FAILED_CRITICAL=$((FAILED_CRITICAL + 1))
        else
            FAILED_ADVISORY=$((FAILED_ADVISORY + 1))
        fi
        local short_output
        short_output=$(echo "$output" | head -1 | cut -c1-60)
        printf "  ${FAIL}  [${tag}]  %-42s ${DIM}%s${RESET}\n" "$description" "$short_output"
    fi
}

# ═══════════════════════════════════════════════════════════════════════════════
# START
# ═══════════════════════════════════════════════════════════════════════════════

echo ""
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}${CYAN}  NOIZY EMPIRE — Production Readiness Gate${RESET}"
echo -e "${BOLD}${CYAN}  $(date '+%Y-%m-%d %H:%M:%S %Z')${RESET}"
echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}"
echo ""

# ── Section: Cloudflare ──────────────────────────────────────────────────────
echo -e "${BOLD}  CLOUDFLARE${RESET}"
echo -e "  ─────────────────────────────────────────────────────────"

run_check "CRITICAL" "Heaven Worker health" \
    "curl -sf --max-time 20 --retry 2 --retry-delay 1 https://heaven.rsp-5f3.workers.dev/health"

run_check "ADVISORY" "Landing page (200)" \
    "curl -sf --max-time 10 -o /dev/null -w '%{http_code}' https://noizy-landing.rsp-5f3.workers.dev | grep -q 200 && echo 'HTTP 200'"

run_check "ADVISORY" "D1 database accessible" \
    "cd '$PROJECT_ROOT' && npx wrangler d1 execute gabriel_db --remote --command 'SELECT count(*) FROM actors' 2>&1 | head -5"

run_check "ADVISORY" "noizy.ai DNS resolving" \
    "dig noizy.ai +short | head -1 | grep -q '.' && dig noizy.ai +short | head -1"

run_check "CRITICAL" "Wrangler authenticated" \
    "npx wrangler whoami 2>&1 | grep -v 'Not authenticated' | head -1"

echo ""

# ── Section: Local Services ──────────────────────────────────────────────────
echo -e "${BOLD}  LOCAL SERVICES${RESET}"
echo -e "  ─────────────────────────────────────────────────────────"

run_check "ADVISORY" "n8n running" \
    "curl -sf --max-time 5 http://localhost:5678/healthz"

run_check "ADVISORY" "Voice server running" \
    "curl -sf --max-time 5 http://localhost:9099/health 2>/dev/null || curl -sf --max-time 5 http://localhost:8080/health"

run_check "ADVISORY" "Ollama running" \
    "curl -sf --max-time 5 http://localhost:11434/api/tags | head -c 80"

echo ""

# ── Section: Git ─────────────────────────────────────────────────────────────
echo -e "${BOLD}  GIT${RESET}"
echo -e "  ─────────────────────────────────────────────────────────"

run_check "ADVISORY" "On main branch" \
    "cd '$PROJECT_ROOT' && git rev-parse --abbrev-ref HEAD 2>/dev/null | grep -qE '^(main|master)$' && git rev-parse --abbrev-ref HEAD"

run_check "CRITICAL" "No uncommitted changes" \
    "cd '$PROJECT_ROOT' && test -z \"\$(git status --porcelain --ignore-submodules=dirty 2>/dev/null)\" && echo 'Working tree clean (submodule dirt ignored)'"

run_check "CRITICAL" "No hardcoded secrets" \
    "cd '$PROJECT_ROOT' && ! grep -rn --include='*.ts' --include='*.js' --include='*.json' --include='*.yml' --include='*.yaml' --include='*.sh' --include='*.env' -E '(sk-ant-[a-zA-Z0-9]{10,}|sk-[a-zA-Z0-9]{20,}|AKIA[A-Z0-9]{16}|password=[^$\"{][a-zA-Z0-9]{8,})' . --exclude-dir=node_modules --exclude-dir=.git 2>/dev/null && echo 'No secrets found'"

echo ""

# ── Section: Apple Developer ─────────────────────────────────────────────────
echo -e "${BOLD}  APPLE DEVELOPER${RESET}"
echo -e "  ─────────────────────────────────────────────────────────"

run_check "ADVISORY" "Xcode installed" \
    "xcode_out=\$(xcodebuild -version 2>/dev/null); [ -n \"\$xcode_out\" ] && echo \"\${xcode_out%%\$'\n'*}\""

run_check "ADVISORY" "Valid signing identity" \
    "security find-identity -v -p codesigning 2>/dev/null | grep -c 'valid identities found' | xargs -I{} echo '{} identities'"

run_check "ADVISORY" "Swift available" \
    "swift --version 2>/dev/null | head -1"

echo ""

# ── Section: Dependencies ────────────────────────────────────────────────────
echo -e "${BOLD}  DEPENDENCIES${RESET}"
echo -e "  ─────────────────────────────────────────────────────────"

run_check "ADVISORY" "Node.js >= 20" \
    "node --version 2>/dev/null | grep -qE '^v(2[0-9]|[3-9][0-9])' && node --version"

run_check "ADVISORY" "Python 3" \
    "python3 --version 2>/dev/null"

run_check "ADVISORY" "Wrangler installed" \
    "npx wrangler --version 2>/dev/null | head -1"

run_check "ADVISORY" "Docker running" \
    "docker info >/dev/null 2>&1 && docker --version"

echo ""

# ═══════════════════════════════════════════════════════════════════════════════
# SUMMARY
# ═══════════════════════════════════════════════════════════════════════════════

FAILED=$((FAILED_CRITICAL + FAILED_ADVISORY))

echo -e "${BOLD}${CYAN}═══════════════════════════════════════════════════════════════${RESET}"
echo -e "${BOLD}  RESULTS${RESET}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════════${RESET}"
echo ""
echo -e "  Total checks:        ${BOLD}${TOTAL}${RESET}"
echo -e "  Passed:              ${GREEN}${BOLD}${PASSED}${RESET}"
echo -e "  Failed (critical):   ${RED}${BOLD}${FAILED_CRITICAL}${RESET} / ${CRITICAL_CHECKS}"
echo -e "  Failed (advisory):   ${YELLOW}${BOLD}${FAILED_ADVISORY}${RESET} / ${ADVISORY_CHECKS}"
echo ""

if [ "$FAILED_CRITICAL" -eq 0 ]; then
    echo -e "  ${GREEN}${BOLD}VERDICT:  PASS${RESET}  ${DIM}— All critical checks passed.${RESET}"
    if [ "$FAILED_ADVISORY" -gt 0 ]; then
        echo -e "  ${YELLOW}${BOLD}WARNING:${RESET}  ${FAILED_ADVISORY} advisory check(s) failed. Review above.${RESET}"
    fi
    echo ""
    exit 0
else
    echo -e "  ${RED}${BOLD}VERDICT:  FAIL${RESET}  ${DIM}— ${FAILED_CRITICAL} critical check(s) failed.${RESET}"
    echo ""
    exit 1
fi
