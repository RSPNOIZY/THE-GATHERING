// Heaven — ChatView
// Conversational AI chat with streaming responses

import SwiftUI

struct ChatView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var aiOrchestrator: AIOrchestrator
    @State private var inputText: String = ""
    @State private var messages: [ChatMessage] = []
    @State private var isStreaming: Bool = false
    @State private var scrollProxy: ScrollViewProxy? = nil
    @FocusState private var inputFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                // Message list
                ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 12) {
                            if messages.isEmpty {
                                emptyState
                                    .padding(.top, 60)
                            }
                            ForEach(messages) { msg in
                                ChatBubble(message: msg, identity: appState.identity)
                                    .id(msg.id)
                            }
                            if isStreaming {
                                TypingIndicator(accentColor: appState.identity.accentColor)
                            }
                            Color.clear.frame(height: 100).id("bottom")
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                    }
                    .onChange(of: messages.count) { _ in
                        withAnimation { proxy.scrollTo("bottom") }
                    }
                }

                // Input bar
                chatInputBar
            }
            .background(
                LinearGradient(
                    colors: [Color(red: 0.04, green: 0.02, blue: 0.12), Color(red: 0.06, green: 0.03, blue: 0.18)],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()
            )
            .navigationTitle("\(appState.identity.rawValue) Chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        withAnimation { messages.removeAll() }
                        HapticManager.selection()
                    } label: {
                        Image(systemName: "trash")
                            .font(.system(size: 14))
                            .foregroundStyle(Color.white.opacity(0.5))
                    }
                }
            }
        }
    }

    // MARK: - Empty State

    var emptyState: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle()
                    .fill(appState.identity.accentColor.opacity(0.15))
                    .frame(width: 80, height: 80)
                Image(systemName: "bubble.left.and.bubble.right.fill")
                    .font(.system(size: 32, weight: .light))
                    .foregroundStyle(appState.identity.accentColor)
            }
            Text("Start a conversation with \(appState.identity.rawValue)")
                .font(.system(size: 16, weight: .medium, design: .rounded))
                .foregroundStyle(Color.white.opacity(0.6))
                .multilineTextAlignment(.center)

            // Quick prompt chips
            VStack(spacing: 8) {
                ForEach(quickPrompts, id: \.self) { prompt in
                    Button {
                        inputText = prompt
                        sendMessage()
                    } label: {
                        Text(prompt)
                            .font(.system(size: 13, design: .rounded))
                            .foregroundStyle(Color.white.opacity(0.7))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(
                                Capsule()
                                    .fill(.ultraThinMaterial)
                                    .overlay(Capsule().stroke(Color.white.opacity(0.12), lineWidth: 0.5))
                            )
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 32)
    }

    var quickPrompts: [String] {
        switch appState.identity {
        case .heaven: return ["Tell me something beautiful", "Describe the DreamChamber", "What can you do?"]
        case .lucy:   return ["Hello Lucy!", "Tell me your story", "What makes you unique?"]
        }
    }

    // MARK: - Input Bar

    var chatInputBar: some View {
        HStack(spacing: 12) {
            TextField("Message \(appState.identity.rawValue)...", text: $inputText, axis: .vertical)
                .lineLimit(1...4)
                .font(.system(size: 15, design: .rounded))
                .foregroundStyle(Color.white)
                .tint(appState.identity.accentColor)
                .focused($inputFocused)
                .onSubmit { sendMessage() }

            Button {
                sendMessage()
            } label: {
                ZStack {
                    Circle()
                        .fill(
                            inputText.isEmpty
                                ? AnyShapeStyle(Color.white.opacity(0.15))
                                : AnyShapeStyle(LinearGradient(
                                    colors: appState.identity.gradientColors,
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                ))
                        )
                        .frame(width: 38, height: 38)

                    Image(systemName: "arrow.up")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(Color.white.opacity(inputText.isEmpty ? 0.3 : 1.0))
                }
            }
            .buttonStyle(.plain)
            .disabled(inputText.isEmpty || isStreaming)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 0)
                .fill(.ultraThinMaterial)
                .overlay(
                    Rectangle()
                        .frame(height: 0.5)
                        .foregroundStyle(Color.white.opacity(0.1)),
                    alignment: .top
                )
        )
        .padding(.bottom, 28)
    }

    // MARK: - Actions

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        let userMsg = ChatMessage(role: .user, content: text)
        withAnimation { messages.append(userMsg) }
        inputText = ""
        isStreaming = true
        HapticManager.selection()

        Task {
            do {
                let response = try await aiOrchestrator.sendMessage(
                    text,
                    identity: appState.identity,
                    history: messages
                )
                let aiMsg = ChatMessage(role: .assistant, content: response)
                await MainActor.run {
                    withAnimation { messages.append(aiMsg) }
                    isStreaming = false
                }
            } catch {
                let errMsg = ChatMessage(role: .assistant, content: "⚠️ \(error.localizedDescription)")
                await MainActor.run {
                    withAnimation { messages.append(errMsg) }
                    isStreaming = false
                }
            }
        }
    }
}

// MARK: - Chat Bubble

struct ChatBubble: View {
    let message: ChatMessage
    let identity: HeavenIdentity

    var isUser: Bool { message.role == .user }

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if !isUser {
                // AI avatar
                ZStack {
                    Circle()
                        .fill(
                            LinearGradient(
                                colors: identity.gradientColors,
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 28, height: 28)
                    Image(systemName: "sparkles")
                        .font(.system(size: 12, weight: .medium))
                        .foregroundStyle(Color.white)
                }
            }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 3) {
                Text(message.content)
                    .font(.system(size: 15, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.9))
                    .padding(.horizontal, 14)
                    .padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(
                                isUser
                                    ? AnyShapeStyle(LinearGradient(
                                        colors: identity.gradientColors.map { $0.opacity(0.9) },
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ))
                                    : AnyShapeStyle(.ultraThinMaterial)
                            )
                            .overlay(
                                RoundedRectangle(cornerRadius: 18)
                                    .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
                            )
                    )

                Text(message.timestamp.formatted(.dateTime.hour().minute()))
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.25))
                    .padding(.horizontal, 4)
            }
            .frame(maxWidth: UIScreen.main.bounds.width * 0.72, alignment: isUser ? .trailing : .leading)

            if isUser { Spacer() }
        }
        .frame(maxWidth: .infinity, alignment: isUser ? .trailing : .leading)
    }
}

// MARK: - Typing Indicator

struct TypingIndicator: View {
    let accentColor: Color
    @State private var phases: [Double] = [0, 0.3, 0.6]
    private let timer = Timer.publish(every: 0.15, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            Circle()
                .fill(accentColor.opacity(0.7))
                .frame(width: 28, height: 28)
                .overlay(Image(systemName: "sparkles").font(.system(size: 12)).foregroundStyle(.white))

            HStack(spacing: 5) {
                ForEach(0..<3) { i in
                    Circle()
                        .fill(Color.white.opacity(0.6))
                        .frame(width: 7, height: 7)
                        .offset(y: -sin(phases[i] * .pi * 2) * 5)
                }
            }
            .padding(.horizontal, 14)
            .padding(.vertical, 12)
            .background(
                RoundedRectangle(cornerRadius: 18)
                    .fill(.ultraThinMaterial)
                    .overlay(RoundedRectangle(cornerRadius: 18).stroke(Color.white.opacity(0.1), lineWidth: 0.5))
            )
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onReceive(timer) { _ in
            for i in phases.indices {
                phases[i] = (phases[i] + 0.1).truncatingRemainder(dividingBy: 1.0)
            }
        }
    }
}
