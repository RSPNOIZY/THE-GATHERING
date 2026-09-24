# noizyfish.com — Full Mail + Anti-Spoof Hardening

**Goal:** send **and** receive email on noizyfish.com, fully protected (SPF + DKIM + DMARC).
**Primary mailbox:** `rsp@noizyfish.com`
**Provider:** Microsoft 365 (per your empire `system.json`, which expects MX = Microsoft).
**Current state:** NS on NS1 (`dns*.p07.nsone.net`), **no MX, no DMARC** — mail is broken and the domain is spoofable today.

> ⚠️ Two values below are **tenant-specific** and MUST be copied from your own
> Microsoft 365 admin center, not guessed. They're marked `‹FROM M365›`.
> Path: **M365 Admin → Settings → Domains → noizyfish.com → DNS records.**
> The patterns shown are the standard M365 shapes so you can recognize them.

---

## STEP 0 — Decide where the records live (NS drift)

Your config expects noizyfish on **Cloudflare**, but it's on **NS1**. Two paths:

- **Path A — Harden now (recommended):** add every record below **at NS1** (your
  current DNS host). Fastest route to working, protected mail. No migration risk.
- **Path B — Canonical (later):** migrate nameservers NS1 → Cloudflare to match the
  empire standard, then re-create these records there. Do this as a planned follow-up,
  not in the same sitting as turning on mail.

Do **Path A** today. Schedule Path B separately.

---

## STEP 1 — Add the records (at your current DNS host)

### MX — inbound mail
```
Type  Host/Name           Value                                   Priority  TTL
MX    @  (noizyfish.com)   noizyfish-com.mail.protection.outlook.com   0     3600
```
> Confirm the exact host `noizyfish-com.mail.protection.outlook.com` in the admin
> center — it's derived from your tenant but usually follows `domain-com.mail.protection.outlook.com`.

### SPF — authorize senders (one TXT only; never two SPF records)
```
Type  Host/Name           Value                                          TTL
TXT   @  (noizyfish.com)   v=spf1 include:spf.protection.outlook.com -all  3600
```
> If noizyfish ALSO sends through other services (newsletter, app, etc.), add their
> includes **before** `-all`, e.g.
> `v=spf1 include:spf.protection.outlook.com include:_spf.google.com -all`.

### DKIM — sign outbound (two CNAMEs, tenant-specific)
```
Type   Host/Name                         Value
CNAME  selector1._domainkey              ‹FROM M365›  (selector1-…_domainkey.‹tenant›.onmicrosoft.com)
CNAME  selector2._domainkey              ‹FROM M365›  (selector2-…_domainkey.‹tenant›.onmicrosoft.com)
```
> After these resolve, go to **M365 → Security/Defender → Email & collaboration →
> Policies → DKIM → noizyfish.com → Enable.**

### Autodiscover — client setup
```
Type   Host/Name        Value
CNAME  autodiscover     autodiscover.outlook.com
```

### DMARC — start in MONITOR, then tighten
```
Type  Host/Name   Value                                                                          TTL
TXT   _dmarc      v=DMARC1; p=none; rua=mailto:rsp@noizyfish.com; ruf=mailto:rsp@noizyfish.com; fo=1   3600
```

---

## STEP 2 — Verify (after ~15–60 min propagation)
```bash
dig +short MX    noizyfish.com
dig +short TXT   noizyfish.com            # expect the v=spf1 … -all line
dig +short TXT   _dmarc.noizyfish.com     # expect v=DMARC1 …
dig +short CNAME selector1._domainkey.noizyfish.com
```
Send a test message to a Gmail account, open **Show original**, and confirm
**SPF=pass, DKIM=pass, DMARC=pass**.

---

## STEP 3 — Ramp DMARC enforcement (over ~2–4 weeks)
Watch the `rua` aggregate reports arriving at dmarc@noizy.ai, confirm all legitimate
senders pass, then tighten in stages — never jump straight to reject:
```
p=none        →   p=quarantine; pct=25   →   p=quarantine   →   p=reject
```
Each step, wait a week and watch reports. `p=reject` is the goal: spoofed mail
claiming to be noizyfish.com gets dropped at the recipient.

---

## Why this matters (not hygiene — identity defense)
noizyfish.com is your music-catalog brand. An open domain lets anyone send mail
*as you* — phishing partners, fans, collaborators under your name. SPF says who may
send, DKIM cryptographically signs it, DMARC tells the world to reject forgeries.
This is consent and identity enforced at the protocol layer — a design goal, not a chore.

## Second-order effects / cautions
- **Don't enable `-all` SPF until every real sender is included**, or you'll bounce
  your own legitimate mail. List all senders first.
- **One SPF record max.** Multiple `v=spf1` TXT records = SPF fails entirely.
- **DKIM enable comes AFTER the CNAMEs resolve**, or M365 throws an error.
- **MX cutover is the moment mail starts flowing** — make sure the mailbox
  **`rsp@noizyfish.com`** actually exists in the M365 tenant (domain verified, user
  licensed) **before** pointing MX at it, or inbound mail bounces.
- These go in at **NS1 today** (Path A). If you later migrate to Cloudflare (Path B),
  re-create all of them there before flipping nameservers.
