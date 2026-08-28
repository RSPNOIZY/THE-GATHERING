# noizy.ai — Cloudflare Readiness Plan

> **Authority:** RSP_001 · **Status:** IN PROGRESS · **Canonical:** `ops/DNS_CORRECTNESS_PLAN.md` governs DNS; this doc governs the broader CF surface.
> **Target:** noizy.ai is production-ready on Cloudflare — every subdomain bound, every security gate on, zero drift from canonical configs.

## 🚨 P0 — noizy.ai apex is DOWN (HTTP 522)

**Current state** (`curl -I https://noizy.ai/` returns `HTTP/2 522`). The route `noizy.ai/*` in CF is either orphaned or pointing to a Worker that doesn't respond.

**Root cause:** Two Workers both declare route `noizy.ai/*`:

| Wrangler file                      | Worker name     | Should own apex?                                                  |
| ---------------------------------- | --------------- | ----------------------------------------------------------------- |
| `landing/noizy/wrangler.toml`      | `noizy-landing` | **YES — this is the landing page**                                |
| `repos/noizy-heaven/wrangler.toml` | `heaven`        | **NO — Heaven belongs at `heaven.noizy.ai` per mcp-builder rule** |

**Fix sequence:**

1. `cd landing/noizy && npx wrangler deploy` — re-deploys landing, reclaims the route
2. `landing/noizy/wrangler.toml` already has `[[routes]] pattern="noizy.ai/*"` + `[[routes]] pattern="www.noizy.ai" custom_domain=true` — correct
3. Patch `repos/noizy-heaven/wrangler.toml` — remove the `noizy.ai/*` route, replace with `{ pattern = "heaven.noizy.ai", custom_domain = true }`
4. Re-deploy Heaven: `cd repos/noizy-heaven && npx wrangler deploy`
5. Verify: `curl -I https://noizy.ai/` returns 200, `curl -I https://heaven.noizy.ai/health` returns 200

`noizy-landing.rsp-5f3.workers.dev` itself currently returns 200, so the Worker code is fine — only the apex route binding is broken.

## Hostname Architecture (canonical per `.claude/rules/mcp-builder.md`)

| Hostname             | Role                               | CF Model              | Worker config                                                          | Current state    |
| -------------------- | ---------------------------------- | --------------------- | ---------------------------------------------------------------------- | ---------------- |
| `noizy.ai` (apex)    | Landing — 396 Hz universe          | Worker Route          | `landing/noizy/wrangler.toml`                                          | **BROKEN (522)** |
| `www.noizy.ai`       | Redirect to apex                   | Worker Custom Domain  | `landing/noizy/wrangler.toml`                                          | TBD              |
| `heaven.noizy.ai`    | Consent Kernel API                 | Worker Custom Domain  | `repos/noizy-heaven/wrangler.toml` (needs migration off apex route)    | NXDOMAIN         |
| `mcp.noizy.ai`       | Remote MCP (Streamable HTTP)       | Worker Custom Domain  | `cloudflare/workers/noizy-mcp/wrangler.jsonc`                          | NXDOMAIN         |
| `api.noizy.ai/*`     | Modular API routes                 | Worker Routes         | multiple (consent-gateway, media-gateway, claude-proxy, edge-governor) | NXDOMAIN         |
| `metabeast.noizy.ai` | UI shell (PWA / Pages)             | Pages Custom Domain   | `mcp/metabeast-remote/wrangler.jsonc` (or Pages project)               | NXDOMAIN         |
| `dream.noizy.ai`     | DreamChamber landing               | Worker Custom Domain  | `landing/dreamchamber/wrangler.toml`                                   | NXDOMAIN         |
| `cb01…cb10.noizy.ai` | NOIZYCLOUDS fleet (per CF charter) | Worker Custom Domains | `cloudflare/workers/cf01…cf10-*/`                                      | NXDOMAIN         |

## The 12 Readiness Gates

### Gate 1 — Apex Worker bound (P0 above)

### Gate 2 — DNS baseline (MX/SPF/DMARC/CAA/DKIM)

Run: `bash ops/cf-dns-bootstrap.sh --zone noizy.ai`

### Gate 3 — DNSSEC enabled

Post-registrar-transfer only. CF Dashboard → noizy.ai → DNS → DNSSEC → Enable. Registry (CF Registrar) publishes DS automatically.

### Gate 4 — SSL/TLS Mode: Full (strict)

CF Dashboard → noizy.ai → SSL/TLS → Overview → **Full (strict)**. Current unknown — verify. Any Worker routes require this to avoid infinite redirect loops.

### Gate 5 — Always Use HTTPS + Automatic HTTPS Rewrites

CF Dashboard → noizy.ai → SSL/TLS → Edge Certificates → toggle **Always Use HTTPS** + **Automatic HTTPS Rewrites**.

### Gate 6 — HSTS (Strict-Transport-Security)

CF Dashboard → noizy.ai → SSL/TLS → Edge Certificates → HSTS → Enable with:

- `max-age=31536000` (1 year)
- include subdomains: YES
- preload: YES (after 30d soak)

### Gate 7 — Minimum TLS 1.2

CF Dashboard → SSL/TLS → Edge Certificates → Minimum TLS Version → **TLS 1.2** (or 1.3 for stricter).

### Gate 8 — WAF + Bot Fight Mode

CF Dashboard → noizy.ai → Security → WAF → Managed Rules → enable OWASP Core Rule Set.
Security → Bots → Bot Fight Mode: ON.

### Gate 9 — Rate limiting

Heaven already has KV-based 60/min/IP in code. Verify CF-level rate limit rule for apex + api.noizy.ai pattern (100 req/min burst).

### Gate 10 — R2 enabled (BLOCK 2 from CLAUDE.md)

CF Dashboard → R2 → Get Started (first bucket triggers enable). Create bucket `noizy-voice-dna` for Voice DNA storage.

### Gate 11 — Subdomain Workers deployed

Deploy in order:

1. `landing/noizy` (fixes P0)
2. `repos/noizy-heaven` (on `heaven.noizy.ai` after route migration)
3. `cloudflare/workers/noizy-mcp` (`mcp.noizy.ai`)
4. `mcp/metabeast-remote` or Pages (`metabeast.noizy.ai`)
5. `cloudflare/workers/cf01…cf10-*` (NOIZYCLOUDS fleet — deploy when each CF0X is ready per charter)

### Gate 12 — Email Routing live

Per `ops/DNS_CORRECTNESS_PLAN.md` Phase 1.

## Wrangler Config Conflicts (must resolve before deploys)

| File                                                       | Issue                                                          | Action                                                       |
| ---------------------------------------------------------- | -------------------------------------------------------------- | ------------------------------------------------------------ |
| `wrangler.toml` (root)                                     | Says "NOT THE CANONICAL CONFIG, use repos/noizy-heaven"        | Keep as dev-only reference or delete                         |
| `wrangler.jsonc` (root)                                    | Also named "heaven", has real D1 bindings, route commented out | Reconcile with `repos/noizy-heaven` — **pick one canonical** |
| `repos/noizy-heaven/wrangler.toml`                         | Claims `noizy.ai/*` route (wrong per hostname policy)          | Change to `heaven.noizy.ai` custom_domain                    |
| `MC96ECO/heaven/worker/wrangler.jsonc`                     | 3rd Heaven candidate                                           | Delete or mark superseded (not deployed)                     |
| `mc96/heaven/worker/wrangler.jsonc`                        | 4th Heaven candidate                                           | Delete or mark superseded                                    |
| `apps/heaven-docker/heaven-worker/wrangler.toml`           | Local-only ("heaven-local")                                    | OK as-is, confirm `workers_dev = false`                      |
| `landing/noizy/wrangler.toml`                              | Claims `noizy.ai/*` route — **correct**                        | Deploy                                                       |
| `swift-library/cloudflare/workers/noizy-app/wrangler.toml` | Unknown purpose, probably stale                                | Audit or archive                                             |

## Landing page sprawl

`landing/` contains 7 sub-projects: `noizy`, `noizyfish`, `fishmusicinc`, `dreamchamber`, `noizykidz`, `noizylab`, `noizyvox`.

- **Keep & deploy**: `noizy` (apex), `dreamchamber` (→ `dream.noizy.ai`)
- **Map to brand apex**: `noizyfish` → noizyfish.com, `fishmusicinc` → fishmusicinc.com, `noizykidz` → noizykidz.com, `noizyvox` → noizyvox.com
- **Archive**: `noizylab` (no registered domain; NOIZYLAB is a brand name, not a domain — lives inside noizy.ai space)

## Scripts

| Script                                    | Runs without CF_API_TOKEN? | Purpose                                                         |
| ----------------------------------------- | -------------------------- | --------------------------------------------------------------- |
| `ops/cf-readiness-check.sh`               | YES                        | Public-state audit across 12 gates — green/red summary          |
| `ops/cf-dns-bootstrap.sh --zone <domain>` | NO (needs token)           | DNS baseline install per zone                                   |
| `ops/cf-transfer-preflight.sh <domain>`   | YES                        | Pre-transfer verification                                       |
| `ops/cf-noizy-ai-setup.sh`                | NO (needs token)           | Apply DNSSEC + SSL mode + HSTS + WAF via CF API (after deploys) |
| `ops/cf-zone-health.sh`                   | NO (needs token)           | Post-apply health audit                                         |

## Deploy order (assuming CF login change + 2FA done, CF_API_TOKEN in .env)

```bash
# 1. Reclaim apex (fixes 522)
cd landing/noizy && npx wrangler deploy && cd -

# 2. Migrate Heaven off apex route → heaven.noizy.ai
# (first edit repos/noizy-heaven/wrangler.toml: change routes to heaven.noizy.ai custom_domain)
cd repos/noizy-heaven && npx wrangler deploy && cd -

# 3. Deploy mcp.noizy.ai
cd cloudflare/workers/noizy-mcp && npx wrangler deploy && cd -

# 4. DNS baseline across all 5 zones
for z in noizy.ai noizyfish.com fishmusicinc.com noizykidz.com noizyvox.com; do
  bash ops/cf-dns-bootstrap.sh --zone "$z"
done

# 5. CF zone security settings (SSL strict, HSTS, WAF, Bot Fight, TLS 1.2)
bash ops/cf-noizy-ai-setup.sh

# 6. Full readiness audit
bash ops/cf-readiness-check.sh
```

## Rollback

Every CF Dashboard toggle in gates 4–8 is reversible. Worker deploys are reversible via `npx wrangler rollback [version-id]`. DNS record adds are reversible via CF API DELETE or dashboard. DNSSEC is the only non-trivial rollback (requires registry DS removal).
