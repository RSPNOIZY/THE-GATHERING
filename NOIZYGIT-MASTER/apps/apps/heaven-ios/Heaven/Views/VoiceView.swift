import SwiftUI

struct VoiceView: View {
    @State private var memberId = ""
    @State private var fileRef = ""
    @State private var sampleRate = "48000"
    @State private var bitDepth = "32"
    @State private var isSubmitting = false
    @State private var result: VoiceResponse?
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "waveform.circle.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.cyan)

                        Text("NOIZY VOX")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(.white)

                        Text("Voice sovereignty & DNA registration")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding(.top, 20)

                    // Waveform Visualization
                    waveformVisual

                    // Register Voice Form
                    VStack(alignment: .leading, spacing: 16) {
                        Text("REGISTER VOICE PROFILE")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        inputField("Member ID", text: $memberId)
                        inputField("File Reference (local path)", text: $fileRef)

                        HStack(spacing: 12) {
                            VStack(alignment: .leading) {
                                Text("Sample Rate")
                                    .font(.caption)
                                    .foregroundStyle(.gray)
                                inputField("Hz", text: $sampleRate)
                            }
                            VStack(alignment: .leading) {
                                Text("Bit Depth")
                                    .font(.caption)
                                    .foregroundStyle(.gray)
                                inputField("bits", text: $bitDepth)
                            }
                        }

                        Button(action: registerVoice) {
                            HStack {
                                if isSubmitting {
                                    ProgressView()
                                        .tint(.black)
                                } else {
                                    Image(systemName: "waveform.badge.plus")
                                    Text("Register Voice")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(.cyan)
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
                            Text("REGISTERED")
                                .font(.caption)
                                .foregroundStyle(.green)
                                .tracking(2)

                            if let voiceId = result.voiceId {
                                copyableField("Voice ID", value: voiceId)
                            }
                            if let stamp = result.c2paStamp {
                                copyableField("C2PA Stamp", value: stamp)
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

                    // Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Audio stays on GOD.local")
                            .font(.caption.weight(.semibold))
                            .foregroundStyle(.cyan)

                        Text("Only metadata is stored in Heaven. Voice files never leave your M2 Ultra. C2PA provenance stamps ensure cryptographic proof of origin.")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.cyan.opacity(0.05))
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

    private var waveformVisual: some View {
        HStack(spacing: 3) {
            ForEach(0..<30, id: \.self) { i in
                RoundedRectangle(cornerRadius: 2)
                    .fill(.cyan.opacity(0.6))
                    .frame(width: 4, height: waveHeight(i))
            }
        }
        .frame(height: 60)
        .padding(.vertical, 8)
    }

    private func waveHeight(_ index: Int) -> CGFloat {
        let base = sin(Double(index) * 0.5) * 20 + 25
        return max(8, CGFloat(base))
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

    private func copyableField(_ label: String, value: String) -> some View {
        VStack(alignment: .leading, spacing: 4) {
            Text(label)
                .font(.caption2)
                .foregroundStyle(.gray)
            Text(value)
                .font(.caption.monospaced())
                .foregroundStyle(.green)
                .textSelection(.enabled)
        }
    }

    private func registerVoice() {
        isSubmitting = true
        Task {
            do {
                result = try await HeavenAPI.shared.registerVoice(
                    memberId: memberId,
                    fileRef: fileRef,
                    sampleRate: Int(sampleRate) ?? 48000,
                    bitDepth: Int(bitDepth) ?? 32
                )
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isSubmitting = false
        }
    }
}

#Preview {
    VoiceView()
        .preferredColorScheme(.dark)
}
