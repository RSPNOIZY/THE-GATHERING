#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# NOIZY Empire — Secrets Hardening Script
# Generates, validates, and rotates all system secrets
# ═══════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
ENV_FILE="$PROJECT_ROOT/ops/.env.integrations"
SECRETS_LOG="$PROJECT_ROOT/ops/.secrets-audit.log"

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

banner() {
  echo -e "\n${CYAN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${BOLD}   🔐 NOIZY Empire — Secrets Hardening        ${NC}${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}\n"
}

log()  { echo -e "${GREEN}[✓]${NC} $1"; }
warn() { echo -e "${YELLOW}[!]${NC} $1"; }
err()  { echo -e "${RED}[✗]${NC} $1"; }
info() { echo -e "${BLUE}[→]${NC} $1"; }
step() { echo -e "\n${BOLD}${BLUE}━━━ $1 ━━━${NC}"; }

generate_secret() {
  local length=${1:-32}
  openssl rand -hex "$length"
}

generate_base64_secret() {
  local length=${1:-32}
  openssl rand -base64 "$length" | tr -d '\n'
}

banner

# ── Step 1: Verify .gitignore ───────────────────────────────
step "Verifying .gitignore Protection"

GITIGNORE="$PROJECT_ROOT/.gitignore"
SENSITIVE_PATTERNS=(
  ".env"
  ".env.*"
  "ops/.env.integrations"
  ".secrets-audit.log"
  "*.pem"
  "*.key"
  "*.p12"
)

if [ -f "$GITIGNORE" ]; then
  for pattern in "${SENSITIVE_PATTERNS[@]}"; do
    if grep -qF "$pattern" "$GITIGNORE" 2>/dev/null; then
      log ".gitignore covers: $pattern"
    else
      warn ".gitignore MISSING: $pattern"
      echo "$pattern" >> "$GITIGNORE"
      log "Added $pattern to .gitignore"
    fi
  done
else
  warn "No .gitignore found — creating one"
  printf '%s\n' "${SENSITIVE_PATTERNS[@]}" > "$GITIGNORE"
  # Add common patterns
  cat >> "$GITIGNORE" << 'EOF'
node_modules/
dist/
.wrangler/
*.log
.DS_Store
EOF
  log "Created .gitignore with sensitive patterns"
fi

# ── Step 2: Audit Existing Secrets ──────────────────────────
step "Auditing Current Secrets"

echo "# Secrets Audit — $(date -u '+%Y-%m-%dT%H:%M:%SZ')" > "$SECRETS_LOG"

# Check if env file exists
if [ -f "$ENV_FILE" ]; then
  info "Checking ops/.env.integrations..."

  # Count set vs unset
  TOTAL=0
  SET=0
  UNSET=0
  WEAK=0

  while IFS= read -r line; do
    # Skip comments and empty lines
    [[ "$line" =~ ^[[:space:]]*# ]] && continue
    [[ -z "${line// }" ]] && continue
    [[ ! "$line" =~ = ]] && continue

    key=$(echo "$line" | cut -d= -f1 | xargs)
    value=$(echo "$line" | cut -d= -f2- | xargs)
    TOTAL=$((TOTAL + 1))

    if [ -z "$value" ] || [[ "$value" == *"your_"* ]] || [[ "$value" == *"REPLACE"* ]] || [[ "$value" == *"changeme"* ]]; then
      UNSET=$((UNSET + 1))
      echo "UNSET: $key" >> "$SECRETS_LOG"
    else
      SET=$((SET + 1))

      # Check weakness
      if [ ${#value} -lt 16 ]; then
        WEAK=$((WEAK + 1))
        echo "WEAK (short): $key (${#value} chars)" >> "$SECRETS_LOG"
      elif [[ "$value" == "password" ]] || [[ "$value" == "secret" ]] || [[ "$value" == "admin" ]]; then
        WEAK=$((WEAK + 1))
        echo "WEAK (common): $key" >> "$SECRETS_LOG"
      else
        echo "OK: $key (${#value} chars)" >> "$SECRETS_LOG"
      fi
    fi
  done < "$ENV_FILE"

  log "Total variables: $TOTAL"
  log "Set: ${GREEN}$SET${NC}"
  [ $UNSET -gt 0 ] && warn "Unset: ${YELLOW}$UNSET${NC}" || log "Unset: 0"
  [ $WEAK -gt 0 ] && warn "Weak: ${RED}$WEAK${NC}" || log "Weak: 0"
else
  warn "No .env.integrations found"
fi

# ── Step 3: Generate Missing Secrets ────────────────────────
step "Generating Secrets"

echo ""
echo -e "${BOLD}Copy these into your ops/.env.integrations:${NC}"
echo -e "${YELLOW}(Only use values you haven't already set)${NC}"
echo ""

# n8n Encryption Key (64 hex chars = 32 bytes)
echo -e "${CYAN}# n8n encryption key — CRITICAL: do not change after creating credentials${NC}"
echo -e "N8N_ENCRYPTION_KEY=$(generate_secret 32)"
echo ""

# PostgreSQL password
echo -e "${CYAN}# PostgreSQL password${NC}"
echo -e "POSTGRES_PASSWORD=$(generate_secret 20)"
echo ""

# n8n Basic Auth password
echo -e "${CYAN}# n8n basic auth password${NC}"
echo -e "N8N_BASIC_AUTH_PASSWORD=$(generate_base64_secret 24)"
echo ""

# Webhook HMAC secrets
echo -e "${CYAN}# HMAC secrets for webhook verification${NC}"
echo -e "WEBHOOK_HMAC_SECRET=$(generate_secret 24)"
echo -e "LINEAR_WEBHOOK_SECRET=$(generate_secret 24)"
echo -e "GITHUB_WEBHOOK_SECRET=$(generate_secret 24)"
echo -e "STRIPE_WEBHOOK_SECRET=whsec_$(generate_secret 24)"
echo ""

# JWT secret for inter-service auth
echo -e "${CYAN}# JWT secret for service-to-service auth${NC}"
echo -e "JWT_SECRET=$(generate_secret 32)"
echo ""

# Noizy API key
echo -e "${CYAN}# NOIZY internal API key (for Heaven17 / GABRIEL)${NC}"
echo -e "NOIZY_API_KEY=$(generate_base64_secret 32)"
echo ""

# Proxy drain key
echo -e "${CYAN}# Webhook proxy drain authentication${NC}"
echo -e "PROXY_DRAIN_KEY=$(generate_secret 24)"
echo ""

# ── Step 4: Scan for Exposed Secrets ────────────────────────
step "Scanning for Exposed Secrets"

info "Checking for hardcoded secrets in source code..."

# Patterns that might indicate leaked secrets
SECRET_PATTERNS=(
  "ANTHROPIC_API_KEY.*sk-"
  "NOIZY_SECRET.*="
  "Bearer [A-Za-z0-9_-]{20,}"
  "password.*=.*['\"][^'\"]{8,}"
  "api[_-]?key.*=.*['\"][^'\"]{16,}"
  "secret.*=.*['\"][^'\"]{16,}"
)

FOUND_ISSUES=0
for pattern in "${SECRET_PATTERNS[@]}"; do
  # Search in source files, skip binaries and known safe locations
  MATCHES=$(grep -rnI "$pattern" \
    --include="*.ts" --include="*.js" --include="*.sh" \
    --include="*.yml" --include="*.yaml" --include="*.json" \
    --include="*.toml" --include="*.md" \
    --exclude-dir=node_modules --exclude-dir=.git --exclude-dir=dist \
    --exclude="*.lock" --exclude="package-lock.json" \
    "$PROJECT_ROOT" 2>/dev/null | \
    grep -v "\.env\." | \
    grep -v "example" | \
    grep -v "template" | \
    grep -v "placeholder" | \
    grep -v "process\.env" | \
    grep -v "\$env\." | \
    grep -v "REPLACE" | \
    grep -v "your_" || true)

  if [ -n "$MATCHES" ]; then
    warn "Potential secret exposure for pattern: $pattern"
    echo "$MATCHES" | head -5 | while read -r line; do
      echo "    $line"
    done
    FOUND_ISSUES=$((FOUND_ISSUES + 1))
    echo "EXPOSURE: $pattern" >> "$SECRETS_LOG"
  fi
done

if [ $FOUND_ISSUES -eq 0 ]; then
  log "No obvious secret exposures found in source code"
else
  warn "$FOUND_ISSUES potential exposures found — review above"
fi

# ── Step 5: Verify Docker Secrets ───────────────────────────
step "Docker Secrets Check"

if docker ps --format '{{.Names}}' | grep -q "noizy-n8n"; then
  info "Checking n8n container environment..."

  # Check if critical env vars are set in the container
  CRITICAL_VARS=("N8N_ENCRYPTION_KEY" "DB_POSTGRESDB_PASSWORD" "N8N_BASIC_AUTH_PASSWORD")
  for var in "${CRITICAL_VARS[@]}"; do
    if docker exec noizy-n8n printenv "$var" >/dev/null 2>&1; then
      log "$var is set in container"
    else
      warn "$var is NOT set in container"
    fi
  done
else
  warn "n8n container not running — skipping Docker secrets check"
fi

# ── Step 6: Cloudflare Worker Secrets ───────────────────────
step "Cloudflare Worker Secrets"

if command -v wrangler &>/dev/null || command -v npx &>/dev/null; then
  info "Worker secrets should be set via:"
  echo ""
  echo -e "  ${CYAN}# Heaven17 worker${NC}"
  echo -e "  cd $PROJECT_ROOT/workers/heaven17"
  echo -e "  npx wrangler secret put ANTHROPIC_API_KEY"
  echo -e "  npx wrangler secret put NOIZY_SECRET"
  echo -e "  npx wrangler secret put NOIZY_KEY"
  echo ""
  echo -e "  ${CYAN}# Webhook Proxy worker${NC}"
  echo -e "  cd $PROJECT_ROOT/workers/webhook-proxy"
  echo -e "  npx wrangler secret put WEBHOOK_SECRET"
  echo -e "  npx wrangler secret put DRAIN_AUTH_KEY"
  echo ""
  echo -e "  ${CYAN}# Consent Gateway worker${NC}"
  echo -e "  cd $PROJECT_ROOT/workers/consent-gateway"
  echo -e "  npx wrangler secret put ADMIN_KEY"
  echo ""
else
  warn "wrangler not found — install with: npm i -g wrangler"
fi

# ── Step 7: GitHub Actions Secrets ──────────────────────────
step "GitHub Actions Secrets Checklist"

echo -e "${BOLD}These secrets should be set in GitHub repo Settings > Secrets:${NC}"
echo ""

GH_SECRETS=(
  "CF_API_TOKEN          — Cloudflare API token for deploys"
  "CF_ACCOUNT_ID         — Cloudflare account ID"
  "N8N_WEBHOOK_URL       — n8n webhook base URL (e.g., via tunnel)"
  "HEAVEN17_WORKER_URL   — Heaven17 worker URL"
  "NOIZY_API_KEY         — Internal API key"
  "LINEAR_API_KEY        — Linear API key"
  "NOTION_API_KEY        — Notion integration token"
)

for secret in "${GH_SECRETS[@]}"; do
  echo -e "  ${CYAN}•${NC} $secret"
done
echo ""

# ── Summary ──────────────────────────────────────────────────
step "Hardening Summary"

echo -e "
${BOLD}Security Status:${NC}
  .gitignore:     $([ -f "$GITIGNORE" ] && echo -e "${GREEN}Protected${NC}" || echo -e "${RED}MISSING${NC}")
  Secrets audit:  Saved to ops/.secrets-audit.log
  Source scan:    ${FOUND_ISSUES:-0} potential issues
  Env template:  $([ -f "$ENV_FILE" ] && echo -e "${GREEN}Found${NC}" || echo -e "${YELLOW}Missing${NC}")

${BOLD}Next Steps:${NC}
  1. Copy generated secrets above into ops/.env.integrations
  2. Set CF worker secrets via wrangler
  3. Set GitHub Actions secrets in repo settings
  4. Run bootstrap: ./scripts/bootstrap-n8n.sh
  5. Verify with smoke tests: ./scripts/test-integrations.sh
"

log "Secrets hardening complete 🔐"
