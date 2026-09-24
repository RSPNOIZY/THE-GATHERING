// Heaven — SplashView
// Cinematic intro with particle effects

import SwiftUI

struct SplashView: View {
    @EnvironmentObject var appState: AppState
    @State private var logoScale: CGFloat = 0.5
    @State private var logoOpacity: Double = 0
    @State private var glowRadius: CGFloat = 0
    @State private var particles: [Particle] = []

    var body: some View {
        ZStack {
            // Deep space background
            LinearGradient(
                colors: [
                    Color(red: 0.04, green: 0.02, blue: 0.12),
                    Color(red: 0.08, green: 0.04, blue: 0.22),
                    Color(red: 0.02, green: 0.01, blue: 0.08),
                ],
                startPoint: .topLeading,
                endPoint: .bottomTrailing
            )
            .ignoresSafeArea()

            // Particle field
            ForEach(particles) { particle in
                Circle()
                    .fill(particle.color.opacity(particle.opacity))
                    .frame(width: particle.size, height: particle.size)
                    .offset(x: particle.x, y: particle.y)
                    .blur(radius: particle.blur)
            }

            // Center glow aura
            Circle()
                .fill(
                    RadialGradient(
                        colors: [
                            Color(red: 0.5, green: 0.2, blue: 1.0).opacity(0.4),
                            Color.clear
                        ],
                        center: .center,
                        startRadius: 0,
                        endRadius: 200
                    )
                )
                .frame(width: glowRadius * 4, height: glowRadius * 4)
                .blur(radius: 40)

            VStack(spacing: 16) {
                // Logo
                ZStack {
                    // Outer glow ring
                    Circle()
                        .stroke(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.6, green: 0.3, blue: 1.0),
                                    Color(red: 0.3, green: 0.5, blue: 1.0)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            ),
                            lineWidth: 2
                        )
                        .frame(width: 120, height: 120)
                        .blur(radius: 4)

                    Circle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color(red: 0.3, green: 0.1, blue: 0.6),
                                    Color(red: 0.1, green: 0.05, blue: 0.3)
                                ],
                                startPoint: .topLeading,
                                endPoint: .bottomTrailing
                            )
                        )
                        .frame(width: 110, height: 110)
                        .overlay(
                            Circle()
                                .stroke(
                                    LinearGradient(
                                        colors: [
                                            Color.white.opacity(0.3),
                                            Color.clear
                                        ],
                                        startPoint: .topLeading,
                                        endPoint: .bottomTrailing
                                    ),
                                    lineWidth: 1
                                )
                        )

                    Image(systemName: "sparkles")
                        .font(.system(size: 44, weight: .light))
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.white, Color(red: 0.8, green: 0.6, blue: 1.0)],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                }
                .scaleEffect(logoScale)
                .opacity(logoOpacity)
                .shadow(color: Color(red: 0.5, green: 0.2, blue: 1.0).opacity(0.8), radius: glowRadius)

                VStack(spacing: 4) {
                    Text("HEAVEN")
                        .font(.system(size: 38, weight: .ultraLight, design: .rounded))
                        .tracking(14)
                        .foregroundStyle(
                            LinearGradient(
                                colors: [Color.white, Color(red: 0.8, green: 0.7, blue: 1.0)],
                                startPoint: .leading,
                                endPoint: .trailing
                            )
                        )

                    Text("by NOIZYLAB")
                        .font(.system(size: 12, weight: .medium, design: .monospaced))
                        .tracking(4)
                        .foregroundStyle(Color.white.opacity(0.4))
                }
                .opacity(logoOpacity)
            }
        }
        .onAppear { animateSplash() }
    }

    private func animateSplash() {
        // Spawn particles
        particles = (0..<60).map { _ in Particle.random() }

        withAnimation(.spring(response: 0.8, dampingFraction: 0.6)) {
            logoScale = 1.0
            logoOpacity = 1.0
        }
        withAnimation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true)) {
            glowRadius = 30
        }
    }
}

// MARK: - Particle

struct Particle: Identifiable {
    let id = UUID()
    var x: CGFloat
    var y: CGFloat
    var size: CGFloat
    var opacity: Double
    var color: Color
    var blur: CGFloat

    static func random() -> Particle {
        let colors: [Color] = [
            Color(red: 0.6, green: 0.3, blue: 1.0),
            Color(red: 0.3, green: 0.5, blue: 1.0),
            Color(red: 1.0, green: 0.5, blue: 0.8),
            Color.white
        ]
        return Particle(
            x: CGFloat.random(in: -200...200),
            y: CGFloat.random(in: -400...400),
            size: CGFloat.random(in: 1...4),
            opacity: Double.random(in: 0.1...0.7),
            color: colors.randomElement()!,
            blur: CGFloat.random(in: 0...2)
        )
    }
}
