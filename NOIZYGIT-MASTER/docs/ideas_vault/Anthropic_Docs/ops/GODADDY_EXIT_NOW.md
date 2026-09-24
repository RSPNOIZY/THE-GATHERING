# GODADDY EXIT — EXECUTE NOW

**Date:** April 13, 2026 — 4 DAYS TO DEADLINE
**Operator:** RSP_001 + GABRIEL
**Goal:** Zero GoDaddy dependencies. Everything on Cloudflare.

---

## CURRENT STATE (verified by DNS scan April 13, 2026)

| Domain               | NS on Cloudflare?  | Registrar    | Email              | Action                             |
| -------------------- | :----------------: | ------------ | ------------------ | ---------------------------------- |
| **noizy.ai**         |        YES         | Cloudflare?  | Google MX + CF SPF | Verify registrar, fix MX conflict  |
| **noizyfish.com**    |  YES (marek+tara)  | GoDaddy      | CF Email Routing   | TRANSFER registrar to CF           |
| **fishmusicinc.com** | YES (alex+melinda) | GoDaddy      | CF Email Routing   | TRANSFER registrar to CF           |
| **noizyfish.ca**     |    **NXDOMAIN**    | GoDaddy/CIRA | DEAD               | CHECK IF EXPIRED → renew or let go |

---

## EXECUTE IN THIS ORDER

### STEP 0 — FIX CLAUDE CODE BASH (30 seconds)

Open a **regular Terminal** (not Claude Code) and run:

```bash
for f in ~/.claude/session-env/*/sessionstart-hook-0.sh; do
  sed -i '' 's/^export NOIZY_SESSION_START=\([0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]\) \([0-9][0-9]:[0-9][0-9]:[0-9][0-9]\)$/export NOIZY_SESSION_START="\1T\2"/' "$f"
  sed -i '' 's/^export NOIZY_PROJECT_ROOT=\(\/[^ ]*\)$/export NOIZY_PROJECT_ROOT="\1"/' "$f"
done
echo "Fixed all session env files"
```

Then restart Claude Code session.

---

### STEP 1 — CHANGE CLOUDFLARE LOGIN EMAIL (10 min)

**WHY THIS IS FIRST:** Your CF login is `rsp@noizyfish.com` which routes THROUGH Cloudflare. If email routing breaks during domain transfer, you're locked out of EVERYTHING — Workers, D1, KV, all of it.

1. Open: **https://dash.cloudflare.com**
2. Log in with current credentials
3. Click profile icon (top right) → **My Profile**
4. Find **Email Address** → Change to: `rsplowman@icloud.com`
5. Check your **iCloud inbox** for verification email → click verify link
6. **Log OUT completely**
7. **Log back IN** with `rsplowman@icloud.com` + your password
8. Verify: Can you see all zones? Workers? D1 databases?
9. **Enable 2FA** if not already active (Authenticator app)

**DONE CHECK:** You can log in with `rsplowman@icloud.com` and see everything.

---

### STEP 2 — CHECK NOIZYFISH.CA STATUS (5 min)

This domain returns **NXDOMAIN** — it's either expired or has no NS records at CIRA.

1. Log into **GoDaddy** → My Products → Domain Manager
2. Search for `noizyfish.ca`
3. **If it's there:** Check expiration date. If expired, renew immediately ($11.50).
4. **If it's NOT there:** It may have already been released by CIRA. Check https://www.cira.ca/en/whois/ for `noizyfish.ca`.
5. **Decision:**
   - If renewable → renew at GoDaddy, then transfer to CF
   - If gone → register fresh at Cloudflare Registrar (if available)
   - If too expensive or not critical → let it go

---

### STEP 3 — GET EPP/AUTH CODES FROM GODADDY (15 min)

For each domain you're transferring:

1. Go to: **https://dcc.godaddy.com** (Domain Control Center)
2. Click on each domain → **Transfer** tab (or "Transfer domain away from GoDaddy")
3. **Unlock the domain** if locked (turn off Transfer Lock)
4. Click **Get authorization code** → Copy it

| Domain           | Auth Code          | Got It? |
| ---------------- | ------------------ | :-----: |
| noizyfish.com    | `________________` |   [ ]   |
| fishmusicinc.com | `________________` |   [ ]   |
| noizyfish.ca     | `________________` |   [ ]   |
| noizy.ai         | `________________` |   [ ]   |

**NOTES:**

- `.ca` domains: CIRA may have a different process. GoDaddy should still provide the code.
- `.ai` domains: Requires 2+ years registration remaining. If under 2 years, **renew at GoDaddy first**.
- If GoDaddy says "domain was recently transferred" or "60-day lock" — you may need to wait. Tell me and we'll work around it.

---

### STEP 4 — VERIFY ZONES IN CLOUDFLARE (5 min)

All 4 domains should already be zones in Cloudflare (NS are already pointing there). Verify:

1. Go to: **https://dash.cloudflare.com**
2. You should see these zones listed:
   - [ ] noizy.ai — **Active**
   - [ ] noizyfish.com — **Active**
   - [ ] fishmusicinc.com — **Active**
   - [ ] noizyfish.ca — **Active** (if alive)

**If any domain is NOT listed as a zone:**

1. Click **Add a Site**
2. Enter the domain name
3. Select **Free** plan
4. CF scans existing DNS records → review and confirm
5. CF provides nameservers → these should already be set at GoDaddy

---

### STEP 5 — INITIATE DOMAIN TRANSFERS (30 min)

1. Go to: **https://dash.cloudflare.com** → **Domain Registration** → **Transfer Domains**
2. Enter domain name → CF checks eligibility
3. Enter the auth/EPP code from Step 3
4. Confirm contact info: `rsplowman@icloud.com` (NOT rsp@noizyfish.com)
5. Add payment method if needed (credit card)
6. Confirm transfer

**Do this for each domain:**

- [ ] `noizyfish.com` — ~$10.11/yr
- [ ] `fishmusicinc.com` — ~$10.11/yr
- [ ] `noizyfish.ca` — ~$11.50/yr (if alive)
- [ ] `noizy.ai` — ~$20/yr (check if already on CF Registrar)

**IMPORTANT:**

- GoDaddy will email you asking to approve the transfer → **APPROVE IT**
- `.com` transfers take 5-7 days (but often complete in hours if you approve quickly)
- `.ca` transfers: CIRA sends a registrant verification email AFTER transfer → **MUST complete it**
- `.ai` transfers: May take up to 10 days

---

### STEP 6 — CONFIGURE EMAIL ROUTING (15 min)

For each domain in Cloudflare:

1. Select the domain in CF Dashboard
2. Go to **Email** → **Email Routing**
3. **Enable Email Routing** (CF adds MX + SPF records automatically)
4. Add destination: `rsplowman@icloud.com` → verify if prompted
5. Create routing rules:

**noizy.ai:**
| Address | Forward To |
|---------|-----------|
| `rsp@noizy.ai` | rsplowman@icloud.com |
| `hello@noizy.ai` | rsplowman@icloud.com |
| `support@noizy.ai` | rsplowman@icloud.com |
| `gabriel@noizy.ai` | rsplowman@icloud.com |
| Catch-all (`*@noizy.ai`) | rsplowman@icloud.com |

**noizyfish.com:**
| Address | Forward To |
|---------|-----------|
| `rsp@noizyfish.com` | rsplowman@icloud.com |
| `hello@noizyfish.com` | rsplowman@icloud.com |
| `carolina@noizyfish.com` | rsplowman@icloud.com |
| Catch-all (`*@noizyfish.com`) | rsplowman@icloud.com |

**fishmusicinc.com:**
| Address | Forward To |
|---------|-----------|
| `rsp@fishmusicinc.com` | rsplowman@icloud.com |
| `info@fishmusicinc.com` | rsplowman@icloud.com |
| Catch-all (`*@fishmusicinc.com`) | rsplowman@icloud.com |

**noizyfish.ca (if alive):**
| Address | Forward To |
|---------|-----------|
| `rsp@noizyfish.ca` | rsplowman@icloud.com |
| Catch-all (`*@noizyfish.ca`) | rsplowman@icloud.com |

**⚠️ IMPORTANT — noizy.ai MX CONFLICT:**
The DNS scan found Google Workspace MX records on noizy.ai (aspmx.l.google.com). If you're NOT using Google Workspace, these need to be REMOVED before enabling CF Email Routing. CF Email Routing and Google MX cannot coexist.

**If you ARE setting up Google Workspace:** Skip CF Email Routing for noizy.ai — Google handles the email.
**If you are NOT:** Remove the Google MX records in CF DNS, then enable CF Email Routing.

---

### STEP 7 — ADD EMAIL AUTHENTICATION RECORDS (10 min)

In Terminal (after Claude Code Bash is fixed, or in regular terminal):

```bash
cd ~/NOIZYANTHROPIC

# DMARC for noizy.ai
npx wrangler dns record create noizy.ai --type=TXT --name=_dmarc --content='v=DMARC1; p=quarantine; rua=mailto:rsp@noizy.ai; pct=100'

# DMARC for noizyfish.com
npx wrangler dns record create noizyfish.com --type=TXT --name=_dmarc --content='v=DMARC1; p=quarantine; rua=mailto:rsp@noizy.ai; pct=100'

# DMARC for fishmusicinc.com
npx wrangler dns record create fishmusicinc.com --type=TXT --name=_dmarc --content='v=DMARC1; p=quarantine; rua=mailto:rsp@noizy.ai; pct=100'

# DMARC for noizyfish.ca (if alive)
npx wrangler dns record create noizyfish.ca --type=TXT --name=_dmarc --content='v=DMARC1; p=quarantine; rua=mailto:rsp@noizy.ai; pct=100'
```

**SPF records** — CF Email Routing adds these automatically. Verify each domain has:

```
v=spf1 include:_spf.mx.cloudflare.net ~all
```

**DKIM** — If using Google Workspace for noizy.ai:

1. Google Admin Console → Apps → Gmail → Authenticate email
2. Google generates a TXT record → add it to CF DNS for noizy.ai

---

### STEP 8 — DEPLOY LANDING PAGE TO NOIZY.AI (5 min)

Once noizy.ai zone is fully under control:

```bash
cd ~/NOIZYANTHROPIC/noizy-landing
# Uncomment the custom domain routes in wrangler.toml
npx wrangler deploy
```

---

### STEP 9 — VERIFY EVERYTHING (15 min)

```bash
# DNS checks
dig noizy.ai NS +short          # Should show *.ns.cloudflare.com
dig noizyfish.com NS +short     # Should show *.ns.cloudflare.com
dig fishmusicinc.com NS +short  # Should show *.ns.cloudflare.com

# MX checks
dig noizy.ai MX +short          # CF Email Routing or Google MX
dig noizyfish.com MX +short     # route*.mx.cloudflare.net
dig fishmusicinc.com MX +short  # route*.mx.cloudflare.net

# DMARC checks
dig _dmarc.noizy.ai TXT +short
dig _dmarc.noizyfish.com TXT +short
dig _dmarc.fishmusicinc.com TXT +short

# SPF checks
dig noizy.ai TXT +short | grep spf
dig noizyfish.com TXT +short | grep spf

# Worker health
curl https://heaven.rsp-5f3.workers.dev/health

# Landing page
curl -sI https://noizy.ai/ | head -5

# Email test — send from external account
echo "Test from GOD.local" | mail -s "NOIZY EXIT TEST" rsp@noizy.ai
echo "Test from GOD.local" | mail -s "NOIZY EXIT TEST" rsp@noizyfish.com
```

---

### STEP 10 — CANCEL GODADDY (after transfers complete)

**ONLY after ALL domain transfers show "Complete" in Cloudflare Dashboard:**

1. Log into each GoDaddy account
2. Cancel all remaining services:
   - [ ] Auto-renew OFF on all domains (should already be transferred)
   - [ ] Cancel Microsoft 365 / email hosting
   - [ ] Cancel any privacy protection add-ons
   - [ ] Cancel any SSL certificates
3. Download any invoices/records you want to keep
4. Close the account(s)

**TOTAL FREEDOM.**

---

## DECISION POINTS (need your answer)

1. **noizyfish.ca** — Is it alive in GoDaddy? Renew or let go?
2. **Google Workspace** — Did you start setting it up? (Google MX records exist on noizy.ai)
3. **noizy.ai registrar** — Is noizy.ai already registered at Cloudflare? Or still GoDaddy?
4. **M365 email** — Are you currently using Microsoft 365 for rsp@noizyfish.com? If yes, when can we kill it?

---

## COST SUMMARY

| Item                           | Cost           |
| ------------------------------ | -------------- |
| noizyfish.com transfer         | ~$10.11/yr     |
| fishmusicinc.com transfer      | ~$10.11/yr     |
| noizyfish.ca transfer          | ~$11.50/yr     |
| noizy.ai (if transfer needed)  | ~$20/yr        |
| Cloudflare DNS                 | FREE           |
| Cloudflare Email Routing       | FREE           |
| Cloudflare Workers (free tier) | FREE           |
| **GoDaddy after exit**         | **$0 FOREVER** |

---

_"TOTAL FREEDOM." — RSP_001, April 13, 2026_
