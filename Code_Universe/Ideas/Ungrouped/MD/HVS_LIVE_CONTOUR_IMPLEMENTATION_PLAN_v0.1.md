# HVS Live Contour AUv3 — Implementation Plan v0.1

> **Author:** RSP_001 (delivered 2026-04-09)
> **Captured by Gabriel:** 2026-04-09T16:00 · T-8 to April 17
> **Companion docs:** `HVS_LIVE_CONTOUR_AUv3_SPEC.md` (product spec) · `CREATOR_OS_MASTER.md` (architecture)
> **Status:** Approved · Phases 0-1-3-4 scaffolded by Gabriel this turn

The 48-hour plan to ship the v0.1 prototype. Local-first, signal-first, RSP_001 sovereignty as the heartbeat. Xcode-ready, Neural Engine optimized.

## Build Prerequisites

- **Xcode 17+** (M2 Ultra native) — verified 26.x present on GOD
- **AudioKit AUv3 template** (or Apple AUv3 starter)
- **Core ML model** — convert v0.1 HVS classifier (PyTorch → Core ML via coremltools) — OFFLINE WORK
- **Test rig** — Logic Pro for Mac + Apollo Quad + U87 (GOD node)

**Time estimate:** 12-16 hours core build + 8 hours test/refine.

## Phase 0 — AUv3 Skeleton (2 hours)

```swift
// HVSBridge.swift — Main AUv3 entry
import AVFoundation
import CoreAudioKit
import CoreML

class HVSBridge: AUAudioUnit {
    override func createViewController() -> AUAudioUnitViewController {
        return HVSViewController(auAudioUnit: self)
    }
}
```

- Scaffold with Apple's AUv3 template
- Passthrough audio (zero latency)
- Dark UI theme (sanctuary aesthetic)

## Phase 1 — Audio Processing Loop (4 hours)

```swift
func processBuffers(_ bufferList: UnsafeMutableAudioBufferListPointer) {
    let downsampled = resampleTo16kHz(bufferList)
    let features = extractHVSFeatures(downsampled)
    let result = hvsModel.predict(features)
    updateUI(result)
    sessionEmitter.append(result)
}
```

- 512-sample buffers @ 44.1 kHz → 16 kHz downsample
- Feature extract: spectral centroid · RMS envelope · zero-crossings
- UI thread-safe updates

## Phase 2 — Core ML Model v0.1 (3 hours · OFFLINE)

```python
# PyTorch → Core ML (offline script)
class HVSClassifier(nn.Module):
    def forward(self, x):
        return torch.sigmoid(self.fc(x))   # 0-1 authenticity
```

**Deployed features:**
- Timbre stability (centroid var < 0.05)
- Phrasing dynamics (envelope modulation)
- Cadence fingerprint (BPM-like regularity)
- **Threshold: 0.90+ = "RSP_001 resonance detected"**

## Phase 3 — UI Implementation (4 hours)

**Metal renderer for contour graph:**
- Rolling 30s waveform (512×128 px canvas)
- Contour overlay (Bezier curve from model output)
- Auth badge: SwiftUI Circle with gradient ring
- Tag queue: Scrollable list (5 max)
- Status lights: SF Symbols glow effect

**Commit button:**
- Serializes JSON manifest
- Writes to `~/Library/Containers/NOIZY/HVS/Sessions/`
- Preps Logic marker export

## Phase 4 — Session Emitter & Manifest (2 hours)

```json
{
  "creator_id": "RSP_001",
  "session_id": "studio_take_004",
  "capture_start": "2026-04-09T15:53:00Z",
  "blocks": 147,
  "auth_peak": 0.947,
  "tags": ["hvs:stable", "cadence:confident"],
  "vault_ready": true
}
```

- Auto-save every 30s (local only)
- Logic project association via file hash

## Phase 5 — Logic Integration & Test (3 hours)

- Insert on master bus / vocal chain
- Verify zero audio alteration (passthrough)
- Session reload persistence
- Bounce test: embed manifest reference in metadata
- Live mic test: U87 → 94%+ score on known RSP_001 phrase

**Validation checklist:**
- [ ] Rolling contour updates < 50ms
- [ ] Auth score stable on repeated takes
- [ ] JSON export valid + `vault_ready=true`
- [ ] No network calls (Instruments verify)
- [ ] Dark mode sanctuary aesthetic

## D1 Extension Hook (Post-v0.1)

```swift
// Optional: user-triggered after Commit
func pushToD1(manifest: HVSManifest) {
    // Heaven API: POST /hvs_events
    // Zero Trust token from Keychain
}
```

## Success Gates

1. **Live demo:** U87 phrase → green auth ring → "RSP_001 resonance" → vault commit
2. **Logic roundtrip:** Insert → session save/load → manifest persists
3. **Signal purity:** Instruments shows Neural Engine usage, no cloud

## Next Deliverables (Post-Prototype)

1. GABRIEL Swarm contract (JSON schema consumption)
2. GORUNFREE binding (`hyperloop archive session`)
3. AUv3 .pkg installer for Logic deployment

## Files to generate

- `HVSBridge.xcodeproj`
- `hvs_model.mlmodel` (v0.1)
- `Sessions/` sample manifest
- Test Logic project
