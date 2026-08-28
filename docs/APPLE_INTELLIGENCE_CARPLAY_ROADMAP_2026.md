# 🍎 Apple Developer Intelligence & In-Vehicle Roadmap (2026)
**Focus:** iOS + CarPlay / CarPlay Ultra + Apple Intelligence (Foundation Models) + App Intents  
**Alignment:** LUCY (Surface) • GABRIEL (Decide) • RSP_001 (Approve)  

---

## 🎯 Executive Strategy & Highest-Value Moves

Apple's developer platform shifts the optimal design for the **NOIZY / Dreamchamber / MC96** architecture away from monolithic app development and into **native OS extension points**:

```
                  ┌──────────────────────────────────────────────────────────┐
                  │                 APPLE INTELLIGENCE / SIRI                │
                  │              (Foundation Models Framework)               │
                  └────────────────────────────┬─────────────────────────────┘
                                               │
                                       Native App Intents
                                               │
        ┌──────────────────────────────────────┼──────────────────────────────────────┐
        ▼                                      ▼                                      ▼
┌───────────────────────────────┐ ┌───────────────────────────────┐ ┌───────────────────────────────┐
│       LUCY APP INTENTS        │ │    CARPLAY LIVE ACTIVITIES    │ │      PARKED VIDEO APPS      │
│  "Ask Lucy for founder brief" │ │   Top Mission, ETA, Surge,    │ │    Artist Visuals, Master   │
│  "Protect the catalog"        │ │   Battery SOC, Approvals      │ │    Briefings, Gathering     │
│  "Run governance review"      │ │   (Glanceable, Zero Audio)    │ │    (Parked Vehicles Only)   │
└───────────────────────────────┘ └───────────────────────────────┘ └───────────────────────────────┘
```

---

## 🚗 1. CarPlay & CarPlay Ultra Guidelines

### A. Approved App Category Fit
LUCY conforms directly to Apple's **Voice Conversational App** & **Navigation Companion / Founder Assistant** templates:
- **Do NOT build a custom navigation engine:** Keep Waze/Apple Maps responsible for turn-by-turn routes via deep links (`waze://?ll=...`).
- **Do NOT speak turn-by-turn instructions over audio:** Prevents driver distraction and adheres to Google Maps Terms of Service.

### B. Glanceable Widgets + Live Activities
Instead of constant audio chatter, LUCY projects glanceable telemetry to the CarPlay dashboard:
- **Top Mission** (e.g. `Master 4 Stems at 396Hz`)
- **Traffic-Aware ETA** (e.g. `21 min (1.65x Surge)`)
- **Urgent Approval Queue** (e.g. `Tier-1 Dispatch Clearance`)
- **2026 Honda CR-V Hybrid Battery SOC** (`78% SOC`)

---

## 🤖 2. Native App Intents & Apple Intelligence Integration

Swift App Intents have been created at [`LUCY/apple/AppIntents/LucyAppIntents.swift`](file:///Users/m2ultra/THE-GATHERING/LUCY/apple/AppIntents/LucyAppIntents.swift):

| Voice Phrase | Invoked App Intent | Action Taken |
| :--- | :--- | :--- |
| *"Siri, ask Lucy for today's founder brief."* | `GetFounderBriefIntent` | Fetches active missions, catalog stats, and Ottawa surge multipliers. |
| *"Siri, ask Gabriel for approval queue."* | `GetGabrielApprovalQueueIntent` | Queries pending Tier-1 dispatches and governance requests. |
| *"Siri, protect the catalog."* | `ProtectCatalogIntent` | Locks C2PA v2.2 manifests, 75/25 split invariant, and Law 25 biometrics. |
| *"Siri, run governance review."* | `RunGovernanceReviewIntent` | Audits Cloudflare D1 Harmony Ledger and Rule Zero command logs. |

---

## 🎥 3. Parked Vehicle Video Content

Apple's CarPlay Video support is reserved strictly for parked vehicles. For NOIZY, this provides the surface for:
1. **GABRIEL Artist Twin Sessions** (Visualizer loops and music video playback).
2. **Founder Strategic Briefings & Slide Decks** (`NOIZYLAB.CA - 01152026 - BUILD.pptx`).
3. **The Gathering Event Recordings**.

---

## 🏛️ 4. Codebase Assets Created

- **App Intents:** [`THE-GATHERING/LUCY/apple/AppIntents/LucyAppIntents.swift`](file:///Users/m2ultra/THE-GATHERING/LUCY/apple/AppIntents/LucyAppIntents.swift)
- **Live Activities & Widgets:** [`THE-GATHERING/LUCY/apple/Widgets/LucyLiveActivity.swift`](file:///Users/m2ultra/THE-GATHERING/LUCY/apple/Widgets/LucyLiveActivity.swift)
- **In-Vehicle Orchestration Specification:** [`THE-GATHERING/docs/SOVEREIGN_IN_VEHICLE_ORCHESTRATION_PIPELINE_v2.4.0.md`](file:///Users/m2ultra/THE-GATHERING/docs/SOVEREIGN_IN_VEHICLE_ORCHESTRATION_PIPELINE_v2.4.0.md)
- **Master Manifest:** [`THE-GATHERING/MC96_NOIZYWORLD_MANIFEST.json`](file:///Users/m2ultra/THE-GATHERING/MC96_NOIZYWORLD_MANIFEST.json)
