// Lucy — Root View
// iPad-optimized: three-column NavigationSplitView
// "Intimate and personal" — warm pink/gold, rounded, soft

import SwiftUI

struct LucyRootView: View {
    @EnvironmentObject var appState: LucyState
    @EnvironmentObject var lucyClient: LucyClient
    @Environment(\.horizontalSizeClass) var sizeClass

    var body: some View {
        ZStack {
            // Background
            LucyBackground()
                .ignoresSafeArea()

            // iPad: sidebar, iPhone: tabs
            if sizeClass == .regular {
                NavigationSplitView {
                    LucySidebar()
                        .navigationSplitViewColumnWidth(min: 200, ideal: 260, max: 320)
                } detail: {
                    contentFor(appState.activeTab)
                }
                .navigationSplitViewStyle(.balanced)
                .tint(appState.identity.primaryColor)
            } else {
                TabView(selection: $appState.activeTab) {
                    ForEach(LucyTab.allCases, id: \.self) { tab in
                        contentFor(tab)
                            .tabItem {
                                Label(tab.rawValue, systemImage: tab.icon)
                            }
                            .tag(tab)
                    }
                }
                .tint(appState.identity.primaryColor)
            }

            // Voice overlay
            if appState.showVoiceOverlay {
                LucyVoiceOverlay()
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(100)
            }

            // Voice orb (always visible)
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    LucyVoiceOrb()
                        .padding(.trailing, 24)
                        .padding(.bottom, sizeClass == .regular ? 40 : 90)
                }
            }
            .zIndex(99)
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.showVoiceOverlay)
    }

    @ViewBuilder
    func contentFor(_ tab: LucyTab) -> some View {
        switch tab {
        case .home:     LucyHomeView()
        case .chat:     LucyChatView()
        case .voice:    LucyVoiceStudioView()
        case .journal:  LucyJournalView()
        case .settings: LucySettingsView()
        }
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Home View
// ═══════════════════════════════════════════════════════════

struct LucyHomeView: View {
    @EnvironmentObject var appState: LucyState
    @EnvironmentObject var lucyClient: LucyClient

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    // Welcome header
                    lucyHeader

                    // Status cards
                    lucyStatusGrid

                    // Recent conversations
                    if !appState.conversations.isEmpty {
                        recentSection
                    } else {
                        emptyState
                    }

                    // Quick actions
                    lucyQuickActions
                }
                .padding(20)
            }
            .navigationTitle("")
            .toolbar {
                ToolbarItem(placement: .principal) {
                    HStack(spacing: 8) {
                        Circle()
                            .fill(appState.identity.primaryColor)
                            .frame(width: 10, height: 10)
                            .shadow(color: appState.identity.primaryColor, radius: 4)
                        Text("Lucy")
                            .font(.headline)
                    }
                }
            }
        }
    }

    var lucyHeader: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Hello,")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                    Text("I'm Lucy")
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: appState.identity.gradientColors,
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                }
                Spacer()
                connectionBadge
            }

            Text(appState.identity.tagline)
                .font(.subheadline)
                .foregroundStyle(.secondary)
        }
        .padding(20)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 24))
    }

    var connectionBadge: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(appState.connectionStatus.color)
                .frame(width: 8, height: 8)
                .shadow(color: appState.connectionStatus.color, radius: 3)
            Text(appState.connectionStatus.label)
                .font(.caption.bold())
                .foregroundStyle(appState.connectionStatus.color)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(appState.connectionStatus.color.opacity(0.1), in: Capsule())
    }

    var lucyStatusGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 16) {
            LucyStatusCard(icon: "heart.fill", title: "Presence", value: lucyClient.isConnected ? "Here" : "Away",
                           color: appState.identity.primaryColor, isActive: lucyClient.isConnected)
            LucyStatusCard(icon: "bubble.fill", title: "Conversations", value: "\(appState.conversations.count)",
                           color: appState.identity.accentColor, isActive: true)
            LucyStatusCard(icon: "waveform.circle.fill", title: "Voice", value: appState.isListening ? "Listening" : "Ready",
                           color: .orange, isActive: appState.isListening)
            LucyStatusCard(icon: "lock.shield.fill", title: "Zero Trust", value: appState.useTunnel ? "Tunnel" : "Local",
                           color: .green, isActive: appState.useTunnel)
        }
    }

    var recentSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent")
                .font(.headline)
                .foregroundStyle(.secondary)

            ForEach(appState.conversations.prefix(5)) { conv in
                Button {
                    appState.activeTab = .chat
                } label: {
                    HStack {
                        Image(systemName: "bubble.left.fill")
                            .foregroundStyle(appState.identity.primaryColor.opacity(0.7))
                        VStack(alignment: .leading) {
                            Text(conv.title)
                                .font(.subheadline.bold())
                                .foregroundStyle(.primary)
                                .lineLimit(1)
                            Text(conv.createdAt.formatted(.relative(presentation: .named)))
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Text("\(conv.messages.count)")
                            .font(.caption.bold())
                            .foregroundStyle(.secondary)
                    }
                    .padding(14)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
                }
                .buttonStyle(.plain)
            }
        }
    }

    var emptyState: some View {
        VStack(spacing: 16) {
            Image(systemName: "heart.circle")
                .font(.system(size: 60))
                .foregroundStyle(appState.identity.primaryColor.opacity(0.4))
            Text("No conversations yet")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("Tap the voice orb or go to Chat to start talking")
                .font(.subheadline)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }

    var lucyQuickActions: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("I can help with")
                .font(.headline)
                .foregroundStyle(.secondary)

            LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
                LucyActionButton(icon: "text.bubble.fill", title: "Talk", color: appState.identity.primaryColor) { appState.activeTab = .chat }
                LucyActionButton(icon: "mic.fill", title: "Listen", color: .orange) { appState.showVoiceOverlay = true }
                LucyActionButton(icon: "book.fill", title: "Journal", color: appState.identity.secondaryColor) { appState.activeTab = .journal }
                LucyActionButton(icon: "music.note", title: "Music", color: .blue) {}
                LucyActionButton(icon: "paintbrush.fill", title: "Create", color: .orange) {}
                LucyActionButton(icon: "sparkles", title: "Dream", color: appState.identity.accentColor) {}
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Chat View
// ═══════════════════════════════════════════════════════════

struct LucyChatView: View {
    @EnvironmentObject var appState: LucyState
    @EnvironmentObject var lucyClient: LucyClient
    @State private var messages: [LucyMessage] = []
    @State private var inputText: String = ""
    @State private var isStreaming: Bool = false
    @FocusState private var inputFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 12) {
                            if messages.isEmpty { chatEmptyState.padding(.top, 60) }
                            ForEach(messages) { msg in
                                LucyChatBubble(message: msg)
                                    .id(msg.id)
                            }
                            if isStreaming { LucyTypingDots() }
                            Color.clear.frame(height: 100).id("bottom")
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 16)
                    }
                    .onChange(of: messages.count) { _, _ in
                        withAnimation { proxy.scrollTo("bottom") }
                    }
                }

                chatInputBar
            }
            .background(
                LinearGradient(
                    colors: appState.identity.backgroundGradient,
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()
            )
            .navigationTitle("Chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button { withAnimation { messages.removeAll() } } label: {
                        Image(systemName: "trash").font(.system(size: 14)).foregroundStyle(.white.opacity(0.5))
                    }
                }
            }
        }
    }

    var chatEmptyState: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle().fill(appState.identity.primaryColor.opacity(0.15)).frame(width: 80, height: 80)
                Image(systemName: "heart.fill")
                    .font(.system(size: 32))
                    .foregroundStyle(appState.identity.primaryColor)
            }
            Text("Talk to Lucy")
                .font(.system(size: 18, weight: .medium, design: .rounded))
                .foregroundStyle(.white.opacity(0.6))

            VStack(spacing: 8) {
                ForEach(["Tell me something kind", "How are you feeling?", "What should I know about you?"], id: \.self) { prompt in
                    Button { inputText = prompt; sendMessage() } label: {
                        Text(prompt)
                            .font(.system(size: 13, design: .rounded))
                            .foregroundStyle(.white.opacity(0.7))
                            .padding(.horizontal, 16).padding(.vertical, 8)
                            .background(Capsule().fill(.ultraThinMaterial)
                                .overlay(Capsule().stroke(.white.opacity(0.12), lineWidth: 0.5)))
                    }
                    .buttonStyle(.plain)
                }
            }
        }
        .padding(.horizontal, 32)
    }

    var chatInputBar: some View {
        HStack(spacing: 12) {
            TextField("Message Lucy...", text: $inputText, axis: .vertical)
                .lineLimit(1...4)
                .font(.system(size: 15, design: .rounded))
                .foregroundStyle(.white)
                .tint(appState.identity.primaryColor)
                .focused($inputFocused)
                .onSubmit { sendMessage() }

            Button { sendMessage() } label: {
                ZStack {
                    Circle()
                        .fill(inputText.isEmpty
                              ? AnyShapeStyle(Color.white.opacity(0.15))
                              : AnyShapeStyle(LinearGradient(colors: appState.identity.gradientColors,
                                                              startPoint: .topLeading, endPoint: .bottomTrailing)))
                        .frame(width: 38, height: 38)
                    Image(systemName: "arrow.up")
                        .font(.system(size: 16, weight: .semibold))
                        .foregroundStyle(.white.opacity(inputText.isEmpty ? 0.3 : 1.0))
                }
            }
            .buttonStyle(.plain)
            .disabled(inputText.isEmpty || isStreaming)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            RoundedRectangle(cornerRadius: 0).fill(.ultraThinMaterial)
                .overlay(Rectangle().frame(height: 0.5).foregroundStyle(.white.opacity(0.1)), alignment: .top)
        )
        .padding(.bottom, 28)
    }

    private func sendMessage() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }

        let userMsg = LucyMessage(role: .user, content: text)
        withAnimation { messages.append(userMsg) }
        inputText = ""
        isStreaming = true

        Task {
            do {
                let reply = try await lucyClient.sendMessage(text, history: messages)
                let aiMsg = LucyMessage(role: .assistant, content: reply)
                await MainActor.run {
                    withAnimation { messages.append(aiMsg) }
                    isStreaming = false
                }
                // Save conversation
                var conv = LucyConversation(title: text.prefix(40) + (text.count > 40 ? "..." : ""))
                conv.messages = messages
                appState.conversations.insert(conv, at: 0)
                appState.saveConversations()
            } catch {
                let errMsg = LucyMessage(role: .assistant, content: "⚠️ \(error.localizedDescription)")
                await MainActor.run {
                    withAnimation { messages.append(errMsg) }
                    isStreaming = false
                }
            }
        }
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Placeholder Views
// ═══════════════════════════════════════════════════════════

struct LucyVoiceStudioView: View {
    @EnvironmentObject var appState: LucyState
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Image(systemName: "waveform.circle.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(appState.identity.primaryColor.opacity(0.5))
                Text("Voice Studio")
                    .font(.title2.bold())
                Text("Speak naturally. Lucy is listening.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Voice")
        }
    }
}

struct LucyJournalView: View {
    @EnvironmentObject var appState: LucyState
    var body: some View {
        NavigationStack {
            VStack(spacing: 20) {
                Image(systemName: "book.closed.fill")
                    .font(.system(size: 80))
                    .foregroundStyle(appState.identity.secondaryColor.opacity(0.5))
                Text("Journal")
                    .font(.title2.bold())
                Text("Your private memoir with Lucy.")
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
            }
            .navigationTitle("Journal")
        }
    }
}

struct LucySettingsView: View {
    @EnvironmentObject var appState: LucyState
    @EnvironmentObject var lucyClient: LucyClient

    var body: some View {
        NavigationStack {
            Form {
                Section("Connection") {
                    Toggle("Use Cloudflare Tunnel", isOn: $appState.useTunnel)
                    TextField("Server URL", text: $appState.serverURL)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()

                    HStack {
                        Text("Status")
                        Spacer()
                        HStack(spacing: 5) {
                            Circle().fill(appState.connectionStatus.color).frame(width: 8, height: 8)
                            Text(appState.connectionStatus.label)
                                .font(.caption.bold())
                                .foregroundStyle(appState.connectionStatus.color)
                        }
                    }

                    Button("Test Connection") {
                        Task { await lucyClient.connect() }
                    }
                }

                Section("About Lucy") {
                    HStack { Text("Version"); Spacer(); Text("1.0.0").foregroundStyle(.secondary) }
                    HStack { Text("Identity"); Spacer(); Text("Lucy").foregroundStyle(.secondary) }
                    HStack { Text("Backend"); Spacer(); Text("Heaven Worker").foregroundStyle(.secondary) }
                    HStack { Text("Runtime"); Spacer(); Text("Cloudflare Edge").foregroundStyle(.secondary) }
                }

                Section("Data") {
                    Button("Clear Conversations", role: .destructive) {
                        appState.conversations.removeAll()
                        appState.saveConversations()
                    }
                }
            }
            .navigationTitle("Settings")
            .scrollContentBackground(.hidden)
        }
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Reusable Components
// ═══════════════════════════════════════════════════════════

struct LucyBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: LucyIdentity.lucy.backgroundGradient,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            GeometryReader { geo in
                Circle()
                    .fill(LucyIdentity.lucy.primaryColor.opacity(0.06))
                    .frame(width: geo.size.width * 0.8)
                    .blur(radius: 60)
                    .offset(x: -geo.size.width * 0.2, y: -geo.size.height * 0.1)
                Circle()
                    .fill(LucyIdentity.lucy.accentColor.opacity(0.04))
                    .frame(width: geo.size.width * 0.6)
                    .blur(radius: 80)
                    .offset(x: geo.size.width * 0.4, y: geo.size.height * 0.5)
            }
        }
    }
}

struct LucySidebar: View {
    @EnvironmentObject var appState: LucyState
    var body: some View {
        List(LucyTab.allCases, id: \.self, selection: $appState.activeTab) { tab in
            Label(tab.rawValue, systemImage: tab.icon)
        }
        .navigationTitle("Lucy")
        .listStyle(.sidebar)
    }
}

struct LucyStatusCard: View {
    let icon: String; let title: String; let value: String; let color: Color; let isActive: Bool
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon).font(.title2).foregroundStyle(color)
                Spacer()
                if isActive { Circle().fill(.green).frame(width: 8, height: 8).shadow(color: .green, radius: 4) }
            }
            VStack(alignment: .leading, spacing: 2) {
                Text(title).font(.caption).foregroundStyle(.secondary)
                Text(value).font(.subheadline.bold()).lineLimit(1).minimumScaleFactor(0.7)
            }
        }
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        .overlay(RoundedRectangle(cornerRadius: 16).stroke(isActive ? color.opacity(0.3) : .clear, lineWidth: 1))
    }
}

struct LucyActionButton: View {
    let icon: String; let title: String; let color: Color; let action: () -> Void
    var body: some View {
        Button(action: action) {
            VStack(spacing: 10) {
                Image(systemName: icon).font(.title2).foregroundStyle(color)
                    .frame(width: 44, height: 44).background(color.opacity(0.15), in: Circle())
                Text(title).font(.caption.bold()).lineLimit(1)
            }
            .frame(maxWidth: .infinity).padding(.vertical, 16)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
        .frame(minWidth: 44, minHeight: 44)
    }
}

struct LucyVoiceOrb: View {
    @EnvironmentObject var appState: LucyState
    @State private var pulseScale: CGFloat = 1.0
    @State private var glowOpacity: Double = 0.5

    var body: some View {
        Button {
            appState.showVoiceOverlay.toggle()
        } label: {
            ZStack {
                if appState.isListening {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .stroke(appState.identity.primaryColor.opacity(0.3 - Double(i) * 0.1))
                            .frame(width: 70 + CGFloat(i * 20), height: 70 + CGFloat(i * 20))
                            .scaleEffect(pulseScale)
                    }
                }
                Circle()
                    .fill(appState.identity.primaryColor)
                    .frame(width: 64, height: 64)
                    .shadow(color: appState.identity.primaryColor.opacity(glowOpacity), radius: 20)
                Image(systemName: appState.isListening ? "waveform" : "heart.fill")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel("Talk to Lucy")
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                pulseScale = 1.15; glowOpacity = 0.8
            }
        }
    }
}

struct LucyVoiceOverlay: View {
    @EnvironmentObject var appState: LucyState
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            VStack(spacing: 24) {
                LucyWaveform(level: appState.audioLevel, color: appState.identity.primaryColor)
                    .frame(height: 60)
                if !appState.transcript.isEmpty {
                    Text(appState.transcript)
                        .font(.system(size: 22, weight: .medium, design: .rounded))
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                }
                Button("Done") {
                    appState.isListening = false
                    appState.showVoiceOverlay = false
                }
                .font(.headline)
                .foregroundStyle(appState.identity.primaryColor)
                .padding(.bottom, 40)
            }
            .padding(24)
            .background(.ultraThickMaterial, in: RoundedRectangle(cornerRadius: 30, style: .continuous))
            .padding(.horizontal, 16)
            .padding(.bottom, 100)
        }
        .ignoresSafeArea(edges: .bottom)
    }
}

struct LucyWaveform: View {
    let level: Float; let color: Color
    @State private var bars: [CGFloat] = Array(repeating: 0.1, count: 30)
    let timer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(spacing: 3) {
            ForEach(Array(bars.enumerated()), id: \.offset) { _, height in
                RoundedRectangle(cornerRadius: 2).fill(color.gradient)
                    .frame(width: 4, height: max(4, height * 60))
                    .animation(.spring(response: 0.15), value: height)
            }
        }
        .onReceive(timer) { _ in
            for i in bars.indices {
                bars[i] = max(0.1, CGFloat(level) + CGFloat.random(in: -0.3...0.3))
            }
        }
    }
}

struct LucyChatBubble: View {
    let message: LucyMessage
    var isUser: Bool { message.role == .user }
    let identity = LucyIdentity.lucy

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            if !isUser {
                ZStack {
                    Circle().fill(LinearGradient(colors: identity.gradientColors, startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 28, height: 28)
                    Image(systemName: "heart.fill").font(.system(size: 12)).foregroundStyle(.white)
                }
            }
            VStack(alignment: isUser ? .trailing : .leading, spacing: 3) {
                Text(message.content)
                    .font(.system(size: 15, design: .rounded))
                    .foregroundStyle(.white.opacity(0.9))
                    .padding(.horizontal, 14).padding(.vertical, 10)
                    .background(
                        RoundedRectangle(cornerRadius: 18)
                            .fill(isUser
                                  ? AnyShapeStyle(LinearGradient(colors: identity.gradientColors.map { $0.opacity(0.9) },
                                                                  startPoint: .topLeading, endPoint: .bottomTrailing))
                                  : AnyShapeStyle(.ultraThinMaterial))
                            .overlay(RoundedRectangle(cornerRadius: 18).stroke(.white.opacity(0.1), lineWidth: 0.5))
                    )
                Text(message.timestamp.formatted(.dateTime.hour().minute()))
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.25))
                    .padding(.horizontal, 4)
            }
            .frame(maxWidth: 500, alignment: isUser ? .trailing : .leading)
            if isUser { Spacer() }
        }
        .frame(maxWidth: .infinity, alignment: isUser ? .trailing : .leading)
    }
}

struct LucyTypingDots: View {
    let identity = LucyIdentity.lucy
    @State private var phases: [Double] = [0, 0.3, 0.6]
    private let timer = Timer.publish(every: 0.15, on: .main, in: .common).autoconnect()

    var body: some View {
        HStack(alignment: .bottom, spacing: 8) {
            Circle().fill(identity.primaryColor.opacity(0.7)).frame(width: 28, height: 28)
                .overlay(Image(systemName: "heart.fill").font(.system(size: 12)).foregroundStyle(.white))
            HStack(spacing: 5) {
                ForEach(0..<3) { i in
                    Circle().fill(.white.opacity(0.6)).frame(width: 7, height: 7)
                        .offset(y: -sin(phases[i] * .pi * 2) * 5)
                }
            }
            .padding(.horizontal, 14).padding(.vertical, 12)
            .background(RoundedRectangle(cornerRadius: 18).fill(.ultraThinMaterial))
            Spacer()
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .onReceive(timer) { _ in
            for i in phases.indices { phases[i] = (phases[i] + 0.1).truncatingRemainder(dividingBy: 1.0) }
        }
    }
}
