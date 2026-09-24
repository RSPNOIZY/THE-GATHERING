#!/bin/bash
# GABRIEL API Keys Setup Script
# Quick interactive setup for DreamChamber AI providers

set -e

ENV_FILE="$(dirname "$0")/.env"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}🎯 GABRIEL API Keys Setup${NC}"
echo ""
echo "This script will help you add API keys to DreamChamber."
echo "You need at least ONE provider for GABRIEL to function."
echo ""
echo -e "${YELLOW}Recommended: Anthropic (Claude)${NC}"
echo ""

# Function to add or update key in .env
update_env_key() {
    local key_name=$1
    local key_value=$2
    
    if grep -q "^${key_name}=" "$ENV_FILE"; then
        # Key exists, update it
        if [[ "$OSTYPE" == "darwin"* ]]; then
            sed -i '' "s|^${key_name}=.*|${key_name}=${key_value}|" "$ENV_FILE"
        else
            sed -i "s|^${key_name}=.*|${key_name}=${key_value}|" "$ENV_FILE"
        fi
        echo -e "${GREEN}✓${NC} Updated ${key_name}"
    else
        # Key doesn't exist, append it
        echo "${key_name}=${key_value}" >> "$ENV_FILE"
        echo -e "${GREEN}✓${NC} Added ${key_name}"
    fi
}

# Check if .env exists
if [ ! -f "$ENV_FILE" ]; then
    echo -e "${RED}Error: .env file not found at $ENV_FILE${NC}"
    exit 1
fi

echo "Current .env location: $ENV_FILE"
echo ""

# Anthropic
echo -e "${BOLD}1. Anthropic (Claude) — RECOMMENDED${NC}"
echo "   Get key: https://console.anthropic.com/settings/keys"
read -p "   Enter Anthropic API key (or press Enter to skip): " anthropic_key
if [ ! -z "$anthropic_key" ]; then
    update_env_key "ANTHROPIC_API_KEY" "$anthropic_key"
fi
echo ""

# OpenAI
echo -e "${BOLD}2. OpenAI (GPT-4)${NC}"
echo "   Get key: https://platform.openai.com/api-keys"
read -p "   Enter OpenAI API key (or press Enter to skip): " openai_key
if [ ! -z "$openai_key" ]; then
    update_env_key "OPENAI_API_KEY" "$openai_key"
fi
echo ""

# Google
echo -e "${BOLD}3. Google (Gemini)${NC}"
echo "   Get key: https://aistudio.google.com/app/apikey"
read -p "   Enter Google API key (or press Enter to skip): " google_key
if [ ! -z "$google_key" ]; then
    update_env_key "GOOGLE_API_KEY" "$google_key"
fi
echo ""

# Together AI
echo -e "${BOLD}4. Together AI (Llama, Mixtral)${NC}"
echo "   Get key: https://api.together.xyz/settings/api-keys"
read -p "   Enter Together AI API key (or press Enter to skip): " together_key
if [ ! -z "$together_key" ]; then
    update_env_key "TOGETHER_API_KEY" "$together_key"
fi
echo ""

# Check if at least one key was added
if grep -q "ANTHROPIC_API_KEY=sk-ant-" "$ENV_FILE" || \
   grep -q "OPENAI_API_KEY=sk-" "$ENV_FILE" || \
   grep -q "GOOGLE_API_KEY=." "$ENV_FILE" || \
   grep -q "TOGETHER_API_KEY=." "$ENV_FILE"; then
    echo ""
    echo -e "${GREEN}${BOLD}✓ Success!${NC} At least one API key configured."
    echo ""
    echo "Next steps:"
    echo "  1. Start DreamChamber: ${BOLD}npm run dc:dev${NC}"
    echo "  2. Open browser: ${BOLD}http://localhost:7777${NC}"
    echo "  3. Click 'ENTER DREAMCHAMBER' and talk to GABRIEL"
    echo ""
else
    echo ""
    echo -e "${YELLOW}⚠ Warning: No API keys were added.${NC}"
    echo "GABRIEL will not function without at least one provider."
    echo ""
    echo "Run this script again or manually edit: $ENV_FILE"
    echo ""
fi
