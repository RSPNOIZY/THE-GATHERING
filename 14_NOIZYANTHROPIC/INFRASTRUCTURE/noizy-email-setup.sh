#!/usr/bin/env bash
#═══════════════════════════════════════════════════════════════════════════════
#  NOIZY EMPIRE — Email Routing Setup Script
#  Configures Cloudflare Email Routing for all NOIZY domains
#  Author: Robert Stephen Plowman + Claude (co-architect)
#  Date: 2026-03-23
#  Version: 1.0
#
#  WHAT THIS DOES:
#  1. Enables Email Routing on each Cloudflare zone
#  2. Creates MX records pointing to Cloudflare Email Routing
#  3. Configures SPF, DKIM, DMARC records
#  4. Sets up email aliases (rsp@, hello@, support@, gabriel@, admin@, info@)
#  5. Enables catch-all forwarding to rsplowman@icloud.com
#
#  PREREQUISITES:
#  - Cloudflare API Token with Zone:Edit, DNS:Edit, Email Routing:Edit
#  - Domain must be active on Cloudflare (nameservers pointing to CF)
#  - jq installed (brew install jq)
#  - curl installed
#
#  USAGE:
#    export CF_API_TOKEN="your-token-here"
#    ./noizy-email-setup.sh                    # Run all domains
#    ./noizy-email-setup.sh --dry-run          # Preview changes only
#    ./noizy-email-setup.sh --domain noizy.ai  # Single domain only
#═══════════════════════════════════════════════════════════════════════════════

set -euo pipefail

# ═══════════════════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════════════════

CF_ACCOUNT_ID="2446d788cc4280f5ea22a9948410c355"
CF_API_BASE="https://api.cloudflare.com/client/v4"

# Forwarding destination for ALL email routes
FORWARD_TO="rsplowman@icloud.com"

# Domains on Cloudflare (ready for email routing)
CF_DOMAINS=("noizy.ai" "noizylab.ca")

# Domains that need transfer to Cloudflare first
GODADDY_DOMAINS=("noizyfish.com" "noizylab.com" "fishmusicinc.com")

# Domains that need registration
UNREGISTERED_DOMAINS=("noizyvox.com" "noizykids.com")

# Email aliases to create on EVERY domain
ALIASES=("rsp" "hello" "support" "gabriel" "admin" "info")

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
PURPLE='\033[0;35m'
BOLD='\033[1m'
NC='\033[0m'

DRY_RUN=false
SINGLE_DOMAIN=""

# ═══════════════════════════════════════════════════════════════════════════
# ARGUMENT PARSING
# ═══════════════════════════════════════════════════════════════════════════

while [[ $# -gt 0 ]]; do
    case $1 in
        --dry-run)
            DRY_RUN=true
            shift
            ;;
        --domain)
            SINGLE_DOMAIN="$2"
            shift 2
            ;;
        --help|-h)
            echo "Usage: $0 [--dry-run] [--domain DOMAIN]"
            echo ""
            echo "  --dry-run         Preview changes without making them"
            echo "  --domain DOMAIN   Configure only this domain"
            echo "  --help            Show this help"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            exit 1
            ;;
    esac
done

# ═══════════════════════════════════════════════════════════════════════════
# HELPER FUNCTIONS
# ═══════════════════════════════════════════════════════════════════════════

banner() {
    echo ""
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  NOIZY EMPIRE — Email Routing Setup${NC}"
    echo -e "${PURPLE}  $(date '+%Y-%m-%d %H:%M:%S')${NC}"
    if $DRY_RUN; then
        echo -e "${YELLOW}  ⚠  DRY RUN MODE — No changes will be made${NC}"
    fi
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
}

log_info()    { echo -e "${CYAN}[INFO]${NC}    $1"; }
log_success() { echo -e "${GREEN}[OK]${NC}      $1"; }
log_warn()    { echo -e "${YELLOW}[WARN]${NC}    $1"; }
log_error()   { echo -e "${RED}[ERROR]${NC}   $1"; }
log_action()  { echo -e "${BOLD}[ACTION]${NC}  $1"; }

cf_api() {
    local method="$1"
    local endpoint="$2"
    local data="${3:-}"

    local args=(-s -X "$method" \
        -H "Authorization: Bearer ${CF_API_TOKEN}" \
        -H "Content-Type: application/json" \
        "${CF_API_BASE}${endpoint}")

    if [[ -n "$data" ]]; then
        args+=(-d "$data")
    fi

    curl "${args[@]}"
}

get_zone_id() {
    local domain="$1"
    local response
    response=$(cf_api GET "/zones?name=${domain}&status=active")
    echo "$response" | jq -r '.result[0].id // empty'
}

# ═══════════════════════════════════════════════════════════════════════════
# PRE-FLIGHT CHECKS
# ═══════════════════════════════════════════════════════════════════════════

preflight() {
    banner

    log_info "Running pre-flight checks..."

    # Check CF_API_TOKEN
    if [[ -z "${CF_API_TOKEN:-}" ]]; then
        log_error "CF_API_TOKEN not set. Export it first:"
        echo "  export CF_API_TOKEN=\"your-cloudflare-api-token\""
        echo ""
        echo "  Create a token at: https://dash.cloudflare.com/profile/api-tokens"
        echo "  Required permissions: Zone:Edit, DNS:Edit, Email Routing:Edit"
        exit 1
    fi
    log_success "CF_API_TOKEN is set"

    # Check jq
    if ! command -v jq &>/dev/null; then
        log_error "jq not found. Install it: brew install jq"
        exit 1
    fi
    log_success "jq is installed"

    # Verify API token works
    local verify
    verify=$(cf_api GET "/user/tokens/verify")
    local status
    status=$(echo "$verify" | jq -r '.result.status // "error"')
    if [[ "$status" != "active" ]]; then
        log_error "API token verification failed: $status"
        echo "$verify" | jq .
        exit 1
    fi
    log_success "Cloudflare API token verified"

    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# DNS RECORD MANAGEMENT
# ═══════════════════════════════════════════════════════════════════════════

create_or_update_dns() {
    local zone_id="$1"
    local record_type="$2"
    local name="$3"
    local content="$4"
    local priority="${5:-}"

    # Check if record exists
    local existing
    existing=$(cf_api GET "/zones/${zone_id}/dns_records?type=${record_type}&name=${name}")
    local existing_id
    existing_id=$(echo "$existing" | jq -r '.result[0].id // empty')

    local data
    if [[ -n "$priority" ]]; then
        data=$(jq -n --arg type "$record_type" --arg name "$name" \
               --arg content "$content" --argjson priority "$priority" \
               '{type: $type, name: $name, content: $content, priority: $priority, ttl: 1}')
    else
        data=$(jq -n --arg type "$record_type" --arg name "$name" \
               --arg content "$content" \
               '{type: $type, name: $name, content: $content, ttl: 1}')
    fi

    if $DRY_RUN; then
        if [[ -n "$existing_id" ]]; then
            log_info "[DRY RUN] Would UPDATE ${record_type} record: ${name} → ${content}"
        else
            log_info "[DRY RUN] Would CREATE ${record_type} record: ${name} → ${content}"
        fi
        return 0
    fi

    local result
    if [[ -n "$existing_id" ]]; then
        result=$(cf_api PUT "/zones/${zone_id}/dns_records/${existing_id}" "$data")
        local success
        success=$(echo "$result" | jq -r '.success')
        if [[ "$success" == "true" ]]; then
            log_success "Updated ${record_type}: ${name} → ${content}"
        else
            log_error "Failed to update ${record_type}: ${name}"
            echo "$result" | jq '.errors'
        fi
    else
        result=$(cf_api POST "/zones/${zone_id}/dns_records" "$data")
        local success
        success=$(echo "$result" | jq -r '.success')
        if [[ "$success" == "true" ]]; then
            log_success "Created ${record_type}: ${name} → ${content}"
        else
            log_error "Failed to create ${record_type}: ${name}"
            echo "$result" | jq '.errors'
        fi
    fi
}

# ═══════════════════════════════════════════════════════════════════════════
# EMAIL ROUTING SETUP
# ═══════════════════════════════════════════════════════════════════════════

setup_email_routing() {
    local domain="$1"
    local zone_id="$2"

    echo ""
    echo -e "${BOLD}━━━ Setting up Email Routing for ${domain} ━━━${NC}"
    echo ""

    # Step 1: Enable Email Routing
    log_action "Enabling Email Routing..."
    if $DRY_RUN; then
        log_info "[DRY RUN] Would enable Email Routing on ${domain}"
    else
        local enable_result
        enable_result=$(cf_api POST "/zones/${zone_id}/email/routing/enable" '{}')
        local success
        success=$(echo "$enable_result" | jq -r '.success // false')
        if [[ "$success" == "true" ]]; then
            log_success "Email Routing enabled for ${domain}"
        else
            # May already be enabled
            log_warn "Email Routing may already be enabled (or check manually)"
        fi
    fi

    # Step 2: MX Records (Cloudflare Email Routing)
    log_action "Configuring MX records..."
    create_or_update_dns "$zone_id" "MX" "${domain}" "isaac.mx.cloudflare.net" 83
    create_or_update_dns "$zone_id" "MX" "${domain}" "linda.mx.cloudflare.net" 44
    create_or_update_dns "$zone_id" "MX" "${domain}" "amir.mx.cloudflare.net" 3

    # Step 3: SPF Record
    log_action "Configuring SPF record..."
    create_or_update_dns "$zone_id" "TXT" "${domain}" \
        "v=spf1 include:_spf.mx.cloudflare.net ~all"

    # Step 4: DMARC Record
    log_action "Configuring DMARC record..."
    create_or_update_dns "$zone_id" "TXT" "_dmarc.${domain}" \
        "v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@${domain}; pct=100; adkim=r; aspf=r"

    # Step 5: Create email address routes
    log_action "Creating email routes..."
    for alias in "${ALIASES[@]}"; do
        local email="${alias}@${domain}"
        if $DRY_RUN; then
            log_info "[DRY RUN] Would create route: ${email} → ${FORWARD_TO}"
        else
            local route_data
            route_data=$(jq -n \
                --arg name "$alias" \
                --arg email "$email" \
                --arg forward "$FORWARD_TO" \
                '{
                    enabled: true,
                    matchers: [{ type: "literal", field: "to", value: $email }],
                    actions: [{ type: "forward", value: [$forward] }],
                    name: ("NOIZY route: " + $email)
                }')
            local result
            result=$(cf_api POST "/zones/${zone_id}/email/routing/rules" "$route_data")
            local success
            success=$(echo "$result" | jq -r '.success // false')
            if [[ "$success" == "true" ]]; then
                log_success "Route created: ${email} → ${FORWARD_TO}"
            else
                local err_msg
                err_msg=$(echo "$result" | jq -r '.errors[0].message // "unknown"')
                if [[ "$err_msg" == *"already exists"* ]]; then
                    log_warn "Route already exists: ${email}"
                else
                    log_error "Failed to create route: ${email} — ${err_msg}"
                fi
            fi
        fi
    done

    # Step 6: Enable catch-all
    log_action "Enabling catch-all forwarding..."
    if $DRY_RUN; then
        log_info "[DRY RUN] Would enable catch-all → ${FORWARD_TO}"
    else
        local catchall_data
        catchall_data=$(jq -n --arg forward "$FORWARD_TO" \
            '{
                enabled: true,
                matchers: [{ type: "all" }],
                actions: [{ type: "forward", value: [$forward] }],
                name: "NOIZY catch-all"
            }')
        local result
        result=$(cf_api PUT "/zones/${zone_id}/email/routing/catch-all" "$catchall_data")
        local success
        success=$(echo "$result" | jq -r '.success // false')
        if [[ "$success" == "true" ]]; then
            log_success "Catch-all enabled: *@${domain} → ${FORWARD_TO}"
        else
            log_warn "Catch-all may need manual configuration in dashboard"
        fi
    fi

    echo ""
    log_success "Email routing setup complete for ${domain}"
}

# ═══════════════════════════════════════════════════════════════════════════
# DOMAIN STATUS REPORT
# ═══════════════════════════════════════════════════════════════════════════

domain_status_report() {
    echo ""
    echo -e "${BOLD}━━━ DOMAIN STATUS REPORT ━━━${NC}"
    echo ""

    echo -e "${GREEN}ON CLOUDFLARE (Ready for Email Routing):${NC}"
    for d in "${CF_DOMAINS[@]}"; do
        local zone_id
        zone_id=$(get_zone_id "$d")
        if [[ -n "$zone_id" ]]; then
            log_success "${d} — Zone ID: ${zone_id}"
        else
            log_error "${d} — NOT FOUND on Cloudflare"
        fi
    done

    echo ""
    echo -e "${YELLOW}ON GODADDY (Need Transfer to Cloudflare First):${NC}"
    for d in "${GODADDY_DOMAINS[@]}"; do
        log_warn "${d} — Transfer required before email routing"
    done

    echo ""
    echo -e "${RED}NOT REGISTERED (Need to Purchase):${NC}"
    for d in "${UNREGISTERED_DOMAINS[@]}"; do
        log_error "${d} — Not registered. Register via Cloudflare Registrar or GoDaddy."
    done

    echo ""
}

# ═══════════════════════════════════════════════════════════════════════════
# MAIN EXECUTION
# ═══════════════════════════════════════════════════════════════════════════

main() {
    preflight
    domain_status_report

    # Process Cloudflare domains
    for domain in "${CF_DOMAINS[@]}"; do
        if [[ -n "$SINGLE_DOMAIN" && "$domain" != "$SINGLE_DOMAIN" ]]; then
            continue
        fi

        local zone_id
        zone_id=$(get_zone_id "$domain")

        if [[ -z "$zone_id" ]]; then
            log_error "Zone not found for ${domain}. Skipping."
            continue
        fi

        setup_email_routing "$domain" "$zone_id"
    done

    # Reminder for GoDaddy domains
    echo ""
    echo -e "${BOLD}━━━ MANUAL STEPS REQUIRED ━━━${NC}"
    echo ""
    echo -e "${YELLOW}The following domains need manual action before email routing:${NC}"
    echo ""

    echo "  GODADDY TRANSFERS (do these first):"
    echo "  ──────────────────────────────────────────────"
    for d in "${GODADDY_DOMAINS[@]}"; do
        echo "  → ${d}"
        echo "    1. Log into GoDaddy, go to Domain Settings"
        echo "    2. Turn OFF Domain Lock"
        echo "    3. Get the Authorization/EPP Code"
        echo "    4. Go to Cloudflare → Registrar → Transfer"
        echo "    5. Enter the EPP code and confirm transfer"
        echo "    6. Wait for transfer (up to 5 days)"
        echo "    7. Re-run this script for ${d}"
        echo ""
    done

    echo "  DOMAIN REGISTRATION (purchase these):"
    echo "  ──────────────────────────────────────────────"
    for d in "${UNREGISTERED_DOMAINS[@]}"; do
        echo "  → ${d}"
        echo "    Register at: https://dash.cloudflare.com/${CF_ACCOUNT_ID}/domains/register"
        echo "    Or: https://www.cloudflare.com/products/registrar/"
        echo ""
    done

    echo ""
    echo -e "${BOLD}━━━ GMAIL SEND-AS SETUP (after routes are working) ━━━${NC}"
    echo ""
    echo "  To SEND email as rsp@noizy.ai from Gmail/iCloud:"
    echo "  ──────────────────────────────────────────────"
    echo "  Option A — Cloudflare Email Workers (recommended):"
    echo "    1. Create an Email Worker on Cloudflare"
    echo "    2. Use the worker to send via Cloudflare's SMTP"
    echo "    3. Configure Gmail Send-As with SMTP relay"
    echo ""
    echo "  Option B — Third-party SMTP (simpler):"
    echo "    1. Sign up for a transactional email service"
    echo "       (Mailgun, SendGrid, Amazon SES, Resend.com)"
    echo "    2. Verify your domain with the service"
    echo "    3. Gmail → Settings → Accounts → Add another email"
    echo "    4. Enter: rsp@noizy.ai"
    echo "    5. SMTP server: from your email service"
    echo "    6. Port 587, TLS, your service credentials"
    echo ""

    # Summary
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo -e "${PURPLE}  SETUP SUMMARY${NC}"
    echo -e "${PURPLE}═══════════════════════════════════════════════════════════════${NC}"
    echo ""
    echo "  Domains configured:    ${#CF_DOMAINS[@]} (on Cloudflare)"
    echo "  Domains pending:       ${#GODADDY_DOMAINS[@]} (need transfer)"
    echo "  Domains unregistered:  ${#UNREGISTERED_DOMAINS[@]} (need purchase)"
    echo "  Aliases per domain:    ${#ALIASES[@]} (${ALIASES[*]})"
    echo "  Catch-all:             Enabled → ${FORWARD_TO}"
    echo "  Forward destination:   ${FORWARD_TO}"
    echo ""
    echo "  DNS Records per domain:"
    echo "    3x MX  (Cloudflare Email Routing)"
    echo "    1x SPF (authorize Cloudflare to send)"
    echo "    1x DMARC (quarantine policy, reporting)"
    echo "    1x DKIM (auto-generated by Cloudflare)"
    echo ""
    if $DRY_RUN; then
        echo -e "  ${YELLOW}DRY RUN — No changes were made. Remove --dry-run to apply.${NC}"
    else
        echo -e "  ${GREEN}Changes applied. Verify at:${NC}"
        echo "  https://dash.cloudflare.com/${CF_ACCOUNT_ID}"
    fi
    echo ""
}

main "$@"
