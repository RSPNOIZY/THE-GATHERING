#!/bin/bash
# ============================================================
# Heaven + Lucy — Bootstrap Script
# NOIZYLAB DreamChamber | M2 Ultra
# ============================================================

set -euo pipefail

CYAN='\033[0;36m'
PURPLE='\033[0;35m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'
BOLD='\033[1m'

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)/docker"

echo ""
echo -e "${PURPLE}${BOLD}"
echo "  ██╗  ██╗███████╗ █████╗ ██╗   ██╗███████╗███╗   ██╗"
echo "  ██║  ██║██╔════╝██╔══██╗██║   ██║██╔════╝████╗  ██║"
echo "  ███████║█████╗  ███████║██║   ██║█████╗  ██╔██╗ ██║"
echo "  ██╔══██║██╔══╝  ██╔══██║╚██╗ ██╔╝██╔══╝  ██║╚██╗██║"
echo "  ██║  ██║███████╗██║  ██║ ╚████╔╝ ███████╗██║ ╚████║"
echo "  ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝  ╚═══╝  ╚══════╝╚═╝  ╚═══╝"
echo -e "${NC}"
echo -e "  ${CYAN}NOIZYLAB DreamChamber · Heaven + Lucy${NC}"
echo ""

# ─── Check prerequisites ──────────────────────────────────
echo -e "${YELLOW}▸ Checking prerequisites...${NC}"

check_cmd() {
  if ! command -v "$1" &> /dev/null; then
    echo -e "${RED}  ✗ $1 not found. Please install it first.${NC}"
    exit 1
  else
    echo -e "${GREEN}  ✓ $1 found${NC}"
  fi
}

check_cmd docker
check_cmd docker-compose

# ─── Load env ─────────────────────────────────────────────
ENV_FILE="$PROJECT_DIR/../.env"
if [ -f "$ENV_FILE" ]; then
  echo -e "${GREEN}  ✓ .env loaded${NC}"
  export $(grep -v '^#' "$ENV_FILE" | xargs)
else
  echo -e "${YELLOW}  ⚠ No .env file found — creating template${NC}"
  cat > "$ENV_FILE" << 'EOF'
# Heaven + Lucy Environment
OPENAI_API_KEY=
ANTHROPIC_API_KEY=
HEAVEN_SYSTEM_PROMPT=
LUCY_SYSTEM_PROMPT=
EOF
  echo -e "${YELLOW}    Fill in /tmp/Heaven/.env then re-run${NC}"
fi

# ─── Build + Start ────────────────────────────────────────
echo ""
echo -e "${CYAN}▸ Building Heaven + Lucy containers...${NC}"
docker-compose -f "$PROJECT_DIR/docker-compose.yml" build --parallel

echo ""
echo -e "${CYAN}▸ Starting DreamChamber stack...${NC}"
docker-compose -f "$PROJECT_DIR/docker-compose.yml" up -d

# ─── Status ───────────────────────────────────────────────
echo ""
echo -e "${CYAN}▸ Waiting for services...${NC}"
sleep 5

heaven_status=$(curl -sf http://localhost:8080/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "starting")
lucy_status=$(curl -sf http://localhost:8081/health 2>/dev/null | python3 -c "import sys,json; d=json.load(sys.stdin); print(d.get('status','?'))" 2>/dev/null || echo "starting")

echo ""
echo -e "${BOLD}  ┌────────────────────────────────────────┐${NC}"
echo -e "${BOLD}  │ DreamChamber Status                    │${NC}"
echo -e "${BOLD}  ├────────────────────────────────────────┤${NC}"
printf "  │ %-10s http://localhost:8080   %s│\n" "Heaven:" "$heaven_status"
printf "  │ %-10s http://localhost:8081   %s│\n" "Lucy:" "$lucy_status"
echo -e "${BOLD}  │ Traefik Dashboard: http://localhost:8888│${NC}"
echo -e "${BOLD}  └────────────────────────────────────────┘${NC}"
echo ""
echo -e "${GREEN}${BOLD}  ✦ Heaven + Lucy are live 🌌${NC}"
echo ""
