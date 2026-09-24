import SwiftUI

struct SettingsView: View {
    @State private var baseURL: String = UserDefaults.standard.string(forKey: "heaven_base_url")
        ?? "https://heaven.rsp-5f3.workers.dev"
    @State private var apiKey: String = UserDefaults.standard.string(forKey: "heaven_api_key") ?? ""
    @State private var saved = false
    @State private var testResult: String?
    @State private var isTesting = false

    private let presetURLs = [
        ("Production", "https://heaven.rsp-5f3.workers.dev"),
        ("Docker", "http://localhost:8787"),
        ("Tunnel", "https://noizy.ai"),
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Connection
                    VStack(alignment: .leading, spacing: 14) {
                        Text("HEAVEN CONNECTION")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        VStack(alignment: .leading, spacing: 6) {
                            Text("API Endpoint")
                                .font(.caption)
                                .foregroundStyle(.gray)
                            TextField("https://heaven.rsp-5f3.workers.dev", text: $baseURL)
                                .textFieldStyle(.plain)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .padding()
                                .background(Color.white.opacity(0.05))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .foregroundStyle(.white)
                        }

                        HStack(spacing: 8) {
                            ForEach(presetURLs, id: \.0) { preset in
                                Button(preset.0) {
                                    baseURL = preset.1
                                }
                                .font(.caption2)
                                .padding(.horizontal, 10)
                                .padding(.vertical, 6)
                                .background(
                                    baseURL == preset.1
                                        ? Color.orange.opacity(0.2)
                                        : Color.white.opacity(0.05)
                                )
                                .foregroundStyle(baseURL == preset.1 ? .orange : .gray)
                                .clipShape(Capsule())
                            }
                        }

                        VStack(alignment: .leading, spacing: 6) {
                            Text("API Key")
                                .font(.caption)
                                .foregroundStyle(.gray)
                            SecureField("X-Noizy-Key", text: $apiKey)
                                .textFieldStyle(.plain)
                                .textInputAutocapitalization(.never)
                                .autocorrectionDisabled()
                                .padding()
                                .background(Color.white.opacity(0.05))
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .foregroundStyle(.white)
                        }

                        HStack(spacing: 12) {
                            Button(action: save) {
                                HStack {
                                    Image(systemName: "checkmark.circle")
                                    Text("Save")
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(.orange)
                                .foregroundStyle(.black)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }

                            Button(action: testConnection) {
                                HStack {
                                    if isTesting {
                                        ProgressView().tint(.orange)
                                    } else {
                                        Image(systemName: "antenna.radiowaves.left.and.right")
                                        Text("Test")
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white.opacity(0.05))
                                .foregroundStyle(.orange)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.orange.opacity(0.3), lineWidth: 1)
                                )
                            }
                            .disabled(isTesting)
                        }
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    if saved {
                        Text("Configuration saved")
                            .font(.caption)
                            .foregroundStyle(.green)
                    }

                    if let testResult {
                        Text(testResult)
                            .font(.caption.monospaced())
                            .foregroundStyle(testResult.contains("alive") ? .green : .red)
                            .padding()
                            .frame(maxWidth: .infinity, alignment: .leading)
                            .background(
                                RoundedRectangle(cornerRadius: 12)
                                    .fill(Color.white.opacity(0.03))
                            )
                    }

                    // About Gabriel
                    VStack(alignment: .leading, spacing: 10) {
                        Text("IDENTITY")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        aboutRow("App", value: "GABRIEL")
                        aboutRow("Version", value: "1.0.0")
                        aboutRow("Bundle", value: "ai.noizy.gabriel")
                        aboutRow("Role", value: "Warrior Executor")
                        aboutRow("Author", value: "Robert Stephen Plowman")
                        aboutRow("Doctrine", value: "HVS 75/25 Perpetual")
                        aboutRow("Frequency", value: "396 Hz")
                        aboutRow("Machine", value: "GOD.local (M2 Ultra)")

                        Divider().background(Color.gray.opacity(0.3))

                        Text("Military-calm. No hype. No cheerleading. No flattery. Gabriel ships things. Gabriel doesn't narrate about shipping things.")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .italic()
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
            .navigationTitle("Settings")
        }
    }

    private func aboutRow(_ label: String, value: String) -> some View {
        HStack {
            Text(label).font(.subheadline).foregroundStyle(.gray)
            Spacer()
            Text(value).font(.subheadline).foregroundStyle(.white)
        }
    }

    private func save() {
        Task {
            await HeavenAPI.shared.configure(baseURL: baseURL, apiKey: apiKey)
            saved = true
            try? await Task.sleep(for: .seconds(2))
            saved = false
        }
    }

    private func testConnection() {
        isTesting = true
        testResult = nil
        Task {
            do {
                let health = try await HeavenAPI.shared.health()
                testResult = "\(health.service) — \(health.status) — v\(health.version)\nGabriel: \(health.gabriel) | HVS: \(health.hvs)"
            } catch {
                testResult = "FAILED: \(error.localizedDescription)"
            }
            isTesting = false
        }
    }
}

#Preview {
    SettingsView()
        .preferredColorScheme(.dark)
}
