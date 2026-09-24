import SwiftUI

struct DispatchView: View {
    @State private var engine = GabrielEngine.shared
    @State private var selectedAgent: GabrielEngine.Agent?
    @State private var missionPrompt = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Fleet Header
                    VStack(spacing: 8) {
                        Image(systemName: "arrow.triangle.branch")
                            .font(.system(size: 40))
                            .foregroundStyle(.orange)

                        Text("AGENT FLEET")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)

                        let onlineCount = engine.agents.filter { $0.status == .online }.count
                        Text("\(onlineCount) online / \(engine.agents.count) total")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding(.top, 12)

                    // Agent Cards
                    ForEach(engine.agents) { agent in
                        agentCard(agent)
                    }

                    // Dispatch Mission
                    VStack(alignment: .leading, spacing: 12) {
                        Text("DISPATCH MISSION")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        if let selected = selectedAgent {
                            HStack {
                                Image(systemName: selected.icon)
                                    .foregroundStyle(.orange)
                                Text(selected.name)
                                    .font(.subheadline.weight(.semibold))
                                    .foregroundStyle(.white)
                                Spacer()
                                Button("Clear") {
                                    selectedAgent = nil
                                }
                                .font(.caption)
                                .foregroundStyle(.gray)
                            }
                        } else {
                            Text("Select an agent above to dispatch")
                                .font(.caption)
                                .foregroundStyle(.gray)
                        }

                        TextField("Mission objective...", text: $missionPrompt, axis: .vertical)
                            .textFieldStyle(.plain)
                            .lineLimit(2...4)
                            .padding()
                            .background(Color.white.opacity(0.05))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .foregroundStyle(.white)

                        Button(action: dispatch) {
                            HStack {
                                Image(systemName: "paperplane.fill")
                                Text("Dispatch")
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(selectedAgent != nil && !missionPrompt.isEmpty ? Color.orange : .gray)
                            .foregroundStyle(.black)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .disabled(selectedAgent == nil || missionPrompt.isEmpty)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )
                }
                .padding()
            }
            .background(Color.black)
            .navigationTitle("Dispatch")
        }
    }

    private func agentCard(_ agent: GabrielEngine.Agent) -> some View {
        Button {
            selectedAgent = agent
        } label: {
            HStack(spacing: 12) {
                Image(systemName: agent.icon)
                    .font(.title3)
                    .foregroundStyle(statusColor(agent.status))
                    .frame(width: 32)

                VStack(alignment: .leading, spacing: 3) {
                    Text(agent.name)
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(.white)
                    Text(agent.role)
                        .font(.caption2)
                        .foregroundStyle(.gray)
                }

                Spacer()

                Text(agent.status.rawValue)
                    .font(.caption2.weight(.bold).monospaced())
                    .foregroundStyle(statusColor(agent.status))
                    .padding(.horizontal, 8)
                    .padding(.vertical, 3)
                    .background(statusColor(agent.status).opacity(0.15))
                    .clipShape(Capsule())
            }
            .padding()
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(selectedAgent?.id == agent.id ? Color.orange.opacity(0.08) : Color.white.opacity(0.03))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(selectedAgent?.id == agent.id ? Color.orange.opacity(0.3) : .clear, lineWidth: 1)
                    )
            )
        }
    }

    private func statusColor(_ status: GabrielEngine.Agent.AgentStatus) -> Color {
        switch status {
        case .online: return .green
        case .standby: return .yellow
        case .dispatched: return .cyan
        case .offline: return .red
        }
    }

    private func dispatch() {
        guard let agent = selectedAgent else { return }
        engine.log(action: "Dispatched \(agent.name): \(missionPrompt)", agent: "GABRIEL")

        if let idx = engine.agents.firstIndex(where: { $0.id == agent.id }) {
            engine.agents[idx].status = .dispatched
        }

        missionPrompt = ""
        selectedAgent = nil
    }
}

#Preview {
    DispatchView()
        .preferredColorScheme(.dark)
}
