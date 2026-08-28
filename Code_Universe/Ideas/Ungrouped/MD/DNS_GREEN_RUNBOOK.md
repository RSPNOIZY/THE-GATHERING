# DNS GREEN RUNBOOK — make every NOIZYFISH zone go active

**Captured:** 2026-04-20 · verified via Cloudflare API + live `dig` + live `whois`
**Target:** every NOIZYFISH zone status = `active` (not `pending`)
**Scope:** You (RSP_001) clicking at 3 different registrars. The Cloudflare side is already done — zones are provisioned, nameservers assigned, just waiting for each registrar to tell the world.
**NOIZYFISH CF account ID:** `5f36aa9795348ea681d0b21910dfc82a`

---

## Current state (live, from CF API + dig)

| Domain | Registrar | Current NS pair | NOIZYFISH expects | Status |
|---|---|---|---|---|
| **noizyfish.com** | — | marek / tara | marek / tara | 🟢 active — done |
| **noizykidz.com** | — | marek / tara | marek / tara | 🟢 active — done |
| **noizy.ai** | **GoDaddy** | alex / melinda (legacy CF acct) | marek / tara | 🟡 pending — flip NS |
| **fishmusicinc.com** | **GoDaddy** | alex / melinda (legacy CF acct) | marek / tara | 🟡 pending — flip NS |
| **noizylab.ca** | **CentralNic Canada** | naomi / renan (another CF acct) | marek / tara | 🟡 pending — flip NS |
| **noizyvox.com** | **Cloudflare Registrar** | naomi / renan (another CF acct) | — not in NOIZYFISH zones | ⚪ special — see §3 |

**Target NS pair (same for all pending):** `marek.ns.cloudflare.com` + `tara.ns.cloudflare.com`

---

## 1 · GoDaddy — two domains (noizy.ai + fishmusicinc.com)

Do both while logged in to the same GoDaddy account.

### 1.1 Log in to GoDaddy

<https://sso.godaddy.com> → sign in as the account that owns noizy.ai / fishmusicinc.com.

### 1.2 For each domain (repeat twice)

1. Top-right menu → **My Products** → **Domains**.
2. Click the domain name (`noizy.ai`, then `fishmusicinc.com`).
3. Scroll to **Nameservers** section → click **Change**.
4. Choose **"Enter my own nameservers (advanced)"** (or similar — GoDaddy changes this wording).
5. Replace existing entries with exactly:
   - `marek.ns.cloudflare.com`
   - `tara.ns.cloudflare.com`
6. **Save**. GoDaddy may prompt "are you sure" — confirm.
7. Propagation is usually < 5 minutes; can take up to 48 hours globally.

### 1.3 Verify each — from this machine

```bash
dig +short noizy.ai NS        # expect: marek.ns.cloudflare.com + tara.ns.cloudflare.com
dig +short fishmusicinc.com NS
```

Run again after 5 min if still showing `alex/melinda`.

---

## 2 · CentralNic Canada — one domain (noizylab.ca)

CentralNic is the registry for .ca; the user-facing portal depends on which reseller you used. Check the confirmation email from 2025-10-24 for the login URL. Most likely one of:

- **Cloudflare Registrar** (if you transferred) — <https://dash.cloudflare.com>
- **Rebel.ca / CIRA registrar** (if original)
- **Namecheap / other reseller**

### 2.1 Log into the registrar's portal, find noizylab.ca

### 2.2 Change nameservers to:

- `marek.ns.cloudflare.com`
- `tara.ns.cloudflare.com`

Most .ca portals have a "Custom Nameservers" input where you paste both and save.

### 2.3 Verify

```bash
dig +short noizylab.ca NS
```

---

## 3 · noizyvox.com — special case (Cloudflare Registrar, wrong CF account)

`noizyvox.com` is already registered at **Cloudflare Registrar** (created 2025-12-11), but inside a **different** Cloudflare account (the one using `naomi/renan` nameservers — not NOIZYFISH, not the legacy-non-prod one).

**Two options:**

### Option A — Leave it where it is, add it as a zone to NOIZYFISH

Simpler. Doesn't require moving the registrar record. But nameservers will not match NOIZYFISH's `marek/tara` — the zone lives in the account that minted it.

**Not recommended** — fragments your control plane across accounts.

### Option B — Move noizyvox.com from the other CF account to NOIZYFISH (recommended)

In the **source** Cloudflare account (the `naomi/renan` one):
1. Dashboard → Domain Registration → noizyvox.com
2. **"Transfer to another Cloudflare account"** — pick NOIZYFISH as the destination
3. Confirm

Zone nameservers will auto-update to NOIZYFISH's `marek/tara` after the transfer, status will go active.

### 3.1 Verify

```bash
dig +short noizyvox.com NS   # expect: marek.ns.cloudflare.com + tara.ns.cloudflare.com
```

Plus check `https://dash.cloudflare.com/5f36aa9795348ea681d0b21910dfc82a/domains/overview` — `noizyvox.com` should appear.

---

## 4 · Full green verification — run this from CLI

After each flip or transfer, re-run this block. Zones don't go green until propagation completes + CF's 15-minute re-check fires.

```bash
# Real-world NS for every NOIZY domain
for d in noizyfish.com noizykidz.com noizy.ai fishmusicinc.com noizylab.ca noizyvox.com; do
  printf "%-24s  %s\n" "$d" "$(dig +short $d NS | tr '\n' ' ')"
done

# CF zone status for NOIZYFISH account
TOKEN=$(grep '^oauth_token' ~/Library/Preferences/.wrangler/config/default.toml | cut -d'"' -f2)
curl -s "https://api.cloudflare.com/client/v4/zones?account.id=5f36aa9795348ea681d0b21910dfc82a&per_page=50" \
  -H "Authorization: Bearer $TOKEN" | python3 -c "
import json, sys
for z in json.load(sys.stdin).get('result', []):
    print(f\"{z['name']:24} · {z['status']}\")"
```

**Green = every line says `active`.** Anything that says `pending` still needs NS work (or hasn't propagated yet).

---

## 5 · Known trap — don't forget

- **Keep GoDaddy renewals paid** until the registrar transfer BLOCK 0 completes. Changing nameservers does NOT transfer the registrar — the domains still live at GoDaddy billing-wise until you run the full transfer flow.
- **Don't flip both GoDaddy NS at once for noizy.ai** if you rely on any existing `alex/melinda` DNS records — the legacy CF account's zone will stop serving once you flip. But since that account is marked non-prod, this should be fine. Cross-check by opening the legacy account dashboard (`2446d788cc4280f5ea22a9948410c355`) and confirming nothing critical lives there.
- **noizyvox.com is built for consent-locked voice platform** — per `MASTER_REGISTRY.md`, it's important NOT to lose control of this domain. Transfer carefully and verify end-state before declaring green.

---

## Estimated time

- GoDaddy × 2 domains: 4 minutes total
- CentralNic .ca: 3 minutes once you find the portal
- noizyvox.com CF transfer: 5 minutes
- Propagation wait: 2-30 minutes typical, up to 48 hours worst-case

Total active work: ~15 minutes. Then wait, then re-run §4 until every line says active.
