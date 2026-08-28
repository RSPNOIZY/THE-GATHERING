# DNS Hardening — `noizy.ai` v1.0

**Status:** DRAFT — ready for operator to paste into Cloudflare dashboard
**Date:** 2026-04-13
**Scope:** Identity-layer protections for the founder-admin domain

---

## Context

The `noizy.ai` zone today carries (a) a landing page on `www`, (b) Cloudflare Email Routing for inbound mail to `rsp@noizy.ai`, (c) upcoming Phase 7 subdomains `voice-mcp`, `voice`, `gabriel` (auto-created by deploy commands). Three identity-layer gaps remain. This document provides ready-to-paste records to close them.

These records are **additive** and **non-breaking** — they do not affect existing traffic. Safe to enter at any time.

---

## 1. DMARC policy (D-16)

**Record type:** `TXT`
**Name:** `_dmarc`
**Content (phase 1 — observation, 30 days):**

```
v=DMARC1; p=none; rua=mailto:rsp@noizy.ai; ruf=mailto:rsp@noizy.ai; fo=1; adkim=r; aspf=r; pct=100
```

**Content (phase 2 — quarantine, after 30 days of clean reports):**

```
v=DMARC1; p=quarantine; rua=mailto:rsp@noizy.ai; ruf=mailto:rsp@noizy.ai; fo=1; adkim=s; aspf=s; pct=100
```

**Content (phase 3 — reject, after confidence is established):**

```
v=DMARC1; p=reject; rua=mailto:rsp@noizy.ai; ruf=mailto:rsp@noizy.ai; fo=1; adkim=s; aspf=s; pct=100
```

**Proxy:** DNS only
**TTL:** Auto

**What this does:** Instructs receiving mail servers what to do with mail that fails SPF *and* DKIM checks. Start at `p=none` so you can observe whether any legitimate mail is failing alignment before you start blocking. Escalate to `quarantine`, then `reject`, as reports come in clean.

**Reports land in:** `rsp@noizy.ai` (via Cloudflare Email Routing → wherever that forwards). Reports are XML and are typically parsed by a DMARC analyzer — for v1.0, just keep an eye on the inbox for reports from Google, Microsoft, Yahoo.

---

## 2. CAA lock (D-17)

**Record type:** `CAA`
**Name:** `noizy.ai` (apex)
**Records (enter all four):**

| Flags | Tag | Value |
|---|---|---|
| 0 | `issue` | `letsencrypt.org` |
| 0 | `issue` | `pki.goog` |
| 0 | `issue` | `digicert.com` |
| 0 | `iodef` | `mailto:rsp@noizy.ai` |

**Proxy:** DNS only (CAA records are never proxied)
**TTL:** Auto

**What this does:** Binds certificate issuance for `noizy.ai` and all subdomains to the three CAs that Cloudflare actually uses for Universal SSL and advanced certs. Any other CA asked to issue a cert for your domain must refuse. The `iodef` record tells violating CAs where to report attempted rogue issuance.

**Note on Cloudflare:** Cloudflare uses Let's Encrypt, Google Trust Services, and DigiCert depending on tier/feature. These three cover all current Cloudflare SSL paths. If you later add a cert from Sectigo, Comodo, or another CA, add a line for it here *first* or the issuance will fail.

---

## 3. Apex redirect (D-18)

**Goal:** `noizy.ai` → 301 redirect to `https://www.noizy.ai`

**Implementation option A — Cloudflare Bulk Redirect (recommended):**

1. Cloudflare dashboard → Bulk Redirects → create list `noizy-apex-to-www`
2. Source URL: `https://noizy.ai/*`
3. Target URL: `https://www.noizy.ai/$1`
4. Status: `301`
5. Parameters: `preserve_query_string=true`, `preserve_path_suffix=true`, `include_subdomains=false`

**Implementation option B — Page Rule (legacy, being deprecated):**

- URL pattern: `noizy.ai/*`
- Setting: Forwarding URL → 301 → `https://www.noizy.ai/$1`

**Do not use both.** Bulk Redirects supersedes Page Rules for this use case.

**What this does:** Ensures the front door behaves predictably. A user typing `noizy.ai` in the address bar gets redirected to the canonical `www` host where the landing Worker serves. Otherwise, apex requests hit Cloudflare's default and may display the wrong content or an error depending on tier settings.

---

## 4. DKIM selector confirmation (D-19)

**Not a record to add — a question to answer.**

The current DKIM record at `cf2024-1._domainkey.noizy.ai` is Cloudflare's outbound DKIM key. This is only functional if you're sending mail *through* Cloudflare Email Routing (currently beta; most accounts are receive-only).

**Operator to confirm:**

- Is `rsp@noizy.ai` **receive-only** (Cloudflare forwards inbound to `rsplowman@icloud.com` or similar)? → Then the current DKIM is signing zero outbound mail. That's fine; leave it.
- Or does `rsp@noizy.ai` **send mail** from some other provider (Gmail via "Send As," iCloud custom domain, Fastmail, etc.)? → Then that provider's DKIM selector needs adding here, and SPF needs updating to include that provider's sending infrastructure.

**If sending from iCloud custom domain:**

- Update SPF to: `v=spf1 include:_spf.mx.cloudflare.net include:icloud.com ~all`
- Add iCloud's DKIM selector (they provide it during domain verification).

**If sending from Gmail via "Send As":**

- Update SPF to: `v=spf1 include:_spf.mx.cloudflare.net include:_spf.google.com ~all`
- Add Google's DKIM selector `google._domainkey` (Google provides the key during Workspace setup).

**Answer before DMARC moves from `p=none` to `p=quarantine`**, or legitimate outbound mail will be silently quarantined by receivers.

---

## Verification steps (post-paste)

```bash
# DMARC
dig +short TXT _dmarc.noizy.ai

# CAA
dig +short CAA noizy.ai

# Apex redirect
curl -I https://noizy.ai       # expect 301 → https://www.noizy.ai/

# Existing SPF + DKIM (sanity check unchanged)
dig +short TXT noizy.ai
dig +short TXT cf2024-1._domainkey.noizy.ai
```

## Rollback

All four changes are independent and reversible:

- **DMARC:** delete the `_dmarc` TXT record → DMARC checks disabled.
- **CAA:** delete the four CAA records → any CA may issue.
- **Apex redirect:** delete the Bulk Redirect list → apex returns to default Cloudflare behavior.
- **DKIM changes:** revert SPF and remove added DKIM selector.

No change is destructive.

---

## Cross-references

- `P-01_Foundation_Buildout.md` — these records are hardening debt, not a P-01 close blocker, but should be closed before P-02.
- `NOIZY-AI-GLOBAL-AUDIT-2026-04-13.docx` — Section on identity layer.
- Decision Register D-16 through D-19 (pending instantiation in xlsx).
