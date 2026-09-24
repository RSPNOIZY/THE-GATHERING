import SwiftUI

struct FamilyOpsView: View {
    @State private var email = ""
    @State private var displayName = ""
    @State private var isRegistering = false
    @State private var result: String?
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var engine = GabrielEngine.shared

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 20) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "person.3.fill")
                            .font(.system(size: 40))
                            .foregroundStyle(.orange)
                        Text("myFAMILY OPS")
                            .font(.title3.weight(.semibold))
                            .foregroundStyle(.white)
                        Text("33 members across 6 tiers")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding(.top, 12)

                    // Quick Register
                    VStack(alignment: .leading, spacing: 14) {
                        Text("REGISTER MEMBER")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        TextField("Display Name", text: $displayName)
                            .textFieldStyle(.plain)
                            .padding()
                            .background(Color.white.opacity(0.05))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .foregroundStyle(.white)

                        TextField("Email", text: $email)
                            .textFieldStyle(.plain)
                            .keyboardType(.emailAddress)
                            .textInputAutocapitalization(.never)
                            .autocorrectionDisabled()
                            .padding()
                            .background(Color.white.opacity(0.05))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .foregroundStyle(.white)

                        Button(action: register) {
                            HStack {
                                if isRegistering {
                                    ProgressView().tint(.black)
                                } else {
                                    Image(systemName: "person.badge.plus")
                                    Text("Register")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(.orange)
                            .foregroundStyle(.black)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .disabled(isRegistering || email.isEmpty || displayName.isEmpty)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    if let result {
                        Text(result)
                            .font(.caption.monospaced())
                            .foregroundStyle(.green)
                            .padding()
                    }

                    // Consent Ops
                    VStack(alignment: .leading, spacing: 10) {
                        Text("CONSENT KERNEL")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        opRow(icon: "checkmark.shield.fill", text: "Pre-synthesis blocking active", color: .green)
                        opRow(icon: "bolt.shield.fill", text: "Kill Switch armed — RSP_001", color: .red)
                        opRow(icon: "signature", text: "C2PA stamps on all assets", color: .cyan)
                        opRow(icon: "clock.arrow.circlepath", text: "100-year OAIS/PREMIS estate", color: .orange)
                        opRow(icon: "dollarsign.circle.fill", text: "75/25 royalty split locked", color: .yellow)
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
            .navigationTitle("Family")
            .alert("Error", isPresented: $showError) {
                Button("OK") {}
            } message: {
                Text(errorMessage)
            }
        }
    }

    private func opRow(icon: String, text: String, color: Color) -> some View {
        HStack(spacing: 10) {
            Image(systemName: icon)
                .foregroundStyle(color)
                .frame(width: 24)
            Text(text)
                .font(.subheadline)
                .foregroundStyle(.white)
        }
    }

    private func register() {
        isRegistering = true
        Task {
            do {
                let response = try await HeavenAPI.shared.registerFamilyMember(
                    email: email, displayName: displayName
                )
                result = "Registered: \(response.memberId ?? "ok")"
                engine.log(action: "Registered family member: \(displayName)")
                email = ""
                displayName = ""
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isRegistering = false
        }
    }
}

#Preview {
    FamilyOpsView()
        .preferredColorScheme(.dark)
}
