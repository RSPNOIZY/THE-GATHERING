# Lucy iPad — Construction Order v1.0
## DreamChamber Empire Operator Surface

**Owner:** RSP_001 + Claude Code (GABRIEL)  
**Status:** Phase 0 COMPLETE → Phase 1 In Progress  
**Date:** April 10, 2026  

---

## PRIME DIRECTIVE

> Offline-first. Human-first. Zero-Trust-anchored.  
> Lucy runs on iPad with MCP logic local, no network dependency.

**SUCCESS =** iPad launches Lucy → "Gabriel validate HVS" → Receipt emitted → Airplane Mode works

---

## PHASE 0 — FOUNDATIONS ✅ COMPLETE

### Milestones
- [x] Canonical Heaven Worker snapshot in Git
- [x] Route/auth/D1 inventory documented
- [x] Failure modes listed (no network, low battery)

### Deliverables
```
~/DreamChamber/lucy-ipad/
├── lucy-construction-order.md    ← THIS FILE
├── heaven-canonical-snapshot.md  ← Worker state + D1 schema
├── routes-inventory.json         ← All 25+ routes
└── failure-modes.md              ← Offline resilience plan
```

> **Note:** `/tmp/Heaven` Xcode project already exists with:
> - `Lucy/App/LucyApp.swift` ✅
> - `Heaven/Models/AppState.swift` ✅  
> - `Heaven/Services/Heaven17Client.swift` ✅ (connects to heaven17 at :17017)
> - `Heaven/Services/VoiceEngine.swift` ✅ (STT/TTS/wake words)
> The real work in Phase 1 is filling out `Lucy/` modules and wiring MCP offline engine.

---

## PHASE 1 — LUCY SHELL (IN PROGRESS)

### Architecture
```
SwiftUI App (Lucy v0.1 — iPadOS 17+)
├── Local MCP Engine (Native Swift, NO WebView)
├── GRDB SQLite (Local canonical — offline receipts)
├── HEAVEN Bridge (HTTP to GOD:17017 when online)
├── Voice/Touch UX (AVFoundation + SFSpeech)
└── AirPlay Router (native AVAudioEngine)
```

### File Map
```
Sources/Lucy/
├── LucyApp.swift                ← Entry point (EXISTS: /tmp/Heaven/Lucy/App/)
├── MCP/
│   ├── MCPEngine.swift          ← TODO: Local MCP protocol handler
│   ├── MCPTools.swift           ← TODO: 10 HEAVEN tools, local implementations
│   └── MCPQueue.swift           ← TODO: Offline queue, auto-flush on reconnect
├── State/
│   ├── LucyState.swift          ← TODO: @Observable app state
│   └── AppConfig.swift          ← TODO: NOIZYNET IPs, ports, keys
├── DB/
│   ├── LocalDB.swift            ← TODO: SQLite via GRDB
│   └── Schema.swift             ← TODO: Tables matching HEAVEN D1 schema
├── Network/
│   ├── HeavenBridge.swift       ← TODO: HTTP to GOD:9696
│   ├── NOIZYNet.swift           ← TODO: Device discovery
│   └── SyncEngine.swift         ← TODO: Offline→online reconciliation
├── Audio/
│   ├── AudioRouter.swift        ← TODO: AirPlay, TTS (Kate), phoneme
│   └── VoiceInput.swift         ← TODO: Speech → command routing
├── UI/
│   ├── LucyView.swift           ← TODO: Root NavigationSplitView
│   ├── StandupView.swift        ← TODO: Morning standup tab
│   ├── HeavenView.swift         ← TODO: HEAVEN control panel
│   ├── MeshView.swift           ← TODO: NOIZYNET device map
│   └── CaptureView.swift        ← TODO: Voice/phoneme capture
└── Config/
    └── Constitutional.swift     ← TODO: Gospel Deal, never-clauses
```

### Milestones
- [ ] Lucy launches iPad Simulator
- [ ] Local MCP engine processes "Gabriel validate HVS"
- [ ] SQLite receipt emitted locally
- [ ] Voice "Hey Nicky" → routes to Micky-P
- [ ] Airplane Mode → 100% functional
- [ ] Online → auto-sync receipts to HEAVEN D1

---

## PHASE 2 — VALIDATION (NEXT)

### Milestones
- [ ] MCP consent gate: GENERATE → approved → receipt logged
- [ ] MCP consent gate: blocked action → refusal logged
- [ ] FTS5 search returns results from local SQLite
- [ ] Royalty: $1000 → $750 creator / $250 platform
- [ ] Online sync: local receipts flush to HEAVEN D1
- [ ] "Hey Nicky, start recording" → SSH command fires
- [ ] Airplane Mode toggle: zero data loss

---

## CONSTITUTIONAL RULES (ENFORCED IN CODE)

```swift
struct Constitutional {
    static let plowmanStandard = 0.75   // 75/25 PUBLIC LAW
    static let founderSplit = 0.85      // 85/15 INTERNAL ONLY
    static let neverDeleteD1 = true
    static let aquariumOnSystemDrive = false  // NEVER
    static let voiceEstateHeir = "Georgia May Plowman"
    static let consentRequired = true   // ALWAYS
    static let audioSampleRate: Double = 48000
    static let audioBitDepth: Int = 32
}
```

---

## AGENT MESH (10 AGENTS)

| # | Agent      | Port | Role                        | Wake Word  |
|---|------------|------|-----------------------------|------------|
| 1 | GABRIEL    | 7001 | Warrior orchestrator        | —          |
| 2 | LUCY       | 7002 | Compassionate adapter (iPad)| —          |
| 3 | SHIRL      | 7003 | Data curation               | —          |
| 4 | DREAM      | 7004 | Vision keeper               | —          |
| 5 | POPS       | 7005 | Guidance                    | —          |
| 6 | ENGR_KEITH | 7006 | Studio engineering          | —          |
| 7 | CB01       | 7007 | Operations                  | —          |
| 8 | HEAVEN     | 7008 | Cloud brain (CF Worker)     | —          |
| 9 | CLAUDE     | —    | DreamChamber partner        | —          |
|10 | NICKY      | —    | Micky-P controller          | "Hey Nicky"|

---
*NOIZY verifies the right to create.*  
*RSP_001 — Robert Stephen Plowman — Founder*  
*rsp@noizy.ai — April 10, 2026*
