# DNS Correctness Plan — GoDaddy Exit + Cloudflare Robustness

> **Authority:** RSP_001 — **Status:** ACTIVE — **Target:** all domains transferred, all zones standardized, GoDaddy closed.
> **Supersedes:** `.claude/prompts/godaddy-exit.md` (legacy), `.claude/skills/godaddy-migration/SKILL.md` (stale — being updated).

## Live Inventory (verified 2026-04-18)

| #   | Domain           | Registrar   | CF Account                | NS pair      | MX  | SPF | DMARC   | DKIM | CAA | Expiry     | Lock | Transfer-ready                  |
| --- | ---------------- | ----------- | ------------------------- | ------------ | --- | --- | ------- | ---- | --- | ---------- | ---- | ------------------------------- |
| 1   | noizy.ai         | **GoDaddy** | NOIZYFISH                 | alex/melinda | ✓   | ✓   | ✗       | ✓    | ✗   | 2027-09-26 | ok   | **.ai needs ≥2y — renew first** |
| 2   | noizyfish.com    | **GoDaddy** | NOIZYFISH                 | marek/tara   | ✓   | ✓   | ✗       | ✓    | ✗   | TBD        | ok   | YES                             |
| 3   | fishmusicinc.com | **GoDaddy** | NOIZYFISH                 | alex/melinda | ✓   | ✓   | ✗       | ✓    | ✗   | TBD        | ok   | YES                             |
| 4   | noizykidz.com    | Cloudflare  | NOIZYFISH                 | marek/tara   | ✗   | ✗   | ✗       | ✗    | ✗   | 2027-04    | —    | —                               |
| 5   | noizyvox.com     | Cloudflare  | **Fishmusicinc (legacy)** | naomi/renan  | ✗   | ✗   | partial | ✗    | ✗   | 2026-12    | —    | —                               |

Ratified decisions (from 2026-04-18 session): **order = (a) bleed-fix → (c) registrar transfer → (b) account consolidation**. noizyvox merge strategy = **merge into NOIZYFISH** (NOIZYCLOUDS charter compliance). `.ca` domains = **not registering now**.

## Robustness Baseline (every zone gets all 6)

Per-zone minimum record set. Scripted via `ops/cf-dns-bootstrap.sh`.

1. **MX** — 3x Cloudflare Email Routing (route1/route2/route3.mx.cloudflare.net)
2. **SPF** — `v=spf1 include:_spf.mx.cloudflare.net ~all`
3. **DMARC** — `v=DMARC1; p=none; rua=mailto:rsp@noizy.ai; adkim=r; aspf=r` (monitoring mode — harden to `p=quarantine` after 30d)
4. **DKIM** — CF Email Routing auto-signs `cf2024-1._domainkey` (automatic on enable)
5. **CAA** — issue restricted to `letsencrypt.org`, `pki.goog`, `digicert.com` + `iodef mailto:rsp@noizy.ai`
6. **Catch-all + `rsp@`** — Email Routing rules → `rsplowman@icloud.com`

Proxy rules: apex A/AAAA proxied (orange cloud). Email routing subdomains (MX targets) — Cloudflare-owned, not proxied. DKIM/SPF/DMARC/CAA — TXT/CAA, not proxied.

## Phases

### Phase 1 — Stop the Bleed (today, ~30 min, automatable)

**Goal:** kill the silent bounces on noizykidz + noizyvox, bring every zone to the robustness baseline.

- [ ] [YOU] Mint CF API token (scopes below) → export `CF_API_TOKEN`
- [ ] [ME] Run `ops/cf-dns-bootstrap.sh --zone noizykidz.com`
- [ ] [ME] Run `ops/cf-dns-bootstrap.sh --zone noizyvox.com` (bootstraps in current CF account — Fishmusicinc — we consolidate in Phase 4)
- [ ] [ME] Run `ops/cf-dns-bootstrap.sh --zone noizy.ai` (adds DMARC + CAA)
- [ ] [ME] Run `ops/cf-dns-bootstrap.sh --zone noizyfish.com`
- [ ] [ME] Run `ops/cf-dns-bootstrap.sh --zone fishmusicinc.com`
- [ ] [ME] Re-run audit — every zone shows ✓ on all 6 baseline items
- [ ] [YOU] Verify email: send test from external to `rsp@noizykidz.com` + `rsp@noizyvox.com` — both should land in iCloud inbox

### Phase 2 — .ai Renewal (blocker for noizy.ai transfer)

`.ai` registry requires ≥2 years remaining before any transfer. noizy.ai has 1.4y → must renew at GoDaddy first.

- [ ] [YOU] Renew noizy.ai at GoDaddy for **+2 years** (~$200 — ironic, but the only path). New expiry will be ~2029-09-26, which clears the 2y-minimum easily.
- [ ] [YOU] Confirm renewal processed — whois shows new expiry
- [ ] [YOU] Disable GoDaddy auto-renew on all 3 domains (prevents double-charge after CF transfer)

### Phase 3 — Cloudflare Account Access Lockdown

Before transferring ANYTHING, the CF account login must be on a backend email, not the public face.

- [ ] [YOU] Log into `dash.cloudflare.com` with current credentials (`rsp@noizyfish.com`)
- [ ] [YOU] Profile → **Email Address** → change to `rsplowman@icloud.com` → verify via iCloud inbox
- [ ] [YOU] Log out, log back in with new email to confirm
- [ ] [YOU] Enable **2FA** (Authenticator app, not SMS)
- [ ] [YOU] Download **2FA recovery codes** → save to 1Password
- [ ] [YOU] Add **payment method** to CF Registrar (Billing → Payment) — required before any transfer
- [ ] [ME] Verify nothing broke: `curl https://heaven.rsp-5f3.workers.dev/health` returns `ok`

### Phase 4 — Registrar Transfers (5–10 day clock per domain, passive wait)

For each of the 3 GoDaddy domains:

- [ ] [YOU] GoDaddy → **Domains** → [domain] → **Transfer away** → copy **EPP/auth code** (paste into `ops/.transfer-codes.env` locally — **DO NOT COMMIT**)
- [ ] [YOU] GoDaddy → [domain] → **Unlock domain** (if not already)
- [ ] [YOU] CF Dashboard → **Domain Registration** → **Transfer Domains** → enter domain + EPP
- [ ] [YOU] Registrant email uses `rsplowman@icloud.com`; verify CF sends confirmation → click
- [ ] [YOU] When GoDaddy emails "do you want to release this domain?" → **APPROVE** (silence = release after 5d, but don't wait)
- [ ] [ME] Run `ops/cf-transfer-preflight.sh` before initiating — catches locks, lock-age, minimum-term issues
- [ ] [ME] Run `ops/cf-transfer-status.sh` daily until all 3 show "Complete"

Order of transfer (least-risky first): **fishmusicinc.com** → **noizyfish.com** → **noizy.ai** (after .ai renewal clears).

### Phase 5 — Account Consolidation (noizyvox → NOIZYFISH)

Last, because it's the only step with user-visible downtime (DNS gap during zone move).

- [ ] [ME] Export current noizyvox.com records from Fishmusicinc CF account via API
- [ ] [YOU] CF Dashboard (Fishmusicinc account) → noizyvox.com → **Delete Zone**
- [ ] [YOU] CF Dashboard (NOIZYFISH account) → **Add a Site** → noizyvox.com → Free plan
- [ ] [YOU] Registrar side: if zone-delete didn't break the registrar binding, re-bind to NOIZYFISH; otherwise CF handles it automatically since the domain's already on Cloudflare Registrar
- [ ] [ME] Re-apply records: `ops/cf-dns-bootstrap.sh --zone noizyvox.com`
- [ ] [ME] Re-apply any custom records (export from step 1 minus the baseline)
- [ ] [YOU] Log into Fishmusicinc CF account → verify it has **zero zones, zero resources** → close account via CF support (self-service account close isn't exposed; ticket required)

**Timing window:** do Phase 5 during a deliberately chosen low-traffic window. noizyvox.com is not yet customer-facing, so the risk is lowest today.

### Phase 6 — GoDaddy Close + Verification

- [ ] [YOU] Cancel any lingering GoDaddy services (M365, privacy, WHOIS guard, hosting, SSL products)
- [ ] [YOU] Download final invoice/tax records → save to `~/NOIZYANTHROPIC/ops/godaddy-final-archive/`
- [ ] [YOU] Close GoDaddy account(s)
- [ ] [ME] Run `ops/cf-transfer-postflight.sh` — every zone passes every baseline check
- [ ] [ME] Update `project_domain_empire` memory with new state
- [ ] [ME] Mark `godaddy-migration` skill as COMPLETE

## CF API Token — required scopes (Phase 1 prerequisite)

Mint at https://dash.cloudflare.com/profile/api-tokens → **Create Custom Token**:

| Resource                          | Permission |
| --------------------------------- | ---------- |
| Zone → Zone                       | **Read**   |
| Zone → DNS                        | **Edit**   |
| Zone → Email Routing Addresses    | **Edit**   |
| Zone → Email Routing Rules        | **Edit**   |
| Account → Email Routing Addresses | **Edit**   |

Account Resources: include **both accounts** (NOIZYFISH + Fishmusicinc) so Phase 5 works with the same token. TTL: 90 days.

Export: `echo "CF_API_TOKEN=<token>" >> ~/NOIZYANTHROPIC/.env` (already gitignored) then `export CF_API_TOKEN=<token>` in your shell.

## Rollback

Any phase rollback within 5 days of transfer initiation:

- Transfer cancel → CF Dashboard → Domain → Cancel Transfer
- Nameserver rollback → point back to GoDaddy NS (they retain config for 60 days post-transfer)
- Email Routing rollback → disable per-zone in CF Dashboard; MX records revert

## Record of ratified decisions (this session)

- Priority order: bleed-fix → registrar → consolidation ✓
- noizyvox strategy: merge (not federate) ✓
- .ca domains: not registering ✓
- CF login backend: `rsplowman@icloud.com` ✓
- Public face email: `rsp@noizyfish.com` (universal NOIZY contact, unchanged) ✓
