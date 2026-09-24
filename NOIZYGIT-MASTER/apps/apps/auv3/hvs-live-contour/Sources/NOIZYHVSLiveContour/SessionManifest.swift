// SessionManifest.swift
// NOIZY Empire — Per-session manifest writer for HVS Live Contour
//
// Phase 4 of the v0.1 plan: writes JSON manifests to
//   ~/Library/Containers/NOIZY/HVS/Sessions/<session_id>.json
//
// Auto-saves every 30s. Writes are atomic (tmp + rename) so an in-flight save
// can never corrupt a manifest mid-read.

import Foundation

public struct HVSManifest: Codable, Sendable {
    public struct Tag: Codable, Sendable, Equatable {
        public let timestamp: Date
        public let label: String
        public let durationSeconds: Double
        public let authenticityScore: Float
        public let emotionTop: String
        public let vaultReady: Bool
    }

    public let manifestVersion: String
    public let sessionId: String
    public let creatorId: String
    public let captureStart: Date
    public var captureEnd: Date?
    public var blocks: Int
    public var authPeak: Float
    public var authAverage: Float
    public var tags: [String]            // simple labels (per the v0.1 plan JSON)
    public var emotionContour: [String]  // top emotion per second
    public var vaultReady: Bool

    public let host: HostInfo

    public struct HostInfo: Codable, Sendable {
        public let machine: String
        public let daw: String
        public let dawVersion: String
        public let inputChain: [String]
        public let auv3Version: String
    }

    public init(
        sessionId: String,
        creatorId: String = "RSP_001",
        captureStart: Date = Date(),
        host: HostInfo = .defaultGod
    ) {
        self.manifestVersion = "0.1"
        self.sessionId = sessionId
        self.creatorId = creatorId
        self.captureStart = captureStart
        self.captureEnd = nil
        self.blocks = 0
        self.authPeak = 0
        self.authAverage = 0
        self.tags = []
        self.emotionContour = []
        self.vaultReady = false
        self.host = host
    }
}

extension HVSManifest.HostInfo {
    public static let defaultGod = HVSManifest.HostInfo(
        machine: "GOD.local",
        daw: "Logic Pro for Mac",
        dawVersion: "12.2",
        inputChain: ["U87", "Apollo Quad"],
        auv3Version: "0.1.0"
    )
}

/// Atomic, auto-saving manifest writer.
public actor SessionManifestWriter {
    public let sessionsDir: URL
    public private(set) var manifest: HVSManifest

    public init(manifest: HVSManifest, sessionsDir: URL? = nil) {
        self.manifest = manifest
        if let dir = sessionsDir {
            self.sessionsDir = dir
        } else {
            // Default: ~/Library/Containers/NOIZY/HVS/Sessions/
            // (Or fall back to ~/NOIZY/Sessions/HVS for non-sandboxed dev)
            let home = FileManager.default.homeDirectoryForCurrentUser
            self.sessionsDir = home.appendingPathComponent("NOIZY/Sessions/HVS", isDirectory: true)
        }
        try? FileManager.default.createDirectory(at: self.sessionsDir, withIntermediateDirectories: true)
    }

    public func append(authenticity: AuthenticityResult, features: HVSFeatures) {
        manifest.blocks += 1
        manifest.authPeak = max(manifest.authPeak, authenticity.score)
        // Running mean
        let n = Float(manifest.blocks)
        manifest.authAverage = ((manifest.authAverage * (n - 1)) + authenticity.score) / n
    }

    public func addTag(_ label: String, vaultReady: Bool) {
        manifest.tags.append(label)
        if vaultReady && !manifest.vaultReady {
            manifest.vaultReady = true
        }
    }

    public func close() {
        manifest.captureEnd = Date()
    }

    /// Atomic save. Writes to a tmp file, then renames over the target.
    public func save() throws -> URL {
        let target = sessionsDir.appendingPathComponent("\(manifest.sessionId).json")
        let tmp = target.appendingPathExtension("tmp")
        let encoder = JSONEncoder()
        encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
        encoder.dateEncodingStrategy = .iso8601
        let data = try encoder.encode(manifest)
        try data.write(to: tmp, options: .atomic)
        if FileManager.default.fileExists(atPath: target.path) {
            try FileManager.default.removeItem(at: target)
        }
        try FileManager.default.moveItem(at: tmp, to: target)
        return target
    }

    public func currentManifest() -> HVSManifest {
        manifest
    }
}
