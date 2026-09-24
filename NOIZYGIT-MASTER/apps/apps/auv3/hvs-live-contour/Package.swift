// swift-tools-version: 6.0
// NOIZYHVSLiveContour — AUv3 master-bus / vocal-track Live HVS visualizer for Logic Pro for Mac
//
// Author: RSP_001 (orchestrated by Gabriel)
// Spec:   ~/NOIZYANTHROPIC/NOIZYLAB/spec/HVS_LIVE_CONTOUR_AUv3_SPEC.md
// Plan:   ~/NOIZYANTHROPIC/NOIZYLAB/spec/HVS_LIVE_CONTOUR_IMPLEMENTATION_PLAN_v0.1.md
// Date:   2026-04-09 · T-8 to April 17

import PackageDescription

let package = Package(
    name: "NOIZYHVSLiveContour",
    platforms: [
        .macOS(.v15),
        .iOS(.v18),
    ],
    products: [
        .library(
            name: "NOIZYHVSLiveContour",
            targets: ["NOIZYHVSLiveContour"]
        ),
    ],
    dependencies: [
        .package(path: "../auv3-shared-noizy-consent"),
    ],
    targets: [
        .target(
            name: "NOIZYHVSLiveContour",
            dependencies: [
                .product(name: "NOIZYConsent", package: "auv3-shared-noizy-consent"),
            ],
            path: "Sources/NOIZYHVSLiveContour"
        ),
        .testTarget(
            name: "NOIZYHVSLiveContourTests",
            dependencies: ["NOIZYHVSLiveContour"],
            path: "Tests/NOIZYHVSLiveContourTests"
        ),
    ]
)
