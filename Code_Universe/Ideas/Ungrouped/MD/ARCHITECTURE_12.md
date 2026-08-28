# NOIZY Integration Plane — Architecture

**Author:** Robert Stephen Plowman
**Date:** 2026-04-13
**Status:** Blueprint — ready to deploy

---

## Principle

One integration layer. Every platform is a connector. No hard-wiring.

The Integration Plane sits between HEAVEN (the consent kernel) and the outside world. It receives events from any source, logs them to an audit trail, and dispatches actions to any target. Every webhook, every OAuth flow, every API call passes through a single surface that can be monitored, audited, and controlled.

---

## Architecture

```
                         ┌─────────────┐
                         │   INTERNET   │
                         └──────┬───────┘
                                │
            ┌───────────────────┼───────────────────┐
            │                   │                   │
     ┌──────▼──────┐    ┌──────▼──────┐    ┌───────▼──────┐
     │   Linear    │    │   GitHub    │    │   Stripe     │
     │   Zapier    │    │   Notion    │    │   Google     │
     │   n8n (cloud)│   │   Slack     │    │   Microsoft  │
     └──────┬──────┘    └──────┬──────┘    └───────┬──────┘
            │                   │                   │
            └───────────────────┼───────────────────┘
                                │ webhooks
                    ┌───────────▼───────────┐
                    │                       │
                    │   CONNECTOR HUB       │  ← Cloudflare Worker
                    │   (Edge Gateway)      │     on NOIZYFISH account
                    │                       │
                    │  • Webhook receivers   │
                    │  • OAuth handlers      │
                    │  • Event audit log     │
                    │  • Queue dispatch      │
                    │  • Connector status    │
                    │                       │
                    └───────┬───────────────┘
                            │
              ┌─────────────┼─────────────┐
              │             │             │
       ┌──────▼──────┐ ┌───▼───┐  ┌──────▼──────┐
       │  D1 Audit   │ │ Queue │  │  KV Tokens  │
       │  (events)   │ │       │  │  KV Config  │
       └─────────────┘ └───┬───┘  └─────────────┘
                           │
              ┌────────────┼────────────┐
              │            │            │
       ┌──────▼──────┐ ┌──▼──────┐ ┌───▼────────┐
       │   HEAVEN    │ │  n8n    │ │  Outbound  │
       │   Consent   │ │ (local) │ │  Dispatch  │
       │   Kernel    │ │ Docker  │ │  (Slack,   │
       │             │ │ GOD.loc │ │   Gmail,   │
       └─────────────┘ └─────────┘ │   Notion)  │
                                    └────────────┘
```

---

## Components

### Connector Hub (`src/hub.ts`)
Cloudflare Worker on NOIZYFISH account. Single entry point for all integrations.

Endpoints:
- `POST /webhooks/:source` — Generic webhook receiver
- `POST /webhooks/linear/issues` — Linear issue events
- `POST /webhooks/github` — GitHub push/PR events
- `POST /webhooks/zapier` — Zapier callback events
- `POST /webhooks/n8n` — n8n workflow callbacks
- `POST /webhooks/stripe` — Payment events
- `GET /oauth/:provider/authorize` — Start OAuth flow
- `GET /oauth/callback` — OAuth code exchange
- `GET /connectors` — All connector status
- `GET /events` — Event audit log
- `POST /dispatch/:connector/:action` — Send action to connector
- `GET /health` — Hub + HEAVEN health check

### Connector Types (`connectors/types.ts`)
TypeScript interfaces for every connector: Google, Microsoft, Apple, Notion, Linear, Zapier, n8n, Anthropic, Stripe, GitHub, Postman. Each implements `IConnector` with `healthCheck()`, `handleWebhook()`, `dispatch()`, and `capabilities()`.

### Docker Compose (`docker-compose.yml`)
Local development stack on GOD.local:
- n8n (workflow engine, Postgres-backed, Ollama-connected)
- PostgreSQL 16
- Ollama (LLM inference)
- Qdrant (vector DB)
- Redis (cache)
- Open WebUI (chat)
- SurrealDB (multi-model DB)
- Grafana (monitoring)
- Newman (test runner, on-demand)

### Postman Collection (`postman/NOIZY-HEAVEN.postman_collection.json`)
Full test suite for all 16 HEAVEN endpoints. Contract tests for every response shape. Environment files for local and production.

### GitHub Action (`.github/workflows/test-heaven-api.yml`)
CI pipeline: runs Newman on push, PR, and daily schedule. Notifies n8n and Zapier on failure.

### Anthropic Policy (`ANTHROPIC-USAGE-POLICY.md`)
Hard separation: Claude Max for interactive, API keys for automation. Model selection guide. Data handling rules. Cost controls.

---

## Deployment Steps

```bash
# 1. Create D1 database
CLOUDFLARE_ACCOUNT_ID=2446d788cc4280f5ea22a9948410c355 \
  wrangler d1 create integration-events

# 2. Create KV namespaces
wrangler kv namespace create KV_TOKENS
wrangler kv namespace create KV_CONFIG

# 3. Update wrangler.toml with IDs from steps 1-2

# 4. Apply migration
wrangler d1 execute integration-events --remote --file=migrations/0001_integration_events.sql

# 5. Set secrets
wrangler secret put HEAVEN_API_KEY

# 6. Deploy
wrangler deploy

# 7. Seed connector configs
wrangler kv key put --namespace-id=<KV_CONFIG_ID> \
  "connector:linear" '{"name":"linear","enabled":true,"auth_type":"api_key"}'

wrangler kv key put --namespace-id=<KV_CONFIG_ID> \
  "connector:github" '{"name":"github","enabled":true,"auth_type":"bearer"}'

# ... repeat for each connector
```

---

## Two Engines, One System

| Decision Point | n8n (Local) | Zapier (Cloud) |
|---------------|-------------|----------------|
| PII workflows | ✅ Always | ❌ Never |
| Consent pipeline | ✅ Sovereign | ❌ |
| Quick SaaS glue | ❌ Slower setup | ✅ 7,000 apps |
| AI agent chains | ✅ Ollama local | ⚠️ Cloud only |
| High volume | ✅ Unlimited free | ⚠️ Per-task pricing |
| Public forms/bots | ❌ | ✅ Interfaces/Chatbots |

Both engines receive events FROM the Connector Hub and can dispatch actions THROUGH the Connector Hub. They are execution engines, not integration surfaces.

---

*Built for NOIZY.AI by Robert Stephen Plowman.*
*Every integration is a module. Every event is audited. Every voice is sovereign.*
