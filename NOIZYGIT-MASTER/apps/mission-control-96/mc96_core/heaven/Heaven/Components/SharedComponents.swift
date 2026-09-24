// Heaven — Shared Components & Utilities

import SwiftUI

// MARK: - GlassCard

struct GlassCard<Content: View>: View {
    @ViewBuilder var content: () -> Content

    var body: some View {
        content()
            .background(
                RoundedRectangle(cornerRadius: 20)
                    .fill(.ultraThinMaterial)
                    .overlay(
                        RoundedRectangle(cornerRadius: 20)
                            .stroke(Color.white.opacity(0.1), lineWidth: 0.5)
                    )
            )
    }
}

// MARK: - Press Animation

struct PressAnimationModifier: ViewModifier {
    @State private var isPressed = false

    func body(content: Content) -> some View {
        content
            .scaleEffect(isPressed ? 0.95 : 1.0)
            .animation(.spring(response: 0.2, dampingFraction: 0.6), value: isPressed)
            .simultaneousGesture(
                DragGesture(minimumDistance: 0)
                    .onChanged { _ in isPressed = true }
                    .onEnded { _ in isPressed = false }
            )
    }
}

extension View {
    func pressAnimation() -> some View {
        modifier(PressAnimationModifier())
    }
}

// MARK: - Haptic Manager

struct HapticManager {
    static func impact(_ style: UIImpactFeedbackGenerator.FeedbackStyle = .light) {
        UIImpactFeedbackGenerator(style: style).impactOccurred()
    }

    static func selection() {
        UISelectionFeedbackGenerator().selectionChanged()
    }

    static func notification(_ type: UINotificationFeedbackGenerator.FeedbackType) {
        UINotificationFeedbackGenerator().notificationOccurred(type)
    }
}

// MARK: - Animated Gradient Background

struct AnimatedMeshBackground: View {
    @State private var animate = false
    let colors: [Color]

    var body: some View {
        ZStack {
            ForEach(0..<3) { i in
                Circle()
                    .fill(colors[i % colors.count].opacity(0.15))
                    .frame(width: 300, height: 300)
                    .offset(
                        x: animate ? CGFloat.random(in: -150...150) : 0,
                        y: animate ? CGFloat.random(in: -200...200) : 0
                    )
                    .blur(radius: 60)
            }
        }
        .onAppear {
            withAnimation(.easeInOut(duration: 8).repeatForever(autoreverses: true)) {
                animate = true
            }
        }
    }
}
