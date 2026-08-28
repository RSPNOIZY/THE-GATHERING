# Global DNS Topology — noizy.ai

**Zone ID:** `382cd2ace38f1187c67b960bf5f0c4cb`
**Account:** NOIZYFISH (`5f36aa9795348ea681d0b21910dfc82a`)
**Plan:** Pro Website (paid tier — unlocks Argo, higher rate limits, image optimization)
**Target NS:** `marek.ns.cloudflare.com` + `tara.ns.cloudflare.com`
**Global:** Cloudflare's authoritative DNS serves every record from 300+ edge PoPs automatically. "Global" is the default — you don't configure it, you inherit it.
**Status as of 2026-04-20:** zone pending (NS not yet flipped at GoDaddy — see `CB01_DOMAIN_FLIP_RUNBOOK.md`).

---

## Design principles

1. **Apex + www symmetric** — both serve the same landing page; www 301s to apex (or both CNAME to landing Worker).
2. **Every NOIZY service gets its own subdomain** — heaven, mcp, metabeast, api, control, dashboard, gabriel, lucy, dream, wisdom, consent, cb01, mesh, webhooks.
3. **Proxied (orange-cloud ☁) by default** — Cloudflare in front of every origin for DDoS absorb, WAF, cache, TLS. Mesh + origin-access records stay grey (DNS-only) so CF Access tunnel works.
4. **Email via Cloudflare Email Routing** — MX + SPF + DMARC declared here; DKIM issued by Email Routing automatically.
5. **DNSSEC on** — one-time toggle after NS flips.
6. **CAA records** restrict TLS issuance to Cloudflare + Let's Encrypt (stops rogue CAs).

---

## 1 · Apex + www

| Name           | Type  | Content     | Proxied | TTL  | Purpose                                                       |
| -------------- | ----- | ----------- | ------- | ---- | ------------------------------------------------------------- |
| `@` (noizy.ai) | A     | `192.0.2.1` | ☁       | auto | Placeholder IP — Worker Custom Domain replaces this at deploy |
| `@`            | AAAA  | `100::`     | ☁       | auto | IPv6 placeholder — Worker handles                             |
| `www`          | CNAME | `noizy.ai`  | ☁       | auto | www → apex                                                    |

> The A/AAAA placeholder convention is Cloudflare's documented pattern for Worker Custom Domain binding. When `noizy-landing` deploys with `"custom_domains": [{"pattern":"noizy.ai"}]`, CF replaces these automatically.

## 2 · Service subdomains (Workers + Pages + Routes)

| Name        | Type | Content              | Proxied | Service                                            | Status                             |
| ----------- | ---- | -------------------- | ------- | -------------------------------------------------- | ---------------------------------- |
| `heaven`    | AAAA | `100::`              | ☁       | Heaven Worker — Consent Kernel                     | Custom Domain binding              |
| `mcp`       | AAAA | `100::`              | ☁       | Remote MCP gateway (Streamable HTTP)               | Per `mcp-builder.md`               |
| `metabeast` | AAAA | `100::`              | ☁       | Pages — DreamChamber UI shell                      | Pages Custom Domain                |
| `api`       | AAAA | `100::`              | ☁       | Modular API Workers — Worker Routes                | `api.noizy.ai/*` patterns          |
| `control`   | AAAA | `100::`              | ☁       | THE-GATHERING control plane                        | Future                             |
| `dashboard` | AAAA | `100::`              | ☁       | NOIZYARMY dashboard                                | Future                             |
| `gabriel`   | AAAA | `100::`              | ☁       | GABRIEL Worker (`cloudflare/workers/gabriel`)      | Already has route pattern          |
| `lucy`      | AAAA | `100::`              | ☁       | LUCY iPad portal                                   | Future                             |
| `dream`     | AAAA | `100::`              | ☁       | DreamChamber brand portal                          | Future                             |
| `wisdom`    | AAAA | `100::`              | ☁       | Wisdom Project portal (replaces wisdomproject.com) | Future                             |
| `consent`   | AAAA | `100::`              | ☁       | Consent Gateway Worker                             | Per MASTER_REGISTRY                |
| `cb01`      | AAAA | `100::`              | ☁       | CB01 ops router                                    | Per MASTER_REGISTRY                |
| `webhooks`  | AAAA | `100::`              | ☁       | Webhook Proxy Worker                               | Per MASTER_REGISTRY                |
| `mesh`      | A    | `${GOD_TUNNEL_IPV4}` | ⚪ grey | Cloudflared tunnel to GOD.local:9696               | DNS-only; tunnel handles transport |

## 3 · Email Routing

| Name     | Type | Priority | Content                                                                            | Purpose                          |
| -------- | ---- | -------- | ---------------------------------------------------------------------------------- | -------------------------------- |
| `@`      | MX   | 10       | `route1.mx.cloudflare.net`                                                         | CF Email Routing MX pool         |
| `@`      | MX   | 20       | `route2.mx.cloudflare.net`                                                         | "                                |
| `@`      | MX   | 30       | `route3.mx.cloudflare.net`                                                         | "                                |
| `@`      | TXT  | —        | `"v=spf1 include:_spf.mx.cloudflare.net ~all"`                                     | SPF — authorize CF Email Routing |
| `_dmarc` | TXT  | —        | `"v=DMARC1; p=quarantine; rua=mailto:rsp@noizy.ai; ruf=mailto:rsp@noizy.ai; fo=1"` | DMARC — quarantine + report      |

**DKIM** is auto-issued by Email Routing — no manual record. Rule config (rsp@noizy.ai → rsplowman@icloud.com) lives in CF dashboard.

## 4 · CAA (TLS issuance restriction)

| Name | Type | Flags | Tag       | Value                                                  |
| ---- | ---- | ----- | --------- | ------------------------------------------------------ |
| `@`  | CAA  | 0     | issue     | `"letsencrypt.org"`                                    |
| `@`  | CAA  | 0     | issue     | `"pki.goog"` (Google Trust Services — CF's CA partner) |
| `@`  | CAA  | 0     | issuewild | `"letsencrypt.org"`                                    |
| `@`  | CAA  | 0     | iodef     | `"mailto:rsp@noizy.ai"`                                |

CAA locks out every other CA. If a bad actor ever tries to issue for noizy.ai elsewhere, they get refused AND you get an incident report email.

## 5 · DNSSEC

**Enable after NS flips are complete.** Pre-flip, DNSSEC would break resolution.

```bash
# Via CF API (needs Zone.DNSSEC:Edit scope):
PATCH /zones/{zone_id}/dnssec  { "status": "active" }
# Then copy the DS record from the response and paste it at the .ai registrar
```

## 6 · Verification sweep (post-apply)

```bash
for sub in "" www heaven mcp metabeast api control dashboard gabriel lucy dream wisdom consent cb01 webhooks mesh; do
  host=$( [ -z "$sub" ] && echo "noizy.ai" || echo "$sub.noizy.ai" )
  printf "%-28s " "$host"
  dig +short "$host" 2>/dev/null | head -1
done

# Email stack
dig +short noizy.ai MX
dig +short TXT noizy.ai | grep -i spf
dig +short TXT _dmarc.noizy.ai

# DNSSEC
dig +short DS noizy.ai @8.8.8.8
```

Every line must return a value. Empty = record didn't propagate or wasn't applied.

---

## Applier

Script: [`ops/apply-noizy-ai-dns.sh`](./apply-noizy-ai-dns.sh)

Reads this topology, diffs against live CF state, creates/updates missing records. Idempotent — re-runs are safe. Requires a CF fine-grained token with:

- `Zone:Read` (read zone metadata)
- `Zone.DNS:Edit` (create/update/delete records)
- `Zone.DNSSEC:Edit` (toggle DNSSEC post-flip — optional)

All scoped to zone `noizy.ai` only. Create once at <https://dash.cloudflare.com/profile/api-tokens> → Custom token → `Zone:DNS:Edit` + `Zone:Zone:Read` → zone resource `noizy.ai`.
