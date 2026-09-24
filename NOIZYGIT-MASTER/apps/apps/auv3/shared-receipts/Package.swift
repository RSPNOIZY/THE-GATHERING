// swift-tools-version: 6.0
// NOIZYReceipts — The Receipt Spine. Append-only, hash-chained, dual-stored.
//
// Used by every NOIZY component that produces auditable events:
//   - auv3-hvs-live-contour       (voice_capture, session events, vault_commit)
//   - auv3-consent-hud            (consent_check, revocation)
//   - SUPERSONIC host app         (boot, lineage_link, kill_switch)
//   - Heaven worker mirror        (royalty_event, synthesis)
//
// Architecture: ~/NOIZYANTHROPIC/NOIZYLAB/spec/RECEIPT_SPINE.md
//
// Author: RSP_001 (orchestrated by Gabriel)
// Date:   2026-04-09 · T-8 to April 17

import PackageDescription

let package = Package(
    name: "NOIZYReceipts",
    platforms: [
        .macOS(.v15),
        .iOS(.v18),
    ],
    products: [
        .library(
            name: "NOIZYReceipts",
            targets: ["NOIZYReceipts"]
        ),
    ],
    targets: [
        .target(
            name: "NOIZYReceipts",
            path: "Sources/NOIZYReceipts"
            // Note: SQLite is linked via system libsqlite3 — no SPM dependency needed.
            // Apple ships libsqlite3 with macOS/iOS; importing SQLite3 in Swift just works.
        ),
        .testTarget(
            name: "NOIZYReceiptsTests",
            dependencies: ["NOIZYReceipts"],
            path: "Tests/NOIZYReceiptsTests"
        ),
    ]
)
