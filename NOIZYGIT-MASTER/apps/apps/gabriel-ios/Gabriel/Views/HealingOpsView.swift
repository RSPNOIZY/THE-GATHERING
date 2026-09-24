import SwiftUI

struct HealingOpsView: View {
    @State private var beneficiaryId = ""
    @State private var selectedProtocol = "396hz_liberation"
    @State private var frequency: Double = 396
    @State private var duration: Double = 300
    @State private var isActive = false
    @State private var elapsed: TimeInterval = 0
    @State private var timer: Timer?
    @State private var result: String?
    @State private var engine = GabrielEngine.shared

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
                VStack(spacing: 20) {
                    // Frequency Ring
                    frequencyRing

                    // Frequency Selection
                    VStack(alignment: .leading, spacing: 10) {
                        Text("SOLFEGGIO FREQUENCIES")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        ForEach(frequencyPresets, id: \.1) { preset in
                            Button {
                                withAnimation { frequency = preset.1 }
                            } label: {
                                HStack {
                                    Text(preset.0)
                                        .foregroundStyle(frequency == preset.1 ? .orange : .gray)
                                    Spacer()
                                    if frequency == preset.1 {
                                        Image(systemName: "checkmark.circle.fill")
                                            .foregroundStyle(.orange)
                                    }
                                }
                                .padding(.vertical, 5)
                            }
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    // Session Config
                    VStack(alignment: .leading, spacing: 14) {
                        Text("SESSION")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

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
                                .tint(.orange)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    // Controls
                    Button(action: toggleSession) {
                        HStack {
                            Image(systemName: isActive ? "stop.fill" : "play.fill")
                            Text(isActive ? "End Session" : "Begin Healing")
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isActive ? Color.red : .orange)
                        .foregroundStyle(isActive ? .white : .black)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(beneficiaryId.isEmpty)

                    if let result {
                        Text(result)
                            .font(.caption.monospaced())
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
                .stroke(Color.orange.opacity(0.1), lineWidth: 3)
                .frame(width: 160, height: 160)

            Circle()
                .trim(from: 0, to: isActive ? CGFloat(elapsed / duration) : 0)
                .stroke(Color.orange, style: StrokeStyle(lineWidth: 3, lineCap: .round))
                .frame(width: 160, height: 160)
                .rotationEffect(.degrees(-90))
                .animation(.linear(duration: 1), value: elapsed)

            VStack(spacing: 4) {
                Text("\(Int(frequency))")
                    .font(.system(size: 32, weight: .ultraLight, design: .monospaced))
                    .foregroundStyle(.orange)
                Text("Hz")
                    .font(.caption)
                    .foregroundStyle(.gray)

                if isActive {
                    Text(formatTime(elapsed))
                        .font(.caption.monospaced())
                        .foregroundStyle(.orange.opacity(0.6))
                        .padding(.top, 2)
                }
            }
        }
        .padding(.top, 12)
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
            engine.log(action: "Healing session started: \(Int(frequency)) Hz")
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
        engine.log(action: "Healing session ended: \(Int(elapsed))s at \(Int(frequency)) Hz")
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
    HealingOpsView()
        .preferredColorScheme(.dark)
}
