# DREAMCHAMBER SUPER STACK TEMPLATE
## Production-Ready Multi-Model AI Platform (Anthropic-First)

---

## 🎯 THE COMPLETE STACK

### Core Philosophy
- **Anthropic-First**: Claude Sonnet/Opus as primary intelligence
- **Cohere for RAG**: Command R+ for search-augmented generation
- **Docker Everything**: Full containerization
- **PostgreSQL + Redis**: Persistent conversations + fast caching
- **JWT Auth**: Secure multi-user system
- **Production-Ready**: Nginx, PM2, monitoring, CI/CD

---

## 📁 COMPLETE FILE STRUCTURE

```
dreamchamber/
├── docker-compose.yml         # Full stack orchestration
├── Dockerfile                # Multi-stage production build
├── ecosystem.config.js       # PM2 process management
├── package.json             # Dependencies + scripts
├── .env.example            # Environment template
│
├── src/
│   ├── server.js           # Express + WebSocket server
│   ├── core/
│   │   ├── StateManager.js    # Real-time state management
│   │   ├── Database.js        # PostgreSQL connection pool
│   │   └── CostCalculator.js  # Token/cost tracking
│   ├── providers/
│   │   ├── BaseProvider.js    # Abstract base class
│   │   ├── AnthropicProvider.js # CLAUDE (PRIMARY)
│   │   ├── CohereProvider.js   # COHERE (SEARCH/RAG)
│   │   ├── OpenAIProvider.js   # GPT models
│   │   ├── GoogleProvider.js   # Gemini models
│   │   └── index.js           # Provider factory
│   ├── auth/
│   │   └── jwt.js            # JWT + bcrypt authentication
│   ├── routes/
│   │   ├── api.js            # REST endpoints
│   │   ├── auth.js           # Login/register routes
│   │   └── health.js         # Health checks
│   ├── websocket/
│   │   └── handler.js        # Real-time messaging
│   └── schemas/
│       └── conversation.schema.js # Joi validation
│
├── sql/
│   └── init.sql             # PostgreSQL schema
│
├── nginx/
│   ├── nginx.conf           # Production config
│   └── ssl/                 # SSL certificates
│
├── .github/
│   └── workflows/
│       └── deploy.yml       # CI/CD pipeline
│
└── public/
    └── index.html          # Test interface
```

---

## 🚀 QUICK START

### 1. Clone and Configure
```bash
git clone https://github.com/NOIZYLAB/dreamchamber.git
cd dreamchamber
cp .env.example .env
# Edit .env with your API keys
```

### 2. Start Everything
```bash
docker-compose up -d
```

### 3. Access
- App: http://localhost:7777
- pgAdmin: http://localhost:8888

---

## 🔑 ENVIRONMENT VARIABLES

```env
# API Keys (Anthropic-first)
ANTHROPIC_API_KEY=sk-ant-api03-xxxxx  # PRIMARY
COHERE_API_KEY=xxxxx                  # SEARCH/RAG
OPENAI_API_KEY=sk-xxxxx
GOOGLE_API_KEY=AIzaxxxxx

# Database
DATABASE_URL=postgresql://dreamchamber:password@postgres:5432/dreamchamber
REDIS_URL=redis://redis:6379

# Security
JWT_SECRET=your-secret-key
DB_PASSWORD=strong-password

# Defaults
DEFAULT_MODEL=claude-sonnet-4
PREFERRED_SEARCH_MODEL=command-r-plus
```

---

## 🏗️ ARCHITECTURE HIGHLIGHTS

### 1. **Anthropic-First Design**
```javascript
// Default to Claude
const DEFAULT_MODEL = 'claude-sonnet-4';

// Automatic fallback chain
const modelPriority = [
  'claude-sonnet-4',    // Best for most tasks
  'claude-opus-4',      // Complex reasoning
  'command-r-plus',     // Search/RAG tasks
  'gpt-4o',            // Fast alternative
  'gemini-2.0-flash'   // Budget option
];
```

### 2. **Cohere RAG Integration**
```javascript
// Automatic search augmentation
if (needsCurrentInfo(query)) {
  model = 'command-r-plus';  // Switch to Cohere
  options.searchAugmented = true;
}
```

### 3. **Docker Stack**
```yaml
services:
  dreamchamber:    # Node.js app
  postgres:        # Conversations & users
  redis:          # Cache & sessions
  nginx:          # SSL termination
  pgadmin:        # DB management (dev)
```

### 4. **Production Security**
- JWT tokens with refresh
- Bcrypt password hashing
- API key encryption at rest
- Rate limiting per endpoint
- CORS configuration
- Helmet.js protection

### 5. **Conversation Persistence**
```sql
-- Every message tracked
INSERT INTO messages (
  conversation_id, role, content, model,
  tokens, cost, latency, provider
)
-- Automatic cost aggregation
UPDATE conversations SET 
  total_cost = total_cost + $cost
```

---

## 📊 MONITORING & OBSERVABILITY

### Built-in Metrics
- Request latency per model
- Token usage tracking
- Cost aggregation
- Error rates by provider
- User activity logs

### Health Endpoints
```bash
GET /health          # Basic health
GET /health/ready    # Readiness probe
GET /api/stats       # Usage statistics
```

---

## 🔐 AUTHENTICATION FLOW

### 1. Register
```bash
POST /auth/register
{
  "email": "user@example.com",
  "username": "user",
  "password": "secure123"
}
# Returns: JWT tokens
```

### 2. Login
```bash
POST /auth/login
{
  "username": "user",
  "password": "secure123"
}
# Returns: JWT tokens
```

### 3. Use API
```bash
Authorization: Bearer <jwt-token>
```

---

## 🎮 API EXAMPLES

### Single Model Chat (Anthropic)
```bash
curl -X POST http://localhost:7777/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Explain quantum computing",
    "model": "claude-sonnet-4"
  }'
```

### Search-Augmented (Cohere)
```bash
curl -X POST http://localhost:7777/api/chat \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Latest developments in AI safety",
    "model": "command-r-plus"
  }'
```

### Model Comparison
```bash
curl -X POST http://localhost:7777/api/compare \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Write a haiku about coding",
    "models": ["claude-sonnet-4", "gpt-4o", "command-r-plus"]
  }'
```

---

## 🚢 DEPLOYMENT

### Production Deployment
```bash
# On server
cd /var/www/dreamchamber
docker-compose -f docker-compose.prod.yml up -d
```

### CI/CD Pipeline
- Push to main branch
- GitHub Actions builds Docker image
- Pushes to GitHub Container Registry
- SSH deploys to production
- Automatic health checks

---

## 🔧 SCALING CONSIDERATIONS

### Horizontal Scaling
```yaml
# docker-compose.scale.yml
services:
  dreamchamber:
    deploy:
      replicas: 4
    environment:
      - INSTANCE_ID={{.Task.Slot}}
```

### Database Optimization
```sql
-- Indexes for performance
CREATE INDEX idx_messages_conv_created 
ON messages(conversation_id, created_at);

-- Partitioning for scale
CREATE TABLE messages_2024_01 
PARTITION OF messages 
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

---

## 💡 BEST PRACTICES

### 1. **Model Selection**
```javascript
// Automatic model selection
function selectBestModel(task) {
  if (task.type === 'complex_reasoning') return 'claude-opus-4';
  if (task.type === 'search_required') return 'command-r-plus';
  if (task.type === 'code_generation') return 'claude-sonnet-4';
  if (task.type === 'quick_response') return 'gpt-4o';
  if (task.type === 'budget_conscious') return 'gemini-2.0-flash';
  return 'claude-sonnet-4'; // Default to Anthropic
}
```

### 2. **Cost Optimization**
- Cache repeated queries in Redis
- Use cheaper models for simple tasks
- Implement user quotas
- Monitor cost per conversation

### 3. **Performance**
- Connection pooling for PostgreSQL
- Redis for session management
- CDN for static assets
- Gzip compression

---

## 🎯 WHAT MAKES THIS "SUPER"

1. **Production-Ready**: Not a demo, a real deployment
2. **Multi-Model**: 10 AI providers integrated
3. **Anthropic-First**: Claude as primary intelligence
4. **Search-Augmented**: Cohere RAG built-in
5. **Cost-Aware**: Every token tracked
6. **Secure**: JWT auth, encrypted API keys
7. **Scalable**: Docker, PostgreSQL, Redis
8. **Observable**: Metrics, logs, monitoring
9. **CI/CD**: Automated deployment pipeline
10. **Developer-Friendly**: Clear structure, good docs

---

## 📈 ROADMAP

### Next Features
- [ ] Streaming responses (SSE)
- [ ] Voice input/output
- [ ] File upload support
- [ ] Plugin system
- [ ] Admin dashboard
- [ ] Prometheus metrics
- [ ] Kubernetes manifests

---

**This is the super stack template. Everything you need for a production multi-model AI platform with Anthropic at its heart and Cohere for search.**

Built with 💜 by the NOIZY Empire
