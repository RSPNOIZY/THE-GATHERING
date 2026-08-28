# Google Workspace Business Standard — Execution Runbook for noizy.ai

> **Author:** RSP_001 (ordered) · Gabriel (consolidated)
> **Date:** 2026-04-09 · T-8 to April 17
> **Supersedes:** `Desktop/CLAUDE TODAY/integration-plane/GOOGLE-WORKSPACE-CLOUDFLARE-SETUP.md` (2026-04-13 draft — its DNS tables are incorporated below)
> **Companion:** `GOOGLE_WORKSPACE_IDENTITY_PLAN.md` (why) · this doc = how
> **Status:** Ready to execute. **Read the entire doc before step 1.**

## Pre-flight state (verified 2026-04-09)

| Check | Current |
|---|---|
| `noizy.ai` on Cloudflare, nameservers active | ✅ yes |
| `noizy.ai` MX | Cloudflare Email Routing (routes to `rsplowman@icloud.com`) |
| `noizy.ai` DKIM / DMARC / google-site-verification | ❌ none |
| Workspace subscription | ❌ none |
| Cloudflare Email Routing for `rsp@noizy.ai` | ✅ active — **must be disabled in step 5** |
| Other Google accounts signed in on GOD | `rp@fishmusicinc.com`, `rsplowman@icloud.com` |
| `rsp@noizy.ai` as a Google identity | ❌ does not exist yet |

## The 7 steps — in order, atomically

### STEP 1 — Cloudflare login still routes to iCloud

**What:** Make sure your Cloudflare account recovery email is `rsplowman@icloud.com` and that iCloud mail is working.

**Why:** If anything goes wrong during the email cutover in step 5, you need a recovery path that is NOT dependent on the domain you're about to reconfigure. iCloud is that path.

**Do:**
1. Open `https://dash.cloudflare.com/profile`
2. Confirm the account email is `rsplowman@icloud.com`
3. Send yourself a test email at `rsplowman@icloud.com` from another account — confirm it arrives

**Time:** 2 min · **Risk:** none · **Rollback:** n/a (read-only check)

---

### STEP 2 — Sign up for Google Workspace Business Standard

**What:** Buy 1 seat of Workspace Business Standard at `workspace.google.com/business`.

**Why:** This provisions the actual Gmail inbox for `rsp@noizy.ai`, the Admin console, 2 TB pooled storage, and the ability to set up DKIM + DMARC authoritatively.

**Do:**
1. Open `https://workspace.google.com/business/`
2. Choose **Business Standard** (~$17 CAD / user / month)
3. When asked for domain: enter `noizy.ai`
4. When asked for admin email to create:
   - **Primary admin username:** `rsp` → gives you `rsp@noizy.ai`
   - **OR** create `admin@noizy.ai` as the super-admin and `rsp@noizy.ai` as a regular user
5. Complete payment (credit card on file, 14-day trial begins)
6. Accept terms

**Decision point:** Single-user vs split admin.
- **Single user (`rsp@noizy.ai` = super admin):** Simplest, one login, but if you get phished or locked out, no break-glass account.
- **Split (`admin@noizy.ai` = super admin + `rsp@noizy.ai` = regular user):** 2× hardware keys, 2× logins, but one account getting compromised doesn't lose you the empire. Recommended.

I can't make this decision for you — pick now.

**Time:** 10–15 min · **Risk:** subscription begins billing after trial (cancel in 14 days if anything is wrong) · **Rollback:** cancel subscription within trial window

---

### STEP 3 — Verify noizy.ai domain ownership (one TXT record)

**What:** Google gives you a TXT record that proves you control `noizy.ai`. You paste it into Cloudflare.

**Do:**
1. In Google Admin Console, you'll be prompted to verify. Google shows a record like:
   ```
   Type: TXT
   Host: @ (or noizy.ai)
   Value: google-site-verification=<YOUR_UNIQUE_CODE>
   ```
2. Open Cloudflare → `noizy.ai` zone → DNS → Records → Add record
3. Type: TXT · Name: `@` · Content: `google-site-verification=<code from Google>` · TTL: Auto · **Proxy status: DNS only (grey cloud)**
4. Back in Google Admin, click **Verify**. Should succeed within 1–2 minutes.

**Time:** 5 min · **Risk:** none · **Rollback:** delete the TXT record

---

### STEP 4 — Generate DKIM in Admin Console, paste the TXT

**What:** DKIM proves outgoing mail is really from you. Required for Gmail deliverability + spoof protection.

**Do:**
1. Google Admin Console → **Apps** → **Google Workspace** → **Gmail** → **Authenticate email**
2. Select domain: `noizy.ai`
3. Click **Generate new record** (2048-bit — default — is fine)
4. Google shows:
   ```
   DNS Host name (TXT record name): google._domainkey
   TXT record value: v=DKIM1; k=rsa; p=<LONG_PUBLIC_KEY>
   ```
5. Cloudflare → `noizy.ai` → DNS → Add record
   - Type: TXT · Name: `google._domainkey` · Content: the entire `v=DKIM1; k=rsa; p=...` string · **DNS only (grey cloud)**
6. Back in Google Admin → click **Start authentication** (button appears after you save the TXT in CF)
7. Wait up to 48 hours for propagation (usually < 1 hour in practice)

**Note on the April 13 doc's CNAME approach:** That doc uses a CNAME form (`google._domainkey → google.c.noizy.ai._domainkey.goog.`). Google now generates the **TXT form by default** in new Workspace setups. Either works — follow what the console actually shows you.

**Time:** 10 min active + 1 hour wait · **Risk:** low · **Rollback:** delete TXT record

---

### STEP 5 — ⚠ DISABLE Cloudflare Email Routing for noizy.ai (THE HINGE)

**This is the step the April 13 doc misses.** If you skip it and go straight to step 6, you'll have **two MX record sets active at the same time** — CF Email Routing's `route1/2/3.mx.cloudflare.net` plus Google's — and mail will unpredictably hit either. DMARC alignment will fail because the `Return-Path` will sometimes be Cloudflare's forwarding envelope, not Google's.

**Do:**
1. Cloudflare Dashboard → `noizy.ai` zone → **Email** → **Email Routing**
2. Click **Disable email routing** at the top. Confirm.
3. This removes the CF Email Routing MX records (`route1/2/3.mx.cloudflare.net`) and its SPF `include:_spf.mx.cloudflare.net`.
4. Verify removal:
   ```bash
   dig +short noizy.ai MX
   # Should return EMPTY or only stale cached values that will clear shortly
   ```
5. **Important:** Any existing forwarding rule sending `rsp@noizy.ai` → `rsplowman@icloud.com` ceases to work. New mail to `rsp@noizy.ai` will hit the new Google MX in step 6.

**Time:** 3 min · **Risk:** 5–15 minute window where `rsp@noizy.ai` is unreachable (between step 5 and step 6 DNS propagation). Senders will get a temporary bounce and retry. · **Rollback:** re-enable CF Email Routing (instant)

**Pro tip:** Do steps 5 and 6 in one sitting, back-to-back. Don't stop for lunch between them.

---

### STEP 6 — Replace MX records with Google, replace SPF, add DMARC

**What:** Point mail to Google, authorize Google to send as `noizy.ai`, start DMARC monitoring.

**Do in Cloudflare → `noizy.ai` → DNS → Records:**

#### MX — single-record format (new Google standard, recommended)

| Type | Name | Mail Server | Priority | TTL | Proxy |
|---|---|---|---|---|---|
| MX | `@` | `smtp.google.com` | `1` | Auto | **DNS only** |

**OR** the legacy 5-record format (from the April 13 doc — also valid, but verbose):

| Type | Name | Mail Server | Priority |
|---|---|---|---|
| MX | `@` | `ASPMX.L.GOOGLE.COM` | `1` |
| MX | `@` | `ALT1.ASPMX.L.GOOGLE.COM` | `5` |
| MX | `@` | `ALT2.ASPMX.L.GOOGLE.COM` | `5` |
| MX | `@` | `ALT3.ASPMX.L.GOOGLE.COM` | `10` |
| MX | `@` | `ALT4.ASPMX.L.GOOGLE.COM` | `10` |

**Recommendation:** single-record `smtp.google.com` — simpler, less to mistype.

#### SPF — replace the Cloudflare one

| Type | Name | Content | TTL | Proxy |
|---|---|---|---|---|
| TXT | `@` | `v=spf1 include:_spf.google.com ~all` | Auto | **DNS only** |

If the old `v=spf1 include:_spf.mx.cloudflare.net ~all` still exists, **delete it**. Only one SPF TXT record per domain — multiple = undefined behavior.

#### DMARC — monitoring mode first (per April 13 doc's phased approach)

| Type | Name | Content | TTL | Proxy |
|---|---|---|---|---|
| TXT | `_dmarc` | `v=DMARC1; p=none; rua=mailto:rsp@noizy.ai; fo=1` | Auto | **DNS only** |

**Note:** `rua=mailto:rsp@noizy.ai` sends aggregate reports to your own inbox. You can route them to `dmarc-reports@noizy.ai` later via a Group alias.

**Phased hardening:**
- Week 1: `p=none` (monitoring only)
- Week 2 (after verifying all reports pass): `p=quarantine`
- Week 4 (after 2 weeks of clean reports): `p=reject`

**Time:** 10 min · **Risk:** medium (mistypes here = mail fails) · **Rollback:** delete the Google MX/SPF/DMARC records, re-enable CF Email Routing

---

### STEP 7 — Test mail flow

**What:** Verify `rsp@noizy.ai` receives mail at the new Gmail inbox with authentication passing.

**Do:**
1. From `rsplowman@icloud.com` (or any other external account), send a test email to `rsp@noizy.ai`
2. Open `https://mail.google.com` → sign in as `rsp@noizy.ai`
3. Test email should arrive within 30 seconds
4. Open the email → click the three-dot menu → **Show original**
5. Verify the header lines:
   ```
   SPF:   PASS with IP ...
   DKIM:  PASS with domain noizy.ai
   DMARC: PASS
   ```
6. Reply to the email → confirm the receiver sees it from `rsp@noizy.ai`
7. Send a test to `https://mail-tester.com` (paste your assigned address from mail-tester into your Gmail send form) — should score **9/10 or 10/10**

**Time:** 10 min · **Risk:** none (read-only test)

---

## Post-runbook cleanup

Once steps 1–7 pass:

1. **Archive or supersede** `Desktop/CLAUDE TODAY/integration-plane/GOOGLE-WORKSPACE-CLOUDFLARE-SETUP.md` — update its header to `# [SUPERSEDED 2026-04-09] See NOIZYLAB/spec/GOOGLE_WORKSPACE_SETUP_RUNBOOK.md`
2. **Update `~/.claude/rules/contact.md`** if the Email Routing section at bottom is no longer accurate
3. **Enroll hardware key** (YubiKey or Security Key) on `rsp@noizy.ai` in Google Admin → 2SV
4. **Optional: Create `admin@noizy.ai` break-glass** (separate decision from step 2)
5. **Run `gcloud auth login rsp@noizy.ai`** on GOD → tests that the unified identity works for GCP too
6. **Update Linear NOI-47** with status if GoDaddy exit is still in flight
7. **Consider retiring `noizyfish.com` MX → CF Email Routing** separately later (same process, different domain)

## When NOT to run this runbook

- **If you're about to travel or leave GOD unattended for >2 hours.** The mail cutover has a 5–15 min gap and you want to be present to catch any failure mode immediately.
- **If a live production email conversation is in-flight.** Let it finish.
- **If it's late in the day and you're in Red Mode (per `06_DAILY_OPERATION.md`).** DNS edits made tired are DNS edits redone sober. This runbook is a Yellow-or-Green-Mode activity.

## Decision summary — what I need from you before you start

1. **Split admin?** `rsp@noizy.ai` only, OR `admin@noizy.ai` super-admin + `rsp@noizy.ai` user — pick one.
2. **MX format?** Single-record `smtp.google.com` (recommended) or 5-record `ASPMX.L.GOOGLE.COM` family.
3. **DMARC aggregate reports destination?** Straight to `rsp@noizy.ai` (simplest) or to a `dmarc-reports@noizy.ai` Group you'll create later.
4. **Gemini for Workspace add-on?** +$20-28 CAD/mo — skip until you know you need it.

Once those 4 are answered, the runbook is deterministic. **You press the buttons; nothing ambiguous remains.**
