import Foundation
import AVFoundation
import Speech
import Combine

// ═══════════════════════════════════════════════════════════
// VoiceEngine — Core Accessibility Voice System
// Handles: STT, TTS, wake word, audio routing
// Connects to GORUNFREE (:9099) + heaven17 (:17017)
// ═══════════════════════════════════════════════════════════

@MainActor
final class VoiceEngine: NSObject, ObservableObject {
    static let shared = VoiceEngine()
    
    // ── State ────────────────────────────────────────────────
    @Published var isListening: Bool = false
    @Published var isSpeaking: Bool = false
    @Published var transcript: String = ""
    @Published var confidence: Float = 0.0
    @Published var audioLevel: Float = 0.0
    @Published var permissionsGranted: Bool = false
    @Published var activeDevice: AudioDevice = .rspBeats
    
    // ── Audio Components ─────────────────────────────────────
    private let audioEngine = AVAudioEngine()
    private var recognitionRequest: SFSpeechAudioBufferRecognitionRequest?
    private var recognitionTask: SFSpeechRecognitionTask?
    private let speechRecognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-US"))
    private let synthesizer = AVSpeechSynthesizer()
    
    // ── Heaven17 Connection ──────────────────────────────────
    private let heaven17Client = Heaven17Client.shared
    private var cancellables = Set<AnyCancellable>()
    
    // ── Wake Word ────────────────────────────────────────────
    private let wakeWords = ["heaven", "gabriel", "noizy", "lucy", "dream"]
    private var wakeWordActive = false
    
    // ── Callbacks ────────────────────────────────────────────
    var onTranscript: ((String) -> Void)?
    var onResponse: ((String) -> Void)?
    
    private override init() {
        super.init()
        synthesizer.delegate = self
        setupAudioSession()
    }
    
    // ── MARK: Setup ──────────────────────────────────────────
    
    func requestPermissions() async {
        let micStatus = await AVAudioApplication.requestRecordPermission()
        let speechStatus = await withCheckedContinuation { continuation in
            SFSpeechRecognizer.requestAuthorization { status in
                continuation.resume(returning: status == .authorized)
            }
        }
        permissionsGranted = micStatus && speechStatus
    }
    
    private func setupAudioSession() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(.playAndRecord,
                                    mode: .voiceChat,
                                    options: [.defaultToSpeaker, .allowBluetooth])
            try session.setActive(true)
        } catch {
            print("[VoiceEngine] Audio session setup failed: \(error)")
        }
    }
    
    // ── MARK: Listening ──────────────────────────────────────
    
    func startListening() {
        guard !isListening, permissionsGranted else { return }
        
        transcript = ""
        isListening = true
        
        recognitionRequest = SFSpeechAudioBufferRecognitionRequest()
        guard let recognitionRequest else { return }
        
        recognitionRequest.shouldReportPartialResults = true
        recognitionRequest.requiresOnDeviceRecognition = false
        recognitionRequest.taskHint = .dictation
        
        let inputNode = audioEngine.inputNode
        let recordingFormat = inputNode.outputFormat(forBus: 0)
        
        inputNode.installTap(onBus: 0, bufferSize: 1024, format: recordingFormat) { [weak self] buffer, _ in
            self?.recognitionRequest?.append(buffer)
            
            // Calculate audio level
            guard let channelData = buffer.floatChannelData?[0] else { return }
            let channelDataValue = stride(from: 0, to: Int(buffer.frameLength), by: buffer.stride)
                .map { channelData[$0] }
            let rms = sqrt(channelDataValue.map { $0 * $0 }.reduce(0, +) / Float(channelDataValue.count))
            
            Task { @MainActor [weak self] in
                self?.audioLevel = min(rms * 10, 1.0)
            }
        }
        
        audioEngine.prepare()
        try? audioEngine.start()
        
        recognitionTask = speechRecognizer?.recognitionTask(with: recognitionRequest) { [weak self] result, error in
            guard let self else { return }
            
            if let result {
                Task { @MainActor in
                    self.transcript = result.bestTranscription.formattedString
                    self.confidence = result.bestTranscription.segments.last?.confidence ?? 0
                    
                    // Check for wake word
                    if result.isFinal {
                        await self.processTranscript(self.transcript)
                    }
                }
            }
            
            if error != nil || result?.isFinal == true {
                Task { @MainActor in self.stopListening() }
            }
        }
    }
    
    func stopListening() {
        audioEngine.stop()
        audioEngine.inputNode.removeTap(onBus: 0)
        recognitionRequest?.endAudio()
        recognitionTask?.cancel()
        recognitionRequest = nil
        recognitionTask = nil
        isListening = false
        audioLevel = 0
    }
    
    func toggleListening() {
        if isListening {
            stopListening()
        } else {
            startListening()
        }
    }
    
    // ── MARK: Processing ─────────────────────────────────────
    
    func processTranscript(_ text: String) async {
        guard !text.isEmpty else { return }
        onTranscript?(text)
        
        // Send to heaven17 → AI → response
        let response = await heaven17Client.processVoice(transcript: text)
        
        if let responseText = response {
            onResponse?(responseText)
            await speak(responseText)
        }
    }
    
    // ── MARK: TTS ────────────────────────────────────────────
    
    func speak(_ text: String, voice: SpeechVoice = .gabriel) {
        let utterance = AVSpeechUtterance(string: text)
        utterance.voice = AVSpeechSynthesisVoice(identifier: voice.identifier)
        utterance.rate = voice.rate
        utterance.pitchMultiplier = voice.pitch
        utterance.volume = 0.9
        
        if synthesizer.isSpeaking {
            synthesizer.stopSpeaking(at: .immediate)
        }
        
        isSpeaking = true
        synthesizer.speak(utterance)
    }
    
    // ── MARK: Device Selection ────────────────────────────────
    
    func selectDevice(_ device: AudioDevice) {
        activeDevice = device
        // Route to selected device via AVAudioSession
        do {
            let session = AVAudioSession.sharedInstance()
            if device.isBluetooth {
                try session.setCategory(.playAndRecord,
                                        options: [.allowBluetooth, .allowBluetoothA2DP])
            } else {
                try session.setCategory(.playAndRecord,
                                        options: [.defaultToSpeaker])
            }
            try session.setActive(true)
        } catch {
            print("[VoiceEngine] Device switch failed: \(error)")
        }
    }
    
    // ── Switch Access ─────────────────────────────────────────
    
    func handleSwitchInput() {
        // Single switch: cycle through options
        // Double switch: activate selected
        if !isListening {
            startListening()
        } else {
            stopListening()
        }
    }
}

// ── AVSpeechSynthesizerDelegate ──────────────────────────────

extension VoiceEngine: AVSpeechSynthesizerDelegate {
    nonisolated func speechSynthesizer(_ synthesizer: AVSpeechSynthesizer,
                                       didFinish utterance: AVSpeechUtterance) {
        Task { @MainActor in self.isSpeaking = false }
    }
}

// ── Supporting Types ─────────────────────────────────────────

enum AudioDevice: String, CaseIterable {
    case rspBeats       = "RSP BEATS"
    case rspIPhone      = "RSP iPhone Microphone"
    case macStudio      = "Mac Studio Speakers"
    case noizyEmpire    = "NOIZYEMPIRE"
    case noizyIPad      = "NOIZYIPAD"
    case landrSessions  = "LANDR Sessions"
    case usbAudio       = "Unknown USB Audio Device"
    
    var isBluetooth: Bool {
        switch self {
        case .rspBeats, .rspIPhone: return true
        default: return false
        }
    }
    
    var icon: String {
        switch self {
        case .rspBeats:     return "headphones"
        case .rspIPhone:    return "iphone"
        case .macStudio:    return "speaker.wave.3.fill"
        case .noizyEmpire:  return "music.note.house.fill"
        case .noizyIPad:    return "ipad"
        case .landrSessions: return "waveform"
        case .usbAudio:     return "cable.connector"
        }
    }
}

enum SpeechVoice {
    case gabriel    // RSP's AI voice - deep, calm
    case lucy       // Lucy's AI voice - warm, expressive
    case system     // Default system voice
    
    var identifier: String {
        switch self {
        case .gabriel: return "com.apple.voice.enhanced.en-US.Rishi"
        case .lucy:    return "com.apple.voice.enhanced.en-US.Samantha"
        case .system:  return "com.apple.voice.compact.en-US.Samantha"
        }
    }
    
    var rate: Float {
        switch self {
        case .gabriel: return 0.45
        case .lucy:    return 0.50
        case .system:  return AVSpeechUtteranceDefaultSpeechRate
        }
    }
    
    var pitch: Float {
        switch self {
        case .gabriel: return 0.85
        case .lucy:    return 1.10
        case .system:  return 1.00
        }
    }
}
