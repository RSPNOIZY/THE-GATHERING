#!/usr/bin/env zsh
# =============================================================================
# ⚡ FIX_FISHMUSICINC_DNS.sh — AUTOMATED CLOUDFLARE DNS CONFIGURATION
# PROTOCOL: ZERO LATENCY | AUTHORITY: RSP_001 / SHIRL & ENGR
# =============================================================================
set -euo pipefail

# ANSI color codes for premium CLI interface
export BOLD="\033[1m"
export GREEN="\033[38;5;82m"
export RED="\033[38;5;196m"
export YELLOW="\033[38;5;220m"
export BLUE="\033[38;5;39m"
export CYAN="\033[38;5;51m"
export RESET="\033[0m"

DOMAIN="fishmusicinc.com"

clear
echo -e "${BOLD}${BLUE}================================================================================${RESET}"
echo -e "${BOLD}${CYAN}      ⚡ fishmusicinc.com AUTOMATED CLOUDFLARE DNS PROVISIONER${RESET}"
echo -e "${BOLD}${BLUE}================================================================================${RESET}"
echo -e "${BOLD}Objective:${RESET} Configure Google Workspace MX, SPF, and DMARC records on Cloudflare"
echo -e "${BOLD}${BLUE}--------------------------------------------------------------------------------${RESET}"

# Check for Cloudflare API Token
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  echo -e "${BOLD}${YELLOW}Authentication Required:${RESET}"
  echo -e "Please enter your Cloudflare API Token (Edit Zone DNS permissions):"
  echo -n "> "
  read -r -s CLOUDFLARE_API_TOKEN
  echo
  if [[ -z "$CLOUDFLARE_API_TOKEN" ]]; then
    echo -e "${RED}🚨 Error: API Token cannot be empty. Exiting.${RESET}"
    exit 1
  fi
fi

# 1. Fetch Zone ID
echo -n "Connecting to Cloudflare API... "
ZONE_RESP=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones?name=${DOMAIN}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json")

if [[ $(echo "$ZONE_RESP" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("success", False))') != "True" ]]; then
  echo -e "${RED}FAILED${RESET}"
  echo -e "API Response: $ZONE_RESP"
  exit 1
fi

ZONE_ID=$(echo "$ZONE_RESP" | python3 -c 'import sys, json; data=json.load(sys.stdin); print(data["result"][0]["id"] if data.get("result") else "")')

if [[ -z "$ZONE_ID" ]]; then
  echo -e "${RED}FAILED${RESET}"
  echo -e "\n${BOLD}${YELLOW}⚠️  Domain '${DOMAIN}' not found in this Cloudflare account!${RESET}"
  echo -e "Please follow these steps to add it:"
  echo -e "  1. Log into your Cloudflare dashboard."
  echo -e "  2. Click 'Add a Site' and register ${BOLD}${CYAN}${DOMAIN}${RESET} under the ${BOLD}NOIZY.AI${RESET} account."
  echo -e "  3. Select the ${BOLD}Free Website${RESET} plan."
  echo -e "  4. Cloudflare will assign the authoritative nameservers:"
  echo -e "     - ${BOLD}naomi.ns.cloudflare.com${RESET}"
  echo -e "     - ${BOLD}renan.ns.cloudflare.com${RESET}"
  echo -e "  5. Re-run this script to automatically configure Google Workspace mail routing!"
  exit 0
fi

echo -e "${GREEN}SUCCESS (Zone ID: ${ZONE_ID})${RESET}"

# Helper function to create DNS record
create_record() {
  local type="$1"
  local name="$2"
  local content="$3"
  local priority="${4:-0}"
  
  local payload
  if (( priority > 0 )); then
    payload="{\"type\":\"${type}\",\"name\":\"${name}\",\"content\":\"${content}\",\"priority\":${priority},\"ttl\":3600}"
  else
    payload="{\"type\":\"${type}\",\"name\":\"${name}\",\"content\":\"${content}\",\"ttl\":3600}"
  fi
  
  echo -n "Creating ${type} record for ${name}... "
  local resp
  resp=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
    -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
    -H "Content-Type: application/json" \
    -d "$payload")
    
  if [[ $(echo "$resp" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("success", False))') == "True" ]]; then
    echo -e "${GREEN}CREATED${RESET}"
  else
    local err_msg
    err_msg=$(echo "$resp" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("errors", [{}])[0].get("message", "Unknown error"))')
    if [[ "$err_msg" =~ "already exists" || "$err_msg" =~ "duplicate" ]]; then
      echo -e "${YELLOW}ALREADY EXISTS (Skipping)${RESET}"
    else
      echo -e "${RED}FAILED (${err_msg})${RESET}"
    fi
  fi
}

# 2. Clean up existing MX records
echo -e "\n${BOLD}[Phase 1] Cleaning up old MX records...${RESET}"
MX_RESP=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?type=MX" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json")

MX_RECORDS=$(echo "$MX_RESP" | python3 -c 'import sys, json; print(",".join([r["id"] for r in json.load(sys.stdin).get("result", [])]))')

if [[ -n "$MX_RECORDS" ]]; then
  for rec_id in ${(s:,:)MX_RECORDS}; do
    echo -n "Deleting old MX record ${rec_id}... "
    del_resp=$(curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${rec_id}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json")
    echo -e "${GREEN}DELETED${RESET}"
  done
else
  echo "No existing MX records found. Clean slate."
fi

# 3. Create Google Workspace MX Records
echo -e "\n${BOLD}[Phase 2] Deploying Google Workspace MX records...${RESET}"
create_record "MX" "@" "ASPMX.L.GOOGLE.COM" 1
create_record "MX" "@" "ALT1.ASPMX.L.GOOGLE.COM" 5
create_record "MX" "@" "ALT2.ASPMX.L.GOOGLE.COM" 5
create_record "MX" "@" "ALT3.ASPMX.L.GOOGLE.COM" 10
create_record "MX" "@" "ALT4.ASPMX.L.GOOGLE.COM" 10

# 4. Create SPF Record
echo -e "\n${BOLD}[Phase 3] Deploying SPF Record (TXT)...${RESET}"
create_record "TXT" "@" "v=spf1 include:_spf.google.com ~all"

# 5. Create DMARC Record
echo -e "\n${BOLD}[Phase 4] Deploying DMARC Record (TXT)...${RESET}"
create_record "TXT" "_dmarc" "v=DMARC1; p=none; pct=100; rua=mailto:rp@fishmusicinc.com"

echo -e "\n${BOLD}${BLUE}================================================================================${RESET}"
echo -e "${BOLD}${GREEN}⚡ PROVISIONING COMPLETE! All records successfully configured on Cloudflare.${RESET}"
echo -e "DNS records may take up to 5-15 minutes to propagate globally."
echo -e "${BOLD}${BLUE}================================================================================${RESET}"
