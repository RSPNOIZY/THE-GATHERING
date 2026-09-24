// Heaven — OnboardingView
// First-run identity selection + backend URL setup

import SwiftUI

struct OnboardingView: View {
    @EnvironmentObject var appState: AppState
    @State private var step: Int = 0
    @State private var selectedIdentity: HeavenIdentity = .heaven
    @State private var backendURL: String = "http://localhost:8080"
    @State private var slideOffset: CGFloat = 0

    var body: some View {
        ZStack {
            // Background
            LinearGradient(
                colors: [
                    Color(red: 0.04, green: 0.02, blue: 0.14),
                    Color(red: 0.06, green: 0.02, blue: 0.20),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            VStack(spacing: 0) {
                Spacer()

                // Step content
                Group {
                    switch step {
                    case 0: welcomeStep
                    case 1: identityStep
                    case 2: backendStep
                    default: EmptyView()
                    }
                }
                .transition(.asymmetric(
                    insertion: .move(edge: .trailing).combined(with: .opacity),
                    removal: .move(edge: .leading).combined(with: .opacity)
                ))
                .id(step)

                Spacer()

                // Navigation
                navigationButtons
            }
            .padding(.horizontal, 32)
            .padding(.bottom, 52)
        }
    }

    // MARK: - Steps

    var welcomeStep: some View {
        VStack(spacing: 24) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [
                                Color(red: 0.5, green: 0.2, blue: 1.0).opacity(0.4),
                                Color.clear
                            ],
                            center: .center, startRadius: 0, endRadius: 80
                        )
                    )
                    .frame(width: 160, height: 160)
                    .blur(radius: 20)

                Image(systemName: "sparkles")
                    .font(.system(size: 64, weight: .ultraLight))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [Color.white, Color(red: 0.7, green: 0.5, blue: 1.0)],
                            startPoint: .top, endPoint: .bottom
                        )
                    )
            }

            VStack(spacing: 10) {
                Text("Welcome to Heaven")
                    .font(.system(size: 32, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.white)

                Text("An AI companion experience\npowered by DreamChamber")
                    .font(.system(size: 16, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.5))
                    .multilineTextAlignment(.center)
            }
        }
    }

    var identityStep: some View {
        VStack(spacing: 28) {
            Text("Choose Your Guide")
                .font(.system(size: 28, weight: .bold, design: .rounded))
                .foregroundStyle(Color.white)

            Text("Select the identity that will power your experience")
                .font(.system(size: 15, design: .rounded))
                .foregroundStyle(Color.white.opacity(0.5))
                .multilineTextAlignment(.center)

            HStack(spacing: 16) {
                ForEach([HeavenIdentity.heaven, .lucy], id: \.rawValue) { id in
                    Button {
                        withAnimation(.spring(response: 0.4, dampingFraction: 0.7)) {
                            selectedIdentity = id
                        }
                        HapticManager.impact(.light)
                    } label: {
                        VStack(spacing: 12) {
                            ZStack {
                                Circle()
                                    .fill(
                                        LinearGradient(
                                            colors: id.gradientColors,
                                            startPoint: .topLeading,
                                            endPoint: .bottomTrailing
                                        )
                                    )
                                    .frame(width: 72, height: 72)
                                    .opacity(selectedIdentity == id ? 1 : 0.35)
                                    .shadow(color: id.accentColor.opacity(selectedIdentity == id ? 0.6 : 0), radius: 16)

                                Image(systemName: id == .heaven ? "sparkles" : "star.fill")
                                    .font(.system(size: 28, weight: .medium))
                                    .foregroundStyle(Color.white)
                            }

                            Text(id.rawValue)
                                .font(.system(size: 16, weight: .bold, design: .rounded))
                                .foregroundStyle(selectedIdentity == id ? id.accentColor : Color.white.opacity(0.35))

                            Text(id == .heaven ? "The original" : "The forked twin")
                                .font(.system(size: 12, design: .rounded))
                                .foregroundStyle(Color.white.opacity(0.3))
                        }
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 24)
                        .background(
                            RoundedRectangle(cornerRadius: 20)
                                .fill(.ultraThinMaterial)
                                .overlay(
                                    RoundedRectangle(cornerRadius: 20)
                                        .stroke(selectedIdentity == id ? id.accentColor.opacity(0.5) : Color.white.opacity(0.08), lineWidth: 1.5)
                                )
                        )
                    }
                    .buttonStyle(.plain)
                    .pressAnimation()
                }
            }
        }
    }

    var backendStep: some View {
        VStack(spacing: 24) {
            Image(systemName: "server.rack")
                .font(.system(size: 52, weight: .ultraLight))
                .foregroundStyle(
                    LinearGradient(
                        colors: [Color.white, Color(red: 0.3, green: 0.8, blue: 0.5)],
                        startPoint: .top, endPoint: .bottom
                    )
                )

            VStack(spacing: 10) {
                Text("Connect to Backend")
                    .font(.system(size: 28, weight: .bold, design: .rounded))
                    .foregroundStyle(Color.white)
                Text("Point Heaven at your DreamChamber API")
                    .font(.system(size: 15, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.5))
                    .multilineTextAlignment(.center)
            }

            TextField("http://localhost:8080", text: $backendURL)
                .font(.system(size: 14, design: .monospaced))
                .foregroundStyle(Color.white)
                .tint(Color(red: 0.3, green: 0.8, blue: 0.5))
                .autocorrectionDisabled()
                .textInputAutocapitalization(.never)
                .padding()
                .background(
                    RoundedRectangle(cornerRadius: 14)
                        .fill(.ultraThinMaterial)
                        .overlay(RoundedRectangle(cornerRadius: 14).stroke(Color.white.opacity(0.12), lineWidth: 0.5))
                )
        }
    }

    // MARK: - Navigation

    var navigationButtons: some View {
        HStack(spacing: 16) {
            if step > 0 {
                Button("Back") {
                    withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) { step -= 1 }
                }
                .font(.system(size: 16, design: .rounded))
                .foregroundStyle(Color.white.opacity(0.5))
                .frame(width: 80)
            }

            Button(step < 2 ? "Continue" : "Let's go") {
                withAnimation(.spring(response: 0.4, dampingFraction: 0.8)) {
                    if step < 2 {
                        step += 1
                    } else {
                        // Save and enter
                        UserDefaults.standard.set(backendURL, forKey: "backendURL")
                        UserDefaults.standard.set(true, forKey: "onboarded")
                        appState.identity = selectedIdentity
                        appState.isOnboarded = true
                    }
                }
                HapticManager.selection()
            }
            .font(.system(size: 17, weight: .semibold, design: .rounded))
            .foregroundStyle(Color.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(
                RoundedRectangle(cornerRadius: 16)
                    .fill(
                        LinearGradient(
                            colors: selectedIdentity.gradientColors,
                            startPoint: .leading,
                            endPoint: .trailing
                        )
                    )
                    .shadow(color: selectedIdentity.accentColor.opacity(0.4), radius: 12)
            )
        }
    }
}
