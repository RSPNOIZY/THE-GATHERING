# CLOUDFLARE DNS & INFRASTRUCTURE AUDIT
**Date:** April 3, 2026
**Type:** READ-ONLY — No changes were made
**Machine:** GOD.local (M2 Ultra Mac Studio)
**Cloudflare Account:** Fishmusicinc (2446d788cc4280f5ea22a9948410c355)
**Auditor:** Claude (co-architect session with Robert Stephen Plowman)

---

## EXECUTIVE SUMMARY

The infrastructure is fragmented. Of 9 domains in the NOIZY portfolio, only 3 are on Cloudflare. Email routing is misconfigured for the primary brand domain (noisy.ai). The expected Cloudflare Workers (noisyvox, noisyproof, noizy-coming-soon) are not deployed — only a single "deploy" worker exists. GitHub SSH is working and is NOT a blocker.

---

## 1. DOMAIN-BY-DOMAIN AUDIT

### 1.1 noisy.ai — PRIMARY BRAND DOMAIN

| Check | Status | Detail |
|-------|--------|--------|
| **Nameservers** | ✅ Cloudflare | bob.ns.cloudflare.com, sofia.ns.cloudflare.com |
| **A Records** | ⚠️ Points to AWS, not Cloudflare | 3.171.117.56, .126, .47, .73 (CloudFront IPs) |
| **Root HTTPS** | ✅ Serving | HTTP 200 — Static S3 site via CloudFront (last-modified: May 5, 2021) |
| **www subdomain** | ❌ Broken | HTTP 404 — "NoSuchBucket" error (S3 bucket www.noisy.ai does not exist) |
| **MX Records** | ⚠️ AWS SES | `10 inbound-smtp.us-west-2.amazonaws.com` |
| **Email Routing** | ❌ NOT Cloudflare | Email goes to Amazon SES, NOT Cloudflare Email Routing |
| **SPF** | ✅ Present | `v=spf1 include:amazonses.com -all` (strict, AWS only) |
| **TXT** | ✅ | Facebook domain verification present |
| **DKIM** | ❌ None found | No default._domainkey record |
| **Subdomains** | ❌ None configured | vox, proof, api, app, dashboard, lab, fish, kidz, heaven, gabriel — ALL empty |
| **TTL** | 300s (5 min) | Standard |

**Critical Issues:**
1. Root domain serves a **stale static site from May 2021** via S3/CloudFront — not the current NOIZY landing
2. www.noisy.ai is **completely broken** (S3 bucket missing)
3. Email is routed through **AWS SES**, not Cloudflare — rsp@noisy.ai forwarding to iCloud is NOT configured here
4. **Zero subdomains** configured — vox.noisy.ai, proof.noisy.ai etc. do not exist in DNS
5. A records bypass Cloudflare proxy entirely (direct to AWS)

---

### 1.2 fishmusicinc.com — CLOUDFLARE ACCOUNT PRIMARY

| Check | Status | Detail |
|-------|--------|--------|
| **Nameservers** | ✅ Cloudflare | alex.ns.cloudflare.com, melinda.ns.cloudflare.com |
| **A Records** | ✅ Cloudflare Proxy | 172.67.214.218, 104.21.16.164 (Cloudflare IPs) |
| **Root HTTPS** | ❌ Error 530 | Origin DNS error — no origin server configured behind Cloudflare |
| **MX Records** | ✅ Cloudflare Email Routing | route1/2/3.mx.cloudflare.net (priorities 65, 28, 41) |
| **Email Routing** | ✅ Configured | Cloudflare Email Routing is active on this domain |
| **SPF** | ✅ Present | `v=spf1 include:_spf.mx.cloudflare.net ~all` |
| **DKIM** | ❌ None found | No default._domainkey record |
| **Subdomains** | ❌ None | www, api, app, mail — all empty |

**Key Finding:** This is the ONLY domain with Cloudflare Email Routing properly configured. But the website itself returns 530 (no origin). If rsp@noisy.ai email forwarding is needed, it must be configured on noisy.ai (currently it's not) or rerouted through fishmusicinc.com.

---

### 1.3 noisyfish.com — NOT ON CLOUDFLARE

| Check | Status | Detail |
|-------|--------|--------|
| **Nameservers** | ❌ atom.com | ns1.atom.com, ns2.atom.com (domain marketplace) |
| **A Records** | ⚠️ Parked | 52.20.84.62 (redirects to atom.com marketplace) |
| **HTTPS** | ⚠️ Redirect | 302 → https://www.atom.com/name/NoisyFish |
| **MX Records** | ❌ None | |
| **Email** | ❌ None | |
| **Subdomains** | ❌ Only www | www.noisyfish.com → same parking IP |

**Status:** Domain is **parked on atom.com marketplace**. Not under your DNS control. Needs to be transferred to Cloudflare or have NS records pointed to Cloudflare.

---

### 1.4 noizylab.ca — ON CLOUDFLARE

| Check | Status | Detail |
|-------|--------|--------|
| **Nameservers** | ✅ Cloudflare | naomi.ns.cloudflare.com, renan.ns.cloudflare.com |
| **A Records** | ✅ Cloudflare Proxy | 172.67.175.205, 104.21.91.168 |
| **MX Records** | ⚠️ ImprovMX | mx01.improvmx.com, mx02.improvmx.com (third-party forwarding) |
| **Email** | ⚠️ Third-party | Using ImprovMX, not Cloudflare Email Routing |

---

### 1.5 noizylab.com — NOT ON CLOUDFLARE

| Check | Status | Detail |
|-------|--------|--------|
| **Nameservers** | ❌ Wix | ns2.wixdns.net, ns3.wixdns.net |
| **A Records** | ⚠️ Wix IPs | 185.230.63.x (Wix hosting) |
| **MX Records** | ❌ None | |

**Status:** Pointed at Wix. Not under Cloudflare control.

---

### 1.6 Remaining Domains

| Domain | NS | Status |
|--------|-----|--------|
| **oxygen.io** | ❌ No records | Domain may be expired or not registered |
| **noizykidz.com** | ❌ No records | Domain may be expired or not registered |
| **noisybox.com** | NameBright | Parked, A record to 13.223.25.84 / 54.243.117.197, no MX |
| **theaquarium.com** | Afternic | Parked/marketplace, A to 76.223.54.146 / 13.248.169.48, MX: `0 .` (null) |

---

## 2. CLOUDFLARE WORKERS AUDIT

| Expected (per CLAUDE.md) | Deployed | Status |
|--------------------------|----------|--------|
| noisyvox | ❌ Not found | Missing |
| noisyproof | ❌ Not found | Missing |
| noizy-coming-soon | ❌ Not found | Missing |
| deploy | ✅ Present | Created Dec 2, 2025 — single worker in account |

**Only 1 of 4 expected workers exists.** The "deploy" worker was created Dec 2, 2025. The three workers documented in CLAUDE.md (noisyvox at vox.noisy.io, noisyproof at heaven.rsp-5f3.workers.dev, noizy-coming-soon) are not deployed to Cloudflare.

---

## 3. EMAIL ROUTING SUMMARY

| Domain | Method | Target | Status |
|--------|--------|--------|--------|
| **noisy.ai** | AWS SES | inbound-smtp.us-west-2.amazonaws.com | ⚠️ Not Cloudflare, rsp@noisy.ai → iCloud NOT confirmed |
| **fishmusicinc.com** | Cloudflare Email Routing | route1/2/3.mx.cloudflare.net | ✅ Active (need to verify forwarding rules in dashboard) |
| **noizylab.ca** | ImprovMX | mx01/mx02.improvmx.com | ⚠️ Third-party |
| **noisyfish.com** | None | — | ❌ No email |
| **noizylab.com** | None | — | ❌ No email |
| All others | None | — | ❌ No email |

**rsp@noisy.ai → rsp@icloud.com forwarding:** Cannot confirm this is working. The MX for noisy.ai points to AWS SES, not Cloudflare Email Routing. Unless AWS SES is configured to forward to iCloud (which requires separate verification), this email path may be broken.

---

## 4. GITHUB SSH CONNECTIVITY

| Check | Status | Detail |
|-------|--------|--------|
| **SSH Authentication** | ✅ Working | "Hi Noizyfish! You've successfully authenticated" |
| **SSH Keys** | ✅ 2 keys present | id_ed25519.pub, id_ed25519_github.pub |
| **DNS Blocker** | ✅ Not blocked | github.com resolves and connects fine |

**GitHub is NOT a blocker.** SSH works. Two keys are present and the Noizyfish account authenticates.

**Git Remote Configuration:**
- `~/NOIZYLAB/` — Uses HTTPS (origin: github.com/NOIZYLAB-io/NOIZYLAB.git, also NOIZY-ai remote)
- `~/NOIZYANTHROPIC/` — Uses SSH (origin: git@github.com:noizy-ai/noizyanthropic.git)
- 14 repos in `~/NOIZYLAB/repos/` — remotes not checked in this audit

---

## 5. DOMAIN CONTROL SUMMARY

| Domain | On Cloudflare | DNS Control | Website Live | Email Working |
|--------|:---:|:---:|:---:|:---:|
| **noisy.ai** | ✅ | ✅ | ⚠️ Stale (2021) | ⚠️ AWS SES |
| **fishmusicinc.com** | ✅ | ✅ | ❌ Error 530 | ✅ CF Email Routing |
| **noizylab.ca** | ✅ | ✅ | ? | ⚠️ ImprovMX |
| **noizylab.com** | ❌ | ❌ Wix | ⚠️ Wix | ❌ |
| **noisyfish.com** | ❌ | ❌ atom.com | ❌ Parked | ❌ |
| **noisybox.com** | ❌ | ❌ NameBright | ❌ Parked | ❌ |
| **theaquarium.com** | ❌ | ❌ Afternic | ❌ Parked | ❌ |
| **oxygen.io** | ❌ | ❌ | ❌ No records | ❌ |
| **noizykidz.com** | ❌ | ❌ | ❌ No records | ❌ |

**Only 3 of 9 domains are on Cloudflare.** The rest are parked, on other platforms, or unresolvable.

---

## 6. CONFIRMATION: NO CHANGES MADE

This audit was performed entirely through:
- DNS lookups (`dig`) from GOD.local
- HTTP header checks (`curl -sI`) from GOD.local
- Cloudflare API read-only calls (accounts_list, workers_list)
- GitHub SSH test (`ssh -T git@github.com`)
- Local file system checks

**No DNS records were created, modified, or deleted.**
**No Cloudflare settings were changed.**
**No workers were deployed or modified.**
**No email routing rules were touched.**

---

## 7. RECOMMENDED FIX ORDER (for next session)

**Phase 1 — Immediate (fix what's broken):**
1. Configure Cloudflare Email Routing on noisy.ai (replace AWS SES MX)
2. Add rsp@noisy.ai → rsplowman@icloud.com forwarding rule
3. Update SPF record on noisy.ai to include Cloudflare
4. Fix www.noisy.ai (either create S3 bucket or CNAME to correct target)

**Phase 2 — Deploy Workers:**
5. Deploy noisyvox worker and create vox.noisy.ai CNAME
6. Deploy noisyproof worker and create proof.noisy.ai CNAME
7. Deploy noizy-coming-soon (or updated landing page)

**Phase 3 — Consolidate domains:**
8. Transfer noisyfish.com NS to Cloudflare
9. Transfer noizylab.com NS to Cloudflare (from Wix)
10. Verify oxygen.io and noizykidz.com registration status
11. Decide on noisybox.com and theaquarium.com

**Phase 4 — Harden:**
12. Add DKIM records for all email-enabled domains
13. Set up DMARC policies
14. Configure subdomains (api, dashboard, etc.) on noisy.ai
15. Point noisy.ai A records through Cloudflare proxy (currently bypassed)

---

*READ-ONLY AUDIT — No changes made. Generated by Claude in co-architect session with Robert Stephen Plowman — NOIZY EMPIRE / MC96ECOUNIVERSE*
