// swift-tools-version: 6.0
// NOIZYConsent — Shared consent kernel client used by every NOIZY AUv3 plug-in.
//
// Importers (today):
//   - auv3-consent-hud           (Consent HUD master-bus visualizer)
//   - auv3-hvs-live-contour      (HVS Live Contour identity meter)
//
// Importers (planned):
//   - auv3-noizyvox-voice-capture
//   - auv3-neuro-acoustic-fx
//
// Author: RSP_001 (orchestrated by Gabriel)
// Spec:   ~/NOIZYANTHROPIC/NOIZYLAB/spec/HVS_LIVE_CONTOUR_AUv3_SPEC.md §10
// Date:   2026-04-09 · T-8 to April 17

import PackageDescription

let package = Package(
    name: "NOIZYConsent",
    platforms: [
        .macOS(.v15),
        .iOS(.v18),
    ],
    products: [
        .library(
            name: "NOIZYConsent",
            targets: ["NOIZYConsent"]
        ),
    ],
    targets: [
        .target(
            name: "NOIZYConsent",
            path: "Sources/NOIZYConsent"
        ),
        .testTarget(
            name: "NOIZYConsentTests",
            dependencies: ["NOIZYConsent"],
            path: "Tests/NOIZYConsentTests"
        ),
    ]
)
