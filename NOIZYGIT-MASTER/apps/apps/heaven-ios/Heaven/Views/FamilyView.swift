import SwiftUI

struct FamilyView: View {
    @State private var email = ""
    @State private var displayName = ""
    @State private var isRegistering = false
    @State private var result: String?
    @State private var showError = false
    @State private var errorMessage = ""

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 8) {
                        Image(systemName: "person.3.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.cyan)

                        Text("myFAMILY")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(.white)

                        Text("Constitutional foundation for voice legacy")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding(.top, 20)

                    // Register Form
                    VStack(alignment: .leading, spacing: 16) {
                        Text("REGISTER FAMILY MEMBER")
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
                                    ProgressView()
                                        .tint(.black)
                                } else {
                                    Image(systemName: "person.badge.plus")
                                    Text("Register")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(.cyan)
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
                            .font(.caption)
                            .foregroundStyle(.green)
                            .padding()
                    }

                    // Consent Info
                    VStack(alignment: .leading, spacing: 12) {
                        Text("CONSENT KERNEL")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        consentRow(icon: "checkmark.shield", text: "Explicit consent before any synthesis")
                        consentRow(icon: "arrow.uturn.backward.circle", text: "Instant revocation — Kill Switch")
                        consentRow(icon: "clock.arrow.circlepath", text: "100-year estate preservation")
                        consentRow(icon: "lock.shield", text: "C2PA provenance on every asset")
                        consentRow(icon: "dollarsign.circle", text: "75/25 royalty split — perpetual")
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

    private func consentRow(icon: String, text: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.cyan)
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
    FamilyView()
        .preferredColorScheme(.dark)
}
