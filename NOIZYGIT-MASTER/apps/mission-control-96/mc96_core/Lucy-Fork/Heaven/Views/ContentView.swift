import SwiftUI

// ═══════════════════════════════════════════════════════════
// ContentView — Main Heaven UI
// Adaptive: iPhone (tab nav) / iPad (sidebar nav)
// Accessibility-first: large targets, voice overlay
// ═══════════════════════════════════════════════════════════

struct ContentView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var voiceEngine: VoiceEngine
    @EnvironmentObject var dreamChamber: DreamChamberClient
    @Environment(\.horizontalSizeClass) var sizeClass
    
    var body: some View {
        ZStack {
            // ── Background ───────────────────────────────────
            PersonaBackground(persona: appState.persona)
                .ignoresSafeArea()
            
            // ── Main Navigation ──────────────────────────────
            if sizeClass == .regular {
                // iPad: Sidebar navigation
                iPadLayout
            } else {
                // iPhone: Tab navigation
                iPhoneLayout
            }
            
            // ── Voice Overlay (always available) ─────────────
            if appState.showVoiceOverlay {
                VoiceOverlayView()
                    .transition(.move(edge: .bottom).combined(with: .opacity))
                    .zIndex(100)
            }
            
            // ── Voice Activation Button ───────────────────────
            VStack {
                Spacer()
                HStack {
                    Spacer()
                    VoiceOrb()
                        .padding(.trailing, 24)
                        .padding(.bottom, sizeClass == .regular ? 40 : 20)
                }
            }
            .zIndex(99)
        }
        .animation(.spring(response: 0.4, dampingFraction: 0.8), value: appState.showVoiceOverlay)
    }
    
    // ── iPad Layout ───────────────────────────────────────────
    var iPadLayout: some View {
        NavigationSplitView {
            SidebarView()
                .navigationSplitViewColumnWidth(min: 200, ideal: 240, max: 300)
        } content: {
            mainContent
        } detail: {
            DetailPlaceholderView()
        }
        .navigationSplitViewStyle(.balanced)
    }
    
    // ── iPhone Layout ─────────────────────────────────────────
    var iPhoneLayout: some View {
        TabView(selection: $appState.activeView) {
            ForEach(HeavenView.allCases, id: \.self) { view in
                mainContentFor(view)
                    .tabItem {
                        Label(view.rawValue, systemImage: view.icon)
                    }
                    .tag(view)
            }
        }
        .tint(appState.persona.primaryColor)
    }
    
    // ── Content Router ────────────────────────────────────────
    var mainContent: some View {
        mainContentFor(appState.activeView)
    }
    
    @ViewBuilder
    func mainContentFor(_ view: HeavenView) -> some View {
        switch view {
        case .home:     HomeView()
        case .voice:    VoiceStudioView()
        case .studio:   CreativeStudioView()
        case .connect:  ConnectView()
        case .settings: SettingsView()
        }
    }
}

// ═══════════════════════════════════════════════════════════
// HomeView — Main landing for Heaven
// ═══════════════════════════════════════════════════════════

struct HomeView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var voiceEngine: VoiceEngine
    @EnvironmentObject var dreamChamber: DreamChamberClient
    
    var body: some View {
        ScrollView {
            VStack(spacing: 32) {
                // ── Header ───────────────────────────────────
                HeaderSection()
                
                // ── Status Cards ─────────────────────────────
                StatusGrid()
                
                // ── Recent Conversations ──────────────────────
                if !appState.conversations.isEmpty {
                    ConversationsSection()
                } else {
                    EmptyStateView()
                }
                
                // ── Quick Actions ─────────────────────────────
                QuickActionsGrid()
            }
            .padding(20)
        }
        .navigationTitle("Heaven")
        .toolbar { PersonaSwitcher() }
    }
}

// ── Header Section ────────────────────────────────────────────

struct HeaderSection: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var dreamChamber: DreamChamberClient
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Welcome back,")
                        .font(.title3)
                        .foregroundStyle(.secondary)
                    Text(appState.persona.displayName)
                        .font(.system(size: 42, weight: .bold, design: .rounded))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [appState.persona.primaryColor, appState.persona.accentColor],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )
                }
                
                Spacer()
                
                ConnectionBadge(status: appState.connectionStatus)
            }
            
            if appState.connectionStatus.isConnected {
                Text("DreamChamber v2.0 · \(dreamChamber.modelCount) models ready")
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(20)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 20))
    }
}

// ── Status Grid ───────────────────────────────────────────────

struct StatusGrid: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var voiceEngine: VoiceEngine
    
    var body: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 16) {
            StatusCard(
                icon: "waveform.circle.fill",
                title: "Voice",
                value: voiceEngine.isListening ? "Listening" : "Ready",
                color: voiceEngine.isListening ? .green : appState.persona.primaryColor,
                isActive: voiceEngine.isListening
            )
            
            StatusCard(
                icon: "cpu",
                title: "AI Models",
                value: "16 Active",
                color: appState.persona.accentColor,
                isActive: appState.connectionStatus.isConnected
            )
            
            StatusCard(
                icon: "headphones",
                title: "Audio",
                value: voiceEngine.activeDevice.rawValue,
                color: .orange,
                isActive: true
            )
            
            StatusCard(
                icon: "shield.fill",
                title: "ZeroTrust",
                value: "Securing",
                color: .green,
                isActive: false // Until CloudFlare is configured
            )
        }
    }
}

struct StatusCard: View {
    let icon: String
    let title: String
    let value: String
    let color: Color
    let isActive: Bool
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundStyle(color)
                Spacer()
                if isActive {
                    Circle()
                        .fill(.green)
                        .frame(width: 8, height: 8)
                        .shadow(color: .green, radius: 4)
                }
            }
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Text(value)
                    .font(.subheadline.bold())
                    .foregroundStyle(.primary)
                    .lineLimit(1)
                    .minimumScaleFactor(0.7)
            }
        }
        .padding(16)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isActive ? color.opacity(0.3) : .clear, lineWidth: 1)
        )
    }
}

// ── Voice Orb — Primary Accessibility Button ──────────────────

struct VoiceOrb: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var voiceEngine: VoiceEngine
    
    @State private var pulseScale: CGFloat = 1.0
    @State private var glowOpacity: Double = 0.5
    
    var body: some View {
        Button {
            voiceEngine.toggleListening()
            if !voiceEngine.isListening {
                appState.showVoiceOverlay = true
            }
        } label: {
            ZStack {
                // Pulse rings (visible when listening)
                if voiceEngine.isListening {
                    ForEach(0..<3, id: \.self) { i in
                        Circle()
                            .stroke(appState.persona.primaryColor.opacity(0.3 - Double(i) * 0.1))
                            .frame(width: 70 + CGFloat(i * 20), height: 70 + CGFloat(i * 20))
                            .scaleEffect(pulseScale)
                    }
                }
                
                // Glow
                Circle()
                    .fill(appState.persona.primaryColor)
                    .frame(width: 64, height: 64)
                    .shadow(color: appState.persona.primaryColor.opacity(glowOpacity), radius: 20)
                
                // Icon
                Image(systemName: voiceEngine.isListening ? "waveform" : "mic.fill")
                    .font(.title2.bold())
                    .foregroundStyle(.white)
                    .symbolEffect(.bounce, value: voiceEngine.isListening)
                
                // Audio level indicator
                if voiceEngine.isListening && voiceEngine.audioLevel > 0.05 {
                    Circle()
                        .stroke(.white.opacity(0.6), lineWidth: 2)
                        .frame(width: 64 + CGFloat(voiceEngine.audioLevel * 20),
                               height: 64 + CGFloat(voiceEngine.audioLevel * 20))
                }
            }
        }
        .buttonStyle(.plain)
        .accessibilityLabel(voiceEngine.isListening ? "Stop listening" : "Start voice input")
        .accessibilityHint("Primary accessibility control — activate to speak to Gabriel")
        .onAppear {
            withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
                pulseScale = 1.15
                glowOpacity = 0.8
            }
        }
        .onChange(of: voiceEngine.isListening) { _, listening in
            withAnimation(.easeInOut(duration: 0.6).repeatWhile(listening, autoreverses: true)) {
                pulseScale = listening ? 1.2 : 1.0
            }
        }
    }
}

// ── Voice Overlay ─────────────────────────────────────────────

struct VoiceOverlayView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var voiceEngine: VoiceEngine
    
    var body: some View {
        VStack(spacing: 0) {
            Spacer()
            VStack(spacing: 24) {
                // Waveform visualization
                HeavenWaveform(level: voiceEngine.audioLevel,
                               color: appState.persona.primaryColor)
                    .frame(height: 60)
                
                // Transcript display
                if !voiceEngine.transcript.isEmpty {
                    Text(voiceEngine.transcript)
                        .font(.system(size: 22, weight: .medium, design: .rounded))
                        .foregroundStyle(.primary)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 24)
                        .animation(.default, value: voiceEngine.transcript)
                }
                
                // Confidence bar
                ProgressView(value: Double(voiceEngine.confidence))
                    .tint(appState.persona.accentColor)
                    .frame(width: 200)
                
                // Dismiss button
                Button("Done") {
                    voiceEngine.stopListening()
                    appState.showVoiceOverlay = false
                }
                .font(.headline)
                .foregroundStyle(appState.persona.primaryColor)
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

// ── Quick Actions ─────────────────────────────────────────────

struct QuickActionsGrid: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var voiceEngine: VoiceEngine
    
    let actions: [QuickAction] = [
        QuickAction(icon: "music.note", title: "Create Music", color: .purple),
        QuickAction(icon: "paintbrush.fill", title: "Draw & Design", color: .orange),
        QuickAction(icon: "text.bubble.fill", title: "Tell a Story", color: .blue),
        QuickAction(icon: "brain", title: "Dream Weave", color: .pink),
        QuickAction(icon: "bolt.fill", title: "Quick Command", color: .yellow),
        QuickAction(icon: "person.2.fill", title: "Switch User", color: .green),
    ]
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Quick Actions")
                .font(.headline)
                .foregroundStyle(.secondary)
            
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 12) {
                ForEach(actions) { action in
                    QuickActionButton(action: action)
                }
            }
        }
    }
}

struct QuickAction: Identifiable {
    let id = UUID()
    let icon: String
    let title: String
    let color: Color
}

struct QuickActionButton: View {
    let action: QuickAction
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Button {
            // Trigger action via voice or direct
        } label: {
            VStack(spacing: 10) {
                Image(systemName: action.icon)
                    .font(.title2)
                    .foregroundStyle(action.color)
                    .frame(width: 44, height: 44)
                    .background(action.color.opacity(0.15), in: Circle())
                
                Text(action.title)
                    .font(.caption.bold())
                    .foregroundStyle(.primary)
                    .multilineTextAlignment(.center)
                    .lineLimit(2)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))
        }
        .buttonStyle(.plain)
        // Minimum touch target: 44x44pt (WCAG)
        .frame(minWidth: 44, minHeight: 44)
        .accessibilityLabel(action.title)
    }
}

// ── Persona Background ────────────────────────────────────────

struct PersonaBackground: View {
    let persona: HeavenPersona
    
    var body: some View {
        ZStack {
            LinearGradient(
                colors: persona.backgroundGradient,
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            
            // Ambient orbs
            GeometryReader { geo in
                Circle()
                    .fill(persona.primaryColor.opacity(0.08))
                    .frame(width: geo.size.width * 0.8)
                    .blur(radius: 60)
                    .offset(x: -geo.size.width * 0.2, y: -geo.size.height * 0.1)
                
                Circle()
                    .fill(persona.accentColor.opacity(0.06))
                    .frame(width: geo.size.width * 0.6)
                    .blur(radius: 80)
                    .offset(x: geo.size.width * 0.4, y: geo.size.height * 0.5)
            }
        }
    }
}

// ── Persona Switcher ──────────────────────────────────────────

struct PersonaSwitcher: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        Menu {
            ForEach(HeavenPersona.allCases, id: \.self) { persona in
                Button {
                    appState.switchPersona(to: persona)
                } label: {
                    Label(persona.displayName,
                          systemImage: persona == appState.persona ? "checkmark.circle.fill" : "circle")
                }
            }
        } label: {
            HStack(spacing: 6) {
                Circle()
                    .fill(appState.persona.primaryColor)
                    .frame(width: 10, height: 10)
                Text(appState.persona.displayName)
                    .font(.subheadline.bold())
                Image(systemName: "chevron.down")
                    .font(.caption)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(.ultraThinMaterial, in: Capsule())
        }
        .tint(appState.persona.primaryColor)
    }
}

// ── Waveform Component ────────────────────────────────────────

struct HeavenWaveform: View {
    let level: Float
    let color: Color
    
    @State private var bars: [CGFloat] = Array(repeating: 0.1, count: 30)
    let timer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()
    
    var body: some View {
        HStack(spacing: 3) {
            ForEach(Array(bars.enumerated()), id: \.offset) { _, height in
                RoundedRectangle(cornerRadius: 2)
                    .fill(color.gradient)
                    .frame(width: 4, height: max(4, height * 60))
                    .animation(.spring(response: 0.15), value: height)
            }
        }
        .onReceive(timer) { _ in
            for i in bars.indices {
                let base = CGFloat(level)
                bars[i] = max(0.1, base + CGFloat.random(in: -0.3...0.3))
            }
        }
    }
}

// ── Connection Badge ──────────────────────────────────────────

struct ConnectionBadge: View {
    let status: ConnectionStatus
    
    var statusColor: Color {
        switch status {
        case .connected:    return .green
        case .connecting:   return .yellow
        case .disconnected: return .gray
        case .error:        return .red
        }
    }
    
    var statusText: String {
        switch status {
        case .connected:    return "Live"
        case .connecting:   return "..."
        case .disconnected: return "Offline"
        case .error:        return "Error"
        }
    }
    
    var body: some View {
        HStack(spacing: 5) {
            Circle()
                .fill(statusColor)
                .frame(width: 8, height: 8)
                .shadow(color: statusColor, radius: 3)
            Text(statusText)
                .font(.caption.bold())
                .foregroundStyle(statusColor)
        }
        .padding(.horizontal, 10)
        .padding(.vertical, 5)
        .background(statusColor.opacity(0.1), in: Capsule())
    }
}

// ── Placeholder Views ─────────────────────────────────────────

struct VoiceStudioView: View {
    var body: some View {
        NavigationStack {
            Text("Voice Studio").navigationTitle("Voice Studio")
        }
    }
}

struct CreativeStudioView: View {
    var body: some View {
        NavigationStack {
            Text("Creative Studio").navigationTitle("Creative Studio")
        }
    }
}

struct ConnectView: View {
    var body: some View {
        NavigationStack {
            Text("Connections").navigationTitle("Connect")
        }
    }
}

struct SettingsView: View {
    var body: some View {
        NavigationStack {
            Text("Settings").navigationTitle("Settings")
        }
    }
}

struct SidebarView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        List(HeavenView.allCases, id: \.self, selection: $appState.activeView) { view in
            Label(view.rawValue, systemImage: view.icon)
        }
        .navigationTitle("Heaven")
        .toolbar { PersonaSwitcher() }
    }
}

struct DetailPlaceholderView: View {
    var body: some View {
        Text("Select a section")
            .foregroundStyle(.secondary)
    }
}

struct EmptyStateView: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "waveform.circle")
                .font(.system(size: 60))
                .foregroundStyle(appState.persona.primaryColor.opacity(0.5))
            Text("No conversations yet")
                .font(.headline)
                .foregroundStyle(.secondary)
            Text("Tap the voice orb to start talking with \(appState.persona.aiAssistant)")
                .font(.subheadline)
                .foregroundStyle(.tertiary)
                .multilineTextAlignment(.center)
        }
        .padding(40)
    }
}

struct ConversationsSection: View {
    @EnvironmentObject var appState: AppState
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Conversations")
                .font(.headline)
                .foregroundStyle(.secondary)
            
            ForEach(appState.conversations.prefix(5)) { conv in
                ConversationRow(conversation: conv)
            }
        }
    }
}

struct ConversationRow: View {
    let conversation: Conversation
    
    var body: some View {
        HStack {
            Image(systemName: "bubble.left.and.bubble.right.fill")
                .foregroundStyle(.secondary)
            VStack(alignment: .leading) {
                Text(conversation.messages.first?.content ?? "Empty")
                    .font(.subheadline)
                    .lineLimit(1)
                Text(conversation.createdAt.formatted(.relative(presentation: .named)))
                    .font(.caption)
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 12))
    }
}

// ── DreamChamberClient placeholder for compilation ────────────

@MainActor
final class DreamChamberClient: ObservableObject {
    static let shared = DreamChamberClient()
    @Published var modelCount: Int = 11
    @Published var isConnected: Bool = false
    
    func connect() async {
        // Connect to http://localhost:7777
        isConnected = true
    }
}

// ── Animation helper ──────────────────────────────────────────

extension Animation {
    func repeatWhile(_ condition: Bool, autoreverses: Bool = true) -> Animation {
        if condition {
            return self.repeatForever(autoreverses: autoreverses)
        }
        return self
    }
}
