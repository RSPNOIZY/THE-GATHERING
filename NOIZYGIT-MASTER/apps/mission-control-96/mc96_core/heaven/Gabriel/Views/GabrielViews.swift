// Gabriel — iPhone Views
// Command Center: compact, action-oriented, military-grade UI
// Electric cyan + neon green on deep dark — built for speed

import SwiftUI

struct GabrielRootView: View {
    @Environment(GabrielCommander.self) var cmd

    var body: some View {
        @Bindable var cmd = cmd
        ZStack {
            GabrielBackground().ignoresSafeArea()

            TabView(selection: $cmd.activeTab) {
                CommandView()
                    .tabItem { Label("Command", systemImage: "terminal.fill") }
                    .tag(GabrielTab.command)

                AgentsView()
                    .tabItem { Label("Agents", systemImage: "person.3.fill") }
                    .tag(GabrielTab.agents)

                DispatchView()
                    .tabItem { Label("Dispatch", systemImage: "arrow.up.right.square.fill") }
                    .tag(GabrielTab.dispatch)

                GabrielSettingsView()
                    .tabItem { Label("Config", systemImage: "gearshape.fill") }
                    .tag(GabrielTab.settings)
            }
            .tint(cmd.primaryColor)
        }
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Command View (Chat + Status)
// ═══════════════════════════════════════════════════════════

struct CommandView: View {
    @Environment(GabrielCommander.self) var cmd
    @State private var inputText = ""
    @FocusState private var inputFocused: Bool

    var body: some View {
        NavigationStack {
            ZStack(alignment: .bottom) {
                ScrollViewReader { proxy in
                    ScrollView(showsIndicators: false) {
                        VStack(spacing: 16) {
                            // Status header
                            statusHeader

                            // Notification feed
                            if !cmd.notifications.isEmpty {
                                notificationFeed
                            }

                            // Messages
                            if cmd.messages.isEmpty {
                                commandEmptyState.padding(.top, 20)
                            }
                            ForEach(cmd.messages) { msg in
                                CommandBubble(message: msg)
                                    .id(msg.id)
                            }
                            if cmd.isProcessing {
                                processingIndicator
                            }
                            Color.clear.frame(height: 100).id("bottom")
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                    }
                    .onChange(of: cmd.messages.count) { _, _ in
                        withAnimation { proxy.scrollTo("bottom") }
                    }
                }

                commandInput
            }
            .background(
                LinearGradient(colors: cmd.backgroundGradient, startPoint: .top, endPoint: .bottom)
                    .ignoresSafeArea()
            )
            .navigationTitle("Gabriel")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    HStack(spacing: 6) {
                        Image(systemName: cmd.status.icon)
                            .foregroundStyle(cmd.status.color)
                            .font(.caption)
                        Circle().fill(cmd.status.color).frame(width: 6, height: 6)
                            .shadow(color: cmd.status.color, radius: 3)
                    }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button { cmd.messages.removeAll() } label: {
                        Image(systemName: "trash").font(.caption).foregroundStyle(.white.opacity(0.4))
                    }
                }
            }
        }
    }

    // Status header card
    var statusHeader: some View {
        HStack(spacing: 12) {
            VStack(alignment: .leading, spacing: 4) {
                Text("GABRIEL")
                    .font(.system(size: 14, weight: .heavy, design: .monospaced))
                    .foregroundStyle(cmd.primaryColor)
                Text(cmd.role)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            Spacer()
            VStack(alignment: .trailing, spacing: 4) {
                HStack(spacing: 4) {
                    Circle().fill(cmd.status.color).frame(width: 6, height: 6)
                    Text(cmd.status.label.uppercased())
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .foregroundStyle(cmd.status.color)
                }
                Text("\(cmd.agents.filter(\.isOnline).count)/\(cmd.agents.count) agents")
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
        }
        .padding(12)
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(.ultraThinMaterial)
                .overlay(RoundedRectangle(cornerRadius: 12).stroke(cmd.primaryColor.opacity(0.2), lineWidth: 1))
        )
    }

    var notificationFeed: some View {
        VStack(spacing: 4) {
            ForEach(cmd.notifications.prefix(3)) { note in
                HStack(spacing: 8) {
                    Image(systemName: note.type.icon)
                        .font(.system(size: 10))
                        .foregroundStyle(note.type.color)
                    Text(note.message)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.6))
                        .lineLimit(1)
                    Spacer()
                    Text(note.timestamp.formatted(.dateTime.hour().minute().second()))
                        .font(.system(size: 9, design: .monospaced))
                        .foregroundStyle(.white.opacity(0.3))
                }
            }
        }
        .padding(10)
        .background(
            RoundedRectangle(cornerRadius: 10)
                .fill(.black.opacity(0.3))
                .overlay(RoundedRectangle(cornerRadius: 10).stroke(.white.opacity(0.06), lineWidth: 0.5))
        )
    }

    var commandEmptyState: some View {
        VStack(spacing: 16) {
            ZStack {
                Circle().fill(cmd.primaryColor.opacity(0.1)).frame(width: 80, height: 80)
                Image(systemName: "terminal")
                    .font(.system(size: 36, weight: .light))
                    .foregroundStyle(cmd.primaryColor)
            }
            Text("Command Interface Ready")
                .font(.system(size: 15, weight: .medium, design: .monospaced))
                .foregroundStyle(.white.opacity(0.5))

            VStack(spacing: 8) {
                ForEach(["status", "deploy heaven", "agents online", "dispatch keith.scan"], id: \.self) { cmd in
                    quickCommandChip(cmd)
                }
            }
        }
    }

    func quickCommandChip(_ text: String) -> some View {
        Button {
            inputText = text
            sendCommand()
        } label: {
            HStack(spacing: 6) {
                Text("❯").font(.system(size: 12, design: .monospaced)).foregroundStyle(cmd.accentColor)
                Text(text).font(.system(size: 12, design: .monospaced)).foregroundStyle(.white.opacity(0.6))
            }
            .padding(.horizontal, 14).padding(.vertical, 7)
            .background(Capsule().fill(.ultraThinMaterial)
                .overlay(Capsule().stroke(.white.opacity(0.1), lineWidth: 0.5)))
        }
        .buttonStyle(.plain)
    }

    var commandInput: some View {
        HStack(spacing: 10) {
            Text("❯")
                .font(.system(size: 16, weight: .bold, design: .monospaced))
                .foregroundStyle(cmd.accentColor)

            TextField("command...", text: $inputText)
                .font(.system(size: 14, design: .monospaced))
                .foregroundStyle(.white)
                .tint(cmd.primaryColor)
                .focused($inputFocused)
                .textInputAutocapitalization(.never)
                .autocorrectionDisabled()
                .onSubmit { sendCommand() }

            Button { sendCommand() } label: {
                Image(systemName: "return")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(inputText.isEmpty ? .white.opacity(0.2) : cmd.accentColor)
                    .frame(width: 32, height: 32)
                    .background(inputText.isEmpty ? .clear : cmd.accentColor.opacity(0.15), in: Circle())
            }
            .disabled(inputText.isEmpty || cmd.isProcessing)
        }
        .padding(.horizontal, 16)
        .padding(.vertical, 10)
        .background(
            Rectangle().fill(.ultraThinMaterial)
                .overlay(Rectangle().frame(height: 0.5).foregroundStyle(cmd.primaryColor.opacity(0.2)), alignment: .top)
        )
        .padding(.bottom, 28)
    }

    var processingIndicator: some View {
        HStack(spacing: 8) {
            ProgressView().tint(cmd.primaryColor)
            Text("processing...")
                .font(.system(size: 12, design: .monospaced))
                .foregroundStyle(cmd.primaryColor.opacity(0.7))
            Spacer()
        }
        .padding(.horizontal, 8)
    }

    private func sendCommand() {
        let text = inputText.trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else { return }
        inputText = ""
        Task { await cmd.send(text) }
    }
}

struct CommandBubble: View {
    let message: GabrielMessage
    var isUser: Bool { message.role == .user }

    var body: some View {
        HStack(alignment: .top, spacing: 8) {
            if !isUser {
                ZStack {
                    Circle().fill(LinearGradient(colors: [Color(hex: "00E5FF"), Color(hex: "2979FF")],
                                                 startPoint: .topLeading, endPoint: .bottomTrailing))
                        .frame(width: 24, height: 24)
                    Image(systemName: "bolt.fill").font(.system(size: 10)).foregroundStyle(.white)
                }
            }

            VStack(alignment: isUser ? .trailing : .leading, spacing: 2) {
                Text(message.content)
                    .font(.system(size: 13, design: isUser ? .monospaced : .rounded))
                    .foregroundStyle(.white.opacity(0.9))
                    .padding(.horizontal, 12).padding(.vertical, 8)
                    .background(
                        RoundedRectangle(cornerRadius: 14)
                            .fill(isUser ? AnyShapeStyle(Color(hex: "00E5FF").opacity(0.2))
                                        : AnyShapeStyle(.ultraThinMaterial))
                            .overlay(RoundedRectangle(cornerRadius: 14).stroke(.white.opacity(0.08), lineWidth: 0.5))
                    )
                Text(message.timestamp.formatted(.dateTime.hour().minute().second()))
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundStyle(.white.opacity(0.2))
            }
            .frame(maxWidth: 300, alignment: isUser ? .trailing : .leading)
            if isUser { Spacer() }
        }
        .frame(maxWidth: .infinity, alignment: isUser ? .trailing : .leading)
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Agents View
// ═══════════════════════════════════════════════════════════

struct AgentsView: View {
    @Environment(GabrielCommander.self) var cmd

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    // Summary
                    HStack {
                        VStack(alignment: .leading) {
                            Text("SWARM STATUS")
                                .font(.system(size: 11, weight: .heavy, design: .monospaced))
                                .foregroundStyle(cmd.primaryColor)
                            Text("\(cmd.agents.filter(\.isOnline).count) online / \(cmd.agents.count) total")
                                .font(.system(size: 12, design: .monospaced))
                                .foregroundStyle(.secondary)
                        }
                        Spacer()
                        Button {
                            Task { await cmd.refreshAgents() }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                                .font(.system(size: 14, weight: .bold))
                                .foregroundStyle(cmd.primaryColor)
                                .frame(width: 36, height: 36)
                                .background(cmd.primaryColor.opacity(0.15), in: Circle())
                        }
                    }
                    .padding(16)
                    .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))

                    // Agent cards
                    ForEach(cmd.agents) { agent in
                        agentCard(agent)
                    }
                }
                .padding(16)
            }
            .background(LinearGradient(colors: cmd.backgroundGradient, startPoint: .top, endPoint: .bottom).ignoresSafeArea())
            .navigationTitle("Agents")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        }
    }

    func agentCard(_ agent: AgentStatus) -> some View {
        HStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(agent.isOnline ? cmd.accentColor.opacity(0.15) : .gray.opacity(0.1))
                    .frame(width: 40, height: 40)
                Image(systemName: agent.isOnline ? "bolt.fill" : "bolt.slash.fill")
                    .font(.system(size: 16))
                    .foregroundStyle(agent.isOnline ? cmd.accentColor : .gray)
            }

            VStack(alignment: .leading, spacing: 2) {
                Text(agent.id.uppercased())
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundStyle(.primary)
                Text(agent.role)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(.secondary)
            }

            Spacer()

            Circle()
                .fill(agent.isOnline ? .green : .gray)
                .frame(width: 8, height: 8)
                .shadow(color: agent.isOnline ? .green : .clear, radius: 4)

            // Quick dispatch button
            if agent.isOnline {
                Button {
                    Task { await cmd.dispatch(agent: agent.id, signal: "ping") }
                } label: {
                    Image(systemName: "arrow.right.circle.fill")
                        .font(.system(size: 20))
                        .foregroundStyle(cmd.primaryColor)
                }
            }
        }
        .padding(14)
        .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 14))
        .overlay(
            RoundedRectangle(cornerRadius: 14)
                .stroke(agent.isOnline ? cmd.accentColor.opacity(0.15) : .clear, lineWidth: 1)
        )
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Dispatch View
// ═══════════════════════════════════════════════════════════

struct DispatchView: View {
    @Environment(GabrielCommander.self) var cmd
    @State private var selectedAgent = "keith"
    @State private var signal = ""

    var body: some View {
        NavigationStack {
            VStack(spacing: 16) {
                // Dispatch form
                VStack(spacing: 12) {
                    Text("DISPATCH SIGNAL")
                        .font(.system(size: 11, weight: .heavy, design: .monospaced))
                        .foregroundStyle(cmd.primaryColor)

                    // Agent picker
                    Picker("Agent", selection: $selectedAgent) {
                        ForEach(cmd.agents) { agent in
                            Text(agent.id.uppercased()).tag(agent.id)
                        }
                    }
                    .pickerStyle(.segmented)

                    // Signal input
                    HStack {
                        Text("→")
                            .font(.system(size: 16, design: .monospaced))
                            .foregroundStyle(cmd.primaryColor)
                        TextField("signal (e.g. deploy, scan, report)", text: $signal)
                            .font(.system(size: 13, design: .monospaced))
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                    }
                    .padding(12)
                    .background(
                        RoundedRectangle(cornerRadius: 10)
                            .fill(.black.opacity(0.3))
                            .overlay(RoundedRectangle(cornerRadius: 10).stroke(cmd.primaryColor.opacity(0.2), lineWidth: 1))
                    )

                    Button {
                        let s = signal; signal = ""
                        Task { await cmd.dispatch(agent: selectedAgent, signal: s) }
                    } label: {
                        HStack {
                            Image(systemName: "arrow.up.right.square.fill")
                            Text("DISPATCH")
                                .font(.system(size: 13, weight: .bold, design: .monospaced))
                        }
                        .foregroundStyle(.black)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(cmd.accentColor, in: RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(signal.isEmpty)
                    .opacity(signal.isEmpty ? 0.5 : 1)
                }
                .padding(16)
                .background(.ultraThinMaterial, in: RoundedRectangle(cornerRadius: 16))

                // Dispatch log
                ScrollView {
                    VStack(spacing: 6) {
                        ForEach(cmd.dispatches) { record in
                            HStack(spacing: 8) {
                                Image(systemName: record.status.icon)
                                    .font(.system(size: 12))
                                    .foregroundStyle(record.status.color)
                                Text(record.agent.uppercased())
                                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                                    .foregroundStyle(cmd.primaryColor)
                                Text(".\(record.signal)")
                                    .font(.system(size: 11, design: .monospaced))
                                    .foregroundStyle(.white.opacity(0.6))
                                Spacer()
                                Text(record.timestamp.formatted(.dateTime.hour().minute().second()))
                                    .font(.system(size: 9, design: .monospaced))
                                    .foregroundStyle(.white.opacity(0.3))
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
            }
            .padding(16)
            .background(LinearGradient(colors: cmd.backgroundGradient, startPoint: .top, endPoint: .bottom).ignoresSafeArea())
            .navigationTitle("Dispatch")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        }
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Settings
// ═══════════════════════════════════════════════════════════

struct GabrielSettingsView: View {
    @Environment(GabrielCommander.self) var cmd

    var body: some View {
        @Bindable var cmd = cmd
        NavigationStack {
            Form {
                Section("Connection") {
                    Toggle("Cloudflare Tunnel", isOn: $cmd.useTunnel)
                    TextField("Server", text: $cmd.serverURL)
                        .font(.system(size: 13, design: .monospaced))
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                    HStack {
                        Text("Status")
                        Spacer()
                        HStack(spacing: 4) {
                            Image(systemName: cmd.status.icon).font(.caption)
                            Text(cmd.status.label.uppercased())
                                .font(.system(size: 10, weight: .bold, design: .monospaced))
                        }
                        .foregroundStyle(cmd.status.color)
                    }
                    Button("Reconnect") { Task { await cmd.boot() } }
                }

                Section("Identity") {
                    HStack { Text("Name"); Spacer(); Text("Gabriel").foregroundStyle(.secondary) }
                    HStack { Text("Role"); Spacer(); Text("Release Commander").foregroundStyle(.secondary) }
                    HStack { Text("Tunnel"); Spacer(); Text("gabriel.dreamchamber.noizy.ai").font(.system(size: 11, design: .monospaced)).foregroundStyle(.secondary) }
                    HStack { Text("Port"); Spacer(); Text("7777").font(.system(size: 11, design: .monospaced)).foregroundStyle(.secondary) }
                }

                Section("Diagnostics") {
                    HStack { Text("Messages"); Spacer(); Text("\(cmd.messages.count)").foregroundStyle(.secondary) }
                    HStack { Text("Dispatches"); Spacer(); Text("\(cmd.dispatches.count)").foregroundStyle(.secondary) }
                    HStack { Text("Agents"); Spacer(); Text("\(cmd.agents.count)").foregroundStyle(.secondary) }
                    Button("Clear All Data", role: .destructive) {
                        cmd.messages.removeAll()
                        cmd.dispatches.removeAll()
                        cmd.notifications.removeAll()
                    }
                }
            }
            .navigationTitle("Config")
            .scrollContentBackground(.hidden)
        }
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Background
// ═══════════════════════════════════════════════════════════

struct GabrielBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "000A12"), Color(hex: "01141F"), Color(hex: "0A192F")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            GeometryReader { geo in
                Circle()
                    .fill(Color(hex: "00E5FF").opacity(0.04))
                    .frame(width: geo.size.width * 0.7)
                    .blur(radius: 50)
                    .offset(x: -geo.size.width * 0.1, y: -geo.size.height * 0.15)
                Circle()
                    .fill(Color(hex: "76FF03").opacity(0.03))
                    .frame(width: geo.size.width * 0.5)
                    .blur(radius: 60)
                    .offset(x: geo.size.width * 0.3, y: geo.size.height * 0.6)
            }
        }
    }
}
