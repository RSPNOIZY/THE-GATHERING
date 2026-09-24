#!/bin/bash
# DREAMCHAMBER Startup Script
# M2 Ultra Mac Studio | 192GB RAM

echo "🚀 Starting DREAMCHAMBER..."
echo ""

# Load environment
source ~/DREAMCHAMBER/configs/dreamchamber.env

# Start databases
echo "Starting databases..."
brew services start postgresql@16 2>/dev/null
brew services start redis 2>/dev/null
brew services start meilisearch 2>/dev/null

# Start AI
echo "Starting Ollama..."
brew services start ollama 2>/dev/null

# Start n8n
echo "Starting n8n..."
n8n start &>/dev/null &

# Wait for services
sleep 3

# Health checks
echo ""
echo "Service Status:"
echo "  PostgreSQL: $(pg_isready -q && echo '✅ Running' || echo '❌ Down')"
echo "  Redis:      $(redis-cli ping 2>/dev/null | grep -q PONG && echo '✅ Running' || echo '❌ Down')"
echo "  Meilisearch: $(curl -s localhost:7700/health | grep -q available && echo '✅ Running' || echo '❌ Down')"
echo "  Ollama:     $(curl -s localhost:11434/api/tags &>/dev/null && echo '✅ Running' || echo '❌ Down')"
echo "  n8n:        $(curl -s localhost:5678/healthz | grep -q ok && echo '✅ Running' || echo '❌ Down')"
echo ""
echo "🔥 DREAMCHAMBER is LIVE!"
