import SwiftUI

struct VoiceOpsView: View {
    @State private var memberId = ""
    @State private var fileRef = ""
    @State private var isSubmitting = false
    @State private var result: VoiceResponse?
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var engine = GabrielEngine.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Voice DNA Header
                    VStack(spacing: 8) {
                        waveformDisplay

                        Text("VOICE DNA")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)

                        Text("Audio stays on GOD.local. Metadata only in Heaven.")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding(.top, 12)

                    // Register
                    VStack(alignment: .leading, spacing: 14) {
                        Text("REGISTER VOICE PROFILE")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        inputField("Member ID", text: $memberId)
                        inputField("File Reference (local path on GOD)", text: $fileRef)

                        Button(action: registerVoice) {
                            HStack {
                                if isSubmitting {
                                    ProgressView().tint(.black)
                                } else {
                                    Image(systemName: "waveform.badge.plus")
                                    Text("Register Voice")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(.orange)
                            .foregroundStyle(.black)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .disabled(isSubmitting || memberId.isEmpty || fileRef.isEmpty)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    if let result {
                        VStack(alignment: .leading, spacing: 8) {
                            Label("REGISTERED", systemImage: "checkmark.seal.fill")
                                .font(.caption.weight(.semibold))
                                .foregroundStyle(.green)

                            if let voiceId = result.voiceId {
                                copyField("Voice ID", value: voiceId)
                            }
                            if let stamp = result.c2paStamp {
                                copyField("C2PA Stamp", value: stamp)
                            }
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color.green.opacity(0.05))
                                .overlay(
                                    RoundedRectangle(cornerRadius: 16)
                                        .stroke(Color.green.opacity(0.2), lineWidth: 1)
                                )
                        )
                    }

                    // Pipeline Status
                    VStack(alignment: .leading, spacing: 10) {
                        Text("PIPELINE STATUS")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        pipelineRow("Voice Bridge", port: "8080", status: "READY")
                        pipelineRow("Audio MCP", port: "—", status: "13 tools")
                        pipelineRow("XTTS v2", port: "—", status: "DEFAULT")
                        pipelineRow("C2PA Signing", port: "—", status: "ACTIVE")
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
            .navigationTitle("Voice")
            .alert("Error", isPresented: $showError) {
                Button("OK") {}
            } message: {
                Text(errorMessage)
            }
        }
    }

    private var waveformDisplay: some View {
        HStack(spacing: 3) {
            ForEach(0..<40, id: \.self) { i in
                RoundedRectangle(cornerRadius: 2)
                    .fill(
                        LinearGradient(
                            colors: [.orange, .yellow],
                            startPoint: .bottom,
                            endPoint: .top
                        )
                    )
                    .frame(width: 3, height: max(6, CGFloat(sin(Double(i) * 0.4) * 24 + 20)))
            }
        }
        .frame(height: 50)
    }

    private func inputField(_ placeholder: String, text: Binding<String>) -> some View {
        TextField(placeholder, text: text)
            .textFieldStyle(.plain)
            .textInputAutocapitalization(.never)
            .autocorrectionDisabled()
            .padding()
            .background(Color.white.opacity(0.05))
            .clipShape(RoundedRectangle(cornerRadius: 10))
            .foregroundStyle(.white)
    }

    private func copyField(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.gray)
            Text(value)
                .font(.caption.monospaced())
                .foregroundStyle(.green)
                .textSelection(.enabled)
        }
    }

    private func pipelineRow(_ name: String, port: String, status: String) -> some View {
        HStack {
            Text(name)
                .font(.subheadline)
                .foregroundStyle(.white)
            if port != "—" {
                Text(":\(port)")
                    .font(.caption2.monospaced())
                    .foregroundStyle(.gray)
            }
            Spacer()
            Text(status)
                .font(.caption2.weight(.semibold).monospaced())
                .foregroundStyle(.orange)
        }
    }

    private func registerVoice() {
        isSubmitting = true
        Task {
            do {
                result = try await HeavenAPI.shared.registerVoice(
                    memberId: memberId, fileRef: fileRef
                )
                engine.log(action: "Voice profile registered: \(fileRef)")
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isSubmitting = false
        }
    }
}

#Preview {
    VoiceOpsView()
        .preferredColorScheme(.dark)
}
