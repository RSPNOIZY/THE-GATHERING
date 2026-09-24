# NOIZY Per-Route Canary Strategy

## Overview

Per-route canarying limits blast radius by testing changes on specific API paths before rolling out globally. This is safer than canarying all traffic because:

- Homepage stays stable (users see no changes)
- Only specific routes get new code
- Rollback is instantaneous per environment

## Route Architecture

```
┌──────────────────────────────────────────────────────────┐
│                    noizy.ai Domain                        │
├──────────────────────────────────────────────────────────┤
│                                                          │
│  /*  ────────────────────────► heaven (production)       │
│       Main landing, docs, static                         │
│                                                          │
│  /api/*  ───────┬────────────► heaven-canary (canary)   │
│                 │                                        │
│                 └────────────► heaven (production)       │
│                  (traffic split)                         │
│                                                          │
│  /gabriel/*  ─────────────────► heaven (production)      │
│       Critical consent path - never canary               │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

## Environment Configuration

### wrangler.toml Routes

```toml
# Production - all routes
[env.production]
name = "heaven"
routes = [
  { pattern = "noizy.ai/*", zone_name = "noizy.ai" },
  { pattern = "heaven.rsp-5f3.workers.dev/*" }
]

# Canary - only /api/* routes
[env.canary]
name = "heaven-canary"
routes = [
  { pattern = "noizy.ai/api/*", zone_name = "noizy.ai" }
]
# Note: More specific route wins, so /api/* goes to canary

# Preview - *.preview subdomain only
[env.preview]
name = "heaven-preview"
routes = [
  { pattern = "preview.noizy.ai/*", zone_name = "noizy.ai" }
]
```

## Safe Rollout Sequence

### 1. Deploy to Preview (internal testing)

```bash
# Deploy preview
npx wrangler deploy -e preview

# Test internally
curl https://preview.noizy.ai/api/v1
curl https://preview.noizy.ai/health
```

### 2. Deploy to Canary (limited production traffic)

```bash
# Deploy canary (only catches /api/*)
npx wrangler deploy -e canary

# Verify canary is serving /api/*
curl -I https://noizy.ai/api/v1
# Check CF-Worker header shows heaven-canary
```

### 3. Monitor Canary

```bash
# Watch for errors (5 min observation window)
./scripts/canary-monitor.sh --duration 5m --threshold 0.1%
```

### 4. Promote to Production

```bash
# If canary healthy, deploy to production
npx wrangler deploy -e production

# Verify
curl https://noizy.ai/health
curl https://noizy.ai/api/v1
```

## Route Categories

### Never Canary (Critical Path)

These routes MUST always use production code:

| Route | Reason |
|-------|--------|
| `/gabriel/*` | Consent kernel - zero tolerance for errors |
| `/health` | Must always return known-good response |
| `/` | Landing page - user first impression |

### Safe to Canary

| Route | Risk Level | Canary Duration |
|-------|------------|-----------------|
| `/api/v1/*` | Medium | 30 min minimum |
| `/search/*` | Low | 15 min minimum |
| `/metrics` | Low | 5 min minimum |

### High-Risk Canary

| Route | Risk Level | Canary Duration |
|-------|------------|-----------------|
| `/api/v1/actors/*` | High | 2 hours minimum |
| `/api/v1/consent/*` | High | 4 hours minimum |
| `/api/v1/license/*` | High | 4 hours minimum |

## Canary Metrics to Watch

### Automatic Rollback Triggers

Canary automatically rolls back if:

- Error rate > 1% (vs production baseline)
- P99 latency > 2x production
- Any 500 error on consent paths
- Health check fails

### Manual Observation

Watch for:
- Error rate delta (canary vs production)
- Latency percentiles (P50, P95, P99)
- Request volume (ensure canary is receiving traffic)

## Rollback Procedure

### Immediate Rollback

```bash
# Remove canary routes (traffic returns to production)
npx wrangler delete -e canary

# Or deploy known-good version to canary
git checkout <good-sha>
npx wrangler deploy -e canary
```

### Verify Rollback

```bash
# Confirm canary no longer serving
curl -I https://noizy.ai/api/v1
# CF-Worker should show "heaven" not "heaven-canary"
```

## Traffic Splitting (Future)

When Cloudflare supports native traffic splitting:

```toml
[env.canary]
name = "heaven-canary"
routes = [
  { pattern = "noizy.ai/api/*", zone_name = "noizy.ai", traffic_percent = 10 }
]
```

Until then, use request-level feature flags:

```javascript
// In worker code
import { isRolledOut } from './flags';

if (await isRolledOut(env, 'new_api_handler', request.headers.get('CF-Connecting-IP'))) {
  return newHandler(request, env);
}
return legacyHandler(request, env);
```

---

*Last Updated: 2026-04-07*
*Owner: RSP_001*
