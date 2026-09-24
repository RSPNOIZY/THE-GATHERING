import SwiftUI
import Combine

@MainActor
final class ChatViewModel: ObservableObject {

    // MARK: - Published State
    @Published var messages: [Message] = [
        Message(role: .lucy, content: "Right then, I'm here. What do you need, Rob?")
    ]
    @Published var inputText = ""
    @Published var isProcessing = false
    @Published var isConnected = false

    // MARK: - Services
    let speech = SpeechService()
    let gabriel = GabrielClient()

    private var healthTimer: Timer?

    init() {
        startHealthCheck()
    }

    // MARK: - Health Check (every 15s)
    private func startHealthCheck() {
        Task {
            isConnected = await gabriel.checkHealth()
        }
        healthTimer = Timer.scheduledTimer(withTimeInterval: 15, repeats: true) { [weak self] _ in
            Task { @MainActor [weak self] in
                self?.isConnected = await self?.gabriel.checkHealth() ?? false
            }
        }
    }

    // MARK: - Send Text
    func send() async {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        messages.append(Message(role: .user, content: text))
        inputText = ""
        isProcessing = true

        do {
            let response = try await gabriel.askLucy(text: text)
            messages.append(Message(role: .lucy, content: response))
            speech.speak(response)
        } catch {
            messages.append(Message(role: .system, content: "Connection error: \(error.localizedDescription)"))
        }

        isProcessing = false
    }

    // MARK: - Voice Input
    func toggleListening() async {
        if speech.isListening {
            let transcript = speech.stopListening()
            guard !transcript.isEmpty else { return }
            inputText = transcript
            await send()
        } else {
            let granted = await speech.requestPermissions()
            guard granted else {
                messages.append(Message(role: .system, content: "Microphone or speech recognition permission denied. Check Settings."))
                return
            }
            do {
                try speech.startListening()
            } catch {
                messages.append(Message(role: .system, content: "Could not start listening: \(error.localizedDescription)"))
            }
        }
    }

    // MARK: - Stop Speaking
    func stopSpeaking() {
        speech.stopSpeaking()
    }
}
