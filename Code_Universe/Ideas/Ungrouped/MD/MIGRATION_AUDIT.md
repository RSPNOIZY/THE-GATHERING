# 🚀 NOIZYLAB DOMAIN MIGRATION AUDIT
## Cloudflare Enterprise Consolidation: noizy.ai + fishmusicinc.com + noizyfish.com

**Migration Date Started:** March 29, 2026  
**Target:** Enterprise Cloudflare (Single Seat)  
**Mission:** Liberate from GoDaddy & Azure

---

## 📋 PRE-MIGRATION CHECKLIST

### DOMAIN 1: noizy.ai
- [ ] Current Registrar: **GoDaddy**
- [ ] Current Nameservers: (run `nslookup -type=NS noizy.ai`)
  ```
  NS1: naomi.ns.cloudflare.com
  NS2: renan.ns.cloudflare.com
  ```
- [ ] Current DNS Records (export from GoDaddy):
  | Type | Name | Value | TTL | Priority |
  |------|------|-------|-----|----------|
  | A | @ | 104.21.91.188, 172.67.177.214 | 300 | |
  | AAAA | @ | 2606:4700:3033::ac43:b1d6, 2606:4700:3030::6815:5bbc | 300 | |
  | MX | @ | aspmx.l.google.com | 3600 | 1 |
  | TXT | @ | v=spf1 include:icloud.com include:_spf.google.com ~all | 3600 | |
  
- [ ] Current Usage: `[ ] Web App  [ ] Email Hosting  [ ] API  [ ] CDN  [ ] Other: ______`
- [ ] Current SSL Certificate: `__________________________`
- [ ] Any subdomains: `__________________________`
- [ ] Email setup: `[ ] None  [ ] Forwarding  [ ] Full hosting`

---

### DOMAIN 2: fishmusicinc.com
- [ ] Current Registrar: **GoDaddy**
- [ ] Current Nameservers: (run `nslookup -type=NS fishmusicinc.com`)
  ```
  NS1: alex.ns.cloudflare.com
  NS2: melinda.ns.cloudflare.com
  ```
- [ ] Current DNS Records (export from GoDaddy):
  | Type | Name | Value | TTL | Priority |
  |------|------|-------|-----|----------|
  | A | @ | 104.21.16.164, 172.67.214.218 | 300 | |
  | AAAA | @ | 2606:4700:3032::6815:10a4, 2606:4700:3034::ac43:d6da | 300 | |
  
- [ ] Current Usage: `[ ] Web App  [ ] Email Hosting  [ ] API  [ ] CDN  [ ] Other: ______`
- [ ] Current SSL Certificate: `__________________________`
- [ ] Any subdomains: `__________________________`
- [ ] Email setup: `[ ] None  [ ] Forwarding  [ ] Full hosting`

---

### DOMAIN 3: noizyfish.com
- [ ] Current Registrar: **GoDaddy**
- [ ] Current Nameservers: (run `nslookup -type=NS noizyfish.com`)
  ```
  NS1: adam.ns.cloudflare.com
  NS2: sandy.ns.cloudflare.com
  ```
- [ ] Current DNS Records (export from GoDaddy):
  | Type | Name | Value | TTL | Priority |
  |------|------|-------|-----|----------|
  | A | @ | 104.26.2.106, 104.26.3.106, 172.67.69.56 | 300 | |
  | AAAA | @ | 2606:4700:20::681a:26a, 2606:4700:20::681a:36a, 2606:4700:20::ac43:4538 | 300 | |
  
- [ ] Current Usage: `[ ] Web App  [ ] Email Hosting  [ ] API  [ ] CDN  [ ] Other: ______`
- [ ] Current SSL Certificate: `__________________________`
- [ ] Any subdomains: `__________________________`
- [ ] Email setup: `[ ] None  [ ] Forwarding  [ ] Full hosting`

---

## ☁️ AZURE CLEANUP AUDIT

- [ ] Azure DNS zones exist for these domains?
  - [ ] noizy.ai — Resource Group: `______________________`
  - [ ] fishmusicinc.com — Resource Group: `______________________`
  - [ ] noizyfish.com — Resource Group: `______________________`
  
- [ ] Azure resources to preserve/migrate:
  ```
  [ ] App Services
  [ ] Function Apps
  [ ] Storage Accounts
  [ ] Other: ______________________
  ```

- [ ] Azure Resources to DELETE (after Cloudflare migration):
  ```
  [ ] DNS Zones (all 3)
  [ ] Unused App Service Plans
  [ ] Unused Storage Accounts
  [ ] Other: ______________________
  ```

---

## ☁️ CLOUDFLARE SETUP PROGRESS

- [ ] Cloudflare Account Created/Upgraded to Enterprise
- [ ] Cloudflare Contact/Sales Agreement: `Date: ________________`
- [ ] noizy.ai added to Cloudflare
  - Nameservers: 
    ```
    NS1: ___________________________
    NS2: ___________________________
    ```
- [ ] fishmusicinc.com added to Cloudflare
  - Nameservers:
    ```
    NS1: ___________________________
    NS2: ___________________________
    ```
- [ ] noizyfish.com added to Cloudflare
  - Nameservers:
    ```
    NS1: ___________________________
    NS2: ___________________________
    ```

---

## DNS MIGRATION EXECUTION LOG

### noizy.ai Migration
- [ ] DNS records imported to Cloudflare
- [ ] Nameservers updated at GoDaddy: `Date: ________________`
- [ ] DNS propagation verified: `Date: ________________`
- [ ] SSL certificate active: `Date: ________________`
- [ ] Traffic tested & working: `Date: ________________`

### fishmusicinc.com Migration
- [ ] DNS records imported to Cloudflare
- [ ] Nameservers updated at GoDaddy: `Date: ________________`
- [ ] DNS propagation verified: `Date: ________________`
- [ ] SSL certificate active: `Date: ________________`
- [ ] Traffic tested & working: `Date: ________________`

### noizyfish.com Migration
- [ ] DNS records imported to Cloudflare
- [ ] Nameservers updated at GoDaddy: `Date: ________________`
- [ ] DNS propagation verified: `Date: ________________`
- [ ] SSL certificate active: `Date: ________________`
- [ ] Traffic tested & working: `Date: ________________`

---

## AZURE CLEANUP EXECUTION LOG

- [ ] Azure DNS zones deleted: `Date: ________________`
- [ ] Unused resources cleaned up: `Date: ________________`
- [ ] Azure tenant verified clean: `Date: ________________`

---

## ✅ FINAL VERIFICATION

- [ ] All 3 domains resolve correctly
- [ ] All SSL certificates valid
- [ ] Email (if applicable) working
- [ ] CDN & caching working
- [ ] WAF & DDoS protection enabled
- [ ] DNS globally propagated
- [ ] No DNS leaks (check DNSleaktest.com)
- [ ] GoDaddy domains can be deleted

---

## NOTES & BLOCKERS

```
🔥 CRITICAL DISCOVERY: All 3 domains are ALREADY on Cloudflare!

- noizy.ai: naomi.ns.cloudflare.com / renan.ns.cloudflare.com
- fishmusicinc.com: alex.ns.cloudflare.com / melinda.ns.cloudflare.com  
- noizyfish.com: adam.ns.cloudflare.com / sandy.ns.cloudflare.com

This means DNS migration is COMPLETE! 🎉

Next steps:
1. Check if domains are on FREE Cloudflare accounts
2. Contact Cloudflare for Enterprise upgrade
3. Transfer domains to Enterprise account (if needed)
4. Clean up any duplicate Azure DNS zones
5. Verify Enterprise features activated

Azure check needed: Run 'az login' then 'az network dns zone list'
```

