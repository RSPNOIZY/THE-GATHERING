#!/usr/bin/env zsh
# =============================================================================
# ⚡ ADD_GOOGLE_DKIM.sh — AUTOMATED CLOUDFLARE DKIM KEY INJECTOR
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

DOMAIN="fishmusicinc.com"
SELECTOR="google"
DKIM_RECORD_NAME="${SELECTOR}._domainkey"

clear
echo -e "${BOLD}${BLUE}================================================================================${RESET}"
echo -e "${BOLD}${CYAN}      ⚡ fishmusicinc.com CLOUDFLARE DKIM KEY INJECTOR${RESET}"
echo -e "${BOLD}${BLUE}================================================================================${RESET}"
echo -e "${BOLD}Objective:${RESET} Add Google Workspace DKIM signing key to your Cloudflare DNS zone"
echo -e "${BOLD}${BLUE}--------------------------------------------------------------------------------${RESET}"

# Get Cloudflare API Token
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

# Get DKIM key value
echo -e "\n${BOLD}${YELLOW}DKIM Key Input:${RESET}"
echo -e "Please paste the Google DKIM TXT record value (starts with 'v=DKIM1'):"
echo -n "> "
read -r DKIM_VALUE
echo

if [[ -z "$DKIM_VALUE" ]]; then
  echo -e "${RED}🚨 Error: DKIM value cannot be empty. Exiting.${RESET}"
  exit 1
fi

# Clean up double quotes if user pasted them
DKIM_VALUE="${DKIM_VALUE%\"}"
DKIM_VALUE="${DKIM_VALUE#\"}"

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

ZONE_ID=$(echo "$ZONE_RESP" | python3 -c 'import sys, json; print(json.load(sys.stdin)["result"][0]["id"])')
echo -e "${GREEN}SUCCESS (Zone ID: ${ZONE_ID})${RESET}"

# 2. Check and delete existing DKIM record at this selector
echo -e "\n${BOLD}[Phase 1] Checking for existing DKIM records at ${DKIM_RECORD_NAME}...${RESET}"
DKIM_CHECK=$(curl -s -X GET "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records?name=${DKIM_RECORD_NAME}" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json")

EXISTING_IDS=$(echo "$DKIM_CHECK" | python3 -c 'import sys, json; print(",".join([r["id"] for r in json.load(sys.stdin).get("result", [])]))')

if [[ -n "$EXISTING_IDS" ]]; then
  for rec_id in ${(s:,:)EXISTING_IDS}; do
    echo -n "Deleting old DKIM record ${rec_id}... "
    del_resp=$(curl -s -X DELETE "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records/${rec_id}" \
      -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
      -H "Content-Type: application/json")
    echo -e "${GREEN}DELETED${RESET}"
  done
else
  echo "No existing DKIM record found at selector '${SELECTOR}'."
fi

# 3. Create the new DKIM record
echo -e "\n${BOLD}[Phase 2] Deploying new DKIM record...${RESET}"
payload="{\"type\":\"TXT\",\"name\":\"${DKIM_RECORD_NAME}\",\"content\":\"${DKIM_VALUE}\",\"ttl\":3600}"

resp=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/${ZONE_ID}/dns_records" \
  -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
  -H "Content-Type: application/json" \
  -d "$payload")
  
if [[ $(echo "$resp" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("success", False))') == "True" ]]; then
  echo -e "${GREEN}SUCCESS — DKIM Key successfully added!${RESET}"
else
  err_msg=$(echo "$resp" | python3 -c 'import sys, json; print(json.load(sys.stdin).get("errors", [{}])[0].get("message", "Unknown error"))')
  echo -e "${RED}FAILED (${err_msg})${RESET}"
  exit 1
fi

echo -e "\n${BOLD}${BLUE}================================================================================${RESET}"
echo -e "${BOLD}${GREEN}⚡ DKIM KEY PROVISIONING COMPLETE!${RESET}"
echo -e "Go to your Google Workspace Admin Console to start email authentication."
echo -e "${BOLD}${BLUE}================================================================================${RESET}"
