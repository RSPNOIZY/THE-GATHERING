# NOIZY.AI — Cloudflare DNS Records for Google Workspace

All records go in: **Cloudflare dashboard → noizy.ai → DNS → Records**

---

## 1. MX — mail routing (REPLACES Cloudflare Email Routing MX)

Google's modernized single-record MX (2023+):

| Type | Name    | Mail server      | Priority | TTL  | Proxy |
|------|---------|------------------|----------|------|-------|
| MX   | `@`     | `smtp.google.com`| 1        | Auto | DNS only |

**Delete first:** any existing `route1.mx.cloudflare.net`, `route2.mx.cloudflare.net`, `route3.mx.cloudflare.net` entries.

---

## 2. SPF — authorizes Google to send as noizy.ai

| Type | Name | Content                              | TTL  |
|------|------|--------------------------------------|------|
| TXT  | `@`  | `v=spf1 include:_spf.google.com ~all`| Auto |

⚠️ Only ONE SPF record per domain. If one exists, merge — don't duplicate.

---

## 3. DKIM — cryptographic signature (generate AFTER Workspace signup)

DKIM can't be created until you're inside Google Admin:

1. Admin console → **Apps → Google Workspace → Gmail → Authenticate email**
2. Select domain `noizy.ai` → click **Generate new record**
3. Use **2048-bit** key (not 1024)
4. Google gives you a selector (usually `google`) and a very long TXT value

Then add it to Cloudflare:

| Type | Name                    | Content                   | TTL  |
|------|-------------------------|---------------------------|------|
| TXT  | `google._domainkey`     | `(paste full value)`      | Auto |

5. Return to Google Admin → click **Start authentication** (activates DKIM)

---

## 4. DMARC — NOIZY brand protection policy

**Phase A — Fresh setup (first 2 weeks):** start permissive to collect reports without bouncing real mail.

| Type | Name     | Content (one line, no breaks)                                                                                                        | TTL  |
|------|----------|--------------------------------------------------------------------------------------------------------------------------------------|------|
| TXT  | `_dmarc` | `v=DMARC1; p=quarantine; rua=mailto:dmarc@noizy.ai; ruf=mailto:dmarc@noizy.ai; fo=1; adkim=s; aspf=s; pct=100; sp=quarantine`       | Auto |

**Phase B — Hardened (after 2 weeks of clean reports):** tighten to `reject` — matches NOIZY's "zero tolerance for IP theft" doctrine.

Same record, change `p=quarantine` → `p=reject` and `sp=quarantine` → `sp=reject`.

### Tag-by-tag explanation

- `v=DMARC1` — protocol version
- `p=quarantine` — unaligned mail goes to spam (Phase A) → `reject` (Phase B)
- `rua=mailto:dmarc@noizy.ai` — aggregate reports (daily XML digest from mail providers)
- `ruf=mailto:dmarc@noizy.ai` — forensic reports (per-message failure samples)
- `fo=1` — generate report if EITHER SPF or DKIM fails (not just both)
- `adkim=s` — strict DKIM alignment (subdomains must match exactly)
- `aspf=s` — strict SPF alignment
- `pct=100` — apply policy to 100% of unaligned mail
- `sp=quarantine` — policy for subdomains (mail.noizy.ai, etc.)

---

## 5. OPTIONAL BUT RECOMMENDED — MTA-STS & TLS-RPT

Enforces TLS for incoming mail. Brand signal: "NOIZY takes mail security seriously."

| Type | Name          | Content                                                       | TTL  |
|------|---------------|---------------------------------------------------------------|------|
| TXT  | `_mta-sts`    | `v=STSv1; id=2026042001`                                      | Auto |
| TXT  | `_smtp._tls`  | `v=TLSRPTv1; rua=mailto:tls-reports@noizy.ai`                 | Auto |

Also requires a hosted policy file at `https://mta-sts.noizy.ai/.well-known/mta-sts.txt` — skip this for now unless you want to add a Cloudflare Pages site for it.

---

## ✅ Verification (after all records propagate, ~5-15 min)

Run these from terminal — all should return the Google records:

```bash
dig +short MX noizy.ai            # → 1 smtp.google.com.
dig +short TXT noizy.ai           # → "v=spf1 include:_spf.google.com ~all"
dig +short TXT _dmarc.noizy.ai    # → full DMARC record
dig +short TXT google._domainkey.noizy.ai  # → DKIM public key
```

Or use the smoke-test script in this folder: `./4-smoke-test.sh`
