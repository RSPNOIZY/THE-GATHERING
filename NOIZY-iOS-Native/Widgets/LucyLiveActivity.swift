import ActivityKit
import WidgetKit
import SwiftUI

// ==============================================================================
// LucyLiveActivity.swift - Glanceable CarPlay & Dynamic Island Live Activity
// ==============================================================================

public struct LucyLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var topMission: String
        public var etaMinutes: Double
        public var trafficDeltaMinutes: Double
        public var destinationName: String
        public var pendingApprovalsCount: Int
        public var revenueSplit: String // "75/25"
        public var batterySocPct: Int  // 2026 Honda CR-V Hybrid SOC
        public var harmonyReceiptId: String

        public init(
            topMission: String = "Master Ingestion",
            etaMinutes: Double = 21.0,
            trafficDeltaMinutes: Double = 4.0,
            destinationName: String = "YOW Airport",
            pendingApprovalsCount: Int = 1,
            revenueSplit: String = "75/25 HARDCODED",
            batterySocPct: Int = 78,
            harmonyReceiptId: String = "REC_LIVE_001"
        ) {
            self.topMission = topMission
            self.etaMinutes = etaMinutes
            self.trafficDeltaMinutes = trafficDeltaMinutes
            self.destinationName = destinationName
            self.pendingApprovalsCount = pendingApprovalsCount
            self.revenueSplit = revenueSplit
            self.batterySocPct = batterySocPct
            self.harmonyReceiptId = harmonyReceiptId
        }
    }

    public var tripWaybillId: String
    public var driverTag: String

    public init(tripWaybillId: String, driverTag: String = "RSP_001") {
        self.tripWaybillId = tripWaybillId
        self.driverTag = driverTag
    }
}

// Glanceable View Layout for CarPlay Dashboard
public struct LucyLiveActivityCarPlayWidget: View {
    let context: ActivityViewContext<LucyLiveActivityAttributes>

    public var body: some View {
        HStack(spacing: 12) {
            // Left Card: Active Mission & Revenue Split Invariant
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 4) {
                    Image(systemName: "sparkles")
                        .foregroundColor(.blue)
                    Text("ACTIVE MISSION")
                        .font(.caption2.bold())
                        .foregroundColor(.secondary)
                }
                Text(context.state.topMission)
                    .font(.subheadline.bold())
                    .lineLimit(1)
                
                Text("SPLIT: \(context.state.revenueSplit)")
                    .font(.system(size: 9, weight: .semibold, design: .monospaced))
                    .foregroundColor(.green)
            }

            Divider()

            // Center Card: ETA & Traffic Delta
            VStack(alignment: .center, spacing: 2) {
                Text("\(Int(context.state.etaMinutes)) min")
                    .font(.title3.bold())
                Text("+\(Int(context.state.trafficDeltaMinutes))m Waze Active")
                    .font(.caption2)
                    .foregroundColor(context.state.trafficDeltaMinutes > 5 ? .orange : .secondary)
                Text(context.state.destinationName)
                    .font(.system(size: 10))
                    .foregroundColor(.secondary)
            }

            Divider()

            // Right Card: Pending Approvals & 2026 Honda CR-V Hybrid SOC
            VStack(alignment: .trailing, spacing: 3) {
                HStack(spacing: 4) {
                    Image(systemName: "checkmark.shield.fill")
                        .foregroundColor(context.state.pendingApprovalsCount > 0 ? .yellow : .green)
                    Text("\(context.state.pendingApprovalsCount) Appr")
                        .font(.caption.bold())
                }
                HStack(spacing: 3) {
                    Image(systemName: "bolt.car.fill")
                        .foregroundColor(.green)
                    Text("\(context.state.batterySocPct)%")
                        .font(.caption2.bold())
                }
            }
        }
        .padding(10)
        .background(Color(UIColor.secondarySystemBackground))
    }
}
