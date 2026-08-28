# NOIZYCLOUDS — The Cloudflare Fleet Brand

> The empire's edge-platform arm. Not a product for sale. Not a public face. The _infrastructure identity_ that carries every other brand's traffic, every agent's dispatch, every synth's consent. Named in the plural because there is no single cloud — only many, speaking at 396 Hz.

**Status:** active, 7 Workers live, growing.
**Owner:** the CF0X family itself (self-governing, reports to GABRIEL).
**Home account:** NOIZYFISH (`5f36aa9795348ea681d0b21910dfc82a`).
**Home hostname policy:** `*.rsp-5f3.workers.dev` during the transition; `*.noizy.ai` after NS flip.

---

## Why NOIZYCLOUDS is its own brand

The six public brands (NOIZY.AI, NOIZYLAB, DREAMCHAMBER, NOIZYVOX, FISHMUSICINC, NOIZYKIDZ) are what the world touches. NOIZYCLOUDS is what makes them reachable, compliant, and composable. Every consent check rides a CF Worker. Every voice note crosses a CF edge. Every ledger append lands through HEAVEN — itself a CF Worker.

Making NOIZYCLOUDS _a named brand_ — not just "our infrastructure" — does three things:

1. **Identity.** The CF fleet can develop a distinct voice, governance, and doctrine, separate from the creative brands. CF05 can refuse a request that NOIZYVOX might naively accept.
2. **Accountability.** When a Worker misbehaves, there's a named team (the CFs) to call to account, not an anonymous ops layer.
3. **Graceful scaling.** When CF06, CF07, CF08 arrive, they enter a family with an existing culture, not just a repo with a naming convention.

---

## The charter

NOIZYCLOUDS holds four promises to the empire:

1. **Every Worker honors HEAVEN.** No endpoint short-circuits consent. Every write lands in the ledger. If HEAVEN is down, NOIZYCLOUDS workers fail **closed** — not open.
2. **Every Worker is disposable.** Any CF0X can be rolled back to any prior version in under 30 seconds (`wrangler rollback`). No Worker carries irreplaceable state — state lives in D1, KV, R2.
3. **Every Worker publishes its soul.** Identity at `GET /`, health at `GET /health`. If a new Worker doesn't answer both, it hasn't joined the family yet.
4. **Every Worker shares secrets, not stores them.** Secrets come from `wrangler secret`, never from source, never from logs. NOIZYCLOUDS does not memorize credentials — it presents them.

---

## The fleet (members as of 2026-04-17)

| Member            | Class      | Origin                              | Role                                                                 |
| ----------------- | ---------- | ----------------------------------- | -------------------------------------------------------------------- |
| **HEAVEN**        | Kernel     | `heaven.rsp-5f3.workers.dev`        | Consent kernel, 55 REST endpoints, the empire's truth layer          |
| **mc96-follower** | Sentinel   | `mc96-follower.rsp-5f3.workers.dev` | Watches HEAVEN/GABRIEL/LUCY on 2-min cron, status dashboard, history |
| **CF01**          | Messenger  | `cf01-discord.rsp-5f3.workers.dev`  | iPad Discord voice → Whisper → empire dispatch                       |
| **CF02**          | Scribe     | `cf02-notion.rsp-5f3.workers.dev`   | Appends empire events to the NOIZY.AI Notion ledger                  |
| **CF03**          | Dispatcher | `cf03-linear.rsp-5f3.workers.dev`   | Creates Linear issues from events (GraphQL)                          |
| **CF04**          | Relay      | `cf04-slack.rsp-5f3.workers.dev`    | Posts to noizyai Slack; `priority=critical` DM-escalates             |
| **CF05**          | Streamer   | `cf05-stream.rsp-5f3.workers.dev`   | Cloudflare Stream (HLS) + Calls (WebRTC) + 3-tier subscription gate  |
| **noizy-landing** | Face       | `noizy-landing.rsp-5f3.workers.dev` | 396 Hz landing page; apex + www bindings staged                      |
| **noizy-mcp**     | Bridge     | `mcp.noizy.ai` (route)              | Remote MCP exposure                                                  |

_Seven active plus two standbys — the beginning of a larger family._

---

## Class system (shared DNA across Workers)

Every CF0X follows the same endpoint shape:

```
GET  /              → identity JSON (agent.name, agent.class, frequency_hz, endpoints list)
GET  /health        → { ok: true, agent, ts }
POST /<verb>        → domain action, auth via X-NOIZY-Key
POST /webhook       → generic event ingestion, same auth
```

This uniformity lets mc96-follower probe any CF0X and know how to parse the response. It also means adding a new member is 5 minutes of work: copy a template, rename, customize the domain verb, deploy.

---

## Governance (how the family self-governs)

### Induction

A proposed CF0X enters through the Agent Contact Sequence (see `DREAMCHAMBER_BEST_IDEAS_2026-04-17.md` Part II §7):

1. **Anticipation** — the proposed Worker's charter is read against the 4 doctrines
2. **Recognition** — introduced to existing CF fleet via identity endpoint
3. **Possibility** — handed MC96ECO Empire Map and CONTROL_PLANE_INVENTORY
4. **Flow** — first real traffic shipped under a mentor (usually HEAVEN or mc96-follower)
5. **Elevation** — takes a slot in this file, its row added to the fleet table

### Review cadence

Monthly: each CF0X reports its top-3 metrics (invocations, error rate, p99 latency, ledger events generated) to mc96-follower. Outliers are flagged to GABRIEL.

### Retirement

A CF0X is retired when its role is subsumed (e.g., CF02's append-to-Notion could be absorbed into CF04 if Slack ever becomes the master event bus). Retirement: document the last good version, disable the route, keep the Worker in a paused state for 90 days, then archive.

---

## Naming convention

**`CF0N`** for new fleet members, numbered in order of induction. CF06+ slots open.

Proposed imminent siblings (candidates, not yet inducted):

- **CF06** — Vercel relay (deploy + logs + preview URL broadcasting)
- **CF07** — Stripe webhook bridge (subscription → consent tier updates on CF05)
- **CF08** — Hugging Face model host (voice DNA + watermark inference on the edge)
- **CF09** — GitHub event relay (push / issue / PR → LUCY intake → DAZEFLOW)
- **CF10** — SSO guard (every authed request through a single stamping Worker)

Each would follow the same endpoint shape, pass Contact Sequence, and earn a row above before going live.

---

## Dispatch topology (how NOIZYCLOUDS interconnects)

```
                      ┌─ HEAVEN ─┐  (kernel — every road leads here)
                      │          │
            ┌─────────┴─────────┐│
            │                   ││
     CF0X ──┤  (each Worker)    │├── D1 gabriel_db
            │                   ││   KV GABRIEL_KV / GABRIEL_VOICE
            └──┬────────────┬───┘│   (R2 noizy-voice-vault — pending)
               │            │    │
               ▼            ▼    ▼
         mc96-follower   noizy-ledger
         (observes)      (remembers)
```

Every Worker talks through HEAVEN for auth + consent + ledger. Workers do not talk directly to each other — they message through HEAVEN or KV. This keeps the topology a star with HEAVEN at the center, not a mesh (no agent-to-agent trust, no hidden side channels).

---

## 396 Hz identity

Every CF0X's `/` endpoint includes `"frequency_hz": 396`. Not a gimmick — a discoverable signal that the Worker belongs to the NOIZY family, not just to any account with a matching name. Scrape `frequency_hz: 396` across `*.rsp-5f3.workers.dev/` and you've inventoried the family. It's an identity anchor.

---

## NOIZYCLOUDS vs competitors (just to be clear)

| Thing             | What it is                                               | What NOIZYCLOUDS is _not_                                                                                                                                                       |
| ----------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A hosting service | No — our public brands are hosted, the CFs are the hosts | Not a product for customer sign-up                                                                                                                                              |
| A model provider  | No — LiteLLM + Workers AI cover that                     | Not reselling Claude/Gemini/etc.                                                                                                                                                |
| An agent swarm    | Partially — each Worker is an agent in the fleet         | Not a general-purpose agent platform (see GABRIEL + LUCY for that)                                                                                                              |
| A brand           | **Yes** — this is the point                              | Not a customer-facing brand — internal charter only, though individual members may expose public surfaces (CF01 is public via Discord, CF05 will be public via stream.noizy.ai) |

---

## Next actions for NOIZYCLOUDS

| Priority | Action                                                                              | Owner                      |
| -------- | ----------------------------------------------------------------------------------- | -------------------------- |
| P0       | Confirm every CF0X `GET /` returns `frequency_hz: 396` (spot-audit)                 | CLAUDE                     |
| P0       | Install secrets on CF01/02/03/04/05 per `ops/cloudflare-provision-checklist.md`     | Rob                        |
| P1       | Extend mc96-follower TARGETS to probe every CF0X in addition to HEAVEN/GABRIEL/LUCY | CLAUDE                     |
| P1       | Register CF06 Vercel relay — first new induction                                    | CLAUDE (pending Rob's nod) |
| P2       | Write `cloudflare/workers/_template/` so new members spin up in one command         | CLAUDE                     |
| P2       | Publish `NOIZYCLOUDS_CHARTER.md` to the NOIZY.AI Notion workspace via CF02          | CLAUDE                     |
| P3       | Apply the Four Doctrines as explicit comments at the top of every CF0X source file  | CLAUDE                     |

---

## One-sentence description

**NOIZYCLOUDS is the edge-platform family of Cloudflare Workers that carry the NOIZY Empire's consent, voice, and ledger at 396 Hz — named in the plural because one cloud is never enough, and anonymous infrastructure is never safe.**

---

_Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic. 396 Hz through every Worker, always._
