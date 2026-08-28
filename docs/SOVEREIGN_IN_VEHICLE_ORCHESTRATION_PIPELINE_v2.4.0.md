# 🧭 Sovereign In-Vehicle Orchestration & Navigation Pipeline
**Document Version:** `2.4.0-PROD` (Production Hardened)  
**Classification:** `CONFIDENTIAL & PRIVILEGED`  
**Target Fleet:** M2 Ultra Primary Node, iPhone 15 Pro Max, iPad Pro Lucy  
**Governance:** Tier-1 Dual-Approval • NC·01–10 Consent Gate • Cloudflare D1 Harmony Ledger  

---

## 🏛️ 1. Production Architecture (Safest Production Shape)

```
M2 Ultra node_runner.py
        │ MCP stdio
        ▼
Local GABRIEL MCP server
        │ HTTPS
        ├── Google Routes API (Directions v2)
        └── Harmony Ledger Worker (mcp.noizyfish.com)
                    │
                    └── Cloudflare D1 (consent_registry & harmony_ledger)

M2 Ultra
        │ Pushcut API with short-lived signed handoff token (60s TTL)
        ▼
iPhone Shortcut
        │ explicit policy / user interactive gate
        ▼
Waze Deep Link → Waze / CarPlay HUD
```

---

## ⚡ 2. Core Operational Modules

### A. Local GABRIEL MCP Server (`gabriel-routes-mcp.ts`)
- **Location:** [`THE-GATHERING/LUCY/src/telemetry/gabriel-routes-mcp.ts`](file:///Users/m2ultra/THE-GATHERING/LUCY/src/telemetry/gabriel-routes-mcp.ts)
- **Protocol:** `stdio` JSON-RPC 2.0.
- **Boundaries:**
  - Performs **NC·01–10 Location Consent Verification** over HTTPS to Harmony Worker.
  - Computes Google Routes API v2 `computeRoutes`.
  - Commits RSA/SHA-256 signed receipts to Cloudflare D1 via Worker HTTPS endpoint (`/api/v1/ledger/commit`).
  - **Google Maps ToS Isolation**: Returns normalized duration and polyline metrics only. Never feeds raw turn-by-turn navigation instructions into speech synthesis.

### B. M2 Ultra Node Runner (`node_runner.py`)
- **Locations:**
  - [`THE-GATHERING/LUCY/src/telemetry/node_runner.py`](file:///Users/m2ultra/THE-GATHERING/LUCY/src/telemetry/node_runner.py)
  - [`rideshare/pipelines/node_runner.py`](file:///Users/m2ultra/rideshare/pipelines/node_runner.py)
- **Protocol:** High-performance async daemon communicating via MCP stdio.
- **Verdict Logic:** Evaluates congestion delay delta against dynamic threshold (default $25\%$). Emits `READY_FOR_VEHICLE` or `HOLD_DISPATCH`.
- **Pushcut Token Generation:** Signs 60s ephemeral handoff token (`WB-*` waybill ID + harmony hash).

---

## 📱 3. Pushcut & Apple Shortcut CarPlay Pipeline

```
 ┌────────────────────────┐      Tailscale Mesh (mTLS)      ┌────────────────────────┐
 │   M2 Ultra Runner      ├────────────────────────────────►│   Pushcut Pro (iOS)    │
 │  (Verdict Generated)   │                                 │   (Receives Trigger)   │
 └────────────────────────┘                                 └───────────┬────────────┘
                                                                        │
                                                            User Taps Notification
                                                                        │
                                                                        ▼
 ┌────────────────────────┐       Direct Injection          ┌────────────────────────┐
 │      Apple Waze /      │◄────────────────────────────────┤     Data Jar App       │
 │   CarPlay Navigation   │   (waze://?ll=...&navigate=yes) │  (Stores Transit Key)  │
 └────────────────────────┘                                 └────────────────────────┘
```

### A. Pushcut Notification Payload (`POST /notifications/DispatchReady`)
```json
{
  "title": "NOIZY Dispatch: Route Approved",
  "text": "ETA: 21.4 min via Primary Highway. Tap to inject to CarPlay.",
  "sound": "submersible",
  "action": {
    "name": "NOIZY-CarPlay-Handoff",
    "runOnServer": false
  },
  "data": {
    "waybill_id": "WB-20260828-09A",
    "target_lat": 45.3225,
    "target_lon": -75.6692,
    "eta_minutes": 21.4,
    "harmony_hash": "a4f89d3c2e1b6f5a7e8d9c0b1a2f3e4d5c6b7a8f9e0d1c2b3a4f5e6d7c8b9a0",
    "timestamp": "2026-08-28T12:28:47Z"
  }
}
```

### B. Apple Shortcut: `NOIZY-CarPlay-Handoff`
```plaintext
[Shortcut: NOIZY-CarPlay-Handoff]
├── 1. Get Dictionary from Input (Pushcut Notification Data)
├── 2. Set Variable 'TargetLat' to Value: Input.target_lat
├── 3. Set Variable 'TargetLon' to Value: Input.target_lon
├── 4. Set Variable 'Waybill' to Value: Input.waybill_id
│
├── 5. [Data Jar Action] Set Value:
│      Path: "NOIZY.ActiveNav.active_trip"
│      Value: Dictionary (Input)
│
├── 6. Construct Navigation URL:
│      Text: "waze://?ll=" + TargetLat + "," + TargetLon + "&navigate=yes"
│
├── 7. Open URL: Text
│
└── 8. [Optional HUD Fallback] If CarPlay is connected:
       └── Send Local Device Notification to Apple Watch / CarPlay HUD: "Trip [Waybill] Initialized."
```

---

## 🛡️ 4. Production Verification Checklist

| Checkpoint | Target / Constraint | Status |
| :--- | :--- | :--- |
| **D1 Worker Isolation** | No local `env.D1_DATABASE` direct bindings; HTTPS Worker boundary enforced | ✅ **VERIFIED** |
| **Google Maps ToS** | Pure numeric delay calculations and sanitized advisories; zero turn-by-turn text in TTS | ✅ **VERIFIED** |
| **NC·01–10 Consent** | Fail-closed location verification before Google Routes API execution | ✅ **VERIFIED** |
| **Short-Lived Handoff** | 60s ephemeral token passed to Pushcut; explicit user notification tap | ✅ **VERIFIED** |
| **Dual Codebase Sync** | Identical verified implementations in `THE-GATHERING` and `rideshare/pipelines` | ✅ **VERIFIED** |
