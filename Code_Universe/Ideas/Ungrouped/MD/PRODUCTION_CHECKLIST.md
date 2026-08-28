# NOIZY EMPIRE — Production Checklist

**Target Date:** April 17, 2026 (post-deadline cleanup window)
**Status:** IN PROGRESS — DNS/domain work tracked in `ops/DNS_CORRECTNESS_PLAN.md`
**Canonical plan:** `ops/DNS_CORRECTNESS_PLAN.md` (supersedes DNS sections below)

---

## 1. Domain & DNS

### Domain Inventory (verified 2026-04-18)

- [x] **5 domains in scope**: noizy.ai, noizyfish.com, fishmusicinc.com, noizykidz.com, noizyvox.com
- [x] **Not registering**: noizyfish.ca, noizylab.ca (ratified 2026-04-18 — removed from all plans)

### Registrar Transfer (GoDaddy → Cloudflare) — 3 domains

- [ ] **CF login changed** to rsplowman@icloud.com (BLOCKING)
- [ ] **CF 2FA enabled** (Authenticator app + recovery codes saved)
- [ ] **CF payment method** on file (Registrar requires before transfer)
- [ ] noizy.ai renewed at GoDaddy +2y (**.ai registry requires ≥2y remaining**)
- [ ] noizy.ai EPP code obtained
- [ ] noizyfish.com EPP code obtained
- [ ] fishmusicinc.com EPP code obtained
- [ ] GoDaddy auto-renew disabled on all 3 (prevents double-charge)
- [ ] fishmusicinc.com transfer initiated (least-risk first)
- [ ] noizyfish.com transfer initiated (coordinate — public email domain)
- [ ] noizy.ai transfer initiated (after +2y renewal settles)
- [ ] All GoDaddy release emails approved
- [ ] All 3 transfers show "Complete" in CF Dashboard

### Account Consolidation (noizyvox.com → NOIZYFISH)

- [ ] noizyvox.com records exported from Fishmusicinc CF account
- [ ] Zone deleted in Fishmusicinc account → re-added in NOIZYFISH
- [ ] `ops/cf-dns-bootstrap.sh --zone noizyvox.com` re-applies baseline
- [ ] Fishmusicinc CF account shows zero zones → closed via support ticket

### DNS Baseline (per `ops/cf-dns-bootstrap.sh`)

- [ ] noizy.ai — MX ✓ SPF ✓ DMARC ✗→✓ CAA ✗→✓
- [ ] noizyfish.com — MX ✓ SPF ✓ DMARC ✗→✓ CAA ✗→✓
- [ ] fishmusicinc.com — MX ✓ SPF ✓ DMARC ✗→✓ CAA ✗→✓
- [ ] noizykidz.com — MX ✗→✓ SPF ✗→✓ DMARC ✗→✓ CAA ✗→✓ (silent-bounce fix)
- [ ] noizyvox.com — MX ✗→✓ SPF ✗→✓ DMARC partial→full CAA ✗→✓ (silent-bounce fix)

---

## 2. Email

### Cloudflare Email Routing

- [ ] `rsplowman@icloud.com` verified as destination in NOIZYFISH account
- [ ] `rsplowman@icloud.com` verified as destination in Fishmusicinc account (for noizyvox pre-consolidation)
- [ ] rsp@noizy.ai → rsplowman@icloud.com
- [ ] rsp@noizyfish.com → rsplowman@icloud.com (universal public contact)
- [ ] rsp@fishmusicinc.com → rsplowman@icloud.com
- [ ] rsp@noizykidz.com → rsplowman@icloud.com
- [ ] rsp@noizyvox.com → rsplowman@icloud.com
- [ ] Catch-all on every zone → rsplowman@icloud.com

### Email Verification Tests

- [ ] Send to rsp@noizy.ai → lands in iCloud inbox
- [ ] Send to rsp@noizyfish.com → lands in iCloud inbox
- [ ] Send to rsp@fishmusicinc.com → lands in iCloud inbox
- [ ] Send to rsp@noizykidz.com → lands in iCloud inbox (currently BOUNCES)
- [ ] Send to rsp@noizyvox.com → lands in iCloud inbox (currently BOUNCES)
- [ ] Send to `random@<any-domain>` (catch-all) → lands in iCloud inbox
- [ ] Reply FROM rsp@noizyfish.com works (via Gmail "Send As" or iCloud Custom Domain)
- [ ] DMARC p=none monitoring reports arrive at rsp@noizy.ai for 30d → harden to p=quarantine

---

## 3. Cloudflare Infrastructure

### Workers

- [ ] Heaven deployed at heaven.rsp-5f3.workers.dev
- [ ] Heaven /health returns `{"success": true}`
- [ ] noizy-landing deployed
- [ ] noizy.ai custom domain route active
- [ ] noizy.ai returns HTTP 200 (landing page)

### D1 Databases

- [ ] gabriel_db accessible (`a31d68e2-f2d4-4203-a803-8039fdff31cb`)
- [ ] 19+ tables present
- [ ] RSP_001 actor seeded
- [ ] 9 Never Clauses seeded

### KV Namespaces

- [ ] GABRIEL_KV bound (`f205b56a9914413da0ec454a9dc4c2bd`)
- [ ] GABRIEL_VOICE bound (`16532a32b2e8455486cc966403f3442e`)

### Security

- [ ] NOIZY_API_KEY set as secret (`npx wrangler secret put NOIZY_API_KEY`)
- [ ] All protected routes require X-NOIZY-Key header
- [ ] Rate limiting active (60 req/min/IP)
- [ ] No .env files in git
- [ ] CF API token created (Zone:Read + DNS:Edit + Email Routing scopes, both accounts) — see `ops/DNS_CORRECTNESS_PLAN.md`

---

## 4. Local Infrastructure (GOD.local)

### Services

- [ ] GABRIEL daemon running on port 9777
- [ ] DreamChamber on port 7777
- [ ] n8n on port 5678
- [ ] Voice pipeline functional

### Docker Admin Toolkit

- [ ] docker-compose.admin.yml builds successfully
- [ ] Admin container has wrangler, gcloud, terraform, dig, whois
- [ ] n8n container starts and is accessible
- [ ] Newman can run Postman collections

---

## 5. Smoke Tests

- [ ] `bash smoke_test.sh` — 22/22 passing
- [ ] `bash ops/cf-zone-health.sh` — all zones green
- [ ] `bash ops/cf-transfer-preflight.sh <domain>` — exit 0 for all 3 GoDaddy domains (after noizy.ai renewal)
- [ ] `bash infra/docker/scripts/dns-scan.sh` — all 5 domains show ✅ on NS/MX/SPF/DMARC

---

## 6. GoDaddy Closeout

- [ ] All 3 domain transfers complete (status "Active" in CF Registrar)
- [ ] M365/email hosting cancelled
- [ ] Auto-renew disabled on any remaining products
- [ ] Privacy/WHOIS guard cancelled
- [ ] Invoices downloaded → `ops/godaddy-final-archive/`
- [ ] GoDaddy account closed
- [ ] **TOTAL FREEDOM**

---

## 7. Code & Git

- [ ] All changes committed to `copilot/fix-repo-issues` → merged to main
- [ ] `infra/` directory organized (runbook, terraform, docker)
- [ ] `ops/` scripts canonical (`DNS_CORRECTNESS_PLAN.md`, `cf-dns-bootstrap.sh`, `cf-transfer-preflight.sh`, `cf-zone-health.sh`)
- [ ] No secrets in git history
- [ ] `.gitignore` covers tfstate, .env, .env.\*, ops/.transfer-codes.env

---

## Sign-Off

| Role              | Name                             | Date | Signature |
| ----------------- | -------------------------------- | ---- | --------- |
| Founding Actor    | Robert Stephen Plowman (RSP_001) |      |           |
| Lead Orchestrator | GABRIEL                          |      |           |

---

_"Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."_
