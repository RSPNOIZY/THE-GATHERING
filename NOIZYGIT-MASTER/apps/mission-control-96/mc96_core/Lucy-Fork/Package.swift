// swift-tools-version: 6.0
// Heaven — DreamChamber Voice App for iPad & iPhone
// NOIZY Empire | RSP Accessibility Platform

import PackageDescription

let package = Package(
    name: "Heaven",
    platforms: [
        .iOS(.v18),
        .macOS(.v15)
    ],
    products: [
        .library(name: "HeavenCore", targets: ["HeavenCore"]),
        .library(name: "HeavenUI", targets: ["HeavenUI"]),
    ],
    dependencies: [
        // Networking
        .package(url: "https://github.com/Alamofire/Alamofire.git", from: "5.9.0"),
        // WebSocket (for DreamChamber real-time)
        .package(url: "https://github.com/daltoniam/Starscream.git", from: "4.0.0"),
        // Async image loading
        .package(url: "https://github.com/onevcat/Kingfisher.git", from: "7.0.0"),
        // Swift Concurrency extras
        .package(url: "https://github.com/apple/swift-async-algorithms", from: "1.0.0"),
    ],
    targets: [
        .target(
            name: "HeavenCore",
            dependencies: [
                "Alamofire",
                "Starscream",
                .product(name: "AsyncAlgorithms", package: "swift-async-algorithms"),
            ],
            path: "Heaven/Sources/Core"
        ),
        .target(
            name: "HeavenUI",
            dependencies: ["HeavenCore", "Kingfisher"],
            path: "Heaven/Sources/UI"
        ),
        .testTarget(
            name: "HeavenTests",
            dependencies: ["HeavenCore"],
            path: "HeavenTests"
        ),
    ]
)
