#!/usr/bin/env bash
# ============================================================================
# CLOUDFLARE EMPIRE INVENTORY — NOIZYANTHROPIC
# ============================================================================
# Maps all three Cloudflare accounts, their zones, Workers, D1 databases,
# KV namespaces, R2 buckets, Queues, Pages projects, and DNS records.
#
# PREREQUISITE: Create an API token at https://dash.cloudflare.com/profile/api-tokens
# Required permissions:
#   Account: Read
#   Zone: Read
#   Workers Scripts: Read
#   D1: Read
#   Workers KV Storage: Read
#   Workers R2 Storage: Read
#   Pages: Read
#   DNS: Read
#   Audit Logs: Read
#
# Usage:
#   export CLOUDFLARE_API_TOKEN="your-token-here"
#   ./scripts/cloudflare-inventory.sh
#
# Or with .env file:
#   echo 'CLOUDFLARE_API_TOKEN=your-token' > .env.cloudflare
#   ./scripts/cloudflare-inventory.sh
#
# RSP_001 | NOIZY Empire | 2026-04-08
# ============================================================================

set -euo pipefail

# ── Colors ──────────────────────────────────────────────────────────────────
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
BOLD='\033[1m'
DIM='\033[2m'
NC='\033[0m'

# ── Config ──────────────────────────────────────────────────────────────────
CF_API="https://api.cloudflare.com/client/v4"
REPORT_DIR="${REPORT_DIR:-$(pwd)/logs}"
REPORT_FILE="${REPORT_DIR}/cloudflare_inventory_$(date +%Y%m%d_%H%M%S).json"
REPORT_MD="${REPORT_DIR}/cloudflare_inventory_$(date +%Y%m%d_%H%M%S).md"

# ── Load token ──────────────────────────────────────────────────────────────
load_token() {
    # Check environment first
    if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
        return 0
    fi

    # Try .env.cloudflare
    if [[ -f ".env.cloudflare" ]]; then
        export "$(grep -E '^CLOUDFLARE_API_TOKEN=' .env.cloudflare | head -1)"
        if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
            echo -e "${DIM}Loaded token from .env.cloudflare${NC}"
            return 0
        fi
    fi

    # Try .dev.vars
    if [[ -f ".dev.vars" ]]; then
        export "$(grep -E '^CLOUDFLARE_API_TOKEN=' .dev.vars | head -1)"
        if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
            echo -e "${DIM}Loaded token from .dev.vars${NC}"
            return 0
        fi
    fi

    echo -e "${RED}ERROR: CLOUDFLARE_API_TOKEN not set${NC}"
    echo ""
    echo "Create a token at: https://dash.cloudflare.com/profile/api-tokens"
    echo ""
    echo "Required token permissions:"
    echo "  • Account: Read"
    echo "  • Zone: Read"
    echo "  • Workers Scripts: Read"
    echo "  • D1: Read"
    echo "  • Workers KV Storage: Read"
    echo "  • Workers R2 Storage: Read"
    echo "  • Pages: Read"
    echo "  • DNS: Read"
    echo ""
    echo "Then run:"
    echo "  export CLOUDFLARE_API_TOKEN='your-token'"
    echo "  ./scripts/cloudflare-inventory.sh"
    exit 1
}

# ── API helpers ─────────────────────────────────────────────────────────────
cf_get() {
    local endpoint="$1"
    local response
    response=$(curl -s --max-time 15 \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        "${CF_API}${endpoint}" 2>/dev/null)

    if [[ $(echo "$response" | jq -r '.success // false') == "true" ]]; then
        echo "$response"
    else
        local errors
        errors=$(echo "$response" | jq -r '.errors[]?.message // "Unknown error"' 2>/dev/null)
        echo -e "${RED}  ✗ API error on ${endpoint}: ${errors}${NC}" >&2
        echo '{"success":false,"result":[]}'
    fi
}

cf_get_raw() {
    local endpoint="$1"
    curl -s --max-time 15 \
        -H "Authorization: Bearer ${CLOUDFLARE_API_TOKEN}" \
        -H "Content-Type: application/json" \
        "${CF_API}${endpoint}" 2>/dev/null
}

# ── Verify token ────────────────────────────────────────────────────────────
verify_token() {
    echo -e "${BOLD}🔑 Verifying API token...${NC}"
    local response
    response=$(cf_get_raw "/user/tokens/verify")
    local status
    status=$(echo "$response" | jq -r '.result.status // "unknown"' 2>/dev/null)

    if [[ "$status" == "active" ]]; then
        echo -e "${GREEN}  ✓ Token is active${NC}"
    else
        echo -e "${RED}  ✗ Token status: ${status}${NC}"
        echo "$response" | jq '.errors' 2>/dev/null
        exit 1
    fi
}

# ── Get user identity ──────────────────────────────────────────────────────
get_user() {
    echo -e "\n${BOLD}👤 User Identity${NC}"
    local response
    response=$(cf_get "/user")
    local email name
    email=$(echo "$response" | jq -r '.result.email // "unknown"')
    name=$(echo "$response" | jq -r '.result.first_name // "" + " " + .result.last_name // ""')
    echo -e "  ${CYAN}Email:${NC} ${email}"
    echo -e "  ${CYAN}Name:${NC}  ${name}"
    echo "$response" | jq '.result | {email, first_name, last_name, id, two_factor_authentication_enabled}'
}

# ── List all accounts ──────────────────────────────────────────────────────
list_accounts() {
    echo -e "\n${BOLD}🏢 Accounts${NC}"
    echo -e "${DIM}  Scanning all accounts accessible with this token...${NC}"

    local response
    response=$(cf_get "/accounts?per_page=50")
    local count
    count=$(echo "$response" | jq '.result | length')

    echo -e "  ${GREEN}Found ${count} account(s)${NC}\n"

    echo "$response" | jq -r '.result[] | "  \(.id) | \(.name) | type=\(.type)"'

    # Store account IDs for later use
    ACCOUNT_IDS=($(echo "$response" | jq -r '.result[].id'))
    ACCOUNT_NAMES=($(echo "$response" | jq -r '.result[].name' | tr ' ' '_'))

    # Write to JSON inventory
    echo "$response" | jq '.result' > /tmp/cf_accounts.json
}

# ── List zones per account ────────────────────────────────────────────────
list_zones() {
    echo -e "\n${BOLD}🌐 Zones (Domains)${NC}"

    local response
    response=$(cf_get "/zones?per_page=50")
    local count
    count=$(echo "$response" | jq '.result | length')

    echo -e "  ${GREEN}Found ${count} zone(s)${NC}\n"

    echo "$response" | jq -r '.result[] |
        "  \(.name) | status=\(.status) | plan=\(.plan.name) | account=\(.account.name) | ns=\(.name_servers | join(", "))"'

    # Store for later
    echo "$response" | jq '.result' > /tmp/cf_zones.json

    ZONE_IDS=($(echo "$response" | jq -r '.result[].id'))
    ZONE_NAMES=($(echo "$response" | jq -r '.result[].name'))
}

# ── List Workers per account ───────────────────────────────────────────────
list_workers() {
    echo -e "\n${BOLD}⚡ Workers${NC}"

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC} (${acct_id})"

        local response
        response=$(cf_get "/accounts/${acct_id}/workers/scripts")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} worker(s)${NC}"
            echo "$response" | jq -r '.result[] |
                "    ⚡ \(.id) | modified=\(.modified_on // "?") | routes=\(.routes // [] | length)"'
        else
            echo -e "  ${DIM}  No workers found${NC}"
        fi

        echo "$response" | jq ".result // [] | {account_id: \"${acct_id}\", account_name: \"${acct_name}\", workers: .}" >> /tmp/cf_workers.json
    done
}

# ── List D1 databases per account ─────────────────────────────────────────
list_d1() {
    echo -e "\n${BOLD}🗄️  D1 Databases${NC}"

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC}"

        local response
        response=$(cf_get "/accounts/${acct_id}/d1/database?per_page=50")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} database(s)${NC}"
            echo "$response" | jq -r '.result[] |
                "    🗄️  \(.name) | uuid=\(.uuid) | version=\(.version) | size=\(.file_size // "?") | tables=\(.num_tables // "?")"'
        else
            echo -e "  ${DIM}  No D1 databases found${NC}"
        fi
    done
}

# ── List KV namespaces per account ────────────────────────────────────────
list_kv() {
    echo -e "\n${BOLD}📦 KV Namespaces${NC}"

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC}"

        local response
        response=$(cf_get "/accounts/${acct_id}/storage/kv/namespaces?per_page=100")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} namespace(s)${NC}"
            echo "$response" | jq -r '.result[] |
                "    📦 \(.title) | id=\(.id)"'
        else
            echo -e "  ${DIM}  No KV namespaces found${NC}"
        fi
    done
}

# ── List R2 buckets per account ───────────────────────────────────────────
list_r2() {
    echo -e "\n${BOLD}🪣 R2 Buckets${NC}"

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC}"

        local response
        response=$(cf_get "/accounts/${acct_id}/r2/buckets")
        local count
        count=$(echo "$response" | jq '.result.buckets | length // 0' 2>/dev/null || echo "0")

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} bucket(s)${NC}"
            echo "$response" | jq -r '.result.buckets[] |
                "    🪣 \(.name) | location=\(.location // "auto") | created=\(.creation_date // "?")"'
        else
            echo -e "  ${DIM}  No R2 buckets found${NC}"
        fi
    done
}

# ── List Queues per account ───────────────────────────────────────────────
list_queues() {
    echo -e "\n${BOLD}📬 Queues${NC}"

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC}"

        local response
        response=$(cf_get "/accounts/${acct_id}/queues")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} queue(s)${NC}"
            echo "$response" | jq -r '.result[] |
                "    📬 \(.queue_name) | id=\(.queue_id) | created=\(.created_on // "?")"'
        else
            echo -e "  ${DIM}  No queues found${NC}"
        fi
    done
}

# ── List Pages projects per account ───────────────────────────────────────
list_pages() {
    echo -e "\n${BOLD}📄 Pages Projects${NC}"

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC}"

        local response
        response=$(cf_get "/accounts/${acct_id}/pages/projects")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} project(s)${NC}"
            echo "$response" | jq -r '.result[] |
                "    📄 \(.name) | subdomain=\(.subdomain) | domains=\(.domains | length) | env=\(.production_branch // "main")"'
        else
            echo -e "  ${DIM}  No Pages projects found${NC}"
        fi
    done
}

# ── List Durable Objects per account ──────────────────────────────────────
list_durable_objects() {
    echo -e "\n${BOLD}🔒 Durable Objects${NC}"

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC}"

        local response
        response=$(cf_get "/accounts/${acct_id}/workers/durable_objects/namespaces")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} namespace(s)${NC}"
            echo "$response" | jq -r '.result[] |
                "    🔒 \(.name // .id) | class=\(.class // "?") | script=\(.script // "?")"'
        else
            echo -e "  ${DIM}  No Durable Objects found${NC}"
        fi
    done
}

# ── List DNS records per zone ─────────────────────────────────────────────
list_dns() {
    echo -e "\n${BOLD}🔤 DNS Records (summary per zone)${NC}"

    for i in "${!ZONE_IDS[@]}"; do
        local zone_id="${ZONE_IDS[$i]}"
        local zone_name="${ZONE_NAMES[$i]}"
        echo -e "\n  ${CYAN}Zone: ${zone_name}${NC}"

        local response
        response=$(cf_get "/zones/${zone_id}/dns_records?per_page=500")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        echo -e "  ${GREEN}${count} record(s)${NC}"

        # Summary by type
        echo "$response" | jq -r '.result | group_by(.type) | .[] |
            "    \(.[0].type): \(length) record(s)"'

        # Show Workers routes (CNAME to workers.dev)
        local worker_records
        worker_records=$(echo "$response" | jq -r '[.result[] | select(.content | test("workers.dev|pages.dev"; "i"))] | length')
        if [[ "$worker_records" -gt 0 ]]; then
            echo -e "    ${YELLOW}↳ ${worker_records} record(s) pointing to Workers/Pages${NC}"
        fi
    done
}

# ── List Worker routes per zone ───────────────────────────────────────────
list_worker_routes() {
    echo -e "\n${BOLD}🛣️  Worker Routes${NC}"

    for i in "${!ZONE_IDS[@]}"; do
        local zone_id="${ZONE_IDS[$i]}"
        local zone_name="${ZONE_NAMES[$i]}"

        local response
        response=$(cf_get "/zones/${zone_id}/workers/routes")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        if [[ "$count" -gt 0 ]]; then
            echo -e "\n  ${CYAN}Zone: ${zone_name}${NC} — ${GREEN}${count} route(s)${NC}"
            echo "$response" | jq -r '.result[] |
                "    🛣️  \(.pattern) → \(.script // "none")"'
        fi
    done
}

# ── Secrets Store per account ─────────────────────────────────────────────
list_secrets_stores() {
    echo -e "\n${BOLD}🔐 Secrets Stores${NC}"

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC}"

        local response
        response=$(cf_get "/accounts/${acct_id}/secrets_store/stores")
        local count
        count=$(echo "$response" | jq '.result | length // 0' 2>/dev/null || echo "0")

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} store(s)${NC}"
            echo "$response" | jq -r '.result[] |
                "    🔐 \(.name // .id)"'
        else
            echo -e "  ${DIM}  No secrets stores found${NC}"
        fi
    done
}

# ── Audit Logs (last 24h) ────────────────────────────────────────────────
list_audit_logs() {
    echo -e "\n${BOLD}📋 Recent Audit Logs (last 24h)${NC}"

    local since
    since=$(date -u -v-24H +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || date -u -d "24 hours ago" +%Y-%m-%dT%H:%M:%SZ 2>/dev/null || echo "")

    for i in "${!ACCOUNT_IDS[@]}"; do
        local acct_id="${ACCOUNT_IDS[$i]}"
        local acct_name="${ACCOUNT_NAMES[$i]}"
        echo -e "\n  ${CYAN}Account: ${acct_name}${NC}"

        local endpoint="/accounts/${acct_id}/audit_logs?per_page=25"
        if [[ -n "$since" ]]; then
            endpoint="${endpoint}&since=${since}"
        fi

        local response
        response=$(cf_get "$endpoint")
        local count
        count=$(echo "$response" | jq '.result | length // 0')

        if [[ "$count" -gt 0 ]]; then
            echo -e "  ${GREEN}${count} event(s) in last 24h${NC}"
            echo "$response" | jq -r '.result[:10][] |
                "    \(.when // "?") | \(.action.type // "?") | \(.resource.type // "?")/\(.resource.id // "?" | .[0:12]) | actor=\(.actor.email // "?")"'
            if [[ "$count" -gt 10 ]]; then
                echo -e "    ${DIM}... and $((count - 10)) more${NC}"
            fi
        else
            echo -e "  ${DIM}  No audit events in last 24h${NC}"
        fi
    done
}

# ── Generate markdown report ─────────────────────────────────────────────
generate_markdown() {
    echo -e "\n${BOLD}📝 Generating markdown report...${NC}"

    cat > "$REPORT_MD" << 'MDEOF'
# Cloudflare Empire Inventory

Generated: TIMESTAMP
Token: Active ✓

---

MDEOF

    sed -i '' "s/TIMESTAMP/$(date -u +%Y-%m-%dT%H:%M:%SZ)/" "$REPORT_MD"

    # Accounts section
    echo "## Accounts" >> "$REPORT_MD"
    echo "" >> "$REPORT_MD"
    echo "| Account ID | Name | Type |" >> "$REPORT_MD"
    echo "|---|---|---|" >> "$REPORT_MD"
    jq -r '.[] | "| \(.id) | \(.name) | \(.type) |"' /tmp/cf_accounts.json >> "$REPORT_MD"
    echo "" >> "$REPORT_MD"

    # Zones section
    echo "## Zones" >> "$REPORT_MD"
    echo "" >> "$REPORT_MD"
    echo "| Domain | Status | Plan | Account |" >> "$REPORT_MD"
    echo "|---|---|---|---|" >> "$REPORT_MD"
    jq -r '.[] | "| \(.name) | \(.status) | \(.plan.name) | \(.account.name) |"' /tmp/cf_zones.json >> "$REPORT_MD"
    echo "" >> "$REPORT_MD"

    echo -e "${GREEN}  ✓ Report: ${REPORT_MD}${NC}"
}

# ── Generate JSON inventory ──────────────────────────────────────────────
generate_json() {
    echo -e "${BOLD}📊 Generating JSON inventory...${NC}"

    local accounts zones
    accounts=$(cat /tmp/cf_accounts.json 2>/dev/null || echo "[]")
    zones=$(cat /tmp/cf_zones.json 2>/dev/null || echo "[]")

    jq -n \
        --arg ts "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
        --argjson accounts "$accounts" \
        --argjson zones "$zones" \
        '{
            generated: $ts,
            empire: "NOIZYANTHROPIC",
            operator: "RSP_001",
            accounts: $accounts,
            zones: $zones
        }' > "$REPORT_FILE"

    echo -e "${GREEN}  ✓ JSON: ${REPORT_FILE}${NC}"
}

# ── Main ────────────────────────────────────────────────────────────────────
main() {
    echo ""
    echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║       CLOUDFLARE EMPIRE INVENTORY — NOIZYANTHROPIC      ║${NC}"
    echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
    echo -e "${DIM}  $(date -u +%Y-%m-%dT%H:%M:%SZ) | RSP_001${NC}"
    echo ""

    mkdir -p "$REPORT_DIR"

    # Check dependencies
    if ! command -v jq &>/dev/null; then
        echo -e "${RED}ERROR: jq is required. Install with: brew install jq${NC}"
        exit 1
    fi

    load_token
    verify_token

    # Clean temp files
    rm -f /tmp/cf_accounts.json /tmp/cf_zones.json /tmp/cf_workers.json

    # ── Full scan ──
    get_user
    list_accounts

    if [[ ${#ACCOUNT_IDS[@]} -eq 0 ]]; then
        echo -e "\n${RED}No accounts found. Token may need Account:Read permission.${NC}"
        exit 1
    fi

    list_zones
    list_workers
    list_d1
    list_kv
    list_r2
    list_queues
    list_pages
    list_durable_objects

    if [[ ${#ZONE_IDS[@]} -gt 0 ]]; then
        list_dns
        list_worker_routes
    fi

    list_secrets_stores
    list_audit_logs

    # ── Reports ──
    generate_json
    generate_markdown

    # ── Summary ──
    echo ""
    echo -e "${BOLD}╔══════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BOLD}║                    SCAN COMPLETE                        ║${NC}"
    echo -e "${BOLD}╚══════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "  ${GREEN}Accounts:${NC}  ${#ACCOUNT_IDS[@]}"
    echo -e "  ${GREEN}Zones:${NC}     ${#ZONE_IDS[@]}"
    echo -e "  ${GREEN}JSON:${NC}      ${REPORT_FILE}"
    echo -e "  ${GREEN}Markdown:${NC}  ${REPORT_MD}"
    echo ""
    echo -e "${YELLOW}  ⚠️  Close your privatekey file — it's still open in your editor!${NC}"
    echo ""

    # Cleanup
    rm -f /tmp/cf_accounts.json /tmp/cf_zones.json /tmp/cf_workers.json
}

main "$@"
