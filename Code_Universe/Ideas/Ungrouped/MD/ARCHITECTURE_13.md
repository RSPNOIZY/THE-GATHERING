# NOIZYSTREAM Architecture

**Creator-controlled audio fabric.**
Dante for local truth. WebRTC for global reach. AES67 for interop. NOIZY control plane for rights, roles, proof, and orchestration.

---

## Core Thesis: Two-Lane Audio System

| Lane | Stack | Latency | Use |
|---|---|---|---|
| **Studio** | Dante | <1ms | Local backbone — record, monitor, cue, talkback |
| **Internet** | WebRTC | ~50ms | Remote listen, approvals, contributions |
| **Interop** | AES67 | <1ms | Cross-vendor pro-audio compatibility |

---

## Service Architecture

```
apps/noizystream/
├── src/
│   ├── server.js            — Main Express + WebSocket control plane (port 4040)
│   ├── sessions/
│   │   └── manager.js       — Session CRUD, role assignment, participant tracking
│   ├── routes/
│   │   └── templates.js     — Dante route presets (default, tracking, mixing, etc.)
│   ├── auth/
│   │   └── permissions.js   — JWT tokens, role-based permissions, requireAuth middleware
│   ├── proof/
│   │   └── logger.js        — SHA-256 chained append-only proof log → GABRIEL
│   ├── signaling/
│   │   └── server.js        — WebSocket signaling: offer/answer/ICE, peer management
│   └── dante/
│       └── controller.js    — CoreAudio topology, Dante VSC detection, route subscriptions
└── artifacts/
    └── sessions/            — Per-session JSON proof files
```

---

## GOD Local Topology (M2 Ultra @ 10.90.90.10 / 10.0.0.70)

```
iPhone 15 Pro Max  ─┐
iPad 12.9 2nd Gen  ─┤─ AirPlay → port 5000 (macOS native) ─┐
Mic input          ─┤─ CoreAudio capture                   ─┤
DAW (Logic Pro)    ─┤─ Dante Virtual Soundcard             ─┤─→ M2 Ultra GOD
Apollo interface   ─┘─ USB/TB audio                        ─┘    │
                                                                  │
                              ┌───────────────────────────────────┤
                              │                                   │
                        Record bus                        WebRTC bridge
                        Monitor out                       → remote clients
                        Cue mix                           → approval
                        Print bus                         → contribution
```

---

## API Reference

```
Control Plane: http://GOD.local:4040
WebSocket:     ws://GOD.local:4040/signal
Dashboard:     http://GOD.local:4040

Public:
  GET  /health                    — Service health + proof chain hash
  GET  /                          — Dashboard UI

Auth:
  POST /auth/token                — Issue JWT for session participation

Sessions:
  GET  /sessions                  — List sessions [protected]
  POST /sessions                  — Create session [session:create]
  GET  /sessions/:id              — Get session [protected]
  POST /sessions/:id/join         — Join session [session:join]
  DELETE /sessions/:id            — Close session + proof bundle [session:admin]

Routes:
  GET  /routes/templates          — List route templates [protected]
  POST /sessions/:id/routes       — Apply route template [route:modify]

Dante:
  GET  /dante/topology            — Audio device topology + VSC status [protected]

Proof:
  GET  /proof                     — Current proof chain hash [proof:read]
  GET  /proof/session/:id         — Full session proof bundle [proof:read]
```

---

## Session Roles & Permissions

| Role | Permissions |
|---|---|
| HOST | session:create, session:admin, route:modify, stream:publish, stream:subscribe, stream:monitor, session:record, stream:talkback |
| ARTIST | stream:publish, stream:subscribe, stream:talkback |
| CONTRIBUTOR | stream:publish, stream:subscribe |
| LISTENER | stream:subscribe |
| PRODUCER | stream:monitor, stream:subscribe, stream:talkback, route:request |
| ADMIN | session:admin, stream:monitor, proof:read, audit:read |

---

## Route Templates

| Template | Lane | Latency | Use Case |
|---|---|---|---|
| `default` | studio | <1ms | Record + monitor |
| `tracking` | studio | <1ms | Multi-source tracking session |
| `remote_approval` | bridge | ~50ms | Studio + WebRTC for remote client |
| `voice_pipeline` | studio | ~5ms | Mic/AirPlay → Whisper → GABRIEL |
| `mixing` | studio | <1ms | DAW mix session |
| `mastering` | studio | <1ms | Mastering chain |

---

## Auth Model

**v1 (current):** HMAC-signed tokens issued by `/auth/token`
**v2 (production):** RS256 JWT + JWKS (same pattern as consent-gateway)

```
401 = identity missing (no token)
403 = identity insufficient (valid token, wrong permissions)
```

---

## Proof System

Every session event → SHA-256 chained NDJSON proof log:
```json
{ "seq": 1, "event": "session.created", "actor": "rsp_001",
  "ts": "2026-03-30T...", "prev_hash": "0000000000000000", "hash": "abc123..." }
```
Session close → full proof bundle in `artifacts/proof-session-NS_XXX.json`
All events → GABRIEL memcell at `noizystream:proof:*`

---

## v1 Build Status ✅

- [x] Session create/join/close with role assignment
- [x] Route template system (6 presets)
- [x] JWT auth with permission enforcement
- [x] SHA-256 chained proof log → GABRIEL
- [x] WebSocket signaling server (v2-ready)
- [x] Dante topology + CoreAudio device discovery
- [x] Real-time dashboard at :4040
- [x] pm2 managed

## v2 Roadmap

- [ ] WebRTC offer/answer/ICE complete peer connections
- [ ] Browser-based remote join UI
- [ ] Mix-minus for contributors
- [ ] Session recording metadata
- [ ] Dante Domain Manager integration
- [ ] AES67 bridge for cross-vendor scenarios
- [ ] Multi-room orchestration
- [ ] Dante Connect cloud extension (if needed)

---

*Spine: "Protocol > promises. Audio fabric, consent, and proof are enforced by infrastructure."*
