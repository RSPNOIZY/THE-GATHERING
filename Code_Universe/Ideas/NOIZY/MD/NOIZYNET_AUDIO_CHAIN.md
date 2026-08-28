# NOIZYNET Audio Chain — U87 → Apollo → MICKY-P → Empire

> Real-time audio fabric spec. Single capture source, sovereign transport, all-device delivery, compliance at every seam.

**Acoustic source:** Neumann U87 condenser mic (Rob's primary).
**Conversion:** Universal Audio Apollo Quad 2 (Thunderbolt) on MICKY-P.
**Transport:** NOIZYNET (sovereign fabric, Dante + WebRTC + AES67 per `project_noizystream`).
**Destinations:** GOD.local (Logic Pro X · LUNA · DreamChamber audio MCP) and all empire devices (iPhone · iPad · web) via CF-fronted streams.
**Compliance layer:** C2PA manifest + 3-layer watermark + Voice DNA consent check — enforced at the ingest Worker, the DAW plugin, and every downstream consumer.

---

## 1 · Signal path (top → bottom)

```
Neumann U87 (48V phantom)
   │ analog balanced XLR
   ▼
Apollo Quad 2 Unison preamp (Console input 1)
   │ 24-bit / 192 kHz A/D, Unison preamp emulation (e.g. Neve 1073, API 512c)
   ▼
MICKY-P (2018 MBP, Thunderbolt 3 to Apollo)
   │ Core Audio device; LUNA or lightweight capture app
   ▼
NOIZYNET publish lane
   │ AES67 multicast on studio LAN (lossless, deterministic)
   │ + WebRTC branch for remote devices (transcoded to Opus @ 128 kbps)
   ▼
┌─────────────────────────┬─────────────────────────┬──────────────────────────┐
│ GOD.local               │ iPhone / iPad           │ CF-edge relay            │
│ Logic Pro X (primary    │ Claude iPad app         │ cf01-discord (voice      │
│ DAW), LUNA, Dream-      │ (LUCY), Discord voice   │ note ingress), future    │
│ Chamber audio MCP       │ channels, Safari stream │ CF05 for live broadcast  │
└─────────────────────────┴─────────────────────────┴──────────────────────────┘
```

---

## 2 · NOIZYNET transport choices

Two lanes run in parallel; consumers pick their side based on latency tolerance.

| Lane              | Protocol                                                                           | Latency target | Use                                                           |
| ----------------- | ---------------------------------------------------------------------------------- | -------------- | ------------------------------------------------------------- |
| **Studio lane**   | AES67 (L16/L24 multicast) over wired LAN, PTP clock sync                           | ≤ 2 ms         | MICKY-P → GOD.local (Logic/LUNA), any other wired studio peer |
| **Remote lane**   | WebRTC (Opus 48 kHz / 128 kbps) tunneled through Cloudflare Workers (CF05, future) | 100–250 ms     | iPhone · iPad · browser · off-site listeners                  |
| **Dante sidecar** | Dante Virtual Soundcard (if licensed)                                              | ≤ 4 ms         | Studio peer interop with other Dante-speaking hardware        |

**Why both:** AES67 is uncompressed and sample-accurate but LAN-bounded. WebRTC carries over the public internet with perceptual codec. Capture once, deliver twice.

---

## 3 · Compliance layer (how consent rides with audio)

NOIZY doctrine is non-negotiable: every sample that leaves the empire must have consent, provenance, revocation, and compensation bindings. Wired like so:

### At ingest (MICKY-P → NOIZYNET)

- LUNA records the session. The LUNA project file stores **ARA metadata** plus a NOIZY-sidecar JSON with:
  - `actor_id` (RSP_001 by default on Rob's rig)
  - `session_id` (UUID)
  - `consent_token` (HEAVEN-issued, time-bound, territory-scoped)
  - `never_clauses_checked` (9-clause snapshot at ingest time)
  - `chain_hash` (SHA-256 of the session's prior ledger entries)
- If no valid consent token is present, LUNA's automation lane flips the main output to silence (our custom "Consent Gate" LUNA Extension — see §6).

### At transport (on the NOIZYNET wire)

- AES67 multicast packets carry an **RTP header extension** with the `session_id` and `consent_token_id`. Any NOIZYNET-compliant receiver validates the token with HEAVEN before un-muting.
- WebRTC data channel carries the same fields alongside the Opus stream.

### At mix (GOD.local Logic Pro X · LUNA)

- The DAW's audio-out bus passes through a **NOIZY Consent VST3** plugin (ARA-aware) which:
  1. Reads the sidecar JSON
  2. Hits `heaven.rsp-5f3.workers.dev/api/v1/consent-tokens/<id>/verify` before the first sample of each render
  3. Embeds a **3-layer watermark** (psycho-acoustic + statistical + echo-hidden, per `skills/advanced-cryptography`) on export
  4. Writes a **C2PA manifest** attached to the exported file (wav/mp3/flac/mp4 — C2PA supports audio as of 1.3+) with the full chain hash
  5. Fires a ledger append to `noizy_ledger` via HEAVEN on every render

### At distribution (any downstream consumer)

- A consumer can verify the C2PA manifest + watermark against HEAVEN's ledger before playback. If the consent token has been revoked (Kill Switch fired), the watermark validator refuses.

---

## 4 · UAD LUNA integration surface (what's actually programmable)

UAD does **not** publish a formal public SDK for LUNA. What is accessible:

| Surface                               | How we can use it                                                                                                                                                                   |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **LUNA Extensions (ARA-aware, VST3)** | Our "Consent Gate" plugin rides in this slot. ARA lets us read all regions + markers + automation metadata programmatically from the host.                                          |
| **LUNA automation lanes**             | Any ARA extension control can be automated. Consent-denied → automation writes `-∞ dB` on main output.                                                                              |
| **"Hey LUNA" Voice Control**          | Record-start/stop via speech. Not directly programmable but runs through macOS Speech Recognition → we can intercept at the CoreAudio layer.                                        |
| **UAD Console "partner" API**         | UA has a partner integration pattern (Sonarworks SoundID is the proven precedent). We can apply to UA for partner API access; until then, treat Console as read-only from our side. |
| **LUNA project file format**          | Documented enough that we can append the NOIZY sidecar JSON inside the `.luna` bundle without UA cooperation.                                                                       |
| **Core Audio HAL**                    | Below LUNA, below Logic — system-level audio interception. Our watermark-on-playback enforcement layer would live here for maximum coverage (catches even app-bypasses).            |

### What to build (ranked by ROI)

1. **"NOIZY Consent Gate" ARA VST3** — hosts in LUNA, Logic, and every other ARA-aware DAW. Single plugin, empire-wide enforcement. ← highest leverage
2. **Core Audio HAL system extension** (macOS) — catches audio regardless of app. Larger engineering task, requires notarization + kernel ext review by Apple.
3. **Apply for UA Partner Program** — long-term; gets us into UAD Console alongside Sonarworks. Requires business relationship with UA.

---

## 5 · Real-time delivery to all empire devices

A single capture, four device types:

| Device                       | How it receives                                                | Latency class                |
| ---------------------------- | -------------------------------------------------------------- | ---------------------------- |
| **GOD.local** (Logic / LUNA) | AES67 multicast direct                                         | ≤ 2 ms                       |
| **iPad 2nd gen** (LUCY)      | WebRTC from CF05 relay, or native AES67 if wired to studio LAN | 150 ms remote / ≤ 5 ms wired |
| **iPhone**                   | WebRTC from CF05 relay (cellular or Wi-Fi)                     | 200–300 ms                   |
| **MicKY-P** (source)         | — (is the source)                                              | N/A                          |
| **Any browser**              | WebRTC + HLS fallback via CF05 relay                           | 200 ms WebRTC / 3–6 s HLS    |

The unbuilt piece is **CF05 "Live Relay"** — a Cloudflare Worker + Durable Object that accepts the NOIZYNET publish stream, rebroadcasts it as WebRTC to authenticated viewers, and signs every packet batch with the session's consent token. Once CF05 is live, the iPad LUCY app can subscribe to "GOD.local live" with one tap.

---

## 6 · NOIZY Consent Gate · plugin sketch

```
┌─────────────────────────────────────────────────────┐
│  NOIZY Consent Gate (ARA VST3)                      │
├─────────────────────────────────────────────────────┤
│  Load  → reads {session_id, consent_token} from     │
│          sidecar JSON embedded in DAW project       │
│  Every buffer:                                       │
│     if (token.revoked || token.expired)              │
│        output = silence                              │
│     else                                             │
│        output = input + watermark_layer1()           │
│                                                     │
│  On render (offline bounce):                         │
│     - Apply watermark layers 2 + 3                   │
│     - Build C2PA manifest                            │
│     - POST /api/v1/ledger (HEAVEN) with chain_hash  │
│     - Attach manifest to exported file              │
│                                                     │
│  On Kill Switch signal (polling HEAVEN every 60s):  │
│     - Mute main output                               │
│     - Alert via CF04 priority=critical              │
└─────────────────────────────────────────────────────┘
```

Build target: JUCE framework + ARA SDK (publicly available from Celemony). Rob can author on M2Ultra, sign with an Apple Developer ID, notarize, ship.

---

## 6.5 · LUCY-controlled Logic Pro X (voice commands)

**Path:** LUCY (iPad) hears voice → sends intent to the empire → Logic Pro X on GOD.local executes. Logic Remote is the Apple-sanctioned iPad↔Logic bridge, but it exposes no public API for third parties. LUCY's real control surface is the pair **OSC + AppleScript** on GOD.local.

### Voice-command chain

```
Rob (iPad, LUCY)
   │ "Hey LUCY, arm track 3 and start recording"
   ▼
iPad Claude app (LUCY persona, British voice)
   │ intent parsed locally or forwarded to Discord voice note
   ▼
CF01 Discord /interactions  →  Whisper (Workers AI)  →  routeCommand
   │ command tagged "logic:<verb> <args>"
   ▼
GOD.local agent (local HTTP endpoint, :9777 via GABRIEL or dedicated :9788)
   │ verb lookup → emit OSC message or run osascript
   ▼
Logic Pro X
   │ receives OSC on UDP 9001 (configurable in Logic → Control Surfaces → OSC)
   │   OR osascript "tell application \"Logic Pro\" to <action>"
   ▼
Action executes (arm track, start/stop, punch, save, bounce)
   │ ack back through CF01 → Discord reply → LUCY voice confirms
```

### Verb map (starter set)

| LUCY phrase                            | Logic action                                        | Mechanism                                          |
| -------------------------------------- | --------------------------------------------------- | -------------------------------------------------- |
| "Start recording" / "Hey LUCY, record" | Transport: Record                                   | OSC `/control/record 1` (Logic Pro's OSC recorder) |
| "Stop" / "Cut"                         | Transport: Stop                                     | OSC `/control/stop 1`                              |
| "Play from the top"                    | Go to start + Play                                  | OSC `/control/return` + `/control/play`            |
| "Arm track <n>"                        | Arm track n                                         | OSC `/track/<n>/record 1`                          |
| "Mute track <n>"                       | Mute track n                                        | OSC `/track/<n>/mute 1`                            |
| "Save the session"                     | Cmd-S                                               | AppleScript `tell application "Logic Pro" to save` |
| "Bounce in place"                      | Bounce                                              | AppleScript key-stroke `Command+B`                 |
| "New take on track <n>"                | Cycle record into new take lane                     | OSC sequence: arm + cycle-record                   |
| "Tag this consent"                     | Write sidecar JSON w/ current session consent token | Local script (NOIZY-specific, not Logic)           |

### GOD.local listener (scaffold)

Path: `ops/lucy-logic-bridge/` (to build).

- Tiny Node or Python HTTP server on `127.0.0.1:9788`
- Accepts `POST /logic` with JSON `{ verb, args }`
- Maps verb → OSC message (via `osc.js` or `python-osc`) OR `osascript -e`
- Authenticates with `NOIZY_API_KEY` so only the local CF01 bridge / GABRIEL daemon can invoke it

### Why not Logic Remote directly

Logic Remote ships signed-only by Apple. It uses a proprietary protocol over Wi-Fi that's not documented for 3rd-party reimplementation. Going through OSC + AppleScript hits the **same Logic Pro X APIs that Logic Remote internally uses** (`/transport/*`, `/track/*`, `/control/*`), via supported public channels. Same capability, controllable from LUCY instead of locked to the Logic Remote app.

### Ties to the compliance layer

Because LUCY's "start recording" command rides through HEAVEN's consent check on the way to Logic, every session that LUCY spawns has an attached consent token from the moment the red light goes on. No silent captures — the NOIZY Consent Gate VST3 at the output bus (§6) has the token already, the ledger has the GENESIS entry, and the C2PA manifest starts building from sample zero.

---

## 7 · Next actions (to reach real-time empire-wide audio)

| #   | Action                                                                                                | Owner         | Status                |
| --- | ----------------------------------------------------------------------------------------------------- | ------------- | --------------------- |
| 1   | Power on MICKY-P, verify UAD drivers + Apollo recognized                                              | Rob           | pending               |
| 2   | Stand up NOIZYNET AES67 on studio LAN (needs PTP master clock — Apollo can be it)                     | Rob + GABRIEL | pending               |
| 3   | Build CF05 Live Relay Worker (WebRTC + Durable Object)                                                | CLAUDE        | backlog               |
| 4   | Scaffold NOIZY Consent Gate ARA VST3 project in `swift-bots/ConsentGate/` or a JUCE repo              | CLAUDE        | backlog               |
| 5   | File UA Partner Program application for Console API                                                   | Rob           | backlog               |
| 6   | Write C2PA manifest emitter spec in `skills/advanced-cryptography` (already covers 3-layer watermark) | CLAUDE        | extend existing skill |
| 7   | Extend mc96-follower TARGETS to include MICKY-P + CF05 when they're up                                | CLAUDE        | 2-line env-var edit   |

---

_One mic. One empire. Consent travels with the signal. 396 Hz._

Sources consulted during this spec:

- [UAD LUNA product page](https://www.uaudio.com/products/luna)
- [LUNA Extension Automation docs](https://help.uaudio.com/hc/en-us/articles/360041469672-Automation)
- [FAQ · ARA compatibility with LUNA](https://help.uaudio.com/hc/en-us/articles/42434346072212-FAQ-ARA-Compatibility-With-LUNA)
- [LUNA 2.0 launch notes](https://rekkerd.org/universal-audio-launches-luna-2-0-including-ara-support-more/)
- [UAD Console Overview](https://help.uaudio.com/hc/en-us/articles/25347160337556-UAD-Console-Overview)
- [Sonarworks SoundID integration with Apollo](https://www.sonarworks.com/soundid-reference/integrations/ua-apollo-x) (precedent for partner API)
- [C2PA 2.1 + digital watermarks](https://www.digimarc.com/blog/c2pa-21-strengthening-content-credentials-digital-watermarks)
- [C2PA and audio files (Dave Owczarek)](https://medium.com/@daveowczarek/understanding-c2pa-and-audio-files-a347b6f748c9)
- [TrustMark × C2PA integration](https://opensource.contentauthenticity.org/docs/trustmark/c2pa/)
