import ActivityKit
import WidgetKit
import SwiftUI

// ==============================================================================
// 1. Live Activity Attributes for CarPlay & Dynamic Island
// ==============================================================================
public struct LucyLiveActivityAttributes: ActivityAttributes {
    public struct ContentState: Codable, Hashable {
        public var topMission: String
        public var destinationName: String
        public var etaMinutes: Double
        public var delayMinutes: Double
        public var surgeMultiplier: Double
        public var vehicleSocPct: Int // 2026 Honda CR-V Hybrid Battery SOC
        public var harmonyReceiptId: String
        public var isUrgentApprovalPending: Bool

        public init(
            topMission: String,
            destinationName: String,
            etaMinutes: Double,
            delayMinutes: Double = 0.0,
            surgeMultiplier: Double = 1.0,
            vehicleSocPct: Int = 78,
            harmonyReceiptId: String = "REC_LIVE_001",
            isUrgentApprovalPending: Bool = false
        ) {
            self.topMission = topMission
            self.destinationName = destinationName
            self.etaMinutes = etaMinutes
            self.delayMinutes = delayMinutes
            self.surgeMultiplier = surgeMultiplier
            self.vehicleSocPct = vehicleSocPct
            self.harmonyReceiptId = harmonyReceiptId
            self.isUrgentApprovalPending = isUrgentApprovalPending
        }
    }

    public var tripWaybillId: String
    public var driverTag: String

    public init(tripWaybillId: String, driverTag: String = "RSP_001") {
        self.tripWaybillId = tripWaybillId
        self.driverTag = driverTag
    }
}

// ==============================================================================
// 2. CarPlay & Lock Screen Live Activity View
// ==============================================================================
public struct LucyCarPlayWidgetView: View {
    let context: ActivityViewContext<LucyLiveActivityAttributes>

    public var body: some View {
        HStack(alignment: .center, spacing: 16) {
            // Left: Status Avatar & Invariant Lock
            VStack(alignment: .leading, spacing: 4) {
                HStack(spacing: 6) {
                    Image(systemName: "shield.fill")
                        .foregroundColor(.blue)
                    Text("LUCY COPILOT")
                        .font(.caption2.bold())
                        .foregroundColor(.secondary)
                }
                Text(context.state.topMission)
                    .font(.headline)
                    .lineLimit(1)
            }

            Spacer()

            // Center: Vehicular ETA & Surge
            VStack(alignment: .trailing, spacing: 2) {
                HStack(spacing: 4) {
                    Text("\(String(format: "%.0f", context.state.etaMinutes)) min")
                        .font(.title2.bold())
                        .foregroundColor(context.state.delayMinutes > 5 ? .orange : .primary)
                    if context.state.surgeMultiplier > 1.0 {
                        Text("\(String(format: "%.2f", context.state.surgeMultiplier))x")
                            .font(.caption.bold())
                            .padding(.horizontal, 4)
                            .padding(.vertical, 2)
                            .background(Color.yellow.opacity(0.2))
                            .cornerRadius(4)
                    }
                }
                Text("To: \(context.state.destinationName)")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }

            // Right: 2026 Honda CR-V Hybrid Battery SOC
            VStack(alignment: .center, spacing: 2) {
                Image(systemName: "bolt.car.fill")
                    .foregroundColor(.green)
                Text("\(context.state.vehicleSocPct)%")
                    .font(.caption2.bold())
            }
        }
        .padding()
        .background(Color(UIColor.secondarySystemBackground))
    }
}
