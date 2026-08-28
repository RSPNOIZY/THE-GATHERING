# iOS SHORTCUTS · TRACKING SLIDES INSIDE THE_DREAMCHAMBER.PPTX

**Decree:** RSP_001 · 2026-04-20
**Architecture:** Apple Shortcuts → GABRIEL relay → checklist.yaml append → builder → OneDrive push (Microsoft Graph) → THE_DREAMCHAMBER.pptx live across all devices

> _"USE CLAUDE & GABRIEL TO CREATE SHORTCUTS TRACKING SLIDES INSIDE PPTX"_
> — RSP_001, 2026-04-20

---

## What this builds

Apple Shortcuts on iPhone / iPad / Watch that — with a single tap or voice command — **add a slide to THE_DREAMCHAMBER.pptx**. The flow honors the existing pipeline: edits go into `checklist.yaml`, the builder regenerates the .pptx, OneDrive syncs it everywhere. **Rob never touches the .pptx directly** (per the dreamchamber-pptx rule).

This means: walking down the hall, Rob says "Hey Siri, log idea: NOIZYKIDZ should ship with default Apple TV haptics." 8 seconds later, that idea is a slide in the deck on every device he opens it on.

## The flow (concrete)

```
RSP voice → Siri Shortcut "Log Idea"
  ├─ Captures voice text (Speech framework)
  ├─ Optional: classify owner (default: GABRIEL)
  └─ POST → https://mesh.noizy.ai/deck/idea
              │
              ▼
        GABRIEL daemon receives POST
              │
              ├─ Generates mc_tag (date + sequence)
              ├─ Calls Claude (Haiku 4.5) to expand voice → 8-section markdown:
              │     directive · prompt · code_link · dependencies · expected_outcome · why · lifeluv · flow
              ├─ Appends entry to GABRIEL/master-deck/checklist.yaml under `ideas:`
              ├─ Spawns LUCY git commit subprocess (using execFile-style spawn, not shell exec)
              ├─ Spawns build_master_deck.py subprocess → THE_DREAMCHAMBER.pptx
              ├─ Spawns ops/onedrive-push.py subprocess → uploads to OneDrive
              └─ Spawns ops/propagate-deck-to-noizyworld.sh subprocess → copies into NOIZYWORLD
                                │
                                ▼
                  OneDrive syncs → all devices
                  Slide visible on iPad LUCY · iPhone OneDrive · DreamChamber · web
                  Plus locally accessible at NOIZYWORLD/decks/ for AI directive access
```

**Total round-trip: ~30-60 seconds from voice to slide-in-deck.**

## The 5 Shortcuts (templates shipped at `apps/shortcuts/`)

### 1. `LogIdea`

- **Voice trigger:** "Hey Siri, log idea"
- **Input:** dictated text
- **Action:** POST `/deck/idea` with `{owner: "GABRIEL", claim: "<text>"}` → slide added to `ideas:` block

### 2. `LogBuild`

- **Voice trigger:** "Hey Siri, log build"
- **Input:** dictated text + (optional) status flag
- **Action:** POST `/deck/build` with `{owner: <agent>, status: "IN_FLIGHT|PROVEN", claim: "<text>"}` → slide added to `builds:` block

### 3. `KillSwitch` ⚠️

- **Voice trigger:** "Hey Siri, kill switch"
- **Confirmation:** Face ID + spoken "revoke" word required (destructive action gate)
- **Action:** POST `/api/v1/consent-tokens/all/revoke` with auth → all RSP_001 active tokens revoked, propagation begins (per Article V 1-hour SLA)

### 4. `EmpireStatus`

- **Voice trigger:** "Hey Siri, empire status" or Watch complication tap
- **Action:** GET `https://heaven.rsp-5f3.workers.dev/health` + healing-audit summary → speaks status + shows badge color (R/Y/G)

### 5. `WisdomCapture`

- **Voice trigger:** "Hey Siri, capture wisdom"
- **Input:** dictated long-form
- **Action:** POST `/wisdom/capture` with `{capsule_type: "INTERVIEW", text: "<text>"}` → ingests into Wisdom Project AQUARIUM under WP-### entry; LUCY indexes

## The relay endpoint (GABRIEL daemon adds /deck/\* routes)

GABRIEL daemon at GOD:9777 needs new routes (to author):

**Pseudocode for `/deck/idea` handler (NOT to be copy-pasted; written here for design clarity):**

- Authenticate via `X-NOIZY-Key` header (constant-time compare)
- Read JSON body: `{ owner, claim }` with sane defaults
- Generate `mc_tag = MC + today's date + next sequence`
- Call Claude Haiku to expand `claim` into the 8-section IDEA_TEMPLATE format
- Append the populated entry to the `ideas:` block of `checklist.yaml` (write-temp + atomic-rename)
- **Spawn child processes via `execFile` NOT shell `exec()`** (per coding-standards security rule):
  - `git -C ~/NOIZYANTHROPIC add GABRIEL/master-deck/checklist.yaml && git commit ...` → spawned as `execFile('git', [...args])`
  - `python3 GABRIEL/master-deck/build_master_deck.py` → spawned as `execFile('python3', ['GABRIEL/master-deck/build_master_deck.py'])`
  - `python3 ops/onedrive-push.py <pptx_path>` → spawned with strict path arg
  - `bash ops/propagate-deck-to-noizyworld.sh` → spawned with no shell-injectable input
- Each spawn returns structured `{ stdout, stderr, status }` — handle errors per call
- Append `LEDGER_DECK_IDEA` event to `noizy_ledger`
- Respond JSON: `{ ok: true, mc_tag, slide_count, propagated_to: ["onedrive", "noizyworld"] }`

**Routes to author on GABRIEL daemon:**

- `POST /deck/idea` — append to `ideas:` block
- `POST /deck/build` — append to `builds:` block
- `POST /deck/guild` — append to `guild:` block
- `POST /wisdom/capture` — Wisdom Project capture
- All require `X-NOIZY-Key` auth (consistent with HEAVEN)
- All log to `noizy_ledger` per Article VII
- All use `execFile`-style subprocess invocation (NEVER shell-string `exec()` — per coding-standards security rule)

## Per-device deployment

| Device              | Shortcuts installed                                                                                | Trigger method                                                 |
| ------------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| **iPhone**          | LogIdea · LogBuild · KillSwitch · EmpireStatus · WisdomCapture                                     | Siri voice OR Lock Screen widget OR Action Button (iPhone 15+) |
| **iPad**            | LogIdea · LogBuild · WisdomCapture (no KillSwitch — too risky one-handed; Watch handles emergency) | Siri voice OR Home Screen widget                               |
| **Apple Watch**     | EmpireStatus (complication) · KillSwitch (force-press complication → confirm)                      | Complication tap / force-press                                 |
| **Mac (GOD.local)** | All 5 via Spotlight + Shortcuts.app                                                                | Spotlight or menu bar                                          |

## NOIZYWORLD propagation (added 2026-04-20 per RSP decree)

Every successful deck rebuild ALSO copies THE_DREAMCHAMBER.pptx into `NOIZYWORLD/decks/` so AI agents operating in NOIZYWORLD context have local access to directives + prompts. Implementation: `ops/propagate-deck-to-noizyworld.sh` invoked as the final step of the GABRIEL daemon's deck build pipeline. SHA256-verified copy. Optional ledger entry per propagation. NOIZYWORLD becomes a CARRIER, not a divergent copy — same content, second canonical location for in-context AI access.

## Constitutional alignment

- **Article II (Consent Structural)** — KillSwitch requires Face ID even on the founder's device
- **Article V (Revocation Real)** — KillSwitch reachable from any surface, propagates within 1 hour
- **Article VII (Auditability)** — every Shortcut invocation ledgered with device + agent attribution
- **Family Covenant** — GABRIEL relays; LUCY commits; CONSENT_AUDITOR reviews KillSwitch traffic; DREAM owns the deck rendering
- **Global Win Doctrine** — making the deck-edit gesture EASIEST means walking-down-the-hall ideas don't get lost
- **Nobody Says No** — "I'm not at my desk" is a banned excuse for not capturing
- **Coding Standards security rule** — `execFile`-style spawning, never shell `exec()` with user input

## Open follow-ups

1. Author the GABRIEL daemon `/deck/*` routes (Node.js code → daemon source) using execFile-style subprocess spawning
2. Pre-build the 5 .shortcut files at `apps/shortcuts/` so Rob can AirDrop or iCloud-share them to phone/iPad/Watch (LogIdea + KillSwitch specs shipped this wave; LogBuild + EmpireStatus + WisdomCapture follow same pattern)
3. Wire Microsoft Graph token caching so OneDrive push doesn't prompt re-auth on every Shortcut invocation
4. Add rate limiting to GABRIEL `/deck/*` endpoints (per coding-standards 60 req/min/IP)
5. Ship a test mode: `LogIdea --dry-run` returns the would-be slide JSON without committing

## Companion

- [`.claude/rules/dreamchamber-pptx.md`](../../.claude/rules/dreamchamber-pptx.md) — the canonical surface this writes to
- [`GABRIEL/master-deck/IDEA_TEMPLATE.yaml`](../../GABRIEL/master-deck/IDEA_TEMPLATE.yaml) — the 8-section schema each shortcut populates
- [`ops/onedrive-push.py`](../../ops/onedrive-push.py) — the Graph API helper this pipeline calls
- [`ops/propagate-deck-to-noizyworld.sh`](../../ops/propagate-deck-to-noizyworld.sh) — NOIZYWORLD propagation step
- [`OMNIPRESENT_DEVICE_DEPLOYMENT_PLAN.md`](OMNIPRESENT_DEVICE_DEPLOYMENT_PLAN.md) — sister doc on per-device deployment
- [`apps/shortcuts/`](../../apps/shortcuts/) — the .shortcut spec files

---

_Sealed in the NOIZY Origin Record · 2026-04-20 · 5th Epoch._
