import SwiftUI

struct InsightsView: View {
    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    VStack(spacing: 12) {
                        Image(systemName: "lightbulb.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(.yellow)

                        Text("Insights")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(.white)

                        Text("Compassion-gated opportunity recognition")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding(.top, 20)

                    // Placeholder Insights
                    insightCard(
                        category: "FAMILY",
                        title: "Voice Profile Coverage",
                        body: "3 of 33 family members have registered voice profiles. Consider reaching out to Tier 1 members first.",
                        compassion: true,
                        icon: "person.3"
                    )

                    insightCard(
                        category: "REVENUE",
                        title: "Royalty Pattern",
                        body: "No royalty data yet. Once NOIZYFISH goes live, Lucy will track 75/25 split compliance automatically.",
                        compassion: true,
                        icon: "chart.bar"
                    )

                    insightCard(
                        category: "SECURITY",
                        title: "Consent Matrix Integrity",
                        body: "All active consent tokens have valid C2PA stamps. No revocation anomalies detected.",
                        compassion: true,
                        icon: "lock.shield"
                    )

                    insightCard(
                        category: "HEALING",
                        title: "Session Frequency",
                        body: "396 Hz liberation protocol is the most requested. Consider expanding to 528 Hz transformation sessions.",
                        compassion: true,
                        icon: "heart.circle"
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
            .navigationTitle("Insights")
        }
    }

    private func insightCard(category: String, title: String, body: String, compassion: Bool, icon: String) -> some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                Image(systemName: icon)
                    .foregroundStyle(.purple)
                Text(category)
                    .font(.caption2.weight(.semibold))
                    .foregroundStyle(.purple)
                    .tracking(1)
                Spacer()
                if compassion {
                    Label("Compassion OK", systemImage: "heart.fill")
                        .font(.caption2)
                        .foregroundStyle(.green)
                }
            }

            Text(title)
                .font(.subheadline.weight(.semibold))
                .foregroundStyle(.white)

            Text(body)
                .font(.caption)
                .foregroundStyle(.gray)
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 16)
                .fill(Color.white.opacity(0.03))
                .overlay(
                    RoundedRectangle(cornerRadius: 16)
                        .stroke(Color.purple.opacity(0.15), lineWidth: 1)
                )
        )
    }
}

#Preview {
    InsightsView()
        .preferredColorScheme(.dark)
}
