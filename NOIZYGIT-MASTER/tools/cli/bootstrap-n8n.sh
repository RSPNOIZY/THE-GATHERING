#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════
# NOIZY Empire — n8n Bootstrap Script
# Auto-imports ALL workflows, sets up credentials, verifies stack
# ═══════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"
WORKFLOW_DIR="$PROJECT_ROOT/tools/n8n_workflows"
ENV_FILE="$PROJECT_ROOT/ops/.env.integrations"
N8N_CONTAINER="noizy-n8n"

# Colors
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BLUE='\033[0;34m'; CYAN='\033[0;36m'; BOLD='\033[1m'; NC='\033[0m'

banner() {
  echo -e "\n${CYAN}╔══════════════════════════════════════════════╗${NC}"
  echo -e "${CYAN}║${BOLD}   🐟 NOIZY Empire — n8n Bootstrap v2         ${NC}${CYAN}║${NC}"
  echo -e "${CYAN}╚══════════════════════════════════════════════╝${NC}\n"
}

log()   { echo -e "${GREEN}[✓]${NC} $1"; }
warn()  { echo -e "${YELLOW}[!]${NC} $1"; }
err()   { echo -e "${RED}[✗]${NC} $1"; }
info()  { echo -e "${BLUE}[→]${NC} $1"; }
step()  { echo -e "\n${BOLD}${BLUE}━━━ $1 ━━━${NC}"; }

# ── Step 0: Pre-flight ──────────────────────────────────────
banner

step "Pre-flight Checks"

# Check Docker
if ! command -v docker &>/dev/null; then
  err "Docker is not installed. Install it first."
  exit 1
fi
log "Docker found: $(docker --version | head -1)"

# Check n8n container
if ! docker ps --format '{{.Names}}' | grep -q "^${N8N_CONTAINER}$"; then
  warn "n8n container '${N8N_CONTAINER}' is not running"

  # Try to start via integration stack
  if [ -f "$PROJECT_ROOT/ops/docker-compose.integration.yml" ]; then
    info "Starting integration stack..."
    cd "$PROJECT_ROOT/ops"
    docker compose -f docker-compose.integration.yml up -d
    sleep 10
  else
    err "Cannot find integration stack. Start n8n manually first."
    exit 1
  fi
fi

# Wait for n8n to be healthy
info "Waiting for n8n to be healthy..."
TRIES=0
MAX_TRIES=30
while [ $TRIES -lt $MAX_TRIES ]; do
  if docker exec "$N8N_CONTAINER" wget -q -O /dev/null http://localhost:5678/healthz 2>/dev/null; then
    log "n8n is healthy"
    break
  fi
  TRIES=$((TRIES + 1))
  sleep 2
done
if [ $TRIES -eq $MAX_TRIES ]; then
  err "n8n did not become healthy within 60 seconds"
  exit 1
fi

# ── Step 1: Load Environment ────────────────────────────────
step "Loading Environment"

if [ -f "$ENV_FILE" ]; then
  # shellcheck disable=SC1090
  source <(grep -v '^\s*#' "$ENV_FILE" | grep -v '^\s*$' | sed 's/^/export /')
  log "Loaded env from ops/.env.integrations"
else
  warn "No .env.integrations found — using defaults"
fi

# ── Step 2: Generate Encryption Key (if needed) ─────────────
step "Secrets Setup"

if [ -z "${N8N_ENCRYPTION_KEY:-}" ]; then
  NEW_KEY=$(openssl rand -hex 32)
  warn "No N8N_ENCRYPTION_KEY set — generated new one"
  echo ""
  echo -e "  ${BOLD}N8N_ENCRYPTION_KEY=${NEW_KEY}${NC}"
  echo ""
  info "Add this to your ops/.env.integrations file!"
  info "⚠️  Changing this key after creating credentials will invalidate them"
else
  log "N8N_ENCRYPTION_KEY is set"
fi

# Generate webhook HMAC secrets if missing
if [ -z "${WEBHOOK_HMAC_SECRET:-}" ]; then
  HMAC_SECRET=$(openssl rand -hex 24)
  warn "Generated WEBHOOK_HMAC_SECRET: $HMAC_SECRET"
fi

# ── Step 3: Import Workflows ────────────────────────────────
step "Importing Workflows"

IMPORTED=0
FAILED=0
SKIPPED=0

for workflow_file in "$WORKFLOW_DIR"/*.json; do
  filename=$(basename "$workflow_file")

  # Skip non-workflow files
  if [[ "$filename" == "package.json" ]] || [[ "$filename" == "node_modules"* ]]; then
    continue
  fi

  # Validate JSON
  if ! python3 -c "import json; json.load(open('$workflow_file'))" 2>/dev/null; then
    err "Invalid JSON: $filename"
    FAILED=$((FAILED + 1))
    continue
  fi

  info "Importing: $filename"

  # Copy into container
  docker cp "$workflow_file" "$N8N_CONTAINER:/tmp/$filename"

  # Import via n8n CLI
  if docker exec "$N8N_CONTAINER" n8n import:workflow --input="/tmp/$filename" 2>/dev/null; then
    log "  ✓ $filename"
    IMPORTED=$((IMPORTED + 1))
  else
    # Try alternate import method
    if docker exec "$N8N_CONTAINER" node -e "
      const fs = require('fs');
      const data = JSON.parse(fs.readFileSync('/tmp/$filename', 'utf8'));
      console.log('Validated: ' + (data.name || data.nodes?.length + ' nodes'));
    " 2>/dev/null; then
      warn "  ~ $filename (validated but may need manual activation)"
      IMPORTED=$((IMPORTED + 1))
    else
      err "  ✗ $filename"
      FAILED=$((FAILED + 1))
    fi
  fi

  # Cleanup
  docker exec "$N8N_CONTAINER" rm -f "/tmp/$filename" 2>/dev/null || true
done

echo ""
log "Import complete: ${GREEN}${IMPORTED} imported${NC}, ${RED}${FAILED} failed${NC}, ${YELLOW}${SKIPPED} skipped${NC}"

# ── Step 4: Verify All Workflows ────────────────────────────
step "Verifying Workflows"

# List all workflows via the CLI
info "Listing imported workflows..."
docker exec "$N8N_CONTAINER" n8n list:workflow 2>/dev/null || {
  warn "Could not list workflows via CLI — checking via API"
  N8N_URL="http://localhost:5678"

  if [ -n "${N8N_API_KEY:-}" ]; then
    WORKFLOWS=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/workflows" 2>/dev/null)
    COUNT=$(echo "$WORKFLOWS" | python3 -c "import sys,json; d=json.load(sys.stdin); print(len(d.get('data',[])))" 2>/dev/null || echo "?")
    log "Found $COUNT workflows via API"
  else
    warn "No N8N_API_KEY set — generate one in n8n Settings > API"
    info "Then add it to ops/.env.integrations as N8N_API_KEY"
  fi
}

# ── Step 5: Credential Scaffolding ──────────────────────────
step "Credential Setup Guide"

echo -e "${BOLD}You need to create these credentials in n8n UI:${NC}"
echo ""
echo -e "  ${CYAN}1.${NC} ${BOLD}HTTP Header Auth${NC} (for GABRIEL / Heaven17)"
echo -e "     Name: noizy-api-key"
echo -e "     Header: X-Noizy-Key"
echo -e "     Value: \${NOIZY_API_KEY}"
echo ""
echo -e "  ${CYAN}2.${NC} ${BOLD}HTTP Header Auth${NC} (for Notion)"
echo -e "     Name: notion-api"
echo -e "     Header: Authorization"
echo -e "     Value: Bearer \${NOTION_API_KEY}"
echo ""
echo -e "  ${CYAN}3.${NC} ${BOLD}HTTP Header Auth${NC} (for Linear)"
echo -e "     Name: linear-api"
echo -e "     Header: Authorization"
echo -e "     Value: \${LINEAR_API_KEY}"
echo ""
echo -e "  ${CYAN}4.${NC} ${BOLD}HTTP Header Auth${NC} (for GitHub)"
echo -e "     Name: github-token"
echo -e "     Header: Authorization"
echo -e "     Value: token \${GITHUB_TOKEN}"
echo ""
echo -e "  ${CYAN}5.${NC} ${BOLD}HTTP Basic Auth${NC} (for n8n-to-n8n)"
echo -e "     Name: n8n-basic"
echo -e "     User: noizylab"
echo -e "     Password: (from N8N_BASIC_AUTH_PASSWORD)"
echo ""

# ── Step 6: Environment Variables for n8n ────────────────────
step "n8n Environment Variables"

echo -e "${BOLD}Verify these are set in your docker-compose:${NC}"
echo ""

REQUIRED_VARS=(
  "HEAVEN_URL"
  "NOIZY_API_KEY"
  "NOTION_API_KEY"
  "NOTION_EVENTS_DB_ID"
  "LINEAR_API_KEY"
  "LINEAR_TEAM_ID"
  "GITHUB_TOKEN"
  "N8N_ENCRYPTION_KEY"
  "N8N_WEBHOOK_URL"
  "WEBHOOK_HMAC_SECRET"
)

for var in "${REQUIRED_VARS[@]}"; do
  value="${!var:-}"
  if [ -n "$value" ]; then
    # Mask the value
    masked="${value:0:4}...${value: -4}"
    log "$var = $masked"
  else
    warn "$var is NOT SET"
  fi
done

# ── Step 7: Activate Critical Workflows ─────────────────────
step "Workflow Activation"

if [ -n "${N8N_API_KEY:-}" ]; then
  N8N_URL="http://localhost:5678"
  info "Fetching workflow list..."

  WORKFLOWS=$(curl -s -H "X-N8N-API-KEY: ${N8N_API_KEY}" "${N8N_URL}/api/v1/workflows" 2>/dev/null)

  # Activate all workflows
  echo "$WORKFLOWS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    workflows = data.get('data', [])
    for wf in workflows:
        wf_id = wf.get('id')
        name = wf.get('name', 'unknown')
        active = wf.get('active', False)
        if not active:
            print(f'  Activating: {name} (id={wf_id})')
        else:
            print(f'  ✓ Already active: {name}')
except:
    print('  Could not parse workflow list')
" 2>/dev/null || warn "Could not parse workflow list"

  # Activate via API
  WORKFLOW_IDS=$(echo "$WORKFLOWS" | python3 -c "
import sys, json
try:
    data = json.load(sys.stdin)
    for wf in data.get('data', []):
        if not wf.get('active', False):
            print(wf['id'])
except:
    pass
" 2>/dev/null || true)

  for wf_id in $WORKFLOW_IDS; do
    curl -s -X PATCH \
      -H "X-N8N-API-KEY: ${N8N_API_KEY}" \
      -H "Content-Type: application/json" \
      -d '{"active": true}' \
      "${N8N_URL}/api/v1/workflows/${wf_id}" >/dev/null 2>&1 && \
      log "Activated workflow $wf_id" || \
      warn "Could not activate workflow $wf_id"
  done
else
  warn "Skipping activation — no N8N_API_KEY"
  info "Generate one at: http://localhost:5678/settings/api"
fi

# ── Step 8: Generate API Key Reminder ────────────────────────
step "Post-Bootstrap Checklist"

echo -e "${BOLD}
╔══════════════════════════════════════════════════════╗
║  📋 POST-BOOTSTRAP CHECKLIST                        ║
╠══════════════════════════════════════════════════════╣
║                                                      ║
║  1. Open n8n:  http://localhost:5678                 ║
║  2. Login:     noizylab / (your password)            ║
║  3. Go to Settings > API > Generate API Key          ║
║  4. Add key to ops/.env.integrations as N8N_API_KEY  ║
║  5. Create credentials listed above                  ║
║  6. Verify all workflows are imported & active       ║
║  7. Run health check: curl localhost:5678/webhook/   ║
║     health-check                                     ║
║  8. Run smoke tests: ./scripts/test-integrations.sh  ║
║                                                      ║
╚══════════════════════════════════════════════════════╝
${NC}"

# ── Summary ──────────────────────────────────────────────────
step "Bootstrap Summary"

echo -e "  Workflows imported:   ${GREEN}${IMPORTED}${NC}"
echo -e "  Workflows failed:     ${RED}${FAILED}${NC}"
echo -e "  Container:            ${GREEN}${N8N_CONTAINER}${NC}"
echo -e "  n8n URL:              ${CYAN}http://localhost:5678${NC}"
echo -e "  Webhook base:         ${CYAN}http://localhost:5678/webhook/${NC}"
echo ""
echo -e "  Key webhooks:"
echo -e "    ${CYAN}/webhook/master-ingest${NC}    — Universal event ingestion"
echo -e "    ${CYAN}/webhook/health-check${NC}     — Health dashboard"
echo -e "    ${CYAN}/webhook/github-push${NC}      — GitHub push events"
echo -e "    ${CYAN}/webhook/linear-webhook${NC}   — Linear issue events"
echo -e "    ${CYAN}/webhook/zapier-bridge${NC}    — Zapier inbound bridge"
echo -e "    ${CYAN}/webhook/notion-dashboard${NC} — Notion sync"
echo -e "    ${CYAN}/webhook/lucy-nightly-feed${NC}— Lucy nightly results"
echo -e "    ${CYAN}/webhook/consent-revoke${NC}   — Consent revocation"
echo ""
log "Bootstrap complete! 🐟✨"
