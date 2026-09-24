# Apple Developer Sovereign Copilot Upgrade

Version: 2.5.0
Date: 2026-08-28
Status: implementation blueprint and safety correction

This upgrade converts the Apple Developer intelligence packet into a production
direction that fits the NOIZY / MC96 architecture without overstating platform
permissions or runtime guarantees.

The central decision holds: LUCY should not become a navigation renderer. Waze,
Apple Maps, Honda systems, and CarPlay own the driving surface. LUCY should be the
voice and glanceable companion layer. GABRIEL should remain the gatekeeper. The M2
Ultra remains the local reasoning and receipt authority.

## Architecture

```
iPhone / iPad / Mac
  App Intents + Shortcuts + Spotlight + Siri
        |
        v
LUCY Apple Client
  Foundation Models local prefiltering
  Live Activities / widgets
  CarPlay templates where entitlement-appropriate
        |
        v
GABRIEL Local / Edge Gate
  consent check
  policy receipt
  route metric lookup
  approval queue
        |
        v
External systems
  Google Routes API for numeric ETA/distance metrics
  Waze or Apple navigation app for route rendering
  Harmony ledger Worker for consent and receipts
```

## Apple Source-Checked Corrections

| Claim | Corrected Build Position |
| --- | --- |
| App Intents expose LUCY/GABRIEL to Siri, Spotlight, Shortcuts, widgets, controls, and Apple Intelligence. | Yes. Implement read-only and proposal intents first. Sensitive actions must require confirmation and MC96 receipt challenge before execution. |
| Action Button and side button are universal launch surfaces. | Action Button shortcuts are broadly useful on supported devices. The voice-based conversational app side-button path is Japan-only and requires the Side Button Access entitlement. |
| Live Activities are valid for CarPlay. | Yes. Apple documents Live Activities on Lock Screen, Dynamic Island, CarPlay, paired Apple Watch, and Mac. Use them for glanceable status, not decision-heavy controls. |
| Foundation Models can replace external inference. | No. They are ideal for on-device summarization, extraction, filtering, and structured output. Use Private Cloud Compute or server providers only when the policy router allows escalation. |
| CarPlay templates can render any custom cockpit. | No. CarPlay uses Apple templates and entitlement-bound categories. Use list/info templates for appropriate categories and avoid custom unsafe driving UI. |
| CarPlay video is available whenever parked. | Only in supported cars and with the relevant video/AirPlay/CarPlay capability. If video is unavailable, the app must degrade to audio-only or summary mode. |
| LUCY can inject navigation into CarPlay. | Not silently. A user-visible tap or native navigation app handoff is required. LUCY may prepare a handoff, never covertly steer the vehicle UI. |

## Production Rules

1. LUCY App Intents are command surfaces, not authority surfaces.
2. Any payout, contract, catalog, biometric, voice, identity, vehicle-control, or
   publish action must return a pending approval receipt unless a separate exact
   approval exists.
3. Foundation Models may process private text locally on device, but cannot create
   a new external data transfer.
4. Siri/App Intents responses must report current verified state, not aspirational
   certification language.
5. Live Activities can show mission, ETA, traffic delta, receipt status, and pending
   approval counts. They must not expose secrets, coordinates by default, raw route
   polylines, biometric references, or private catalog details.
6. CarPlay templates should be sparse: mission, ETA/delay, approval count, and a
   handoff button. No scrolling command centers while driving.
7. Parked video must be entitlement and vehicle-support gated. Drive mode falls back
   to audio or a brief text summary.

## Implementation Targets

| Component | Upgrade |
| --- | --- |
| `NOIZY-iOS-Native/LucyIntents.swift` | Replace static victory claims with policy-aware read-only/proposal App Intents. |
| `NOIZY-iOS-Native/Widgets/LucyLiveActivity.swift` | Treat Live Activities as safe state projection with no secrets, no raw coordinates, and no approvals executed in-widget. |
| `NOIZY-iOS-Native/CarPlaySceneDelegate.swift` | Keep Apple template UI. Make Waze handoff explicit and avoid direct approval execution. |
| `config/inference-policy.json` | Add Apple local prefilter lane, App Intent action gates, CarPlay data redaction, and video entitlement caveats. |
| `scripts/verify-mc96-noizyworld.sh` | Verify Apple files and fail if aspirational certification strings return. |

## App Intent Plan

Safe now:

- `LucyBriefingIntent`: read latest local briefing summary.
- `GabrielApprovalQueueIntent`: summarize pending approvals.
- `ProtectCatalogIntent`: request or confirm catalog lock state.
- `RunGovernanceReviewIntent`: request a local/edge audit summary.
- `PrepareNavigationHandoffIntent`: generate a user-tap navigation handoff receipt.

Approval required:

- Catalog lock mutation.
- Release approval.
- Payout or royalty settlement.
- Voice synthesis, cloning, or biometric binding.
- Vehicle remote action.
- Publishing or public sharing.
- External provider transfer involving private data.

Blocked:

- Silent CarPlay navigation injection.
- Video playback while motion is detected.
- Turning Siri/App Intents into a hidden admin console.
- Exposing exact coordinates or raw route geometry in public/glanceable surfaces.

## Foundation Models Lane

Use on-device Foundation Models for:

- Short briefing compression.
- Intent classification.
- Entity extraction from local notes.
- Glanceable summary formatting.
- Safety filter prechecks.
- Structured JSON drafting for MC96 receipts.

Do not use this lane for:

- Legal or financial conclusions.
- Autonomous approvals.
- Biometric enrollment.
- Voice clone authorization.
- Payment authorization.
- External publication.

## Live Activity State Contract

Allowed fields:

- `topMission`
- `destinationName`
- `etaMinutes`
- `trafficDeltaMinutes`
- `pendingApprovalsCount`
- `receiptStatus`
- `vehicleStateSummary`

Redacted fields:

- exact coordinates
- raw route polyline
- session tokens
- sovereign keys
- biometric identifiers
- catalog private names
- private financial data

## Verification Standard

The Apple integration is considered ready only when:

1. Swift source avoids static "100% certified" claims.
2. Sensitive App Intents return a pending approval/challenge, not execution.
3. The inference policy declares Apple on-device as local-only.
4. The CarPlay delegate has no silent navigation execution path.
5. The Live Activity contract contains no raw coordinates, secrets, or biometrics.
6. The repo verifier proves these with tests, not banner text.

## Official Apple Sources

- App Intents:
  `https://developer.apple.com/documentation/appintents`
- App Intents updates:
  `https://developer.apple.com/documentation/Updates/AppIntents`
- Apple Intelligence and Siri AI:
  `https://developer.apple.com/documentation/appintents/apple-intelligence-and-siri-ai`
- Foundation Models:
  `https://developer.apple.com/documentation/FoundationModels`
- Live Activities:
  `https://developer.apple.com/documentation/widgetkit/liveactivities-collection`
- Displaying live data with Live Activities:
  `https://developer.apple.com/documentation/activitykit/displaying-live-data-with-live-activities`
- CarPlay:
  `https://developer.apple.com/carplay/`
  and `https://developer.apple.com/documentation/carplay/`
- CPListTemplate:
  `https://developer.apple.com/documentation/carplay/cplisttemplate`
- CPInformationTemplate:
  `https://developer.apple.com/documentation/carplay/cpinformationtemplate`
- Voice-based conversational app side button:
  `https://developer.apple.com/documentation/appintents/launching-your-voice-based-conversational-app-from-the-side-button-of-iphone`
