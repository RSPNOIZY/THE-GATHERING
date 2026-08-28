# HVS Live Contour AUv3 — Xcode Build Steps

> **Status:** Swift package skeleton built by Gabriel 2026-04-09. Compiles standalone.
> **Spec:** `~/NOIZYANTHROPIC/NOIZYLAB/spec/HVS_LIVE_CONTOUR_AUv3_SPEC.md`
> **Plan:** `~/NOIZYANTHROPIC/NOIZYLAB/spec/HVS_LIVE_CONTOUR_IMPLEMENTATION_PLAN_v0.1.md`

The Swift Package compiles every type, model, and the `HVSBridgeAudioUnit` shell. **What it does NOT do** is bundle as an AUv3 App Extension that Logic Pro for Mac can load — that requires an Xcode App + Audio Unit Extension target with a specific Info.plist. Below is exactly what to click in Xcode.

## What's already shipped (no Xcode needed)

```
~/NOIZYANTHROPIC/auv3-shared-noizy-consent/   ← shared Swift package
└── Sources/NOIZYConsent/
    ├── ConsentToken.swift            (mirrors Heaven D1 schema)
    ├── ConsentGatewayClient.swift    (async/await Heaven client)
    └── OfflineCache.swift            (audio-thread-safe cache)

~/NOIZYANTHROPIC/auv3-hvs-live-contour/        ← HVS Swift package
├── Package.swift                     (depends on NOIZYConsent)
└── Sources/NOIZYHVSLiveContour/
    ├── HVSFeatures.swift             (vDSP/Accelerate DSP extractor)
    ├── AuthenticityScorer.swift      (cosine distance from prototype)
    ├── SessionManifest.swift         (atomic JSON writer)
    └── HVSBridgeAudioUnit.swift      (AUAudioUnit shell — passthrough)
```

Verify it compiles standalone:

```bash
cd ~/NOIZYANTHROPIC/auv3-shared-noizy-consent
swift build

cd ~/NOIZYANTHROPIC/auv3-hvs-live-contour
swift build
```

## What you need to click in Xcode

### 1. Create a new Xcode project

- File → New → Project → macOS → **App** (host app for the AUv3)
- Product Name: **HVSLiveContourHost**
- Team: your Apple Developer team
- Organization Identifier: `ai.noizy`
- Interface: **SwiftUI**
- Language: **Swift**
- Save to: `~/NOIZYANTHROPIC/auv3-hvs-live-contour-xcode/`

### 2. Add the Audio Unit Extension target

- File → New → Target → macOS → **Audio Unit Extension**
- Product Name: **HVSBridge**
- Audio Unit Type: **Effect**
- Subtype Code: `Hvsl` (must be 4 chars)
- Manufacturer Code: `NOIZ` (must be 4 chars — your dev account's code, you can use NOIZ until you register one)
- Embed In Application: **HVSLiveContourHost**

### 3. Wire the Swift packages as dependencies

- Select the Xcode project in the navigator → **Package Dependencies** tab
- Click `+` → **Add Local...**
- Navigate to `~/NOIZYANTHROPIC/auv3-shared-noizy-consent` → Add Package
- Click `+` again → **Add Local...** → `~/NOIZYANTHROPIC/auv3-hvs-live-contour` → Add Package
- For each target (`HVSLiveContourHost` AND `HVSBridge`):
  - General tab → Frameworks, Libraries, and Embedded Content
  - Add `NOIZYConsent` (from auv3-shared-noizy-consent)
  - Add `NOIZYHVSLiveContour` (from auv3-hvs-live-contour) — only on the HVSBridge target

### 4. Replace the Audio Unit Extension's auto-generated AUAudioUnit subclass

Xcode will have created `HVSBridgeAudioUnit.swift` (or similar) inside the HVSBridge target. **Delete that file** and instead make the extension's `AUAudioUnitFactory` return our class:

```swift
// HVSBridgeAudioUnitFactory.swift  (in the HVSBridge target)
import CoreAudioKit
import NOIZYHVSLiveContour

@available(macOS 15.0, iOS 18.0, *)
public class HVSBridgeAudioUnitFactory: NSObject, AUAudioUnitFactory {
    public func createAudioUnit(with desc: AudioComponentDescription) throws -> AUAudioUnit {
        return try HVSBridgeAudioUnit(componentDescription: desc, options: [])
    }
}
```

### 5. Edit the HVSBridge target's Info.plist

The auto-generated Info.plist has an `AudioComponents` array. Verify these keys:

- `factoryFunction` → `HVSBridgeAudioUnitFactory`
- `manufacturer` → `NOIZ`
- `subtype` → `Hvsl`
- `type` → `aufx` (effect)
- `name` → `NOIZY: HVS Live Contour`
- `version` → `0.1.0`

### 6. Build & run

- Select the **HVSLiveContourHost** scheme → ⌘R
- The host app launches; the AUv3 is now registered with the OS
- Quit the host app — the AUv3 stays registered
- Open **Logic Pro for Mac**
- New project → Audio track → Mixer → Audio FX slot → **Audio Units → NOIZY → HVS Live Contour**
- Play audio through the track. You should hear it pass through unchanged.
- The AUv3's view will show the analysis (when we wire the SwiftUI view in Phase 3)

### 7. Enroll RSP_001 (Phase 2 — required for non-zero authenticity)

Until Voice DNA enrollment happens, `AuthenticityScorer.score()` returns `.insufficientData` because the prototype vector is empty. To enroll:

```swift
// One-time, after recording 30+ samples of RSP_001
let enrollmentVectors: [[Float]] = loadVoiceDNAVectors()
let prototype = averageVectors(enrollmentVectors)
await scorer.setPrototype(prototype)
// Persist to UserDefaults or a file in the app's container
```

This blocks on Linear NOI-25 / NOI-54 (the first Voice DNA session task).

## What's still TODO after the Xcode steps

| Phase | Work | Owner |
|---|---|---|
| 2 | Train the v0.1 emotion classifier in Create ML on Fish Music Inc archive | RSP_001 (offline) |
| 2 | Convert PyTorch HVS classifier to Core ML via coremltools | RSP_001 (offline) |
| 3 | Build the SwiftUI view (`HVSLiveContourView.swift`) — Metal renderer, contour graph, badge, tag queue | Gabriel (next session) |
| 4 | Wire `commitToVault()` → button → R2 upload | Gabriel + Heaven (when NOI-48 ships) |
| 5 | Logic project test session | RSP_001 |

## Verification checklist (per the v0.1 plan)

- [ ] Rolling contour updates < 50ms
- [ ] Auth score stable on repeated takes
- [ ] JSON export valid + `vault_ready=true`
- [ ] No network calls (Instruments verify)
- [ ] Dark mode sanctuary aesthetic
