#!/usr/bin/env zsh
# =============================================================================
# ⚡ FISHMUSICINC.COM LIVE DNS MONITOR — SANDBOX SAFE (DoH)
# PROTOCOL: ZERO LATENCY | AUTHORITY: RSP_001 / SHIRL & ENGR
# =============================================================================
set -euo pipefail

# ANSI color codes
export BOLD="\033[1m"
export GREEN="\033[38;5;82m"
export RED="\033[38;5;196m"
export YELLOW="\033[38;5;220m"
export BLUE="\033[38;5;39m"
export CYAN="\033[38;5;51m"
export RESET="\033[0m"

clear
echo -e "${BOLD}${BLUE}================================================================================${RESET}"
echo -e "${BOLD}${CYAN}      ⚡ fishmusicinc.com LIVE DNS & EMAIL SECURITY AUDIT STATUS${RESET}"
echo -e "${BOLD}${BLUE}================================================================================${RESET}"
echo -e "${BOLD}Timestamp:${RESET} $(date) | ${BOLD}Host:${RESET} $(hostname)"
echo -e "${BOLD}Strategy:${RESET} Google DNS-over-HTTPS (DoH) — Sandbox-Safe Protocol"
echo -e "${BOLD}${BLUE}--------------------------------------------------------------------------------${RESET}"

# Fetch DNS records using Cloudflare or Google DoH
fetch_record() {
  local name="$1"
  local type="$2"
  curl -s -H "accept: application/dns-json" "https://dns.google/resolve?name=${name}&type=${type}"
}

echo -n "Fetching live DNS tables... "
NS_DATA=$(fetch_record "fishmusicinc.com" "NS")
MX_DATA=$(fetch_record "fishmusicinc.com" "MX")
SPF_DATA=$(fetch_record "fishmusicinc.com" "TXT")
DKIM_DATA=$(fetch_record "google._domainkey.fishmusicinc.com" "TXT")
DMARC_DATA=$(fetch_record "_dmarc.fishmusicinc.com" "TXT")
echo -e "${GREEN}SUCCESS${RESET}\n"

# Run formatting & validation in Python
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
python3 "${SCRIPT_DIR}/dns_monitor_helper.py" "$NS_DATA" "$MX_DATA" "$SPF_DATA" "$DKIM_DATA" "$DMARC_DATA"

echo -e "${BOLD}${BLUE}================================================================================${RESET}"
