# CLOUDFLARE FIX — Rob's-hands runbook

**Scope:** get `mcp.noizy.ai` live with the Postman tool suite, using n8n + GABRIEL as the automation spine.
**Today's ground truth** (healthcheck across fleet):

| Worker              | Host                                    | Health |
| ------------------- | --------------------------------------- | ------ |
| cf01-cf10 (10 bots) | `cfNN.rsp-5f3.workers.dev`              | 200 ✅ |
| gabriel             | `gabriel.rsp-5f3.workers.dev`           | 404 ⚠️ (up, no /health route) |
| mc96-follower       | `mc96-follower.rsp-5f3.workers.dev`     | 404 ⚠️ (up, no /health route) |
| **noizy-mcp**       | **`mcp.noizy.ai`**                      | **000 ❌ NEVER DEPLOYED** |

**The fix is one deploy.** The rest of the fleet is healthy.

---

## Step 1 — Create two tokens (Rob's hands, ~5 minutes once)

### Cloudflare API token

1. https://dash.cloudflare.com/profile/api-tokens → **Create Token**
2. Template: **Edit Cloudflare Workers**
3. Account resources: `rsp@noizy.ai` (account id `5f36aa9795348ea681d0b21910dfc82a`)
4. Zone resources: `noizy.ai`
5. Copy the token.

### Postman API key

1. https://postman.co/settings/me/api-keys → **Generate API Key**
2. Name it `noizy-mcp-worker`.
3. Copy the token (starts with `PMAK-`).

### Paste into `.env`

```
CLOUDFLARE_API_TOKEN=<paste>
CLOUDFLARE_ACCOUNT_ID=5f36aa9795348ea681d0b21910dfc82a
POSTMAN_API_KEY=PMAK-<paste>
```

`NOIZY_API_KEY` is already set — no action.

---

## Step 2 — Run the fix (one command, three equivalent surfaces)

### A. Shell (fastest, no daemons needed)

```bash
cd /Users/m2ultra/NOIZYANTHROPIC
ops/cloudflare-deploy.sh noizy-mcp
```

The script:
- sources `.env`, exports `CLOUDFLARE_API_TOKEN`
- pushes `NOIZY_API_KEY` + `POSTMAN_API_KEY` as Worker secrets (stdin, not interactive)
- runs `wrangler deploy` — no browser login
- logs NDJSON to `ops/logs/cloudflare-deploy.log`

### B. GABRIEL daemon (voice-first surface)

```bash
curl -X POST http://localhost:9777/cloudflare/fix-mcp \
  -H "Authorization: Bearer $GABRIEL_API_KEY"
```

Same result, wrapped in JSON response with stdout/stderr tails. Useful when you're on iPad LUCY or the Watch.

### C. n8n (scheduled / webhook-triggered)

Import `n8n-flows/cloudflare-deploy.json` into your n8n instance (`http://localhost:5678` or wherever). Then:

```bash
curl -X POST http://localhost:5678/webhook/cloudflare-deploy \
  -H "Content-Type: application/json" \
  -d '{"worker":"noizy-mcp","mode":"single"}'
```

The workflow shells to the same script and ledgers the result to Heaven (`event_type: CLOUDFLARE_DEPLOY`).

---

## Step 3 — Verify

```bash
# Health (unauth — should return 200 with POSTMAN_API_KEY: true)
curl https://mcp.noizy.ai/health | jq

# MCP initialize handshake (authed)
curl -X POST https://mcp.noizy.ai/mcp \
  -H "Authorization: Bearer $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"fix","version":"1.0"},"capabilities":{}}}' | jq

# List tools (should see 15: empire_status + 14 postman_*)
curl -X POST https://mcp.noizy.ai/mcp \
  -H "Authorization: Bearer $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}' | jq '.result.tools | length'

# Validate Postman key is good
curl -X POST https://mcp.noizy.ai/mcp \
  -H "Authorization: Bearer $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"postman_whoami","arguments":{}}}' | jq
```

---

## After the fix — what this enables

- **All Postman actions automatable from Claude** via `mcp.noizy.ai/mcp` — workspace/collection/environment/monitor/mock CRUD.
- **Fleet-wide deploys** via `ops/cloudflare-deploy.sh --broken` (auto-heals any 404/5xx worker).
- **Fleet status from GABRIEL** via `GET /cloudflare/status` (returns `{ broken: [...], workers: [...] }`).
- **Scheduled or webhook-driven deploys** via n8n — ledgered to Heaven for audit trail.

## Open follow-ups

- Implement `resolveTarget()` in `cloudflare/workers/noizy-mcp/src/index.ts` — natural-language → `(collection_uid, environment_uid)` resolver. Contribution slot marked with `TODO(RSP)`.
- Add `/health` route to `gabriel` and `mc96-follower` workers so fleet status stops showing two false-positive "broken" rows.
- Consider a local Newman MCP if you want on-demand collection execution without pre-created monitors.
