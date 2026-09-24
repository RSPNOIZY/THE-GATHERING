import SwiftUI

// ════════════════════════════════════════════════════════════
// LucyRootView — Main iPad UI for Lucy Heaven Wrapper
// Full-screen, no chrome. Voice orb always present.
// MCP console accessible via swipe up.
// AirPlay visible in toolbar.
// ════════════════════════════════════════════════════════════

struct LucyRootView: View {
    @EnvironmentObject var mcpEngine:    MCPEngine
    @EnvironmentObject var heavenBridge: HeavenWorkerBridge
    @EnvironmentObject var airplay:      AirPlayRouter
    @EnvironmentObject var agentMemory:  AgentMemory
    @EnvironmentObject var ztProxy:      ZeroTrustProxy
    
    @State private var showMCPConsole:     Bool = false
    @State private var showAirPlaySheet:   Bool = false
    @State private var showMemoryBrowser:  Bool = false
    @State private var activeConversation: [ChatMessage] = []
    @State private var userInput:          String = ""
    @State private var isProcessing:       Bool = false
    
    var body: some View {
        ZStack {
            // ── Background ───────────────────────────────────
            LucyBackground()
                .ignoresSafeArea()
            
            // ── Main Content ─────────────────────────────────
            VStack(spacing: 0) {
                // Top bar
                TopBar(
                    onAirPlay: { showAirPlaySheet = true },
                    onMemory:  { showMemoryBrowser = true },
                    onConsole: { showMCPConsole = true }
                )
                
                // Conversation
                ConversationView(messages: activeConversation, isProcessing: isProcessing)
                
                // Input bar
                InputBar(
                    text: $userInput,
                    isProcessing: isProcessing,
                    onSend: sendMessage,
                    onVoice: activateVoice
                )
            }
            
            // ── Status strip ─────────────────────────────────
            VStack {
                Spacer()
                StatusStrip()
                    .padding(.bottom, 8)
            }
            .ignoresSafeArea(edges: .bottom)
        }
        // ── Sheets ────────────────────────────────────────────
        .sheet(isPresented: $showMCPConsole) {
            MCPConsoleSheet()
                .environmentObject(mcpEngine)
                .presentationDetents([.medium, .large])
                .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showAirPlaySheet) {
            AirPlaySheet()
                .environmentObject(airplay)
                .presentationDetents([.medium])
                .presentationDragIndicator(.visible)
        }
        .sheet(isPresented: $showMemoryBrowser) {
            MemoryBrowserSheet()
                .environmentObject(agentMemory)
                .presentationDetents([.large])
                .presentationDragIndicator(.visible)
        }
    }
    
    // ── Send Message ──────────────────────────────────────────
    
    private func sendMessage() {
        guard !userInput.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else { return }
        
        let text = userInput
        userInput = ""
        isProcessing = true
        
        let userMsg = ChatMessage(role: .user, content: text)
        activeConversation.append(userMsg)
        
        Task {
            let result = await heavenBridge.runAgent(prompt: text)
            let reply  = ChatMessage(role: .assistant, content: result.output)
            activeConversation.append(reply)
            isProcessing = false
        }
    }
    
    private func activateVoice() {
        // Trigger VoiceEngine listening
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — Sub-views
// ════════════════════════════════════════════════════════════

// ── Background ────────────────────────────────────────────────

struct LucyBackground: View {
    @State private var animOffset: CGFloat = 0
    
    var body: some View {
        ZStack {
            Color(hex: "#0D0010")
            
            // Animated gradient orbs
            GeometryReader { geo in
                Circle()
                    .fill(Color(hex: "#FF6B9D").opacity(0.12))
                    .frame(width: geo.size.width * 0.7)
                    .blur(radius: 80)
                    .offset(x: geo.size.width * 0.1, y: animOffset)
                
                Circle()
                    .fill(Color(hex: "#B44FD4").opacity(0.10))
                    .frame(width: geo.size.width * 0.6)
                    .blur(radius: 100)
                    .offset(x: geo.size.width * 0.5, y: geo.size.height * 0.5)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 8).repeatForever(autoreverses: true)) {
                animOffset = 100
            }
        }
    }
}

// ── Top Bar ───────────────────────────────────────────────────

struct TopBar: View {
    @EnvironmentObject var ztProxy:      ZeroTrustProxy
    @EnvironmentObject var mcpEngine:    MCPEngine
    @EnvironmentObject var heavenBridge: HeavenWorkerBridge
    
    let onAirPlay: () -> Void
    let onMemory:  () -> Void
    let onConsole: () -> Void
    
    var body: some View {
        HStack(spacing: 16) {
            // Lucy wordmark
            HStack(spacing: 6) {
                Circle()
                    .fill(Color(hex: "#FF6B9D"))
                    .frame(width: 10, height: 10)
                    .shadow(color: Color(hex: "#FF6B9D"), radius: 4)
                Text("Lucy")
                    .font(.system(size: 20, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text("/ Heaven")
                    .font(.system(size: 14, weight: .regular))
                    .foregroundStyle(.tertiary)
            }
            
            Spacer()
            
            // ZT Status
            ZTStatusBadge(proxy: ztProxy)
            
            // MCP status
            MCPStatusBadge(engine: mcpEngine)
            
            // AirPlay
            Button(action: onAirPlay) {
                Image(systemName: "airplayvideo")
                    .font(.title3)
                    .foregroundStyle(
                        airplay.activeStreams.isEmpty
                        ? Color.secondary
                        : Color(hex: "#FF6B9D")
                    )
            }
            .accessibilityLabel("AirPlay devices")
            
            // Memory
            Button(action: onMemory) {
                Image(systemName: "brain")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            .accessibilityLabel("Agent memory")
            
            // MCP Console
            Button(action: onConsole) {
                Image(systemName: "terminal")
                    .font(.title3)
                    .foregroundStyle(.secondary)
            }
            .accessibilityLabel("MCP console")
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 14)
        .background(.ultraThinMaterial)
    }
}

// Fix: add missing property
extension TopBar {
    var airplay: AirPlayRouter { AirPlayRouter.shared }
}

// ── ZT / MCP Badges ───────────────────────────────────────────

struct ZTStatusBadge: View {
    let proxy: ZeroTrustProxy
    
    var color: Color {
        switch proxy.tunnelStatus {
        case .connected, .tunneled: return .green
        case .connecting:           return .yellow
        case .direct:               return .orange
        default:                    return .red
        }
    }
    
    var icon: String {
        switch proxy.tunnelStatus {
        case .connected, .tunneled: return "lock.shield.fill"
        case .direct:               return "lock.open.fill"
        default:                    return "shield.slash"
        }
    }
    
    var body: some View {
        HStack(spacing: 4) {
            Image(systemName: icon)
                .font(.caption)
                .foregroundStyle(color)
            Text(proxy.tunnelStatus.rawValue.capitalized)
                .font(.caption2.bold())
                .foregroundStyle(color)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(color.opacity(0.12), in: Capsule())
    }
}

struct MCPStatusBadge: View {
    let engine: MCPEngine
    
    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(engine.status == .running ? .green : .gray)
                .frame(width: 6, height: 6)
            Text("MCP \(engine.registeredTools.count)T")
                .font(.caption2.bold())
                .foregroundStyle(.secondary)
        }
        .padding(.horizontal, 8)
        .padding(.vertical, 4)
        .background(.white.opacity(0.07), in: Capsule())
    }
}

// ── Conversation ──────────────────────────────────────────────

struct ConversationView: View {
    let messages: [ChatMessage]
    let isProcessing: Bool
    
    var body: some View {
        ScrollViewReader { proxy in
            ScrollView {
                LazyVStack(alignment: .leading, spacing: 16) {
                    if messages.isEmpty {
                        EmptyConversationHint()
                            .padding(.top, 60)
                    }
                    
                    ForEach(messages) { msg in
                        MessageBubble(message: msg)
                            .id(msg.id)
                    }
                    
                    if isProcessing {
                        TypingIndicator()
                            .id("typing")
                    }
                }
                .padding(20)
            }
            .onChange(of: messages.count) { _, _ in
                withAnimation { proxy.scrollTo(messages.last?.id) }
            }
            .onChange(of: isProcessing) { _, processing in
                if processing { withAnimation { proxy.scrollTo("typing") } }
            }
        }
    }
}

struct EmptyConversationHint: View {
    var body: some View {
        VStack(spacing: 20) {
            Image(systemName: "waveform.circle")
                .font(.system(size: 64))
                .foregroundStyle(Color(hex: "#FF6B9D").opacity(0.4))
                .symbolEffect(.pulse)
            
            VStack(spacing: 8) {
                Text("Hi, I'm Lucy")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(.white)
                Text("Your heaven-powered creative companion.\nType or speak to start.")
                    .font(.body)
                    .foregroundStyle(.secondary)
                    .multilineTextAlignment(.center)
            }
            
            HStack(spacing: 12) {
                QuickStartChip(label: "What can you do?")
                QuickStartChip(label: "Save a memory")
                QuickStartChip(label: "Play music")
            }
        }
        .frame(maxWidth: .infinity)
    }
}

struct QuickStartChip: View {
    let label: String
    
    var body: some View {
        Text(label)
            .font(.subheadline)
            .foregroundStyle(Color(hex: "#FF6B9D"))
            .padding(.horizontal, 14)
            .padding(.vertical, 8)
            .background(Color(hex: "#FF6B9D").opacity(0.12), in: Capsule())
            .overlay(Capsule().stroke(Color(hex: "#FF6B9D").opacity(0.3), lineWidth: 1))
    }
}

struct MessageBubble: View {
    let message: ChatMessage
    
    var isUser: Bool { message.role == .user }
    
    var body: some View {
        HStack {
            if isUser { Spacer(minLength: 60) }
            
            VStack(alignment: isUser ? .trailing : .leading, spacing: 4) {
                if !isUser {
                    Label("Lucy", systemImage: "sparkles")
                        .font(.caption2)
                        .foregroundStyle(Color(hex: "#FF6B9D"))
                }
                
                Text(message.content)
                    .font(.body)
                    .foregroundStyle(.primary)
                    .padding(.horizontal, 16)
                    .padding(.vertical, 12)
                    .background(
                        isUser
                        ? Color(hex: "#FF6B9D").opacity(0.2)
                        : Color.white.opacity(0.07),
                        in: RoundedRectangle(cornerRadius: 18, style: .continuous)
                    )
                    .overlay(
                        RoundedRectangle(cornerRadius: 18, style: .continuous)
                            .stroke(
                                isUser
                                ? Color(hex: "#FF6B9D").opacity(0.4)
                                : Color.white.opacity(0.08),
                                lineWidth: 1
                            )
                    )
                
                Text(message.timestamp.formatted(.relative(presentation: .named)))
                    .font(.caption2)
                    .foregroundStyle(.tertiary)
            }
            
            if !isUser { Spacer(minLength: 60) }
        }
    }
}

struct TypingIndicator: View {
    @State private var opacity1: Double = 0.3
    @State private var opacity2: Double = 0.3
    @State private var opacity3: Double = 0.3
    
    var body: some View {
        HStack(spacing: 5) {
            ForEach([opacity1, opacity2, opacity3], id: \.self) { op in
                Circle()
                    .fill(Color(hex: "#FF6B9D"))
                    .frame(width: 8, height: 8)
                    .opacity(op)
            }
        }
        .padding(14)
        .background(Color.white.opacity(0.07), in: RoundedRectangle(cornerRadius: 18))
        .onAppear { animateDots() }
    }
    
    private func animateDots() {
        let anim = Animation.easeInOut(duration: 0.5)
        withAnimation(anim.delay(0.0)) { opacity1 = 1.0 }
        withAnimation(anim.delay(0.2)) { opacity2 = 1.0 }
        withAnimation(anim.delay(0.4)) { opacity3 = 1.0 }
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.8) {
            withAnimation(anim) { opacity1 = 0.3; opacity2 = 0.3; opacity3 = 0.3 }
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.6) { animateDots() }
        }
    }
}

// ── Input Bar ─────────────────────────────────────────────────

struct InputBar: View {
    @Binding var text: String
    let isProcessing: Bool
    let onSend: () -> Void
    let onVoice: () -> Void
    
    var body: some View {
        HStack(spacing: 12) {
            // Voice button
            Button(action: onVoice) {
                Image(systemName: "mic.fill")
                    .font(.title3)
                    .foregroundStyle(.white)
                    .frame(width: 44, height: 44)
                    .background(Color(hex: "#FF6B9D"), in: Circle())
                    .shadow(color: Color(hex: "#FF6B9D").opacity(0.5), radius: 8)
            }
            .accessibilityLabel("Voice input")
            
            // Text field
            TextField("Message Lucy...", text: $text, axis: .vertical)
                .font(.body)
                .foregroundStyle(.white)
                .padding(.horizontal, 16)
                .padding(.vertical, 12)
                .background(Color.white.opacity(0.08), in: RoundedRectangle(cornerRadius: 22))
                .overlay(
                    RoundedRectangle(cornerRadius: 22)
                        .stroke(Color.white.opacity(0.1), lineWidth: 1)
                )
                .lineLimit(1...5)
                .onSubmit(onSend)
            
            // Send button
            Button(action: onSend) {
                Image(systemName: isProcessing ? "ellipsis" : "arrow.up.circle.fill")
                    .font(.title2)
                    .foregroundStyle(
                        text.isEmpty ? .tertiary : Color(hex: "#FF6B9D")
                    )
                    .symbolEffect(.pulse, isActive: isProcessing)
            }
            .disabled(text.isEmpty || isProcessing)
            .accessibilityLabel("Send message")
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
    }
}

// ── Status Strip ──────────────────────────────────────────────

struct StatusStrip: View {
    @EnvironmentObject var agentMemory: AgentMemory
    @EnvironmentObject var airplay:     AirPlayRouter
    
    var body: some View {
        HStack(spacing: 16) {
            Label("\(agentMemory.entries.count) memories", systemImage: "brain")
            Label("\(airplay.discoveredDevices.count) devices", systemImage: "airplayvideo")
            if agentMemory.syncStatus == .syncing {
                Label("Syncing D1...", systemImage: "arrow.triangle.2.circlepath")
                    .symbolEffect(.rotate)
            }
        }
        .font(.caption2)
        .foregroundStyle(.tertiary)
        .frame(maxWidth: .infinity)
        .padding(.vertical, 4)
        .background(.ultraThinMaterial)
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — MCP Console Sheet
// ════════════════════════════════════════════════════════════

struct MCPConsoleSheet: View {
    @EnvironmentObject var mcpEngine: MCPEngine
    
    var body: some View {
        NavigationStack {
            List {
                Section("Registered Tools (\(mcpEngine.registeredTools.count))") {
                    ForEach(mcpEngine.registeredTools) { tool in
                        VStack(alignment: .leading, spacing: 4) {
                            Text(tool.name)
                                .font(.subheadline.monospaced().bold())
                                .foregroundStyle(Color(hex: "#FF6B9D"))
                            Text(tool.description)
                                .font(.caption)
                                .foregroundStyle(.secondary)
                        }
                        .padding(.vertical, 4)
                    }
                }
                
                Section("Registered Resources (\(mcpEngine.registeredResources.count))") {
                    ForEach(mcpEngine.registeredResources) { resource in
                        VStack(alignment: .leading, spacing: 2) {
                            Text(resource.uri)
                                .font(.caption.monospaced())
                                .foregroundStyle(.primary)
                            Text(resource.name)
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
                
                Section("Recent Calls (\(mcpEngine.callLog.count))") {
                    ForEach(mcpEngine.callLog.reversed().prefix(50)) { record in
                        HStack {
                            Text(record.request.method)
                                .font(.caption.monospaced())
                                .foregroundStyle(.primary)
                            Spacer()
                            Text(String(format: "%.0fms", record.duration * 1000))
                                .font(.caption2)
                                .foregroundStyle(.secondary)
                        }
                    }
                }
            }
            .navigationTitle("MCP Console")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

// ── AirPlay Sheet ─────────────────────────────────────────────

struct AirPlaySheet: View {
    @EnvironmentObject var airplay: AirPlayRouter
    
    var body: some View {
        NavigationStack {
            List {
                Section("Discovered Devices (\(airplay.discoveredDevices.count))") {
                    if airplay.discoveredDevices.isEmpty {
                        Text("No devices found — make sure devices are on same network")
                            .font(.subheadline)
                            .foregroundStyle(.secondary)
                    }
                    
                    ForEach(airplay.discoveredDevices) { device in
                        HStack {
                            Image(systemName: device.type.icon)
                                .foregroundStyle(Color(hex: "#FF6B9D"))
                            VStack(alignment: .leading) {
                                Text(device.name)
                                    .font(.subheadline.bold())
                                Text(device.type.rawValue)
                                    .font(.caption)
                                    .foregroundStyle(.secondary)
                            }
                            Spacer()
                            
                            if airplay.activeStreams[device.id] != nil {
                                Button("Stop") {
                                    airplay.stopStream(deviceId: device.id)
                                }
                                .buttonStyle(.bordered)
                                .tint(.red)
                            } else {
                                Button("Stream") {
                                    Task { _ = await airplay.streamTo(deviceId: device.id) }
                                }
                                .buttonStyle(.bordered)
                                .tint(Color(hex: "#FF6B9D"))
                            }
                        }
                    }
                }
                
                Section("Master Volume") {
                    Slider(value: Binding(
                        get: { Double(airplay.masterVolume) },
                        set: { airplay.setVolume(Float($0)) }
                    ))
                    .tint(Color(hex: "#FF6B9D"))
                }
                
                Section {
                    Button("Stream to All Devices") {
                        Task { await airplay.streamToAll() }
                    }
                    .foregroundStyle(Color(hex: "#FF6B9D"))
                }
            }
            .navigationTitle("AirPlay")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Refresh") {
                        Task { await airplay.startDiscovery() }
                    }
                }
            }
        }
    }
}

// ── Memory Browser ────────────────────────────────────────────

struct MemoryBrowserSheet: View {
    @EnvironmentObject var agentMemory: AgentMemory
    @State private var searchText = ""
    
    var filtered: [MemoryEntry] {
        if searchText.isEmpty { return Array(agentMemory.entries.values) }
        return agentMemory.entries.values.filter {
            $0.key.localizedCaseInsensitiveContains(searchText) ||
            $0.value.localizedCaseInsensitiveContains(searchText)
        }
    }
    
    var body: some View {
        NavigationStack {
            List(filtered) { entry in
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(entry.key)
                            .font(.subheadline.monospaced().bold())
                        Spacer()
                        Image(systemName: entry.synced ? "cloud.fill" : "icloud.slash")
                            .font(.caption)
                            .foregroundStyle(entry.synced ? .green : .secondary)
                    }
                    Text(entry.value)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                        .lineLimit(2)
                }
            }
            .searchable(text: $searchText, prompt: "Search memories")
            .navigationTitle("Agent Memory (\(agentMemory.entries.count))")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .primaryAction) {
                    Button("Sync D1") {
                        Task { await agentMemory.syncWithD1() }
                    }
                    .foregroundStyle(Color(hex: "#FF6B9D"))
                }
            }
        }
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — Chat Model
// ════════════════════════════════════════════════════════════

struct ChatMessage: Identifiable, Sendable {
    let id = UUID()
    enum Role: Sendable { case user, assistant }
    let role: Role
    let content: String
    let timestamp = Date()
}

// ── Color Hex Extension ───────────────────────────────────────

extension Color {
    init(hex: String) {
        let hex = hex.trimmingCharacters(in: CharacterSet.alphanumerics.inverted)
        var int: UInt64 = 0
        Scanner(string: hex).scanHexInt64(&int)
        let a, r, g, b: UInt64
        switch hex.count {
        case 3: (a, r, g, b) = (255, (int >> 8) * 17, (int >> 4 & 0xF) * 17, (int & 0xF) * 17)
        case 6: (a, r, g, b) = (255, int >> 16, int >> 8 & 0xFF, int & 0xFF)
        case 8: (a, r, g, b) = (int >> 24, int >> 16 & 0xFF, int >> 8 & 0xFF, int & 0xFF)
        default: (a, r, g, b) = (255, 255, 255, 255)
        }
        self.init(.sRGB, red: Double(r)/255, green: Double(g)/255, blue: Double(b)/255, opacity: Double(a)/255)
    }
}
