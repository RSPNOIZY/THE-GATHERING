// swift-tools-version: 6.0

import PackageDescription

let package = Package(
    name: "noizy-macos-bridge",
    platforms: [
        .macOS(.v13)
    ],
    products: [
        .executable(name: "noizy-macos-bridge", targets: ["NOIZYMacOSBridge"])
    ],
    targets: [
        .target(
            name: "NOIZYMacOSBridgeCore",
            swiftSettings: [
                .enableUpcomingFeature("ExistentialAny")
            ]
        ),
        .executableTarget(
            name: "NOIZYMacOSBridge",
            dependencies: ["NOIZYMacOSBridgeCore"]
        ),
        .testTarget(
            name: "NOIZYMacOSBridgeCoreTests",
            dependencies: ["NOIZYMacOSBridgeCore"]
        )
    ]
)
