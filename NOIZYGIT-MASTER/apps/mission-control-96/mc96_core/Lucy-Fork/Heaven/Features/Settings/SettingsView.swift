// Heaven — SettingsView
// Identity switcher (Heaven ↔ Lucy), preferences, backend config

import SwiftUI

struct SettingsView: View {
    @EnvironmentObject var appState: AppState
    @State private var backendURL: String = UserDefaults.standard.string(forKey: "backendURL") ?? "http://localhost:8080"
    @State private var showURLSheet: Bool = false

    var body: some View {
        NavigationStack {
            ScrollView(showsIndicators: false) {
                VStack(spacing: 20) {
                    // Identity Switcher
                    identitySwitcherCard
                    // Backend Config
                    backendConfigCard
                    // About
                    aboutCard
                }
                .padding(.horizontal, 20)
                .padding(.top, 12)
                .padding(.bottom, 120)
            }
            .background(
                LinearGradient(
                    colors: [Color(red: 0.04, green: 0.02, blue: 0.12), Color(red: 0.06, green: 0.03, blue: 0.18)],
                    startPoint: .top, endPoint: .bottom
                ).ignoresSafeArea()
            )
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        }
    }

    // MARK: - Identity Switcher

    var identitySwitcherCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 16) {
                Text("IDENTITY")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.4))
                    .tracking(2)

                HStack(spacing: 12) {
                    ForEach([HeavenIdentity.heaven, .lucy], id: \.rawValue) { id in
                        Button {
                            withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                                appState.identity = id
                            }
                            HapticManager.impact(.medium)
                        } label: {
                            VStack(spacing: 8) {
                                ZStack {
                                    Circle()
                                        .fill(
                                            LinearGradient(
                                                colors: id.gradientColors,
                                                startPoint: .topLeading,
                                                endPoint: .bottomTrailing
                                            )
                                        )
                                        .frame(width: 56, height: 56)
                                        .opacity(appState.identity == id ? 1 : 0.3)

                                    Image(systemName: id == .heaven ? "sparkles" : "star.fill")
                                        .font(.system(size: 22, weight: .medium))
                                        .foregroundStyle(Color.white)
                                }

                                Text(id.rawValue)
                                    .font(.system(size: 13, weight: .semibold, design: .rounded))
                                    .foregroundStyle(appState.identity == id ? id.accentColor : Color.white.opacity(0.35))
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                RoundedRectangle(cornerRadius: 14)
                                    .fill(appState.identity == id ? id.accentColor.opacity(0.15) : .clear)
                                    .overlay(
                                        RoundedRectangle(cornerRadius: 14)
                                            .stroke(appState.identity == id ? id.accentColor.opacity(0.4) : Color.white.opacity(0.08), lineWidth: 1)
                                    )
                            )
                        }
                        .buttonStyle(.plain)
                        .pressAnimation()
                    }
                }
            }
            .padding()
        }
    }

    // MARK: - Backend Config

    var backendConfigCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 16) {
                Text("DREAMCHAMBER BACKEND")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.4))
                    .tracking(2)

                VStack(spacing: 12) {
                    SettingsRow(
                        icon: "server.rack",
                        label: "API Endpoint",
                        value: backendURL,
                        color: Color(red: 0.3, green: 0.8, blue: 0.5)
                    ) {
                        showURLSheet = true
                    }

                    Divider().overlay(Color.white.opacity(0.08))

                    SettingsRow(
                        icon: "shield.fill",
                        label: "Health Status",
                        value: appState.backendHealth.label,
                        color: appState.backendHealth.color
                    ) {
                        Task { await appState.checkBackendHealth() }
                    }
                }
            }
            .padding()
        }
        .sheet(isPresented: $showURLSheet) {
            URLInputSheet(url: $backendURL)
        }
    }

    // MARK: - About

    var aboutCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 16) {
                Text("ABOUT")
                    .font(.system(size: 11, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.4))
                    .tracking(2)

                VStack(spacing: 4) {
                    HStack {
                        Text("Heaven for iOS")
                            .font(.system(size: 15, weight: .semibold, design: .rounded))
                            .foregroundStyle(Color.white.opacity(0.8))
                        Spacer()
                        Text("v1.0.0")
                            .font(.system(size: 13, design: .monospaced))
                            .foregroundStyle(Color.white.opacity(0.35))
                    }
                    HStack {
                        Text("NOIZYLAB · DreamChamber")
                            .font(.system(size: 12, design: .monospaced))
                            .foregroundStyle(Color.white.opacity(0.3))
                        Spacer()
                        Text("Swift 6 · SwiftUI")
                            .font(.system(size: 11, design: .monospaced))
                            .foregroundStyle(Color.white.opacity(0.2))
                    }
                }
            }
            .padding()
        }
    }
}

// MARK: - Settings Row

struct SettingsRow: View {
    let icon: String
    let label: String
    let value: String
    let color: Color
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .fill(color.opacity(0.2))
                        .frame(width: 34, height: 34)
                    Image(systemName: icon)
                        .font(.system(size: 15, weight: .medium))
                        .foregroundStyle(color)
                }

                VStack(alignment: .leading, spacing: 2) {
                    Text(label)
                        .font(.system(size: 14, weight: .medium, design: .rounded))
                        .foregroundStyle(Color.white.opacity(0.8))
                    Text(value)
                        .font(.system(size: 11, design: .monospaced))
                        .foregroundStyle(Color.white.opacity(0.4))
                        .lineLimit(1)
                }
                Spacer()
                Image(systemName: "chevron.right")
                    .font(.system(size: 12))
                    .foregroundStyle(Color.white.opacity(0.25))
            }
        }
        .buttonStyle(.plain)
    }
}

// MARK: - URL Input Sheet

struct URLInputSheet: View {
    @Binding var url: String
    @Environment(\.dismiss) var dismiss
    @State private var draft: String = ""

    var body: some View {
        NavigationStack {
            ZStack {
                Color(red: 0.06, green: 0.03, blue: 0.18).ignoresSafeArea()
                VStack(spacing: 20) {
                    TextField("https://...", text: $draft)
                        .font(.system(size: 15, design: .monospaced))
                        .foregroundStyle(Color.white)
                        .tint(Color(red: 0.5, green: 0.3, blue: 1.0))
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 12)
                                .fill(.ultraThinMaterial)
                                .overlay(RoundedRectangle(cornerRadius: 12).stroke(Color.white.opacity(0.1), lineWidth: 0.5))
                        )
                        .padding(.horizontal)
                }
                .padding(.top, 24)
            }
            .navigationTitle("API Endpoint")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .cancellationAction) {
                    Button("Cancel") { dismiss() }.foregroundStyle(Color.white.opacity(0.6))
                }
                ToolbarItem(placement: .confirmationAction) {
                    Button("Save") {
                        url = draft
                        UserDefaults.standard.set(draft, forKey: "backendURL")
                        dismiss()
                    }
                    .foregroundStyle(Color(red: 0.5, green: 0.3, blue: 1.0))
                }
            }
        }
        .onAppear { draft = url }
        .presentationDetents([.fraction(0.3)])
        .presentationBackground(Color(red: 0.06, green: 0.03, blue: 0.18))
    }
}
