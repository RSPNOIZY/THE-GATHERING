// swift-tools-version: 6.0
// Lucy — Heaven Worker iOS Wrapper
// Local MCP execution, offline-first, ZeroTrust-anchored

import PackageDescription

let package = Package(
    name: "LucyMCP",
    platforms: [.iOS(.v18)],
    products: [
        .library(name: "LucyMCP", targets: ["LucyMCP"]),
    ],
    dependencies: [],  // Zero deps — pure Apple frameworks only
    targets: [
        .target(
            name: "LucyMCP",
            dependencies: [],
            path: "Sources",
            swiftSettings: [
                .swiftLanguageMode(.v6)
            ]
        ),
        .testTarget(
            name: "LucyMCPTests",
            dependencies: ["LucyMCP"],
            path: "Tests/LucyMCPTests"
        ),
    ]
)
