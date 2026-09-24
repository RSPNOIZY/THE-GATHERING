# 👑 NOIZY Sovereign Runtime: Sovereign Operating System for Human-Directed AI
**Document Version:** `2.4.0-PROD` (Master Architecture & Implementation Specification)  
**Classification:** `CONFIDENTIAL & PRIVILEGED`  
**Core Authority:** `RSP_001` (Robert Stephen Plowman)  
**Core Invariant:** `ONE COMMAND → ONE ACTION → ONE RECEIPT` • `CHECK (covenant_split = 75.00)`  

---

## 🏛️ 1. The Unified System Topology

```
                  ┌────────────────────────────────────────────────────────┐
                  │                   RSP CONTROL PLANE                    │
                  │  intent → risk → evidence → decision → human approval  │
                  └───────────────────────────┬────────────────────────────┘
                                              │
                                              ▼
                  ┌────────────────────────────────────────────────────────┐
                  │                 GABRIEL EXECUTION PLANE                │
                  │      routing · audio · device actions · agent tools    │
                  └───────┬───────────────────┬────────────────────┬───────┘
                          │                   │                    │
                          ▼                   ▼                    ▼
               ┌──────────────────┐ ┌───────────────────┐ ┌───────────────────┐
               │   DREAMCHAMBER   │ │   SONIC PASSPORT  │ │  HUMAN INTERFACE  │
               │ Telemetry Fabric │ │   Asset Identity  │ │ Siri · CarPlay HUD│
               └──────────┬───────┘ └─────────┬─────────┘ └─────────┬─────────┘
                          │                   │                     │
                          └───────────────────┼─────────────────────┘
                                              │
                                              ▼
                              ┌───────────────────────────────┐
                              │      HARMONY LEDGER SPINE     │
                              │  consent · approvals · actions│
                              └───────────────────────────────┘
```

> [!IMPORTANT]
> **Core Architectural Invariant:**  
> Nothing consequential executes directly from an AI response. Every action becomes an **RSP decision packet**, passes strict cognitive firewall evaluation, optionally requires interactive human approval, executes through GABRIEL via an allowlisted capability registry, and produces an immutable receipt recorded in the Harmony Ledger.

---

## 🛡️ 2. The 5 Sovereign Operational Planes

### Plane 1: RSP Cognitive Firewall (`rsp_cognitive_firewall.py`)
- **Pipeline:** `Incoming Request` $\rightarrow$ `Classify Intent` $\rightarrow$ `Identify Affected People/Assets` $\rightarrow$ `Score Urgency & Consequence` $\rightarrow$ `Assess Reversibility` $\rightarrow$ `Grade Evidence Quality` $\rightarrow$ `Check Consent & Authority` $\rightarrow$ `Produce Recommendation & Alternatives` $\rightarrow$ `Decision Outcome`.
- **4 Strict Outcomes:**
  - `ALLOW`: Read-only or low-risk operations with active consent.
  - `ALLOW_WITH_APPROVAL`: Consequential actions (location disclosure, financial routing) requiring explicit human tap/voice confirmation.
  - `DEFER`: Insufficient evidence score ($< 0.60$) or unstable telemetry; held in queue.
  - `ABSTAIN`: Missing or revoked Law 25 consent, or policy boundary violations.
- **Protected Human Intent Record:**
```json
{
  "intent_id": "INT_8F2A10C34B19",
  "actor_id": "RSP_001",
  "raw_intent_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "normalized_intent": "prepare traffic-aware route",
  "purpose": "dispatch_eta",
  "authority": "driver",
  "consent_state": "ACTIVE",
  "risk_class": "LOCATION_OPERATION",
  "reversibility": "FULLY_REVERSIBLE",
  "approval": "REQUIRED",
  "expires_at": "2026-08-28T17:50:31Z"
}
```

### Plane 2: GABRIEL Execution Plane (`gabriel_capability_broker.py`)
- **Allowlisted Capability Broker:** Arbitrary tool names are strictly rejected.
- **Tool Risk Classification:**

| Capability Class | Examples | Default Policy |
| :--- | :--- | :--- |
| **`Observe`** | Route ETA, device state, audio level | Allowed with read receipt |
| **`Prepare`** | Draft route, prepare Pushcut handoff, create playlist | Allowed with Rule Zero receipt |
| **`Execute`** | Open Waze, change audio routing, send notification | Approval or policy gate |
| **`Consequential`**| Disclose location, contact a person, alter a ride | Dual-approval required |
| **`Destructive`** | Delete data, revoke access, overwrite asset | Explicit confirmation by `RSP_001` |

### Plane 3: Dreamchamber Telemetry Fabric (`dreamchamber_telemetry_fabric.py`)
- **Tri-Plane Observability:**
  1. `Operational Plane`: Latency, errors, retries, queue depth.
  2. `Governance Plane`: Consent state, approvals, policy versions, receipts, refusals.
  3. `Outcome Plane`: Usefulness, corrections, overrides, mission success.
- **Strict Privacy Budget:** Raw prompts, voice bytes, and passenger identities are **never exported**. Tool arguments are schema-redacted and summarized.

### Plane 4: Sonic Passport Asset Identity Graph (`sonic_passport_graph.py`)
Tracks multi-generational audio lineage across 5 independent verification layers:
$$\text{Master} \longrightarrow \text{Stems} \longrightarrow \text{Edits} \longrightarrow \text{Live Performances} \longrightarrow \text{Derivatives}$$
- **Chromaprint (1.6.1):** Acoustic similarity and catalog lookup.
- **Cryptographic Hash (SHA-256):** Exact-file binary identity.
- **C2PA v2.2 JUMBF Manifest:** Signed provenance claims and AudioSeal watermark anchor.
- **Rights & License Records:** `CHECK (covenant_split = 75.00)` hardcoded invariant.
- **SynthID Flag:** Synthetic generation disclosure (EU AI Act Article 50).

### Plane 5: Harmony Ledger Spine & Cloudflare Distributed Architecture
- **Local M2 Ultra:** Reasoning, orchestration, sensitive preprocessing.
- **Cloudflare Worker:** Authenticated gateway and policy boundary (`mcp.noizyfish.com`).
- **Durable Object (`DriverSessionDO.ts`):** Per-driver / per-session ordering, monotonic sequence deduplication, live state (`driver-session/{driver_id}/{session_id}`).
- **Cloudflare D1:** Sole authority for `consent_registry`, `harmony_ledger`, `policy_versions`, and `receipt_verification_events`.
- **Cloudflare Queue:** Asynchronous, idempotent telemetry processing.
- **Supabase:** Searchable knowledge base, repair workflows, and prototype storage.

---

## 🚗 3. Apple-Native Progression & Safe In-Vehicle HUD

```
Phase 1: Pushcut → Shortcut → Waze Deep Link
Phase 2: App Intents → Lucy Route Approval & Handoff
Phase 3: Native NOIZY CarPlay Experience (CPListTemplate & CPInformationTemplate)
Phase 4: Native Navigation, Audio & Autonomous Dispatch Ecosystem
```

### CarPlay Cabin Safety Constraint
The in-vehicle screen displays only the minimum information needed while driving:
- Active Mission & Route ETA (Traffic Delta)
- 2026 Honda CR-V Hybrid Battery SOC (`78%`)
- Ottawa YOW Airport Surge Multiplier (`1.65x`)
- Parked-Only Video Mode (`P` unlocked, `D` gracefully suspended)

Full cryptographic provenance, C2PA claims, and policy logs belong on iPhone, iPad Pro Lucy, or M2 Ultra—never distracting the driver.

---

## 💎 4. Three Commercial Capabilities

1. **Trusted Agent Execution:** Consent-aware actions with cryptographic receipts, cognitive firewalls, and automated abstention.
2. **Sonic Passport:** Portable identity, provenance, rights, and derivative lineage for music, stems, and voice biometrics.
3. **Human-Directed Vehicle Intelligence:** A private driver assistant coordinating navigation, audio, and automation without silently usurping human control.
