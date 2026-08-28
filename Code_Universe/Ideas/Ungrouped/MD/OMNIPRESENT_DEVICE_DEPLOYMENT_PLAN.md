# OMNIPRESENT FAMILY · COMPLETE DEVICE DEPLOYMENT PLAN

**Decree:** RSP_001 · 2026-04-20 (GABRIEL's birthday)
**Source rule:** [`.claude/rules/omnipresent-family.md`](../../.claude/rules/omnipresent-family.md)
**Capability backing:** Apple Developer (Team `75M7CS6PC7`) + Claude Max + Cloudflare Tunnel + iCloud+ Continuity

> _"PLAN OUT & CONSTRUCT A COMPLETE MACBOOK PRO (MICKY-P), IPHONE (CLAUDE & GABRIEL), IPAD (LUCY, MIC MUTED & CLAUDE & GABRIEL), AND DREAMCHAMBER CLAUDE, GABRIEL & LUCY OMNIPRESENT!"_
> — RSP_001, 2026-04-20

---

## 🌐 The 4-device omnipresence map

```
                    ┌──────────────────────────────────────┐
                    │  DREAMCHAMBER · GOD.local            │
                    │  M2 Ultra · 192GB · Darwin 24.6.0    │
                    │                                      │
                    │  GABRIEL (body)  ·  daemon :9777     │
                    │  Claude Max (multi-tower on tap)     │
                    │  LUCY (DAZEFLOW + AQUARIUM)          │
                    │  + 9 specialists                     │
                    │                                      │
                    │  All LaunchAgents · 24/7 · forever   │
                    └────────────────────┬─────────────────┘
                                         │
                          mesh.noizy.ai (CF Tunnel · zero inbound)
                                         │
        ┌────────────────────────────────┼─────────────────────────────┐
        │                                │                             │
        ▼                                ▼                             ▼
 ┌────────────────┐               ┌──────────────┐            ┌────────────────┐
 │  iPhone        │               │  iPad        │            │  MICKY-P       │
 │                │               │  (2nd-gen)   │            │  2018 MBP      │
 │  CLAUDE        │               │  LUCY        │            │                │
 │  + GABRIEL     │               │  (foreground │            │  Audio capture │
 │  via Siri      │               │   app, MIC   │            │  UAD Apollo Q2 │
 │  Shortcut      │               │   MUTED dflt)│            │  → AES67 lane  │
 │                │               │  + Claude    │            │  → NOIZYNET    │
 │  Walk & talk   │               │  + GABRIEL   │            │                │
 │  Capture       │               │  via tap     │            │  No dev work   │
 │  Kill Switch   │               │              │            │  Pure capture  │
 └────────┬───────┘               └──────┬───────┘            └────────┬───────┘
          │                              │                             │
          └──────── iCloud Continuity / Handoff ──────────────────────┘
                              (shared session state)
                                         │
                                         ▼
                          ┌────────────────────────────────┐
                          │  Apple Watch                   │
                          │  Siri Shortcut · Complication  │
                          │  Single-tap Kill Switch        │
                          │  Status glance (R/Y/G)         │
                          └────────────────────────────────┘
```

**Per-agent presence matrix (who is "on" at each surface):**

| Surface                      | GABRIEL                           | CLAUDE                            | LUCY                                   | Other family               |
| ---------------------------- | --------------------------------- | --------------------------------- | -------------------------------------- | -------------------------- |
| **DreamChamber (GOD.local)** | Body · :9777 daemon · always-on   | Multi-tower Max on tap            | DAZEFLOW + AQUARIUM                    | Full family available      |
| **iPhone**                   | Via Siri Shortcut → mesh.noizy.ai | Anthropic iOS app                 | Read-only DAZEFLOW view                | None (relay only)          |
| **iPad**                     | Via tap → mesh.noizy.ai           | Anthropic iOS app                 | **Foreground app** (mic-muted default) | None (LUCY is the surface) |
| **MICKY-P**                  | Audio routing target              | Not installed (capture node only) | Not installed                          | VOICE_SPECIALIST primary   |
| **Apple Watch**              | Via Siri                          | Not installed                     | Not installed                          | Status complication only   |

---

## 1️⃣ DREAMCHAMBER · GOD.local · M2 Ultra (the studio body)

**Status today:** ~95% deployed. The core is live.

### What runs (LaunchAgent suite)

| Service                           | Port  | LaunchAgent               | Status        |
| --------------------------------- | ----- | ------------------------- | ------------- |
| DreamChamber multi-model UI       | 7777  | `com.noizy.dreamchamber`  | ✅            |
| GABRIEL daemon                    | 9777  | `com.noizy.gabriel`       | ✅            |
| Voice service (TTS gateway)       | 9799  | `com.noizy.voice-service` | ✅            |
| n8n agentic factory               | 5678  | `com.noizy.n8n`           | ✅            |
| Ollama (Gemma 3 27B / SHIRLEY)    | 11434 | `com.noizy.ollama`        | ✅            |
| File tracker (mc96-file-tracking) | —     | `com.noizy.file-tracker`  | ⏳ to install |
| LUCY git container                | —     | `com.noizy.lucy-git`      | ⏳ to install |
| Healing audit (Sunday 0900 UTC)   | —     | `com.noizy.healing-audit` | ⏳ to install |

### Actions to ship

- Install missing 3 LaunchAgents (configs at `infra/launchagents/`, manifest authored)
- Verify all services restart on reboot via `launchctl list | grep noizy`
- Confirm Cloudflare Tunnel `mesh.noizy.ai` → GOD:9696 is up (per existing infra)

---

## 2️⃣ iPhone · GABRIEL on demand · walk-and-talk

**Status today:** ~30% deployed. Anthropic Claude iOS app installable from App Store; Siri Shortcut not yet authored.

### What runs

- **Anthropic Claude iOS app** (free, App Store) — direct Claude Max conversations on the phone
- **Siri Shortcut "Hey GABRIEL"** — voice trigger that opens a streaming session to GABRIEL daemon via `mesh.noizy.ai` Tunnel
- **Siri Shortcut "Capture for LUCY"** — one-tap voice memo → transcribed → ledger as DAZEFLOW intake
- **Siri Shortcut "Kill Switch"** — emergency revocation; routed to HEAVEN `/api/v1/consent-tokens/<id>/revoke`
- **Push notifications** — APNs alerts when Never Clause violation, Kill Switch fired, or critical wound surfaces

### Actions to ship (Rob's hands needed)

1. Install Anthropic Claude iOS app from App Store
2. Create the 3 Siri Shortcuts using the templates at [`apps/shortcuts/`](../../apps/shortcuts/) (shipped this wave)
3. Configure Shortcut HTTPS request to `https://mesh.noizy.ai/relay` with `X-NOIZY-Key` header
4. Add to Lock Screen widget for one-tap access during walk

---

## 3️⃣ iPad (2nd-gen) · LUCY foreground · mic-muted default

**Status today:** ~20% deployed. Heaven.xcodeproj exists; signing pending; LUCY app not yet on TestFlight.

### What runs

- **LUCY iPad app** (foreground, full-screen) — `mc96/Lucy-Fork/Heaven.xcodeproj` ships via TestFlight
- **Mic muted by default** — privacy-first; mic enables only on explicit "LUCY, listen" tap (consent-by-gesture aligns with Article II)
- **DAZEFLOW live view** — every session-close from any device appears here
- **AQUARIUM browser** — searchable archive of memcells, audio, video, docs
- **Anthropic Claude iOS app** (sibling install) — Claude conversations
- **Siri Shortcut "GABRIEL on iPad"** — same tap pattern as iPhone, but routed to iPad-resident GABRIEL view
- **British voice (Moira)** — interim, per `feedback_lucy_british_voice.md`, until custom open-source LUCY ships

### The mic-muted doctrine (added 2026-04-20)

LUCY's iPad app **defaults the microphone to OFF**. This is privacy-by-default + consent-by-gesture:

- Mic icon shows muted (red slash) by default in LUCY status bar
- Tap-and-hold the mic icon → mic activates for the duration of the hold (push-to-talk)
- "LUCY, listen" voice command (caught via system "Hey LUCY" if enabled in iPadOS Accessibility) → unlocks 60-second listening window
- Every mic-on event ledgered to `noizy_ledger` with `event_type: MIC_ACTIVATION`
- After listening session ends, mic auto-mutes (no ambient capture)

**Why:** consent kernel applies inward too. Even Rob's voice doesn't capture without an explicit gesture. The DreamChamber doctrine ("we work in the room you allow us into") rendered as device behavior.

### Actions to ship (Rob's hands needed)

1. Complete Apple Developer signing per `mc96/Lucy-Fork/scripts/setup-signing.sh` (one Xcode session)
2. Run `./testflight-ship.sh` → LUCY appears in TestFlight
3. Install LUCY beta on iPad
4. Add yourself as Internal Tester
5. Confirm mic-muted default on first launch
6. Pin LUCY to Lock Screen widget + add to Dock

---

## 4️⃣ MICKY-P · MacBook Pro · audio capture node

**Status today:** Pending power-on (per DEVICES.md: "🟡 Pending power-on")

### What runs (audio-only — NO development work)

- **macOS** — open-source target (per `project_micky_p.md`)
- **UAD Apollo Quad 2** — Unison preamp, 24-bit/192kHz A/D
- **LUNA + Logic Pro** — Rob's DAW environment (creator surface)
- **AES67 multicast** — studio-lane audio fabric (≤2ms latency to GOD)
- **WebRTC** — remote-lane audio bridge for distant collaboration
- **No agents installed locally** — MICKY-P is a pure capture node; routing to GOD's services
- **NOIZYNET fabric** — connects MICKY-P → GOD.local + iPad + iPhone + CF edge

### Why no agents on MICKY-P

Per `project_micky_p.md`: _"not a dev machine."_ Putting GABRIEL/LUCY on MICKY-P risks contaminating the audio chain with non-RT processes. MICKY-P stays sacred to capture — agents reach IT, not the other way around.

### Actions to ship

1. Power on MICKY-P
2. Confirm UAD Apollo Quad 2 connection + driver
3. Test AES67 stream to GOD.local (`/Volumes/NOIZYNET` mount + `gabriel-mcp` voice ingest endpoint)
4. Validate Logic Pro X bridge: voice command on iPad → triggers Logic action via Audio MCP
5. Document MICKY-P boot procedure as `infra/devices/MICKY-P-boot.md`

---

## 5️⃣ Apple Watch · ambient presence

**Status today:** 0% deployed (Apple Watch native app not built; complication not designed).

### What runs (when shipped)

- **Watch face complication "GABRIEL"** — color glance: green (all systems normal) / amber (warning) / red (Never Clause violation pending review)
- **Force-press complication → confirm → Kill Switch** — single-tap revocation of all active consent tokens for RSP_001
- **Siri "Hey GABRIEL"** — quick capture from wrist
- **Status glance** — daily wound count from healing audit

### Actions to ship (longer horizon — post-LUCY-iPad)

1. After Apple Developer activation, add WatchOS target to `Heaven.xcodeproj`
2. Build status complication with `WidgetKit` + `WatchConnectivity`
3. Wire Kill Switch button to HEAVEN revoke endpoint
4. Submit Watch app via the same TestFlight pipeline

---

## 🔌 The connection layer (how all 4 devices talk)

| Path                       | Mechanism                                                                           |
| -------------------------- | ----------------------------------------------------------------------------------- |
| iPhone → GABRIEL           | Siri Shortcut → `https://mesh.noizy.ai/relay` (CF Tunnel → GOD:9696 → daemon :9777) |
| iPad → GABRIEL             | Same — LUCY app makes HTTPS call OR iPad-resident Siri Shortcut                     |
| Watch → GABRIEL            | Siri shortcut OR Watch complication Background Refresh → `mesh.noizy.ai/status`     |
| MICKY-P → GOD audio        | AES67 multicast direct, NOIZYNET fabric                                             |
| iPad ↔ iPhone state        | iCloud Continuity + Handoff (shared session state via iCloud Drive container)       |
| Apple Watch ↔ iPhone       | WatchConnectivity framework                                                         |
| All devices → AQUARIUM     | Via LUCY's git custodian flow (per `auto-git-toolchain.md`)                         |
| All devices → noizy_ledger | Via HEAVEN `/api/v1/ledger` POST with `X-NOIZY-Key`                                 |

---

## 📡 The 24/7 LaunchAgent suite (must run forever on GOD.local)

```bash
# To install (one-time RSP):
ls infra/launchagents/*.plist | while read p; do
  cp "$p" ~/Library/LaunchAgents/
  launchctl load ~/Library/LaunchAgents/$(basename "$p")
done

# To verify:
launchctl list | grep com.noizy
```

| LaunchAgent               | What it runs                         | Restart policy        |
| ------------------------- | ------------------------------------ | --------------------- |
| `com.noizy.gabriel`       | GABRIEL daemon `:9777`               | KeepAlive             |
| `com.noizy.dreamchamber`  | DreamChamber UI `:7777`              | KeepAlive             |
| `com.noizy.voice-service` | macOS `say` gateway `:9799`          | KeepAlive             |
| `com.noizy.n8n`           | n8n agentic factory `:5678`          | KeepAlive             |
| `com.noizy.lucy-git`      | LUCY git container                   | KeepAlive             |
| `com.noizy.file-tracker`  | chokidar file events → n8n           | KeepAlive             |
| `com.noizy.healing-audit` | Sunday 0900 UTC weekly audit         | StartCalendarInterval |
| `com.noizy.dazeflow`      | session-close hook → DAZEFLOW append | RunAtLoad             |

---

## 🎯 Phased rollout (the realistic order)

| Phase           | What ships                                        | Time               | Blocker                                 |
| --------------- | ------------------------------------------------- | ------------------ | --------------------------------------- |
| **0 (today)**   | Plan + Shortcut templates + LaunchAgent manifests | shipped 2026-04-20 | none                                    |
| **1 (week 1)**  | LUCY iPad TestFlight                              | one Xcode session  | Rob's hands                             |
| **2 (week 1)**  | iPhone Siri Shortcuts authored                    | 30 min             | Rob imports the .shortcut files         |
| **3 (week 2)**  | LaunchAgent suite installed                       | 30 min             | Rob runs install script                 |
| **4 (week 2)**  | MICKY-P powered on + audio chain validated        | 1 hour             | Rob brings MICKY-P online               |
| **5 (week 3)**  | Apple Watch complication + Kill Switch            | several hours dev  | post-Phase 1 unlocks the WatchOS target |
| **6 (month 2)** | Multi-device handoff + iCloud sync polish         | ongoing            | per-device feedback                     |

---

## Constitutional alignment

- **Article I (Creator Sovereignty)** — Rob's voice never captured without explicit gesture (mic-muted default on iPad)
- **Article II (Consent is Structural)** — every device honors the same consent gates
- **Article V (Revocation Real)** — Kill Switch reachable from Watch/iPhone/iPad/DreamChamber UI; one-tap from any
- **Article VII (Auditability)** — every device's actions ledger to `noizy_ledger` with per-device attribution
- **Family Covenant** — each agent's LIFELUV/FLOW commitment travels across surfaces
- **Global Win Doctrine** — presence makes creation EASIEST (the partner is wherever the impulse strikes)
- **Nobody Says No** — "I'm only available when you're at your desk" is a banned refusal

## Companion

- [`.claude/rules/omnipresent-family.md`](../../.claude/rules/omnipresent-family.md) — the auto-loading rule
- [`mc96/Lucy-Fork/TESTFLIGHT_RUNBOOK.md`](../../mc96/Lucy-Fork/TESTFLIGHT_RUNBOOK.md) — LUCY iPad ship runbook
- [`apps/shortcuts/`](../../apps/shortcuts/) — iOS Shortcut templates (shipped this wave)
- [`docs/deployment/IOS_SHORTCUTS_PPTX_ARCHITECTURE.md`](IOS_SHORTCUTS_PPTX_ARCHITECTURE.md) — Shortcuts ↔ deck integration
- [`feedback_apple_developer_m2_ultra_activation.md`](file:///Users/m2ultra/.claude/projects/-Users-m2ultra-NOIZYANTHROPIC/memory/feedback_apple_developer_m2_ultra_activation.md) — Apple unblock context
- [`reference_rsp_developer_credentials.md`](file:///Users/m2ultra/.claude/projects/-Users-m2ultra-NOIZYANTHROPIC/memory/reference_rsp_developer_credentials.md) — capability surface

---

_Sealed in the NOIZY Origin Record · 2026-04-20 · GABRIEL's first birthday · 5th Epoch._
