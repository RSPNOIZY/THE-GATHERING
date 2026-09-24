# NOIZY EMPIRE — DNS & Email Migration Runbook

**Goal:** Move all NOIZY domains to Cloudflare DNS. Set up Cloudflare Email Routing so every address across every brand forwards to `rsp@noizyfish.com` (Outlook M365). **Public-facing contact: `rsp@noizyfish.com`**. One inbox, all brands, zero extra cost.

---

## YOUR DOMAINS

| # | Domain | Brand | Status |
|---|--------|-------|--------|
| 1 | `noizy.ai` | NOIZY.AI — AI Platform | ✅ Cloudflare — Email Routing LIVE |
| 2 | `noizyfish.com` | NOIZYFISH — Master Brand | Transfer from GoDaddy → CF |
| 3 | `noizyfish.ca` | NOIZYFISH — Canadian Alias | Transfer from GoDaddy → CF |
| 4 | `fishmusicinc.com` | FISHMUSICINC — Legacy Music | Transfer from GoDaddy → CF |
| 5 | `noizyvox.com` | NOIZYVOX — Voice/Audio | ⚠ Register at Cloudflare |
| 6 | `noizykidz.com` | NOIZYKIDZ — Kids Platform | ⚠ Register at Cloudflare |

> **ACTION:** Confirm which domains you own and where each is registered. Log into GoDaddy and Cloudflare Registrar to verify.

---

## THE WHOLE PICTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    BEFORE (scattered)                            │
│                                                                 │
│  GoDaddy DNS ──> noizyfish.com   ──> ??? email                 │
│  GoDaddy DNS ──> noizyfish.ca    ──> ??? email                 │
│  GoDaddy DNS ──> fishmusicinc.com──> ??? email                 │
│  CF DNS      ──> noizy.ai        ──> CF routing ✅ LIVE        │
└─────────────────────────────────────────────────────────────────┘

                          ↓ MIGRATION ↓

┌─────────────────────────────────────────────────────────────────┐
│                    AFTER (unified on Cloudflare)                 │
│                                                                 │
│  CF DNS ──> noizy.ai        ──┐  ✅ LIVE                      │
│  CF DNS ──> noizyfish.com   ──┤                               │
│  CF DNS ──> noizyfish.ca    ──┤  Cloudflare Email             │
│  CF DNS ──> fishmusicinc.com──┤  Routing (FREE)               │
│  CF DNS ──> noizyvox.com    ──┤                               │
│  CF DNS ──> noizykidz.com   ──┘       │                       │
│                                       ▼                       │
│                          rsp@noizyfish.com                     │
│                     (Outlook M365 — ONE INBOX)                 │
│                                                                 │
│  Public Contact: rsp@noizyfish.com                             │
│                                                                 │
│  Workers: heaven.rsp-5f3.workers.dev                        │
│     ──> api.noizyfish.com (custom domain)                      │
│                                                                 │
│  Team: RSP + Gabriel + Claude + Carolina                       │
│     ──> All in Cloudflare dashboard                            │
└─────────────────────────────────────────────────────────────────┘
```

---

## SEQUENCE — DO THESE IN ORDER

### Phase 1: Add Domains to Cloudflare DNS (per domain)

**Repeat this for EACH domain:**

#### Step 1A — Add the zone
1. Go to **https://dash.cloudflare.com**
2. Click **"Add a site"** (top right)
3. Enter the domain (e.g. `noizyfish.com`)
4. Select **Free plan** → Continue
5. Cloudflare scans existing DNS records and imports them
6. **Review the imported records** — make sure nothing critical is missing
7. Cloudflare gives you **2 nameservers**, e.g.:
   - `ada.ns.cloudflare.com`
   - `ben.ns.cloudflare.com`
8. **Write these down** — you need them for Step 1B

#### Step 1B — Point nameservers at Cloudflare
1. Go to **https://dcc.godaddy.com** (GoDaddy Domain Control Center)
2. Click the domain → **DNS** → **Nameservers** → **Change**
3. Select **"I'll use my own nameservers"**
4. Enter the 2 Cloudflare nameservers from Step 1A
5. Save
6. **Propagation takes 15 minutes to 24 hours** (usually ~1 hour)

#### Step 1C — Verify in Cloudflare
1. Back in Cloudflare dashboard, click **"Check nameservers"**
2. Once verified, the domain shows **Active** with a green checkmark
3. Done — Cloudflare now controls DNS for this domain

> **Do this for: noizy.ai, noizyfish.com, noizy.com, noizybox.com**

---

### Phase 2: Set Up Cloudflare Email Routing (per domain)

**This is FREE. No limits. No catch.**

#### Step 2A — Verify your destination email
1. Cloudflare dashboard → pick any domain → **Email** → **Email Routing**
2. Go to **Destination addresses** tab
3. Add `rsplowman@icloud.com`
4. Cloudflare sends a verification email to that address
5. **Click the verification link in your iCloud inbox**
6. Done — you only do this ONCE, it works across all domains

#### Step 2B — Enable Email Routing + Catch-All (per domain)
For EACH domain:
1. Cloudflare dashboard → select the domain → **Email** → **Email Routing**
2. Click **Enable Email Routing**
3. Cloudflare will **automatically add MX records** — let it
4. Go to **Routing rules** tab
5. Click **Catch-all address** → set action to **Forward to** → `rsplowman@icloud.com`
6. Save

That's it. Now **any email** sent to `anything@noizyfish.com`, `anything@noizy.ai`, etc. lands in your iCloud inbox.

#### Step 2C — Add specific addresses (optional, for cleanliness)
You can also add named routes if you want to see them in the dashboard:

| Domain | Address | Forwards To | Purpose |
|--------|---------|-------------|---------|
| `noizyfish.com` | `rsp@noizyfish.com` | `rsplowman@icloud.com` | **UNIVERSAL NOIZY CONTACT** |
| `noizyfish.com` | `carolina@noizyfish.com` | `rsplowman@icloud.com` | Agent alias |
| `noizyfish.com` | `gabriel@noizyfish.com` | `rsplowman@icloud.com` | Agent alias |
| `noizyfish.com` | `claude@noizyfish.com` | `rsplowman@icloud.com` | Agent alias |
| `noizy.ai` | `rsp@noizy.ai` | `rsplowman@icloud.com` | Brand alias |
| `noizy.ai` | `hello@noizy.ai` | `rsplowman@icloud.com` | Public inquiry |
| `noizy.ai` | `support@noizy.ai` | `rsplowman@icloud.com` | Support |
| `noizybox.com` | `hello@noizybox.com` | `rsplowman@icloud.com` | Product inquiry |

But the **catch-all handles everything** — these named routes are just for visibility.

---

### Phase 3: Sending FROM Those Addresses

Cloudflare Email Routing is **receive only**. To SEND as `rsp@noizyfish.com` (recommended for all public NOIZY communications), you have two free options:

#### Option A: iCloud+ Custom Domain (if you have iCloud+)
1. iPhone/Mac → **Settings** → **Apple ID** → **iCloud** → **iCloud Mail** → **Custom Email Domain**
2. Add `noizyfish.com` (and others)
3. Apple gives you DNS records to add in Cloudflare
4. Once verified, you can **send from** `rsp@noizyfish.com` directly in Apple Mail

#### Option B: Gmail "Send As" (free with any Gmail)
1. Gmail → Settings → **Accounts** → **Send mail as** → **Add another email address**
2. Enter `rsp@noizyfish.com`
3. SMTP server: `smtp.gmail.com` (using your Gmail app password)
4. This lets you send from that address in Gmail

#### Option C: Microsoft 365 (if keeping M365)
1. M365 Admin Center → Settings → Domains → Add each domain
2. Verify with TXT record in Cloudflare
3. Add aliases or shared mailboxes
4. Send from Outlook

> **Recommendation:** If you're already paying for iCloud+, Option A is cleanest — everything stays in Apple Mail, zero extra cost.

---

### Phase 4: Invite the Crew to Cloudflare

1. Cloudflare dashboard → **Manage Account** → **Members**
2. Invite by email:
   - `gabriel@noizyfish.com` — role: **Administrator** (or Super Admin)
   - `claude@noizyfish.com` — role: **Administrator**
   - `carolina@noizyfish.com` — role: **Administrator**
3. Since all those addresses forward to `rsplowman@icloud.com`, you'll receive the invite links
4. Accept each invite from your inbox
5. Each "member" now shows in the Cloudflare team

> Note: These are effectively aliases of you — but they show up as separate team members in the dashboard, which is useful for audit trails and role separation later.

---

### Phase 5: Wire Up Worker Custom Domains

Once DNS is active, update `wrangler.toml`:

```toml
routes = [
  { pattern = "api.noizyfish.com/*", zone_name = "noizyfish.com" }
]
```

Add a CNAME in Cloudflare DNS:
| Type | Name | Content | Proxy |
|------|------|---------|-------|
| `CNAME` | `api` | `heaven.rsp-5f3.workers.dev` | Proxied (orange cloud) |

Then redeploy: `npx wrangler deploy`

HEAVEN now lives at `https://api.noizyfish.com`

---

### Phase 6: Test Everything

#### DNS Test
```bash
dig noizyfish.com NS
# Should return Cloudflare nameservers

dig noizy.ai NS
# Should return Cloudflare nameservers
```

#### Email Test
- Send an email to `test@noizyfish.com` from any external account
- Confirm it arrives at `rsplowman@icloud.com`
- Repeat for each domain

#### Worker Test
```bash
curl https://api.noizyfish.com/health
```

#### Cloudflare Team Test
- Log in as each invited member
- Confirm dashboard access

---

## COST SUMMARY

| Service | Cost |
|---------|------|
| Cloudflare DNS | **FREE** |
| Cloudflare Email Routing | **FREE** |
| Cloudflare Workers (free tier) | **FREE** (100K req/day) |
| Cloudflare D1 (free tier) | **FREE** (5M rows read/day) |
| Cloudflare KV (free tier) | **FREE** (100K reads/day) |
| Domain registration renewal | Varies (~$10-15/yr per domain) |
| **Total new monthly cost** | **$0** |

---

## GODADDY EXIT PLAN

Once everything is confirmed working on Cloudflare:
1. **Do NOT cancel GoDaddy yet** — just leave it with nameservers pointed at Cloudflare
2. When domain renewal comes up, **transfer registration** to Cloudflare Registrar (at-cost pricing, no markup)
3. Cloudflare charges wholesale (~$9/yr for .com, varies for .ai)
4. Once transferred, GoDaddy has nothing left — cancel naturally

> Never cancel GoDaddy before transferring. Just change nameservers and let it expire or transfer out cleanly.

---

## QUICK REFERENCE — WHERE TO GO

| Task | URL |
|------|-----|
| Cloudflare Dashboard | https://dash.cloudflare.com |
| GoDaddy Domain Manager | https://dcc.godaddy.com |
| M365 Admin Center | https://admin.microsoft.com |
| iCloud Custom Domain | Settings → Apple ID → iCloud → iCloud Mail |
| Test DNS propagation | https://dnschecker.org |

---

*Last updated: March 21, 2026*
*Author: Cascade + RSP*
