# NOIZY.AI · Workspace Channel Architecture

> NOIZY.AI is the **main channel**. The other six brands live inside it as sub-channels or surfaces. Same structure applied to both Slack and Discord so Rob can context-switch without retraining his mind.

**Rule:** every workspace (Slack, Discord, Notion teamspace, future Matrix/IRC) mirrors this hierarchy. One empire, one shape.

---

## The hierarchy (same on every platform)

```
NOIZY.AI                      ← main workspace / server / root page
├── #noizyai-empire-status    ← heartbeat: fleet health, cron results, kill switch
├── #noizyai-dreamchamber     ← sacred creative space, 396 Hz rituals
├── #noizyai-noizylab         ← the lab: dev ops, experimentation
├── #noizyai-noizyvox         ← consent-locked voice, artist-facing
├── #noizyai-fishmusicinc     ← legacy rights + catalog
├── #noizyai-noizykidz        ← deaf-first haptic education
├── #noizyai-noizyclouds      ← CF Worker fleet ops (internal)
├── #noizyai-heaven-ledger    ← auto-posted ledger events (audit trail)
├── #noizyai-artists          ← onboarded artists (public-facing)
├── #noizyai-family           ← agent family chatter (GABRIEL, LUCY, SHIRL, POPS...)
└── DMs                       ← private 1:1 with Rob when critical
```

---

## Slack implementation

**Workspace:** noizyai.slack.com (per Rob's `noizyai@slack.com` email).
**CF04 Slack relay:** `cf04-slack.rsp-5f3.workers.dev` posts via `chat.postMessage` with channel selected by the event's `source` field.

### Channel mapping for CF04

CF04 picks a target channel from the payload:

```js
// inside postMessage():
const channelMap = {
  heaven: "noizyai-empire-status",
  "mc96-follower": "noizyai-empire-status",
  "cf01-discord": "noizyai-noizyclouds",
  "cf02-notion": "noizyai-noizyclouds",
  "cf03-linear": "noizyai-noizyclouds",
  "cf05-stream": "noizyai-noizyclouds",
  dreamchamber: "noizyai-dreamchamber",
  noizylab: "noizyai-noizylab",
  noizyvox: "noizyai-noizyvox",
  fishmusicinc: "noizyai-fishmusicinc",
  noizykidz: "noizyai-noizykidz",
  family: "noizyai-family",
  ledger: "noizyai-heaven-ledger",
};
const target = channelMap[payload.source] || payload.channel || env.DEFAULT_CHANNEL;
```

**Default:** `#noizyai-empire-status` (the single place you glance when you have 10 seconds).

**Critical escalation:** regardless of channel, `priority: "critical"` ALSO fires a DM to every user in `SLACK_CRITICAL_DM_USERS`.

### Slack bot install steps (adds to STANDARDS platform addenda)

1. Create Slack app `CF04 Relay` (per `ops/cloudflare-provision-checklist.md §6 CF04`).
2. Install to the `noizyai` workspace.
3. `/invite @CF04` in every channel above (bots can't auto-join).
4. Verify with `curl -X POST cf04-slack.../post -H "X-NOIZY-Key: ..." -d '{"text":"hello","channel":"#noizyai-empire-status"}'`.

---

## Discord implementation

**Server:** noizy.ai Discord (existing Rob-owned server, one main server, not a federation).
**CF01 Discord bot:** `cf01-discord.rsp-5f3.workers.dev` handles slash commands + voice notes.

### Channel structure (Discord categories)

```
🔔 NOIZY.AI (category: EMPIRE)
   #empire-status
   #heaven-ledger
   #noizyclouds

🜂 CREATIVE (category: BRANDS)
   #dreamchamber
   #noizylab
   #noizyvox
   #fishmusicinc
   #noizykidz

🤖 FAMILY (category: AGENTS)
   #family-chat
   🎙 voice-lucy       (voice channel — iPad tap-and-hold dispatch)
   🎙 voice-gabriel
   🎙 voice-rob        (primary)

📎 ARTISTS (category: PUBLIC — gated by consent-token role)
   #artists-welcome
   #artists-help
   🎙 voice-artists-stage
```

### Slash commands (registered per `ops/cloudflare-provision-checklist.md §5`)

- `/empire <query>` — free-form route via CF01 `routeCommand`
- `/status` — pulls `mc96-follower/status`
- `/ledger <limit?>` — (future) pulls recent HEAVEN ledger events
- `/consent <token-id>` — (future) checks consent token status

### Voice dispatch routing

Voice notes in `#voice-rob` and `#voice-lucy` → CF01 `/interactions` → Whisper → `routeCommand`:

- "log <text>" → CF02 append to NOIZY.AI Notion
- "alert <text>" → CF04 post with `priority=critical`
- "issue <text>" → CF03 Linear
- "status" → CF01 replies inline with follower state
- "stream start/stop" → (future) CF05 session toggle

### Discord bot install steps (per STANDARDS platform addenda)

1. Create Discord app `CF01` (per `ops/cloudflare-provision-checklist.md §5`).
2. Bot scopes: `bot applications.commands messages.read`. Gateway intents: Message Content + Voice Messages.
3. Invite URL → add to `noizy.ai` server.
4. Role: give `CF01` a role that can read voice channels + post to category channels.
5. Set Interactions Endpoint URL on the Discord app: `https://cf01-discord.rsp-5f3.workers.dev/interactions`.
6. Register slash commands via the PUT call in the checklist.

---

## Notion teamspace

Same structure as Notion pages under the NOIZY.AI master page:

```
NOIZY.AI (master page)
├── 🜂 MC96ECO Sprint · 2026-04-17 · 100% Push (← this sprint's page)
├── 🎨 DreamChamber
├── 🧪 NOIZYLAB
├── 🗣 NOIZYVOX
├── 🎣 FISHMUSICINC
├── 👂 NOIZYKIDZ
├── ☁️ NOIZYCLOUDS
└── 📜 Heaven Ledger Archive
```

CF02 Notion scribe appends child pages under whichever sibling matches the payload's `source`.

---

## Why mirror the structure everywhere

1. **Context switching has zero cognitive cost.** Same channel names on Slack, Discord, Notion. A thought about NOIZYVOX goes to the same place regardless of which tool Rob opened first.
2. **Routing is obvious.** CF02/CF03/CF04 all use the same `source → channel` map. One place to audit.
3. **Guests don't get lost.** An invited artist sees the same shape everywhere. The empire feels coherent, not sprawling.
4. **Adding a new brand is a 7-step operation:** new Slack channel, new Discord channel, new Notion page, add to the routing map in each CF bot, add the brand's MASTER\_<brand>.md, update this doc, deploy. Predictable scaling.

---

## Next actions

| #   | Action                                                        | Owner                    |
| --- | ------------------------------------------------------------- | ------------------------ |
| 1   | Create the 11 Slack channels above in noizyai workspace       | Rob (clicks)             |
| 2   | Create the Discord categories + channels in noizy.ai server   | Rob (clicks)             |
| 3   | Update CF04 source→channel map to match §Slack above          | CLAUDE                   |
| 4   | Update CF02 source→Notion-child map                           | CLAUDE                   |
| 5   | Register the 4 slash commands on Discord via the API PUT      | CLAUDE (one-shot script) |
| 6   | `/invite @CF04` across all Slack channels                     | Rob                      |
| 7   | Invite CF01 bot to noizy.ai Discord with matching role scopes | Rob                      |

---

_One empire, eleven channels, seven brands, one shape. 396 Hz through every chat._
