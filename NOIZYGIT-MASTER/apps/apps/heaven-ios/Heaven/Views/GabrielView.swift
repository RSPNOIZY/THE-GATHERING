import SwiftUI

struct GabrielView: View {
    @State private var actorId = ""
    @State private var events: [GabrielEvent] = []
    @State private var isLoading = false
    @State private var error: String?

    var body: some View {
        NavigationStack {
            VStack(spacing: 0) {
                // Search Bar
                HStack(spacing: 12) {
                    TextField("Actor ID", text: $actorId)
                        .textFieldStyle(.plain)
                        .textInputAutocapitalization(.never)
                        .autocorrectionDisabled()
                        .padding()
                        .background(Color.white.opacity(0.05))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                        .foregroundStyle(.white)

                    Button(action: loadEvents) {
                        Image(systemName: "magnifyingglass")
                            .padding()
                            .background(.cyan)
                            .foregroundStyle(.black)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(actorId.isEmpty || isLoading)
                }
                .padding()

                // Events List
                if isLoading {
                    Spacer()
                    ProgressView("Querying Gabriel...")
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
                            .foregroundStyle(.cyan.opacity(0.3))
                        Text("Gabriel watches every transaction")
                            .font(.caption)
                            .foregroundStyle(.gray)
                        Text("Enter an actor ID to view the audit trail")
                            .font(.caption2)
                            .foregroundStyle(.gray.opacity(0.6))
                    }
                    Spacer()
                } else {
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

                            if let targetId = event.targetId {
                                Text("Target: \(targetId)")
                                    .font(.caption.monospaced())
                                    .foregroundStyle(.white.opacity(0.7))
                            }

                            if let payload = event.payload {
                                Text(payload)
                                    .font(.caption2.monospaced())
                                    .foregroundStyle(.gray)
                                    .lineLimit(3)
                            }
                        }
                        .listRowBackground(Color.white.opacity(0.03))
                        .listRowSeparatorTint(.cyan.opacity(0.1))
                    }
                    .listStyle(.plain)
                    .scrollContentBackground(.hidden)
                }
            }
            .background(Color.black)
            .navigationTitle("Gabriel")
        }
    }

    private func eventBadge(_ type: String) -> some View {
        let color: Color = switch type {
        case _ where type.contains("ERROR"): .red
        case _ where type.contains("REVOKE"): .orange
        case _ where type.contains("CONSENT"): .green
        case _ where type.contains("VOICE"): .purple
        case _ where type.contains("HEALING"): .pink
        default: .cyan
        }

        return Text(type)
            .font(.caption2.weight(.semibold))
            .foregroundStyle(color)
            .padding(.horizontal, 8)
            .padding(.vertical, 3)
            .background(color.opacity(0.15))
            .clipShape(Capsule())
    }

    private func loadEvents() {
        isLoading = true
        error = nil
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
    GabrielView()
        .preferredColorScheme(.dark)
}
