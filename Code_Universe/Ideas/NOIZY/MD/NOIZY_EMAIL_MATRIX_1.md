# NOIZY EMPIRE — 6-Brand Email Matrix
# One inbox. All brands. rsp@noizyfish.com in Outlook M365.

**Architecture:**
- **Inbox**: `rsp@noizyfish.com` — Microsoft 365 / Outlook (primary mailbox)
- **Routing**: Cloudflare Email Routing on all brand domains → forward to `rsp@noizyfish.com`
- **noizy.ai**: ✅ Already live on Cloudflare
- **Send-as**: M365 aliases + Outlook "From" dropdown for each brand address

---

## BRAND 1 — NOIZYFISH · Master Brand

| Address | Purpose | Route To | Status |
|---------|---------|----------|--------|
| `rsp@noizyfish.com` | **PRIMARY INBOX** — M365 mailbox | *IS the inbox* | ✅ Active |
| `carolina@noizyfish.com` | Business partner / co-founder | `rsp@noizyfish.com` | Set up CF routing |
| `gabriel@noizyfish.com` | AI agent identity | `rsp@noizyfish.com` | Set up CF routing |
| `claude@noizyfish.com` | AI agent identity | `rsp@noizyfish.com` | Set up CF routing |
| `hello@noizyfish.com` | General public contact | `rsp@noizyfish.com` | Set up CF routing |
| `support@noizyfish.com` | Artist support desk | `rsp@noizyfish.com` | Set up CF routing |
| `legal@noizyfish.com` | Legal / consent notices | `rsp@noizyfish.com` | Set up CF routing |
| `*@noizyfish.com` | **Catch-all** | `rsp@noizyfish.com` | Set up CF routing |

**Domain**: `noizyfish.com` — PRIMARY EMAIL DOMAIN (M365 hosted)
**CF Email Routing**: Enable + catch-all → `rsp@noizyfish.com`

---

## BRAND 2 — NOIZYFISH.CA · Canadian Alias

| Address | Purpose | Route To | Status |
|---------|---------|----------|--------|
| `rsp@noizyfish.ca` | Canadian contact alias | `rsp@noizyfish.com` | Set up CF routing |
| `hello@noizyfish.ca` | Canadian public contact | `rsp@noizyfish.com` | Set up CF routing |
| `*@noizyfish.ca` | **Catch-all** | `rsp@noizyfish.com` | Set up CF routing |

**Domain**: `noizyfish.ca` — CIRA-managed, transfer to Cloudflare Registrar
**CF Email Routing**: Enable + catch-all → `rsp@noizyfish.com`

---

## BRAND 3 — NOIZY.AI · AI Platform Authority ✅ LIVE

| Address | Purpose | Route To | Status |
|---------|---------|----------|--------|
| `rsp@noizy.ai` | Founder AI brand contact | `rsp@noizyfish.com` | ✅ CF routing live |
| `hello@noizy.ai` | Platform public entry | `rsp@noizyfish.com` | ✅ CF routing live |
| `support@noizy.ai` | Platform support | `rsp@noizyfish.com` | ✅ CF routing live |
| `gabriel@noizy.ai` | GABRIEL agent identity | `rsp@noizyfish.com` | ✅ CF routing live |
| `*@noizy.ai` | **Catch-all** | `rsp@noizyfish.com` | ✅ CF routing live |

**Domain**: `noizy.ai` — ✅ On Cloudflare, Email Routing active
**Action**: Verify all addresses above are configured (or catch-all covers them)

---

## BRAND 4 — NOIZYVOX · Voice & Audio

| Address | Purpose | Route To | Status |
|---------|---------|----------|--------|
| `rsp@noizyvox.com` | Founder voice brand contact | `rsp@noizyfish.com` | Acquire domain first |
| `bookings@noizyvox.com` | Session/studio bookings | `rsp@noizyfish.com` | Acquire domain first |
| `sync@noizyvox.com` | Sync licensing | `rsp@noizyfish.com` | Acquire domain first |
| `*@noizyvox.com` | **Catch-all** | `rsp@noizyfish.com` | Acquire domain first |

**Domain**: `noizyvox.com` — ⚠ Confirm ownership / register at Cloudflare
**Action**: Register at Cloudflare Registrar → Enable CF Email Routing

---

## BRAND 5 — NOIZYKIDZ · Kids Platform

| Address | Purpose | Route To | Status |
|---------|---------|----------|--------|
| `rsp@noizykidz.com` | Founder kids brand contact | `rsp@noizyfish.com` | Acquire domain first |
| `hello@noizykidz.com` | Parent/educator contact | `rsp@noizyfish.com` | Acquire domain first |
| `safe@noizykidz.com` | Safety / content reports | `rsp@noizyfish.com` | Acquire domain first |
| `*@noizykidz.com` | **Catch-all** | `rsp@noizyfish.com` | Acquire domain first |

**Domain**: `noizykidz.com` — ⚠ Confirm ownership / register at Cloudflare
**Action**: Register at Cloudflare Registrar → Enable CF Email Routing

---

## BRAND 6 — FISHMUSICINC · Legacy Music Entity

| Address | Purpose | Route To | Status |
|---------|---------|----------|--------|
| `rsp@fishmusicinc.com` | Legacy music contact | `rsp@noizyfish.com` | Set up CF routing |
| `info@fishmusicinc.com` | General music inquiry | `rsp@noizyfish.com` | Set up CF routing |
| `*@fishmusicinc.com` | **Catch-all** | `rsp@noizyfish.com` | Set up CF routing |

**Domain**: `fishmusicinc.com` — Transfer from GoDaddy to Cloudflare Registrar
**CF Email Routing**: Enable + catch-all → `rsp@noizyfish.com`

---

## CLOUDFLARE ROUTING SETUP — PER DOMAIN

For each domain on Cloudflare:

1. **Cloudflare Dashboard** → select domain → **Email** → **Email Routing**
2. Click **Enable Email Routing** (CF adds MX + SPF records automatically)
3. **Destination addresses** tab → Add `rsp@noizyfish.com` → Verify (check Outlook inbox for verification email)
4. **Routing rules** → Add each address → Forward to `rsp@noizyfish.com`
5. **Catch-all** → Action: Forward to → `rsp@noizyfish.com`

> **Note**: You only verify `rsp@noizyfish.com` as destination ONCE. It works across all domains.

---

## OUTLOOK M365 — SEND-AS SETUP

To **send from** brand addresses in Outlook (not just receive):

### Option A — M365 Aliases (noizyfish.com domain only)
1. **M365 Admin Center** → Users → `rsp@noizyfish.com` → Manage email aliases
2. Add: `carolina@noizyfish.com`, `gabriel@noizyfish.com`, `hello@noizyfish.com`, etc.
3. In Outlook → compose → click **From** dropdown → select alias

### Option B — Connected Accounts / Send-As (other brand domains)
For brand domains NOT hosted in M365 (noizy.ai, noizyvox.com, etc.):
1. Outlook → Settings → **Connected Accounts** → Add an account
2. Configure SMTP relay (Cloudflare does not provide SMTP — use M365 SMTP or Gmail SMTP)
3. **Recommended**: Add brand domains to M365 as **Accepted Domains** → create shared mailboxes per brand

### Option C — M365 Shared Mailboxes (cleanest for brand separation)
1. **M365 Admin** → Add each brand domain as Accepted Domain
2. Create shared mailbox per brand: `hello@noizy.ai`, `hello@noizyvox.com`, etc.
3. Grant `rsp@noizyfish.com` full access → all show in single Outlook sidebar
4. Receive in Outlook + send FROM brand address

> **Recommended path**: Option C for full send/receive from each brand in one Outlook inbox.

---

## MASTER EMAIL ROUTING TABLE

| From Address | Domain Status | CF Routing | Lands In |
|-------------|---------------|------------|----------|
| `*@noizy.ai` | ✅ CF Live | ✅ Active | Outlook M365 |
| `*@noizyfish.com` | Transfer from GoDaddy | Set up | Outlook M365 |
| `*@noizyfish.ca` | Transfer from GoDaddy | Set up | Outlook M365 |
| `*@fishmusicinc.com` | Transfer from GoDaddy | Set up | Outlook M365 |
| `*@noizyvox.com` | ⚠ Register | Set up | Outlook M365 |
| `*@noizykidz.com` | ⚠ Register | Set up | Outlook M365 |

**Single verification**: `rsp@noizyfish.com` in Cloudflare destination addresses — verify once, applies to all.

---

## SEND ORDER OF OPERATIONS

1. ✅ `noizy.ai` — Email Routing already live
2. Transfer `noizyfish.com`, `noizyfish.ca`, `fishmusicinc.com` from GoDaddy → Cloudflare Registrar
3. Enable CF Email Routing on each transferred domain → add catch-all → `rsp@noizyfish.com`
4. Register `noizyvox.com` and `noizykidz.com` at Cloudflare Registrar → enable routing
5. In M365: add all brand domains as Accepted Domains → create shared mailboxes
6. In Outlook: verify all brand inboxes appear in sidebar — test send/receive each
