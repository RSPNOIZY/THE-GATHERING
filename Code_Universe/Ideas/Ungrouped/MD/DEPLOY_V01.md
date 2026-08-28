# NOISY BOX + NOISY FISH — V0.1 Deployment Guide

## Prerequisites
- Cloudflare Account: `2446d788cc4280f5ea22a9948410c355`
- Wrangler CLI: `npm install -g wrangler@latest`
- Authenticated: `wrangler login`

---

## Step 1: Create D1 Databases

```bash
# NOISY BOX database
wrangler d1 create noisybox
# → Copy the database_id, update noisybox/wrangler.toml

# NOISY FISH database
wrangler d1 create noizyfish
# → Copy the database_id, update noizyfish/wrangler.toml
```

## Step 2: Initialize Schemas

```bash
# NOISY BOX
cd NOIZYLAB/noisybox
wrangler d1 execute noisybox --file=./schema.sql
wrangler d1 execute noisybox --file=./seed.sql

# NOISY FISH
cd NOIZYLAB/noizyfish
wrangler d1 execute noizyfish --file=./schema.sql
wrangler d1 execute noizyfish --file=./seed.sql
```

## Step 3: Install Dependencies + Deploy

```bash
# NOISY BOX
cd NOIZYLAB/noisybox
npm install
wrangler deploy

# NOISY FISH
cd NOIZYLAB/noizyfish
npm install
wrangler deploy
```

## Step 4: Domain Wiring (Cloudflare DNS)

### Active Domains:
| Domain | Brand | Worker Route | Status |
|--------|-------|-------------|--------|
| `noizyfish.com` | NOISY FISH | `fish.noisy.io/*` or `noizyfish.com/*` | ✅ Active |
| `fishmusicinc.com` | NOISY FISH (legacy) | Redirect → `noizyfish.com` | ✅ Active |
| `noizy.ai` | NOIZY (umbrella) | Landing page | ⚠️ Needs fix |
| `noizykidz.com` | NOIZYKIDZ | Curriculum site | ⚠️ Needs fix |

### DNS Records to Add:

```bash
# For noizyfish.com → NOISY FISH Worker
# In Cloudflare DNS dashboard:
# Type: CNAME | Name: @ | Target: noizyfish.workers.dev | Proxy: ON
# Type: CNAME | Name: www | Target: noizyfish.workers.dev | Proxy: ON
# Type: CNAME | Name: api | Target: noizyfish.workers.dev | Proxy: ON

# For noisybox (if using box.noisy.io or noisybox.com):
# Type: CNAME | Name: box | Target: noisybox.workers.dev | Proxy: ON
```

### Custom Domain via Wrangler:
```bash
# Add custom domains to workers
wrangler domains add noizyfish --domain noizyfish.com
wrangler domains add noisybox --domain box.noizy.ai
```

## Step 5: Email Setup (Cloudflare Email Routing)

### Recommended: Cloudflare Email Routing (Free)
Forward all emails to a single inbox (rsplowman@icloud.com or a Google Workspace).

```bash
# Via Cloudflare Dashboard → Email → Email Routing:

# noizyfish.com
#   info@noizyfish.com → rsplowman@icloud.com
#   licensing@noizyfish.com → rsplowman@icloud.com
#   hello@noizyfish.com → rsplowman@icloud.com

# noizy.ai
#   hello@noizy.ai → rsplowman@icloud.com
#   support@noizy.ai → rsplowman@icloud.com
#   rob@noizy.ai → rsplowman@icloud.com

# noizykidz.com
#   hello@noizykidz.com → rsplowman@icloud.com
#   learn@noizykidz.com → rsplowman@icloud.com

# fishmusicinc.com
#   info@fishmusicinc.com → rsplowman@icloud.com
#   licensing@fishmusicinc.com → rsplowman@icloud.com
```

### Required DNS Records for Email Routing:
```
# For each domain, add these MX records:
# Type: MX | Name: @ | Mail server: route1.mx.cloudflare.net | Priority: 69
# Type: MX | Name: @ | Mail server: route2.mx.cloudflare.net | Priority: 21
# Type: MX | Name: @ | Mail server: route3.mx.cloudflare.net | Priority: 44

# SPF record (allows Cloudflare to send on behalf):
# Type: TXT | Name: @ | Content: v=spf1 include:_spf.mx.cloudflare.net ~all
```

## Step 6: Fix Domain Issues

### noizy.ai (⚠️):
1. Check Cloudflare Dashboard → noizy.ai → DNS
2. Verify nameservers are pointed to Cloudflare
3. If expired/suspended, renew the domain registration
4. Check: `dig noizy.ai NS` — should show Cloudflare nameservers

### noizykidz.com (⚠️):
1. Same process as above
2. Verify DNS propagation: `dig noizykidz.com NS`
3. If using a different registrar, update nameservers to Cloudflare

## Step 7: Local Development

```bash
# NOISY BOX (port 8787)
cd NOIZYLAB/noisybox
npm install
wrangler d1 execute noisybox --local --file=./schema.sql
wrangler d1 execute noisybox --local --file=./seed.sql
wrangler dev

# NOISY FISH (port 8788)
cd NOIZYLAB/noizyfish
npm install
wrangler d1 execute noizyfish --local --file=./schema.sql
wrangler d1 execute noizyfish --local --file=./seed.sql
wrangler dev --port 8788

# Run tests
node test-harness.mjs
```

## Step 8: Verify Sacred Invariants

```bash
# Health checks (should show sacred invariants)
curl https://box.noizy.io/health | jq
curl https://noizyfish.com/health | jq

# Audit chain verification
curl -H "Authorization: Bearer YOUR_KEY" https://box.noizy.io/v1/audit/verify | jq
curl -H "Authorization: Bearer YOUR_KEY" https://noizyfish.com/v1/audit/verify | jq

# GORUNFREE reports
curl https://box.noizy.io/gorunfree/report | jq
curl https://noizyfish.com/gorunfree/report | jq
```

---

## Architecture Summary

```
NOISY BOX (box.noisy.io)           NOISY FISH (noizyfish.com)
├── Consent Vault                   ├── Catalog (50+ titles)
├── Voice Assets                    ├── Production Notes
├── Characters                      ├── Search + Discovery
├── Sessions + Takes                ├── Licensing (4 tiers)
├── Auth Scoring                    ├── Attribution (locked)
├── Usage Receipts                  ├── Royalty Events
├── Royalty Splits                  ├── Lucy Curation
├── Lucy Observations               └── Audit Log (chained)
└── Audit Log (chained)
        │                                   │
        └───────── noisyproof ──────────────┘
                  (consent + provenance)
```

Sacred Invariants (enforced in all code paths):
- Royalty floor: 75% to creator (7500 bps)
- GORUNFREE tithe: 1% to NOIZYKIDZ (100 bps, irremovable)
- Kill switch: absolute (no override, no lawyer)
- Audit log: append-only (no UPDATE, no DELETE)
- Consent: immutable after creation (revocation = new record)
- Attribution: locked to Robert Stephen Plowman + NOIZYFISH catalog
