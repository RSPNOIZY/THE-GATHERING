#!/bin/bash
# MC96ECO UNIVERSE STARTUP
# M2 Ultra Mac Studio | 192GB RAM

echo "🌌 Starting MC96ECO Universe..."
echo ""

# Load environment
export PATH="/opt/homebrew/opt/postgresql@16/bin:$PATH"
source ~/DREAMCHAMBER/configs/dreamchamber.env 2>/dev/null

# Start core services
echo "Starting core services..."
brew services start postgresql@16 2>/dev/null
brew services start redis 2>/dev/null
brew services start meilisearch 2>/dev/null
brew services start ollama 2>/dev/null

# Start Docker services
echo "Starting Docker services..."
cd ~/MC96ECO && docker-compose up -d 2>/dev/null

# Start n8n
echo "Starting n8n automation..."
n8n start &>/dev/null &

# Wait for services
sleep 5

# Health checks
echo ""
echo "═══════════════════════════════════════════════════════════════"
echo "          MC96ECO UNIVERSE STATUS                               "
echo "═══════════════════════════════════════════════════════════════"
echo ""
echo "LOCAL SERVICES:"
echo "  PostgreSQL:  $(pg_isready -q && echo '✅' || echo '❌')"
echo "  Redis:       $(redis-cli ping 2>/dev/null | grep -q PONG && echo '✅' || echo '❌')"
echo "  Meilisearch: $(curl -s localhost:7700/health 2>/dev/null | grep -q available && echo '✅' || echo '❌')"
echo "  Ollama:      $(curl -s localhost:11434/api/tags &>/dev/null && echo '✅' || echo '❌')"
echo "  n8n:         $(curl -s localhost:5678/healthz 2>/dev/null | grep -q ok && echo '✅' || echo '❌')"
echo ""
echo "DOCKER SERVICES:"
docker ps --format "  {{.Names}}: {{.Status}}" 2>/dev/null | head -5
echo ""
echo "CLOUDFLARE WORKERS:"
echo "  heaven17:     https://heaven.rsp-5f3.workers.dev"
echo "  noizy-core:   https://noizy-core.rsp-5f3.workers.dev"
echo ""
echo "WEB INTERFACES:"
echo "  Grafana:      http://localhost:3000"
echo "  RabbitMQ:     http://localhost:15672"
echo "  Neo4j:        http://localhost:7474"
echo "  Meilisearch:  http://localhost:7700"
echo "  n8n:          http://localhost:5678"
echo "  Qdrant:       http://localhost:6333/dashboard"
echo ""
echo "🔥 MC96ECO UNIVERSE IS LIVE!"
