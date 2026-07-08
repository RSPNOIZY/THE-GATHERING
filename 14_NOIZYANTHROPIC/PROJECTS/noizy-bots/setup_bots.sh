#!/bin/bash

# ──────────────────────────────────────────────────
# NOIZY.AI BOT SETUP PROTOCOL
# This script prepares the Discord and Slack bots.
# ──────────────────────────────────────────────────

PURPLE='\033[0;35m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
NC='\033[0m'

echo -e "${PURPLE}${BOLD}--- NOIZY BOT DEPLOYMENT ---${NC}"

# 1. Environment Check
echo -e "\n${BOLD}[1/4] Checking Environment Files...${NC}"
if [ ! -f "discord-bot/.env" ]; then
    echo -e "  ⚠️  discord-bot/.env missing. Creating from template..."
    cp .env.template discord-bot/.env
fi

if [ ! -f "slack-bot/.env" ]; then
    echo -e "  ⚠️  slack-bot/.env missing. Creating from template..."
    cp .env.template slack-bot/.env
fi
echo -e "  ${GREEN}✓${NC} Env templates staged. ${BOLD}ROB: PLEASE ADD YOUR TOKENS TO THESE FILES!${NC}"

# 2. Dependency Injection
echo -e "\n${BOLD}[2/4] Injecting Dependencies...${NC}"
echo -e "  📦 Processing Discord Bot..."
cd discord-bot && npm install --quiet
cd ..
echo -e "  📦 Processing Slack Bot..."
cd slack-bot && npm install --quiet
cd ..
echo -e "  ${GREEN}✓${NC} All packages ingested."

# 3. PM2 Guard
echo -e "\n${BOLD}[3/4] Verifying PM2 Process Manager...${NC}"
if ! command -v pm2 &> /dev/null; then
    echo -e "  ⚠️  PM2 not found. Attempting global install..."
    npm install -g pm2
fi
echo -e "  ${GREEN}✓${NC} PM2 Guard is active."

# 4. Launch Sequence
echo -e "\n${BOLD}[4/4] Launching Bot Swarm...${NC}"
pm2 delete noizy-discord 2>/dev/null || true
pm2 delete noizy-slack 2>/dev/null || true

cd discord-bot && pm2 start bot.js --name noizy-discord
cd ../slack-bot && pm2 start bot.js --name noizy-slack
cd ..

echo -e "\n${PURPLE}${BOLD}--- BOTS ARE LIVE ---${NC}"
echo -e "${CYAN}Rob, the bots are now running in the background via PM2.${NC}"
echo -e "Use ${BOLD}pm2 list${NC} to check status or ${BOLD}pm2 logs${NC} to see the signal flow."
