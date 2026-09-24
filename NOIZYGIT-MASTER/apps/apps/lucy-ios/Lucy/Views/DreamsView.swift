import SwiftUI

struct DreamsView: View {
    @State private var dreamPrompt = ""
    @State private var isGenerating = false
    @State private var dreams: [Dream] = [
        Dream(
            title: "The Cathedral of Frequencies",
            content: "Imagine a vast cathedral where each pillar vibrates at a different solfeggio frequency. 396 Hz at the foundation — liberation. The ceiling opens to reveal stars that are actually voice profiles, each one a human soul preserved in crystalline audio.",
            frequency: 396,
            timestamp: "2026-04-10 03:14"
        ),
        Dream(
            title: "The Consent River",
            content: "A river flows through a digital landscape. Each drop of water carries a consent token — glowing green when active, fading to grey when revoked. The Kill Switch sits as a great dam at the river's mouth. One touch and the entire flow redirects.",
            frequency: 528,
            timestamp: "2026-04-09 02:47"
        ),
    ]

    struct Dream: Identifiable {
        let id = UUID()
        let title: String
        let content: String
        let frequency: Double
        let timestamp: String
    }

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 12) {
                        Image(systemName: "sparkles")
                            .font(.system(size: 48))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.purple, .cyan, .pink],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )

                        Text("DreamChamber")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(.white)

                        Text("Where imagination transcends boundaries")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding(.top, 20)

                    // Dream Input
                    VStack(alignment: .leading, spacing: 12) {
                        Text("DREAM SEED")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        TextField("Plant a creative seed...", text: $dreamPrompt, axis: .vertical)
                            .textFieldStyle(.plain)
                            .lineLimit(3...6)
                            .padding()
                            .background(Color.white.opacity(0.05))
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                            .foregroundStyle(.white)

                        Button(action: generateDream) {
                            HStack {
                                if isGenerating {
                                    ProgressView()
                                        .tint(.white)
                                } else {
                                    Image(systemName: "wand.and.stars")
                                    Text("Dream")
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(
                                LinearGradient(
                                    colors: [.purple, .pink],
                                    startPoint: .leading,
                                    endPoint: .trailing
                                )
                            )
                            .foregroundStyle(.white)
                            .clipShape(RoundedRectangle(cornerRadius: 10))
                        }
                        .disabled(isGenerating || dreamPrompt.isEmpty)
                    }
                    .padding()
                    .background(
                        RoundedRectangle(cornerRadius: 16)
                            .fill(Color.white.opacity(0.03))
                    )

                    // Dream Journal
                    VStack(alignment: .leading, spacing: 16) {
                        Text("DREAM JOURNAL")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        ForEach(dreams) { dream in
                            dreamCard(dream)
                        }
                    }
                }
                .padding()
            }
            .background(
                LinearGradient(
                    colors: [Color.black, Color.purple.opacity(0.15), Color.indigo.opacity(0.1), Color.black],
                    startPoint: .top,
                    endPoint: .bottom
                )
            )
            .navigationTitle("Dreams")
        }
    }

    private func dreamCard(_ dream: Dream) -> some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(dream.title)
                    .font(.subheadline.weight(.semibold))
                    .foregroundStyle(.white)
                Spacer()
                Text("\(Int(dream.frequency)) Hz")
                    .font(.caption2.monospaced())
                    .foregroundStyle(.purple)
            }

            Text(dream.content)
                .font(.caption)
                .foregroundStyle(.gray)

            Text(dream.timestamp)
                .font(.caption2.monospaced())
                .foregroundStyle(.purple.opacity(0.5))
        }
        .padding()
        .background(
            RoundedRectangle(cornerRadius: 12)
                .fill(Color.purple.opacity(0.05))
                .overlay(
                    RoundedRectangle(cornerRadius: 12)
                        .stroke(Color.purple.opacity(0.15), lineWidth: 1)
                )
        )
    }

    private func generateDream() {
        isGenerating = true
        let prompt = dreamPrompt
        dreamPrompt = ""
        Task {
            try? await Task.sleep(for: .seconds(2))
            let newDream = Dream(
                title: "Dream from \(Date().formatted(date: .abbreviated, time: .shortened))",
                content: prompt,
                frequency: [396, 417, 528, 639, 741, 852].randomElement() ?? 396,
                timestamp: Date().formatted(date: .numeric, time: .shortened)
            )
            dreams.insert(newDream, at: 0)
            isGenerating = false
        }
    }
}

#Preview {
    DreamsView()
        .preferredColorScheme(.dark)
}
