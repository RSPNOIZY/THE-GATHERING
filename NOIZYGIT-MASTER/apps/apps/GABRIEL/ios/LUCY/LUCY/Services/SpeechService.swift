import AVFoundation
import Speech

/// Handles both Speech Recognition (STT) and Text-to-Speech (TTS)
/// Uses Siri Premium Kate (Australian) for LUCY's voice
final class SpeechService: NSObject, ObservableObject {

    // MARK: - Published State
    @Published var isListening = false
    @Published var isSpeaking = false
    @Published var liveTranscript = ""

    // MARK: - TTS (Siri Premium Kate)
    private let synthesizer = AVSpeechSynthesizer()
    private var kateVoice: AVSpeechSynthesisVoice?

    // MARK: - STT
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-AU"))
    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?

    override init() {
        super.init()
        synthesizer.delegate = self
        findKateVoice()
    }

    // MARK: - Find Siri Premium Kate Voice
    private func findKateVoice() {
        let voices = AVSpeechSynthesisVoice.speechVoices()

        // Priority order: Premium Kate > Enhanced Kate > any Kate > Premium Karen > Enhanced Karen
        let candidates: [(String, AVSpeechSynthesisVoiceQuality)] = [
            ("Kate", .premium),
            ("Kate", .enhanced),
            ("Kate", .default),
            ("Karen", .premium),
            ("Karen", .enhanced),
        ]

        for (name, quality) in candidates {
            if let voice = voices.first(where: {
                $0.name.contains(name) && $0.language.starts(with: "en-AU") && $0.quality == quality
            }) {
                kateVoice = voice
                print("[LUCY] Voice loaded: \(voice.name) quality=\(voice.quality.rawValue)")
                return
            }
        }

        // Fallback: any Australian English voice
        if let fallback = voices.first(where: { $0.language.starts(with: "en-AU") }) {
            kateVoice = fallback
            print("[LUCY] Fallback voice: \(fallback.name)")
        } else {
            // Last resort: Samantha
            kateVoice = AVSpeechSynthesisVoice(language: "en-US")
            print("[LUCY] No Australian voice found, using default")
        }
    }

    // MARK: - Speak (LUCY's response via Kate)
    func speak(_ text: String) {
        synthesizer.stopSpeaking(at: .immediate)

        let clean = text
            .replacingOccurrences(of: "`", with: "")
            .replacingOccurrences(of: "#", with: "")
            .replacingOccurrences(of: "*", with: "")
            .prefix(800)

        let utterance = AVSpeechUtterance(string: String(clean))
        utterance.voice = kateVoice
        utterance.rate = 0.5       // Natural pace
        utterance.pitchMultiplier = 1.05   // Slightly warm
        utterance.preUtteranceDelay = 0.1
        utterance.postUtteranceDelay = 0.1

        // Ensure audio session is set for playback
        configureAudioSession(forRecording: false)

        isSpeaking = true
        synthesizer.speak(utterance)
    }

    func stopSpeaking() {
        synthesizer.stopSpeaking(at: .immediate)
        isSpeaking = false
    }

    // MARK: - Listen (Speech Recognition)
    func requestPermissions() async -> Bool {
        let speechStatus = await withCheckedContinuation { cont in
            SFSpeechRecognizer.requestAuthorization { status in
                cont.resume(returning: status)
            }
        }

        guard speechStatus == .authorized else { return false }

        let micStatus = await AVAudioApplication.requestRecordPermission()
        return micStatus
    }

    func startListening() throws {
        guard let speechRecognizer, speechRecognizer.isAvailable else {
            throw SpeechError.recognizerUnavailable
        }

        // Stop any previous task
        recognitionTask?.cancel()
        recognitionTask = nil

        configureAudioSession(forRecording: true)

        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest else { throw SpeechError.requestFailed }

        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.addsPunctuation = true

        // On-device recognition if available (faster, private)
        if speechRecognizer.supportsOnDeviceRecognition {
            recognitionRequest.requiresOnDeviceRecognition = true
        }

        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)

        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
        }

        audioEngine.prepare()
        try audioEngine.start()

        liveTranscript = ""
        isListening = true

        recognitionTask = speechRecognizer.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self else { return }

            if let result {
                Task { @MainActor in
                    self.liveTranscript = result.bestTranscription.formattedString
                }
            }

            if error != nil || (result?.isFinal ?? false) {
                Task { @MainActor in
                    self.isListening = false
                }
            }
        }
    }

    func stopListening() -> String {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()

        isListening = false
        let finalText = liveTranscript
        liveTranscript = ""
        return finalText
    }

    // MARK: - Audio Session
    private func configureAudioSession(forRecording: Bool) {
        let session = AVAudioSession.sharedInstance()
        do {
            if forRecording {
                try session.setCategory(.playAndRecord, mode: .default, options: [.defaultToSpeaker, .allowBluetooth])
            } else {
                try session.setCategory(.playback, mode: .default)
            }
            try session.setActive(true)
        } catch {
            print("[LUCY] Audio session error: \(error)")
        }
    }
}

// MARK: - AVSpeechSynthesizerDelegate
extension SpeechService: AVSpeechSynthesizerDelegate {
    func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer, didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in
            self.isSpeaking = false
        }
    }
}

enum SpeechError: LocalizedError {
    case recognizerUnavailable
    case requestFailed

    var errorDescription: String? {
        switch self {
        case .recognizerUnavailable: return "Speech recognition not available"
        case .requestFailed: return "Failed to create recognition request"
        }
    }
}
