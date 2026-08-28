# Gabriel Integrations — n8n + Zapier

Gabriel speaks JSON+HTTP on `:9090`. Any automation platform can talk to him.

## Endpoints (the contract)

**Inbound (you POST to Gabriel):**

| URL | Use it for |
|---|---|
| `POST /api/webhook/n8n` | n8n workflows |
| `POST /api/webhook/zapier` | Zapier zaps |
| `POST /api/webhook/generic` | Slack, GitHub, curl, anything |
| `POST /api/think` | Ask Gabriel a question, get text back |
| `POST /api/memcell/track` | Manually log an event |
| `POST /api/tools/{vitals,net,sync}` | Run a turbo tool, get stdout |

**Outbound (Gabriel POSTs to you):**

| URL | What |
|---|---|
| `POST /api/webhook/out` | Gabriel forwards to any URL. Body: `{url, payload, headers?}` |

**Live event stream:**

| URL | What |
|---|---|
| `GET /api/stream` | Server-Sent Events: `vitals` (every 5s), `memcell` (on every track), `webhook` (on every inbound). text/event-stream. |

---

## n8n setup

n8n is running locally on **`http://localhost:5678`**. Two starter workflows live in `n8n/`:

### 1. `01_gabriel_heartbeat.json` — hourly status snapshot

```
[Schedule: every 1hr] → [HTTP: GET /api/status] → [HTTP: POST /api/webhook/n8n]
```

Pulls Gabriel's full state every hour and round-trips it back through `/webhook/n8n` so it lands in MemCell + the SSE stream. Cockpit will show the heartbeat live.

### 2. `02_gabriel_command_webhook.json` — external command bridge

```
[Webhook IN: /webhook/gabriel-command] → [HTTP: POST /api/think] → [Respond JSON]
```

Exposes Gabriel as a public webhook. Any service that can POST JSON can ask him a question:

```bash
curl -X POST http://localhost:5678/webhook/gabriel-command \
  -H "Content-Type: application/json" \
  -d '{"prompt":"what is the top blocker today?"}'
```

### Import procedure

n8n MCP API key is **currently invalid** (auth failure on `n8n_list_workflows`). Two paths:

**Path A — Manual import (works today):**

1. Open `http://localhost:5678` in a browser
2. Workflows → `+ New` → top-right `⋮` menu → "Import from File"
3. Pick `~/NOIZYANTHROPIC/NOIZYLAB/integrations/n8n/01_gabriel_heartbeat.json`
4. Activate the workflow
5. Repeat for `02_gabriel_command_webhook.json`

**Path B — Fix MCP auth, then auto-deploy:**

1. In n8n: Settings → API → generate a new API key
2. Update wherever the n8n MCP is reading `N8N_API_KEY` from (likely your shell env or `~/.n8n/.env`)
3. Re-run health check → workflows can then be created via the n8n-mcp tools directly

### Networking note

The workflow JSONs use `http://host.docker.internal:9090` to reach Gabriel because n8n typically runs in Docker on macOS. If your n8n is **not** in Docker, swap that for `http://127.0.0.1:9090`.

---

## Zapier setup

Zapier is cloud-only — it can't reach `127.0.0.1:9090` directly. Two patterns:

### Pattern 1 — Cloudflare Tunnel (recommended)

Expose Gabriel via a tunnel; Zapier hits the public URL.

```bash
# Install once
brew install cloudflared

# Run alongside Gabriel
cloudflared tunnel --url http://127.0.0.1:9090
```

cloudflared prints a `https://*.trycloudflare.com` URL. Use that as the destination in Zapier "Webhooks by Zapier" → "POST" steps. Tunnel is ephemeral; for permanence, use a named Cloudflare tunnel under your `rsp@noizy.ai` account.

### Pattern 2 — Heaven Worker as the Zapier endpoint

Heaven (`heaven.rsp-5f3.workers.dev`) is already public. Add a `POST /gabriel/relay` route there that:

1. Authenticates via `X-NOIZY-Key`
2. Forwards the body to Gabriel's outbound channel of choice (queue, KV, or push to a tunnel)
3. Returns Gabriel's response

This is the more durable option since Heaven is the canonical public surface and already speaks `X-NOIZY-Key` auth.

### Pattern 3 — Outbound only (Gabriel → Zapier)

This is the **easiest** integration and needs zero new infra. Zapier provides "Catch Hook" trigger URLs that are unique per zap. Gabriel POSTs to them.

1. In Zapier, create a new zap with **Webhooks by Zapier → Catch Hook** as the trigger
2. Copy the catch URL (looks like `https://hooks.zapier.com/hooks/catch/.../...`)
3. From Gabriel, fire it any time:

```bash
gabriel webhook https://hooks.zapier.com/hooks/catch/XXXX/YYYY \
  '{"event":"deploy","status":"green","countdown":8}'
```

Or from inside the backend:

```bash
curl -X POST http://127.0.0.1:9090/api/webhook/out \
  -H "Content-Type: application/json" \
  -d '{"url":"https://hooks.zapier.com/hooks/catch/XXXX/YYYY","payload":{"hello":"from gabriel"}}'
```

The Catch Hook fires the rest of your zap (Slack, Notion, Gmail, anything Zapier supports — that's the whole 7000-app surface, no MCP needed).

---

## Quick test (works right now)

```bash
# Boot backend if not already running
gabriel serve &

# Inbound: pretend to be n8n
curl -X POST http://127.0.0.1:9090/api/webhook/n8n \
  -H "Content-Type: application/json" \
  -d '{"action":"deploy","subject":"heaven","status":"green"}'

# Watch the SSE stream live (separate terminal)
curl -N http://127.0.0.1:9090/api/stream

# Verify it landed
gabriel recall 5
```

You'll see the webhook payload tracked to MemCell and the same event broadcast on `/api/stream` with `event: webhook` — which means the cockpit updates live whenever any external system pings Gabriel.
