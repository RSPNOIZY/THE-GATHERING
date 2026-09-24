// Micky — macOS Views
// Legacy Bridge Dashboard — warm amber/steel on dark
// Retro-industrial aesthetic for the old MacBook Pro

import SwiftUI

struct MickyRootView: View {
    @Environment(MickyBridge.self) var bridge

    var body: some View {
        ZStack {
            MickyBackground().ignoresSafeArea()

            VStack(spacing: 0) {
                // Custom title bar
                titleBar

                // Main content
                ScrollView(showsIndicators: false) {
                    VStack(spacing: 20) {
                        statusPanel
                        audioPanel
                        bridgePanel
                        systemPanel
                        logPanel
                    }
                    .padding(20)
                }
            }
        }
    }

    // ── Title Bar ────────────────────────────────────────────

    var titleBar: some View {
        HStack {
            HStack(spacing: 8) {
                Image(systemName: "desktopcomputer")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundStyle(bridge.primaryColor)
                Text("MICKY")
                    .font(.system(size: 13, weight: .heavy, design: .monospaced))
                    .foregroundStyle(bridge.primaryColor)
                Text("·")
                    .foregroundStyle(.white.opacity(0.3))
                Text(bridge.role)
                    .font(.system(size: 11, design: .monospaced))
                    .foregroundStyle(.secondary)
            }
            Spacer()
            HStack(spacing: 6) {
                Circle().fill(bridge.status.color).frame(width: 6, height: 6)
                    .shadow(color: bridge.status.color, radius: 3)
                Text(bridge.status.rawValue.uppercased())
                    .font(.system(size: 9, weight: .bold, design: .monospaced))
                    .foregroundStyle(bridge.status.color)
            }
            .padding(.horizontal, 8).padding(.vertical, 4)
            .background(bridge.status.color.opacity(0.1), in: Capsule())
        }
        .padding(.horizontal, 20)
        .padding(.vertical, 12)
        .background(.ultraThinMaterial)
        .overlay(
            Rectangle().frame(height: 0.5).foregroundStyle(bridge.primaryColor.opacity(0.2)),
            alignment: .bottom
        )
    }

    // ── Status Panel ─────────────────────────────────────────

    var statusPanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("CONNECTION", icon: "antenna.radiowaves.left.and.right")

            HStack(spacing: 16) {
                statusItem("GOD", value: bridge.lastPing != nil ? "Reachable" : "Unknown",
                           color: bridge.lastPing != nil ? .green : .gray)
                statusItem("Route", value: bridge.tunnelActive ? "Tunnel" : "LAN",
                           color: bridge.tunnelActive ? .blue : bridge.accentColor)
                statusItem("Latency", value: String(format: "%.0fms", bridge.latencyMs),
                           color: bridge.latencyMs < 10 ? .green : bridge.latencyMs < 100 ? .yellow : .red)
            }

            HStack {
                Button("Test Connection") {
                    Task { await bridge.checkGOD() }
                }
                .buttonStyle(MickyButtonStyle(color: bridge.primaryColor))

                Spacer()

                if let ping = bridge.lastPing {
                    Text("Last: \(ping.formatted(.dateTime.hour().minute().second()))")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(.secondary)
                }
            }
        }
        .mickyCard()
    }

    // ── Audio Panel ──────────────────────────────────────────

    var audioPanel: some View {
        @Bindable var bridge = bridge
        return VStack(alignment: .leading, spacing: 12) {
            sectionHeader("AUDIO CAPTURE", icon: "waveform")

            // Device picker
            VStack(alignment: .leading, spacing: 6) {
                Text("Input Device")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(.secondary)

                Picker("Device", selection: $bridge.selectedDevice) {
                    Text("None").tag(Optional<AudioDevice>.none)
                    ForEach(bridge.audioDevices) { device in
                        HStack {
                            if device.isLoopback {
                                Image(systemName: "arrow.triangle.2.circlepath.circle.fill")
                            }
                            Text(device.name)
                        }
                        .tag(Optional(device))
                    }
                }
                .labelsHidden()
            }

            // Format settings
            HStack(spacing: 12) {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Format").font(.system(size: 10, weight: .bold, design: .monospaced)).foregroundStyle(.secondary)
                    Picker("Format", selection: $bridge.captureFormat) {
                        ForEach(CaptureFormat.allCases, id: \.self) { fmt in
                            Text(fmt.rawValue).tag(fmt)
                        }
                    }
                    .labelsHidden()
                    .frame(width: 100)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Sample Rate").font(.system(size: 10, weight: .bold, design: .monospaced)).foregroundStyle(.secondary)
                    Picker("Rate", selection: $bridge.sampleRate) {
                        Text("44.1 kHz").tag(44100)
                        Text("48 kHz").tag(48000)
                        Text("96 kHz").tag(96000)
                    }
                    .labelsHidden()
                    .frame(width: 100)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("Channels").font(.system(size: 10, weight: .bold, design: .monospaced)).foregroundStyle(.secondary)
                    Picker("Channels", selection: $bridge.channels) {
                        Text("Mono").tag(1)
                        Text("Stereo").tag(2)
                    }
                    .labelsHidden()
                    .frame(width: 80)
                }
            }

            // Audio level meter
            if bridge.isCapturing {
                HStack(spacing: 2) {
                    ForEach(0..<30, id: \.self) { i in
                        RoundedRectangle(cornerRadius: 1)
                            .fill(i < 20 ? bridge.accentColor : i < 25 ? .yellow : .red)
                            .frame(width: 8, height: CGFloat.random(in: 4...20))
                            .opacity(Float(i) / 30.0 < bridge.audioLevel ? 1 : 0.2)
                    }
                }
                .frame(height: 20)
            }

            // Capture controls
            HStack {
                if bridge.isCapturing {
                    Button("Stop") { bridge.stopCapture() }
                        .buttonStyle(MickyButtonStyle(color: .red))
                } else {
                    Button("Start Capture") {
                        Task { await bridge.startCapture() }
                    }
                    .buttonStyle(MickyButtonStyle(color: bridge.accentColor))
                    .disabled(bridge.selectedDevice == nil)
                }

                Spacer()

                if bridge.isCapturing {
                    HStack(spacing: 4) {
                        Circle().fill(.red).frame(width: 6, height: 6)
                        Text("LIVE")
                            .font(.system(size: 10, weight: .bold, design: .monospaced))
                            .foregroundStyle(.red)
                    }
                }
            }
        }
        .mickyCard()
    }

    // ── Bridge Panel ─────────────────────────────────────────

    var bridgePanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("BRIDGE SERVER", icon: "server.rack")

            HStack(spacing: 16) {
                statusItem("Port", value: ":\(bridge.bridgePort)",
                           color: bridge.bridgeRunning ? bridge.accentColor : .gray)
                statusItem("Status", value: bridge.bridgeRunning ? "Running" : "Stopped",
                           color: bridge.bridgeRunning ? .green : .gray)
                statusItem("Clients", value: "\(bridge.connectedClients)",
                           color: bridge.connectedClients > 0 ? bridge.primaryColor : .gray)
            }

            if bridge.isCapturing {
                Text("curl http://localhost:\(bridge.bridgePort)/stream/audio")
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(bridge.primaryColor.opacity(0.7))
                    .padding(8)
                    .background(.black.opacity(0.3), in: RoundedRectangle(cornerRadius: 6))
            }
        }
        .mickyCard()
    }

    // ── System Panel ─────────────────────────────────────────

    var systemPanel: some View {
        VStack(alignment: .leading, spacing: 12) {
            sectionHeader("SYSTEM", icon: "cpu")

            HStack(spacing: 16) {
                statusItem("CPU", value: String(format: "%.0f%%", bridge.cpuUsage),
                           color: bridge.cpuUsage < 50 ? .green : bridge.cpuUsage < 80 ? .yellow : .red)
                statusItem("Memory", value: String(format: "%.0f%%", bridge.memoryUsage),
                           color: bridge.memoryUsage < 70 ? .green : .yellow)
                statusItem("Uptime", value: bridge.uptime, color: bridge.dimColor)
            }

            HStack {
                VStack(alignment: .leading, spacing: 2) {
                    Text(bridge.macModel)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(.secondary)
                    Text("macOS \(bridge.osVersion)")
                        .font(.system(size: 10, design: .monospaced))
                        .foregroundStyle(.tertiary)
                }
                Spacer()
                Text("10.0.0.100")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundStyle(bridge.primaryColor.opacity(0.6))
            }
        }
        .mickyCard()
    }

    // ── Log Panel ────────────────────────────────────────────

    var logPanel: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                sectionHeader("LOG", icon: "text.alignleft")
                Spacer()
                Button("Clear") { bridge.logs.removeAll() }
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(.secondary)
            }

            VStack(spacing: 2) {
                ForEach(bridge.logs.prefix(15)) { entry in
                    HStack(spacing: 6) {
                        Image(systemName: entry.type.icon)
                            .font(.system(size: 9))
                            .foregroundStyle(entry.type.color)
                        Text(entry.message)
                            .font(.system(size: 10, design: .monospaced))
                            .foregroundStyle(.white.opacity(0.7))
                            .lineLimit(1)
                        Spacer()
                        Text(entry.timestamp.formatted(.dateTime.hour().minute().second()))
                            .font(.system(size: 8, design: .monospaced))
                            .foregroundStyle(.white.opacity(0.25))
                    }
                    .padding(.vertical, 2)
                }
            }
        }
        .mickyCard()
    }

    // ── Helpers ──────────────────────────────────────────────

    func sectionHeader(_ title: String, icon: String) -> some View {
        HStack(spacing: 6) {
            Image(systemName: icon)
                .font(.system(size: 10))
                .foregroundStyle(bridge.primaryColor)
            Text(title)
                .font(.system(size: 10, weight: .heavy, design: .monospaced))
                .foregroundStyle(bridge.primaryColor)
        }
    }

    func statusItem(_ label: String, value: String, color: Color) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 9, weight: .bold, design: .monospaced))
                .foregroundStyle(.secondary)
            Text(value)
                .font(.system(size: 13, weight: .bold, design: .monospaced))
                .foregroundStyle(color)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Menu Bar View
// ═══════════════════════════════════════════════════════════

struct MenuBarView: View {
    @Environment(MickyBridge.self) var bridge

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("MICKY").font(.system(size: 11, weight: .heavy, design: .monospaced))
                Spacer()
                Circle().fill(bridge.status.color).frame(width: 6, height: 6)
                Text(bridge.status.rawValue).font(.system(size: 10, design: .monospaced))
            }

            Divider()

            if bridge.isCapturing {
                Label("Streaming: \(bridge.selectedDevice?.name ?? "—")", systemImage: "waveform")
                    .font(.system(size: 11))
                Button("Stop Capture") { bridge.stopCapture() }
            } else {
                Button("Start Capture") { Task { await bridge.startCapture() } }
                    .disabled(bridge.selectedDevice == nil)
            }

            Divider()

            Button("Test GOD Connection") { Task { await bridge.checkGOD() } }

            Divider()

            Button("Quit Micky") { NSApplication.shared.terminate(nil) }
        }
        .padding(8)
        .frame(width: 240)
    }
}

// ═══════════════════════════════════════════════════════════
// MARK: - Reusable Components
// ═══════════════════════════════════════════════════════════

struct MickyBackground: View {
    var body: some View {
        ZStack {
            LinearGradient(
                colors: [Color(hex: "0D0D0D"), Color(hex: "1A1200"), Color(hex: "0D0800")],
                startPoint: .topLeading, endPoint: .bottomTrailing
            )
            GeometryReader { geo in
                Circle()
                    .fill(Color(hex: "FF9100").opacity(0.03))
                    .frame(width: geo.size.width * 0.6)
                    .blur(radius: 40)
                    .offset(x: -geo.size.width * 0.1, y: geo.size.height * 0.2)
            }
        }
    }
}

struct MickyButtonStyle: ButtonStyle {
    let color: Color

    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.system(size: 11, weight: .bold, design: .monospaced))
            .foregroundStyle(color == .red ? .white : .black)
            .padding(.horizontal, 14)
            .padding(.vertical, 6)
            .background(color.opacity(configuration.isPressed ? 0.7 : 1), in: RoundedRectangle(cornerRadius: 6))
    }
}

struct MickyCardModifier: ViewModifier {
    func body(content: Content) -> some View {
        content
            .padding(14)
            .background(
                RoundedRectangle(cornerRadius: 10)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 10)
                            .stroke(Color.white.opacity(0.06), lineWidth: 0.5)
                    )
            )
    }
}

extension View {
    func mickyCard() -> some View {
        modifier(MickyCardModifier())
    }
}
