# metabeast-remote

Minimal Cloudflare-ready **remote MCP Worker scaffold**. Use it as the starting point for any empire MCP server that needs to be reachable over HTTPS (iPad, Claude mobile, Claude Desktop remote, any off-GOD client).

This scaffold is intentionally tiny: a `/health` check and a `/mcp` echo endpoint. From here you extend into full JSON-RPC 2.0 + MCP tool dispatch.

Part of **NOIZYCLOUDS** — the empire's Cloudflare-fleet brand. See `../../NOIZYCLOUDS.md` for the charter every Worker in this family honors.

---

## Files in this scaffold

| File             | Purpose                                                   |
| ---------------- | --------------------------------------------------------- |
| `src/index.ts`   | Worker source — lean, heavily commented                   |
| `wrangler.jsonc` | Worker config — JSONC with comments, per mcp-builder rule |
| `package.json`   | Dev scripts + types                                       |
| `tsconfig.json`  | Strict TS, ES2022, workers-types                          |
| `.gitignore`     | `node_modules`, `.wrangler`, `.dev.vars`, `.env`          |
| `README.md`      | This file                                                 |

---

## Quick start

```bash
cd mcp/metabeast-remote
npm install
npm run dev           # or:  wrangler dev --local
```

### Probe it locally

```bash
# Health
curl -i http://127.0.0.1:8787/health
#   HTTP/1.1 200
#   {"status":"ok"}

# MCP echo
curl -i -X POST http://127.0.0.1:8787/mcp \
  -H "Content-Type: application/json" \
  -d '{"jsonrpc":"2.0","method":"ping","id":1}'
#   HTTP/1.1 200
#   {"received":true,"echo":{"jsonrpc":"2.0","method":"ping","id":1},"ts":"..."}

# Identity
curl -s http://127.0.0.1:8787/ | jq .
#   { "agent": { "name": "metabeast-remote", ..., "frequency_hz": 396 }, ... }
```

### Deploy

```bash
npm run deploy        # wrangler deploy
```

Lands at `https://metabeast-remote.<account-subdomain>.workers.dev`.

---

## Custom hostname — why it's **manual**

This Worker is set up to deploy to `workers.dev` only. Custom domains like `mcp.noizy.ai` or `metabeast.noizy.ai` are **not** wired in `wrangler.jsonc`. That's intentional.

### Why not auto-wire

1. **Domain verification + SSL** — Cloudflare provisions certs in the dashboard flow; wrangler's auto-attach can race ahead of zone state.
2. **Pages / Workers collision** — if `metabeast.noizy.ai` is also configured as a Cloudflare Pages custom domain, a wrangler-declared Worker Custom Domain on the same hostname will fail or silently be ignored. Dashboard attachment surfaces the collision immediately.
3. **Org-level automation** — once your empire grows, hostname attachment belongs in the same automation that manages DNS, not scattered across every Worker's wrangler config.

### How to attach a custom hostname

1. <https://dash.cloudflare.com> → **NOIZYFISH** → **Workers & Pages**.
2. Click this Worker (`metabeast-remote`).
3. **Settings** → **Domains & Routes** → **Add** → **Custom Domain**.
4. Enter the hostname (e.g. `metabeast.noizy.ai`).
5. Cloudflare verifies the domain is in a zone on this account, creates the DNS record, provisions SSL, and attaches the route.
6. (Optional) mirror into `wrangler.jsonc` after attachment to keep it version-controlled:
   ```jsonc
   "routes": [
     { "pattern": "metabeast.noizy.ai", "custom_domain": true }
   ]
   ```
   (But do dashboard-first to surface collisions; wrangler-first is brittle.)

**Hostname policy (per `.claude/rules/mcp-builder.md`):**

- `mcp.noizy.ai` → the primary remote MCP server (Worker Custom Domain)
- `metabeast.noizy.ai` → UI shell for DreamChamber (Cloudflare Pages, not Worker)
- `api.noizy.ai/*` → modular API Workers (Worker Routes)

Don't deploy _this_ Worker to `metabeast.noizy.ai` unless the UI shell has moved elsewhere — check current hostname ownership before attaching.

---

## Extending into a full MCP server

The `/mcp` handler currently echoes request bodies. To turn it into a compliant Streamable-HTTP MCP server:

1. **Parse JSON-RPC 2.0** — the body will be either a single object or an array of objects, each with `jsonrpc`, `method`, `params?`, `id?`.

2. **Implement core methods:**
   - `initialize` → return `{ protocolVersion: "2024-11-05", serverInfo: {...}, capabilities: {...} }`
   - `tools/list` → return `{ tools: [{ name, description, inputSchema, annotations }] }`
   - `tools/call` → dispatch to the named tool, return `{ content: [{ type: "text", text: "..." }] }`
   - `ping` → return `{}`

3. **Batch support** — if `Array.isArray(body)`, `Promise.all` the handlers, return an array.

4. **Auth** — gate `/mcp` with an `Authorization: Bearer ...` header. Use constant-time compare (SHA-256 digest both sides, XOR-reduce), not `===`. See the fleet's constant-time `requireAuth` pattern in `cloudflare/workers/cf02-notion/src/index.js`.

5. **Tool annotations** — every tool should carry:

   ```json
   {
     "readOnlyHint": true,
     "destructiveHint": false,
     "idempotentHint": true,
     "openWorldHint": false
   }
   ```

   These let compliant MCP clients confirm before destructive writes.

6. **Test in this order:**
   1. `curl /health` — 200
   2. `curl /mcp` with an `initialize` — handshake completes
   3. `curl /mcp` with `tools/list` — list non-empty
   4. `curl /mcp` with `tools/call` — tool runs
   5. Add to a real MCP client (Claude Desktop, Claude iPad, VS Code Claude extension) — handshake + tool use end-to-end

If steps 1–4 pass but step 5 fails, the issue is client-side config, not your server.

---

## NOIZYCLOUDS fleet membership

This Worker joins the NOIZYCLOUDS brand when it meets all four Charter promises:

1. **Honors HEAVEN** — if it mutates state, it calls HEAVEN for consent verification and writes a ledger event. (Scaffold is read-only; add this when you extend.)
2. **Disposable** — no in-memory state. All state in D1/KV/R2. (Scaffold is stateless ✓.)
3. **Publishes its soul** — `GET /` with identity including `frequency_hz: 396`, `GET /health`. (Scaffold does both ✓.)
4. **Secrets via `wrangler secret`** — no plaintext creds in wrangler.jsonc or source. (Scaffold has no secrets yet ✓.)

Once it's doing real work and passes Agent Contact Sequence (see `DREAMCHAMBER_BEST_IDEAS_2026-04-17.md` Part II §7), add its row to `NOIZYCLOUDS.md`.

---

_396 Hz · Every MCP endpoint carries the doctrines. Even the scaffolds._
