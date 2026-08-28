# NOIZY EMPIRE — ALL MOBILE DEVICES
# GOD (M2 Ultra) Audio Device Map + Integration Guide
# RSP_001 Sovereign · GORUNFREE Protocol

---

## DEVICE INVENTORY ON GOD

| Index | Device | Channels | Role |
|-------|--------|----------|------|
| 0 | **RSP iPhone Microphone** | 1 in | GORUNFREE voice input |
| 1 | SAMSUNG | 6 out | Studio monitor output |
| 2 | Unknown USB Audio Device | 2 in | USB fallback |
| 3 | Mac Studio Speakers | 2 out | System audio |
| 4 | LANDR Sessions | 2 in/out | Production recording |
| 5 | Microsoft Teams Audio | 1 in/1 out | Meetings |
| 6 | Transcriptions Text-To-Speech | 2 in | TTS playback capture |
| 7 | **NOIZYIPAD** | 2 in | iPad mic / war room audio |
| 8 | Multi-Output Device | - | Aggregate output |

---

## IPHONE — RSP iPhone Microphone (Index 0)

### What It Is
Continuity Camera — iPhone appears as a system audio input device over WiFi/Bluetooth.
No app needed. Works natively on macOS Sequoia.

### Setup (one-time)
1. iPhone and Mac signed into same Apple ID
2. iPhone WiFi + Bluetooth ON
3. Go to: **System Settings → Sound → Input** → select `RSP iPhone Microphone`
4. It persists — reconnects automatically when iPhone is nearby

### Voice Bridge (Sovereign Whisper pipeline)
```bash
source ~/NOIZYLAB/venv/activate-audio.sh
python3 ~/NOIZYLAB/tools/voice_bridge.py
```
Speak → Whisper transcribes locally → auto-copies to clipboard → Cmd+V into VS Code.

### iOS Shortcuts (Siri triggers)
Set up in iPhone Shortcuts app:

**"Hey Siri, GABRIEL"**
→ Shortcut: HTTP POST to `http://[M2_IP]:9099/voice` with transcription

**"Hey Siri, Deploy Heaven"**
→ Shortcut: HTTP POST to `http://[M2_IP]:9099/command` with body `{"action":"deploy"}`

**"Hey Siri, Empire Status"**
→ Shortcut: HTTP GET `https://heaven.rsp-5f3.workers.dev/gabriel`

**"Hey Siri, Boot Empire"**
→ Shortcut: SSH to GOD, run `~/NOIZYLAB/empire-boot.sh`

---

## IPAD — NOIZYIPAD (Index 7)

### What It Is
iPad also shows up as audio input via Continuity — `NOIZYIPAD` on GOD.
2 channels (stereo mic).

### Role in War Room
- Freeform visual architecture boards (pinned permanently)
- AirDrop screenshots from GOD → iPad cards
- Real-time annotation as decisions are made
- 4 pinned Safari tabs: Cloudflare, heaven.rsp-5f3.workers.dev, GitHub, localhost:5678

### iPad as Second Voice Input
```python
# Use iPad mic instead of iPhone
python3 ~/NOIZYLAB/tools/voice_bridge.py --mic ipad
```

### iPad Keyboard Shortcuts (hardware keyboard)
When using iPad as command terminal via VS Code tunnel:
- `Cmd+Shift+P` → VS Code command palette
- `Ctrl+Alt+V` → Voice input (when speech extension active)

---

## VOICE BRIDGE — ALL MODES

### Quick Reference
```bash
# Activate audio venv first (always)
source ~/NOIZYLAB/venv/activate-audio.sh

# iPhone mic → Whisper → clipboard
python3 ~/NOIZYLAB/tools/voice_bridge.py

# iPad mic → Whisper → clipboard
python3 ~/NOIZYLAB/tools/voice_bridge.py --mic ipad

# Run as HTTP server (triggers from Siri Shortcuts)
python3 ~/NOIZYLAB/tools/voice_server.py

# Test mic capture only
python3 ~/NOIZYLAB/tools/voice_bridge.py --test
```

### Wake Words (say these to trigger actions)
| Word | Action |
|------|--------|
| "deploy" | `wrangler deploy` in Terminal |
| "status" / "health" | Fetch HEAVEN health endpoint |
| "archivist" | Run Archivist catalog scan |
| "monitor" | Open GABRIEL monitor |
| "boot" | Run empire-boot.sh |
| "stop" | Exit voice bridge |
| *(anything else)* | Copy to clipboard → paste in VS Code |

---

## VS CODE VOICE INTEGRATION

### Method 1: Built-in Chat Mic (Copilot)
- VS Code already has a mic button in the Copilot chat panel
- Set input to `RSP iPhone Microphone` in System Settings → Sound
- Click mic → speak → words appear in chat
- Works with Claude Code too (same input field)

### Method 2: Sovereign Whisper Bridge (GORUNFREE)
- Runs entirely on M2 Ultra
- No cloud transcription
- Faster for short commands (base model: <0.5s)
- Constitutional: voice never leaves GOD

### Method 3: macOS Voice Control + VS Code
- System Settings → Accessibility → Voice Control → Enable
- Say "type [text]" → types in VS Code
- Say "press Return" → submits to Claude Code
- iPhone/iPad mic works as input automatically

---

## GORUNFREE FULL PIPELINE

```
RSP_001 speaks → iPhone/iPad mic
  → [Continuity Camera / sounddevice]
  → Whisper (base model, local, Metal GPU)
  → Text output
  → [if wake word] → Execute empire command
  → [otherwise] → Clipboard → Cmd+V → VS Code chat
  → Claude Code processes
  → HEAVEN17 API if needed
  → D1 ledger records action
  → Response spoken via XTTS v2 (RSP_001 voice)
```

35% voice. 65% AI. 1-click execution. Zero friction.

---

## SIRI SHORTCUTS SETUP (iOS)

### Install on iPhone

**Shortcut 1: GABRIEL Status**
```
Name: GABRIEL
Action: Get Contents of URL
  URL: https://heaven.rsp-5f3.workers.dev/gabriel
  Method: GET
Action: Show Result (formatted JSON)
```

**Shortcut 2: Deploy Heaven**
```
Name: Deploy Heaven
Action: Get Contents of URL
  URL: http://[GOD_LOCAL_IP]:9099/command
  Method: POST
  Body: {"action":"deploy","actor":"RSP_001"}
Action: Show Result
```

**Shortcut 3: Empire Health**
```
Name: Empire Health
Action: Get Contents of URL
  URL: https://heaven.rsp-5f3.workers.dev/health
Action: Get Dictionary Value: status
Action: Show Result
```

**Shortcut 4: Voice to Claude**
```
Name: Ask Claude
Action: Dictate Text
Action: Get Contents of URL
  URL: http://[GOD_LOCAL_IP]:9099/voice
  Method: POST
  Body: {"text": [Dictated Text], "actor": "RSP_001"}
Action: Show Result
```

---

## FINDING GOD'S LOCAL IP

```bash
# Run on M2 Ultra
ipconfig getifaddr en0
# Example: 192.168.1.42
# Use this in all Shortcuts above
```

---

## NEXT: VOICE HTTP SERVER

Run `python3 ~/NOIZYLAB/tools/voice_server.py` to expose:
- `POST /voice` — receive text, paste to VS Code
- `POST /command` — execute empire commands
- `GET /status` — empire health
- `GET /devices` — list audio devices

This bridges Siri Shortcuts → GOD → Claude Code without touching the cloud.
