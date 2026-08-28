# DNS Checklist — All NOIZY Domains

> Apply these records via Cloudflare DNS dashboard (or API).
> Delete ALL conflicting records before adding.

---

## 1. noizy.ai (Canonical)

### Nameservers (at registrar, NOT Cloudflare)
Point to Cloudflare-assigned NS (check CF dashboard for exact values):
```
ns1.example.cloudflare.com
ns2.example.cloudflare.com
```

### MX Records (delete ALL existing MX first)
| Priority | Value |
|----------|-------|
| 1 | `ASPMX.L.GOOGLE.COM` |
| 5 | `ALT1.ASPMX.L.GOOGLE.COM` |
| 5 | `ALT2.ASPMX.L.GOOGLE.COM` |
| 10 | `ALT3.ASPMX.L.GOOGLE.COM` |
| 10 | `ALT4.ASPMX.L.GOOGLE.COM` |

### TXT — SPF (one record only, delete duplicates)
```
v=spf1 include:_spf.google.com -all
```

### TXT — DKIM (from Google Admin → Apps → Gmail → Authenticate email)
```
google._domainkey.noizy.ai  TXT  v=DKIM1; k=rsa; p=<key from Google Admin>
```

### TXT — DMARC
```
_dmarc.noizy.ai  TXT  v=DMARC1; p=quarantine; adkim=s; aspf=s; rua=mailto:dmarc@noizy.ai; ruf=mailto:dmarc@noizy.ai; fo=1; pct=100
```
> After 14 days clean: change `p=quarantine` → `p=reject`

### TXT — MTA-STS (optional, recommended)
```
_mta-sts.noizy.ai  TXT  v=STSv1; id=20260409
```

### TXT — TLS-RPT (optional, recommended)
```
_smtp._tls.noizy.ai  TXT  v=TLSRPTv1; rua=mailto:tls@noizy.ai
```

### A/CNAME — Worker + Tunnel (after zone is Active)
```
heaven.noizy.ai     CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
lucy.noizy.ai       CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
gabriel.noizy.ai    CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
mickey-p.noizy.ai   CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
keith.noizy.ai      CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
ai.noizy.ai         CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
n8n.noizy.ai        CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
voice.noizy.ai      CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
metrics.noizy.ai    CNAME  <tunnel-id>.cfargotunnel.com  (proxied)
```

---

## 2. noizyfish.com (Brand Alias)

### MX Records (same as noizy.ai)
| Priority | Value |
|----------|-------|
| 1 | `ASPMX.L.GOOGLE.COM` |
| 5 | `ALT1.ASPMX.L.GOOGLE.COM` |
| 5 | `ALT2.ASPMX.L.GOOGLE.COM` |
| 10 | `ALT3.ASPMX.L.GOOGLE.COM` |
| 10 | `ALT4.ASPMX.L.GOOGLE.COM` |

### TXT — SPF
```
v=spf1 include:_spf.google.com -all
```

### TXT — DKIM
```
google._domainkey.noizyfish.com  TXT  v=DKIM1; k=rsa; p=<key from Google Admin>
```

### TXT — DMARC
```
_dmarc.noizyfish.com  TXT  v=DMARC1; p=quarantine; adkim=s; aspf=s; rua=mailto:dmarc@noizy.ai; ruf=mailto:dmarc@noizy.ai; fo=1; pct=100
```

---

## 3. noizylab.ca (Operations Alias)

### MX Records (same as noizy.ai)
| Priority | Value |
|----------|-------|
| 1 | `ASPMX.L.GOOGLE.COM` |
| 5 | `ALT1.ASPMX.L.GOOGLE.COM` |
| 5 | `ALT2.ASPMX.L.GOOGLE.COM` |
| 10 | `ALT3.ASPMX.L.GOOGLE.COM` |
| 10 | `ALT4.ASPMX.L.GOOGLE.COM` |

### TXT — SPF
```
v=spf1 include:_spf.google.com -all
```

### TXT — DKIM
```
google._domainkey.noizylab.ca  TXT  v=DKIM1; k=rsa; p=<key from Google Admin>
```

### TXT — DMARC
```
_dmarc.noizylab.ca  TXT  v=DMARC1; p=quarantine; adkim=s; aspf=s; rua=mailto:dmarc@noizy.ai; ruf=mailto:dmarc@noizy.ai; fo=1; pct=100
```

---

## Verification Checklist

After setting all records, verify with:

```bash
# MX
dig noizy.ai MX +short
dig noizyfish.com MX +short
dig noizylab.ca MX +short

# SPF
dig noizy.ai TXT +short | grep spf
dig noizyfish.com TXT +short | grep spf
dig noizylab.ca TXT +short | grep spf

# DKIM
dig google._domainkey.noizy.ai TXT +short
dig google._domainkey.noizyfish.com TXT +short
dig google._domainkey.noizylab.ca TXT +short

# DMARC
dig _dmarc.noizy.ai TXT +short
dig _dmarc.noizyfish.com TXT +short
dig _dmarc.noizylab.ca TXT +short
```

## Online Validators
- https://mxtoolbox.com/SuperTool.aspx
- https://dmarcian.com/dmarc-inspector/
- https://mail-tester.com (send test email, get score)

---

## Delete List (remove these if they exist)

- ❌ Any ImprovMX MX records
- ❌ Any iCloud MX records  
- ❌ Any Microsoft MX records
- ❌ Any `~all` SPF records (replace with `-all`)
- ❌ Duplicate SPF TXT records
- ❌ Cloudflare Email Routing MX records
- ❌ Any CNAME on root that conflicts with MX
