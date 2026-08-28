# `noizy.ai` DNS Zone — State Snapshot

**Captured:** 2026-04-13
**Source:** Cloudflare dashboard, direct operator observation
**Purpose:** Canonical record of zone state at the moment Phase 7 bringup begins. Future drift from this baseline should be audited.

---

## Zone records (live as of 2026-04-13)

| Type | Name | Content | Proxy | TTL |
|---|---|---|---|---|
| A | `noizy.ai` | `104.21.91.188` | Proxied | Auto |
| A | `noizy.ai` | `172.67.177.214` | Proxied | Auto |
| AAAA | `noizy.ai` | `2606:4700:3030::6815:5bbc` | Proxied | Auto |
| AAAA | `noizy.ai` | `2606:4700:3033::ac43:b1d6` | Proxied | Auto |
| MX | `noizy.ai` | `route1.mx.cloudflare.net` (pri 59) | DNS only | Auto |
| MX | `noizy.ai` | `route2.mx.cloudflare.net` (pri 16) | DNS only | Auto |
| MX | `noizy.ai` | `route3.mx.cloudflare.net` (pri 63) | DNS only | Auto |
| TXT | `noizy.ai` | `v=spf1 include:_spf.mx.cloudflare.net ~all` | DNS only | Auto |
| TXT | `cf2024-1._domainkey` | Cloudflare DKIM public key (RSA 2048) | DNS only | Auto |
| Worker | `www.noizy.ai` | `__noizy-landing__` | Proxied | Auto |

## Records expected after Phase 7 bringup

| Type | Name | Content | How created |
|---|---|---|---|
| CNAME (proxied) | `voice-mcp.noizy.ai` | Worker custom domain → `voice-bridge-remote` | Auto via `wrangler deploy` |
| CNAME (proxied) | `voice.noizy.ai` | `<tunnel-id>.cfargotunnel.com` | Auto via `cloudflared tunnel route dns` |
| CNAME (proxied) | `gabriel.noizy.ai` | `<tunnel-id>.cfargotunnel.com` | Auto via `cloudflared tunnel route dns` |

## Records expected after DNS Hardening v1.0

| Type | Name | Content |
|---|---|---|
| TXT | `_dmarc` | DMARC policy (see DNS-Hardening-v1.0.md) |
| CAA | `noizy.ai` | 4 records — issue authorization + iodef |
| Bulk Redirect | `noizy.ai/*` | 301 → `https://www.noizy.ai/$1` |

## Observations

- **Apex is proxied, both IPv4 and IPv6.** Origin is hidden behind Cloudflare anycast. Good.
- **No apex Worker or Pages binding visible** — apex A/AAAA resolve to Cloudflare IPs but there's no documented Worker serving apex traffic. Ambiguity to resolve via D-18.
- **Email Routing is configured and active.** Three MX hosts, SPF authorizing Cloudflare, Cloudflare's DKIM signing key present. Inbound mail to `@noizy.ai` is being caught and forwarded.
- **No DMARC.** Identity-layer gap, priority: high (see D-16).
- **No CAA.** Any CA can issue certs for the zone. Priority: medium (see D-17).
- **Phase 7 subdomains absent.** Expected — they're created by deploy commands, not pre-provisioned.

## Changes since last snapshot

*None — this is the first snapshot.*
