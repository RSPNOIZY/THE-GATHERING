# MC96 FULL DIAGNOSTIC REPORT
**Machine:** GOD.local — M2 Ultra Mac Studio (24-core, 192GB, 1.8TB)
**Date:** 2026-04-13
**Captured by:** Claude Opus via noizy-gemma3 MCP
**Operator:** Robert Stephen Plowman (RSP_001)

---

## PHASE 1: MCP SERVER CONFIGS

### Claude Desktop (active — 2 servers)
| Server | Command | Status |
|--------|---------|--------|
| noizy-gemma3 | `node /Users/m2ultra/NOIZYLAB/mcp-gemma3/server.js` | **ACTIVE** — Ollama @ localhost:11434, Gemma3 model |
| GitKraken | `gk mcp --host=claude --source=gitlens` | **ACTIVE** |

**Config note:** `CLOUDFLARE_ACCOUNT_ID` in noizy-gemma3 env is set to `5ba03939...` (Fishmusicinc account), NOT `5f36aa...` (NOIZYFISH). This is correct for the MCP tool since Cowork connects to Fishmusicinc, but wrangler deploys should always use NOIZYFISH.

### NOIZY Agent MCPs (9 servers — configured but NOT in Claude Desktop)
**Source:** `/Users/m2ultra/NOIZYANTHROPIC/.claude/mcp-config-godlocal.json`

| Server | File Exists | HEAVEN_URL | Notes |
|--------|-------------|------------|-------|
| gabriel-mcp | ✓ | — | Orchestrator. DREAMCHAMBER_URL=localhost:7777 |
| lucy-mcp | ✓ | heaven.noizylab.workers.dev | **STALE URL** — should be heaven.rsp-5f3.workers.dev |
| heaven-mcp | ✓ | heaven.noizylab.workers.dev | **STALE URL** |
| engr-keith-mcp | ✓ | heaven.noizylab.workers.dev | **STALE URL** |
| dream-mcp | ✓ | — | No HEAVEN dependency |
| cb01-mcp | ✓ | heaven.noizylab.workers.dev | **STALE URL** |
| shirley-mcp | ✓ | — | No HEAVEN dependency |
| family-mcp | ✓ | — | No HEAVEN dependency |
| dreamchamber-audio-mcp | ✓* | — | Python server, **NOT** index.js. Has server.py |

**CRITICAL:** 4 servers reference `heaven.noizylab.workers.dev` which may be a different/old deployment. The current live HEAVEN is at `heaven.rsp-5f3.workers.dev`.

### Missing Server
**noizy-voice-bridge** (Whisper large-v3 + XTTS v2 + Argos Translate, port 9700) — **NOT FOUND** on disk anywhere. No config references it. This server needs to be built.

### Other MCP Configs Found
- **Gemini/Antigravity:** Cloudflare (NOIZYFISH account), Google Cloud Run (noizy-ai project), Azure
- **Copilot:** GitKraken only

---

## PHASE 2A: CORE AUDIO & APOLLO

### Apollo / Universal Audio Status
| Component | Status | Details |
|-----------|--------|---------|
| UAD Console | **RUNNING** (PID 91328, 10.8% CPU) | 125 min runtime |
| UA Mixer Engine | **RUNNING** (PID 95493, 6.9% CPU) | Located at /Library/Application Support/Universal Audio/Apollo/ |
| UA Mixer Helper | **RUNNING** (PID 97274, 4.4% CPU) | |
| UAD Meter & Control Panel | **RUNNING** (PID 97603, 0.1% CPU) | |
| UA Connect | **RUNNING** (PID 96149+) | Version 1.9.2 (Electron-based) |
| UAD kexts | **NONE LOADED** | Expected on Apple Silicon — uses system extensions instead |
| UAD system extensions | **NONE LISTED** | systemextensionsctl showed nothing — investigate |

### coreaudiod — ROOT CAUSE OF AUDIO INSTABILITY
| Metric | Value |
|--------|-------|
| PID | 202 |
| CPU | **179.6%** (sustained, 3+ days) |
| Impact | Blocks ALL CoreAudio API calls. system_profiler SPAudioDataType hangs. Swift CoreAudio utility hangs. auval hangs. |
| Fix | `sudo killall coreaudiod` — it will auto-restart clean |

**This single process is the #1 system problem.** Until coreaudiod is restarted, no audio diagnostic tool can query devices, sample rates, or buffer sizes.

### Thunderbolt Bus Status
| Bus | Port | Device | Speed |
|-----|------|--------|-------|
| Bus 0 | Receptacle 1 | **Seagate GoFlex Desk** → **Seagate GoFlex #2** → **WD My Book Thunderbolt Duo** | 10 Gb/s |
| Bus 1 | Receptacle 2 | No device | 40 Gb/s available |
| Bus 2 | Receptacle 3 | No device | 40 Gb/s available |
| Bus 3 | Receptacle 4 | No device | 40 Gb/s available |
| Bus 4 | Receptacle 5 | No device | 40 Gb/s available |
| Bus 5 | Receptacle 6 | No device | 40 Gb/s available |

**Apollo is NOT connected via Thunderbolt.** All 6 Thunderbolt ports show only storage devices on Bus 0. The Apollo interface needs to be physically connected to a Thunderbolt port (Bus 1-5 are all free at 40 Gb/s).

---

## PHASE 2B: SWIFT DIAGNOSTIC

- **Built successfully** at `/Users/m2ultra/Desktop/mc96_audio_diag`
- **Cannot execute** — hangs indefinitely because `coreaudiod` at 180% blocks CoreAudio API calls
- **Ready to run** after `sudo killall coreaudiod`

---

## PHASE 2C: AU NET SEND/RECEIVE

- `auval -a` — **HANGS** (coreaudiod blocking)
- Cannot enumerate AU plugins until coreaudiod is restarted
- Swift utility includes AU Net Send/Receive check — will work after restart

---

## PHASE 2D: NETWORK AUDIO BRIDGE

### Micky-P (10.90.90.40)
| Check | Result |
|-------|--------|
| Ping | **100% packet loss** — Micky-P is UNREACHABLE |
| SSH | **Connection refused / timed out** |
| Status | Machine is likely powered off, or on a different network |

### Bonjour/mDNS Audio Services Discovered
| Service | Instance | Interface |
|---------|----------|-----------|
| _raop._tcp | 10DDB1A1E0C0@**MACPRO** | if23, if27 |
| _raop._tcp | 3693F40B0141@**M2Ultra's Mac Studio** | if1, if25, if23, if27 |

**MACPRO is visible on the network via AirPlay/RAOP.** This is likely the old Mac Pro. No _apple-midi._udp services found — AU Net Send/Receive may not be broadcasting.

---

## CRITICAL ISSUES SUMMARY (ACTION REQUIRED)

### Severity: BLOCKER
1. **`sudo killall coreaudiod`** — At 180% CPU for 3+ days. Blocks ALL audio diagnostics, hangs system_profiler, auval, and any CoreAudio API calls. One command fixes it. It auto-restarts clean.

### Severity: HIGH
2. **Apollo not connected to Thunderbolt** — No UA device on any TB port. Connect Apollo to Bus 1-5.
3. **Micky-P is offline** (10.90.90.40) — Cannot run diagnostics or test AU Net Send/Receive bridge. Power on Micky-P.
4. **4 MCP servers reference stale HEAVEN URL** — lucy, heaven, engr-keith, cb01 all point to `heaven.noizylab.workers.dev` instead of `heaven.rsp-5f3.workers.dev`
5. **noizy-voice-bridge MCP doesn't exist** — No code, no config. Needs to be built.
6. **Docker memory: 7.65GB** — Should be 32GB+ on a 192GB machine

### Severity: MEDIUM
7. **9 NOIZY agent MCPs not in Claude Desktop config** — Only noizy-gemma3 and GitKraken are active. The other 9 agents are configured in a separate file but not loaded.
8. **dreamchamber-audio-mcp has wrong index.js reference** — Config says `index.js` but server is `server.py`
9. **No UAD system extensions listed** — May be normal for current UA driver version, but worth verifying after coreaudiod restart

---

## IMMEDIATE ACTION SEQUENCE

```bash
# Step 1: Kill coreaudiod (FIRST — unlocks everything else)
sudo killall coreaudiod

# Step 2: Run the Swift diagnostic (already built)
/Users/m2ultra/Desktop/mc96_audio_diag

# Step 3: Power on Micky-P, then:
ping 10.90.90.40
ssh fish@10.90.90.40 "system_profiler SPAudioDataType"

# Step 4: Connect Apollo via Thunderbolt
# (Physical action — plug into any TB port 2-6)

# Step 5: Docker memory
# Docker Desktop → Settings → Resources → Memory → 32GB

# Step 6: Update HEAVEN URLs in MCP configs
# File: ~/NOIZYANTHROPIC/.claude/mcp-config-godlocal.json
# Change: heaven.noizylab.workers.dev → heaven.rsp-5f3.workers.dev
```

---

## FILES GENERATED
| File | Location |
|------|----------|
| MCP Configs Backup | `~/Desktop/MCP_CONFIGS_BACKUP_20260413.json` |
| Swift Audio Diagnostic | `~/Desktop/mc96_audio_diag` (compiled binary) |
| Swift Source | `~/Desktop/mc96_audio_diag.swift` |
| This Report | `CLAUDE TODAY/MC96-FULL-DIAGNOSTIC-20260413.md` |

---

*Generated by NOIZY.AI Command Center — Robert Stephen Plowman / NOIZYFISH*
*Every voice is sovereign. Every use requires consent. Every artist gets 75%.*
