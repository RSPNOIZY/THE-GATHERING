import SwiftUI

struct AnalysisView: View {
    @State private var isRunning = false
    @State private var analysisLog: [String] = []
    @State private var progress: Double = 0

    private let analysisPhases = [
        "Scanning Heaven API endpoints...",
        "Querying Gabriel audit trail...",
        "Analyzing family member patterns...",
        "Checking consent matrix integrity...",
        "Evaluating voice profile health...",
        "Running compassion-gated opportunity scan...",
        "Generating insight report...",
        "Analysis complete.",
    ]

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 24) {
                    // Analysis Header
                    VStack(spacing: 12) {
                        Image(systemName: "brain.head.profile.fill")
                            .font(.system(size: 48))
                            .foregroundStyle(
                                LinearGradient(
                                    colors: [.purple, .pink],
                                    startPoint: .top,
                                    endPoint: .bottom
                                )
                            )

                        Text("Deep Analysis")
                            .font(.title2.weight(.semibold))
                            .foregroundStyle(.white)

                        Text("Thinks deeply, surfaces human insight")
                            .font(.caption)
                            .foregroundStyle(.gray)
                    }
                    .padding(.top, 20)

                    // Progress
                    if isRunning {
                        VStack(spacing: 8) {
                            ProgressView(value: progress)
                                .tint(.purple)
                            Text("\(Int(progress * 100))%")
                                .font(.caption.monospaced())
                                .foregroundStyle(.purple)
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color.white.opacity(0.03))
                        )
                    }

                    // Run Button
                    Button(action: runAnalysis) {
                        HStack {
                            if isRunning {
                                ProgressView()
                                    .tint(.black)
                                Text("Running...")
                            } else {
                                Image(systemName: "play.fill")
                                Text("Run Nightly Analysis")
                            }
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isRunning ? Color.gray : .purple)
                        .foregroundStyle(isRunning ? .gray : .white)
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    }
                    .disabled(isRunning)

                    // Analysis Log
                    if !analysisLog.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("ANALYSIS LOG")
                                .font(.caption)
                                .foregroundStyle(.gray)
                                .tracking(2)

                            ForEach(Array(analysisLog.enumerated()), id: \.offset) { _, entry in
                                HStack(alignment: .top, spacing: 8) {
                                    Image(systemName: "chevron.right")
                                        .font(.caption2)
                                        .foregroundStyle(.purple)
                                        .padding(.top, 2)
                                    Text(entry)
                                        .font(.caption.monospaced())
                                        .foregroundStyle(.white.opacity(0.8))
                                }
                            }
                        }
                        .padding()
                        .background(
                            RoundedRectangle(cornerRadius: 16)
                                .fill(Color.white.opacity(0.03))
                        )
                    }

                    // Analysis Modules
                    VStack(alignment: .leading, spacing: 12) {
                        Text("MODULES")
                            .font(.caption)
                            .foregroundStyle(.gray)
                            .tracking(2)

                        moduleRow(icon: "person.3", name: "Family Intelligence", desc: "Cross-member pattern analysis")
                        moduleRow(icon: "waveform", name: "Voice Health Monitor", desc: "Profile quality & usage patterns")
                        moduleRow(icon: "chart.line.uptrend.xyaxis", name: "Royalty Trends", desc: "Revenue pattern detection")
                        moduleRow(icon: "shield.checkered", name: "Security Audit", desc: "Consent integrity verification")
                        moduleRow(icon: "heart.circle", name: "Healing Efficacy", desc: "Session outcome analysis")
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
            .navigationTitle("Analysis")
        }
    }

    private func moduleRow(icon: String, name: String, desc: String) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .foregroundStyle(.purple)
                .frame(width: 24)
            VStack(alignment: .leading, spacing: 2) {
                Text(name)
                    .font(.subheadline)
                    .foregroundStyle(.white)
                Text(desc)
                    .font(.caption2)
                    .foregroundStyle(.gray)
            }
            Spacer()
        }
    }

    private func runAnalysis() {
        isRunning = true
        analysisLog = []
        progress = 0

        Task {
            for (index, phase) in analysisPhases.enumerated() {
                try? await Task.sleep(for: .milliseconds(800))
                analysisLog.append(phase)
                progress = Double(index + 1) / Double(analysisPhases.count)
            }
            isRunning = false
        }
    }
}

#Preview {
    AnalysisView()
        .preferredColorScheme(.dark)
}
