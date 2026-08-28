# GOD STATUS: 2026-04-13T16:10:24Z — 4/7 services healthy — 3 services DOWN/UNREACHABLE

---

## ALERTS

- **voice-bridge**: DOWN — No process found
- **audio-hijack**: DOWN — No process found
- **voice-bridge-http**: UNREACHABLE — Port not responding

These three services form the voice capture and bridge layer. Voice pipeline ingest is offline. GABRIEL and core inference services are unaffected.

---

## Services (4/7 Running)

| Service | Status | PID | CPU | Mem | Started |
|---------|--------|-----|-----|-----|---------|
| gabriel-daemon | RUNNING | 97636 | 0.0% | 0.0% | 1:48 PM |
| gabriel-monitor | RUNNING | 97627 | 0.0% | 0.0% | 1:48 PM |
| voice-server | RUNNING | 97596 | 0.0% | 0.0% | 1:48 PM |
| ollama | RUNNING | 97620 | 0.0% | 0.1% | 1:48 PM |
| voice-bridge | DOWN | — | — | — | — |
| audio-hijack | DOWN | — | — | — | — |
| voice-bridge-http | UNREACHABLE | — | — | — | — |

All running services started at 1:48 PM today, indicating a recent restart or boot cycle.

---

## GABRIEL

- **Recent sessions**: 0
- **Active tasks**: 0
- **Last heartbeat**: 2026-04-13T15:52:51Z (approx 17 min ago — healthy)
- **Daemon start**: 2026-04-12T07:52:50Z
- **Consent records**: 0 total
- **Estate members**: None registered in current query (rsp001 may require re-check)
- **Log status**: gabriel.log is 6.6 MB, last two entries are healthy heartbeats with status GORUNFREE
- **Constitutional violations**: None detected

---

## Voice Pipeline

- **Total runs**: 1
- **Last run**: 2026-03-31T20:20:56Z (synthesis, actor RSP_001, consent approved)
- **Errors**: 0
- **Latest transcripts**: None — no new transcripts since last check
- **NOIZYVOX** (port 8421): Last log activity 2026-04-05. Health endpoint was responding 200 OK. Server currently running on Uvicorn.

---

## Ollama Models (19 loaded)

Core models: gemma4:e4b (9.6 GB), gemma4:26b (17 GB), gemma4:31b (19 GB), gemma3:latest (3.3 GB), dolphin-mixtral:8x7b (26 GB), phi3:14b (7.9 GB), llava:34b (20 GB), codestral:latest (12 GB), nomic-embed-text (274 MB)

NOIZY custom models (10): noizy-wisdom-scribe, noizy-mission-control, noizy-consent-guardian, noizy-family-keeper, noizy-gabriel-mind, noizy-dream-weaver, noizy-heaven-forger, noizy-kidz-worldbuilder, noizy-vox-architect, noizy-fish-cataloguer (3.3 GB each)

---

## System

- **Uptime**: 4 days, 49 minutes
- **Load average**: 11.28 / 10.50 / 11.24 (elevated but stable for M2 Ultra with Ollama models)
- **Disk**: 10 GB used / 1.8 TB total (1%) — plenty of headroom
- **Available**: 1.1 TB

---

## n8n

- Last active: 2026-04-03. Currently stopped (received SIGTERM). Version 2.13.4. Python task runner was not available in internal mode.

---

## Notes

The voice bridge stack (voice-bridge, audio-hijack, voice-bridge-http) is fully offline. If live voice capture is needed, these services will require manual restart. GABRIEL is healthy and heartbeating normally. System resources are abundant. No errors, no constitutional violations, no anomalies in logs.
