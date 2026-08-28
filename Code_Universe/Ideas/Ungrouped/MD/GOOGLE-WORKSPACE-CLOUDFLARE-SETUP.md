# Google Workspace & Cloudflare DNS Setup Guide

**Author:** Robert Stephen Plowman  
**Date:** 2026-04-13  
**Purpose:** Configuring Google Workspace email and services with Cloudflare DNS for NOIZY.AI domain

---

## 1. Prerequisites

Before beginning DNS configuration, ensure the following are in place:

### Domain Setup in Cloudflare

- [ ] Domain `noizy.ai` is added to Cloudflare account
- [ ] Nameservers have been updated at domain registrar to point to Cloudflare
- [ ] Domain status shows **Active** in Cloudflare dashboard
- [ ] SSL/TLS certificate has been issued (usually automatic)

**Verification:**
```bash
# Check nameserver propagation
dig noizy.ai NS +short

# Should return Cloudflare nameservers like:
# ns1.cloudflare.com
# ns2.cloudflare.com
```

### Google Workspace Subscription

- [ ] Google Workspace subscription is active and paid
- [ ] Billing account is configured
- [ ] At least one user account has been created
- [ ] Admin account has full access to admin.google.com

### Administrative Access

- [ ] Access to [admin.google.com](https://admin.google.com) with Super Admin credentials
- [ ] Access to Cloudflare dashboard with administrative privileges
- [ ] Ability to verify domain ownership in Google Search Console

---

## 2. MX Records Configuration

MX (Mail Exchange) records direct email traffic to Google's servers. These must be configured precisely in Cloudflare.

### MX Records - Exact Values

Configure the following MX records in Cloudflare DNS:

| Priority | Name | Type | Content | TTL | Proxy Status |
|----------|------|------|---------|-----|-------------|
| 1 | noizy.ai | MX | ASPMX.L.GOOGLE.COM | 3600 | DNS only (gray cloud) |
| 5 | noizy.ai | MX | ALT1.ASPMX.L.GOOGLE.COM | 3600 | DNS only (gray cloud) |
| 5 | noizy.ai | MX | ALT2.ASPMX.L.GOOGLE.COM | 3600 | DNS only (gray cloud) |
| 10 | noizy.ai | MX | ALT3.ASPMX.L.GOOGLE.COM | 3600 | DNS only (gray cloud) |
| 10 | noizy.ai | MX | ALT4.ASPMX.L.GOOGLE.COM | 3600 | DNS only (gray cloud) |

### Adding MX Records in Cloudflare UI

1. Log into [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select domain: **noizy.ai**
3. Navigate to **DNS** → **Records**
4. Click **+ Add Record**
5. Configure each record:
   - **Type:** MX
   - **Name:** noizy.ai (or @ for root)
   - **Mail Server:** (see table above)
   - **Priority:** (see table above)
   - **TTL:** Auto (or 3600)
   - **Proxy Status:** DNS only (gray cloud - NOT orange cloud)

### Important: Proxy Status Must Be DNS Only

MX records **MUST** have proxy status set to **DNS only (gray cloud)**. If set to Cloudflare proxy (orange cloud), mail will fail to deliver because Cloudflare cannot proxy SMTP.

**Verification:**
```bash
# Check MX records are properly configured
dig noizy.ai MX +short

# Should return all 5 records with correct priorities:
# 10 ALT4.ASPMX.L.GOOGLE.COM.
# 10 ALT3.ASPMX.L.GOOGLE.COM.
# 5 ALT2.ASPMX.L.GOOGLE.COM.
# 5 ALT1.ASPMX.L.GOOGLE.COM.
# 1 ASPMX.L.GOOGLE.COM.
```

---

## 3. Email Authentication

Email authentication prevents spoofing and improves deliverability. Configure SPF, DKIM, and DMARC.

### SPF (Sender Policy Framework)

SPF authorizes mail servers to send emails on behalf of your domain.

**SPF Record Value:**
```
v=spf1 include:_spf.google.com ~all
```

**Configuration in Cloudflare:**

| Type | Name | Content | TTL | Proxy |
|------|------|---------|-----|-------|
| TXT | noizy.ai | v=spf1 include:_spf.google.com ~all | 3600 | DNS only |

**Steps:**
1. Go to **DNS** → **Records** in Cloudflare
2. Click **+ Add Record**
3. **Type:** TXT
4. **Name:** noizy.ai (or @)
5. **Content:** `v=spf1 include:_spf.google.com ~all`
6. **Proxy Status:** DNS only
7. Save

**SPF Breakdown:**
- `v=spf1` - SPF version 1
- `include:_spf.google.com` - Include Google's SPF record
- `~all` - Soft fail for unauthorized servers (use `-all` for strict)

### DKIM (DomainKeys Identified Mail)

DKIM adds cryptographic signature to emails, proving they came from your domain.

**Setup Steps:**

1. Go to [admin.google.com](https://admin.google.com)
2. Navigate to **Apps** → **Google Workspace** → **Gmail**
3. Click **Authenticate email**
4. Select domain: **noizy.ai**
5. Google generates DKIM record details including:
   - **Selector:** (usually `google` or similar)
   - **Public Key:** (long cryptographic key)
6. Add CNAME record to Cloudflare DNS:

| Type | Name | Content | TTL | Proxy |
|------|------|---------|-----|-------|
| CNAME | google._domainkey.noizy.ai | google.c.noizy.ai._domainkey.goog. | 3600 | DNS only |

**Example DKIM Record:**
```
CNAME: google._domainkey.noizy.ai
Points to: google.c.noizy.ai._domainkey.goog.
```

**Verification:**
```bash
# Check DKIM record
dig google._domainkey.noizy.ai CNAME +short

# Should return: google.c.noizy.ai._domainkey.goog.
```

### DMARC (Domain-based Message Authentication, Reporting & Conformance)

DMARC tells receiving servers how to handle emails that fail SPF/DKIM.

**Recommended DMARC Policy (Progressive Rollout):**

1. **Phase 1 (Monitoring):** Start with `p=none`
   ```
   v=DMARC1; p=none; rua=mailto:dmarc-reports@noizy.ai; ruf=mailto:dmarc-forensics@noizy.ai
   ```

2. **Phase 2 (After 1-2 weeks):** Escalate to `p=quarantine`
   ```
   v=DMARC1; p=quarantine; rua=mailto:dmarc-reports@noizy.ai; ruf=mailto:dmarc-forensics@noizy.ai
   ```

3. **Phase 3 (After 2-4 weeks):** Final enforcement with `p=reject`
   ```
   v=DMARC1; p=reject; rua=mailto:dmarc-reports@noizy.ai; ruf=mailto:dmarc-forensics@noizy.ai
   ```

**Configuration in Cloudflare:**

| Type | Name | Content | TTL | Proxy |
|------|------|---------|-----|-------|
| TXT | _dmarc.noizy.ai | v=DMARC1; p=none; rua=mailto:dmarc-reports@noizy.ai; ruf=mailto:dmarc-forensics@noizy.ai | 3600 | DNS only |

**DMARC Tag Reference:**
- `v=DMARC1` - DMARC version
- `p=none` - Monitor only, don't take action
- `p=quarantine` - Move failing emails to spam
- `p=reject` - Reject failing emails outright
- `rua=` - Where to send aggregate reports (weekly)
- `ruf=` - Where to send forensic reports (immediate for failures)

**Setup Instructions:**
1. Start with `p=none` and create email addresses for reports
2. Monitor reports at dmarc-reports@noizy.ai and dmarc-forensics@noizy.ai
3. After validating SPF/DKIM alignment, escalate to `p=quarantine`
4. After 2+ weeks with no issues, escalate to `p=reject`

---

## 4. Additional Google Services DNS

Beyond Gmail, other Google Workspace services may need DNS records.

### Google Sites (if using custom domain)

For custom domains on Google Sites:

| Type | Name | Content | TTL | Proxy |
|------|------|---------|-----|-------|
| CNAME | sites.noizy.ai | ghs.googlehosted.com | 3600 | DNS only |

**Setup:**
1. In Google Sites, navigate to **Settings** → **Publish**
2. Add custom domain: `sites.noizy.ai`
3. Add CNAME record to Cloudflare as shown above

### Google Search Console Verification

Add verification TXT record to prove domain ownership:

| Type | Name | Content | TTL | Proxy |
|------|------|---------|-----|-------|
| TXT | noizy.ai | google-site-verification=VERIFICATION_CODE | 3600 | DNS only |

**Steps:**
1. Go to [Google Search Console](https://search.google.com/search-console)
2. Click **Add property**
3. Select **URL prefix** and enter `https://noizy.ai`
4. Google provides verification code
5. Add TXT record to Cloudflare with the provided code

### Calendar Interoperability (Optional)

For shared calendar URLs and interop:

| Type | Name | Content | TTL | Proxy |
|------|------|---------|-----|-------|
| CNAME | calendar.noizy.ai | ghs.googlehosted.com | 3600 | DNS only |

---

## 5. Cloudflare-Specific Settings

### SSL/TLS Mode Configuration

For Google Workspace compatibility, use **Full (strict)** mode:

1. Navigate to **SSL/TLS** → **Overview** in Cloudflare
2. Set **SSL/TLS encryption mode** to: **Full (strict)**
   - This ensures Cloudflare validates the origin certificate
   - Required for Google services to work properly

**Why not Flexible mode:**
- Flexible allows unencrypted traffic between Cloudflare and origin
- Google services require strict SSL validation
- Use Full or Full (strict) only

### Email Routing Configuration

Cloudflare Email Routing can coexist with Google Workspace but requires careful MX configuration.

**If using Email Routing:**
1. Go to **Email Routing** in Cloudflare
2. Set catch-all rule to forward to Google Workspace addresses
3. Ensure MX records point to Google (not Cloudflare)

**Recommended:** Use Google Workspace for mail and disable Cloudflare Email Routing to avoid conflicts.

### Cloudflare Access (Zero Trust) for Admin Panels

Protect your Google Admin panel with Cloudflare Access:

1. Navigate to **Zero Trust** → **Access** → **Applications**
2. Create application for: `admin.google.com`
3. Set policy requiring authentication via SSO
4. Configure allowed email domains
5. Add Cloudflare tunnel to route traffic securely

### Page Rules / Cache Rules for Google Subdomains

Prevent caching of Google-related subdomains:

1. Go to **Caching** → **Cache Rules** (or Page Rules in older plans)
2. Create rule for pattern: `*.google.com/*`
3. Set cache level to: **Bypass**

| URL Pattern | Cache Level | TTL | Reason |
|-------------|-------------|-----|--------|
| admin.google.com/* | Bypass | - | Admin panel must be fresh |
| drive.google.com/* | Bypass | - | Docs/Drive require real-time |
| accounts.google.com/* | Bypass | - | Authentication must not cache |
| mail.google.com/* | Bypass | - | Email must be real-time |

---

## 6. Verification Steps

After configuration, verify everything is working correctly.

### Step 1: Send Test Email

1. Create test account in Google Admin: `test@noizy.ai`
2. From external email account, send test email to `test@noizy.ai`
3. Check if email arrives in inbox
4. Reply and verify sender is recognized as `test@noizy.ai`

### Step 2: Check MX Lookup

```bash
# Using dig (preferred)
dig noizy.ai MX +short

# Expected output (in some order):
# 1 ASPMX.L.GOOGLE.COM.
# 5 ALT1.ASPMX.L.GOOGLE.COM.
# 5 ALT2.ASPMX.L.GOOGLE.COM.
# 10 ALT3.ASPMX.L.GOOGLE.COM.
# 10 ALT4.ASPMX.L.GOOGLE.COM.

# Using nslookup
nslookup -type=MX noizy.ai

# Using mxtoolbox (web tool)
# Visit: https://mxtoolbox.com
# Enter domain: noizy.ai
```

### Step 3: Verify SPF/DKIM/DMARC

```bash
# Check SPF record
dig noizy.ai TXT +short | grep v=spf1

# Expected: v=spf1 include:_spf.google.com ~all

# Check DKIM record
dig google._domainkey.noizy.ai CNAME +short

# Expected: google.c.noizy.ai._domainkey.goog.

# Check DMARC record
dig _dmarc.noizy.ai TXT +short

# Expected: v=DMARC1; p=none; rua=...
```

### Step 4: Use Mail Tester Service

1. Go to [mail-tester.com](https://mail-tester.com)
2. Note the unique test email address provided
3. Send test email from Gmail account to that address
4. Click "Then Check Your Score"
5. Review results for:
   - SPF: Should show **PASS**
   - DKIM: Should show **PASS**
   - DMARC: Should show **PASS** or **NEUTRAL**
   - Reverse DNS: Check for any issues
   - SPF/DKIM alignment: Should be **PASS**

### Step 5: Confirm Google Admin Shows Domain as Verified

1. Go to [admin.google.com](https://admin.google.com)
2. Navigate to **Domains** (under Account settings)
3. Verify that `noizy.ai` shows status as **Verified**
4. All DNS records should show green checkmarks

---

## Common Issues and Troubleshooting

### Issue: Emails Not Delivering

**Symptoms:** Emails sent to @noizy.ai addresses bounce or don't arrive

**Diagnosis:**
```bash
# Check if MX records are configured
dig noizy.ai MX +short

# Check SPF record
dig noizy.ai TXT +short | grep spf

# Verify no SMTP is being blocked by Cloudflare
# (Should not happen with DNS only proxy status)
```

**Solutions:**
1. Verify MX records have **DNS only** proxy status (gray cloud)
2. Wait 24-48 hours for DNS propagation after changes
3. Clear DNS cache: `ipconfig /flushdns` (Windows) or `sudo dscacheutil -flushcache` (macOS)
4. Verify SPF record is exactly: `v=spf1 include:_spf.google.com ~all`

### Issue: SPF/DKIM/DMARC Showing Red on Mail Tester

**Symptoms:** Mail-tester shows failures for authentication records

**Solutions:**
1. **SPF:** Ensure record includes `~all` not `-all` initially
2. **DKIM:** Verify CNAME record matches exactly what Google provided
3. **DMARC:** Check `rua=` and `ruf=` email addresses are valid and monitored

### Issue: Google Admin Shows "DNS record not found"

**Symptoms:** Domain not verifying in Google Admin despite MX records being present

**Diagnosis:**
- DNS propagation may be incomplete
- Records may be misconfigured
- Browser DNS cache may be stale

**Solutions:**
1. Clear Cloudflare cache: Go to **Caching** → **Configuration** → **Purge Everything**
2. Wait 5-10 minutes for Cloudflare edge cache to clear
3. Try different browser or incognito mode
4. Use DNS checking tool to verify records are live globally: https://www.whatsmydns.net/

---

## Summary Table: All DNS Records

Complete list of all records needed for NOIZY.AI with Google Workspace and Cloudflare:

| Type | Name | Content | TTL | Proxy | Priority |
|------|------|---------|-----|-------|----------|
| MX | noizy.ai | ASPMX.L.GOOGLE.COM | 3600 | DNS only | 1 |
| MX | noizy.ai | ALT1.ASPMX.L.GOOGLE.COM | 3600 | DNS only | 5 |
| MX | noizy.ai | ALT2.ASPMX.L.GOOGLE.COM | 3600 | DNS only | 5 |
| MX | noizy.ai | ALT3.ASPMX.L.GOOGLE.COM | 3600 | DNS only | 10 |
| MX | noizy.ai | ALT4.ASPMX.L.GOOGLE.COM | 3600 | DNS only | 10 |
| TXT | noizy.ai | v=spf1 include:_spf.google.com ~all | 3600 | DNS only | - |
| CNAME | google._domainkey.noizy.ai | google.c.noizy.ai._domainkey.goog. | 3600 | DNS only | - |
| TXT | _dmarc.noizy.ai | v=DMARC1; p=none; rua=... | 3600 | DNS only | - |
| TXT | noizy.ai | google-site-verification=CODE | 3600 | DNS only | - |
| CNAME | sites.noizy.ai | ghs.googlehosted.com | 3600 | DNS only | - |

---

## Next Steps

1. Configure all MX records first
2. Add SPF TXT record
3. Set up DKIM via Google Admin
4. Configure DMARC starting with p=none
5. Verify all records are resolving correctly
6. Monitor DMARC reports for 1-2 weeks
7. Escalate DMARC policy to p=quarantine after validation
8. After another 2 weeks with no issues, escalate to p=reject
9. Add additional services (Sites, Search Console, etc.) as needed

---

**End of Document**
