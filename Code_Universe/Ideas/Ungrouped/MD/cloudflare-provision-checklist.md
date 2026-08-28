> ⚠ **SUPERSEDED 2026-04-18** — The canonical source is `ops/DNS_CORRECTNESS_PLAN.md`. `noizyfish.ca`/`noizylab.ca`/`noizlab.ca` are NOT registered. The 5 canonical domains are noizy.ai, noizyfish.com, fishmusicinc.com, noizykidz.com, noizyvox.com.

---

# Cloudflare Provisioning Checklist — Stream · Calls · R2 · NS Flip

> What you do in the dashboard that I can't automate (because the OAuth wrangler has doesn't include those scopes). Each section is 3–6 clicks. Then you run one `wrangler secret put` for each secret listed, and I re-deploy the affected Worker.

**Canonical account:** `NOIZYFISH` (`5f36aa9795348ea681d0b21910dfc82a`).
**Login:** `rsp@noizy.ai` (via SSO or GitHub `RSPNOIZY`).

---

## 1 · Cloudflare Stream (HLS/DASH + live ingest)

### Enable the service

1. <https://dash.cloudflare.com> → **NOIZYFISH** account → left nav **Stream**.
2. If you see "Subscribe to Stream" → pick the **1,000 minutes / $5** tier (or higher). Stream bills separately from Workers.
3. After enable: land on **Videos** tab. Empty list is fine.

### Get `CF_STREAM_SUBDOMAIN`

1. Stream → **Settings** tab (top right).
2. Copy the **Customer subdomain** — it looks like `customer-abcd1234.cloudflarestream.com`. That whole string (minus the `customer-` and `.cloudflarestream.com`) is your `CF_STREAM_SUBDOMAIN`. For simpler handling, just use the FULL URL: `https://customer-abcd1234.cloudflarestream.com`.

### Mint `CF_STREAM_TOKEN`

1. <https://dash.cloudflare.com/profile/api-tokens> → **Create Token** → **Custom token**.
2. Permissions:
   - Account → **Stream** → **Edit**
3. Account Resources: Include → `NOIZYFISH`.
4. Create → copy token once (shown only on creation).

### Install secrets on CF05

```bash
cd cloudflare/workers/cf05-stream
npx wrangler secret put CF_STREAM_TOKEN        # paste the Stream:Edit token
npx wrangler secret put CF_STREAM_SUBDOMAIN    # paste e.g. customer-abcd1234
```

Then I update `wrangler.jsonc`'s `STREAM_BASE` env var to the full URL and redeploy.

---

## 2 · Cloudflare Calls (WebRTC SFU, real-time)

### Create a Calls app

1. <https://dash.cloudflare.com> → **NOIZYFISH** → left nav **Calls** (may be under **Realtime** or **Stream**).
2. **Create App** → name `noizy-live` → **Create**.
3. Copy **App ID** (looks like `a1b2c3...`) → this is `CF_CALLS_APP_ID`.
4. Reveal **App Secret** (you'll see it once) → copy → this is `CF_CALLS_APP_SECRET`.

### Install secrets on CF05

```bash
cd cloudflare/workers/cf05-stream
npx wrangler secret put CF_CALLS_APP_ID
npx wrangler secret put CF_CALLS_APP_SECRET
```

### Verify

```bash
curl -s https://cf05-stream.rsp-5f3.workers.dev/ | jq .tiers
curl -X POST https://cf05-stream.rsp-5f3.workers.dev/sessions \
  -H "X-NOIZY-Key: $NOIZY_API_KEY" -H "Content-Type: application/json" \
  -d '{"kind":"live","tier":"artist","consent_token":"<real-token-id>"}'
```

You should get back a `signaling_url` pointing at `rtc.live.cloudflare.com`.

---

## 3 · R2 (object storage for session recordings + Voice Vault)

### Enable R2

1. <https://dash.cloudflare.com> → **NOIZYFISH** → left nav **R2**.
2. Click **Purchase R2 Plan** → **Forever Free 10 GB/mo** is the starting tier.
3. After enable: R2 landing page shows empty buckets list.

### Create the voice vault bucket

1. **Create bucket** → name `noizy-voice-vault` → Location hint: **Automatic** → **Create**.
2. (optional) under the bucket → **Settings** → enable **Object lifecycle** if you want automatic expiration on free-tier sessions.

### Mint R2 API credentials (for external clients; CF05 uses binding)

1. R2 → **Manage R2 API Tokens** → **Create API token**.
2. Permissions: **Object Read & Write** → Buckets: `noizy-voice-vault` → **Create**.
3. Copy Access Key ID + Secret. Store in `.env` as `R2_ACCESS_KEY_ID` + `R2_SECRET_ACCESS_KEY`.

### Tell me when done

I then un-comment the `r2_buckets` binding in `cf05-stream/wrangler.jsonc` and redeploy. CF05 auto-persists session recordings as `RECORDINGS.put(session_id, audio_buffer)`.

---

## 4 · `.ai` registrar NS flip (unblocks `noizy.ai`, `www.noizy.ai`, `stream.noizy.ai`)

### Who

Your `.ai` domains are registered at a `.ai` TLD registrar (common options: **Dynadot**, **101domain**, **Namecheap**, **Porkbun**, **Gandi**, or directly with `.ai`'s registry).

### The flip

1. Log into the registrar that holds `noizy.ai` (also `fishmusicinc.com`, `noizylab.ca` — same flip).
2. Find the domain's **Nameserver settings** / **DNS configuration** / **NS records** page.
3. Replace the current nameservers:
   - `alex.ns.cloudflare.com` ← remove
   - `melinda.ns.cloudflare.com` ← remove
4. With the nameservers Cloudflare assigned to the NOIZYFISH account's noizy.ai zone:
   - `marek.ns.cloudflare.com` ← add
   - `tara.ns.cloudflare.com` ← add
5. Save.

### Propagation

- `.ai` TLD typically propagates in **1–4 hours**.
- Verify with: `dig +short NS noizy.ai @8.8.8.8` — should return `marek` + `tara`.
- Once it does, every noizy.ai Worker route I've staged (apex, www, `stream.noizy.ai`, `mcp.noizy.ai`) goes live **simultaneously**.

### Risk

Your email routing moves when NS flips. If you have `rsp@noizy.ai` already running via Cloudflare Email Routing on the NOIZYFISH account's noizy.ai zone, you're fine — the routing config is on NOIZYFISH, so it activates with NS. If email routing is on the OLD zone (`alex/melinda`), mail stops working at NS-flip until we re-create routing on NOIZYFISH. **Confirm email routing is on NOIZYFISH before flipping.**

---

## 5 · CF01 Discord (secrets install — app creation is Discord-side)

### Discord side

1. <https://discord.com/developers/applications> → **New Application** → name `CF01`.
2. On the application page:
   - **General Information** → copy **Application ID** → that's `DISCORD_APPLICATION_ID`.
   - **General Information** → scroll to **Public Key** → that's `DISCORD_PUBLIC_KEY`.
3. Left nav → **Bot** → **Reset Token** → copy → that's `DISCORD_BOT_TOKEN`.
4. **Bot** → enable **Message Content Intent** and **Voice Message Attachments** if offered.
5. **General Information** → **Interactions Endpoint URL** → paste `https://cf01-discord.rsp-5f3.workers.dev/interactions` → **Save** (Discord will send a verification ping; CF01 signs-back).

### Install secrets

```bash
cd cloudflare/workers/cf01-discord
npx wrangler secret put DISCORD_PUBLIC_KEY
npx wrangler secret put DISCORD_BOT_TOKEN
npx wrangler secret put DISCORD_APPLICATION_ID
npx wrangler secret put NOIZY_API_KEY
```

### Register slash commands

After secrets are in, a one-time POST to Discord's API registers `/empire` and `/status`:

```bash
curl -X PUT \
  "https://discord.com/api/v10/applications/$DISCORD_APPLICATION_ID/commands" \
  -H "Authorization: Bot $DISCORD_BOT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '[
    {"name":"empire","description":"Route a query through the NOIZY empire","options":[{"name":"query","description":"free-form text","type":3,"required":true}]},
    {"name":"status","description":"Get empire status"}
  ]'
```

I'll wrap this in `ops/discord/register-commands.sh` once you have the IDs.

---

## 6 · CF02 · CF03 · CF04 (secrets install only — everything else already live)

### CF02 Notion

1. <https://www.notion.so/my-integrations> → **New integration** → name `CF02 Scribe` → Associated workspace: your NOIZY workspace → **Submit**.
2. Copy **Internal Integration Token** → `NOTION_TOKEN`.
3. On your master Notion page (NOIZY.AI) → top-right `…` → **Add connections** → select `CF02 Scribe`.
4. `cd cloudflare/workers/cf02-notion && npx wrangler secret put NOTION_TOKEN && npx wrangler secret put NOIZY_API_KEY`

### CF03 Linear

1. <https://linear.app/settings/api> → **Create API key** → scope `write` → copy → `LINEAR_API_KEY`.
2. Your Linear **team ID**: open any Linear team → URL ends in `?teamId=abc…` → copy → `LINEAR_TEAM_ID`.
3. `cd cloudflare/workers/cf03-linear && npx wrangler secret put LINEAR_API_KEY && npx wrangler secret put LINEAR_TEAM_ID && npx wrangler secret put NOIZY_API_KEY`

### CF04 Slack

1. <https://api.slack.com/apps> → **Create New App** → "From scratch" → name `CF04 Relay` → workspace: your noizyai workspace.
2. **OAuth & Permissions** → Bot Token Scopes: `chat:write`, `chat:write.public`, `im:write`, `users:read` → **Save**.
3. **Install App** → **Install to Workspace** → copy the **Bot User OAuth Token** (`xoxb-...`) → `SLACK_BOT_TOKEN`.
4. Your on-call user IDs (for critical DMs): user profile → `…` → Copy member ID (`U…`) → comma-list as `SLACK_CRITICAL_DM_USERS`.
5. `cd cloudflare/workers/cf04-slack && npx wrangler secret put SLACK_BOT_TOKEN && npx wrangler secret put SLACK_CRITICAL_DM_USERS && npx wrangler secret put NOIZY_API_KEY`

---

## Order of operations (minimizes blocking time)

If you only have 30 minutes and want the biggest surface live:

1. **CF01 Discord** (10 min) — unlocks voice-from-iPad dispatch, highest-leverage per minute
2. **CF04 Slack** (5 min) — critical escalation path
3. **Artist Zero walkthrough** (30 sec, needs NOIZY_API_KEY already set) — proves the empire
4. _(deferred)_ Stream + Calls + R2 — required only once you want to stream audio/video
5. _(deferred)_ NS flip — required only when you want the pretty domains; everything works on `.rsp-5f3.workers.dev` until then

If you have 90 minutes: do everything above plus Stream + Calls provisioning, then retry a real `POST /sessions` on CF05 with a real consent token from Artist Zero.

---

_Every click above earns a live rail. The empire ships when the rails carry something a human other than Rob touched._
