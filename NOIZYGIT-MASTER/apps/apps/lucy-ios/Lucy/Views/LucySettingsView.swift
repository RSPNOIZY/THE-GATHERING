import SwiftUI

struct LucySettingsView: View {
    @State private var baseURL: String = UserDefaults.standard.string(forKey: "heaven_base_url")
        ?? "https://heaven.rsp-5f3.workers.dev"
    @State private var apiKey: String = UserDefaults.standard.string(forKey: "heaven_api_key") ?? ""
    @State private var saved = false
    @State private var testResult: String?
    @State private var isTesting = false
    @State private var nightlyEnabled = true
    @State private var compassionGate = true

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Connection
                    VStack(alignment: .leading, spacing: 16) {
                        Text("HEAVEN CONNECTION")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        VStack(alignment: .leading, spacing: 8) {
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

                        VStack(alignment: .leading, spacing: 8) {
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
                                .background(.purple)
                                .foregroundStyle(.white)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                            }

                            Button(action: testConnection) {
                                HStack {
                                    if isTesting {
                                        ProgressView().tint(.purple)
                                    } else {
                                        Image(systemName: "antenna.radiowaves.left.and.right")
                                        Text("Test")
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.white.opacity(0.05))
                                .foregroundStyle(.purple)
                                .clipShape(RoundedRectangle(cornerRadius: 10))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 10)
                                        .stroke(Color.purple.opacity(0.3), lineWidth: 1)
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

                    // Lucy Settings
                    VStack(alignment: .leading, spacing: 16) {
                        Text("LUCY ENGINE")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        Toggle(isOn: $nightlyEnabled) {
                            VStack(alignment: .leading) {
                                Text("Nightly Analysis")
                                    .foregroundStyle(.white)
                                Text("Run deep analysis automatically each night")
                                    .font(.caption2)
                                    .foregroundStyle(.gray)
                            }
                        }
                        .tint(.purple)

                        Toggle(isOn: $compassionGate) {
                            VStack(alignment: .leading) {
                                Text("Compassion Gate")
                                    .foregroundStyle(.white)
                                Text("Filter all opportunities through compassion check")
                                    .font(.caption2)
                                    .foregroundStyle(.gray)
                            }
                        }
                        .tint(.pink)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    // About Lucy
                    VStack(alignment: .leading, spacing: 12) {
                        Text("ABOUT")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        aboutRow("Version", value: "1.0.0")
                        aboutRow("Bundle ID", value: "ai.noizy.lucy")
                        aboutRow("Engine", value: "Nightly Deep Analysis")
                        aboutRow("Author", value: "Robert Stephen Plowman")
                        aboutRow("Doctrine", value: "HVS 75/25 Perpetual")

                        Divider().background(Color.gray.opacity(0.3))

                        Text("Lucy thinks deeply. She surfaces human insight through compassion-gated opportunity recognition. She never sleeps.")
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
            .background(
                LinearGradient(
                    colors: [Color.black, Color.purple.opacity(0.1), Color.black],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
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
    LucySettingsView()
        .preferredColorScheme(.dark)
}
