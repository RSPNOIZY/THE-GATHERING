// swift-tools-version: 6.0
// NOIZYConsentHUD — AUv3 master-bus Consent Gateway visualizer for Logic Pro for Mac
//
// Author: RSP_001 (orchestrated by Gabriel)
// Spec:   ~/NOIZYANTHROPIC/NOIZYLAB/spec/DREAMCHAMBER_5_FRESH_IDEAS.md §1
// Date:   2026-04-09 · T-8 to April 17

import PackageDescription

let package = Package(
    name: "NOIZYConsentHUD",
    platforms: [
        .macOS(.v15),
        .iOS(.v18),
    ],
    products: [
        .library(
            name: "NOIZYConsentHUD",
            targets: ["NOIZYConsentHUD"]
        ),
    ],
    targets: [
        .target(
            name: "NOIZYConsentHUD",
            path: "Sources/NOIZYConsentHUD"
        ),
        .testTarget(
            name: "NOIZYConsentHUDTests",
            dependencies: ["NOIZYConsentHUD"],
            path: "Tests/NOIZYConsentHUDTests"
        ),
    ]
)
