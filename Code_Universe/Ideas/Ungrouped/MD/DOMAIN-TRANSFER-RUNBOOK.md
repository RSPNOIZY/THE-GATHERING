# Domain Transfer Runbook: GoDaddy → Cloudflare Registrar

**Author:** Robert Stephen Plowman  
**Date:** 2026-04-13  
**Objective:** Transfer ALL domains from GoDaddy to Cloudflare Registrar  
**Cloudflare Account:** Fishmusicinc (ID: 2446d788cc4280f5ea22a9948410c355)

---

## Overview

This runbook documents the complete process for transferring domains from GoDaddy's registrar service to Cloudflare Registrar. The transfer process requires careful coordination of DNS changes, authorization codes, and account management to ensure zero downtime and preserve all critical DNS records (especially Google Workspace email routing).

**Estimated Timeline:** 5-7 days per domain (after pre-transfer prep completed)

---

## 1. Pre-Transfer Checklist

Complete ALL items in this section before initiating any domain transfers.

### 1.1 Inventory and Documentation

- [ ] **Log into GoDaddy account** and access domain management console
- [ ] **Document all domains** being transferred
  - Create a spreadsheet with: Domain name, Expiration date, Auto-renew status, Current registrar lock status
- [ ] **Verify expiration dates**
  - All domains must be current (not expired) to transfer
  - Renewal deadlines should be noted for post-transfer setup
- [ ] **Check domain age requirement**
  - Domains must have been registered at GoDaddy for 60+ days
  - If domain is newer, wait until 60+ days have passed before requesting transfer
- [ ] **Document all current DNS records** for each domain
  - Export or screenshot all DNS records from GoDaddy DNS management
  - Special attention to: MX records, TXT records (SPF, DKIM, DMARC), A records, CNAME records, Google site verification
  - Store in a secure location (spreadsheet or text file)

### 1.2 GoDaddy Account Preparation

For **each domain**, complete these steps:

- [ ] **Disable WHOIS privacy / Domain privacy**
  - Navigate to domain settings in GoDaddy
  - Locate "Privacy" or "WHOIS Privacy" setting
  - Disable privacy protection (makes registrant information public during transfer)
  - Reason: Registrar verification requires accessible contact information

- [ ] **Disable domain lock (clientTransferProhibited)**
  - Navigate to domain settings
  - Look for "Domain Lock" toggle or "Security" settings
  - Set to "Unlocked" or disable the lock
  - Status should show "clientTransferProhibited: false" (or equivalent)
  - Reason: Required for registrar transfers to proceed

- [ ] **Disable DNSSEC**
  - Access DNSSEC settings in GoDaddy DNS management
  - Disable all DNSSEC records and keys
  - Reason: DNSSEC must be disabled during transfer; will be re-enabled at Cloudflare

### 1.3 Cloudflare Account Setup

- [ ] **Verify Cloudflare account** exists and is active
  - Account name: Fishmusicinc
  - Account ID: 2446d788cc4280f5ea22a9948410c355
  - Ensure you have admin access
  - URL: https://dash.cloudflare.com/2446d788cc4280f5ea22a9948410c355

- [ ] **Add payment method** to Cloudflare account
  - Navigate to Account > Billing > Payment methods
  - Add or verify credit card is current and valid
  - Reason: Registrar transfer fees will be charged ($8.75/year per domain)

- [ ] **Review Cloudflare Registrar pricing**
  - Standard renewal: $8.75/year per domain
  - Bulk discounts may apply
  - Confirm budget allocation

---

## 2. Step-by-Step Transfer Process

Complete this section **per domain** (repeat for each domain being transferred).

### 2.1 Add Domain to Cloudflare

- [ ] **Log into Cloudflare dashboard**
  - URL: https://dash.cloudflare.com/2446d788cc4280f5ea22a9948410c355
  - Click "Add a domain" or navigate to Websites > Add a domain

- [ ] **Enter domain name**
  - Type the domain name (e.g., example.com)
  - Click "Continue"

- [ ] **Select plan** (if prompted)
  - Choose appropriate plan (Free, Pro, Business, or Enterprise)
  - Note: Registrar transfer is available on all plans
  - Click "Continue"

### 2.2 Update Nameservers at GoDaddy (Temporary)

**Important:** We update nameservers temporarily during transfer. This ensures Cloudflare can verify ownership before the registrar change.

- [ ] **Identify Cloudflare nameservers** for this domain
  - From Cloudflare dashboard (Websites > domain > DNS > Nameservers section)
  - Typical format: ns1.cloudflare.com, ns2.cloudflare.com, ns3.cloudflare.com, ns4.cloudflare.com
  - Copy these nameserver addresses

- [ ] **Update nameservers in GoDaddy**
  - Log into GoDaddy account
  - Navigate to domain settings for this specific domain
  - Go to "Nameservers" section
  - Remove current nameservers (or GoDaddy's defaults)
  - Enter Cloudflare nameservers (all 4)
  - Click "Save" or "Update"

- [ ] **Wait for nameserver propagation**
  - Allow 1-4 hours for DNS propagation (can check with online DNS checker)
  - Do NOT proceed to next steps until nameservers are live at Cloudflare
  - You can verify by checking Cloudflare dashboard > Websites > domain > DNS > Nameservers section

### 2.3 Verify Domain is Active in Cloudflare

- [ ] **Check domain status in Cloudflare**
  - Dashboard: Websites > domain name
  - Status should show "Active" or "Nameservers changed"
  - If status shows "Pending nameserver update," wait up to 24 hours

- [ ] **Verify DNS records are present**
  - Navigate to DNS > Records section
  - Cloudflare should have automatically detected existing records from GoDaddy
  - If records are missing, manually add them now (see section 4: Google Workspace DNS Records)

### 2.4 Request Authorization Code from GoDaddy

- [ ] **Log into GoDaddy account**
  - Navigate to domain settings

- [ ] **Request authorization code (auth code / transfer code)**
  - Look for "Authorization Code" or "Transfer Code" option
  - Request code (may be sent via email immediately or require support request)
  - **Note:** Email request draft already exists in Gmail to GoDaddy support
  - Copy the 8-12 character code (example: ABC123XYZ789)
  - Save this code securely

- [ ] **Document auth code**
  - Paste code into spreadsheet or secure note with domain name
  - Auth codes typically expire after 30 days

### 2.5 Initiate Transfer in Cloudflare

- [ ] **Log into Cloudflare dashboard**
  - URL: https://dash.cloudflare.com/2446d788cc4280f5ea22a9948410c355

- [ ] **Navigate to Registrar section**
  - Websites > domain > Overview
  - Scroll to "Registrar" section or click "Transfer domain"
  - Look for "Transfer Domains" tab

- [ ] **Enter transfer details**
  - Domain name: [domain]
  - Authorization code: [paste auth code from GoDaddy]
  - Click "Continue" or "Transfer Domain"

### 2.6 Confirm Contact Information and Payment

- [ ] **Verify contact information**
  - Cloudflare will display registrant contact details
  - Ensure name, email, address, phone are correct
  - Update if needed
  - Email address should be one you monitor

- [ ] **Review and accept registrar terms**
  - Read ICANN registrar transfer policy
  - Accept terms of service
  - Checkbox: "I confirm this is a valid request"

- [ ] **Confirm payment method**
  - Select payment method on file (credit card)
  - Verify the amount ($8.75/year or bulk pricing)
  - Click "Complete Transfer"

- [ ] **Note confirmation number**
  - Cloudflare will display a transfer confirmation
  - Save confirmation number for records

### 2.7 Wait for Transfer to Complete

- [ ] **Monitor transfer status in Cloudflare**
  - Dashboard: Websites > domain > Overview > Registrar section
  - Status will progress through:
    - "Pending transfer" → "Transfer in progress" → "Active" (transferred)
  - Typical timeframe: 1-5 business days

- [ ] **Check email for confirmation**
  - GoDaddy may send notification that transfer was initiated
  - GoDaddy may also send notification that registrant must approve (ICANN requirement)
  - **ACTION REQUIRED:** Approve transfer if email requests confirmation
    - Look for email from GoDaddy or ICANN
    - Click "Approve" or "Confirm Transfer" link if present
    - Deadline: Usually 5 days to approve

- [ ] **Do NOT change nameservers back**
  - Keep Cloudflare nameservers active during transfer
  - If you revert to GoDaddy nameservers, transfer will fail

### 2.8 Verify Transfer Completion

Once transfer shows "Active" in Cloudflare:

- [ ] **Confirm domain is now registered at Cloudflare**
  - Dashboard: Websites > domain > Overview
  - Registrar section shows "Cloudflare Registrar"
  - Status: "Active"

- [ ] **Verify nameservers are Cloudflare's**
  - DNS > Nameservers tab
  - All four nameservers are Cloudflare ns servers
  - GoDaddy nameservers should NOT appear

- [ ] **Test domain functionality**
  - Ping domain: `nslookup domain.com`
  - Verify A records resolve correctly
  - If using email, send test email to check MX records work

---

## 3. Post-Transfer Steps

Complete these steps **for each domain after successful transfer**.

### 3.1 Re-enable DNSSEC

- [ ] **Log into Cloudflare dashboard**
  - Navigate to Websites > domain > DNS > DNSSEC

- [ ] **Enable DNSSEC**
  - Click "Enable DNSSEC"
  - Cloudflare will generate DNSSEC keys automatically
  - Status should show "DNSSEC enabled"

- [ ] **Add DS records to parent zone** (if required by registrar)
  - Cloudflare will provide DS records
  - For top-level domains, DS records are auto-configured at Cloudflare Registrar
  - No additional action usually needed

### 3.2 Verify All DNS Records Are Intact

- [ ] **Compare current records to pre-transfer documentation**
  - Dashboard: Websites > domain > DNS > Records
  - Verify all A, AAAA, CNAME, MX, TXT records are present
  - Compare against the records you documented in section 1.2

- [ ] **Identify missing records**
  - If records are missing, manually add them now
  - Source: Your pre-transfer documentation spreadsheet

- [ ] **Verify Google Workspace records specifically** (see section 4)
  - MX records pointing to Google
  - SPF, DKIM, DMARC records
  - Google site verification TXT record

### 3.3 Set Up Auto-Renew in Cloudflare

- [ ] **Log into Cloudflare dashboard**
  - Navigate to Websites > domain > Overview

- [ ] **Enable auto-renewal**
  - Scroll to "Registrar" section
  - Look for "Auto-renew" or "Renewal settings"
  - Enable "Auto-renewal" toggle
  - Domain will automatically renew each year at $8.75 (or applicable rate)

- [ ] **Set renewal reminder** (optional)
  - Create calendar event for 30 days before expiration
  - Ensures awareness if auto-renewal fails

### 3.4 Configure Email Routing (If Applicable)

If domain uses email forwarding or email routing:

- [ ] **Set up Cloudflare Email Routing**
  - Dashboard: Websites > domain > Email > Routing rules
  - Create rules for email addresses:
    - Example: hello@domain.com → your-actual-email@gmail.com
  - This provides email forwarding via Cloudflare (free for 50 routes)

- [ ] **Disable email forwarding at GoDaddy**
  - To avoid conflicts, disable any email forwarding previously set at GoDaddy
  - GoDaddy dashboard > Email > Email accounts > Disable forwarding
  - (Or delete any forwarding rules)

- [ ] **Test email routing**
  - Send test email to forwarded address
  - Verify it arrives at destination
  - Check spam folder if not found in inbox

### 3.5 Close GoDaddy Account (After All Transfers Complete)

**IMPORTANT:** Only perform this AFTER all domains have been successfully transferred to Cloudflare.

- [ ] **Verify all domains have transferred**
  - GoDaddy account should show no active domains
  - All domains should show as "Transferred to another registrar"

- [ ] **Back up GoDaddy account data**
  - Download any renewal receipts or domain documentation
  - Screenshot current billing info for records
  - Export any email forwarding rules or other configuration

- [ ] **Log into GoDaddy account**
  - Navigate to Account Settings
  - Look for "Close Account" or "Manage Account" option

- [ ] **Initiate account closure**
  - Click "Close Account" or request closure via support
  - Reason: "Domains transferred to Cloudflare"
  - GoDaddy may offer a retention discount—decline unless planning to keep account active

- [ ] **Confirm closure email**
  - GoDaddy will send confirmation email
  - Click confirmation link if required
  - Account will be closed after grace period (typically 30 days)

---

## 4. Google Workspace DNS Records

**CRITICAL:** These records MUST be preserved during transfer or email will break.

### Google Workspace MX Records

These records route email to Google's servers. **Must be present for email to work.**

```
Priority  Host Name              Type   Value
10        @                      MX     aspmx.l.google.com
20        @                      MX     alt1.aspmx.l.google.com
30        @                      MX     alt2.aspmx.l.google.com
40        @                      MX     alt3.aspmx.l.google.com
50        @                      MX     alt4.aspmx.l.google.com
```

- [ ] **Verify MX records are present in Cloudflare**
  - Dashboard: DNS > Records
  - Filter by type "MX"
  - All five MX records should be listed with correct priorities

### Google Workspace SPF Record

Authorizes Google servers to send email on behalf of your domain. Prevents email spoofing.

```
Name:   @
Type:   TXT
Value:  v=spf1 include:_spf.google.com ~all
```

- [ ] **Verify SPF record is present in Cloudflare**
  - Dashboard: DNS > Records
  - Filter by type "TXT"
  - Exact value: `v=spf1 include:_spf.google.com ~all`

### Google Workspace DKIM Record

Digitally signs outgoing email from Google Workspace. Required for email authentication.

DKIM records are generated by Google Workspace and typically follow this pattern:

```
Name:   google._domainkey
Type:   TXT
Value:  v=DKIM1; k=rsa; p=[LONG BASE64 PUBLIC KEY]
```

- [ ] **Retrieve DKIM record from Google Workspace**
  - Google Workspace Admin: https://admin.google.com
  - Security > Authenticate email
  - Look for domain > View details > DKIM authentication
  - Copy the DKIM record value

- [ ] **Add DKIM record to Cloudflare**
  - Dashboard: DNS > Records > Add record
  - Name: google._domainkey
  - Type: TXT
  - Value: [paste full DKIM value from Google]

- [ ] **Verify DKIM status in Google Workspace**
  - Admin console should show "DKIM: Passed" or "Active"
  - May take 1-2 hours to activate after DNS change

### Google Workspace DMARC Record

Specifies policy for handling emails that fail SPF/DKIM checks. Helps prevent spoofing.

Recommended minimal DMARC record:

```
Name:   _dmarc
Type:   TXT
Value:  v=DMARC1; p=none; rua=mailto:admin@domain.com
```

- [ ] **Create or verify DMARC record in Cloudflare**
  - Dashboard: DNS > Records
  - If record exists, verify it's present
  - If missing, add:
    - Name: _dmarc
    - Type: TXT
    - Value: v=DMARC1; p=none; rua=mailto:admin@domain.com
  - Note: Change `p=none` to `p=quarantine` or `p=reject` after monitoring reports

### Google Site Verification Record

This TXT record proves you own the domain to Google (required for Search Console, Google My Business, etc.).

```
Name:   @
Type:   TXT
Value:  google-site-verification=[UNIQUE CODE]
```

- [ ] **Locate Google site verification code**
  - Google Search Console: https://search.google.com/search-console
  - Add your domain (if not already added)
  - Verification method: DNS TXT record
  - Copy the verification code (google-site-verification=xxxxx)

- [ ] **Add verification record to Cloudflare**
  - Dashboard: DNS > Records > Add record
  - Name: @ (or leave blank)
  - Type: TXT
  - Value: google-site-verification=[code from Google]

- [ ] **Verify in Google Search Console**
  - Return to Search Console
  - Click "Verify" button
  - Status should change to "Verified"
  - May take 24-48 hours

### Summary Checklist for Google Workspace Records

- [ ] All 5 MX records present with correct priorities (10, 20, 30, 40, 50)
- [ ] SPF TXT record: `v=spf1 include:_spf.google.com ~all`
- [ ] DKIM TXT record: `google._domainkey` with public key
- [ ] DMARC TXT record: `_dmarc` with policy defined
- [ ] Google site verification TXT record: `google-site-verification=...`
- [ ] All records propagated (24-48 hour wait typical)
- [ ] Test email delivery from Google Workspace account
- [ ] Google Workspace admin console shows green checkmarks for authentication

---

## 5. Troubleshooting

### Domain Stuck in "Pending" Status

**Symptom:** Domain remains in "Transfer pending" status after 24+ hours.

**Causes & Solutions:**

1. **Nameservers not updated yet**
   - [ ] Verify nameservers are Cloudflare's in GoDaddy
   - [ ] Wait another 4-24 hours for full propagation
   - [ ] Use online DNS checker: https://mxtoolbox.com/
   - [ ] Action: Confirm all four Cloudflare nameservers are resolving

2. **WHOIS privacy enabled at GoDaddy**
   - [ ] Go to GoDaddy domain settings
   - [ ] Disable WHOIS privacy/domain privacy
   - [ ] Wait 1-2 hours
   - [ ] Action: Cloudflare may auto-retry verification

3. **Domain lock still enabled**
   - [ ] GoDaddy domain settings
   - [ ] Verify "Domain Lock" is OFF
   - [ ] Status should show "Unlocked"
   - [ ] Action: GoDaddy may auto-retry after unlocking

4. **Contact Cloudflare Support**
   - [ ] If status doesn't change after 24 hours:
   - [ ] Navigate to Cloudflare Support (bottom right icon in dashboard)
   - [ ] Create ticket: "Domain transfer stuck in pending status"
   - [ ] Provide: Domain name, transfer date, auth code status

### Authorization Code Expired or Invalid

**Symptom:** Transfer fails with error "Authorization code invalid" or "Authorization code expired."

**Solutions:**

1. **Request new auth code from GoDaddy**
   - [ ] Log into GoDaddy account
   - [ ] Domain settings > Authorization code
   - [ ] Request a new code
   - [ ] Auth codes valid for 30 days from issue date

2. **Verify code format**
   - [ ] Auth code should be 8-12 alphanumeric characters
   - [ ] Check for typos or extra spaces
   - [ ] Copy directly from GoDaddy email (don't retype)

3. **Re-initiate transfer in Cloudflare**
   - [ ] Dashboard > Registrar > Transfer Domains
   - [ ] Re-enter domain name and NEW auth code
   - [ ] Click "Transfer Domain"

### Transfer Rejected

**Symptom:** Transfer fails with error "Transfer rejected" or "Domain transfer prohibited."

**Common Causes:**

1. **Domain is too new** (less than 60 days at registrar)
   - [ ] Check original registration/transfer date at GoDaddy
   - [ ] If under 60 days: wait until eligible date
   - [ ] If over 60 days: contact GoDaddy support (may be flagged incorrectly)

2. **Domain is expired**
   - [ ] Verify domain expiration date at GoDaddy
   - [ ] If expired: renew domain immediately at GoDaddy
   - [ ] Wait 24 hours after renewal
   - [ ] Retry transfer

3. **Previous transfer in progress**
   - [ ] Check GoDaddy for any pending transfers
   - [ ] Cancel any existing transfers
   - [ ] Wait 5 days before retrying new transfer

4. **DNSSEC conflict**
   - [ ] Go to GoDaddy > DNS settings
   - [ ] Verify DNSSEC is DISABLED
   - [ ] Delete any DNSSEC keys/records
   - [ ] Retry transfer

5. **Contact information mismatch**
   - [ ] Verify contact email is correct at GoDaddy
   - [ ] Ensure you have access to that email address
   - [ ] Check spam/junk folder for ICANN transfer confirmation email

### DNS Propagation Issues

**Symptom:** DNS records work at Cloudflare but don't resolve globally; email fails; website doesn't load.

**Solutions:**

1. **Check nameserver propagation**
   - [ ] Use: https://www.whatsmydns.net/
   - [ ] Enter domain name
   - [ ] Should show all four Cloudflare nameservers globally (not GoDaddy's)
   - [ ] If GoDaddy nameservers still appear: wait up to 24-48 hours
   - [ ] If stuck after 48 hours: contact Cloudflare support

2. **Verify DNS records at Cloudflare**
   - [ ] Dashboard: DNS > Records
   - [ ] Confirm critical records exist (A, MX, TXT, CNAME)
   - [ ] Check for typos in record names or values

3. **Clear local DNS cache**
   - [ ] Windows: `ipconfig /flushdns`
   - [ ] macOS: `sudo dscacheutil -flushcache`
   - [ ] Linux: `sudo systemctl restart systemd-resolved`
   - [ ] Then: test with `nslookup domain.com` or `dig domain.com`

4. **Wait for full propagation**
   - [ ] DNS changes can take 4-48 hours to propagate fully
   - [ ] Different regions may show different results during propagation
   - [ ] Typical: 24 hours for 95% propagation

5. **Contact Cloudflare Support** if issues persist after 48 hours
   - [ ] Provide: domain name, DNS records added, propagation check results
   - [ ] Support ticket: https://dash.cloudflare.com/?account=support

### Email Not Working After Transfer

**Symptom:** Emails to domain bounce or don't arrive; outbound email fails.

**Solutions:**

1. **Verify MX records at Cloudflare**
   - [ ] Dashboard: DNS > Records > Filter "MX"
   - [ ] Should show all 5 Google MX records with priorities 10-50
   - [ ] If missing: add them immediately (see section 4)

2. **Check SPF record**
   - [ ] DNS > Records > Filter "TXT"
   - [ ] Should contain: `v=spf1 include:_spf.google.com ~all`
   - [ ] If missing: add it immediately

3. **Verify DKIM at Google Workspace Admin**
   - [ ] https://admin.google.com
   - [ ] Security > Authenticate email > View details
   - [ ] DKIM status should show "Passed" (green checkmark)
   - [ ] If "Not started" or "Failed": re-add DKIM TXT record to DNS

4. **Test email delivery**
   - [ ] Send email from Google Workspace account to external address (Gmail, etc.)
   - [ ] Check if it arrives (check spam folder too)
   - [ ] If fails: check bounce-back message for error code
   - [ ] Common: 550 (SPF/DKIM failed) → verify records above

5. **Clear email application cache**
   - [ ] Close email client (Outlook, Apple Mail, Gmail app)
   - [ ] Wait 5 minutes
   - [ ] Restart and retry sending/receiving

### Still Stuck?

- [ ] **Cloudflare Support:** https://dash.cloudflare.com/?account=support (open ticket)
- [ ] **GoDaddy Support:** https://www.godaddy.com/help (open case)
- [ ] **Google Workspace Support:** https://support.google.com/a (for email issues)
- [ ] **ICANN:** If transfer is blocked, may contact: https://www.icann.org/resources/pages/help-2014-12-02-en

---

## 6. Known NOIZY Domains

**Status:** To be filled in by Robert Stephen Plowman

Add your domains below and use this table to track transfer progress:

| Domain | Expiration | Auto-Renew | Auth Code Received | Transfer Initiated | Status | Notes |
|--------|------------|------------|--------------------|--------------------|--------|-------|
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |
| | | | | | | |

---

## Quick Reference: Cloudflare Dashboard URLs

- **Cloudflare Home:** https://dash.cloudflare.com/
- **Fishmusicinc Account:** https://dash.cloudflare.com/2446d788cc4280f5ea22a9948410c355
- **Registrar (Transfer Domains):** https://dash.cloudflare.com/2446d788cc4280f5ea22a9948410c355?zone=[domain]/registrar
- **DNS Records:** https://dash.cloudflare.com/2446d788cc4280f5ea22a9948410c355?zone=[domain]/dns
- **Billing:** https://dash.cloudflare.com/2446d788cc4280f5ea22a9948410c355?account=billing

**Replace [domain] with your actual domain name (e.g., example.com)**

---

## Document Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-04-13 | Initial runbook creation |

---

## Sign-Off

This runbook is ready for use. All domains can be transferred following the procedures outlined above. Estimated completion time for full migration: 2-3 weeks (dependent on number of domains and DNS propagation times).

**Questions?** Contact Robert Stephen Plowman or Cloudflare Support via the dashboard.
