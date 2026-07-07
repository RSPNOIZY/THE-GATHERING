#!/usr/bin/env bash
# ═══════════════════════════════════════════════════════════════
# NOIZY EMPIRE — Integration Stack Setup
# Sets up Docker + n8n + PostgreSQL + Linear + Notion + Zapier
# ═══════════════════════════════════════════════════════════════
# Usage:  ./scripts/setup-integrations.sh
# ═══════════════════════════════════════════════════════════════
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
OPS_DIR="$PROJECT_ROOT/ops"
WORKFLOWS_DIR="$PROJECT_ROOT/tools/n8n_workflows"
ENV_FILE="$OPS_DIR/.env.integrations"
COMPOSE_FILE="$OPS_DIR/docker-compose.integration.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m'

banner() {
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${CYAN}  NOIZY EMPIRE — Integration Stack Setup${NC}"
  echo -e "${CYAN}  Docker + n8n + PostgreSQL + Linear + Notion + Zapier${NC}"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

check_prereqs() {
  echo -e "${BLUE}[1/7] Checking prerequisites...${NC}"
  local missing=0

  if ! command -v docker &>/dev/null; then
    echo -e "  ${RED}✗ Docker not found${NC}"
    missing=1
  else
    echo -e "  ${GREEN}✓ Docker $(docker --version | awk '{print $3}' | tr -d ',')${NC}"
  fi

  if ! docker compose version &>/dev/null 2>&1; then
    echo -e "  ${RED}✗ Docker Compose not found${NC}"
    missing=1
  else
    echo -e "  ${GREEN}✓ Docker Compose $(docker compose version --short 2>/dev/null)${NC}"
  fi

  if ! command -v curl &>/dev/null; then
    echo -e "  ${RED}✗ curl not found${NC}"
    missing=1
  else
    echo -e "  ${GREEN}✓ curl available${NC}"
  fi

  if ! command -v jq &>/dev/null; then
    echo -e "  ${YELLOW}⚠ jq not found (optional, installing...)${NC}"
    brew install jq 2>/dev/null || echo -e "  ${YELLOW}  Could not install jq, some features won't work${NC}"
  else
    echo -e "  ${GREEN}✓ jq available${NC}"
  fi

  if [[ $missing -eq 1 ]]; then
    echo -e "\n${RED}Missing prerequisites. Install them and re-run.${NC}"
    exit 1
  fi
  echo ""
}

check_env() {
  echo -e "${BLUE}[2/7] Checking environment configuration...${NC}"

  if [[ ! -f "$ENV_FILE" ]]; then
    echo -e "  ${RED}✗ $ENV_FILE not found${NC}"
    echo -e "  ${YELLOW}  Copy ops/.env.integrations and fill in your API keys${NC}"
    exit 1
  fi

  # Source the env file
  set -a
  source "$ENV_FILE"
  set +a

  local warnings=0

  # Required
  if [[ -z "${POSTGRES_PASSWORD:-}" || "$POSTGRES_PASSWORD" == *"change-me"* ]]; then
    echo -e "  ${YELLOW}⚠ POSTGRES_PASSWORD not set or still default — change it!${NC}"
    warnings=$((warnings + 1))
  else
    echo -e "  ${GREEN}✓ PostgreSQL credentials configured${NC}"
  fi

  # n8n encryption key
  if [[ -z "${N8N_ENCRYPTION_KEY:-}" || "$N8N_ENCRYPTION_KEY" == *"change-me"* ]]; then
    echo -e "  ${YELLOW}⚠ N8N_ENCRYPTION_KEY not set — generating one...${NC}"
    NEW_KEY=$(openssl rand -hex 32)
    sed -i '' "s|N8N_ENCRYPTION_KEY=.*|N8N_ENCRYPTION_KEY=$NEW_KEY|" "$ENV_FILE"
    export N8N_ENCRYPTION_KEY="$NEW_KEY"
    echo -e "  ${GREEN}✓ Generated and saved N8N_ENCRYPTION_KEY${NC}"
  else
    echo -e "  ${GREEN}✓ N8N_ENCRYPTION_KEY configured${NC}"
  fi

  # Integration keys — warn but don't block
  for key_name in NOTION_API_KEY LINEAR_API_KEY GITHUB_TOKEN; do
    local val="${!key_name:-}"
    if [[ -z "$val" || "$val" == *"your_"* || "$val" == *"ntn_your"* || "$val" == *"lin_api_your"* || "$val" == *"ghp_your"* ]]; then
      echo -e "  ${YELLOW}⚠ $key_name not configured (integration will be limited)${NC}"
      warnings=$((warnings + 1))
    else
      echo -e "  ${GREEN}✓ $key_name configured${NC}"
    fi
  done

  for key_name in ZAPIER_CATCH_HOOK_URL NOTION_EVENTS_DB_ID NOTION_PROJECTS_DB_ID LINEAR_TEAM_ID; do
    local val="${!key_name:-}"
    if [[ -z "$val" || "$val" == *"your_"* ]]; then
      echo -e "  ${YELLOW}⚠ $key_name not set (optional)${NC}"
      warnings=$((warnings + 1))
    else
      echo -e "  ${GREEN}✓ $key_name configured${NC}"
    fi
  done

  if [[ $warnings -gt 0 ]]; then
    echo -e "\n  ${YELLOW}$warnings warnings — stack will start but some integrations won't work${NC}"
    echo -e "  ${YELLOW}Edit $ENV_FILE to add missing keys${NC}"
  fi
  echo ""
}

migrate_sqlite() {
  echo -e "${BLUE}[3/7] Checking for SQLite data to preserve...${NC}"

  # Check if old n8n container exists with SQLite
  if docker exec noizy-n8n ls /home/node/.n8n/database.sqlite &>/dev/null 2>&1; then
    echo -e "  ${YELLOW}⚠ Found existing SQLite database in running container${NC}"
    echo -e "  ${YELLOW}  Your existing workflows and credentials will be preserved${NC}"
    echo -e "  ${YELLOW}  n8n auto-migrates SQLite → PostgreSQL on first boot with DB_TYPE=postgresdb${NC}"
    echo ""
    echo -e "  ${CYAN}Backing up SQLite data just in case...${NC}"

    BACKUP_DIR="$OPS_DIR/backups/$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"

    docker cp noizy-n8n:/home/node/.n8n/database.sqlite "$BACKUP_DIR/database.sqlite" 2>/dev/null || true
    docker cp noizy-n8n:/home/node/.n8n/config "$BACKUP_DIR/config" 2>/dev/null || true

    echo -e "  ${GREEN}✓ Backup saved to $BACKUP_DIR${NC}"

    echo -e "\n  ${YELLOW}Stopping old container...${NC}"
    docker compose -f "$OPS_DIR/docker-compose.yml" down 2>/dev/null || \
      docker stop noizy-n8n 2>/dev/null || true
    echo -e "  ${GREEN}✓ Old container stopped${NC}"
  else
    echo -e "  ${GREEN}✓ No existing SQLite data found (fresh install)${NC}"
  fi
  echo ""
}

start_stack() {
  echo -e "${BLUE}[4/7] Starting integration stack...${NC}"

  # Use the integration compose file with the env file
  cd "$OPS_DIR"

  echo -e "  ${CYAN}Pulling latest images...${NC}"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" pull --quiet 2>/dev/null || true

  echo -e "  ${CYAN}Starting services...${NC}"
  docker compose -f "$COMPOSE_FILE" --env-file "$ENV_FILE" up -d

  echo -e "  ${CYAN}Waiting for services to be healthy...${NC}"
  local retries=30
  while [[ $retries -gt 0 ]]; do
    local pg_ok=false n8n_ok=false redis_ok=false

    docker exec noizy-postgres pg_isready -U "${POSTGRES_USER:-noizy}" &>/dev/null && pg_ok=true
    curl -sf http://localhost:5678/healthz &>/dev/null && n8n_ok=true
    docker exec noizy-redis redis-cli ping &>/dev/null && redis_ok=true

    if $pg_ok && $n8n_ok && $redis_ok; then
      break
    fi

    retries=$((retries - 1))
    sleep 2
    echo -n "."
  done
  echo ""

  if [[ $retries -eq 0 ]]; then
    echo -e "  ${YELLOW}⚠ Some services may not be fully ready yet${NC}"
    docker compose -f "$COMPOSE_FILE" ps
  else
    echo -e "  ${GREEN}✓ All services healthy!${NC}"
  fi
  echo ""
}

test_connectivity() {
  echo -e "${BLUE}[5/7] Testing connectivity...${NC}"

  # n8n
  if curl -sf http://localhost:5678/healthz &>/dev/null; then
    echo -e "  ${GREEN}✓ n8n is running at http://localhost:5678${NC}"
  else
    echo -e "  ${RED}✗ n8n not responding${NC}"
  fi

  # PostgreSQL
  if docker exec noizy-postgres pg_isready -U "${POSTGRES_USER:-noizy}" &>/dev/null; then
    echo -e "  ${GREEN}✓ PostgreSQL is running${NC}"
  else
    echo -e "  ${RED}✗ PostgreSQL not responding${NC}"
  fi

  # Redis
  if docker exec noizy-redis redis-cli ping &>/dev/null 2>&1; then
    echo -e "  ${GREEN}✓ Redis is running${NC}"
  else
    echo -e "  ${RED}✗ Redis not responding${NC}"
  fi

  # STT
  if curl -sf http://localhost:8000/ &>/dev/null; then
    echo -e "  ${GREEN}✓ STT (Faster-Whisper) is running at http://localhost:8000${NC}"
  else
    echo -e "  ${YELLOW}⚠ STT not responding (may still be loading model)${NC}"
  fi

  # Test integration APIs (if keys configured)
  set -a; source "$ENV_FILE" 2>/dev/null; set +a

  if [[ -n "${NOTION_API_KEY:-}" && "${NOTION_API_KEY}" != *"your_"* ]]; then
    local notion_resp
    notion_resp=$(curl -sf -w "%{http_code}" -o /dev/null \
      -H "Authorization: Bearer $NOTION_API_KEY" \
      -H "Notion-Version: 2022-06-28" \
      https://api.notion.com/v1/users/me 2>/dev/null) || notion_resp="000"
    if [[ "$notion_resp" == "200" ]]; then
      echo -e "  ${GREEN}✓ Notion API key is valid${NC}"
    else
      echo -e "  ${YELLOW}⚠ Notion API returned HTTP $notion_resp${NC}"
    fi
  fi

  if [[ -n "${LINEAR_API_KEY:-}" && "${LINEAR_API_KEY}" != *"your_"* ]]; then
    local linear_resp
    linear_resp=$(curl -sf -w "%{http_code}" -o /dev/null \
      -H "Authorization: $LINEAR_API_KEY" \
      -H "Content-Type: application/json" \
      -d '{"query":"{ viewer { id name } }"}' \
      https://api.linear.app/graphql 2>/dev/null) || linear_resp="000"
    if [[ "$linear_resp" == "200" ]]; then
      echo -e "  ${GREEN}✓ Linear API key is valid${NC}"
    else
      echo -e "  ${YELLOW}⚠ Linear API returned HTTP $linear_resp${NC}"
    fi
  fi

  if [[ -n "${GITHUB_TOKEN:-}" && "${GITHUB_TOKEN}" != *"your_"* ]]; then
    local gh_resp
    gh_resp=$(curl -sf -w "%{http_code}" -o /dev/null \
      -H "Authorization: Bearer $GITHUB_TOKEN" \
      https://api.github.com/user 2>/dev/null) || gh_resp="000"
    if [[ "$gh_resp" == "200" ]]; then
      echo -e "  ${GREEN}✓ GitHub token is valid${NC}"
    else
      echo -e "  ${YELLOW}⚠ GitHub API returned HTTP $gh_resp${NC}"
    fi
  fi
  echo ""
}

list_workflows() {
  echo -e "${BLUE}[6/7] Available n8n Workflows...${NC}"
  echo ""

  local count=0
  for f in "$WORKFLOWS_DIR"/*.json; do
    [[ -f "$f" ]] || continue
    local name
    name=$(python3 -c "import json; print(json.load(open('$f')).get('name','?'))" 2>/dev/null || echo "?")
    local basename
    basename=$(basename "$f")
    count=$((count + 1))
    echo -e "  ${GREEN}$count.${NC} $name"
    echo -e "     ${CYAN}→ $basename${NC}"
  done

  echo ""
  echo -e "  ${YELLOW}To import workflows into n8n:${NC}"
  echo -e "  ${YELLOW}  1. Open http://localhost:5678${NC}"
  echo -e "  ${YELLOW}  2. Go to Workflows → Import from File${NC}"
  echo -e "  ${YELLOW}  3. Select files from tools/n8n_workflows/${NC}"
  echo ""
  echo -e "  ${YELLOW}Or use the n8n CLI inside the container:${NC}"
  echo -e "  ${CYAN}  docker exec noizy-n8n n8n import:workflow --input=/home/node/workflows/09_linear_sync.json${NC}"
  echo ""
}

print_summary() {
  echo -e "${BLUE}[7/7] Integration Stack Summary${NC}"
  echo ""
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo -e "${GREEN}  SERVICES RUNNING:${NC}"
  echo -e "  • n8n Automation     → http://localhost:5678"
  echo -e "    Login: ${N8N_USER:-noizylab} / ${N8N_PASS:-noizy-local-2026}"
  echo -e "  • PostgreSQL         → localhost:5432 (internal)"
  echo -e "  • Redis Cache        → localhost:6379 (internal)"
  echo -e "  • STT Whisper        → http://localhost:8000"
  echo ""
  echo -e "${GREEN}  WEBHOOK ENDPOINTS (once imported):${NC}"
  echo -e "  • Linear     → POST http://localhost:5678/webhook/linear-webhook"
  echo -e "  • Zapier     → POST http://localhost:5678/webhook/zapier-bridge"
  echo -e "  • Notion     → POST http://localhost:5678/webhook/notion-dashboard"
  echo -e "  • GitHub     → POST http://localhost:5678/webhook/github-push"
  echo -e "  • Stripe     → POST http://localhost:5678/webhook/stripe-payment"
  echo -e "  • Voice      → POST http://localhost:5678/webhook/voice-command"
  echo ""
  echo -e "${GREEN}  NEW INTEGRATION WORKFLOWS:${NC}"
  echo -e "  • ZAP 9:  Linear ↔ NOIZY Sync (bidirectional)"
  echo -e "  • ZAP 10: Zapier Bridge (external hooks → NOIZY)"
  echo -e "  • ZAP 11: Notion Project Dashboard (bidirectional + deploy)"
  echo ""
  echo -e "${YELLOW}  NEXT STEPS:${NC}"
  echo -e "  1. Fill in API keys in ops/.env.integrations"
  echo -e "  2. Import workflows: open n8n → Import from File"
  echo -e "  3. Set up webhook tunnel for external access:"
  echo -e "     ${CYAN}brew install cloudflare/cloudflare/cloudflared${NC}"
  echo -e "     ${CYAN}cloudflared tunnel --url http://localhost:5678${NC}"
  echo -e "  4. Configure Linear webhook: Settings → API → Webhooks"
  echo -e "     URL: <tunnel-url>/webhook/linear-webhook"
  echo -e "  5. Configure Zapier: Create Zap → Webhooks by Zapier → POST"
  echo -e "     URL: <tunnel-url>/webhook/zapier-bridge"
  echo -e "  6. Fix noizylab.ca MX records (separate account needed)"
  echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
  echo ""
}

# ── Main ─────────────────────────────────────────────────────
banner
check_prereqs
check_env
migrate_sqlite
start_stack
test_connectivity
list_workflows
print_summary
