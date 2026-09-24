// Heaven — VoiceView
// Real-time voice interface with waveform visualizer

import SwiftUI
import AVFoundation

struct VoiceView: View {
    @EnvironmentObject var appState: AppState
    @EnvironmentObject var audioEngine: AudioEngine
    @State private var waveAmplitudes: [CGFloat] = Array(repeating: 0.2, count: 32)
    @State private var isTranscribing: Bool = false
    @State private var transcript: String = ""
    @State private var showTranscript: Bool = false
    private let timer = Timer.publish(every: 0.05, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            ZStack {
                heavenBackground

                VStack(spacing: 32) {
                    Spacer()

                    // Status label
                    VStack(spacing: 8) {
                        Text(audioEngine.isListening ? "Listening..." : "Tap to speak")
                            .font(.system(size: 22, weight: .light, design: .rounded))
                            .foregroundStyle(Color.white.opacity(0.9))

                        Text(audioEngine.isProcessing ? "Processing..." : appState.identity.rawValue + " is ready")
                            .font(.system(size: 13, design: .monospaced))
                            .foregroundStyle(Color.white.opacity(0.4))
                    }

                    // Waveform visualizer
                    waveformView
                        .frame(height: 100)
                        .padding(.horizontal, 24)

                    // Mic button
                    micButton

                    // Transcript card
                    if showTranscript && !transcript.isEmpty {
                        transcriptCard
                            .transition(.move(edge: .bottom).combined(with: .opacity))
                    }

                    Spacer()
                }
                .padding(.bottom, 120)
            }
            .navigationTitle("Voice")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.ultraThinMaterial, for: .navigationBar)
        }
        .onReceive(timer) { _ in
            if audioEngine.isListening {
                animateWaveform()
            } else {
                dampWaveform()
            }
        }
    }

    // MARK: - Views

    var heavenBackground: some View {
        ZStack {
            LinearGradient(
                colors: [
                    Color(red: 0.04, green: 0.02, blue: 0.14),
                    Color(red: 0.06, green: 0.03, blue: 0.18),
                ],
                startPoint: .top,
                endPoint: .bottom
            )
            .ignoresSafeArea()

            // Radial accent glow
            if audioEngine.isListening {
                Circle()
                    .fill(appState.identity.accentColor.opacity(0.12))
                    .frame(width: 400, height: 400)
                    .blur(radius: 80)
                    .offset(y: -100)
                    .animation(.easeInOut(duration: 1.5).repeatForever(autoreverses: true), value: audioEngine.isListening)
            }
        }
    }

    var waveformView: some View {
        HStack(spacing: 3) {
            ForEach(waveAmplitudes.indices, id: \.self) { i in
                RoundedRectangle(cornerRadius: 2)
                    .fill(
                        LinearGradient(
                            colors: appState.identity.gradientColors,
                            startPoint: .bottom,
                            endPoint: .top
                        )
                    )
                    .frame(width: 6, height: max(4, waveAmplitudes[i] * 90))
                    .opacity(audioEngine.isListening ? 1.0 : 0.3)
            }
        }
    }

    var micButton: some View {
        Button {
            audioEngine.toggleListening()
            HapticManager.impact(audioEngine.isListening ? .heavy : .medium)
            withAnimation(.spring(response: 0.3, dampingFraction: 0.5)) {
                showTranscript = audioEngine.isListening
            }
        } label: {
            ZStack {
                // Outer glow
                Circle()
                    .fill(appState.identity.accentColor.opacity(audioEngine.isListening ? 0.25 : 0.1))
                    .frame(width: 110, height: 110)
                    .blur(radius: 10)

                Circle()
                    .fill(
                        LinearGradient(
                            colors: audioEngine.isListening
                                ? [Color.red.opacity(0.9), Color(red: 1, green: 0.3, blue: 0.3)]
                                : appState.identity.gradientColors,
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                    .frame(width: 80, height: 80)
                    .overlay(
                        Circle()
                            .stroke(Color.white.opacity(0.25), lineWidth: 1.5)
                    )
                    .shadow(
                        color: audioEngine.isListening ? Color.red.opacity(0.5) : appState.identity.accentColor.opacity(0.5),
                        radius: 20
                    )

                Image(systemName: audioEngine.isListening ? "stop.fill" : "mic.fill")
                    .font(.system(size: 28, weight: .medium))
                    .foregroundStyle(Color.white)
            }
        }
        .buttonStyle(.plain)
        .scaleEffect(audioEngine.isListening ? 1.05 : 1.0)
        .animation(.spring(response: 0.4, dampingFraction: 0.6), value: audioEngine.isListening)
    }

    var transcriptCard: some View {
        GlassCard {
            VStack(alignment: .leading, spacing: 8) {
                Text("TRANSCRIPT")
                    .font(.system(size: 10, weight: .bold, design: .monospaced))
                    .foregroundStyle(Color.white.opacity(0.3))
                    .tracking(2)
                Text(transcript.isEmpty ? "Speak to begin..." : transcript)
                    .font(.system(size: 16, design: .rounded))
                    .foregroundStyle(Color.white.opacity(0.85))
                    .multilineTextAlignment(.leading)
            }
            .padding()
            .frame(maxWidth: .infinity, alignment: .leading)
        }
        .padding(.horizontal, 24)
    }

    // MARK: - Animations

    private func animateWaveform() {
        for i in waveAmplitudes.indices {
            waveAmplitudes[i] = CGFloat.random(in: 0.1...1.0)
        }
    }

    private func dampWaveform() {
        for i in waveAmplitudes.indices {
            waveAmplitudes[i] = max(0.15, waveAmplitudes[i] * 0.85)
        }
    }
}
