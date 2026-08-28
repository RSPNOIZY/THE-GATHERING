# Discord + Slack · Smartest & Most Powerful Next Moves

> Ranked by _leverage × shippability_. Today CF01 + CF04 are wired but empty vessels (no tokens installed). Below: everything they can become, grouped by what I can ship now vs what needs Rob's one-time setup.

---

## TIER 1 · shippable now, highest leverage

### 1 · Slack `/noizy` slash commands (bidirectional, not just outbound)

Today CF04 is post-only — empire fires events into Slack. Adding inbound slash commands turns every Slack window into an empire CLI. Shipped as `POST /slash` with signature verification (`v0` HMAC per Slack's spec, same timestamp-<=-5-min replay guard).

```
/noizy status           → fleet health rendered as Block Kit
/noizy ledger 10        → last 10 HEAVEN events, interactive buttons per row
/noizy kill-switch <id> → revoke consent token (confirm modal)
/noizy artist-zero      → fire the walkthrough, stream progress back
/noizy digest           → yesterday's empire digest
/noizy channels         → list live CF05 channels + join buttons
```

### 2 · Discord slash command expansion + component buttons

CF01 has `/empire` + `/status`. Adding:

```
/lucy <query>          → route to LUCY agent (read-only empire ops)
/ledger [count]        → last N ledger events inline
/kill-switch <token>   → modal confirm → revoke
/digest                → daily digest on demand
/standards             → run bot-compliance-audit, post summary
/channel <name>        → CF05 channel state + join signaling URL
```

Every notification message from CF02/03/04/05/08/09 gets **action components**:
`[Acknowledge] [Escalate] [Open in Notion] [Open in Linear]` — click → component interaction back to CF01 → action fires.

### 3 · Rich formatting across the fan-out

Replace plain-text fan-out with:

- **Slack Block Kit** — color-coded accessory blocks (green = ok, yellow = warn, red = critical), side-by-side field grids, divider blocks, context footers.
- **Discord embeds** — per-brand accent color, per-brand thumbnail, title + description + fields, timestamp footer, CF source icon.

Each brand gets a color: NOIZY.AI `#9ad`, DREAMCHAMBER `#396`, NOIZYVOX `#c6f`, FISHMUSICINC `#f93`, NOIZYKIDZ `#fd5`, NOIZYLAB `#5df`, NOIZYCLOUDS `#aaa`, FAMILY `#ff7`.

### 4 · Thread-folding in CF04

Repeat events from the same `source + summary` within 15 minutes fold into a thread reply rather than a new top-level post. CF04 keeps a short KV index `thread:<hash>` → message `ts`. Channels stay calm; detail is one click away.

---

## TIER 2 · shippable now, medium effort

### 5 · Daily digest cron (Slack + Discord)

Reuse mc96-follower's cron infrastructure. Add `0 13 * * *` (9am ET) that walks:

- HEAVEN `/gabriel` — counts
- last 24h ledger
- CF08 audit cache (recent GitHub events)
- CF05 channel publish events
- kill-switch drills run

Posts to `#noizyai-empire-status` on Slack and `#empire-status` on Discord with Block Kit / embed formatting. Turns the empire into a morning-paper read.

### 6 · Artist-threaded Discord onboarding

When CF08 / CF09 / Artist Zero creates a new actor, CF01 auto-creates a Discord thread in `#noizyai-artists-stage` named `🎙 <actor_id>`. Every future event tagged with that actor routes to that thread. Each artist has a single source-of-truth conversation from day one.

### 7 · Slack Canvas per brand channel

Auto-generated shared Canvas per `noizyai-<brand>` channel, updated every 10 min by CF04 with:

- Current CF05 publish state (is anyone live?)
- Active consent tokens scoped to this brand
- Last 5 events
- One-tap join URLs

Canvases are editable — artists can add notes directly. The brand's living dashboard.

---

## TIER 3 · needs Rob's token install first

### 8 · Approval flows via Slack buttons

Every `wrangler deploy` touching HEAVEN fires a Slack message: `Deploy proposed by [sender] · [Approve] [Reject]`. Click Approve → signed interaction back to CF04 → triggers `gh workflow run deploy.yml --ref <sha>`. Same pattern for consent token issuance over a threshold.

Needs: Slack Interactivity endpoint pointed at CF04, GitHub PAT with `repo` scope on CF04.

### 9 · Discord context menu commands

Right-click any Discord message → "Route to empire" / "Turn into Linear issue" / "Archive to Notion". Useful when artists DM Rob material that needs ledger-logging.

Needs: Application command type 3 (MESSAGE) registered after Discord app install.

### 10 · Slack Huddle auto-start on critical

`priority=critical` events post a message that starts a Huddle in the target channel. Synchronous voice response for red incidents. Needs: Slack's `conversations.startHuddle` (Enterprise Grid only) OR a workflow with a Jitsi fallback.

---

## TIER 4 · needs Docker bot (can't run in Worker alone)

### 11 · Discord voice-channel gateway

CF01 handles text interactions + voice attachments, but **can't maintain a Discord Voice Gateway connection** (Workers don't hold UDP/long-lived WS). Solution: a Python `docker-bots/discord-gateway/` service (already scaffolded in `CONTROL_MATRIX_ADDENDUM.md §A`) using `discord.py` that:

- Joins any voice channel on command
- Captures audio from the active speaker
- Streams to CF01 `/voice` as webm chunks
- Transcription continues via Workers AI Whisper
- Result routes back to Discord as a reply

This unlocks: Rob says _"Hey LUCY, record the next 5 minutes"_ in any Discord voice channel → captured, transcribed, logged. No Discord voice notes needed.

### 12 · Slack Socket Mode bot for presence

For apps that want persistent Slack presence (show who's online in a channel, react to reactions), Workers can't hold the Socket Mode WebSocket. A small Node service in `docker-bots/slack-presence/` would expose this. Lower priority than 11.

---

## Cross-cutting smart moves

### 13 · Correlation IDs

Every CF event gets a short `cid` (8-char random). The `cid` appears in:

- Slack message footer
- Discord embed footer
- Notion page ID prefix
- Linear issue title
- HEAVEN ledger row

One grep across surfaces returns the full cross-platform trail. Huge for debugging + audit.

### 14 · Brand-aware routing at source

Every bot payload already carries `source` (the CF0X that fired). Add `brand` explicitly (or infer from source). Then `channel` selection is always deterministic — no fallback to `empire-status` catch-all unless brand is genuinely global.

### 15 · Unfurl worker

CF04 sees a link like `https://heaven.rsp-5f3.workers.dev/api/v1/synth-requests/<id>` posted by any human → it auto-unfurls with a Block Kit preview (C2PA manifest preview, consent token status, ledger entry). Same pattern for Notion URLs, Linear issue URLs. Needs: Slack Event Subscriptions → CF04 `/slack/events`.

---

## Smartest-single-move ranking

If you pick one thing, pick **#3 Rich formatting**. Here's why it dominates:

- It compounds with every future fan-out. Every CF04 post becomes prettier, every Discord embed becomes more scannable, permanently.
- It doesn't need any new tokens — just edits to the existing CF0X source.
- It surfaces brand identity _visually_ (color, icon) which is the whole reason NOIZY.AI exists.
- It creates surface area for #2 (component buttons) because Block Kit / embeds are the scaffold for interactive elements.

Second pick: **#1 Slack slash commands** (turns Slack into an empire CLI; shippable now with signature verification; high daily-use value).

Third pick: **#4 Thread-folding** (prevents channel noise at zero marginal cost).

---

## What I'm shipping in this rung

1. **CF04 Slack** — `/slash` endpoint (v0 HMAC verify) + Block Kit formatter + thread-folding KV
2. **CF01 Discord** — 5 new slash commands (`/lucy`, `/ledger`, `/kill-switch`, `/digest`, `/standards`) + embed formatter + component-interaction router
3. **`integrations/slack/register-commands.md`** — the app manifest + slash command registration steps for Rob
4. **`integrations/discord/register-commands.sh`** — the one-time REST call to register all slash commands on Rob's Discord application

Going.
