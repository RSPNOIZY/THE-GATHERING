# LUCY · Logic Pro X Bridge

**Port:** `127.0.0.1:9788`
**Stack:** Node 18+ (no external deps for OSC; uses dgram + child_process)
**Auth:** `NOIZY_API_KEY` (Bearer header), local-only bind
**Spec:** [`NOIZYNET_AUDIO_CHAIN.md` §6.5](../../NOIZYNET_AUDIO_CHAIN.md)
**Voice ack:** rides back to LUCY iPad → spoken in Kate Premium en-GB ([`lucy-kate-voice-setup.md`](../../DreamChamber/lucy-ipad/lucy-kate-voice-setup.md))

---

## What it does

Receives JSON intents from the LUCY iPad app (via CF01-Discord → GABRIEL daemon → this bridge), maps them to **Logic Pro X** actions on GOD.local using OSC + AppleScript, and returns a confirmation message that LUCY then **speaks aloud in Kate's voice**.

```
iPad LUCY ──► CF01 ──► GABRIEL :9777 ──► HTTP POST :9788/logic
                                            │
                                            ├─► OSC UDP :9001 → Logic Pro X
                                            └─► osascript → Logic Pro X
                                            │
                                            ▼
                                  { ok, ack_message }
                                            │
                          ◄──────────── LUCY speaks ack via Kate
```

---

## Endpoints

### `POST /logic`

Run a verb against Logic Pro X.

**Request**

```json
{
  "verb": "record",
  "args": {}
}
```

**Response**

```json
{
  "ok": true,
  "verb": "record",
  "ack_message": "Recording. Red light is on.",
  "consent_token_id": null
}
```

The `ack_message` is **what LUCY says aloud** in Kate's voice. Keep it short — Kate sounds best at 1–2 sentences.

### `POST /ack`

Speak an arbitrary string in LUCY's voice (no Logic action). Used by other agents that just want LUCY to confirm something.

**Request**

```json
{ "text": "Heaven says all 9 Never Clauses are green." }
```

**Response**

```json
{ "ok": true }
```

### `GET /healthz`

Liveness check. Returns `{ ok: true, port: 9788, logic_running: <bool> }`.

---

## Verb map (starter set, mirrors NOIZYNET §6.5)

| Verb          | Mechanism                                      | Default ack                   |
| ------------- | ---------------------------------------------- | ----------------------------- |
| `record`      | OSC `/control/record 1`                        | "Recording. Red light is on." |
| `stop`        | OSC `/control/stop 1`                          | "Stopped."                    |
| `play`        | OSC `/control/play 1`                          | "Playing."                    |
| `return`      | OSC `/control/return` + `/control/play`        | "Playing from the top."       |
| `arm:<n>`     | OSC `/track/<n>/record 1`                      | "Track <n> armed."            |
| `mute:<n>`    | OSC `/track/<n>/mute 1`                        | "Track <n> muted."            |
| `save`        | `osascript -e 'tell app "Logic Pro" to save'`  | "Session saved."              |
| `bounce`      | `osascript` keystroke Cmd+B                    | "Bouncing now."               |
| `tag-consent` | Writes sidecar JSON with current consent token | "Consent tagged."             |

---

## Auth

Every request must carry:

```
Authorization: Bearer <NOIZY_API_KEY>
```

The bridge binds to `127.0.0.1` only. The CF01-Discord Worker reaches it through the cloudflared tunnel at `mesh.noizy.ai:9696` → forwarded internally to `:9788`. No public exposure.

---

## Run

```bash
cd ops/lucy-logic-bridge
node server.js
# or with a LaunchAgent (recommended):
# bash install-launchagent.sh
```

Logs to `logs/lucy-logic-bridge.log` (per coding standards — never CWD).

---

## Why not Logic Remote directly

Logic Remote is signed-only by Apple over a proprietary protocol. We use the **same underlying Logic OSC + AppleScript surfaces** that Logic Remote uses internally — fully supported, third-party-callable, and steerable from LUCY instead of locked to the Apple app.

---

## Cross-references

- Voice setup: [`DreamChamber/lucy-ipad/lucy-kate-voice-setup.md`](../../DreamChamber/lucy-ipad/lucy-kate-voice-setup.md)
- iPad code: [`mc96/Lucy-Fork/Heaven/Services/VoiceEngine.swift`](../../mc96/Lucy-Fork/Heaven/Services/VoiceEngine.swift) — `lucyAck()`
- Device registry: [`DEVICES.md §2 (port 9788)`](../../DEVICES.md)
- Architecture spec: [`NOIZYNET_AUDIO_CHAIN.md §6.5`](../../NOIZYNET_AUDIO_CHAIN.md)
