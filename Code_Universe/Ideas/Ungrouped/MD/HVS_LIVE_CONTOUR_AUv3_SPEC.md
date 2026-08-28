# HVS Live Contour — AUv3 Product Specification

> **Product:** HVS Live Contour — Logic-side AUv3 meter / bridge
> **Bundle ID:** `ai.noizy.hvs-live-contour`
> **Author:** RSP_001 (orchestrated by Gabriel)
> **Spec captured:** 2026-04-09T15:55 · T-8 to April 17
> **Status:** Phase-1 prototype approved
> **Companion docs:** `CREATOR_OS_MASTER.md`, `DREAMCHAMBER_5_FRESH_IDEAS.md`

> **Position in the Creator OS:** Layer 3 — Identity + Agentic Layer.
> HVS Live Contour is the **first organ** of the 5-layer organism.
> Without it, the Swarm has nothing to decide on, the Hyperloop has nothing to archive, the Vault has nothing to preserve, and the Neuro-Orchestrator has nothing to heal.

---

## 1. Mission

Make **RSP_001 visible as living signal**, not just metadata. Every voice that enters Logic Pro for Mac through the Apollo Quad → U87 chain becomes a real-time stream of:

- **Waveform** (raw amplitude)
- **Contour** (emotional shape over time)
- **Authenticity** (a score that says "this is the real RSP_001 with > 94% confidence")
- **Session tags** (auto-generated NOIZYVOX vault entries)
- **Capture/classify/archive status** (lit indicators per state)

The plug-in lives on the master bus or any vocal track. It is **read-only on the audio stream** — never modifies the signal — and writes its analyses out-of-band to MemCell, the session manifest, and (optionally) Heaven D1.

---

## 2. UI Layout

A single AUv3 view, ~600pt wide × ~400pt tall, with 6 panes:

```
┌─────────────────────────────────────────────────────────────────┐
│  HVS LIVE CONTOUR · ai.noizy.hvs-live-contour · v0.1            │
├─────────────────────┬───────────────────────────────────────────┤
│                     │                                           │
│   ① INPUT METER     │      ② HVS CONTOUR GRAPH                  │
│   peak / RMS        │      rolling waveform + contour line      │
│                     │      ~3s window, 60fps                    │
│                     │                                           │
├─────────────────────┴───────────────────────────────────────────┤
│                                                                 │
│   ③ AUTHENTICITY BADGE         ④ EMOTION CLASSIFIER             │
│   ┌──────────────┐             ┌─────┬─────┬─────┬─────┬─────┐  │
│   │   97.3%      │             │ neu │ joy │ awe │ sad │ rage│  │
│   │  RSP_001 ✓   │             │ ████│ ██  │     │     │     │  │
│   └──────────────┘             └─────┴─────┴─────┴─────┴─────┘  │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ⑤ NOIZYVOX TAG QUEUE                                          │
│   ┌─────────────────────────────────────────────────────────┐   │
│   │ 14:32:01  vocal_take_warm_phrasing      [vault-ready]   │   │
│   │ 14:31:48  vocal_take_breath_passage     [pending]       │   │
│   │ 14:31:20  vocal_take_intro_speech       [vault-ready]   │   │
│   └─────────────────────────────────────────────────────────┘   │
│                                                                 │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│   ⑥ SESSION MANIFEST MINI-PANEL                                 │
│   session_id:  ses_2026-04-09T14-30                             │
│   creator_id:  RSP_001                                          │
│   captured:    127 buffers · 42s elapsed                        │
│   status:  ⬤ CAPTURE  ⬤ CLASSIFY  ⬤ ARCHIVE  ⬤ CONSENT          │
│                                                                 │
│   [ COMMIT TO VAULT ]                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Pane behavior

| Pane | Purpose | Refresh rate |
|---|---|---|
| ① Input meter | Standard peak/RMS bars from the audio render block | 60 fps |
| ② HVS contour graph | Rolling waveform with overlaid contour line (Hz/timbre derivative) | 60 fps |
| ③ Authenticity badge | Score 0–100 + RSP_001 ✓/✗ marker. Background pulses green > 94, yellow 80–94, red < 80 | 4 Hz |
| ④ Emotion classifier | 5-bucket softmax bars: neutral / joy / awe / sad / rage | 4 Hz |
| ⑤ NOIZYVOX tag queue | Auto-tagged take entries with vault-ready/pending markers | event-driven |
| ⑥ Session manifest mini-panel | Live session_id, counts, 4 status lights, COMMIT button | 1 Hz + on commit |

---

## 3. Signal Flow

```
U87 mic → Apollo Quad (HW) → Logic Pro for Mac (host)
                                   │
                                   ├── audio render block (real-time, untouched passthrough)
                                   │
                                   └── tap → AUv3 HVS Live Contour bridge
                                              │
                                              ├── ① ring buffer (off the audio thread)
                                              │
                                              ├── ② Core ML inference loop (4 Hz)
                                              │      ├── HVS contour model
                                              │      ├── Authenticity model
                                              │      └── Emotion classifier
                                              │
                                              ├── ③ tag generator (event-driven)
                                              │
                                              └── ④ session manifest writer
                                                     ├── local: ~/NOIZY/Sessions/<id>/manifest.json
                                                     ├── memcell: gabriel_serve POST /api/memcell/track
                                                     ├── (optional) Heaven D1: POST /v1/hvs_event
                                                     └── (optional) wisdom_capsule: append to lineage
```

**Critical: the audio render block does ZERO classification work.** It only:
1. Copies the buffer into a lock-free ring buffer (single-producer)
2. Returns immediately

A separate Swift Concurrency `Task` consumes from the ring buffer at ~4 Hz, runs Core ML inference on the Neural Engine, updates the UI via `@Published` properties, and writes the manifest. This guarantees **no audio glitches** even under heavy classifier load.

---

## 4. Core ML Inference Loop

### Models (v0.1 — local, on-device)

| Model | Input | Output | Target latency |
|---|---|---|---|
| **HVS Contour v0.1** | 250ms mono PCM @ 48kHz | 13-dim contour vector (MFCC-like + pitch derivative) | < 5 ms |
| **Authenticity v0.1** | 13-dim contour vector | scalar 0.0–1.0 (RSP_001 likelihood) | < 2 ms |
| **Emotion v0.1** | 13-dim contour vector | 5-class softmax (neutral/joy/awe/sad/rage) | < 2 ms |

All three packaged as `.mlpackage` files, compiled to `.mlmodelc`, loaded once at AUv3 init.

### Phase-1 model recipes

The point of v0.1 is to PROVE THE CONCEPT, not ship a researcher-grade classifier. Each model is small, fast, and re-trainable.

**HVS Contour v0.1 — feature extractor**
- Apple's Accelerate framework FFT → 80-mel filterbank → log → 13-coefficient DCT (standard MFCC)
- Plus: pitch (YIN algorithm via vDSP) + pitch derivative + energy
- No model file — pure DSP. Runs in the audio-adjacent thread, not on Neural Engine.

**Authenticity v0.1 — distance-from-prototype**
- Build a "RSP_001 prototype vector" by averaging contour vectors from 30 enrolled samples (initial Voice DNA session — Linear NOI-25/NOI-54)
- Score = `1 - min(1, cosine_distance(current_vector, prototype) / threshold)`
- Train as a 1-class SVM in Create ML once enrollment data exists; for v0.1 it's pure cosine distance
- Surfaces as "authenticity_score" in [0, 1]

**Emotion v0.1 — 5-class CoreML model**
- Trained from labeled samples in the Fish Music Inc archive (voice memos with self-labeled mood)
- Tiny dense network (Create ML tabular regressor → 5-output softmax). Fits in < 100 KB.
- For v0.1 if no labeled data, use a heuristic: pitch variance + spectral centroid + intensity → 5 buckets

---

## 5. Logic Integration Behavior

The plug-in is an AUAudioUnit subclass that hosts as:

- **AUv3 Effect** on a vocal track (preferred — gets the tracked voice in isolation)
- **AUv3 Master Bus Effect** (alternative — analyzes the full mix; less precise)

Behavior:

1. **No audio modification.** `internalRenderBlock` returns the input buffer untouched.
2. **Bypass safe.** When bypassed, all classifier work pauses; UI freezes; tag queue stops appending.
3. **Session-aware.** Reads Logic's transport state via the AU host transport API. New session_id when Logic starts a new project. New take when Logic enters record mode after stopping.
4. **Project-saved state.** AUv3 state restoration restores the session_id + tag queue when reopening a Logic project.
5. **Logic Scripter compatible.** Optional MIDI output: emits a MIDI CC on every authenticity score crossing the 94% threshold (CC 16 = "RSP_001 likelihood × 127"). Logic Scripter (JavaScript MIDI environment) can act on this.

---

## 6. Manifest Schema

Per-session manifest at `~/NOIZY/Sessions/<session_id>/manifest.json`:

```json
{
  "manifest_version": "0.1",
  "session_id": "ses_2026-04-09T14-30",
  "creator_id": "RSP_001",
  "started_at": "2026-04-09T14:30:00-04:00",
  "ended_at": "2026-04-09T14:42:18-04:00",
  "host": {
    "machine": "GOD.local",
    "daw": "Logic Pro for Mac",
    "daw_version": "12.2",
    "input_chain": ["U87", "Apollo Quad"],
    "auv3_version": "0.1.0"
  },
  "stats": {
    "total_buffers": 14217,
    "total_seconds": 738.0,
    "average_authenticity": 0.962,
    "peak_authenticity": 0.991
  },
  "tags": [
    {
      "ts": "2026-04-09T14:32:01-04:00",
      "label": "vocal_take_warm_phrasing",
      "duration_s": 12.4,
      "authenticity_score": 0.983,
      "emotion_top": "awe",
      "emotion_softmax": {"neutral": 0.18, "joy": 0.22, "awe": 0.51, "sad": 0.07, "rage": 0.02},
      "vault_ready": true,
      "consent_token_id": "ct_RSP_001_voice_capture_2026q2",
      "c2pa_hash": "sha256:abc123...",
      "audio_excerpt_path": "takes/take_001.aiff"
    }
  ],
  "consent_state": {
    "actor_id": "RSP_001",
    "scope": "voice_capture",
    "kill_switch_state": "active",
    "verified_at": "2026-04-09T14:30:01-04:00",
    "gateway_health": "online"
  },
  "wisdom_capsule_status": "queued"
}
```

---

## 7. D1 Event Model (Heaven side, when Heaven exists)

New table in gabriel_db (per ENGR_KEITH's schema standards):

```sql
CREATE TABLE hvs_live_events (
    id           TEXT PRIMARY KEY,                -- ulid
    session_id   TEXT NOT NULL,
    actor_id     TEXT NOT NULL REFERENCES hvs_actors(actor_id),
    event_type   TEXT NOT NULL CHECK (event_type IN ('capture','classify','tag','vault_commit','manifest_close')),
    ts           DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    payload      TEXT NOT NULL,                    -- JSON blob
    authenticity_score REAL,
    emotion_top  TEXT,
    consent_token_id TEXT,
    c2pa_hash    TEXT,
    created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_hvs_events_session ON hvs_live_events(session_id);
CREATE INDEX idx_hvs_events_actor   ON hvs_live_events(actor_id);
CREATE INDEX idx_hvs_events_ts      ON hvs_live_events(ts);
```

POST endpoint: `POST /v1/hvs_event` (X-NOIZY-Key auth, payload schema = above row minus `id` and timestamps).

The plug-in posts in batches of 50 events or every 5 seconds, whichever first. Network failure is non-fatal — events queue locally and replay when the gateway returns.

---

## 8. Phase-1 Prototype Scope (v0.1)

**Build only what proves the concept.** Everything below is in scope; everything not here is v0.2+.

| # | Feature | In scope v0.1 |
|---|---|---|
| 1 | Live input meter | ✅ |
| 2 | Rolling waveform (3s window) | ✅ |
| 3 | Contour line overlay | ✅ |
| 4 | Authenticity score (cosine distance from prototype vector) | ✅ |
| 5 | Local session tag output (writes manifest.json) | ✅ |
| 6 | Manual "COMMIT TO VAULT" button | ✅ |
| 7 | Emotion classifier (heuristic 5-bucket if no model yet) | ✅ |
| 8 | Status lights (capture/classify/archive/consent) | ✅ |
| 9 | Project-saved AU state | ✅ |
| 10 | MIDI CC threshold output | ⏸ (v0.2) |
| 11 | Heaven D1 event posting | ⏸ (depends on Heaven existing — Linear NOI-48) |
| 12 | Multi-actor support (more than RSP_001) | ⏸ (v1.0) |

---

## 9. Roadmap from v0.1 to v1.0

### v0.1 — Phase 1 Prototype (THIS BUILD)

- Swift package + AUv3 component bundle
- 6-pane UI (read-only)
- Local manifest writer
- Cosine-distance authenticity
- Heuristic emotion classifier
- Reuses shared `NOIZYConsent` module (already built today: ConsentToken, ConsentGatewayClient, OfflineCache)

### v0.2 — Trained models + MIDI bridge

- Voice DNA enrollment session (Linear NOI-25/NOI-54) → real authenticity prototype vector
- 5-class emotion model trained in Create ML on Fish Music Inc archive
- MIDI CC output to Logic Scripter
- Live A/B against catalog excerpts

### v0.3 — Heaven integration

- Posts events to D1 via `POST /v1/hvs_event`
- Reads live consent state from Consent Gateway
- Surfaces revocation events as red flash on the consent status light
- Wisdom Capsule lineage links per session

### v0.4 — Swarm dispatch

- Routes "interesting" tags to GABRIEL Swarm Panel for agent attention
- LUCY auto-logs vault commits to DAZEFLOW
- POPS reviews lineage at end of session
- SHIRL surfaces emotional/style notes

### v1.0 — Multi-actor + Guild ready

- Per-actor prototype vectors stored in Heaven KV
- Union-compliant export bundle (every Guild member can show their own contour history)
- 100-year archive integration with Aquarium Eternal Vault
- Public presentation: "this is what HVS sounds like"

---

## 10. Shared Infrastructure (already built today)

The Swift code I shipped earlier in this session is **immediately reusable** for HVS Live Contour:

| File | Reused for HVS Contour |
|---|---|
| `Sources/NOIZYConsentHUD/ConsentToken.swift` | Identical schema. Move to a shared `NOIZYConsent` Swift package, depend on it from both AUv3 plug-ins. |
| `Sources/NOIZYConsentHUD/ConsentGatewayClient.swift` | The gateway client is identical for both. Move to shared package. |
| `Sources/NOIZYConsentHUD/OfflineCache.swift` | Same fail-mode policy. Same audio-thread-safe pattern. Move to shared package. |

**Refactor target:**

```
~/NOIZYANTHROPIC/
├── auv3-shared-noizy-consent/    ← NEW Swift package (extracted from auv3-consent-hud)
│   └── Sources/NOIZYConsent/
│       ├── ConsentToken.swift
│       ├── ConsentGatewayClient.swift
│       └── OfflineCache.swift
├── auv3-consent-hud/             ← imports NOIZYConsent
│   └── Sources/NOIZYConsentHUD/
│       └── (consent visualizer specific UI)
└── auv3-hvs-live-contour/        ← NEW, imports NOIZYConsent
    └── Sources/NOIZYHVSLiveContour/
        ├── HVSContourEngine.swift
        ├── AuthenticityScorer.swift
        ├── EmotionClassifier.swift
        ├── SessionManifest.swift
        ├── HVSLiveContourAudioUnit.swift   (the AUAudioUnit)
        └── HVSLiveContourView.swift        (the SwiftUI view)
```

---

## 11. Open Questions for RSP_001

Before I write the v0.1 Swift code, I need:

1. **Voice DNA enrollment** — has it happened yet? Linear NOI-25/NOI-54 are still backlog. Without 30+ enrolled samples, the authenticity prototype vector is empty and the score is meaningless.
2. **Bundle ID confirmation** — `ai.noizy.hvs-live-contour` OK, or different reverse-DNS preference?
3. **Logic project test session** — do you have a Logic project I can target as the integration test? Or should the v0.1 ship with a synthetic test session?
4. **Phase-1 ship deadline** — is the April 13 DreamChamber dress rehearsal (Linear NOI-56) the soft target, or April 17 hard?

Answers and I write the Swift package next turn.
