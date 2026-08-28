# DreamChamber v2.0
## Unified AI Interface Architecture

---

## Architecture Overview

```
dreamchamber/
├── src/
│   ├── server.js              # Express + WebSocket server
│   ├── core/
│   │   ├── StateManager.js    # In-memory state management
│   │   └── CostCalculator.js  # Token/cost calculations
│   ├── providers/
│   │   ├── BaseProvider.js    # Abstract base class
│   │   ├── AnthropicProvider.js
│   │   ├── OpenAIProvider.js
│   │   ├── GoogleProvider.js
│   │   ├── TogetherProvider.js
│   │   ├── MistralProvider.js
│   │   ├── CohereProvider.js
│   │   ├── PerplexityProvider.js
│   │   └── index.js          # Provider factory
│   ├── routes/
│   │   ├── api.js            # REST API endpoints
│   │   └── health.js         # Health/readiness checks
│   ├── websocket/
│   │   └── handler.js        # WebSocket message handling
│   └── schemas/
│       └── conversation.schema.js  # Joi validation schemas
├── public/
│   └── index.html            # Test interface
├── package.json
└── .env.example
```

## Core Components

### 1. StateManager
- Manages conversations in memory
- Tracks active connections
- Collects model statistics
- Event-driven architecture
- Cache layer for temporary data

### 2. Provider Architecture
- BaseProvider abstract class
- Standardized interface for all AI providers
- Automatic retry logic
- Error standardization
- Cost calculation per provider

### 3. API Layer
```
POST /api/chat          - Send message to single model
POST /api/compare       - Compare response across models
GET  /api/models        - List all available models
GET  /api/conversations - List user conversations
GET  /api/stats         - Get usage statistics
```

### 4. WebSocket Layer
- Real-time message streaming
- Stats updates
- Connection management
- Event subscriptions

## Setup

```bash
# Install dependencies
npm install

# Copy environment variables
cp .env.example .env

# Add your API keys to .env

# Start server
npm start

# Development mode
npm run dev
```

## Testing

Open http://localhost:7777 for the test interface.

## Architecture Principles

1. **Provider Abstraction**: All AI providers implement BaseProvider
2. **Schema Validation**: Joi schemas for all API inputs
3. **Event-Driven**: StateManager emits events for real-time updates
4. **Cost Tracking**: Every response includes token and cost metadata
5. **Error Handling**: Standardized error responses across providers
6. **Retry Logic**: Automatic retry with exponential backoff
7. **Stateless API**: Conversation state managed separately

## Next Steps

1. Add streaming support for providers that support it
2. Implement conversation persistence (Redis/PostgreSQL)
3. Add authentication/user management
4. Build the visual UI (Contact sequence, etc)
5. Add voice input/output support
6. Implement model recommendation engine
