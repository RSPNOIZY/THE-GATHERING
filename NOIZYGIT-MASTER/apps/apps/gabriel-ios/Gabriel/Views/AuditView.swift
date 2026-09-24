import SwiftUI

struct AuditView: View {
    @State private var actorId = ""
    @State private var events: [GabrielEvent] = []
    @State private var isLoading = false
    @State private var error: String?
    @State private var engine = GabrielEngine.shared

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search
                HStack(spacing: 12) {
                    TextField("Actor ID or UUID", text: $actorId)
                        .textFieldStyle(.plain)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding()
                        .background(Color.white.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .foregroundStyle(.white)

                    Button(action: search) {
                        Image(systemName: "magnifyingglass")
                            .padding()
                            .background(.orange)
                            .foregroundStyle(.black)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(actorId.isEmpty || isLoading)
                }
                .padding()

                if isLoading {
                    Spacer()
                    ProgressView("Querying audit trail...")
                        .foregroundStyle(.white)
                    Spacer()
                } else if let error {
                    Spacer()
                    VStack(spacing: 8) {
                        Image(systemName: "exclamationmark.triangle")
                            .font(.title)
                            .foregroundStyle(.red)
                        Text(error)
                            .font(.caption)
                            .foregroundStyle(.red)
                    }
                    Spacer()
                } else if events.isEmpty {
                    Spacer()
                    VStack(spacing: 12) {
                        Image(systemName: "shield.checkered")
                            .font(.system(size: 48))
                            .foregroundStyle(.orange.opacity(0.3))
                        Text("Constitutional Audit Trail")
                            .font(.subheadline.weight(.semibold))
                            .foregroundStyle(.white)
                        Text("Append-only. Tamper-proof. Gabriel watches everything.")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .multilineTextAlignment(.center)
                    }
                    .padding()
                    Spacer()
                } else {
                    // Results
                    HStack {
                        Text("\(events.count) events")
                            .font(.caption.monospaced())
                            .foregroundStyle(.orange)
                        Spacer()
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 4)

                    List(events) { event in
                        VStack(alignment: .leading, spacing: 6) {
                            HStack {
                                eventBadge(event.eventType)
                                Spacer()
                                if let loggedAt = event.loggedAt {
                                    Text(loggedAt)
                                        .font(.caption2.monospaced())
                                        .foregroundStyle(.gray)
                                }
                            }

                            Text("ID: \(event.id)")
                                .font(.caption2.monospaced())
                                .foregroundStyle(.orange.opacity(0.5))

                            if let targetId = event.targetId {
                                Text("Target: \(targetId)")
                                    .font(.caption.monospaced())
                                    .foregroundStyle(.white.opacity(0.7))
                            }

                            if let payload = event.payload {
                                Text(payload)
                                    .font(.caption2.monospaced())
                                    .foregroundStyle(.gray)
                                    .lineLimit(4)
                                    .textSelection(.enabled)
                            }
                        }
                        .listRowBackground(Color.white.opacity(0.03))
                        .listRowSeparatorTint(.orange.opacity(0.1))
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .background(Color.black)
            .navigationTitle("Audit")
        }
    }

    private func eventBadge(_ type: String) -> some View {
        let color: Color = switch type {
        case _ where type.contains("ERROR"): .red
        case _ where type.contains("REVOKE"): .red
        case _ where type.contains("CONSENT"): .green
        case _ where type.contains("VOICE"): .purple
        case _ where type.contains("HEALING"): .pink
        case _ where type.contains("FAMILY"): .cyan
        case _ where type.contains("ROYALTY"): .yellow
        case _ where type.contains("SIGNUP"): .mint
        default: .orange
        }

        return Text(type)
            .font(.caption2.weight(.bold))
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .clipShape(Capsule())
    }

    private func search() {
        isLoading = true
        error = nil
        engine.log(action: "Audit query: \(actorId)")
        Task {
            do {
                let response = try await HeavenAPI.shared.gabrielEvents(actorId: actorId)
                events = response.events
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    AuditView()
        .preferredColorScheme(.dark)
}
