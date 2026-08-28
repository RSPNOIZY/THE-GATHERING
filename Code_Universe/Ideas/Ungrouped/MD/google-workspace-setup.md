> ⚠ **SUPERSEDED 2026-04-18** — The canonical source is `ops/DNS_CORRECTNESS_PLAN.md`. `noizyfish.ca`/`noizylab.ca`/`noizlab.ca` are NOT registered. The 5 canonical domains are noizy.ai, noizyfish.com, fishmusicinc.com, noizykidz.com, noizyvox.com.

---

# Google Workspace for NOIZY.AI · Setup Runbook

> Turning on the full Workspace tenancy for `noizy.ai` under `rsp@noizy.ai` SSO, with per-brand children mirroring Slack/Discord/Notion. Step-by-step. Most steps are one-time dashboard work; I've shipped **CF09** (`cf09-google-workspace.rsp-5f3.workers.dev`) + Apps Script templates so Workspace events fan out to the rest of the empire the moment auth is live.

**Canonical memory:** `memory/project_google_business_noizyai.md`
**Depends on:** `.ai` NS flip (to add the domain verification TXT record on the NOIZYFISH zone)

---

## Part 1 · Tenancy

### 1.1 Sign up for Workspace Business Plus (or migrate existing)

1. <https://workspace.google.com/signup> → Business Plus (recommended: 2TB per user, Vault included).
2. Primary admin email: `rsp@noizy.ai`.
3. Domain: `noizy.ai` (DON'T let Google auto-provision Gmail on `noizy.ai` before domain verification if you already have email on that zone).

### 1.2 Verify `noizy.ai` ownership

1. Google Admin Console → Account → Domains → Add domain.
2. Copy the TXT verification record.
3. Add to Cloudflare DNS on the NOIZYFISH zone (must be the marek/tara zone post-NS-flip). Type: TXT · Name: `@` · Content: `google-site-verification=...`.
4. Click Verify in Admin Console. Typically < 5 min.

### 1.3 MX records

1. Admin Console → Apps → Google Workspace → Gmail → Setup.
2. Add the 5 Google MX records to the NOIZYFISH zone (ASPMX.L.GOOGLE.COM, ALT1/2/3/4.ASPMX.L.GOOGLE.COM with priorities 1/5/5/10/10).
3. Wait for propagation (< 1h); Admin Console shows "Gmail is delivered to Google servers" when good.

### 1.4 SPF · DKIM · DMARC

1. SPF: add TXT at apex: `v=spf1 include:_spf.google.com ~all` (merge with any existing SPF — only one SPF per domain allowed).
2. DKIM: Admin Console → Apps → Gmail → Authenticate email → Generate new record → copy the TXT → add to Cloudflare DNS as `google._domainkey` → back in Admin click "Start authentication".
3. DMARC: add TXT at `_dmarc`: `v=DMARC1; p=quarantine; rua=mailto:dmarc@noizy.ai; fo=1`.

---

## Part 2 · Users, Groups, Aliases

### 2.1 One user · many faces (aliases-only strategy)

**Rule (ratified 2026-04-17 — see `memory/feedback_all_brands_are_aliases_of_rsp.md`):** every brand or role email is an **alias of `rsp@noizy.ai`** — not a separate user, not a separate mailbox. One identity, many faces. Solo-founder pattern.

Why:

- Rob is the actor for every brand today. One inbox to triage.
- One SSO identity across the whole empire.
- No Workspace seat sprawl.
- Replies send _as_ any alias via Gmail's "Send mail as" — outgoing mail still shows the right brand face.
- Agent mailboxes (GABRIEL, LUCY, DreamChamber) are routing aliases, not autonomous accounts.

The only user in Workspace to create:

| User  | Primary email  | Role                                              |
| ----- | -------------- | ------------------------------------------------- |
| `rsp` | `rsp@noizy.ai` | Founding actor · super-admin · every brand's face |

### 2.2 Aliases on `rsp@noizy.ai`

Admin → Directory → Users → rsp@noizy.ai → Account → Add alternate email. Add ALL of:

**On noizy.ai** (once the domain is verified):

- `contact@noizy.ai` · `info@noizy.ai` · `hello@noizy.ai` · `press@noizy.ai` · `dmca@noizy.ai` · `founder@noizy.ai`
- `gabriel@noizy.ai` · `lucy@noizy.ai` · `dreamchamber@noizy.ai` (agent routing)
- `noizyvox@noizy.ai` · `fishmusicinc@noizy.ai` · `noizykidz@noizy.ai` · `noizylab@noizy.ai` (brand routing)

**On alias domains** (each added as Alternate domain in Admin → Domains, MX + verification required):

| Brand domain                 | Aliases → rsp@noizy.ai                               |
| ---------------------------- | ---------------------------------------------------- |
| `noizyfish.com`              | `rsp@` · `contact@` · `rights@` · `sync@` · `hello@` |
| `noizyfish.ca`               | `rsp@` · `contact@` · `hello@`                       |
| `fishmusicinc.com`           | `rsp@` · `rights@` · `sync@` · `hello@` · `contact@` |
| `noizyvox.com` _(if owned)_  | `rsp@` · `hello@` · `artists@`                       |
| `noizykidz.com` _(if owned)_ | `rsp@` · `hello@` · `parents@` · `educators@`        |
| `noizylab.com` _(if owned)_  | `rsp@` · `hello@`                                    |

**Setup per alias domain:**

1. Admin → Domains → Add domain → Alternate / Secondary domain.
2. Verify ownership (TXT record on that zone in Cloudflare).
3. Add the 5 Google MX records.
4. On user `rsp@noizy.ai` → Account → add alternate email for each `*@<alias-domain>` address above.

Result: email sent to _any_ of these lands in Rob's single inbox. Filters + labels keep brands distinguishable. Outgoing mail selects the right brand face via Gmail "Send mail as."

### 2.3 Google Groups — for lists only, not inboxes

The alias rule handles almost all routing. Groups are reserved for _multi-human_ fan-out (Guild of Artists, audit board, future collaborators). Until collaborators exist, each group has one member (Rob) — future-proofing only:

| Group              | Members                                | Purpose               |
| ------------------ | -------------------------------------- | --------------------- |
| `family@noizy.ai`  | rsp (+ future agent-operator emails)   | Empire-internal list  |
| `artists@noizy.ai` | rsp (+ onboarded artists as they join) | Guild of Artists list |

---

## Part 3 · Shared Drives (mirror the brand hierarchy)

Admin → Apps → Drive → Shared drives → Create one per brand:

```
NOIZY.AI (parent; Rob owns, all agents members)
├── DREAMCHAMBER (creative sessions, audio, 396 Hz ref files)
├── NOIZYLAB (experiments, spike docs)
├── NOIZYVOX (voice DNA manifests, consent receipts, C2PA exports)
├── FISHMUSICINC (catalog masters, licensing docs, rate sheets)
├── NOIZYKIDZ (curriculum PDFs, lesson video originals)
├── NOIZYCLOUDS (fleet docs snapshots, audit reports)
└── FAMILY (per-agent memcells, cross-agent briefs)
```

**Rule:** each Shared Drive has `rsp@noizy.ai` as Manager; `family@noizy.ai` group has Content Manager. Single-user ownership is a landmine long-term — Shared Drives survive user deletion.

---

## Part 4 · Calendars

Admin → Apps → Calendar → Calendars:

| Calendar                       | Owner   | Visible to               |
| ------------------------------ | ------- | ------------------------ |
| `NOIZY.AI · Empire Status`     | rsp     | family group             |
| `DreamChamber · Sessions`      | rsp     | family + invited artists |
| `NOIZYVOX · Artist Onboarding` | lucy    | family                   |
| `FISHMUSICINC · Licensing`     | rsp     | rsp only (private)       |
| `Family · Standups`            | gabriel | family                   |
| `Launches + Ships`             | rsp     | family                   |

CF09 receives `calendar.event_start` 15 min before each event and pings CF04 into the matching channel (mapping in CF09 code).

---

## Part 5 · Google Chat spaces (mirror Slack/Discord channel hierarchy)

Admin → Apps → Google Chat → enabled. Then in Chat UI (chat.google.com):

Create Spaces named to match Slack/Discord:

- `# NOIZY.AI · empire-status`
- `# noizyai-dreamchamber`
- `# noizyai-noizylab`
- `# noizyai-noizyvox`
- `# noizyai-fishmusicinc`
- `# noizyai-noizykidz`
- `# noizyai-noizyclouds`
- `# noizyai-family-voice`
- `# noizyai-artists-stage`

Add CF09 as a Chat bot (Part 6) → Spaces can emit into the empire.

---

## Part 6 · Apps Script wiring (the empire's Workspace event source)

I've shipped three templates in `integrations/google-apps-script/`. Each is a 40-line `.gs` file you paste into Apps Script and deploy as a web app or Gmail add-on. They fire events to CF09 `/event`.

1. **`gmail-to-cf09.gs`** — Gmail time-based trigger (every 5 min): scans INBOX for unread labeled `empire` or sender matches empire patterns; fires `gmail.received` events.
2. **`drive-watcher-to-cf09.gs`** — Drive `onFileUpload` trigger on a Shared Drive; fires `drive.file_added`.
3. **`calendar-to-cf09.gs`** — Calendar 15-min-before-event trigger; fires `calendar.event_start` with `priority=critical` (so CF04 DM-escalates the on-call list).

**Setup each script:**

```
1. Visit script.google.com → New project.
2. Paste the .gs file contents.
3. Set Script Properties:
     CF09_URL        = https://cf09-google-workspace.rsp-5f3.workers.dev/event
     NOIZY_API_KEY   = (same as fleet)
     GWS_SECRET      = (generate a long random; also `wrangler secret put GOOGLE_APPS_SCRIPT_SECRET` on CF09)
     BRAND           = (per-script: noizyvox / fishmusicinc / noizykidz / etc.)
4. Deploy → Triggers → set recurrence / event type as documented in each file.
5. Authorize the script for the scopes it asks for.
```

---

## Part 7 · Vault (retention + legal hold)

Admin → Apps → Vault → set retention rules:

- Gmail: 7 years default (adjustable per user)
- Drive: indefinite for Shared Drives, 2 years for personal My Drives
- Chat: 90 days default, indefinite for `noizyai-heaven-ledger` space if used

Per doctrine (estate 100-year preservation): combine Vault long-term Drive retention with OAIS/PREMIS manifests in R2 for anything voice-related.

---

## Part 8 · Directory as SSO identity provider

Admin → Security → Authentication → SAML apps:

- Add apps: Cloudflare Zero Trust, GitHub (personal + org), Linear, Notion, Slack, Vercel, Stripe.
- Each gets `rsp@noizy.ai` (+ future agent accounts) as the SSO identity.
- Your 2FA lives here — Admin → Security → 2-step verification (enforce for super-admins).

This is how `rsp@noizy.ai` becomes the one identity for the whole empire. Google Workspace becomes the "source of people."

---

## Part 9 · Vertex AI + Gemini API for the empire

### 9.1 Personal Gemini API (already have this)

`GOOGLE_API_KEY` from `aistudio.google.com` — covers CF06 AI Gateway `google-ai-studio` provider. No Workspace dependency.

### 9.2 Workspace-scoped Vertex AI

Admin → Apps → Additional Google services → Vertex AI Studio → ON.
Gets you project-level quotas, VPC, production-grade Gemini. Route critical paths through Vertex rather than AI Studio when traffic grows.

### 9.3 NotebookLM

Admin → Apps → Additional services → NotebookLM → ON.
Ingest `MC96ECO_EMPIRE_MAP.md` + `STANDARDS.md` + `CONTROL_PLANE_INVENTORY.md` + `CLAUDE.md` into a notebook — turns the empire into a sourced Q&A corpus Rob + family can query by voice.

---

## Part 10 · Daily use, once live

- **Voice note from iPad** → CF01 Discord → if transcript starts with `/email`, CF01 forwards to CF09 which drafts Gmail via `gmail.compose` Apps Script; Rob approves in Gmail.
- **Calendar event created** → CF09 catches it → CF02 appends to Notion master → CF04 announces.
- **Artist files a licensing inquiry via `rights@fishmusicinc.com`** → Apps Script catches via Gmail label → CF09 → CF03 creates Linear issue `brand=fishmusicinc` → CF04 pings `#noizyai-fishmusicinc`.
- **Voice DNA enrollment** → captured in LUNA → C2PA manifest → uploaded to `NOIZYVOX` Shared Drive → Drive Apps Script fires `drive.file_added` → CF09 → CF02 logs to Notion → ledger event.

Every Workspace surface becomes a NOIZY event, every event lands in the ledger.

---

## Order of operations if you have 1 hour

1. Sign up for Workspace Business Plus, start domain verification (5 min)
2. Add TXT verification record to Cloudflare (5 min — needs NS flip done first)
3. Wait for verify (0-30 min)
4. Add MX + SPF + DKIM (15 min)
5. Create the 6 core users, 4 groups, 5 Shared Drives (20 min)
6. Paste the 3 Apps Script templates, set properties, set triggers (15 min)
7. `wrangler secret put GOOGLE_APPS_SCRIPT_SECRET` on CF09 (30 sec)
8. Fire a test event from Apps Script → verify it lands in Slack + Notion via CF09 (5 min)

By hour 2: empire events flow from Gmail/Drive/Calendar through the NOIZYCLOUDS fleet into Slack, Discord, Notion, Linear — the full fabric lit up.

---

_One identity. One tenancy. Seven Shared Drives per brand. Every event a ledger line. 396 Hz carried into the productivity layer._
