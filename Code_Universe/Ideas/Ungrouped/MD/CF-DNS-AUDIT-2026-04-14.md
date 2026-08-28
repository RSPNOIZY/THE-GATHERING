# NOIZY Cloudflare DNS & Infrastructure Audit
## 2026-04-14 | MC96ECO

---

## Domain Inventory (5 zones)

| # | Domain | NS Pair | A Records | AAAA | www | MX | SPF | DMARC | HTTP |
|---|--------|---------|-----------|------|-----|-----|-----|-------|------|
| 1 | **noizyfish.com** | marek/tara | ✅ 104.21.15.77, 172.67.161.242 | ✅ | ✅ (proxied) | ✅ CF Email | ✅ | ❌ MISSING | ✅ 200 |
| 2 | **fishmusicinc.com** | alex/melinda | ✅ 104.21.16.164, 172.67.214.218 | ✅ | ❌ NO www RECORD | ✅ CF Email | ✅ | ❌ MISSING | ⛔ TIMEOUT |
| 3 | **noizy.ai** | alex/melinda | ✅ 172.67.177.214, 104.21.91.188 | ✅ | ❌ NO www RECORD | ✅ CF Email | ✅ | ❌ MISSING | ⛔ TIMEOUT |
| 4 | **noizykidz.com** | marek/tara | ❌ NO A RECORD | ❌ | ❌ | ❌ NO MX | ❌ | ❌ | ⛔ UNRESOLVABLE |
| 5 | **noizylab.ca** | naomi/renan | ✅ 104.21.91.168, 172.67.175.205 | ✅ | ❌ NO www RECORD | ✅ ImprovMX | ✅ (+ iCloud) | ✅ quarantine | ✅ 200 |

---

## 🔴 CRITICAL ISSUES (3)

### 1. `noizy.ai` — SSL handshake succeeds but origin times out
- **Symptom:** TLS 1.3 completes, then 15s timeout → HTTP 000 (no response)
- **Root cause:** Domain has CF proxy A/AAAA records but **no origin server or Worker/Pages behind it**
- **CF proxy receives the request, tries to contact origin → nothing is listening**
- **Fix options:**
  - **A) Point to a Pages project:** Add custom domain `noizy.ai` to one of your Pages projects (e.g., `noizy-landing` or `noizy-app`)
  - **B) Add a Worker route:** In CF dashboard → Workers Routes → add `noizy.ai/*` → assign a Worker
  - **C) Add an origin:** If you have a server, add an A record (orange-clouded) pointing to it
  - **D) Redirect rule:** Create a CF Redirect Rule: `noizy.ai/*` → `https://noizyfish.com/$1` (if that's the canonical domain)

### 2. `fishmusicinc.com` — Same problem as noizy.ai
- **Symptom:** TLS handshake OK, then 15s timeout → HTTP 000
- **Root cause:** CF-proxied A records exist but **no origin/Worker/Pages mapped**
- **www subdomain:** Also broken — no A/AAAA/CNAME record at all
- **Fix:** Same options as noizy.ai — map a Pages project or add redirect rule

### 3. `noizykidz.com` — Completely dead (no DNS records)
- **Symptom:** `Could not resolve host` — no A, no AAAA records
- **NS delegated to CF:** marek/tara.ns.cloudflare.com — zone exists but is **empty**
- **No MX, no TXT, no SPF** — domain is fully parked with no records
- **Fix options:**
  - **A) Add records:** In CF dashboard → DNS → add A record (proxied) + map to Pages/Worker
  - **B) Park properly:** Add a single A record → 192.0.2.1 (proxied) + redirect to noizyfish.com
  - **C) Delete zone:** If not needed, remove from CF to stop paying for it

---

## 🟡 WARNINGS (4)

### 4. Missing `www` CNAME on 4 domains
Only `noizyfish.com` has www → root resolution. All others lack it:
- `www.fishmusicinc.com` — ❌ no record
- `www.noizy.ai` — ❌ no record
- `www.noizykidz.com` — ❌ no record
- `www.noizylab.ca` — ❌ no record

**Fix:** Add CNAME `www` → `@` (proxied) for each domain in CF DNS.

### 5. Missing DMARC on 4 domains
Only `noizylab.ca` has DMARC (`v=DMARC1; p=quarantine`). Others are missing:
- `noizyfish.com` — ❌
- `fishmusicinc.com` — ❌
- `noizy.ai` — ❌
- `noizykidz.com` — ❌

**Fix:** Add TXT `_dmarc` for each:
```
v=DMARC1; p=quarantine; rua=mailto:dmarc@noizy.ai
```

### 6. Zero Trust — 0/50 seats active, 0 tunnels
- 50 seats available but unused
- No Cloudflare Tunnels configured
- **Tunnel would solve the origin problem** for noizy.ai/fishmusicinc.com by exposing MC96ECO services to CF edge without public IPs
- **Recommended:** `cloudflared tunnel create noizy-mc96` → expose local services (n8n, NOIZYNET, DreamChamber)

### 7. noizylab.ca email — ImprovMX not CF Email Routing
- Uses `mx01.improvmx.com` / `mx02.improvmx.com` instead of Cloudflare Email Routing
- SPF includes both `_spf.mx.cloudflare.net` and `icloud.com` — may cause delivery issues
- Consider migrating to CF Email Routing for consistency

---

## ✅ WORKING (2)

| Domain | Server Header | Status |
|--------|--------------|--------|
| **noizyfish.com** | `x-powered-by: NOIZY/RSP_001`, cloudflare, CF-Ray ✅ | **200 OK** — Pages/Worker active |
| **noizylab.ca** | `x-version: 5.0.0`, cloudflare, CF-Ray ✅ | **200 OK** — Pages/Worker active |

---

## Workers & Pages Projects (9)

| # | Project | Last Deploy | Likely Domain Mapping |
|---|---------|------------|----------------------|
| 1 | noizyvox-landing | 21 min ago | ??? (no custom domain found) |
| 2 | noizyfish-landing | 24 min ago | noizyfish.com ✅ |
| 3 | heaven | 24 min ago | ??? |
| 4 | noizy-app | 6 hrs ago | ??? |
| 5 | noizy-landing | 6 hrs ago | ??? |
| 6-9 | (4 unnamed) | ??? | ??? |

**Problem:** 9 projects exist but only 2 domains serve content. Projects are likely not mapped to custom domains.

---

## 🛠 RECOMMENDED FIX PLAN

### Priority 1 — Fix noizy.ai (your primary brand domain)
```
CF Dashboard → noizy.ai → Workers Routes
  OR
CF Dashboard → Pages → noizy-landing (or noizy-app) → Custom domains → Add noizy.ai
```

### Priority 2 — Fix fishmusicinc.com
```
CF Dashboard → fishmusicinc.com → Pages → Custom domains → map to appropriate project
  OR
CF Dashboard → Rules → Redirect → fishmusicinc.com/* → https://noizyfish.com/$1
```

### Priority 3 — Fix noizykidz.com
```
CF Dashboard → noizykidz.com → DNS → Add A record:
  Name: @  |  IPv4: 192.0.2.1  |  Proxied: ON
Then add redirect rule → https://noizyfish.com or map to a Pages project
```

### Priority 4 — Add www CNAMEs to all domains
```
For each zone → DNS → Add CNAME:
  Name: www  |  Target: @  |  Proxied: ON
```

### Priority 5 — Add DMARC to all domains
```
For each zone → DNS → Add TXT:
  Name: _dmarc  |  Content: v=DMARC1; p=quarantine; rua=mailto:dmarc@noizy.ai
```

### Priority 6 — Create Cloudflare Tunnel for MC96ECO
```bash
# Install cloudflared
brew install cloudflared
cloudflared tunnel login
cloudflared tunnel create noizy-mc96
# Config: expose n8n (:5678), NOIZYNET (:9699), DreamChamber (:7777)
```

---

## Quick Reference

| Domain | Registrar NS | CF Zone Status | Action Needed |
|--------|-------------|---------------|---------------|
| noizyfish.com | ✅ Active | ✅ Serving | Add DMARC, www on other domains |
| fishmusicinc.com | ✅ Active | ⛔ Origin timeout | Map to Pages/Worker or redirect |
| noizy.ai | ✅ Active | ⛔ Origin timeout | Map to Pages/Worker — YOUR BRAND DOMAIN |
| noizykidz.com | ✅ Delegated | ⛔ No DNS records | Add A + map or park properly |
| noizylab.ca | ✅ Active | ✅ Serving | Add www CNAME |
