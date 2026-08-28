# Cloudflare Edge Deployment Runbook

## Required bindings

Configured in `cloudflare/wrangler.toml`:
- `DB` -> D1 database (`gabriel_db`)
- `ASSETS` -> R2 bucket

Before deploy, replace placeholder `database_id` with the real D1 database ID.

## Required environment variables

```bash
export CLOUDFLARE_API_TOKEN="..."
export API_AUTH_TOKEN="..."
```

## One-command remote execution

```bash
npm run cf:remote:one-command
```

This executes:
1. Remote D1 migration (`update_hvs_creator_assets.sql`)
2. Worker deploy with auth token injection

## API contract summary

All endpoints require:

```http
Authorization: Bearer <API_AUTH_TOKEN>
```

Routes:
- `POST /api/assets/register` -> validated idempotent register/upsert.
- `GET /api/assets/search` -> filter by `public_id`, `app_name`, `file_type`, with `limit` + `offset` pagination.
- `PUT /api/assets/sync` -> stream upload to R2 with payload-size guard and checksum capture (`x-content-sha256`).

All responses are structured:
- success: `{ ok: true, request_id, data }`
- error: `{ ok: false, request_id, error: { code, message } }`

## Downloads ingest automation

Stage Downloads content into canonical repo import folder:

```bash
npm run downloads:stage-to-master
```

Optional move mode:

```bash
MODE=move npm run downloads:stage-to-master
```

The importer uses Spotlight-indexed paths to avoid failing on interrupted directory traversal and writes detailed logs under `imports/logs/`.
