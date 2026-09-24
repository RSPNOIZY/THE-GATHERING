# NOIZY Domain Migration — noizy.ai to rsp@noizy.ai Account

## Problem

The `noizy.ai` domain returns **HTTP 522** because:
- The domain **zone** is on a different Cloudflare account (likely Fishmusicinc or rsp@noizyfish.com)
- The **Heaven Worker** is deployed on the rsp@noizy.ai account (NOIZY.AI)
- Cloudflare cannot route traffic from one account's zone to another account's worker

## Solution

Migrate the noizy.ai zone to the rsp@noizy.ai (NOIZY.AI) account.

---

## Step-by-Step Migration

### Step 1: Identify Current Zone Location

1. Login to Cloudflare at https://dash.cloudflare.com
2. Check which account has the `noizy.ai` zone:
   - rsp@noizyfish.com?
   - rsplowman@icloud.com?
   - Fishmusicinc?

### Step 2: Export DNS Records (Source Account)

In the account that currently has `noizy.ai`:

1. Go to **DNS** → **Records**
2. Click **Export** (download zone file)
3. Save this file — you'll need it for import

### Step 3: Remove Zone from Source Account

⚠️ **This will cause brief downtime**

1. In the source account, go to **Websites**
2. Select `noizy.ai`
3. Click **Remove Site** (Advanced Actions)
4. Confirm removal

### Step 4: Add Zone to rsp@noizy.ai Account

1. Login as rsp@noizy.ai
2. Click **Add Site**
3. Enter `noizy.ai`
4. Select **Free** plan (or your preferred plan)
5. Cloudflare will scan for DNS records

### Step 5: Import DNS Records

1. If records weren't auto-detected, go to **DNS** → **Records**
2. Click **Import** and upload the zone file from Step 2
3. Verify all records are present:
   - A records
   - CNAME records
   - MX records (for email)
   - TXT records (SPF, DKIM, etc.)

### Step 6: Update Nameservers at Domain Registrar

Cloudflare will provide new nameservers. Update them at your registrar:

1. Login to your domain registrar (GoDaddy, Namecheap, etc.)
2. Find `noizy.ai` domain settings
3. Change nameservers to the ones Cloudflare provided
4. Save changes

**Note:** Nameserver propagation can take up to 24-48 hours, but usually completes in minutes.

### Step 7: Add Worker Route

Once the zone is active on rsp@noizy.ai:

```bash
# Via wrangler
npx wrangler routes create 'noizy.ai/*' --zone-name noizy.ai

# Or in wrangler.toml
# [routes]
# pattern = "noizy.ai/*"
# zone_name = "noizy.ai"
```

Or in the Cloudflare Dashboard:
1. Go to **Workers & Pages**
2. Select `heaven` worker
3. Click **Settings** → **Triggers**
4. Add route: `noizy.ai/*`

### Step 8: Verify

```bash
# Should return 200 with Heaven response
curl -I https://noizy.ai/

# Should return health JSON
curl https://noizy.ai/health

# Should match Heaven Worker
curl https://heaven.rsp-5f3.workers.dev/health
```

---

## Alternative: Worker Route Without Zone Migration

If zone migration is not possible, you can deploy a **separate worker** on the account that has the zone, which proxies to Heaven.

```javascript
// proxy-to-heaven.js
export default {
  async fetch(request) {
    const url = new URL(request.url);
    url.hostname = 'heaven.rsp-5f3.workers.dev';
    return fetch(url.toString(), request);
  }
};
```

**Not recommended** — adds latency and complexity. Zone migration is cleaner.

---

## Verification Checklist

After migration:

- [ ] `noizy.ai` zone appears in rsp@noizy.ai account
- [ ] DNS records are complete
- [ ] Nameservers updated at registrar
- [ ] Worker route `noizy.ai/*` → `heaven` configured
- [ ] `https://noizy.ai/health` returns 200
- [ ] `https://noizy.ai/gabriel` returns empire status
- [ ] Email routing still works (if applicable)

---

## Account Reference

| Account | Email | Use |
|---------|-------|-----|
| **NOIZY.AI** | rsp@noizy.ai | ✅ PRIMARY — All Workers, KV, D1 |
| Fishmusicinc | rsp@noizyfish.com | ❌ Legacy — migrate away |
| Personal | rsplowman@icloud.com | ❌ Do not use for NOIZY |

**Target State:** Everything on rsp@noizy.ai (NOIZY.AI) account.

---

*Last Updated: 2026-04-07*
