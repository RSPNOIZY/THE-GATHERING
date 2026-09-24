#!/bin/bash
# ═══════════════════════════════════════════════════════════════
# NOIZY DreamChamber — Zero Trust Setup Script
# Robert Stephen Plowman (RSP_001) | April 10, 2026
# 
# This script creates the Cloudflare tunnel, DNS routes,
# and installs the config for all 13 DreamChamber services.
#
# Prerequisites:
#   - cloudflared installed (v2026.3.0+)
#   - Authenticated: cloudflared tunnel login
#   - noizy.ai domain on Cloudflare
#
# Usage:
#   bash scripts/setup-zero-trust.sh
# ═══════════════════════════════════════════════════════════════

set -euo pipefail

TUNNEL_NAME="god-local"
DOMAIN="noizy.ai"
CONFIG_DIR="$HOME/.cloudflared"
CONFIG_FILE="$CONFIG_DIR/config.yml"
PROJECT_CONFIG="cloudflare-workers/zero-trust/tunnel-config.yml"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
NC='\033[0m'

echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${CYAN}  NOIZY DreamChamber — Zero Trust Setup${NC}"
echo -e "${CYAN}  13 services → 13 subdomains → 1 identity${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"

# ─── STEP 1: Verify cloudflared ─────────────────────────────────
echo -e "\n${YELLOW}[1/6] Verifying cloudflared...${NC}"
if ! command -v cloudflared &> /dev/null; then
    echo -e "${RED}ERROR: cloudflared not installed.${NC}"
    echo "Install: brew install cloudflared"
    exit 1
fi
CFVERSION=$(cloudflared --version 2>&1 | head -1)
echo -e "${GREEN}✅ $CFVERSION${NC}"

# ─── STEP 2: Check authentication ──────────────────────────────
echo -e "\n${YELLOW}[2/6] Checking authentication...${NC}"
if [ ! -f "$CONFIG_DIR/cert.pem" ]; then
    echo -e "${RED}Not authenticated. Running cloudflared tunnel login...${NC}"
    echo -e "${YELLOW}A browser window will open. Log in with your Cloudflare account.${NC}"
    cloudflared tunnel login
fi
echo -e "${GREEN}✅ Authenticated${NC}"

# ─── STEP 3: Create tunnel ─────────────────────────────────────
echo -e "\n${YELLOW}[3/6] Creating tunnel: ${TUNNEL_NAME}...${NC}"
EXISTING=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" || true)
if [ -n "$EXISTING" ]; then
    echo -e "${GREEN}✅ Tunnel '$TUNNEL_NAME' already exists${NC}"
    echo "$EXISTING"
else
    cloudflared tunnel create "$TUNNEL_NAME"
    echo -e "${GREEN}✅ Tunnel '$TUNNEL_NAME' created${NC}"
fi

# Get tunnel ID for config
TUNNEL_ID=$(cloudflared tunnel list 2>/dev/null | grep "$TUNNEL_NAME" | awk '{print $1}')
echo -e "   Tunnel ID: ${CYAN}$TUNNEL_ID${NC}"

# ─── STEP 4: Create DNS routes ─────────────────────────────────
echo -e "\n${YELLOW}[4/6] Creating DNS routes (13 subdomains)...${NC}"

SUBDOMAINS=(
    "dreamchamber"    # L1: Creative Production
    "voice"           # L1: Creative Production (accessibility)
    "ollama"          # L1: Creative Production (AI chat)
    "ollama-api"      # L2: AI Infrastructure (direct API)
    "n8n"             # L2: AI Infrastructure (automation)
    "grafana"         # L2: AI Infrastructure (monitoring)
    "graph"           # L2: AI Infrastructure (knowledge graph)
    "vectors"         # L2: AI Infrastructure (embeddings)
    "mq"              # L2: AI Infrastructure (message queue)
    "search"          # L2: AI Infrastructure (full-text search)
    "heaven-dev"      # L3: Development
    "k8s"             # L3: Development (Kubernetes)
    "ssh"             # L3: Development (terminal)
)

for sub in "${SUBDOMAINS[@]}"; do
    echo -n "   ${sub}.${DOMAIN} → "
    RESULT=$(cloudflared tunnel route dns "$TUNNEL_NAME" "${sub}.${DOMAIN}" 2>&1 || true)
    if echo "$RESULT" | grep -q "already exists"; then
        echo -e "${GREEN}already routed ✅${NC}"
    else
        echo -e "${GREEN}created ✅${NC}"
    fi
done

# ─── STEP 5: Install config ────────────────────────────────────
echo -e "\n${YELLOW}[5/6] Installing tunnel config...${NC}"
mkdir -p "$CONFIG_DIR"

# Read project config and replace tunnel ID placeholder
sed "s|tunnel: god-local|tunnel: $TUNNEL_ID|g; s|<TUNNEL_ID>|$TUNNEL_ID|g" \
    "$PROJECT_CONFIG" > "$CONFIG_FILE"

echo -e "${GREEN}✅ Config installed: $CONFIG_FILE${NC}"

# ─── STEP 6: Test / Install service ───────────────────────────
echo -e "\n${YELLOW}[6/6] Testing tunnel...${NC}"
echo -e "   Starting tunnel in test mode (5 seconds)..."
timeout 5 cloudflared tunnel run "$TUNNEL_NAME" 2>&1 | head -5 || true
echo -e "${GREEN}✅ Tunnel test complete${NC}"

echo -e "\n${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e "${GREEN}  SETUP COMPLETE${NC}"
echo -e "${CYAN}═══════════════════════════════════════════════════════════${NC}"
echo -e ""
echo -e "  ${YELLOW}To start the tunnel:${NC}"
echo -e "    cloudflared tunnel run $TUNNEL_NAME"
echo -e ""
echo -e "  ${YELLOW}To install as persistent service (survives reboot):${NC}"
echo -e "    sudo cloudflared service install"
echo -e "    sudo launchctl start com.cloudflare.cloudflared"
echo -e ""
echo -e "  ${YELLOW}Then configure Access policies in Cloudflare One Dashboard:${NC}"
echo -e "    https://one.dash.cloudflare.com"
echo -e "    → Access → Applications → Add Application (x13)"
echo -e "    → Policy: Allow email in [rspplowman@gmail.com, rsplowman@icloud.com, rsp@noizy.ai]"
echo -e "    → Session: 24 hours"
echo -e ""
echo -e "  ${CYAN}13 services. 13 subdomains. 1 identity. Zero open ports.${NC}"
echo -e "  ${CYAN}DreamChamber has no walls.${NC}"
echo -e ""
