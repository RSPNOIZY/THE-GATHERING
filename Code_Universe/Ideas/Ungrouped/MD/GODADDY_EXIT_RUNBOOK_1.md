# NOIZY EMPIRE — GoDaddy Exit Runbook

**Version:** 1.0
**Date:** April 13, 2026
**Operator:** RSP_001 + GABRIEL
**Deadline:** April 17, 2026

---

## Pre-Flight Checks

- [ ] Cloudflare Dashboard accessible at dash.cloudflare.com
- [ ] GoDaddy Dashboard accessible at dcc.godaddy.com
- [ ] Google Cloud Console accessible at console.cloud.google.com
- [ ] Terminal available on GOD.local (M2 Ultra)
- [ ] `.env` file present in ~/NOIZYANTHROPIC
- [ ] wrangler authenticated (`npx wrangler whoami`)

---

## Phase 1: Secure Cloudflare Access (BLOCKING)

### 1.1 Change Cloudflare Login Email

**Risk:** HIGH — Circular dependency. CF login routes through CF email routing.

| Step | Action                                                     | Verify             |
| ---- | ---------------------------------------------------------- | ------------------ |
| 1    | Open dash.cloudflare.com                                   | Dashboard loads    |
| 2    | Profile icon → My Profile                                  | Profile page opens |
| 3    | Email Address → Change to `rsplowman@icloud.com`           | Field updated      |
| 4    | Check iCloud inbox → Click verification link               | Email received     |
| 5    | Log OUT completely                                         | Session ended      |
| 6    | Log IN with `rsplowman@icloud.com`                         | Dashboard loads    |
| 7    | Verify: Workers visible? D1 databases visible? KV visible? | All present        |
| 8    | Enable 2FA (Authenticator app)                             | 2FA active         |

**Rollback:** If verification email doesn't arrive, email still routes through CF. Login unchanged. No risk.

**DONE signal:** `curl https://heaven.rsp-5f3.workers.dev/health` still responds.

---

## Phase 2: Domain Inventory & EPP Codes

### 2.1 Verify Domain Status in GoDaddy

| Step | Action                        | Expected                  |
| ---- | ----------------------------- | ------------------------- |
| 1    | Login to dcc.godaddy.com      | Dashboard loads           |
| 2    | List all domains              | See inventory             |
| 3    | Check noizy.ai                | Active, GoDaddy registrar |
| 4    | Check noizyfish.com           | Active, expires Aug 2027  |
| 5    | Check fishmusicinc.com        | Active, expires Jan 2031  |
| 6    | Check noizyfish.ca            | Active or Expired?        |
| 7    | Note expiration dates for all | Record in table below     |

**Record:**

| Domain           | Status | Expires    | Lock Status | EPP Code |
| ---------------- | ------ | ---------- | ----------- | -------- |
| noizy.ai         |        |            |             |          |
| noizyfish.com    | Active | 2027-08-16 |             |          |
| fishmusicinc.com | Active | 2031-01-27 |             |          |
| noizyfish.ca     |        |            |             |          |

### 2.2 Unlock Domains & Get EPP Codes

For EACH domain:

| Step | Action                                    | Verify          |
| ---- | ----------------------------------------- | --------------- |
| 1    | Click domain → Domain Settings            | Settings page   |
| 2    | Find "Transfer Lock" → Turn OFF           | Lock disabled   |
| 3    | Wait 60 seconds                           | Lock propagates |
| 4    | Click "Transfer domain away from GoDaddy" | Transfer page   |
| 5    | Click "Get authorization code"            | Code displayed  |
| 6    | Copy EPP code → paste in table above      | Code saved      |

**IMPORTANT:** Do NOT cancel auto-renew yet. Do NOT delete any DNS records.

---

## Phase 3: Initiate Cloudflare Transfers

### 3.1 Verify Zones Exist

| Step | Action                                           | Verify          |
| ---- | ------------------------------------------------ | --------------- |
| 1    | dash.cloudflare.com → Websites                   | Zone list       |
| 2    | Confirm noizy.ai shows "Active"                  | Green checkmark |
| 3    | Confirm noizyfish.com shows "Active"             | Green checkmark |
| 4    | Confirm fishmusicinc.com shows "Active"          | Green checkmark |
| 5    | If noizyfish.ca missing → Add a Site → Free plan | Zone added      |

### 3.2 Transfer Registrar

| Step | Action                                               | Verify              |
| ---- | ---------------------------------------------------- | ------------------- |
| 1    | dash.cloudflare.com → Domain Registration → Transfer | Transfer page       |
| 2    | Enter: noizyfish.com                                 | Domain found        |
| 3    | Paste EPP code for noizyfish.com                     | Code accepted       |
| 4    | Repeat for fishmusicinc.com                          | Code accepted       |
| 5    | Repeat for noizyfish.ca (if alive)                   | Code accepted       |
| 6    | Repeat for noizy.ai                                  | Code accepted       |
| 7    | Confirm contact: rsplowman@icloud.com                | Correct             |
| 8    | Add payment method if needed                         | Card on file        |
| 9    | Confirm all transfers                                | Transfers initiated |

**Cost:**

- .com: ~$10.11/yr each
- .ca: ~$11.50/yr
- .ai: ~$20/yr (2-year minimum)

### 3.3 Approve at GoDaddy

| Step | Action                                                    | Verify          |
| ---- | --------------------------------------------------------- | --------------- |
| 1    | Check email for GoDaddy transfer approval requests        | Emails received |
| 2    | Click "Approve transfer" for each domain                  | Approved        |
| 3    | OR: dcc.godaddy.com → Transfers → Transfers Out → Approve | Approved        |

**Timeline:** .com transfers: 5-7 days (often hours if approved quickly). .ca: 5-7 days + CIRA verification.

---

## Phase 4: Email Routing Configuration

### 4.1 Set Up Cloudflare Email Routing

For EACH domain in Cloudflare:

| Step | Action                                             | Verify           |
| ---- | -------------------------------------------------- | ---------------- |
| 1    | Select domain → Email → Email Routing              | Email page       |
| 2    | Click "Enable Email Routing"                       | MX records added |
| 3    | Add destination: rsplowman@icloud.com              | Verified         |
| 4    | Create rule: rsp@[domain] → rsplowman@icloud.com   | Rule active      |
| 5    | Enable Catch-all → Forward to rsplowman@icloud.com | Catch-all on     |

**Special case — noizy.ai:**
If Google Workspace is active, SKIP CF Email Routing for noizy.ai. Google MX handles email.
If Google Workspace is NOT active, remove Google MX records first, then enable CF Email Routing.

### 4.2 Email Authentication (CLI)

```bash
cd ~/NOIZYANTHROPIC

# DMARC
for domain in noizy.ai noizyfish.com fishmusicinc.com noizyfish.ca; do
  npx wrangler dns record create "$domain" \
    --type=TXT --name=_dmarc \
    --content='v=DMARC1; p=quarantine; rua=mailto:rsp@noizy.ai; pct=100'
done

# SPF (CF Email Routing adds automatically, verify)
for domain in noizy.ai noizyfish.com fishmusicinc.com noizyfish.ca; do
  echo "=== $domain SPF ==="
  dig "$domain" TXT +short | grep spf
done

# DKIM (from Google Admin if using Workspace)
# Google Admin → Apps → Gmail → Authenticate email → Generate DKIM key
# Add TXT record: google._domainkey.[domain] → [key from Google]
```

---

## Phase 5: Deploy Landing Page

### 5.1 Activate Custom Domain Routes

```bash
cd ~/NOIZYANTHROPIC/noizy-landing

# Uncomment routes in wrangler.toml
cat > wrangler.toml << 'EOF'
name = "noizy-landing"
account_id = "5f36aa9795348ea681d0b21910dfc82a"
main = "src/index.js"
compatibility_date = "2025-01-01"
workers_dev = true

routes = [
  { pattern = "noizy.ai/*", zone_name = "noizy.ai" },
  { pattern = "noizy.ai", zone_name = "noizy.ai" }
]
EOF

npx wrangler deploy
```

### 5.2 Verify

```bash
curl -sI https://noizy.ai/ | head -5
# Should return HTTP/2 200

curl -s https://heaven.rsp-5f3.workers.dev/health
# Should return {"success": true, ...}
```

---

## Phase 6: Google Cloud & Workspace Setup

### 6.1 Fix GCP Project

```bash
# In Google Cloud Shell (console.cloud.google.com → >_ icon)
gcloud projects create noizy-empire-01 --name="NOIZY Empire"
gcloud config set project noizy-empire-01
gcloud services enable cloudaicompanion.googleapis.com
```

### 6.2 Google Workspace Setup

| Step | Action                                       | Verify           |
| ---- | -------------------------------------------- | ---------------- |
| 1    | Go to workspace.google.com → Get Started     | Signup page      |
| 2    | Plan: Business Starter ($7.20 CAD/mo)        | Plan selected    |
| 3    | Business name: NOIZY Labs                    | Entered          |
| 4    | Domain: noizy.ai (I already own it)          | Domain entered   |
| 5    | Admin user: rsp@noizy.ai                     | Created          |
| 6    | Google gives TXT verification record         | Record displayed |
| 7    | Add TXT record to noizy.ai in Cloudflare DNS | Record added     |
| 8    | Click Verify in Google Admin                 | Domain verified  |
| 9    | Google Workspace active                      | Dashboard loads  |

**MX records** — Already present on noizy.ai (aspmx.l.google.com). Google Workspace should activate immediately.

---

## Phase 7: Verification & Closeout

### 7.1 Full Verification Script

```bash
bash ~/NOIZYANTHROPIC/ops/godaddy-exit-execute.sh  # Full scan
bash ~/NOIZYANTHROPIC/ops/godaddy-exit-dns.sh      # DNS records
bash ~/NOIZYANTHROPIC/ops/godaddy-exit-deploy.sh   # Deploy + test
```

### 7.2 Manual Verification Checklist

| Check               | Command/Action                                   | Expected             |
| ------------------- | ------------------------------------------------ | -------------------- |
| noizy.ai NS         | `dig noizy.ai NS +short`                         | \*.ns.cloudflare.com |
| noizyfish.com NS    | `dig noizyfish.com NS +short`                    | \*.ns.cloudflare.com |
| fishmusicinc.com NS | `dig fishmusicinc.com NS +short`                 | \*.ns.cloudflare.com |
| noizy.ai email      | Send test to rsp@noizy.ai                        | Arrives in inbox     |
| noizyfish.com email | Send test to rsp@noizyfish.com                   | Arrives in inbox     |
| DMARC               | `dig _dmarc.noizy.ai TXT +short`                 | v=DMARC1; ...        |
| Heaven              | `curl https://heaven.rsp-5f3.workers.dev/health` | {"success": true}    |
| Landing             | `curl -sI https://noizy.ai/`                     | HTTP/2 200           |
| Smoke tests         | `bash smoke_test.sh`                             | 22/22 passing        |

### 7.3 Cancel GoDaddy

**ONLY after all transfers show "Complete" in Cloudflare:**

| Step | Action                                     | Verify         |
| ---- | ------------------------------------------ | -------------- |
| 1    | dcc.godaddy.com → confirm 0 domains remain | Empty          |
| 2    | Cancel auto-renew on everything            | Cancelled      |
| 3    | Cancel M365/email hosting                  | Cancelled      |
| 4    | Cancel privacy protection                  | Cancelled      |
| 5    | Download invoices                          | Saved          |
| 6    | Close account                              | Account closed |

---

## Rollback Procedures

| Scenario            | Action                                                                  |
| ------------------- | ----------------------------------------------------------------------- |
| Transfer fails      | Cancel transfer in CF (first 5 days). Domain stays at GoDaddy.          |
| Email stops working | Point MX back to original. CF Email Routing can be disabled per-domain. |
| CF login locked out | Use rsplowman@icloud.com to recover. 2FA backup codes.                  |
| Landing page broken | Revert wrangler.toml routes. Workers.dev URL still works.               |

---

_"TOTAL FREEDOM." — RSP_001_
