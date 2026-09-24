// HVSLiveContourView.swift
// NOIZY Empire — SwiftUI cockpit for HVS Live Contour v0.1
//
// Phase 3 of the v0.1 plan. Six-pane layout per Spec §2:
//   ① Input meter
//   ② HVS contour graph (rolling waveform + contour line)
//   ③ Authenticity badge (score + RSP_001 ✓/✗)
//   ④ Emotion classifier (5-bucket softmax bars)
//   ⑤ NOIZYVOX tag queue (5 most recent)
//   ⑥ Session manifest mini-panel (counts + 4 status lights + COMMIT)
//
// Dark sanctuary aesthetic. SwiftUI Canvas for the contour graph (no Metal yet —
// v0.1 ships fast, v0.2 adds Metal renderer if 60fps proves insufficient).

#if canImport(SwiftUI)
import SwiftUI

// MARK: - NOIZY palette

private enum NoizyPalette {
    static let bg              = Color(red: 0.05, green: 0.06, blue: 0.09)        // #0d0f17
    static let panel           = Color(red: 0.09, green: 0.10, blue: 0.13)        // #161a22
    static let panel2          = Color(red: 0.11, green: 0.13, blue: 0.18)        // #1c212e
    static let border          = Color(red: 0.19, green: 0.21, blue: 0.24)        // #30363d
    static let text            = Color(red: 0.79, green: 0.82, blue: 0.85)        // #c9d1d9
    static let textDim         = Color(red: 0.55, green: 0.58, blue: 0.62)        // #8b949e
    static let accent          = Color(red: 0.34, green: 0.65, blue: 1.00)        // #58a6ff
    static let good            = Color(red: 0.25, green: 0.73, blue: 0.31)        // #3fb950
    static let warn            = Color(red: 0.82, green: 0.60, blue: 0.13)        // #d29922
    static let bad             = Color(red: 0.97, green: 0.32, blue: 0.29)        // #f85149
    static let gold            = Color(red: 1.00, green: 0.84, blue: 0.00)        // #ffd700
    static let frequency396    = Color(red: 0.30, green: 0.85, blue: 0.70)        // 396Hz green
}

// MARK: - Main view

@available(macOS 15.0, iOS 18.0, *)
public struct HVSLiveContourView: View {
    @ObservedObject public var viewModel: HVSLiveContourViewModel
    public var commitAction: () -> Void = {}

    public init(
        viewModel: HVSLiveContourViewModel,
        commitAction: @escaping () -> Void = {}
    ) {
        self.viewModel = viewModel
        self.commitAction = commitAction
    }

    public var body: some View {
        VStack(spacing: 0) {
            HeaderBar()
                .padding(.horizontal, 12)
                .padding(.vertical, 6)
                .background(NoizyPalette.panel)

            // Top row: meter + contour graph
            HStack(spacing: 0) {
                InputMeterPane(rms: viewModel.inputRMS, peak: viewModel.inputPeak)
                    .frame(width: 100)
                    .background(NoizyPalette.panel2)

                Divider().background(NoizyPalette.border)

                ContourGraphPane(history: viewModel.contourHistory)
                    .frame(maxWidth: .infinity)
                    .background(NoizyPalette.bg)
            }
            .frame(height: 140)

            Divider().background(NoizyPalette.border)

            // Middle row: authenticity badge + emotion classifier
            HStack(spacing: 0) {
                AuthenticityPane(
                    score: viewModel.authenticityScore,
                    verdict: viewModel.authenticityVerdict
                )
                .frame(maxWidth: .infinity)
                .background(NoizyPalette.panel)

                Divider().background(NoizyPalette.border)

                EmotionPane(distribution: viewModel.emotion)
                    .frame(maxWidth: .infinity)
                    .background(NoizyPalette.panel)
            }
            .frame(height: 90)

            Divider().background(NoizyPalette.border)

            // Tag queue
            TagQueuePane(tags: viewModel.tagQueue)
                .frame(height: 100)
                .background(NoizyPalette.panel2)

            Divider().background(NoizyPalette.border)

            // Session manifest mini-panel + commit
            SessionManifestPane(
                viewModel: viewModel,
                commitAction: commitAction
            )
            .background(NoizyPalette.panel)
        }
        .background(NoizyPalette.bg)
        .foregroundStyle(NoizyPalette.text)
        .frame(minWidth: 600, idealWidth: 720, minHeight: 480, idealHeight: 540)
    }
}

// MARK: - Header

@available(macOS 15.0, iOS 18.0, *)
private struct HeaderBar: View {
    var body: some View {
        HStack(spacing: 8) {
            Text("HVS LIVE CONTOUR")
                .font(.system(size: 11, weight: .bold, design: .monospaced))
                .foregroundStyle(NoizyPalette.gold)
            Text("· ai.noizy.hvs-live-contour · v0.1")
                .font(.system(size: 10, design: .monospaced))
                .foregroundStyle(NoizyPalette.textDim)
            Spacer()
            Text("396 Hz")
                .font(.system(size: 10, weight: .semibold, design: .monospaced))
                .foregroundStyle(NoizyPalette.frequency396)
        }
    }
}

// MARK: - ① Input meter

@available(macOS 15.0, iOS 18.0, *)
private struct InputMeterPane: View {
    let rms: Float
    let peak: Float

    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text("INPUT")
                .font(.system(size: 9, weight: .semibold, design: .monospaced))
                .foregroundStyle(NoizyPalette.textDim)

            // RMS bar
            VStack(alignment: .leading, spacing: 2) {
                Text("RMS")
                    .font(.system(size: 8, design: .monospaced))
                    .foregroundStyle(NoizyPalette.textDim)
                MeterBar(value: CGFloat(rms), color: NoizyPalette.accent)
                    .frame(height: 8)
            }

            // Peak bar
            VStack(alignment: .leading, spacing: 2) {
                Text("PEAK")
                    .font(.system(size: 8, design: .monospaced))
                    .foregroundStyle(NoizyPalette.textDim)
                MeterBar(value: CGFloat(peak), color: NoizyPalette.gold)
                    .frame(height: 8)
            }

            Spacer()

            Text(String(format: "%.3f", rms))
                .font(.system(size: 10, design: .monospaced))
                .foregroundStyle(NoizyPalette.text)
        }
        .padding(10)
    }
}

@available(macOS 15.0, iOS 18.0, *)
private struct MeterBar: View {
    let value: CGFloat
    let color: Color

    var body: some View {
        GeometryReader { geo in
            ZStack(alignment: .leading) {
                RoundedRectangle(cornerRadius: 2)
                    .fill(NoizyPalette.bg)
                RoundedRectangle(cornerRadius: 2)
                    .fill(color)
                    .frame(width: max(0, min(geo.size.width, geo.size.width * value)))
            }
        }
    }
}

// MARK: - ② Contour graph

@available(macOS 15.0, iOS 18.0, *)
private struct ContourGraphPane: View {
    let history: [HVSLiveContourViewModel.ContourPoint]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            HStack {
                Text("HVS CONTOUR · 3s ROLLING")
                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                    .foregroundStyle(NoizyPalette.textDim)
                Spacer()
                Text("\(history.count) samples")
                    .font(.system(size: 9, design: .monospaced))
                    .foregroundStyle(NoizyPalette.textDim)
            }
            .padding(.horizontal, 10)
            .padding(.top, 8)

            Canvas { ctx, size in
                guard history.count > 1 else { return }
                let w = size.width
                let h = size.height
                let dx = w / CGFloat(max(1, history.count - 1))

                // Background grid
                let gridColor = NoizyPalette.border.opacity(0.3)
                for i in 1..<5 {
                    let y = h * CGFloat(i) / 5
                    var line = Path()
                    line.move(to: CGPoint(x: 0, y: y))
                    line.addLine(to: CGPoint(x: w, y: y))
                    ctx.stroke(line, with: .color(gridColor), lineWidth: 0.5)
                }

                // RMS waveform (filled area)
                var rmsPath = Path()
                rmsPath.move(to: CGPoint(x: 0, y: h))
                for (i, p) in history.enumerated() {
                    let x = CGFloat(i) * dx
                    let y = h - CGFloat(p.rms) * h * 1.5  // amplify a bit for visibility
                    rmsPath.addLine(to: CGPoint(x: x, y: y))
                }
                rmsPath.addLine(to: CGPoint(x: w, y: h))
                rmsPath.closeSubpath()
                ctx.fill(rmsPath, with: .color(NoizyPalette.accent.opacity(0.3)))

                // Authenticity contour line (gold)
                var authPath = Path()
                for (i, p) in history.enumerated() {
                    let x = CGFloat(i) * dx
                    let y = h - CGFloat(p.authenticity) * h
                    if i == 0 {
                        authPath.move(to: CGPoint(x: x, y: y))
                    } else {
                        authPath.addLine(to: CGPoint(x: x, y: y))
                    }
                }
                ctx.stroke(authPath, with: .color(NoizyPalette.gold), lineWidth: 1.5)

                // Spectral centroid contour line (frequency green)
                var centroidPath = Path()
                for (i, p) in history.enumerated() {
                    let x = CGFloat(i) * dx
                    let y = h - CGFloat(p.centroidNormalized) * h
                    if i == 0 {
                        centroidPath.move(to: CGPoint(x: x, y: y))
                    } else {
                        centroidPath.addLine(to: CGPoint(x: x, y: y))
                    }
                }
                ctx.stroke(centroidPath, with: .color(NoizyPalette.frequency396.opacity(0.7)), lineWidth: 1.0)
            }
            .padding(.horizontal, 10)
            .padding(.bottom, 8)
        }
    }
}

// MARK: - ③ Authenticity badge

@available(macOS 15.0, iOS 18.0, *)
private struct AuthenticityPane: View {
    let score: Float
    let verdict: AuthenticityResult.Verdict

    private var color: Color {
        switch verdict {
        case .rspResonance:     return NoizyPalette.good
        case .likely:           return NoizyPalette.warn
        case .unverified:       return NoizyPalette.bad
        case .insufficientData: return NoizyPalette.textDim
        }
    }

    private var label: String {
        switch verdict {
        case .rspResonance:     return "RSP_001 ✓"
        case .likely:           return "LIKELY"
        case .unverified:       return "UNVERIFIED"
        case .insufficientData: return "ENROLL FIRST"
        }
    }

    var body: some View {
        VStack(spacing: 6) {
            Text("AUTHENTICITY")
                .font(.system(size: 9, weight: .semibold, design: .monospaced))
                .foregroundStyle(NoizyPalette.textDim)

            ZStack {
                Circle()
                    .stroke(NoizyPalette.border, lineWidth: 2)
                    .frame(width: 60, height: 60)
                Circle()
                    .trim(from: 0, to: CGFloat(score))
                    .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                    .rotationEffect(.degrees(-90))
                    .frame(width: 60, height: 60)
                    .animation(.easeInOut(duration: 0.25), value: score)
                Text(String(format: "%.0f%%", score * 100))
                    .font(.system(size: 13, weight: .bold, design: .monospaced))
                    .foregroundStyle(color)
            }

            Text(label)
                .font(.system(size: 9, weight: .semibold, design: .monospaced))
                .foregroundStyle(color)
        }
        .padding(8)
    }
}

// MARK: - ④ Emotion classifier

@available(macOS 15.0, iOS 18.0, *)
private struct EmotionPane: View {
    let distribution: HVSLiveContourViewModel.EmotionDistribution

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("EMOTION")
                .font(.system(size: 9, weight: .semibold, design: .monospaced))
                .foregroundStyle(NoizyPalette.textDim)

            VStack(spacing: 3) {
                EmotionRow(label: "neutral", value: distribution.neutral, color: NoizyPalette.textDim)
                EmotionRow(label: "joy",     value: distribution.joy,     color: NoizyPalette.gold)
                EmotionRow(label: "awe",     value: distribution.awe,     color: NoizyPalette.frequency396)
                EmotionRow(label: "sad",     value: distribution.sad,     color: NoizyPalette.accent)
                EmotionRow(label: "rage",    value: distribution.rage,    color: NoizyPalette.bad)
            }
        }
        .padding(8)
    }
}

@available(macOS 15.0, iOS 18.0, *)
private struct EmotionRow: View {
    let label: String
    let value: Float
    let color: Color

    var body: some View {
        HStack(spacing: 6) {
            Text(label)
                .font(.system(size: 9, design: .monospaced))
                .foregroundStyle(NoizyPalette.text)
                .frame(width: 48, alignment: .leading)
            MeterBar(value: CGFloat(value), color: color)
                .frame(height: 6)
        }
    }
}

// MARK: - ⑤ Tag queue

@available(macOS 15.0, iOS 18.0, *)
private struct TagQueuePane: View {
    let tags: [HVSLiveContourViewModel.TagEntry]

    var body: some View {
        VStack(alignment: .leading, spacing: 4) {
            Text("NOIZYVOX TAG QUEUE")
                .font(.system(size: 9, weight: .semibold, design: .monospaced))
                .foregroundStyle(NoizyPalette.textDim)
                .padding(.horizontal, 10)
                .padding(.top, 8)

            if tags.isEmpty {
                Text("(no tags yet — speak into the chain)")
                    .font(.system(size: 10, design: .monospaced))
                    .foregroundStyle(NoizyPalette.textDim.opacity(0.6))
                    .padding(.horizontal, 10)
                Spacer()
            } else {
                ScrollView {
                    VStack(alignment: .leading, spacing: 3) {
                        ForEach(tags) { tag in
                            HStack(spacing: 8) {
                                Text(timeString(tag.timestamp))
                                    .font(.system(size: 9, design: .monospaced))
                                    .foregroundStyle(NoizyPalette.textDim)
                                Text(tag.label)
                                    .font(.system(size: 10, design: .monospaced))
                                    .foregroundStyle(NoizyPalette.text)
                                Spacer()
                                Text(tag.vaultReady ? "[vault-ready]" : "[pending]")
                                    .font(.system(size: 8, design: .monospaced))
                                    .foregroundStyle(tag.vaultReady ? NoizyPalette.good : NoizyPalette.warn)
                            }
                            .padding(.horizontal, 10)
                        }
                    }
                }
            }
        }
    }

    private func timeString(_ d: Date) -> String {
        let f = DateFormatter()
        f.dateFormat = "HH:mm:ss"
        return f.string(from: d)
    }
}

// MARK: - ⑥ Session manifest mini-panel

@available(macOS 15.0, iOS 18.0, *)
private struct SessionManifestPane: View {
    @ObservedObject var viewModel: HVSLiveContourViewModel
    let commitAction: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 6) {
            Text("SESSION MANIFEST")
                .font(.system(size: 9, weight: .semibold, design: .monospaced))
                .foregroundStyle(NoizyPalette.textDim)

            HStack {
                InfoColumn(label: "session_id", value: viewModel.sessionId)
                Spacer()
                InfoColumn(label: "creator_id", value: viewModel.creatorId)
                Spacer()
                InfoColumn(label: "captured", value: "\(viewModel.capturedBuffers) buffers")
                Spacer()
                InfoColumn(label: "elapsed", value: String(format: "%.0fs", viewModel.elapsedSeconds))
            }

            HStack(spacing: 12) {
                StatusLightView(label: "CAPTURE",  light: viewModel.captureLight)
                StatusLightView(label: "CLASSIFY", light: viewModel.classifyLight)
                StatusLightView(label: "ARCHIVE",  light: viewModel.archiveLight)
                StatusLightView(label: "CONSENT",  light: viewModel.consentLight)
                Spacer()
                Button(action: commitAction) {
                    Text("COMMIT TO VAULT")
                        .font(.system(size: 10, weight: .bold, design: .monospaced))
                        .padding(.horizontal, 12)
                        .padding(.vertical, 6)
                        .background(NoizyPalette.gold)
                        .foregroundStyle(.black)
                        .clipShape(RoundedRectangle(cornerRadius: 4))
                }
                .buttonStyle(.plain)
            }
        }
        .padding(10)
    }
}

@available(macOS 15.0, iOS 18.0, *)
private struct InfoColumn: View {
    let label: String
    let value: String
    var body: some View {
        VStack(alignment: .leading, spacing: 2) {
            Text(label)
                .font(.system(size: 8, design: .monospaced))
                .foregroundStyle(NoizyPalette.textDim)
            Text(value)
                .font(.system(size: 10, design: .monospaced))
                .foregroundStyle(NoizyPalette.text)
                .lineLimit(1)
        }
    }
}

@available(macOS 15.0, iOS 18.0, *)
private struct StatusLightView: View {
    let label: String
    let light: HVSLiveContourViewModel.StatusLight

    private var color: Color {
        switch light {
        case .idle:    return NoizyPalette.textDim
        case .active:  return NoizyPalette.good
        case .warning: return NoizyPalette.warn
        case .error:   return NoizyPalette.bad
        }
    }

    var body: some View {
        HStack(spacing: 4) {
            Circle()
                .fill(color)
                .frame(width: 8, height: 8)
                .shadow(color: color.opacity(light == .active ? 0.8 : 0), radius: 4)
            Text(label)
                .font(.system(size: 8, weight: .semibold, design: .monospaced))
                .foregroundStyle(NoizyPalette.text)
        }
    }
}

// MARK: - SwiftUI preview

#if DEBUG
@available(macOS 15.0, iOS 18.0, *)
struct HVSLiveContourView_Previews: PreviewProvider {
    static var previews: some View {
        let vm = HVSLiveContourViewModel()
        Task { @MainActor in
            vm.setSession(id: "ses_preview_001", startedAt: Date())
            vm.appendTag("vocal_take_warm_phrasing", vaultReady: true)
            vm.appendTag("vocal_take_breath_passage", vaultReady: false)
            vm.setEmotion(.init(neutral: 0.18, joy: 0.22, awe: 0.51, sad: 0.07, rage: 0.02))
        }
        return HVSLiveContourView(viewModel: vm)
            .preferredColorScheme(.dark)
    }
}
#endif
#endif
