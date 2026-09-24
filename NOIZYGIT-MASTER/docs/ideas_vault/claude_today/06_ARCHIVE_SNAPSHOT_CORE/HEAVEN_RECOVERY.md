# HEAVEN — Kernel Lockout Recovery

**Diagnosed:** 2026-06-01 · **Status:** worker healthy, swarm locked out

## What's actually wrong

The Heaven worker is **not down**. It's alive and serving:

```
GET https://heaven.rsp-5f3.workers.dev/   → 200
{ "status":"alive", "service":"HEAVEN", "version":"18.1.0", "env":"production",
  "gabriel":"watching", "portals":[NOIZYVOX, NOIZYFISH, NOIZYKIDZ, NOIZYLAB, WISDOM, myFAMILY] }
```

But every **protected** route rejects your own swarm:

```
/api/v1   → 401
/health   → 401
/gabriel  → 401
```

And the `full-status` probe shows the cause:

```
CLOUDFLARE_API_TOKEN: NOT SET
```

So Gabriel, Lucy, and voice-bridge all report "Heaven: DEGRADED / unreachable / Unauthorized.
Sovereignty requires credentials." — because the clients are calling authenticated endpoints
**with no credential**. This is a missing-secret problem on the client side, not an outage.

## Two separate credentials are missing

1. **`CLOUDFLARE_API_TOKEN`** — lets `wrangler` manage/inspect the worker and its secrets.
   (Confirmed NOT SET; this is why `wrangler-doctor` fails.)
2. **The Heaven API auth token** — the bearer/secret the worker checks on `/api/v1/*`, `/gabriel`,
   `/health`. The MCP servers (voice-bridge, gabriel-mcp, lucy-mcp) must send this on every call.

## Recovery steps (you run these — they involve secrets)

**1. Restore the Cloudflare token** (account: *Fishmusicinc*)
   - Cloudflare dashboard → My Profile → API Tokens → create/locate the token with Workers access.
   - Add it to your shell + the MCP service env:
     ```bash
     export CLOUDFLARE_API_TOKEN="…"          # add to ~/.zshrc to persist
     ```

**2. Confirm what the worker expects**
   ```bash
   cd /Users/m2ultra/NOIZYANTHROPIC        # (or wherever the heaven worker source lives)
   wrangler whoami                          # should now succeed
   wrangler secret list                     # see the auth secret name the worker reads
   ```
   Look in the worker source for the auth check — find the variable it compares against
   (likely `HEAVEN_API_KEY`, `SOVEREIGNTY_TOKEN`, or similar). That name is the key.

**3. Give the swarm the same token**
   Set the matching value in the env of each MCP client that calls Heaven
   (voice-bridge, gabriel-mcp, lucy-mcp — check their LaunchAgent plists / `.env`).
   The token the clients SEND must equal the secret the worker CHECKS.

**4. Verify**
   ```bash
   # from voice-bridge MCP:  full-status  → endpoints should flip 401 → 200
   ```
   Or watch the live dashboard — the "Heaven kernel" card turns from **LOCKED OUT** to **authed**.

## Why it broke (most likely)
The Cloudflare token was never persisted (or was rotated) and the worker's auth gate was
tightened to also cover `/health`. Once `CLOUDFLARE_API_TOKEN` fell out of the environment,
wrangler went blind and the shared secret stopped being injected into the clients.

## Note on accounts
Your connected Cloudflare MCP sees account **Fishmusicinc** with one worker (`deploy`).
The Heaven worker lives on the `rsp-5f3.workers.dev` subdomain — confirm it's in the same
account, or connect the account that hosts it so wrangler can read its secrets.
