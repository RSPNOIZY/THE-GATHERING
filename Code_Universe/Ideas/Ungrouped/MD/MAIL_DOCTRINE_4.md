# MAIL DOCTRINE — NOIZY EMPIRE
## Canonical Mail, DNS & Identity Stack
### Locked: April 11, 2026

> **This is the SINGLE SOURCE OF TRUTH for mail infrastructure across all NOIZY brands.**
> No split delivery. No forwarding chains. No mythology. Just engineering.

---

## 1. Provider Decision: LOCKED

| Choice | Provider |
|---|---|
| **Mail Authority** | Google Workspace |
| **Org** | `rsp-noizy-org` |
| **Primary Login** | `rsp@noizy.ai` |
| **Plan** | Business Starter ($7.20/mo) |

### Why Google (not Microsoft)
- Lowest friction at this stage
- SPF/DKIM/DMARC ergonomics are best-in-class
- Gmail mobile UX ships native on iPhone/iPad
- Drive/Docs for Aquarium ops (no extra license)
- No Teams/SharePoint bloat at this scale
- Microsoft makes sense later if enterprise governance is needed

---

## 2. Domain Roles

| Domain | Role | MX Authority |
|---|---|---|
| `noizy.ai` | **Canonical identity + login** | Google |
| `noizyfish.com` | Brand alias (same mailboxes) | Google |
| `noizylab.ca` | Operations / lab alias | Google |

**All three domains point to Google MX ONLY.**

---

## 3. DNS Records — Per Domain

### Apply ALL of the following to each domain: `noizy.ai`, `noizyfish.com`, `noizylab.ca`

---

### 3.1 MX Records (delete everything else first)

```dns
@  MX  1    ASPMX.L.GOOGLE.COM.
@  MX  5    ALT1.ASPMX.L.GOOGLE.COM.
@  MX  5    ALT2.ASPMX.L.GOOGLE.COM.
@  MX  10   ALT3.ASPMX.L.GOOGLE.COM.
@  MX  10   ALT4.ASPMX.L.GOOGLE.COM.
```

> **⚠️ DELETE every other MX**: ImprovMX, iCloud, Microsoft, Zoho, or anything else.
> One authority. Zero ambiguity.

---

### 3.2 SPF Record (exactly one TXT, hard fail)

```dns
@  TXT  "v=spf1 include:_spf.google.com -all"
```

> **Rules:**
> - ONE SPF record per domain. Not two. Not zero.
> - `-all` (hard fail) — not `~all` (soft fail)
> - No extra `include:` for ImprovMX, Sendgrid, Mailchimp, etc.
> - This alone eliminates the spoofing vectors from last time.

---

### 3.3 DKIM Record (generated from Google Admin)

**Steps:**
1. Google Admin → Apps → Google Workspace → Gmail → Authenticate email
2. Select domain → Generate new record
3. Key length: **2048-bit**
4. Selector prefix: `google`

Add the TXT record Google provides:

```dns
google._domainkey  TXT  "v=DKIM1; k=rsa; p=MIIBIjANBgkq..."
```

> Repeat for each domain. Google gives you the exact value — don't type it manually.

---

### 3.4 DMARC Record (enforced, not observation)

```dns
_dmarc  TXT  "v=DMARC1; p=quarantine; adkim=s; aspf=s; rua=mailto:dmarc@noizy.ai; ruf=mailto:dmarc@noizy.ai; fo=1; pct=100"
```

> **Timeline:**
> - Day 1–14: `p=quarantine` (spoofed mail goes to junk)
> - Day 15+: Change to `p=reject` (spoofed mail gets bounced)
>
> `adkim=s; aspf=s` = **strict alignment** — domain in From: must exactly match DKIM/SPF domain.

---

### 3.5 MTA-STS + TLS-RPT (optional, recommended)

Forces encrypted delivery. Prevents downgrade attacks.

```dns
_mta-sts        TXT  "v=STSv1; id=20260411"
_smtp._tls      TXT  "v=TLSRPTv1; rua=mailto:tls@noizy.ai"
```

Also create a file served at `https://mta-sts.noizy.ai/.well-known/mta-sts.txt`:
```
version: STSv1
mode: enforce
mx: ASPMX.L.GOOGLE.COM
mx: *.ASPMX.L.GOOGLE.COM
max_age: 604800
```

---

## 4. Auth & MFA Hardening

### Google Workspace
- [ ] Enforce 2-step verification for all users
- [ ] Require security key or authenticator (no SMS)
- [ ] Disable legacy IMAP/POP
- [ ] Max 2 super admin accounts
- [ ] Enable Google Advanced Protection for `rsp@noizy.ai`

### Cloudflare
- [ ] Login email: `rsp@noizy.ai` (matches Workspace)
- [ ] MFA mandatory
- [ ] API tokens: scoped per zone, not global
- [ ] Review zone delegation per domain

### GitHub / Stripe / Linear / Notion / All SaaS
- [ ] Login email: `rsp@noizy.ai` everywhere
- [ ] MFA enforced on every service
- [ ] Recovery codes stored offline (not in email)
- [ ] Revoke old sessions after migration

---

## 5. Execution Checklist

**Do these IN ORDER. Do not skip steps.**

### Phase 1: Google Workspace Setup
- [ ] Log into Google Admin Console (`admin.google.com`)
- [ ] Add domain: `noizy.ai` (primary)
- [ ] Add domain: `noizyfish.com` (alias)
- [ ] Add domain: `noizylab.ca` (alias)
- [ ] Verify each domain (DNS TXT verification record)

### Phase 2: DNS Lockdown
- [ ] **noizy.ai** — Set MX to Google (delete old MX)
- [ ] **noizy.ai** — Set SPF: `v=spf1 include:_spf.google.com -all`
- [ ] **noizy.ai** — Set DKIM (from Google Admin)
- [ ] **noizy.ai** — Set DMARC: `p=quarantine`
- [ ] **noizyfish.com** — Repeat all 4 DNS records
- [ ] **noizylab.ca** — Repeat all 4 DNS records

### Phase 3: Verify Mail Flow
- [ ] Send test email FROM `rsp@noizy.ai` → external Gmail
- [ ] Send test email TO `rsp@noizy.ai` ← external Gmail
- [ ] Check SPF pass: look at email headers for `spf=pass`
- [ ] Check DKIM pass: look for `dkim=pass`
- [ ] Check DMARC pass: look for `dmarc=pass`
- [ ] Send from `noizyfish.com` alias — verify same passes

### Phase 4: Harden
- [ ] Enable 2-step verification
- [ ] Set DMARC to `p=reject` (after 14 days clean)
- [ ] Lock MFA on Cloudflare, GitHub, Stripe, Linear
- [ ] Run `noizy_safe_recovery_v3.sh audit`

---

## 6. What Was Wrong Before (Spoofing Root Cause)

| Problem | Impact | Fix |
|---|---|---|
| Multiple SPF records | RFC violation — unpredictable behavior | Single SPF with `-all` |
| SPF soft fail (`~all`) | Spoofed mail delivered anyway | Hard fail (`-all`) |
| DKIM misaligned | Signature didn't match From: domain | Strict alignment (`adkim=s`) |
| Partial MX forwarding | ImprovMX + Google = routing loop risk | Google-only MX |
| DMARC `p=none` or missing | No enforcement — spoofers walk through | `p=quarantine` → `p=reject` |
| Multiple mail providers | SPF bloat, DKIM confusion, routing chaos | Single authority (Google) |

---

## 7. DMARC Report Interpretation

After publishing DMARC with `rua=mailto:dmarc@noizy.ai`, you'll receive XML reports. Here's what to look for:

### Good (keep going):
```
<result>pass</result> for SPF
<result>pass</result> for DKIM
<disposition>none</disposition>
```

### Bad (investigate):
```
<result>fail</result> for SPF → Someone is sending as you without authorization
<result>fail</result> for DKIM → Signature broken or missing
<disposition>quarantine</disposition> → Spoofed mail sent to junk
<disposition>reject</disposition> → Spoofed mail bounced (good!)
```

### Tools for reading DMARC reports:
- **Free**: [dmarcian.com](https://dmarcian.com) — paste XML, get readable report
- **Free**: [mxtoolbox.com/dmarc](https://mxtoolbox.com/dmarc.aspx) — lookup any domain
- **CLI**: `dig TXT _dmarc.noizy.ai` — verify record is published

---

## 8. Cloudflare DNS Audit Checklist

Run this for each domain in Cloudflare dashboard → DNS → Records:

### noizy.ai
```
CHECK:  Only Google MX records exist (delete ImprovMX, iCloud, etc.)
CHECK:  Exactly 1 SPF TXT record
CHECK:  DKIM TXT record present (google._domainkey)
CHECK:  _dmarc TXT record present
CHECK:  No conflicting CNAME on @ that blocks MX
CHECK:  A/AAAA records for @ point to Cloudflare (if using Workers)
CHECK:  NS records are Cloudflare-assigned (not registrar default)
```

### noizyfish.com
```
Same checks as above.
```

### noizylab.ca
```
Same checks as above.
```

---

## 9. Quick Verification Commands

```bash
# Check MX
dig MX noizy.ai +short
dig MX noizyfish.com +short
dig MX noizylab.ca +short

# Check SPF
dig TXT noizy.ai +short | grep spf
dig TXT noizyfish.com +short | grep spf
dig TXT noizylab.ca +short | grep spf

# Check DKIM
dig TXT google._domainkey.noizy.ai +short
dig TXT google._domainkey.noizyfish.com +short
dig TXT google._domainkey.noizylab.ca +short

# Check DMARC
dig TXT _dmarc.noizy.ai +short
dig TXT _dmarc.noizyfish.com +short
dig TXT _dmarc.noizylab.ca +short

# Full MX + SPF + DKIM + DMARC test (one shot)
for d in noizy.ai noizyfish.com noizylab.ca; do
  echo "=== $d ==="
  echo "MX:    $(dig MX $d +short | head -1)"
  echo "SPF:   $(dig TXT $d +short | grep spf)"
  echo "DKIM:  $(dig TXT google._domainkey.$d +short | head -c 60)..."
  echo "DMARC: $(dig TXT _dmarc.$d +short)"
  echo ""
done
```

---

> **MAIL_DOCTRINE.md** — Canonical.
> No split delivery. No forwarding. No mythology.
> Google Workspace. Three domains. One authority.
> GORUNFREE. 🐟
