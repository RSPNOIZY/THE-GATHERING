# NOIZY Empire DNS — as code

**Source of truth:** `infra/dns/zones/*.zone` (BIND format, raw text).
**Control plane:** HEAVEN Worker — `heaven.rsp-5f3.workers.dev/api/v1/dns/*`.
**Data plane:** Cloudflare DNS (5 zones across NOIZYFISH + Fishmusicinc CF accounts — post-2026-04-18 noizyfish.ca ratified as not-registered).

Git is the spec. HEAVEN validates, plans, applies, audits. Cloudflare serves.

## Why this exists

Before today, empire DNS lived in Cloudflare's dashboard + scattered `scripts/*.sh` exports. No git history, no audit trail, no enforcement of basics like "DMARC present on apex." This directory is the fix: every empire brand's DNS written as a declarative zone file you can read out loud, diff in git, and re-import into any DNS host on the planet.

## The 5 brand zones

| Zone file                     | Registrar                                | CF account             | Email routing                     | Notes                                          |
| ----------------------------- | ---------------------------------------- | ---------------------- | --------------------------------- | ---------------------------------------------- |
| `zones/noizy.ai.zone`         | GoDaddy (exit pending — renew +2y first) | NOIZYFISH              | LIVE                              | Flagship. mcp/api/heaven subdomains.           |
| `zones/noizyfish.com.zone`    | GoDaddy (exit pending)                   | NOIZYFISH              | LIVE                              | Master brand. Primary email host.              |
| `zones/fishmusicinc.com.zone` | GoDaddy (exit pending)                   | NOIZYFISH              | LIVE                              | Legacy music brand. CF Email Routing → iCloud. |
| `zones/noizykidz.com.zone`    | Cloudflare                               | NOIZYFISH              | fix via `ops/cf-dns-bootstrap.sh` | Kids platform. safety@ alias for COPPA.        |
| `zones/noizyvox.com.zone`     | Cloudflare                               | Fishmusicinc → migrate | fix via `ops/cf-dns-bootstrap.sh` | Voice brand. Target: consolidate to NOIZYFISH. |

## The shape of the system

```
   SPEC                    CONTROL                       DATA
┌──────────────┐      ┌──────────────────┐        ┌──────────────┐
│ *.zone files │ ───▶ │ HEAVEN /api/v1/  │ ─────▶ │  Cloudflare  │
│   (git)      │      │   dns/* endpoints│        │   live DNS   │
│              │      │                  │        │              │
│              │      │ D1: noizy_dns_*  │        │              │
│              │      │ Ledger: dns.*    │        │              │
│              │      │ Never Clauses    │        │              │
└──────────────┘      └──────────────────┘        └──────────────┘
        ▲                      │
        │                      │
        └──── diff detection ──┘
         (drift alerts on drift
          between git and live)
```

## Doctrine baked into every zone

Every brand zone ships with, from day one:

1. **MX** → Cloudflare Email Routing (`route1/2/3.mx.cloudflare.net`, priorities 10/20/30).
2. **SPF** → `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all` on every brand zone. M365/Outlook include removed 2026-04-18 (M365 exit ratified — see `ops/DNS_CORRECTNESS_PLAN.md`).
3. **DMARC** → `p=quarantine` from day one. `rua/ruf` to `rsp@noizyfish.com` (master inbox). Strict alignment (`adkim=s aspf=s`). 100% enforcement.
4. **DKIM** → commented placeholder. Fill in once Workspace / M365 generates the public key.

## Apply procedure (when HEAVEN endpoints ship)

```bash
# 1. Diff — what would change vs live?
curl -s "https://heaven.rsp-5f3.workers.dev/api/v1/dns/zones/noizy.ai/diff" \
     -H "X-NOIZY-Key: $NOIZY_API_KEY" | jq .

# 2. Apply — push zone file to Cloudflare via HEAVEN
curl -s -X POST "https://heaven.rsp-5f3.workers.dev/api/v1/dns/zones/noizy.ai/apply" \
     -H "X-NOIZY-Key: $NOIZY_API_KEY"

# 3. Audit — run DNS Never Clauses across all zones
curl -s "https://heaven.rsp-5f3.workers.dev/api/v1/dns/audit" \
     -H "X-NOIZY-Key: $NOIZY_API_KEY" | jq .
```

## DNS Never Clauses (to encode in `/api/v1/dns/audit`)

1. **NEVER remove DMARC TXT from apex.** Empire-wide anti-spoof protection.
2. **NEVER weaken DMARC policy on a domain that has ever sent mail.** (no `quarantine → none` transitions.)
3. **NEVER delete MX records on `noizyfish.com`.** That's the master inbox — every other brand forwards here.

## What's shipped today (2026-04-17)

- 6 `.zone` files under `infra/dns/zones/` — declarative source of truth.
- `migrations/001_dns_state.sql` — D1 schema (`noizy_dns_zones`, `noizy_dns_records`) + 6-row seed.
- This README.

## What ships next (post-April-17)

- `GET  /api/v1/dns/zones` — list configured zones + last-applied state.
- `GET  /api/v1/dns/zones/:domain/diff` — zone file vs live CF.
- `POST /api/v1/dns/zones/:domain/apply` — CF API write + D1 mirror + ledger log.
- `GET  /api/v1/dns/audit` — run Never Clauses.
- `CF_DNS_TOKEN` Worker secret (scoped: Zone:Read, Zone:Edit, DNS:Edit on the 6 zones only).
- Retirement of `scripts/export-dns.sh` and `ops/godaddy-exit-dns.sh` — HEAVEN owns it.

## Open items (visible, not hidden)

- [x] ~~Verify `noizyfish.ca` registration status~~ — ratified 2026-04-18: NOT registered, not registering.
- [ ] Paste Workspace DKIM public key into `google._domainkey` TXT placeholders (5 zones).
- [ ] Paste verification records (Google `google-site-verification`) once issued.
- [x] ~~Fill M365 DKIM CNAMEs for `fishmusicinc.com`~~ — M365 exit ratified 2026-04-18; M365-specific records removed from fishmusicinc zone.
- [ ] Migrate `noizyvox.com` out of Fishmusicinc CF account into NOIZYFISH — then retire Fishmusicinc account.
- [ ] Bind real apex A records once each brand has a Worker/Pages/landing target.
