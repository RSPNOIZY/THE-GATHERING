import SwiftUI

struct HealingView: View {
    @State private var beneficiaryId = ""
    @State private var selectedProtocol = "396hz_liberation"
    @State private var frequency: Double = 396
    @State private var duration: Double = 300
    @State private var isActive = false
    @State private var elapsed: TimeInterval = 0
    @State private var timer: Timer?
    @State private var result: String?

    private let protocols = [
        "396hz_liberation",
        "comfort_voice",
        "grief_support",
        "milestone_celebration",
        "biometric_response",
    ]

    private let frequencyPresets: [(String, Double)] = [
        ("396 Hz — Liberation", 396),
        ("417 Hz — Change", 417),
        ("528 Hz — Transformation", 528),
        ("639 Hz — Connection", 639),
        ("741 Hz — Expression", 741),
        ("852 Hz — Intuition", 852),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Frequency Ring
                    frequencyRing

                    // Protocol Selection
                    VStack(alignment: .leading, spacing: 12) {
                        Text("HEALING PROTOCOL")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        Picker("Protocol", selection: $selectedProtocol) {
                            ForEach(protocols, id: \.self) { proto in
                                Text(proto.replacingOccurrences(of: "_", with: " ").capitalized)
                                    .tag(proto)
                            }
                        }
                        .pickerStyle(.menu)
                        .tint(.cyan)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    // Frequency Presets
                    VStack(alignment: .leading, spacing: 12) {
                        Text("FREQUENCY")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        ForEach(frequencyPresets, id: \.1) { preset in
                            Button {
                                withAnimation { frequency = preset.1 }
                            } label: {
                                HStack {
                                    Text(preset.0)
                                        .foregroundStyle(frequency == preset.1 ? .cyan : .gray)
                                    Spacer()
                                    if frequency == preset.1 {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.cyan)
                                    }
                                }
                                .padding(.vertical, 6)
                            }
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    // Beneficiary & Duration
                    VStack(alignment: .leading, spacing: 16) {
                        TextField("Beneficiary ID", text: $beneficiaryId)
                            .textFieldStyle(.plain)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .padding()
                            .background(Color.white.opacity(0.05))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .foregroundStyle(.white)

                        VStack(alignment: .leading) {
                            Text("Duration: \(Int(duration / 60)) min")
                                .font(.caption)
                                .foregroundStyle(.gray)
                            Slider(value: $duration, in: 60...1800, step: 60)
                                .tint(.cyan)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    // Session Control
                    Button(action: toggleSession) {
                        HStack {
                            Image(systemName: isActive ? "stop.fill" : "play.fill")
                            Text(isActive ? "End Session" : "Begin Session")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isActive ? Color.red : .cyan)
                        .foregroundStyle(isActive ? .white : .black)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(beneficiaryId.isEmpty)

                    if let result {
                        Text(result)
                            .font(.caption)
                            .foregroundStyle(.green)
                            .padding()
                    }
                }
                .padding()
            }
            .background(Color.black)
            .navigationTitle("Healing")
        }
    }

    private var frequencyRing: some View {
        ZStack {
            Circle()
                .stroke(Color.cyan.opacity(0.1), lineWidth: 3)
                .frame(width: 180, height: 180)

            Circle()
                .trim(from: 0, to: isActive ? CGFloat(elapsed / duration) : 0)
                .stroke(Color.cyan, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .frame(width: 180, height: 180)
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 1), value: elapsed)

            VStack(spacing: 4) {
                Text("\(Int(frequency))")
                    .font(.system(size: 36, weight: .ultraLight, design: .monospaced))
                    .foregroundStyle(.cyan)
                Text("Hz")
                    .font(.caption)
                    .foregroundStyle(.gray)

                if isActive {
                    Text(formatTime(elapsed))
                        .font(.caption.monospaced())
                        .foregroundStyle(.cyan.opacity(0.6))
                        .padding(.top, 4)
                }
            }
        }
        .padding(.top, 20)
    }

    private func formatTime(_ seconds: TimeInterval) -> String {
        let m = Int(seconds) / 60
        let s = Int(seconds) % 60
        return String(format: "%02d:%02d", m, s)
    }

    private func toggleSession() {
        if isActive {
            isActive = false
            timer?.invalidate()
            timer = nil
            logSession()
        } else {
            isActive = true
            elapsed = 0
            timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { [self] _ in
                self.elapsed += 1
                if self.elapsed >= self.duration {
                    self.isActive = false
                    self.timer?.invalidate()
                    self.timer = nil
                    self.logSession()
                }
            }
        }
    }

    private func logSession() {
        Task {
            do {
                let response = try await HeavenAPI.shared.logHealingSession(
                    beneficiaryId: beneficiaryId,
                    protocolType: selectedProtocol,
                    frequencyHz: frequency,
                    durationSeconds: Int(elapsed)
                )
                result = "Session logged: \(response.sessionId ?? "ok")"
            } catch {
                result = "Error: \(error.localizedDescription)"
            }
        }
    }
}

#Preview {
    HealingView()
        .preferredColorScheme(.dark)
}
