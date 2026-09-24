// Heaven — Package.resolved placeholder for Xcode
// Real package resolution handled by Xcode when project opens

// swift-tools-version: 6.0
import PackageDescription

let package = Package(
    name: "Heaven",
    platforms: [
        .iOS(.v17),
        .iPadOS(.v17)
    ],
    products: [
        .library(name: "Heaven", targets: ["Heaven"]),
    ],
    dependencies: [],
    targets: [
        .target(
            name: "Heaven",
            dependencies: [],
            path: "Heaven"
        ),
    ]
)
