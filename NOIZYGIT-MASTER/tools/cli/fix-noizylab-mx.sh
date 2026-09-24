#!/usr/bin/env bash
# ============================================================================
# FIX NOIZYLAB.CA MX RECORDS
# ============================================================================
# Problem:  MX records point to mx01.improvmx.com / mx02.improvmx.com (NXDOMAIN)
# Fix:      Replace with mx1.improvmx.com / mx2.improvmx.com (the correct hosts)
#
# Gmail is holding mail to pops@noizylab.ca in retry queue (~19h remaining).
# Once these records are corrected, delivery should resume within minutes.
#
# Usage:
#   export CLOUDFLARE_API_TOKEN="your-token-here"
#   ./scripts/fix-noizylab-mx.sh
#
# Token needs: Zone:Read + DNS:Edit for noizylab.ca
#
# RSP_001 | NOIZY Empire | 2026-04-08
# ============================================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Config ──────────────────────────────────────────────────────────────────
CF_API="https://api.cloudflare.com/client/v4"
DOMAIN="noizylab.ca"

# ── Load token ──────────────────────────────────────────────────────────────
if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    # Try .env.cloudflare
    if [[ -f ".env.cloudflare" ]]; then
        export "$(grep -E '^CLOUDFLARE_API_TOKEN=' .env.cloudflare | head -1)"
    elif [[ -f ".dev.vars" ]]; then
        export "$(grep -E '^CLOUDFLARE_API_TOKEN=' .dev.vars | head -1)"
    fi
fi

if [[ -z "${CLOUDFLARE_API_TOKEN:-}" ]]; then
    echo -e "${RED}ERROR: CLOUDFLARE_API_TOKEN not set${NC}"
    echo "  export CLOUDFLARE_API_TOKEN='your-token'"
    exit 1
fi

# ── API helpers ─────────────────────────────────────────────────────────────
cf_get() {
    curl -s --max-time 15 \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        "${CF_API}$1"
}

cf_delete() {
    curl -s --max-time 15 -X DELETE \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        "${CF_API}$1"
}

cf_post() {
    curl -s --max-time 15 -X POST \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        -d "$2" \
        "${CF_API}$1"
}

# ── Main ────────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║         FIX MX RECORDS — noizylab.ca                    ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo -e "${DIM}  $(date -u +%Y-%m-%dT%H:%M:%SZ) | RSP_001${NC}"
echo ""

# ── Step 1: Find zone ID ───────────────────────────────────────────────────
echo -e "${BOLD}1. Finding zone ID for ${DOMAIN}...${NC}"
ZONE_RESPONSE=$(cf_get "/zones?name=${DOMAIN}&status=active")
ZONE_ID=$(echo "$ZONE_RESPONSE" | jq -r '.result[0].id // empty')

if [[ -z "$ZONE_ID" ]]; then
    echo -e "${RED}  ✗ Zone '${DOMAIN}' not found or not active${NC}"
    echo "$ZONE_RESPONSE" | jq '.errors' 2>/dev/null
    exit 1
fi
echo -e "${GREEN}  ✓ Zone ID: ${ZONE_ID}${NC}"

# ── Step 2: Get current MX records ────────────────────────────────────────
echo -e "\n${BOLD}2. Current MX records:${NC}"
MX_RESPONSE=$(cf_get "/zones/${ZONE_ID}/dns_records?type=MX")
MX_COUNT=$(echo "$MX_RESPONSE" | jq '.result | length')

echo "$MX_RESPONSE" | jq -r '.result[] | "  MX \(.priority) \(.content) (id: \(.id))"'

if [[ "$MX_COUNT" -eq 0 ]]; then
    echo -e "${RED}  ✗ No MX records found!${NC}"
    exit 1
fi

# Check for the broken records
BAD_MX01=$(echo "$MX_RESPONSE" | jq -r '.result[] | select(.content == "mx01.improvmx.com") | .id // empty')
BAD_MX02=$(echo "$MX_RESPONSE" | jq -r '.result[] | select(.content == "mx02.improvmx.com") | .id // empty')

if [[ -z "$BAD_MX01" && -z "$BAD_MX02" ]]; then
    # Maybe already fixed — check if correct ones exist
    GOOD_MX1=$(echo "$MX_RESPONSE" | jq -r '.result[] | select(.content == "mx1.improvmx.com") | .id // empty')
    GOOD_MX2=$(echo "$MX_RESPONSE" | jq -r '.result[] | select(.content == "mx2.improvmx.com") | .id // empty')
    if [[ -n "$GOOD_MX1" && -n "$GOOD_MX2" ]]; then
        echo -e "\n${GREEN}  ✓ MX records already correct! mx1/mx2.improvmx.com are set.${NC}"
        echo -e "${GREEN}  Nothing to do.${NC}"
        exit 0
    else
        echo -e "\n${YELLOW}  ⚠ MX records don't match expected broken pattern (mx01/mx02).${NC}"
        echo -e "  Current records:"
        echo "$MX_RESPONSE" | jq -r '.result[] | "    \(.priority) \(.content)"'
        echo -e "\n  Review manually at: https://dash.cloudflare.com/${ZONE_ID}/dns/records"
        exit 1
    fi
fi

# ── Step 3: Confirm ──────────────────────────────────────────────────────
echo ""
echo -e "${YELLOW}${BOLD}  PLANNED CHANGES:${NC}"
echo ""
if [[ -n "$BAD_MX01" ]]; then
    echo -e "    ${RED}DELETE${NC}  MX 10 mx01.improvmx.com  (id: ${BAD_MX01})"
fi
if [[ -n "$BAD_MX02" ]]; then
    echo -e "    ${RED}DELETE${NC}  MX 20 mx02.improvmx.com  (id: ${BAD_MX02})"
fi
echo -e "    ${GREEN}CREATE${NC}  MX 10 mx1.improvmx.com"
echo -e "    ${GREEN}CREATE${NC}  MX 20 mx2.improvmx.com"
echo ""

if [[ "${1:-}" != "--yes" ]]; then
    read -rp "  Apply these changes? [y/N] " confirm
    if [[ "$confirm" != "y" && "$confirm" != "Y" ]]; then
        echo -e "${YELLOW}  Aborted.${NC}"
        exit 0
    fi
fi

# ── Step 4: Delete broken records ────────────────────────────────────────
echo -e "\n${BOLD}3. Removing broken MX records...${NC}"

if [[ -n "$BAD_MX01" ]]; then
    RESULT=$(cf_delete "/zones/${ZONE_ID}/dns_records/${BAD_MX01}")
    if [[ $(echo "$RESULT" | jq -r '.success') == "true" ]]; then
        echo -e "  ${GREEN}✓ Deleted mx01.improvmx.com${NC}"
    else
        echo -e "  ${RED}✗ Failed to delete mx01: $(echo "$RESULT" | jq -r '.errors[0].message // "unknown"')${NC}"
        exit 1
    fi
fi

if [[ -n "$BAD_MX02" ]]; then
    RESULT=$(cf_delete "/zones/${ZONE_ID}/dns_records/${BAD_MX02}")
    if [[ $(echo "$RESULT" | jq -r '.success') == "true" ]]; then
        echo -e "  ${GREEN}✓ Deleted mx02.improvmx.com${NC}"
    else
        echo -e "  ${RED}✗ Failed to delete mx02: $(echo "$RESULT" | jq -r '.errors[0].message // "unknown"')${NC}"
        exit 1
    fi
fi

# ── Step 5: Create correct records ───────────────────────────────────────
echo -e "\n${BOLD}4. Creating correct MX records...${NC}"

RESULT=$(cf_post "/zones/${ZONE_ID}/dns_records" \
    '{"type":"MX","name":"@","content":"mx1.improvmx.com","priority":10,"ttl":1}')
if [[ $(echo "$RESULT" | jq -r '.success') == "true" ]]; then
    NEW_ID=$(echo "$RESULT" | jq -r '.result.id')
    echo -e "  ${GREEN}✓ Created MX 10 mx1.improvmx.com (id: ${NEW_ID})${NC}"
else
    echo -e "  ${RED}✗ Failed: $(echo "$RESULT" | jq -r '.errors[0].message // "unknown"')${NC}"
    exit 1
fi

RESULT=$(cf_post "/zones/${ZONE_ID}/dns_records" \
    '{"type":"MX","name":"@","content":"mx2.improvmx.com","priority":20,"ttl":1}')
if [[ $(echo "$RESULT" | jq -r '.success') == "true" ]]; then
    NEW_ID=$(echo "$RESULT" | jq -r '.result.id')
    echo -e "  ${GREEN}✓ Created MX 20 mx2.improvmx.com (id: ${NEW_ID})${NC}"
else
    echo -e "  ${RED}✗ Failed: $(echo "$RESULT" | jq -r '.errors[0].message // "unknown"')${NC}"
    exit 1
fi

# ── Step 6: Verify ───────────────────────────────────────────────────────
echo -e "\n${BOLD}5. Verifying new MX records...${NC}"
sleep 2

MX_VERIFY=$(cf_get "/zones/${ZONE_ID}/dns_records?type=MX")
echo "$MX_VERIFY" | jq -r '.result[] | "  MX \(.priority) \(.content)"'

CORRECT_COUNT=$(echo "$MX_VERIFY" | jq '[.result[] | select(.content == "mx1.improvmx.com" or .content == "mx2.improvmx.com")] | length')

if [[ "$CORRECT_COUNT" -eq 2 ]]; then
    echo -e "\n${GREEN}${BOLD}  ✓ MX records fixed!${NC}"
else
    echo -e "\n${YELLOW}  ⚠ Expected 2 correct MX records, found ${CORRECT_COUNT}. Check manually.${NC}"
fi

# ── Step 7: Live DNS check ───────────────────────────────────────────────
echo -e "\n${BOLD}6. Live DNS propagation check...${NC}"
sleep 1

LIVE_MX=$(dig MX "${DOMAIN}" +short 2>/dev/null || echo "dig not available")
echo -e "  ${CYAN}dig MX ${DOMAIN}:${NC}"
echo "$LIVE_MX" | sed 's/^/    /'

# Check if the correct servers resolve
MX1_A=$(dig A mx1.improvmx.com +short 2>/dev/null | head -1)
MX2_A=$(dig A mx2.improvmx.com +short 2>/dev/null | head -1)

if [[ -n "$MX1_A" && -n "$MX2_A" ]]; then
    echo -e "\n  ${GREEN}✓ mx1.improvmx.com resolves to ${MX1_A}${NC}"
    echo -e "  ${GREEN}✓ mx2.improvmx.com resolves to ${MX2_A}${NC}"
else
    echo -e "\n  ${YELLOW}⚠ ImprovMX servers not resolving yet — may need a moment${NC}"
fi

# ── Done ─────────────────────────────────────────────────────────────────
echo ""
echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}║                    MX FIX COMPLETE                      ║${NC}"
echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "  ${GREEN}Old:${NC}  mx01.improvmx.com / mx02.improvmx.com  ${RED}(NXDOMAIN)${NC}"
echo -e "  ${GREEN}New:${NC}  mx1.improvmx.com  / mx2.improvmx.com   ${GREEN}(ACTIVE)${NC}"
echo ""
echo -e "  Gmail will retry delivery to ${CYAN}pops@noizylab.ca${NC} automatically."
echo -e "  Cloudflare DNS propagates in ${BOLD}<5 minutes${NC} typically."
echo ""
echo -e "  ${DIM}Verify with: dig MX noizylab.ca +short${NC}"
echo ""
