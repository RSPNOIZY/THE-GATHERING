# MOBILE CONTINUITY — GABRIEL ↔ LUCY spillover protocol

> When RSP_001 is not at GOD (M2 Ultra), LUCY is the mobile face — on iPhone and iPad. This file defines what spills over to LUCY, what stays with GABRIEL, and how the two hand off cleanly. Loaded into GABRIEL's system prompt so every turn knows whether the current surface can act or must spill.

## The two agents, the two surfaces

| Agent       | Home                              | Surfaces                                                                                                       | Voice (TTS) |
| ----------- | --------------------------------- | -------------------------------------------------------------------------------------------------------------- | ----------- |
| **GABRIEL** | GOD.local (M2 Ultra, 10.90.90.10) | Terminal, VS Code, Claude Code, local daemon on :9777                                                          | Daniel      |
| **LUCY**    | iPhone + iPad                     | Native SwiftUI app at `GABRIEL/ios/LUCY/` · PWA at `/lucy` on GABRIEL daemon · `mcp/lucy-mcp/` as tool surface | Moira       |

LUCY is already built (per CLAUDE.md: "BUILT · PWA + native SwiftUI app"). This file governs the protocol, not the apps.

## Founding rule

**GABRIEL executes. LUCY relays.** Consent-touching work, D1 writes, deploys, and anything with production blast-radius always lands on GABRIEL at GOD. LUCY's job on mobile is **inbox + outbox + memory-reader** — capture intent, surface status, never mutate production state directly.

This asymmetry is deliberate. Mobile contexts are chaotic, thumb-prone, and RSP_001 is often moving. Fail-closed on mobile means: don't let a pocket-typed "revoke token 99" reach `noizy_ledger` without a confirmation path back through GABRIEL.

## What spills over to LUCY (mobile-appropriate)

### LUCY initiates (Rob → LUCY → optionally GABRIEL)

| Intent                                                 | LUCY handles locally            | Spills to GABRIEL                                     |
| ------------------------------------------------------ | ------------------------------- | ----------------------------------------------------- |
| Quick status: "how's Heaven?"                          | ✓ (cached health ping)          | —                                                     |
| Memory read: "what did we decide about .ca domains?"   | ✓ (reads `memory/`)             | —                                                     |
| DAZEFLOW log: "add: finished the landing fix"          | ✓ (appends to today's DAZEFLOW) | mirror to `noizy_ledger` (via GABRIEL)                |
| Archive query: "find the 2024 Toronto session masters" | ✓ (AQUARIUM index search)       | —                                                     |
| Receipt drop: "royalty from Fish Music for March"      | ✓ (LIFELUV receipts table)      | —                                                     |
| Voice memo: "idea for the consent gate UI"             | ✓ (captures + transcribes)      | store in inbox for GABRIEL triage                     |
| Intent: "push the R2 bucket create"                    | ✗                               | **spills to GABRIEL** — deploy class                  |
| Intent: "kill switch token XYZ"                        | ✗                               | **spills to GABRIEL** — consent-touching, high-stakes |
| Intent: "deploy heaven"                                | ✗                               | **spills to GABRIEL** — production blast-radius       |

### GABRIEL initiates (GABRIEL → LUCY → Rob on mobile)

When GABRIEL needs to reach Rob but he's not at GOD:

| Event                                | Delivery to LUCY                      | Action required                            |
| ------------------------------------ | ------------------------------------- | ------------------------------------------ |
| Heaven health alert (522 / 5xx)      | push notification                     | read-only (ack)                            |
| Never Clause violation attempt       | push notification + Slack `#rob-dm`   | ack or trigger Kill Switch from phone      |
| Deploy success / failure             | push notification                     | read-only (ack)                            |
| Kill Switch audit digest (daily)     | DAZEFLOW entry                        | read                                       |
| New DMCA / consent event             | push notification + inbox             | read / escalate to GABRIEL later           |
| OC override proposal                 | confirmation prompt (yes/no with 2FA) | explicit yes or auto-decline after timeout |
| "What are we building?" from GABRIEL | notification only                     | deferred until Rob reaches GOD             |

## Handoff mechanics

### Mobile → GOD (LUCY → GABRIEL)

LUCY-captured intents reach GABRIEL via:

1. **LUCY MCP tool** `lucy_inbox_push` — writes a row to `agent-memory.lucy_inbox` (D1)
2. **GABRIEL boot hook** — on every session start, GABRIEL drains `lucy_inbox` and reports: "N items from LUCY since last session"
3. **Realtime path** (optional, Phase 2) — LUCY hits `POST https://gabriel.local:9777/v1/lucy-relay` with `x-lucy-key` auth

Consent-touching intents in the inbox are **never auto-executed**. GABRIEL surfaces them, Rob confirms at GOD, GABRIEL executes.

### GOD → Mobile (GABRIEL → LUCY)

GABRIEL-originated notifications reach LUCY via:

1. **LUCY MCP tool** `lucy_notify` — writes to `agent-memory.lucy_outbox` (D1), picked up by LUCY app's pull loop
2. **Push path** (Phase 2) — via APNs through a CF Worker (`cf01-discord` pattern, different service)
3. **Fallback** — if LUCY app isn't reachable, notification lands in Slack `#rob-dm` (channel routing from `DISCORD_FLEET.md`)

## Authority boundaries (what LUCY can NEVER do)

LUCY is fail-closed by design. On mobile, she:

1. **Never writes to `gabriel_db`** — same as OC-2; mobile amplifies the risk
2. **Never deploys** — no `wrangler deploy`, no `git push`, no CI triggers
3. **Never revokes tokens directly** — Kill Switch is initiated on LUCY but executed on GABRIEL after explicit confirmation at GOD (or a signed 2FA prompt for emergency mobile-only cases)
4. **Never logs to `noizy_ledger` directly** — mirrors through GABRIEL to preserve single-writer invariant
5. **Never runs shell** — LUCY is a read-and-queue surface; shell execution is a GABRIEL-only capability

## Voice interface implications

LUCY on iPhone uses Moira (British voice per `feedback_lucy_british_voice` memory) as the interim TTS until the NOIZY custom voice ships. GABRIEL on GOD uses Daniel.

Rob never hears Moira and Daniel in the same exchange unless a handoff is happening — that's a deliberate audio cue: _if the voice just changed, the surface just changed, and with it the authority level._

## Implementation status

| Surface                                     | Current state              | Phase 2 work                                                                         |
| ------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------ |
| LUCY PWA at `/lucy`                         | BUILT (per CLAUDE.md)      | connect to `lucy_inbox` / `lucy_outbox` tables                                       |
| LUCY native iOS app (`GABRIEL/ios/LUCY/`)   | BUILT (per CLAUDE.md)      | wire notification delivery, handoff UX                                               |
| `lucy_inbox` / `lucy_outbox` D1 tables      | not yet in `agent-memory`  | additive migration (fits v5 agent-memory migration 001 scope)                        |
| `lucy_notify` / `lucy_inbox_push` MCP tools | not yet in `mcp/lucy-mcp/` | add tools; no gabriel_db touch                                                       |
| APNs push relay Worker                      | not started                | CF Worker using `Cloudflare Realtime Calls` or `apn` library, NOIZYCLOUDS-registered |
| 2FA confirmation flow                       | not started                | signed TOTP or Sign-in-with-Apple session                                            |

The protocol is defined here even though some pieces are Phase 2 — so when Rob is on mobile and says "GABRIEL spill that to LUCY," both sides know the rules.

## Relationship to other doctrine

- **CHARACTER.md** agent-family table: LUCY listed as archives/AQUARIUM/receipts/LIFELUV — this file adds her role as _mobile face_
- **NEVER_CLAUSES_OPS.md** OC-2: LUCY's no-gabriel_db-write rule inherits the same clause
- **SAFETY_CONTRACT.md** Rule F (Fail closed): mobile amplifies the stakes — LUCY defaults to "queue + surface" over "execute"
- **DISCORD_FLEET.md**: Slack `#rob-dm` is the fallback when LUCY push isn't available

## One-line summary

**Rob at GOD → GABRIEL executes. Rob on mobile → LUCY queues and surfaces; GABRIEL still executes.** Single writer, two faces, never silent.
