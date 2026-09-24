// Heaven — DashboardView
// Holographic home hub with status orb, quick actions, session cards

import SwiftUI

struct DashboardView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var audioEngine: AudioEngine
    @State private var pulseScale: CGFloat = 1.0
    @State private var orbitAngle: Double = 0
    @State private var recentSessions: [HeavenSession] = []

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 28) {
                    // Header
                    headerSection
                    // Status orb
                    statusOrbSection
                    // Quick actions
                    quickActionsGrid
                    // Recent sessions
                    recentSessionsSection
                    // Backend status
                    backendStatusCard
                }
                .padding(.horizontal, 20)
                .padding(.top, 16)
                .padding(.bottom, 120)
            }
            .background(Color.clear)
            .navigationBarHidden(true)
        }
        .onAppear { startAnimations() }
    }

    // MARK: - Header
    var headerSection: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(greeting)
                    .font(.system(size: 14, weight: .medium, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.5))
                Text(appState.identity.rawValue)
                    .font(.system(size: 34, weight: .bold, design: .rounded))
                    .foregroundStyle(
                        LinearGradient(
                            colors: appState.identity.gradientColors,
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
            }
            Spacer()
            // Health pill
            HStack(spacing: 6) {
                Circle()
                    .fill(appState.backendHealth.color)
                    .frame(width: 8, height: 8)
                    .shadow(color: appState.backendHealth.color, radius: 4)
                Text(appState.backendHealth.label)
                    .font(.system(size: 11, weight: .medium, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.6))
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 7)
            .background(
                Capsule()
                    .fill(.ultraThinMaterial)
                    .overlay(Capsule().stroke(Color.white.opacity(0.1), lineWidth: 0.5))
            )
        }
    }

    // MARK: - Status Orb
    var statusOrbSection: some View {
        ZStack {
            // Outer rings
            ForEach(0..<3) { i in
                Circle()
                    .stroke(appState.identity.accentColor.opacity(0.15 - Double(i) * 0.04), lineWidth: 1)
                    .frame(width: CGFloat(140 + i * 40), height: CGFloat(140 + i * 40))
                    .rotationEffect(.degrees(orbitAngle * Double(i % 2 == 0 ? 1 : -1)))
            }

            // Glow core
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            appState.identity.accentColor.opacity(0.6),
                            appState.identity.accentColor.opacity(0.0)
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: 60
                    )
                )
                .frame(width: 120, height: 120)
                .blur(radius: 20)
                .scaleEffect(pulseScale)

            // Core orb
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            Color.white.opacity(0.9),
                            appState.identity.gradientColors[0].opacity(0.8),
                            appState.identity.gradientColors[1].opacity(0.4)
                        ],
                        center: .init(x: 0.3, y: 0.3),
                        startRadius: 0,
                        endRadius: 50
                    )
                )
                .frame(width: 80, height: 80)
                .overlay(
                    Circle()
                        .stroke(Color.white.opacity(0.3), lineWidth: 1)
                )
                .shadow(color: appState.identity.accentColor.opacity(0.8), radius: 20)

            // Central icon
            Image(systemName: audioEngine.isListening ? "waveform" : "sparkles")
                .font(.system(size: 28, weight: .light))
                .foregroundStyle(Color.white)
                .symbolEffect(.bounce, value: audioEngine.isListening)
        }
        .frame(height: 220)
        .onTapGesture {
            withAnimation(.spring(response: 0.4, dampingFraction: 0.6)) {
                audioEngine.toggleListening()
            }
            HapticManager.impact(.medium)
        }
    }

    // MARK: - Quick Actions
    var quickActionsGrid: some View {
        LazyVGrid(columns: [
            GridItem(.flexible()),
            GridItem(.flexible()),
            GridItem(.flexible())
        ], spacing: 12) {
            QuickActionCard(icon: "waveform.badge.microphone", label: "Voice", color: Color(red: 0.5, green: 0.3, blue: 1.0)) {
                appState.activeTab = .voice
            }
            QuickActionCard(icon: "bubble.left.and.bubble.right.fill", label: "Chat", color: Color(red: 0.2, green: 0.6, blue: 1.0)) {
                appState.activeTab = .chat
            }
            QuickActionCard(icon: "plus.circle.fill", label: "New", color: Color(red: 0.3, green: 0.8, blue: 0.5)) {
                let session = HeavenSession(identity: appState.identity)
                appState.currentSession = session
                appState.activeTab = .chat
            }
        }
    }

    // MARK: - Recent Sessions
    var recentSessionsSection: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Recent Sessions")
                .font(.system(size: 16, weight: .semibold, design: .rounded))
                .foregroundStyle(Color.white.opacity(0.7))

            if recentSessions.isEmpty {
                GlassCard {
                    HStack(spacing: 12) {
                        Image(systemName: "tray")
                            .font(.system(size: 24))
                            .foregroundStyle(Color.white.opacity(0.3))
                        Text("No recent sessions. Start a conversation!")
                            .font(.system(size: 14, design: .rounded))
                            .foregroundStyle(Color.white.opacity(0.4))
                    }
                    .padding()
                }
            } else {
                ForEach(recentSessions.prefix(3)) { session in
                    SessionRow(session: session)
                }
            }
        }
    }

    // MARK: - Backend Status
    var backendStatusCard: some View {
        GlassCard {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("DreamChamber Backend")
                        .font(.system(size: 13, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color.white.opacity(0.7))
                    Text("NOIZYLAB Infrastructure")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Color.white.opacity(0.3))
                }
                Spacer()
                Button {
                    Task { await appState.checkBackendHealth() }
                    HapticManager.selection()
                } label: {
                    Image(systemName: "arrow.clockwise")
                        .font(.system(size: 14))
                        .foregroundStyle(appState.identity.accentColor)
                }
            }
            .padding()
        }
    }

    // MARK: - Helpers
    var greeting: String {
        let hour = Calendar.current.component(.hour, from: Date())
        switch hour {
        case 0..<12: return "Good morning"
        case 12..<17: return "Good afternoon"
        default: return "Good evening"
        }
    }

    func startAnimations() {
        withAnimation(.easeInOut(duration: 1.8).repeatForever(autoreverses: true)) {
            pulseScale = 1.12
        }
        withAnimation(.linear(duration: 20).repeatForever(autoreverses: false)) {
            orbitAngle = 360
        }
    }
}

// MARK: - Supporting Views

struct QuickActionCard: View {
    let icon: String
    let label: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                ZStack {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(color.opacity(0.15))
                        .frame(width: 48, height: 48)
                    Image(systemName: icon)
                        .font(.system(size: 20, weight: .medium))
                        .foregroundStyle(color)
                }
                Text(label)
                    .font(.system(size: 12, weight: .medium, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.7))
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 16)
                            .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
                    )
            )
        }
        .buttonStyle(.plain)
        .pressAnimation()
    }
}

struct SessionRow: View {
    let session: HeavenSession
    var body: some View {
        GlassCard {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text(session.name)
                        .font(.system(size: 14, weight: .semibold, design: .rounded))
                        .foregroundStyle(Color.white.opacity(0.85))
                    Text("\(session.messages.count) messages")
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Color.white.opacity(0.35))
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.white.opacity(0.3))
            }
            .padding()
        }
    }
}
