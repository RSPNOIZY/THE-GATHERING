**Cloudflare Wrangler Deploy Guide (Troubleshooting)**

**Symptoms**
- `wrangler deploy` exits with code 1; logs under `~/Library/Preferences/.wrangler/logs/...`.

**Checklist**
- Auth: `wrangler whoami`; if not logged in, run `wrangler login`.
- Config: Validate `wrangler.toml` — account ID, project name, routes, env vars.
- Bindings: Ensure KV/R2/queues/services are defined and available.
- Secrets: Set required secrets: `wrangler secret put <NAME>`.
- Permissions: Confirm Cloudflare account/project permissions.

**Commands**
```
wrangler whoami
wrangler login
wrangler deploy --dry-run
wrangler deploy --env production
```

**Logs**
- Inspect the latest log file in `~/Library/Preferences/.wrangler/logs/` for specific errors.

**Rollback**
- If deploy fails after changes, revert config and re-test locally before retrying.