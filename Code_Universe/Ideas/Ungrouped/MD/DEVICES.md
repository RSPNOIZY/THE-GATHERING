# DEVICES — MC96ECOUNIVERSE + DreamChamber Unified Roster

**Reference device registry for the NOIZY Empire** (human-readable doc, not machine-enforced).
Authority: RSP_001 · Maintained by: RSP_001 · Last updated: 2026-04-20

> One mic. One empire. One roster — on paper.

This file is a reference document intended to keep humans and AI agents consistent on device names, ports, and IDs. It is **not** currently wired to any service — no agent, MCP server, or daemon reads this file programmatically at runtime. Calling it "canonical" would require extracting the data into a machine-readable file (e.g. `devices.json`) and having each service read it at boot. Today it is documentation only.

---

## 1 · Physical Devices

| ID           | Name        | Hardware                             | Role                                              | Status                 | OS / Stack                         |
| ------------ | ----------- | ------------------------------------ | ------------------------------------------------- | ---------------------- | ---------------------------------- |
| `GOD.local`  | GOD         | M2 Ultra Mac Studio · 192 GB unified | Primary processing core. Runs all local services. | 🟢 Active              | macOS 24.6.0 (Darwin)              |
| `MICKY-P`    | Micky-P     | 2018 MacBook Pro · UAD Apollo Quad 2 | Audio capture node. NOIZYNET source.              | 🟡 Pending power-on    | macOS · Open-source target         |
| `LUCY-iPad`  | LUCY iPad   | iPad 2nd gen                         | LUCY companion. Voice (Siri Kate XT Premium).     | 🟡 Voice setup pending | iPadOS · Claude app + LUCY persona |
| `RSP-iPhone` | iPhone      | iPhone (Rob's primary)               | Voice ingest, Discord, mobile control.            | 🟢 Active              | iOS                                |
| `RSP-Watch`  | Apple Watch | Apple Watch (Rob's primary)          | Quick capture, Siri triggers.                     | 🟢 Active              | watchOS                            |

### Audio hardware chain (lives on MICKY-P)

```
Neumann U87 (48V phantom)
   │ analog balanced XLR
   ▼
UAD Apollo Quad 2 — Unison preamp · 24-bit / 192 kHz A/D
   │ Thunderbolt 3
   ▼
MICKY-P (Core Audio + LUNA)
   │ AES67 multicast (studio lane, ≤2ms)  +  WebRTC (remote lane, 100-250ms)
   ▼
NOIZYNET fabric → GOD.local · iPad · iPhone · CF-edge relay
```

Full spec: [NOIZYNET_AUDIO_CHAIN.md](./NOIZYNET_AUDIO_CHAIN.md).

---

## 2 · GOD.local — Local Services (port map, RECONCILED)

The previous registry had a **port 7778 collision** (NOIZYSTREAM vs Accessibility Bridge). Resolved here.

| Port    | Service              | Purpose                                                                                                                  | Source of truth                  |
| ------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------- |
| `7777`  | DreamChamber         | Multi-model AI command center · WebSocket UI                                                                             | CLAUDE.md                        |
| `7778`  | NOIZYSTREAM v2       | Sovereign audio fabric (AES67/WebRTC bridge)                                                                             | NOIZYNET spec ← **WINS**         |
| `7779`  | Accessibility Bridge | (re-assigned — was 7778, now moved)                                                                                      | this file (resolution)           |
| `8000`  | STT (Whisper)        | mlx_whisper local transcription                                                                                          | CLAUDE.md                        |
| `8080`  | Voice Bridge         | Voice MCP HTTP endpoint                                                                                                  | CLAUDE.md                        |
| `9696`  | MESH endpoint        | CF Access tunnel destination on GOD                                                                                      | MASTER_REGISTRY.md               |
| `9777`  | GABRIEL daemon       | Orchestration · voice pipeline · WebSocket                                                                               | CLAUDE.md                        |
| `9788`  | LUCY-Logic Bridge    | Voice → OSC/AppleScript → Logic Pro X (planned)                                                                          | NOIZYNET_AUDIO_CHAIN.md          |
| `11434` | Ollama               | Local LLM runtime (Gemma 3 27B / Shirley)                                                                                | CLAUDE.md                        |
| `17017` | Heaven17             | Local Heaven mirror                                                                                                      | the-gathering                    |
| `5678`  | n8n                  | Agentic Factory · 24 MCP tools                                                                                           | CLAUDE.md                        |
| `9799`  | NOIZY Voice Service  | macOS `say` gateway for daemon agents · LaunchAgent `com.noizy.voice-service` · auto-restart on crash · 8-persona roster | this file + `ops/voice-service/` |

### Process supervisors

- **LaunchAgents:** GABRIEL daemon, n8n, NOIZYARMY soldiers, mc96-follower poll loop
- **tmux sessions:** dispatch + worktrees (`gabriel-dispatch.sh`, `gabriel-merge.sh`)

---

## 3 · NOIZYCLOUDS — Cloudflare Edge Fleet

**Account:** NOIZYFISH · `5f36aa9795348ea681d0b21910dfc82a`
**Charter:** [NOIZYCLOUDS.md](./NOIZYCLOUDS.md)

### Workers in `cloudflare/workers/`

| Worker                  | Subdomain                           | Purpose                                    | Status                  |
| ----------------------- | ----------------------------------- | ------------------------------------------ | ----------------------- |
| `gabriel`               | `heaven.rsp-5f3.workers.dev`        | Heaven v18.0.0 — Consent Kernel API        | 🟢 LIVE                 |
| `noizy-mcp`             | `mcp.noizy.ai` (planned)            | Remote MCP gateway                         | 🟡 Pending              |
| `mc96-follower`         | `mc96-follower.rsp-5f3.workers.dev` | Universe poller / sync follower            | 🟢 LIVE                 |
| `cf01-discord`          | `cf01-discord.rsp-5f3.workers.dev`  | Discord interactions + voice ingress       | 🟢 LIVE (needs secrets) |
| `cf02-notion`           | (workers.dev)                       | Notion sync                                | 🟡 Built                |
| `cf03-linear`           | (workers.dev)                       | Linear sync                                | 🟡 Built                |
| `cf04-slack`            | (workers.dev)                       | Slack notifications + Kill Switch alerts   | 🟡 Built                |
| `cf05-stream`           | (workers.dev)                       | Live audio relay (WebRTC + Durable Object) | 🔨 Backlog              |
| `cf06-ai-gateway`       | (workers.dev)                       | Cloudflare Workers AI gateway              | 🟡 Built                |
| `cf07-vectorize-rag`    | (workers.dev)                       | Vector store + RAG                         | 🟡 Built                |
| `cf08-github`           | (workers.dev)                       | GitHub event sync                          | 🟡 Built                |
| `cf09-google-workspace` | (workers.dev)                       | Google Workspace bridge                    | 🟡 Built                |
| `cf10-sso-guard`        | (workers.dev)                       | SSO enforcement layer                      | 🟡 Built                |
| `_template`             | —                                   | Worker scaffold                            | 📋 Reference            |

### KV namespaces

| Binding         | ID                                 | Use                              |
| --------------- | ---------------------------------- | -------------------------------- |
| `GABRIEL_KV`    | `f205b56a9914413da0ec454a9dc4c2bd` | Cache, sessions, ephemeral state |
| `GABRIEL_VOICE` | `16532a32b2e8455486cc966403f3442e` | Voice DNA fingerprints           |

### D1

| Binding      | DB Name      | ID                                     | Tables |
| ------------ | ------------ | -------------------------------------- | ------ |
| `gabriel_db` | `gabriel_db` | `a31d68e2-f2d4-4203-a803-8039fdff31cb` | 19     |

---

## 4 · MCP Servers (local stdio)

19 MCP servers in `mcp/`. Loaded via `.mcp.json`.

| Server                                                       | Purpose                                 | Tools |
| ------------------------------------------------------------ | --------------------------------------- | ----- |
| `gabriel-mcp`                                                | GABRIEL orchestration                   | ~12   |
| `lucy-mcp`                                                   | DAZEFLOW · intake · memcells            | 17    |
| `heaven-mcp`                                                 | Heaven API client                       | —     |
| `engr-keith-mcp`                                             | Engineering review · schema check       | 6     |
| `dream-mcp`                                                  | Vision · roadmap · pitch                | 5     |
| `cb01-mcp`                                                   | DNS · GoDaddy exit · domain ops         | 6     |
| `shirley-mcp`                                                | Code stats · file inventory · TODO scan | 6     |
| `family-mcp`                                                 | POPS + SHIRL wellbeing                  | ~5    |
| `shortcuts-mcp`                                              | macOS Shortcuts bridge                  | —     |
| `consent-oracle`                                             | Consent token verification              | —     |
| `synthesis-oracle`                                           | Pre-synthesis covenant check            | —     |
| `audio`                                                      | Audio MCP (LUNA / Logic / Apollo)       | 13    |
| `dreamchamber-audio`                                         | DreamChamber audio surface              | —     |
| `gemma3`                                                     | Local Gemma 3 wrapper                   | —     |
| `metabeast-remote`                                           | NOIZYBEAST VS Code extension bridge     | —     |
| `supersonic`                                                 | (audio fast-path)                       | —     |
| `voice-bridge`                                               | Voice pipeline glue                     | —     |
| (+ misc infra: `sync-all-ides.sh`, `supersonic-prompt.html`) |                                         |       |

---

## 5 · Agent Voices (DreamChamber TTS roster)

Each agent has a defined voice persona. Honest status column: **WRITTEN** = code/config exists on disk; **RUNNING** = voice actually produced by a service that's running right now; **DEPLOYED** = operating on the target device.

| Agent          | Voice persona                   | Engine                                                   | Status                                                                                                                                                                                |
| -------------- | ------------------------------- | -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Agent          | Persona                         | Voice on GOD (via voice-service :9799, `say`)            | Voice on iPad (via AVSpeechSynthesizer)                                                                                                                                               | Honest status                                                                                                                                                                                                                |
| ---            | ---                             | ---                                                      | ---                                                                                                                                                                                   | ---                                                                                                                                                                                                                          |
| **GABRIEL**    | Warrior executor, British male  | `Jamie (Premium)` en-GB                                  | `com.apple.voice.premium.en-GB.Jamie` (primary, unverified on specific iPadOS)                                                                                                        | GOD: **RUNNING** via voice-service. GABRIEL CLI wire: **WRITTEN** (`GABRIEL/src/voice.ts` + injections in `index.ts`) — compile verified after `npm install`; end-to-end `node dist/index.js --status` not yet smoke-tested. |
| **LUCY**       | DAZEFLOW keeper, British female | `Kate (Enhanced)` en-GB (Premium not installed on GOD)   | `com.apple.voice.premium.en-GB.Kate` (primary, unverified on specific iPadOS) · rate 0.48 · pitch 1.05 · code: `mc96/Lucy-Fork/Heaven/Services/{VoiceEngine,Audio/AudioEngine}.swift` | GOD: **RUNNING** (voice-service speaks Kate Enhanced). iPad: **WRITTEN, NOT COMPILED, NOT DEPLOYED** — Swift files patched; requires Xcode rebuild on `mc96/Lucy-Fork/Heaven.xcodeproj`.                                     |
| **POPS**       | Grounded paternal               | `Albert` en-US (Tom not installed on GOD — substitute)   | same — if Tom downloaded, Swift primary `Tom` will resolve                                                                                                                            | GOD: **RUNNING** (voice-service). Swift enum still declares Tom as primary; needs either Tom download or enum update to Albert.                                                                                              |
| **SHIRL**      | Warm aunt, wellbeing            | `Samantha (Enhanced)` en-US                              | same                                                                                                                                                                                  | GOD: **RUNNING** (voice-service). No iPad-side binding this session.                                                                                                                                                         |
| **SHIRLEY**    | Code/file manager               | `Karen` en-AU                                            | same                                                                                                                                                                                  | GOD: **RUNNING** (voice-service). No iPad-side binding this session.                                                                                                                                                         |
| **DREAM**      | 5th Epoch visionary             | `Moira (Enhanced)` en-IE                                 | same                                                                                                                                                                                  | GOD: **RUNNING** (voice-service). No iPad-side binding this session.                                                                                                                                                         |
| **ENGR_KEITH** | Engineering precision           | `Oliver (Enhanced)` en-GB                                | same                                                                                                                                                                                  | GOD: **RUNNING** (voice-service). No iPad-side binding this session.                                                                                                                                                         |
| **CB01**       | Ops runner                      | `Daniel` en-GB (Aaron not installed on GOD — substitute) | same — if Aaron downloaded, Swift primary `Aaron` will resolve                                                                                                                        | GOD: **RUNNING** (voice-service). Swift enum still declares Aaron as primary; needs either Aaron download or enum update to Daniel.                                                                                          |

---

## 6 · Inter-device routing law

| Source            | Destination     | Path                                                           |
| ----------------- | --------------- | -------------------------------------------------------------- |
| MICKY-P (audio)   | GOD.local (DAW) | AES67 multicast over studio LAN (NOIZYSTREAM :7778)            |
| MICKY-P (audio)   | iPad / iPhone   | WebRTC via CF05 (when live) or local Wi-Fi WebRTC              |
| iPad LUCY         | GOD.local       | CF01 Discord → Whisper → GABRIEL daemon :9777                  |
| iPad LUCY         | Logic Pro X     | CF01 → GOD.local → LUCY-Logic Bridge :9788 → OSC               |
| GOD.local         | Heaven          | HTTPS to `heaven.rsp-5f3.workers.dev`                          |
| Any device        | Discord         | CF01 webhook                                                   |
| Any device        | Slack alerts    | CF04 webhook                                                   |
| Kill Switch fired | All devices     | Heaven → CF04 (Slack) + CF09 (Email) + CF01 (Discord priority) |

---

## 7 · Open device gaps (April 20, 2026)

| #   | Gap                                                  | Compartment / blocker                                                                                                                                                                                                                                                                                                        |
| --- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | GABRIEL voice persona not defined / not wired        | Compartment 2 (this sprint)                                                                                                                                                                                                                                                                                                  |
| 2   | LUCY iPad app not yet bound to Kate Premium          | Swift code written 2026-04-20 (`VoiceEngine.swift` + `AudioEngine.swift`). **NOT COMPILED, NOT DEPLOYED** — requires Xcode rebuild of `mc96/Lucy-Fork/Heaven.xcodeproj` on iPad. Kate Premium identifier (`com.apple.voice.premium.en-GB.Kate`) still unverified against a specific iPadOS version; fallback chain in place. |
| 3   | MICKY-P not powered on; UAD drivers unverified       | NOIZYSTREAM Step 1                                                                                                                                                                                                                                                                                                           |
| 4   | CF05 Live Relay not built                            | Backlog (unblocks empire-wide live audio)                                                                                                                                                                                                                                                                                    |
| 5   | NOIZY Consent Gate VST3 not scaffolded               | Backlog (audio compliance enforcement)                                                                                                                                                                                                                                                                                       |
| 6   | Port 7779 (Accessibility Bridge) needs config update | Update bridge service config to bind :7779                                                                                                                                                                                                                                                                                   |

---

## 8 · How to update this file

1. Edit this file directly. Commit with a real message (not `auto: scheduled sync`).
2. If a port, ID, or domain changes — update here **first**, then propagate to MASTER_REGISTRY.md, CLAUDE.md, and the affected service.
3. Agents (GABRIEL, ENGR_KEITH, LUCY) read this file as authoritative. Do not maintain parallel device tables in agent definitions.

---

_Cross-references: [MC96ECO_EMPIRE_MAP.md](./MC96ECO_EMPIRE_MAP.md) · [MASTER_REGISTRY.md](./MASTER_REGISTRY.md) · [NOIZYNET_AUDIO_CHAIN.md](./NOIZYNET_AUDIO_CHAIN.md) · [NOIZYCLOUDS.md](./NOIZYCLOUDS.md) · [CLAUDE.md](./CLAUDE.md)_
