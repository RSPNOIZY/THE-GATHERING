// Heaven — AudioEngine Service
// AVAudioEngine-based voice capture

import Foundation
import AVFoundation
import Combine

@MainActor
final class AudioEngine: ObservableObject {
    static let shared = AudioEngine()

    @Published var isListening: Bool = false
    @Published var isProcessing: Bool = false
    @Published var audioLevel: Float = 0.0

    private var engine: AVAudioEngine?
    private var inputNode: AVAudioInputNode?
    private var cancellables = Set<AnyCancellable>()

    private init() {
        setupAudioSession()
    }

    func toggleListening() {
        isListening ? stopListening() : startListening()
    }

    func startListening() {
        let session = AVAudioSession.sharedInstance()
        guard session.recordPermission == .granted else {
            requestMicPermission()
            return
        }

        do {
            engine = AVAudioEngine()
            guard let engine = engine else { return }
            inputNode = engine.inputNode

            let format = inputNode!.outputFormat(forBus: 0)
            inputNode!.installTap(onBus: 0, bufferSize: 1024, format: format) { [weak self] buffer, _ in
                guard let self = self else { return }
                let level = self.calculateAudioLevel(buffer: buffer)
                DispatchQueue.main.async {
                    self.audioLevel = level
                }
            }

            try engine.start()
            isListening = true
        } catch {
            print("[AudioEngine] Start failed: \(error)")
        }
    }

    func stopListening() {
        inputNode?.removeTap(onBus: 0)
        engine?.stop()
        engine = nil
        isListening = false
        isProcessing = false
        audioLevel = 0
    }

    private func setupAudioSession() {
        let session = AVAudioSession.sharedInstance()
        try? session.setCategory(.playAndRecord, mode: .voiceChat, options: [.defaultToSpeaker, .allowBluetooth])
        try? session.setActive(true)
    }

    private func requestMicPermission() {
        AVAudioSession.sharedInstance().requestRecordPermission { _ in }
    }

    private func calculateAudioLevel(buffer: AVAudioPCMBuffer) -> Float {
        guard let channelData = buffer.floatChannelData?[0] else { return 0 }
        let frameCount = UInt(buffer.frameLength)
        var rms: Float = 0
        for i in 0..<Int(frameCount) {
            rms += channelData[i] * channelData[i]
        }
        return sqrtf(rms / Float(frameCount))
    }
}
