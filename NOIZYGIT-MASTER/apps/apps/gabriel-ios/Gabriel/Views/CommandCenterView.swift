import SwiftUI

struct CommandCenterView: View {
    @State private var engine = GabrielEngine.shared
    @State private var pulseScale: CGFloat = 1.0

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Gabriel Identity
                    gabrielHeader

                    // Deadline Countdown
                    countdownCard

                    // System Status
                    statusGrid

                    // Never Clauses
                    neverClausesCard

                    // Mission Log (last 5)
                    missionLogCard

                    // Portals
                    if !engine.system.portals.isEmpty {
                        portalsCard
                    }
                }
                .padding()
            }
            .background(Color.black)
            .navigationTitle("GABRIEL")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: refresh) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .onAppear { refresh() }
        }
    }

    // MARK: - Gabriel Header

    private var gabrielHeader: some View {
        VStack(spacing: 12) {
            ZStack {
                Circle()
                    .fill(
                        RadialGradient(
                            colors: [.orange.opacity(0.3), .clear],
                            center: .center,
                            startRadius: 20,
                            endRadius: 60
                        )
                    )
                    .frame(width: 120, height: 120)
                    .scaleEffect(pulseScale)
                    .onAppear {
                        withAnimation(.easeInOut(duration: 2).repeatForever(autoreverses: true)) {
                            pulseScale = 1.15
                        }
                    }

                Image(systemName: "shield.checkered")
                    .font(.system(size: 48))
                    .foregroundStyle(
                        LinearGradient(
                            colors: [.orange, .yellow],
                            startPoint: .top,
                            endPoint: .bottom
                        )
                    )
            }

            Text("GABRIEL")
                .font(.system(size: 28, weight: .heavy, design: .monospaced))
                .foregroundStyle(.orange)
                .tracking(6)

            Text("Warrior Executor")
                .font(.caption)
                .foregroundStyle(.gray)
                .tracking(2)

            if engine.system.heavenOnline {
                Text("HEAVEN ONLINE \(engine.system.version)")
                    .font(.caption2.weight(.semibold).monospaced())
                    .foregroundStyle(.green)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.1))
                    .clipShape(Capsule())
            }
        }
        .padding(.top, 12)
    }

    // MARK: - Countdown

    private var countdownCard: some View {
        VStack(spacing: 8) {
            if engine.deadlinePassed {
                Text("DEADLINE PASSED")
                    .font(.caption.weight(.bold))
                    .foregroundStyle(.red)
                    .tracking(2)
            } else {
                Text("APRIL 17, 2026")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .tracking(2)

                HStack(spacing: 24) {
                    countdownUnit("\(engine.daysRemaining)", label: "DAYS")
                    countdownUnit("\(engine.hoursRemaining % 24)", label: "HRS")
                }

                Text("Everything ships. Nothing unverified.")
                    .font(.caption2)
                    .foregroundStyle(.orange.opacity(0.6))
                    .italic()
            }
        }
        .padding()
        .frame(maxWidth: .infinity)
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.orange.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(engine.deadlinePassed ? Color.red.opacity(0.5) : Color.orange.opacity(0.2), lineWidth: 1)
                )
        )
    }

    private func countdownUnit(_ value: String, label: String) -> some View {
        VStack(spacing: 2) {
            Text(value)
                .font(.system(size: 36, weight: .ultraLight, design: .monospaced))
                .foregroundStyle(.orange)
            Text(label)
                .font(.caption2)
                .foregroundStyle(.gray)
                .tracking(1)
        }
    }

    // MARK: - System Status Grid

    private var statusGrid: some View {
        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 12) {
            statusTile(
                "Heaven",
                value: engine.system.heavenOnline ? "LIVE" : "DOWN",
                icon: "cloud",
                color: engine.system.heavenOnline ? .green : .red
            )
            statusTile(
                "Gabriel",
                value: engine.system.gabrielWatching ? "WATCHING" : "IDLE",
                icon: "shield.checkered",
                color: engine.system.gabrielWatching ? .orange : .gray
            )
            statusTile(
                "HVS Split",
                value: "75 / 25",
                icon: "lock.shield",
                color: .cyan
            )
            statusTile(
                "Agents",
                value: "\(engine.agents.filter { $0.status == .online }.count) / \(engine.agents.count)",
                icon: "person.3.sequence",
                color: .yellow
            )
        }
    }

    private func statusTile(_ title: String, value: String, icon: String, color: Color) -> some View {
        VStack(spacing: 8) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(color)
                Spacer()
            }
            HStack {
                Text(value)
                    .font(.subheadline.weight(.bold).monospaced())
                    .foregroundStyle(color)
                Spacer()
            }
            HStack {
                Text(title)
                    .font(.caption2)
                    .foregroundStyle(.gray)
                Spacer()
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.03))
        )
    }

    // MARK: - Never Clauses

    private var neverClausesCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "exclamationmark.shield")
                    .foregroundStyle(.red)
                Text("NEVER CLAUSES")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .tracking(2)
                Spacer()
                Text("\(engine.neverClauses.filter(\.verified).count)/\(engine.neverClauses.count) VERIFIED")
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.green)
            }

            ForEach(engine.neverClauses) { clause in
                HStack(spacing: 8) {
                    Image(systemName: clause.verified ? "checkmark.circle.fill" : "xmark.circle.fill")
                        .font(.caption)
                        .foregroundStyle(clause.verified ? .green : .red)
                    Text(clause.clause)
                        .font(.caption2)
                        .foregroundStyle(.white.opacity(0.8))
                    Spacer()
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.red.opacity(0.15), lineWidth: 1)
                )
        )
    }

    // MARK: - Mission Log

    private var missionLogCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            HStack {
                Image(systemName: "list.bullet.clipboard")
                    .foregroundStyle(.orange)
                Text("MISSION LOG")
                    .font(.caption)
                    .foregroundStyle(.gray)
                    .tracking(2)
            }

            if engine.missionLog.isEmpty {
                Text("No actions logged this session")
                    .font(.caption2)
                    .foregroundStyle(.gray)
                    .padding(.vertical, 4)
            } else {
                ForEach(engine.missionLog.prefix(5)) { entry in
                    HStack(alignment: .top, spacing: 8) {
                        Circle()
                            .fill(entry.status == "ERROR" ? Color.red : .green)
                            .frame(width: 6, height: 6)
                            .padding(.top, 5)
                        VStack(alignment: .leading, spacing: 2) {
                            Text(entry.action)
                                .font(.caption2)
                                .foregroundStyle(.white.opacity(0.8))
                            Text("\(entry.agent) \(entry.timestamp.formatted(date: .omitted, time: .shortened))")
                                .font(.caption2.monospaced())
                                .foregroundStyle(.gray)
                        }
                    }
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
        )
    }

    // MARK: - Portals

    private var portalsCard: some View {
        VStack(alignment: .leading, spacing: 10) {
            Text("PORTALS")
                .font(.caption)
                .foregroundStyle(.gray)
                .tracking(2)

            HStack(spacing: 8) {
                ForEach(engine.system.portals, id: \.self) { portal in
                    Text(portal)
                        .font(.caption2.weight(.semibold))
                        .foregroundStyle(.orange)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(Color.orange.opacity(0.1))
                        .clipShape(Capsule())
                }
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
        )
    }

    // MARK: - Actions

    private func refresh() {
        Task { await engine.checkHealth() }
    }
}

#Preview {
    CommandCenterView()
        .preferredColorScheme(.dark)
}
