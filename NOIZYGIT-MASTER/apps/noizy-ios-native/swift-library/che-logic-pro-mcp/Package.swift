// swift-tools-version: 5.9
import PackageDescription

let package = Package(
    name: "CheLogicProMCP",
    platforms: [.macOS(.v13)],
    dependencies: [
        .package(url: "https://github.com/modelcontextprotocol/swift-sdk.git", from: "0.10.0")
    ],
    targets: [
        .executableTarget(
            name: "CheLogicProMCP",
            dependencies: [
                .product(name: "MCP", package: "swift-sdk")
            ],
            path: "Sources/CheLogicProMCP"
        )
    ]
)
