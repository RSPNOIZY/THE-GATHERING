# noizy-mcp — Remote MCP Worker

Canonical spec: [.claude/rules/mcp-builder.md](../../../.claude/rules/mcp-builder.md)

## Deploy

```bash
# Set bearer token (do once per environment)
npx wrangler secret put NOIZY_API_KEY --config cloudflare/workers/noizy-mcp/wrangler.jsonc

# Set Postman Cloud API key (get from https://postman.co/settings/me/api-keys)
npx wrangler secret put POSTMAN_API_KEY --config cloudflare/workers/noizy-mcp/wrangler.jsonc

# Deploy
npx wrangler deploy --config cloudflare/workers/noizy-mcp/wrangler.jsonc

# Tail logs
npx wrangler tail --config cloudflare/workers/noizy-mcp/wrangler.jsonc
```

## Endpoints

| Path      | Method | Auth                    | Purpose                                         |
| --------- | ------ | ----------------------- | ----------------------------------------------- |
| `/`       | GET    | none                    | Human-readable landing                          |
| `/health` | GET    | none                    | Health JSON — bindings visible as booleans only |
| `/mcp`    | POST   | `Bearer $NOIZY_API_KEY` | Streamable HTTP JSON-RPC 2.0                    |

## Test Flow (post-deploy)

```bash
# 1. Health
curl https://mcp.noizy.ai/health

# 2. Initialize
curl -X POST https://mcp.noizy.ai/mcp \
  -H "Authorization: Bearer $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2024-11-05","clientInfo":{"name":"smoke","version":"1.0"},"capabilities":{}}}'

# 3. List tools
curl -X POST https://mcp.noizy.ai/mcp \
  -H "Authorization: Bearer $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list"}'

# 4. Call empire_status
curl -X POST https://mcp.noizy.ai/mcp \
  -H "Authorization: Bearer $NOIZY_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"empire_status","arguments":{}}}'
```

## Tools

| Name                        | Read-only | Description                                                            |
| --------------------------- | --------- | ---------------------------------------------------------------------- |
| `empire_status`             | yes       | Live status, version, doctrine, tool count                             |
| `postman_whoami`            | yes       | Identity check against Postman Cloud API (validates key)               |
| `postman_list_workspaces`   | yes       | List all accessible workspaces                                         |
| `postman_get_workspace`     | yes       | Detail for a single workspace by id                                    |
| `postman_list_collections`  | yes       | List collections, optionally scoped by workspace                       |
| `postman_get_collection`    | yes       | Full JSON body of a collection by uid                                  |
| `postman_create_collection` | **no**    | Create a new Postman collection from v2.1 JSON                         |
| `postman_update_collection` | **no**    | Replace a collection by uid (destructive; idempotent)                  |
| `postman_fork_collection`   | **no**    | Fork a collection into a workspace under a label                       |
| `postman_list_environments` | yes       | List environments (optionally workspace-scoped)                        |
| `postman_get_environment`   | yes       | Environment definition by uid                                          |
| `postman_list_monitors`     | yes       | List monitors (cloud-scheduled runners)                                |
| `postman_run_monitor`       | **no**    | Trigger an on-demand monitor run — the cloud way to "run" a collection |
| `postman_list_mocks`        | yes       | List mock servers                                                      |
| `postman_resolve_target`    | yes       | Natural-language → `(collection_uid, environment_uid)` resolver        |

Add tools by appending to `TOOLS` and `handleToolCall()` in `src/index.ts`.

### Postman execution model

Postman's Cloud API cannot directly execute collections. Two cloud paths:

1. **`postman_run_monitor`** — triggers a Postman Monitor you've pre-created for a collection + environment. Result is async; check the monitor's run history via the Postman UI or `postman_list_monitors`.
2. For on-demand execution without a monitor, a separate **local Newman MCP** is the next step (Node CLI, runs on GOD.local, emits JSON reports).

### `postman_resolve_target` — learning-mode slot

`src/index.ts` has a `resolveTarget()` function that currently returns no match. It takes a natural-language query and the live collection + environment lists, and is the right place to encode your naming conventions (e.g. `heaven-smoke-prod` → collection uid X, environment uid Y). Implementation is 5–10 lines and is left to the operator.

## Client Config (Claude Desktop)

```json
{
  "mcpServers": {
    "noizy": {
      "url": "https://mcp.noizy.ai/mcp",
      "headers": { "Authorization": "Bearer $NOIZY_API_KEY" }
    }
  }
}
```

## Notes

- Bearer comparison is constant-time to prevent timing attacks.
- `/health` deliberately exposes binding booleans only, never secret values.
- Upgrade path: swap in `McpAgent` + Durable Objects for session state when needed.
