# GoDaddy Domain Portfolio Audit

## Login
- Go to: **godaddy.com**
- Sign in (Apple/Passkey if available)

---

## Step 1: Export Domain List

1. Go to: **My Products** → **Domains**
2. Screenshot or list ALL domains
3. Note for each:
   - Domain name
   - Expiration date
   - Auto-renew status (ON/OFF)
   - Where DNS points (GoDaddy, Cloudflare, other)

---

## Step 2: Categorize Each Domain

| Category | Action |
|----------|--------|
| **KEEP** | Transfer DNS to Cloudflare (iCloud account) |
| **DUMP** | Turn off auto-renew, let expire |
| **SELL** | List on aftermarket or park |
| **REDIRECT** | Point to main domain |

---

## Step 3: For KEEP Domains

1. Change nameservers to Cloudflare:
   - NS1: `*.ns.cloudflare.com`
   - NS2: `*.ns.cloudflare.com`
   (Exact values shown when you add domain to Cloudflare)

2. Add to Cloudflare (rsplowman@icloud.com account)
3. Set up DNS records

---

## Step 4: For DUMP Domains

1. Turn OFF auto-renew
2. Remove from Cloudflare (if applicable)
3. Let expire

---

## Step 5: Cancel Unused GoDaddy Services

Check for and cancel:
- [ ] Hosting plans
- [ ] Email plans (if using M365)
- [ ] SSL certificates (Cloudflare provides free)
- [ ] Privacy protection (evaluate if needed)
- [ ] Website builder
- [ ] Any other subscriptions

---

## Known Domains (from this session)

| Domain | Decision | Notes |
|--------|----------|-------|
| fishmusicinc.com | KEEP | M365 email, Cloudflare DNS |
| noizylab.ca | DUMPED | Done |
| noizfish.com | DUMP | In progress |

---

## Questions to Answer

1. How many total domains in GoDaddy?
2. Which ones are actively used?
3. Which ones have email attached?
4. Total annual cost for renewals?
5. Any domains worth selling?
