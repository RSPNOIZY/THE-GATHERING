// HVSBridgeAudioUnit.swift
// NOIZY Empire — AUAudioUnit shell for HVS Live Contour v0.1
//
// Phase 0 of the v0.1 plan: AUv3 skeleton.
// Audio is PASSTHROUGH — this plug-in never modifies the signal.
// All analysis happens off the audio render thread.
//
// Note: this file declares the audio unit class and its parameters.
// The AUv3 App Extension target (Info.plist + AudioComponents) must be
// created in Xcode — see XCODE_BUILD_README.md.

#if canImport(AudioToolbox) && canImport(AVFoundation)
import AudioToolbox
import AVFoundation
import NOIZYConsent

/// The AUv3 entry point. Logic Pro for Mac instantiates this when the user
/// adds the plug-in to a vocal track or master bus.
@available(macOS 15.0, iOS 18.0, *)
public final class HVSBridgeAudioUnit: AUAudioUnit, @unchecked Sendable {

    // ── Buses ──────────────────────────────────────────────────────────
    private var _inputBusses: AUAudioUnitBusArray!
    private var _outputBusses: AUAudioUnitBusArray!
    public override var inputBusses: AUAudioUnitBusArray { _inputBusses }
    public override var outputBusses: AUAudioUnitBusArray { _outputBusses }

    private let inputBus: AUAudioUnitBus
    private let outputBus: AUAudioUnitBus

    // ── Analysis pipeline ─────────────────────────────────────────────
    private let extractor: HVSFeatureExtractor
    private let scorer: AuthenticityScorer
    private let manifestWriter: SessionManifestWriter

    // Off-thread analysis task
    private var analysisTask: Task<Void, Never>?
    private let analysisStream: AsyncStream<HVSFeatures>
    private let analysisContinuation: AsyncStream<HVSFeatures>.Continuation

    // Latest published state for the UI
    public private(set) var latestFeatures: HVSFeatures = .silence
    public private(set) var latestScore: AuthenticityResult = AuthenticityResult(
        score: 0, verdict: .insufficientData, timestamp: Date(), prototypeAge: nil
    )

    /// View model for the SwiftUI cockpit. Created on the main actor.
    @MainActor public lazy var viewModel: HVSLiveContourViewModel = {
        let vm = HVSLiveContourViewModel()
        let id = "ses_\(ISO8601DateFormatter().string(from: Date()))"
        vm.setSession(id: id, startedAt: Date())
        return vm
    }()

    // ── Init ───────────────────────────────────────────────────────────
    public override init(
        componentDescription: AudioComponentDescription,
        options: AudioComponentInstantiationOptions = []
    ) throws {
        // Default format: stereo 48kHz float
        let format = AVAudioFormat(standardFormatWithSampleRate: 48000, channels: 2)!

        self.inputBus = try AUAudioUnitBus(format: format)
        self.outputBus = try AUAudioUnitBus(format: format)

        self.extractor = HVSFeatureExtractor(sampleRate: 48000, bufferSize: 512)
        self.scorer = AuthenticityScorer(actorId: "RSP_001")

        let sessionId = "ses_\(ISO8601DateFormatter().string(from: Date()))"
        let manifest = HVSManifest(sessionId: sessionId, creatorId: "RSP_001")
        self.manifestWriter = SessionManifestWriter(manifest: manifest)

        var continuation: AsyncStream<HVSFeatures>.Continuation!
        self.analysisStream = AsyncStream { c in continuation = c }
        self.analysisContinuation = continuation

        try super.init(componentDescription: componentDescription, options: options)

        self._inputBusses = AUAudioUnitBusArray(
            audioUnit: self, busType: .input, busses: [inputBus]
        )
        self._outputBusses = AUAudioUnitBusArray(
            audioUnit: self, busType: .output, busses: [outputBus]
        )

        startAnalysisLoop()

        // Try to load a default prototype at boot. Non-fatal if missing —
        // the badge will show "ENROLL FIRST" until enrollment runs.
        Task { [scorer] in
            await scorer.loadDefaultPrototype()
        }
    }

    deinit {
        analysisContinuation.finish()
        analysisTask?.cancel()
    }

    public override func allocateRenderResources() throws {
        try super.allocateRenderResources()
    }

    public override func deallocateRenderResources() {
        super.deallocateRenderResources()
    }

    // ── Render block — REAL-TIME, NEVER ALLOCATES, AUDIO PASSTHROUGH ──
    public override var internalRenderBlock: AUInternalRenderBlock {
        let extractor = self.extractor
        let continuation = self.analysisContinuation

        return { actionFlags, timestamp, frameCount, outputBusNumber, outputBufferList, _, pullInputBlock in
            // 1. Pull input from upstream
            guard let pullInput = pullInputBlock else {
                return kAudioUnitErr_NoConnection
            }
            var pullFlags: AudioUnitRenderActionFlags = []
            let err = pullInput(&pullFlags, timestamp, frameCount, 0, outputBufferList)
            if err != noErr { return err }

            // 2. PASSTHROUGH — audio is now in outputBufferList, untouched.
            //    (We're an analyzer, not a processor.)

            // 3. Tap a copy for analysis off-thread.
            let abl = UnsafeMutableAudioBufferListPointer(outputBufferList)
            if let firstBuf = abl.first {
                let count = Int(firstBuf.mDataByteSize) / MemoryLayout<Float>.size
                if let ptr = firstBuf.mData?.assumingMemoryBound(to: Float.self) {
                    let buf = UnsafeBufferPointer(start: ptr, count: count)
                    let features = extractor.extract(buf)
                    // Yield to async stream — non-blocking, drops if full
                    continuation.yield(features)
                }
            }

            return noErr
        }
    }

    // ── Off-thread analysis loop (consumes the stream) ─────────────────
    private func startAnalysisLoop() {
        analysisTask = Task.detached(priority: .userInitiated) { [scorer, manifestWriter] in
            for await features in self.analysisStream {
                if Task.isCancelled { break }
                self.latestFeatures = features
                let result = await scorer.score(features)
                self.latestScore = result
                await manifestWriter.append(authenticity: result, features: features)
                // Push to the SwiftUI view model on the main actor
                await MainActor.run {
                    self.viewModel.push(features: features, score: result)
                }
            }
        }
    }

    public func commitToVault() async throws -> URL {
        await manifestWriter.close()
        return try await manifestWriter.save()
    }
}
#endif
