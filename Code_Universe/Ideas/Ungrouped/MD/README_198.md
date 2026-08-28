# voice-bridge-remote — NOIZY Edge Bridge

Cloudflare Worker at `voice-mcp.noizy.ai`. Authenticates MCP traffic at the edge, then forwards to the M2 Ultra Dreamchamber via Cloudflared tunnel.

## Flow

```
MCP client  ──►  voice-mcp.noizy.ai  ──►  Worker (auth check)
                                              │
                                              ▼
                                  TUNNEL_ORIGIN = voice.noizy.ai
                                              │
                                              ▼
                                  Cloudflared tunnel on M2 Ultra
                                              │
                                              ▼
                                   localhost:4096 (OpenCode MCP)
```

## One-time setup

```bash
cd apps/voice-bridge-remote
npm install

# Generate a strong token — treat as a secret
openssl rand -hex 32

# Store it as a Worker secret
wrangler secret put NOIZY_MCP_AUTH_TOKEN
# (paste the token when prompted)

# Deploy
wrangler deploy
```

## Client usage

```bash
curl -H "Authorization: Bearer <token>" https://voice-mcp.noizy.ai/mcp
```

## Hardening notes (co-architect)

| Concern | Status | Mitigation |
|---|---|---|
| String auth comparison in original spec was timing-attackable | Fixed | Uses timing-safe equality |
| `local-bridge.internal` was not a valid public hostname | Fixed | Uses `TUNNEL_ORIGIN` var pointing at CF Tunnel public hostname |
| Token rotation | Manual | `wrangler secret put` + invalidate clients; automate with scheduled task later |
| Rate limiting | Not yet | Add CF WAF rule or Rate Limiting rule on `voice-mcp.noizy.ai` |
| Audit logging | Default Worker logs | Pipe to Logpush → R2 for retention |
| Zero Trust integration | Not yet | Wrap behind CF Access for operator browser access; keep bearer for machine traffic |

## DO NOT

- Do **not** log `Authorization` header contents — even at debug.
- Do **not** return tunnel upstream error bodies verbatim — they may leak internal paths.
- Do **not** deploy without setting `NOIZY_MCP_AUTH_TOKEN`; the Worker returns 401 by design if unset, but silent misconfig is a footgun.
