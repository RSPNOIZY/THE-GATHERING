// AuthenticityScorer.swift
// NOIZY Empire — RSP_001 authenticity scoring (v0.1 = cosine distance from prototype)
//
// v0.1: cosine distance from a single prototype vector built by averaging
//       enrolled Voice DNA samples. No ML model needed yet.
// v0.2: Create ML 1-class SVM trained on the enrollment session (Linear NOI-25/NOI-54)
// v0.3: Multi-actor — separate prototype per actor_id
//
// Threshold: 0.94 = "RSP_001 resonance detected" per the implementation plan.

import Foundation

public struct AuthenticityResult: Sendable, Equatable {
    public enum Verdict: String, Sendable {
        case rspResonance     // > 0.94 → green
        case likely           // 0.80 - 0.94 → yellow
        case unverified       // < 0.80 → red
        case insufficientData // no prototype yet
    }

    public let score: Float                  // 0...1
    public let verdict: Verdict
    public let timestamp: Date
    public let prototypeAge: TimeInterval?   // age of the prototype vector at scoring time
}

public actor AuthenticityScorer {
    public let actorId: String

    /// The prototype vector for this actor — the centroid of enrolled samples.
    /// In v0.1 this is empty until Voice DNA enrollment happens.
    private var prototype: [Float]?
    private var prototypeBuiltAt: Date?

    private let resonanceThreshold: Float
    private let likelyThreshold: Float

    public init(
        actorId: String = "RSP_001",
        resonanceThreshold: Float = 0.94,
        likelyThreshold: Float = 0.80
    ) {
        self.actorId = actorId
        self.resonanceThreshold = resonanceThreshold
        self.likelyThreshold = likelyThreshold
    }

    /// Set the prototype vector. Called once after enrollment.
    public func setPrototype(_ vector: [Float]) {
        self.prototype = vector
        self.prototypeBuiltAt = Date()
    }

    /// Load a prototype from a JSON file produced by Tools/enroll_voice_dna.py.
    /// Returns true on success.
    @discardableResult
    public func loadPrototype(from url: URL) -> Bool {
        guard let data = try? Data(contentsOf: url),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let proto = json["prototype"] as? [Double] else {
            return false
        }
        let vector = proto.map { Float($0) }
        guard !vector.isEmpty else { return false }
        self.prototype = vector
        self.prototypeBuiltAt = Date()
        return true
    }

    /// Load the default `prototype_RSP_001.json` from the package Resources directory
    /// or the AUv3 extension's bundle.
    @discardableResult
    public func loadDefaultPrototype() -> Bool {
        // Try common locations in order:
        let homeURL = FileManager.default.homeDirectoryForCurrentUser
        let candidates: [URL] = [
            homeURL.appendingPathComponent("NOIZYANTHROPIC/auv3-hvs-live-contour/Resources/prototype_\(actorId).json"),
            homeURL.appendingPathComponent("NOIZY/Prototypes/prototype_\(actorId).json"),
            URL(fileURLWithPath: "/Library/NOIZY/Prototypes/prototype_\(actorId).json"),
        ]
        for url in candidates {
            if loadPrototype(from: url) { return true }
        }
        return false
    }

    /// Score a feature vector against the prototype.
    public func score(_ features: HVSFeatures) -> AuthenticityResult {
        guard let proto = prototype, !proto.isEmpty else {
            return AuthenticityResult(
                score: 0,
                verdict: .insufficientData,
                timestamp: features.timestamp,
                prototypeAge: nil
            )
        }

        // Convert features → vector for cosine comparison.
        // v0.1 uses a tiny 5-dim feature vector. v0.2 uses MFCCs.
        let current: [Float] = [
            features.rms,
            features.peak,
            features.spectralCentroid / 10000.0,    // normalize to ~0...1
            features.zeroCrossingRate,
            features.pitch / 1000.0,
        ]

        let dim = min(proto.count, current.count)
        guard dim > 0 else {
            return AuthenticityResult(score: 0, verdict: .unverified, timestamp: features.timestamp, prototypeAge: nil)
        }

        var dot: Float = 0
        var magA: Float = 0
        var magB: Float = 0
        for i in 0..<dim {
            dot += current[i] * proto[i]
            magA += current[i] * current[i]
            magB += proto[i] * proto[i]
        }
        let denom = sqrt(magA) * sqrt(magB)
        let cosineSim = denom > 0 ? dot / denom : 0
        let normalizedScore = max(0, min(1, (cosineSim + 1) / 2))  // map [-1,1] → [0,1]

        let verdict: AuthenticityResult.Verdict
        if normalizedScore >= resonanceThreshold      { verdict = .rspResonance }
        else if normalizedScore >= likelyThreshold    { verdict = .likely }
        else                                          { verdict = .unverified }

        let age = prototypeBuiltAt.map { Date().timeIntervalSince($0) }

        return AuthenticityResult(
            score: normalizedScore,
            verdict: verdict,
            timestamp: features.timestamp,
            prototypeAge: age
        )
    }
}
