# Heaven Deployment Runbook

> GABRIEL Self-Healing Loop Knowledge Base
> Worker: heaven (heaven.rsp-5f3.workers.dev)
> Route: noizy.ai/*
> Account: HEAVEN / noizy.ai (5f36aa9795348ea681d0b21910dfc82a)  — canonical rsp@noizy.ai; retired Fishmusicinc (2446d788...) no longer deploys here
> Last updated: 2026-04-22

---

## Pre-Flight Checklist

Before deploying, confirm every item:

### 1. Verify identity and account

```bash
npx wrangler whoami
```

**Expected output must show:**
- Account: HEAVEN / noizy.ai
- Account ID: `2446d788cc4280f5ea22a9948410c355`

If you see the consent account (`5ba03939...`), STOP. You are authenticated to the wrong account. Run `npx wrangler login` and select the correct account.

### 2. Verify wrangler.toml

```bash
cat ~/NOIZYANTHROPIC/repos/noizy-heaven/wrangler.toml
```

Confirm:
- `name = "heaven"`
- All D1 bindings reference the correct database IDs:
  - DB_MEMORY → `7b813205-fd12-4a23-84a6-ce83bc49ec70`
  - DB_REPAIRS → `2bd4aa06-f9b2-4761-b235-e92e8a21fe45`
  - DB_AQUARIUM → `e6f98279-656b-4f7a-979d-9197821193f5`
- All KV bindings reference the correct namespace IDs (see databases.md)
- No references to dead `gabriel_db` / `f75939d5`
- Route set to `noizy.ai/*`

### 3. Run tests

```bash
cd ~/NOIZYANTHROPIC/repos/noizy-heaven && npm test
```

**All 77 tests must pass.** Do not deploy with test failures.

If tests fail:
- Read the failure output carefully
- Fix the issue in source
- Re-run tests
- Do not skip tests or use `--force`

### 4. Check for secrets

```bash
npx wrangler secret list
```

Ensure all required secrets are set:
- `ANTHROPIC_API_KEY` — Claude API access
- `JWT_SECRET` — Session token signing
- Any other service-specific secrets

Secrets are NOT in wrangler.toml (never hardcode secrets).

---

## Deploy

### Standard deployment

```bash
cd ~/NOIZYANTHROPIC/repos/noizy-heaven && npx wrangler deploy
```

This deploys to the `noizy.ai/*` route on the HEAVEN account.

**Expected output:**
- Upload confirmation
- Worker version number (should increment)
- Route binding confirmation
- No errors

### What happens during deploy

1. Wrangler bundles the Worker source
2. Uploads to Cloudflare edge
3. Binds D1 databases and KV namespaces per wrangler.toml
4. Activates the new version on the `noizy.ai/*` route
5. Previous version remains available for rollback

---

## Post-Deploy Verification

### 1. Health check

```bash
curl https://heaven.rsp-5f3.workers.dev/health
```

**Expected:** HTTP 200 with JSON body containing version, status, and uptime.

### 2. Version check

```bash
curl https://heaven.rsp-5f3.workers.dev/version
```

**Expected:** Should return the new version number (v17.7.x or higher).

### 3. Consent endpoint check

```bash
curl https://heaven.rsp-5f3.workers.dev/consent/status
```

**Expected:** HTTP 200 (or 401 if auth required). Should NOT return 500 or connection errors.

### 4. Route verification

```bash
curl https://noizy.ai/health
```

**Expected:** Same response as the workers.dev URL. Confirms the route binding is active.

### 5. Check Cloudflare dashboard

Open `dash.cloudflare.com` and navigate to:
- Workers & Pages → heaven → Metrics
- Watch error rate for the first 5 minutes
- Any spike in 5xx errors = immediate rollback

---

## Rollback

If the deployment is broken:

```bash
cd ~/NOIZYANTHROPIC/repos/noizy-heaven && npx wrangler rollback
```

This immediately reverts to the previous Worker version. All D1 and KV bindings revert to the previous configuration.

### After rollback

1. Verify health: `curl https://heaven.rsp-5f3.workers.dev/health`
2. Check the Cloudflare dashboard error rate
3. Investigate the failure in the deployed code
4. Fix, test (77 tests must pass), and re-deploy

---

## Troubleshooting

### "Authentication error" during deploy

```bash
npx wrangler login
```

Select the HEAVEN / noizy.ai account. Retry deploy.

### "D1 binding not found" after deploy

Wrong database ID in wrangler.toml, or deploying to the wrong account. Check:
1. `npx wrangler whoami` — correct account?
2. `cat ~/NOIZYANTHROPIC/repos/noizy-heaven/wrangler.toml` — correct database IDs?

### "KV namespace not found" after deploy

Same root cause as D1 binding error. KV namespace IDs are account-specific. Verify IDs match the HEAVEN account.

### "Route already in use" error

Another Worker may be bound to `noizy.ai/*`. Check:
```bash
npx wrangler route list
```

### Tests pass locally but Worker fails in production

Check:
1. Are all secrets set? `npx wrangler secret list`
2. Are D1 schemas migrated? Run migrations if needed.
3. Is there a Cloudflare outage? Check `cloudflarestatus.com`

### Pack exceeds 2GB

The Worker bundle is too large. Common causes:
- ARCHIVE/ directory included in the bundle
- node_modules bloat
- Binary files in the Worker source

Fix: Use orphan branch without ARCHIVE/, or add problematic paths to `.wranglerignore`.

---

## Deploy Cadence

- **Hotfix:** Deploy immediately after tests pass
- **Feature:** Deploy during low-traffic window (early morning EST)
- **Major version:** Deploy with manual monitoring for 30 minutes post-deploy
- **Never deploy on Friday evening** unless it's an emergency fix
