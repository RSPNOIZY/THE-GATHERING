import SwiftUI

struct DashboardView: View {
    @State private var health: HealthResponse?
    @State private var isLoading = true
    @State private var error: String?

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Status Banner
                    statusBanner

                    // Portal Grid
                    portalGrid

                    // HVS Doctrine
                    hvsBanner
                }
                .padding()
            }
            .background(Color.black)
            .navigationTitle("HEAVEN")
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button(action: loadHealth) {
                        Image(systemName: "arrow.clockwise")
                    }
                }
            }
            .onAppear { loadHealth() }
        }
    }

    // MARK: - Status Banner

    private var statusBanner: some View {
        VStack(spacing: 12) {
            if isLoading {
                ProgressView("Connecting to Heaven...")
                    .foregroundStyle(.white)
            } else if let health {
                HStack {
                    Circle()
                        .fill(.green)
                        .frame(width: 12, height: 12)
                    Text(health.service)
                        .font(.headline)
                        .foregroundStyle(.white)
                    Spacer()
                    Text("v\(health.version)")
                        .font(.caption)
                        .foregroundStyle(.gray)
                }

                HStack {
                    Label("Gabriel: \(health.gabriel)", systemImage: "shield.checkered")
                    Spacer()
                    Label("HVS: \(health.hvs)", systemImage: "lock.shield")
                }
                .font(.caption)
                .foregroundStyle(.gray)
            } else if let error {
                HStack {
                    Circle()
                        .fill(.red)
                        .frame(width: 12, height: 12)
                    Text("Offline")
                        .font(.headline)
                        .foregroundStyle(.white)
                    Spacer()
                }
                Text(error)
                    .font(.caption)
                    .foregroundStyle(.red)
            }
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(statusColor, lineWidth: 1)
                )
        )
    }

    private var statusColor: Color {
        if isLoading { return .gray }
        if health != nil { return .green.opacity(0.3) }
        return .red.opacity(0.3)
    }

    // MARK: - Portal Grid

    private var portalGrid: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("PORTALS")
                .font(.caption)
                .foregroundStyle(.gray)
                .tracking(2)

            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible()),
            ], spacing: 12) {
                ForEach(Portal.allCases) { portal in
                    portalCard(portal)
                }
            }
        }
    }

    private func portalCard(_ portal: Portal) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            Image(systemName: portal.icon)
                .font(.title2)
                .foregroundStyle(.cyan)

            Text(portal.displayName)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)

            Text(portal.description)
                .font(.caption2)
                .foregroundStyle(.gray)
                .lineLimit(2)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.white.opacity(0.03))
        )
    }

    // MARK: - HVS Banner

    private var hvsBanner: some View {
        VStack(spacing: 8) {
            Text("75 / 25")
                .font(.system(size: 48, weight: .ultraLight, design: .monospaced))
                .foregroundStyle(.cyan)

            Text("Artists take 75%. Always. Perpetual. Locked at protocol level.")
                .font(.caption)
                .foregroundStyle(.gray)
                .multilineTextAlignment(.center)

            Text("396 Hz")
                .font(.caption2)
                .foregroundStyle(.cyan.opacity(0.6))
                .padding(.top, 4)
        }
        .padding(.vertical, 24)
    }

    // MARK: - Actions

    private func loadHealth() {
        Task {
            isLoading = true
            error = nil
            do {
                health = try await HeavenAPI.shared.health()
            } catch {
                self.error = error.localizedDescription
            }
            isLoading = false
        }
    }
}

#Preview {
    DashboardView()
        .preferredColorScheme(.dark)
}
