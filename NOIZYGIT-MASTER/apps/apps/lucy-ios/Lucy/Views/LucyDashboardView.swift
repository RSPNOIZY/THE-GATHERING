import SwiftUI

struct LucyDashboardView: View {
    @State private var health: HealthResponse?
    @State private var isLoading = true
    @State private var error: String?
    @State private var currentTime = Date()
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Lucy Identity
                    lucyHeader

                    // Connection Status
                    statusBanner

                    // Nightly Analysis Summary
                    nightlyCard

                    // DAZEFLOW
                    dazeflowCard

                    // Compassion Gate
                    compassionCard
                }
                .padding()
            }
            .background(
                LinearGradient(
                    colors: [Color.black, Color.purple.opacity(0.15), Color.black],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .navigationTitle("LUCY")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: loadHealth) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .onAppear { loadHealth() }
            .onReceive(timer) { currentTime = $0 }
        }
    }

    private var lucyHeader: some View {
        VStack(spacing: 12) {
            Image(systemName: "moon.stars.fill")
                .font(.system(size: 56))
                .foregroundStyle(
                    LinearGradient(
                        colors: [.purple, .pink, .cyan],
                        startPoint: .topLeading,
                        endPoint: .bottomTrailing
                    )
                )

            Text("LUCY")
                .font(.system(size: 32, weight: .ultraLight, design: .monospaced))
                .foregroundStyle(.white)
                .tracking(8)

            Text("Nightly Deep Analysis Engine")
                .font(.caption)
                .foregroundStyle(.gray)

            Text(currentTime, style: .time)
                .font(.caption2.monospaced())
                .foregroundStyle(.purple.opacity(0.6))
        }
        .padding(.top, 20)
    }

    private var statusBanner: some View {
        VStack(spacing: 12) {
            if isLoading {
                ProgressView("Connecting to Heaven...")
                    .foregroundStyle(.white)
            } else if let health {
                HStack {
                    Circle()
                        .fill(.green)
                        .frame(width: 12, height: 12)
                    Text("Heaven: \(health.status)")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Spacer()
                    Text("v\(health.version)")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }
            } else if let error {
                HStack {
                    Circle()
                        .fill(.red)
                        .frame(width: 12, height: 12)
                    Text("Offline")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Spacer()
                }
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.05))
        )
    }

    private var nightlyCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "brain.head.profile")
                    .foregroundStyle(.purple)
                Text("NIGHTLY ANALYSIS")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .tracking(2)
                Spacer()
                Text("READY")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(Color.green.opacity(0.15))
                    .clipShape(Capsule())
            }

            VStack(alignment: .leading, spacing: 8) {
                analysisRow("Opportunity Recognition", status: "Compassion-gated")
                analysisRow("Pattern Detection", status: "Deep learning active")
                analysisRow("Family Insights", status: "33 members monitored")
                analysisRow("Voice Health", status: "Profiles synced")
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.purple.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.purple.opacity(0.2), lineWidth: 1)
                )
        )
    }

    private func analysisRow(_ label: String, status: String) -> some View {
        HStack {
            Text(label)
                .font(.subheadline)
                .foregroundStyle(.white)
            Spacer()
            Text(status)
                .font(.caption2)
                .foregroundStyle(.purple)
        }
    }

    private var dazeflowCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "calendar.badge.clock")
                    .foregroundStyle(.cyan)
                Text("DAZEFLOW")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .tracking(2)
            }

            Text("1 day = 1 session = 1 truth")
                .font(.caption)
                .foregroundStyle(.cyan.opacity(0.7))
                .italic()

            Text("Lucy logs significant actions daily. Each session builds the permanent record of the NOIZY Empire's evolution.")
                .font(.caption2)
                .foregroundStyle(.gray)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
        )
    }

    private var compassionCard: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: "heart.circle")
                    .foregroundStyle(.pink)
                Text("COMPASSION GATE")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .tracking(2)
            }

            Text("Every opportunity Lucy surfaces passes through a compassion filter. If it exploits, harms, or disrespects human creativity — it gets blocked.")
                .font(.caption)
                .foregroundStyle(.gray)

            HStack(spacing: 16) {
                compassionStat("Blocked", value: "0", color: .red)
                compassionStat("Approved", value: "--", color: .green)
                compassionStat("Pending", value: "--", color: .orange)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.pink.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.pink.opacity(0.1), lineWidth: 1)
                )
        )
    }

    private func compassionStat(_ label: String, value: String, color: Color) -> some View {
        VStack(spacing: 4) {
            Text(value)
                .font(.title3.weight(.semibold).monospaced())
                .foregroundStyle(color)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.gray)
        }
    }

    private func loadHealth() {
        Task {
            isLoading = true
            error = nil
            do {
                health = try await HeavenAPI.shared.health()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    LucyDashboardView()
        .preferredColorScheme(.dark)
}
