# ENGR_KEITH Tunnel Rollout (Cloudflare-first)

This implements the outward architecture:

- Client -> Cloudflare (`noizy.ai`)
- Cloudflare -> GOD (Cloudflare tunnel on GOD)
- GOD -> LAN services

## 1) Start quick tunnel on GOD

Use:

- `ops/cloudflare/start-keith-tunnel.sh`

Default target: `http://localhost:7006`

Copy the printed `https://<id>.trycloudflare.com` URL.

## 2) Configure HEAVEN Worker

Use route shim:

- `ops/cloudflare/heaven-keith-route.worker.ts`

Set Worker variable/secret:

- `KEITH_TUNNEL_URL = https://<id>.trycloudflare.com`

Add route handling for:

- `https://noizy.ai/keith/*`

## 3) Verify end-to-end

From any external client:

- `GET https://noizy.ai/keith/health`
- `POST https://noizy.ai/keith/record`

Expected:

- Responses should include `x-noizynet-upstream: keith-tunnel`

## 4) Stabilize after proof

Quick tunnels rotate and are not ideal for long-term reliability.
After proving flow, move to named tunnel + fixed hostname:

- e.g. `keith.gabriel.dreamchamber.noizy.ai`

Then set:

- `KEITH_TUNNEL_URL=https://keith.gabriel.dreamchamber.noizy.ai`

## 5) Security minimums

- Keep tunnel endpoint behind Access policy where possible
- Enforce identity + WARP + posture for privileged routes
- Keep mTLS for mutation/export/verification surfaces
