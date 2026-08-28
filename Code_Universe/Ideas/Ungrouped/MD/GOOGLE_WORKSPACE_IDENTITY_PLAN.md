# Google Workspace Business Standard — NOIZY Identity Plan

> **Author:** Gabriel (orchestrated by RSP_001)
> **Date:** 2026-04-09 · T-8 to April 17
> **Status:** Draft — awaiting RSP_001 decision block (§7)
> **Companion specs:** `CLOUDFLARE_ZERO_TRUST_ARCHITECTURE.md` · `MICKY_P_MISSION_PROFILE.md`
> **Canonical identity (locked 2026-03-25 per `~/.claude/rules/contact.md`):** `rsp@noizy.ai`

## 1. The one-line goal

Make **every Google surface** — Gmail, Drive, Calendar, Meet, Gemini, Cloud, Vault, Groups, Admin, iOS/macOS Google apps, VS Code Gemini Code Assist, `gcloud`, Firebase, Analytics — roll up to **one canonical identity (`rsp@noizy.ai`)** under **one organization (`noizy.ai`)** with **one admin console**, so that future audit, billing, IAM, and AI-policy decisions have exactly one place to happen.

Today there's drift. The URL you sent (`gen-lang-client-0956858309` under "Not current: rspnoizy-org") is *the* symptom. Free-tier Gemini projects spin up auto-named, orphaned from any org, signed into whichever Google account was active in the browser when AI Studio was opened. Every one of those is a future audit gap.

## 2. The three Google identity tiers — pick the right one per use case

| Tier | Cost | What it gives | Use for |
|---|---|---|---|
| **Workspace Business Standard** | ~$14 CAD / user / month | Gmail @noizy.ai · 2 TB pooled storage · Meet w/ recording · shared drives · Admin console · Gemini for Workspace (separate $20 SKU) | **RSP_001 only** — 1 seat |
| **Cloud Identity Free** | $0 | Managed non-Workspace identities under the same org · IAM · 2SV · SSO · **up to 50 free users** | Break-glass admin · service-style mailboxes · anyone who needs auth but not Gmail storage |
| **Google Groups (role aliases)** | $0 | Distribution aliases that receive mail and can act as IAM subjects | `legal@noizy.ai`, `press@noizy.ai`, `support@noizy.ai`, `gabriel@noizy.ai` |

**Design rule:** A Workspace seat is *only* justified when the human or role needs **storage + Gmail inbox + Meet host**. Everything else is Cloud Identity or a Group. This keeps the monthly bill minimal ($14) and prevents identity sprawl.

## 3. The canonical identity map

### Humans (Workspace-backed)

| Identity | Role | Tier | MFA |
|---|---|---|---|
| `rsp@noizy.ai` | **Founding Actor** — primary working inbox, owns everything | Workspace Business Standard | Hardware key + TOTP fallback |

### Admin (break-glass — Cloud Identity Free)

| Identity | Role | Tier | MFA |
|---|---|---|---|
| `admin@noizy.ai` | Super-admin account. **Never used for day-to-day.** Break-glass only. | Cloud Identity Free | Hardware key only — no fallback |

**Why separate admin:** If `rsp@noizy.ai` gets phished/locked, `admin@noizy.ai` is the only way back in. Never sign into Chrome/Safari with admin. Never use admin for any API key, any Gemini Code Assist auth, any mobile app. Admin credentials live in 1Password only.

### Role aliases (Google Groups, $0)

| Group alias | Purpose | Members |
|---|---|---|
| `legal@noizy.ai` | Legal notices (DMCA, Cassels Brock correspondence, IP filings) | `rsp@noizy.ai` |
| `press@noizy.ai` | Media inquiries | `rsp@noizy.ai` |
| `support@noizy.ai` | Artist / licensee support | `rsp@noizy.ai` |
| `finance@noizy.ai` | Stripe / invoicing / tax / royalty audits | `rsp@noizy.ai` |
| `security@noizy.ai` | Vuln reports, token-leak reports, the leaked-OAuth-token kind of thing | `rsp@noizy.ai` + `admin@noizy.ai` |
| `gabriel@noizy.ai` | **Automated agent correspondence** — receipt notifications, Kill Switch webhooks, Heaven alerts. Gabriel's "from" address. | `rsp@noizy.ai` (for now — routes everything to you) |
| `founders@noizy.ai` | Internal founder-level (currently = you, but can grow) | `rsp@noizy.ai` |

All groups are **receive-only** at Day 1 (members get the mail, nobody else can send-as). Sending-as from groups requires explicit setup per alias — defer until needed.

### Domain aliases (email routing, not separate identities)

| Alias | Routes to | Why |
|---|---|---|
| `rsp@noizyfish.com` | `rsp@noizy.ai` | Historical public-facing address (on business cards, older legal docs). Keep forever, forward everything. |
| `rsplowman@icloud.com` | — | **Personal.** Do NOT forward into Workspace. Stays separate for boundary reasons. |
| `robert@noizy.ai` | `rsp@noizy.ai` | Anyone who types "Robert" at a domain — gets you. |

### Cloud / service identities (machine-facing, not human)

| Identity | Purpose | Tier |
|---|---|---|
| GCP service accounts under `noizy.ai` org | Gemini API, Firebase, Cloud Run, Vertex AI — anything a worker or script needs | GCP (billed to the org's billing account) |
| `gabriel-serve@noizy-ai.iam.gserviceaccount.com` | Gabriel backend → Google APIs (when/if we wire one) | Service account under `noizy-ai` project |

**Design rule:** Human identities never carry API keys. Service accounts do. Rotate service account keys quarterly. All keys live in `1Password` or `wrangler secret`, never in `.env` files committed to git.

## 4. Shared drive structure (one per brand — 2 TB pooled across all)

Workspace Business Standard gives you 2 TB pooled across the org. Shared drives are the only place team/brand content should live — personal My Drives are for scratch only.

| Shared drive | Content | Who can view | Who can edit |
|---|---|---|---|
| `NOIZY — FOUNDER` | Personal founder work, private notes, in-progress drafts | RSP_001 only | RSP_001 only |
| `NOIZY.AI — CANONICAL` | Specs, charters, manifestos, INCLUSION_BLUEPRINT, MICKY_P docs, RECEIPT_SPINE | RSP_001 | RSP_001 |
| `NOIZYVOX — VOICE` | AVA enrollment audio, voice DNA references, NOIZYVOX product assets | RSP_001 | RSP_001 |
| `NOIZYFISH — CATALOG` | Fish Music Inc archive, 888 titles, royalty ledgers, scoring legacy | RSP_001 | RSP_001 |
| `NOIZYKIDZ — LEARNING` | Kids content, SHIRL/POPS materials, curriculum | RSP_001 | RSP_001 |
| `NOIZYLAB — OPS` | Operator runbooks, daily briefings, Gabriel logs | RSP_001 | RSP_001 |
| `NOIZY — LEGAL` | Cassels Brock correspondence, Casey Chisick holds, contracts, C2PA attestations | RSP_001 only | RSP_001 only |
| `NOIZY — FINANCE` | Invoices, Stripe exports, tax, bookkeeping | RSP_001 only | RSP_001 only |

**Design rule:** `A/V content never lives on the system drive.` Large audio/video goes to **THE AQUARIUM on external storage** per `02_MACHINE_ROLES.md` — but the **metadata, the lineage, and the receipts** go into shared drives for searchability.

## 5. GCP org structure (resolves the "Not current: rspnoizy-org" URL)

```
Organization:   noizy.ai                             (canonical)
├── Folder:     production
│   └── Project: noizy-ai-prod                      (Heaven, Cloudflare mirror, Receipt Spine)
├── Folder:     staging
│   └── Project: noizy-ai-stage                     (dev/test workloads)
├── Folder:     ai-experiments
│   ├── Project: gen-lang-client-0956858309         ← MIGRATE INTO HERE
│   └── Project: noizy-gemini-playground
└── Folder:     archive
    └── Project: rspnoizy-org-legacy                (wherever the old stuff lives)
```

**Migration target:** Move `gen-lang-client-0956858309` from unattached → `noizy.ai` org → `ai-experiments` folder. Requires org-admin + folder-viewer on both sides. Cost: $0. Downtime: minutes. Done once, never repeated.

## 6. DNS records you'll paste into Cloudflare

Workspace setup produces these records. They go into the `noizy.ai` zone on Cloudflare. **Proxying must be OFF (grey cloud)** for MX, SPF, DKIM, DMARC — Cloudflare cannot proxy these.

```dns
; Mail routing (Google MX)
@     MX  1   ASPMX.L.GOOGLE.COM.
@     MX  5   ALT1.ASPMX.L.GOOGLE.COM.
@     MX  5   ALT2.ASPMX.L.GOOGLE.COM.
@     MX  10  ALT3.ASPMX.L.GOOGLE.COM.
@     MX  10  ALT4.ASPMX.L.GOOGLE.COM.

; SPF (authorize Google senders, existing CF Email Routing senders if kept)
@     TXT "v=spf1 include:_spf.google.com ~all"

; DKIM (Google gives you the exact key in Admin → Gmail → Authenticate email)
google._domainkey   TXT  "v=DKIM1; k=rsa; p=<KEY_FROM_GOOGLE_ADMIN>"

; DMARC (start monitoring, tighten after 2 weeks)
_dmarc  TXT  "v=DMARC1; p=quarantine; rua=mailto:dmarc@noizy.ai; fo=1"

; Google verification (temporary — remove after ownership proven)
@     TXT  "google-site-verification=<TOKEN_FROM_ADMIN>"
```

**Current CF Email Routing → `rsplowman@icloud.com` must be removed** before Google MX takes over — otherwise mail double-delivers and DMARC breaks. One-way cutover, ~10 minute window where new mail might bounce.

## 7. DECISIONS — your 5-10 line contribution

Open this file in your editor. Fill in the values marked `<CHOOSE>`. Save. That becomes the canonical answer and the audit script below reads it.

```yaml
# ~/NOIZYANTHROPIC/NOIZYLAB/spec/google_identity_choices.yml
# RSP_001 decides:

primary_identity: rsp@noizy.ai          # locked — already canonical

admin_break_glass:
  enable: <CHOOSE: true | false>        # recommended: true
  address: admin@noizy.ai                # default — override if you want

# Which group aliases do you want provisioned DAY ONE?
# (legal + security are non-negotiable; the rest can wait)
day_one_groups:
  legal:    <CHOOSE: true | false>      # recommended: true
  security: <CHOOSE: true | false>      # recommended: true
  press:    <CHOOSE: true | false>
  support:  <CHOOSE: true | false>
  finance:  <CHOOSE: true | false>
  gabriel:  <CHOOSE: true | false>      # only if we wire Gabriel to send email

# Personal inbox boundary
keep_icloud_separate: <CHOOSE: true | false>   # recommended: true (personal/business boundary)

# Gemini for Workspace — $20/user/month ADD-ON
gemini_for_workspace: <CHOOSE: true | false>   # gives Gemini in Gmail/Docs/Meet.
                                                # Defer unless you'll use it daily.

# Which shared drives do you want at Day 1?
day_one_shared_drives: <CHOOSE from: FOUNDER, CANONICAL, VOICE, CATALOG, LEARNING, OPS, LEGAL, FINANCE>
  # example: [FOUNDER, CANONICAL, LEGAL, OPS]
```

Six decisions. Maybe seven if you count the optional Gemini add-on. Once you fill those in, the audit + migration scripts below will pull from this file as the source of truth.

`★ Insight ─────────────────────────────────────`
These seven decisions compound. Saying yes to `gemini_for_workspace` right now means $20 CAD/mo from day one — but it also means every Gmail, Doc, Sheet, and Meet you touch can use Gemini with *grounding on your shared-drive content*. Free Gemini has no grounding. Enterprise Gemini does. This is the same "pay for provenance" trade-off as every other layer of the stack — the free tier has no audit trail, the paid tier does. Worth thinking about in the same frame as consent-as-code: Gemini-for-Workspace grounding is the "provenance as default" choice for your own writing.
`─────────────────────────────────────────────────`

## 8. Cost snapshot (Canadian — confirm with Google pricing at checkout)

| Item | Monthly | Annual |
|---|---|---|
| Workspace Business Standard × 1 seat | ~$17 CAD | ~$200 CAD |
| Cloud Identity Free × 1 break-glass | $0 | $0 |
| Google Groups × 7 aliases | $0 | $0 |
| Optional: Gemini for Workspace × 1 seat | +$28 CAD | +$336 CAD |
| Optional: GCP usage (Gemini API, Cloud Run, Vertex) | variable | variable |
| **Minimum baseline (no Gemini)** | **~$17 CAD** | **~$200 CAD** |
| **Full baseline (with Gemini)** | **~$45 CAD** | **~$540 CAD** |

Compare against what's likely already leaking today: duplicate OpenAI / Claude / Anthropic / Gemini free-tier accounts, scattered Google One personal subscriptions, iCloud+ you might no longer need once Drive takes over. Net might be neutral or negative.

## 9. Execution order (once §7 decisions are locked)

1. **Buy Workspace Business Standard** × 1 seat at `workspace.google.com/business`, verify domain ownership of `noizy.ai`.
2. **Create admin break-glass account** `admin@noizy.ai` in Admin console (if you chose yes).
3. **Delete Cloudflare Email Routing rule** for `rsp@noizy.ai` → iCloud (else mail double-delivers).
4. **Paste DNS records** from §6 into Cloudflare `noizy.ai` zone (MX, SPF, DKIM, DMARC).
5. **Wait for DKIM propagation** (~15 min), send a test from Gmail → external address, verify it lands with `dkim=pass`.
6. **Create groups** per §7 decisions.
7. **Create shared drives** per §7 decisions, seed each with a README.md.
8. **Add hardware key + TOTP fallback** to both `rsp@noizy.ai` and `admin@noizy.ai`. Enroll 2SV.
9. **Migrate** `gen-lang-client-0956858309` into `noizy.ai` org → `ai-experiments` folder (§5).
10. **Re-auth Gemini Code Assist in VS Code** with `rsp@noizy.ai` (the extension is already installed — per audit §2 earlier this session — it just needs to re-sign in under the right identity).
11. **Run `gcloud auth login rsp@noizy.ai`** on GOD, verify `gcloud config list` shows the right account.
12. **Update Linear NOI-47 / NOI-51** with new identity, update CLAUDE.md if anything drifts.

Step 3 is the only irreversible-feeling one — so I'll ship a one-command audit tool (next file) that verifies the pre-state before you pull the trigger.

## 10. What this doesn't solve (be honest)

- **It doesn't consolidate Fish Music Inc Google footprint** — that's a separate Workspace (or a separate domain you'd add as a secondary to the `noizy.ai` org). Decide later.
- **It doesn't fix `rspnoizy-org`** — that appears to be a separate GCP org under a different Google account. You'll need to know which account owns it before merging.
- **It doesn't touch Anthropic/Claude identity** — Claude Max is Rob's personal account; that stays separate unless you explicitly want to move it to a Workspace-tied Claude Team seat.
- **It doesn't buy you instant iOS / Shortcuts integration** — those will still ask you which Google account to use. You'll pick `rsp@noizy.ai` each time until you sign out of the old ones.
