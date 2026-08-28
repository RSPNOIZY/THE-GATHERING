# Phase 4 — NOIZY Voice Bridge Cloud Run Mirror

Stateless mirror of the local `noizy-voice-bridge-local` MCP server. Three tools, zero drift: `analyze`, `stamp`, `session_log`.

## Deploy

```bash
cd noizy-mcp-remote
gcloud run deploy noizy-mcp \
  --source . \
  --no-allow-unauthenticated \
  --region us-central1 \
  --project noizy-platform-prod
```

Expected output:

```
✅ https://noizy-mcp-xxx.run.app/mcp — Authenticated mirror
```

## Activate in OpenCode

Flip one boolean in `opencode.json`:

```json
"remote_lane": true
```

## Auth model

`--no-allow-unauthenticated` is deliberate. Clients reach the endpoint via IAM-signed requests from `rsp@noizy.ai` or authorized service accounts. No public exposure.

## Drift check

`cloud-run-mcp.mjs` must remain byte-identical (minus transport) to the local bridge's tool surface. If you add a tool locally, deploy it here in the same commit. CI guard recommended.
