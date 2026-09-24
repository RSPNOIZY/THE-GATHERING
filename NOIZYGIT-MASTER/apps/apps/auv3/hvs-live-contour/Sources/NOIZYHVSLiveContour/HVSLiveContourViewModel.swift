// HVSLiveContourViewModel.swift
// NOIZY Empire — Bridge from the AUAudioUnit's analysis loop to the SwiftUI view.
//
// The AUAudioUnit publishes raw HVSFeatures + AuthenticityResult into this VM at
// ~4 Hz from a background task. The view observes via @Published.
//
// Spec: HVS_LIVE_CONTOUR_AUv3_SPEC.md §2 (UI Layout) + §3 (Signal Flow)

import Foundation
import Combine

@MainActor
public final class HVSLiveContourViewModel: ObservableObject {
    // ── ① Input meter ─────────────────────────────────────────────────
    @Published public private(set) var inputRMS: Float = 0
    @Published public private(set) var inputPeak: Float = 0

    // ── ② Rolling waveform / contour history ─────────────────────────
    /// Most recent ~3s of feature samples for the contour graph.
    /// Cap at 180 entries (3s @ 60 Hz visual update budget).
    @Published public private(set) var contourHistory: [ContourPoint] = []
    public static let contourHistoryCap = 180

    public struct ContourPoint: Equatable, Sendable {
        public let t: Date
        public let rms: Float
        public let centroidNormalized: Float   // 0...1
        public let authenticity: Float         // 0...1
    }

    // ── ③ Authenticity badge ─────────────────────────────────────────
    @Published public private(set) var authenticityScore: Float = 0
    @Published public private(set) var authenticityVerdict: AuthenticityResult.Verdict = .insufficientData

    // ── ④ Emotion classifier ─────────────────────────────────────────
    @Published public private(set) var emotion: EmotionDistribution = .zero

    public struct EmotionDistribution: Equatable, Sendable {
        public var neutral: Float
        public var joy: Float
        public var awe: Float
        public var sad: Float
        public var rage: Float

        public static let zero = EmotionDistribution(
            neutral: 1, joy: 0, awe: 0, sad: 0, rage: 0
        )

        /// Top label by probability.
        public var top: String {
            let pairs: [(String, Float)] = [
                ("neutral", neutral), ("joy", joy), ("awe", awe), ("sad", sad), ("rage", rage),
            ]
            return pairs.max(by: { $0.1 < $1.1 })?.0 ?? "neutral"
        }
    }

    // ── ⑤ Tag queue ──────────────────────────────────────────────────
    @Published public private(set) var tagQueue: [TagEntry] = []
    public static let tagQueueCap = 5

    public struct TagEntry: Identifiable, Equatable, Sendable {
        public let id = UUID()
        public let timestamp: Date
        public let label: String
        public let vaultReady: Bool
    }

    // ── ⑥ Session manifest mini-panel ─────────────────────────────────
    @Published public private(set) var sessionId: String = "—"
    @Published public private(set) var creatorId: String = "RSP_001"
    @Published public private(set) var capturedBuffers: Int = 0
    @Published public private(set) var elapsedSeconds: TimeInterval = 0
    @Published public private(set) var sessionStartedAt: Date = Date()

    // Status lights
    @Published public private(set) var captureLight: StatusLight = .idle
    @Published public private(set) var classifyLight: StatusLight = .idle
    @Published public private(set) var archiveLight: StatusLight = .idle
    @Published public private(set) var consentLight: StatusLight = .idle

    public enum StatusLight: Equatable, Sendable {
        case idle      // gray
        case active    // green pulsing
        case warning   // yellow
        case error     // red
    }

    public init() {}

    // ── Public push API — called from the AUAudioUnit's analysis Task ─
    public func push(features: HVSFeatures, score: AuthenticityResult) {
        inputRMS = features.rms
        inputPeak = features.peak
        authenticityScore = score.score
        authenticityVerdict = score.verdict
        capturedBuffers += 1
        elapsedSeconds = Date().timeIntervalSince(sessionStartedAt)

        // Append to contour history (capped FIFO)
        let point = ContourPoint(
            t: features.timestamp,
            rms: features.rms,
            centroidNormalized: min(1, features.spectralCentroid / 10000),
            authenticity: score.score
        )
        contourHistory.append(point)
        if contourHistory.count > Self.contourHistoryCap {
            contourHistory.removeFirst(contourHistory.count - Self.contourHistoryCap)
        }

        // Status lights derived from current state
        captureLight = features.rms > 0.001 ? .active : .idle
        classifyLight = score.verdict == .insufficientData ? .warning : .active
        switch score.verdict {
        case .rspResonance:    consentLight = .active
        case .likely:          consentLight = .warning
        case .unverified:      consentLight = .error
        case .insufficientData: consentLight = .idle
        }
    }

    public func setEmotion(_ distribution: EmotionDistribution) {
        emotion = distribution
    }

    public func appendTag(_ label: String, vaultReady: Bool) {
        let entry = TagEntry(timestamp: Date(), label: label, vaultReady: vaultReady)
        tagQueue.insert(entry, at: 0)
        if tagQueue.count > Self.tagQueueCap {
            tagQueue.removeLast(tagQueue.count - Self.tagQueueCap)
        }
        if vaultReady {
            archiveLight = .active
        }
    }

    public func setSession(id: String, startedAt: Date) {
        sessionId = id
        sessionStartedAt = startedAt
        capturedBuffers = 0
        elapsedSeconds = 0
        contourHistory.removeAll()
        tagQueue.removeAll()
        archiveLight = .idle
    }
}
