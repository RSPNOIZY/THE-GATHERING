# NOIZY MAIL DOCTRINE (Pinned)

> **Google Workspace is the single mail authority for all NOIZY domains.**

## Provider: Google Workspace

| Domain | Role | MX Authority |
|--------|------|-------------|
| `noizy.ai` | Canonical identity + login | Google |
| `noizyfish.com` | Brand alias (same mailboxes) | Google |
| `noizylab.ca` | Operations / lab alias | Google |

**Canonical mailbox:** `rsp@noizy.ai`

## Hard Rules

- **Single MX authority** — Google only, no split delivery
- **No forwarding chains** — no ImprovMX, no iCloud relay, no CF Email Routing
- **SPF hard fail** — `-all`, not `~all`
- **DKIM 2048-bit** — generated per domain from Google Admin
- **DMARC enforced** — start at `quarantine`, move to `reject` after 14 days
- **MFA everywhere** — no exceptions

## Why Google (not Microsoft)

- Lowest friction startup plan
- Best SPF/DKIM/DMARC ergonomics
- Gmail mobile UX (native iPhone/iPad)
- Seamless Drive/Docs for Aquarium ops
- No early commitment complexity
- Microsoft becomes relevant when enterprise SharePoint/Teams is needed

## Execution Order (before any data moves)

```
1. Add all 3 domains to Google Workspace
2. Set MX → Google only (delete all others)
3. Publish SPF per domain
4. Generate + publish DKIM per domain
5. Publish DMARC per domain
6. Verify mail flow + spoof blocking
7. Lock MFA on all services
8. THEN run noizy_safe_recovery_v3.sh audit
```

## Auth Hardening

### Google Workspace
- 2-step verification enforced for all users
- Security key or authenticator required
- Legacy IMAP/POP disabled
- Admin roles minimal (1-2 super admins)

### Cloudflare
- Login email: `rsp@noizy.ai`
- MFA mandatory
- API tokens scoped (not global)
- Zone delegation reviewed per domain

### GitHub / Stripe / Linear / Notion
- Login email: `rsp@noizy.ai`
- MFA enforced
- Recovery codes stored offline

---

*Mail identity must be correct before data moves.*
*Single authority. No hybridity. No forwarding.*
