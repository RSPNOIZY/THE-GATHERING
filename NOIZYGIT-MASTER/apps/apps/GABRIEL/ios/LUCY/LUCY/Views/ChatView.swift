import SwiftUI

struct ChatView: View {
    @EnvironmentObject var vm: ChatViewModel

    var body: some View {
        VStack(spacing: 0) {
            // ── Header ──
            headerBar

            // ── Messages ──
            ScrollViewReader { proxy in
                ScrollView {
                    LazyVStack(alignment: .leading, spacing: 10) {
                        ForEach(vm.messages) { msg in
                            MessageBubble(message: msg)
                                .id(msg.id)
                        }

                        // Live transcript while listening
                        if vm.speech.isListening && !vm.speech.liveTranscript.isEmpty {
                            MessageBubble(message: Message(role: .user, content: vm.speech.liveTranscript + " ..."))
                                .opacity(0.6)
                                .id("live-transcript")
                        }

                        // Processing indicator
                        if vm.isProcessing {
                            HStack(spacing: 6) {
                                ProgressView()
                                    .tint(Color.lucyAccent)
                                Text("LUCY is thinking...")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                            .padding(.horizontal)
                            .id("processing")
                        }
                    }
                    .padding(.vertical, 12)
                }
                .onChange(of: vm.messages.count) {
                    withAnimation(.easeOut(duration: 0.2)) {
                        proxy.scrollTo(vm.messages.last?.id, anchor: .bottom)
                    }
                }
                .onChange(of: vm.speech.liveTranscript) {
                    proxy.scrollTo("live-transcript", anchor: .bottom)
                }
            }

            // ── Input Bar ──
            inputBar
        }
        .background(Color.lucyBg)
    }

    // MARK: - Header
    private var headerBar: some View {
        HStack(spacing: 10) {
            // LUCY avatar
            Circle()
                .fill(
                    LinearGradient(
                        colors: [Color.lucyAccent, Color.lucyAccent.opacity(0.6)],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )
                .frame(width: 36, height: 36)
                .overlay(
                    Text("L")
                        .font(.system(size: 18, weight: .black))
                        .foregroundColor(.white)
                )

            VStack(alignment: .leading, spacing: 1) {
                Text("LUCY")
                    .font(.system(size: 15, weight: .bold))
                    .foregroundColor(Color.lucyAccent)
                    .tracking(0.5)
                Text("Archives \u{00B7} AQUARIUM \u{00B7} NOIZY EMPIRE")
                    .font(.system(size: 11))
                    .foregroundColor(.secondary)
            }

            Spacer()

            // Connection indicator
            Circle()
                .fill(vm.isConnected ? Color.green : Color.red.opacity(0.6))
                .frame(width: 8, height: 8)

            // Stop speaking button
            if vm.speech.isSpeaking {
                Button {
                    vm.stopSpeaking()
                } label: {
                    Image(systemName: "speaker.slash.fill")
                        .foregroundColor(Color.lucyAccent)
                }
            }
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.lucySurface)
    }

    // MARK: - Input Bar
    private var inputBar: some View {
        HStack(spacing: 10) {
            // Mic button
            Button {
                Task { await vm.toggleListening() }
            } label: {
                Image(systemName: vm.speech.isListening ? "mic.fill" : "mic")
                    .font(.system(size: 20))
                    .foregroundColor(vm.speech.isListening ? .white : Color.lucyAccent)
                    .frame(width: 44, height: 44)
                    .background(
                        Circle()
                            .fill(vm.speech.isListening ? Color.red : Color.lucyBg)
                            .overlay(
                                Circle().stroke(Color.lucyBorder, lineWidth: vm.speech.isListening ? 0 : 1)
                            )
                    )
            }
            .accessibilityLabel(vm.speech.isListening ? "Stop listening" : "Start listening")

            // Text input
            TextField("Ask LUCY...", text: $vm.inputText, axis: .vertical)
                .textFieldStyle(.plain)
                .padding(.horizontal, 16)
                .padding(.vertical, 10)
                .background(
                    RoundedRectangle(cornerRadius: 20)
                        .fill(Color.lucyBg)
                        .overlay(
                            RoundedRectangle(cornerRadius: 20)
                                .stroke(Color.lucyBorder, lineWidth: 1)
                        )
                )
                .lineLimit(1...4)
                .onSubmit { Task { await vm.send() } }

            // Send button
            Button {
                Task { await vm.send() }
            } label: {
                Image(systemName: "arrow.up")
                    .font(.system(size: 18, weight: .bold))
                    .foregroundColor(.white)
                    .frame(width: 44, height: 44)
                    .background(
                        Circle()
                            .fill(vm.inputText.isEmpty && !vm.speech.isListening
                                  ? Color.lucyAccent.opacity(0.3)
                                  : Color.lucyAccent)
                    )
            }
            .disabled(vm.inputText.isEmpty && !vm.speech.isListening)
            .accessibilityLabel("Send message")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(Color.lucySurface)
    }
}

// MARK: - Message Bubble
struct MessageBubble: View {
    let message: Message

    var body: some View {
        HStack {
            if message.role == .user { Spacer(minLength: 60) }

            VStack(alignment: message.role == .user ? .trailing : .leading, spacing: 4) {
                Text(label)
                    .font(.system(size: 10, weight: .bold))
                    .textCase(.uppercase)
                    .tracking(0.5)
                    .foregroundColor(labelColor)

                Text(message.content)
                    .font(.system(size: 15))
                    .foregroundColor(.primary)
                    .lineSpacing(3)
                    .textSelection(.enabled)
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 10)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(bubbleColor)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(message.role == .lucy ? Color.lucyBorder : .clear, lineWidth: 1)
                    )
            )

            if message.role != .user { Spacer(minLength: 60) }
        }
        .padding(.horizontal, 16)
    }

    private var label: String {
        switch message.role {
        case .user: return "You"
        case .lucy: return "LUCY"
        case .system: return "System"
        }
    }

    private var labelColor: Color {
        switch message.role {
        case .user: return .secondary
        case .lucy: return Color.lucyAccent
        case .system: return .orange
        }
    }

    private var bubbleColor: Color {
        switch message.role {
        case .user: return Color(red: 0.1, green: 0.1, blue: 0.2)
        case .lucy: return Color(red: 0.086, green: 0.086, blue: 0.165)
        case .system: return Color(red: 0.15, green: 0.1, blue: 0.05)
        }
    }
}

// MARK: - LUCY Color Palette
extension Color {
    static let lucyBg      = Color(red: 0.04, green: 0.04, blue: 0.06)
    static let lucySurface  = Color(red: 0.07, green: 0.07, blue: 0.1)
    static let lucyBorder   = Color(red: 0.12, green: 0.12, blue: 0.18)
    static let lucyAccent   = Color(red: 0.486, green: 0.431, blue: 0.804)  // #7c6ecd
}

#Preview {
    ChatView()
        .environmentObject(ChatViewModel())
}
