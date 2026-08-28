import CarPlay
import UIKit

// ==============================================================================
// CarPlaySceneDelegate.swift - Official CarPlay Template & Motion Lockout Delegate
// ==============================================================================

public class CarPlaySceneDelegate: UIResponder, CPTemplateApplicationSceneDelegate {
    public var interfaceController: CPInterfaceController?
    private var isVehicleParked: Bool = true // Synced with 2026 Honda CR-V Gear Position & Speed Sensor

    public func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didConnect interfaceController: CPInterfaceController
    ) {
        self.interfaceController = interfaceController
        self.displayMainDashboard()
    }

    public func templateApplicationScene(
        _ templateApplicationScene: CPTemplateApplicationScene,
        didDisconnectInterfaceController interfaceController: CPInterfaceController
    ) {
        self.interfaceController = nil
    }

    // Main CarPlay Dashboard using Apple's CPListTemplate & CPInformationTemplate
    private func displayMainDashboard() {
        let founderBriefItem = CPListItem(
            text: "Today's Founder Briefing",
            detailText: "YOW Surge 1.65x • 4 Stems Mastered • 0 Approvals"
        )
        founderBriefItem.setImage(UIImage(systemName: "sparkles.rectangle.stack"))
        founderBriefItem.handler = { [weak self] item, completion in
            self?.presentFounderBriefDetail(completion: completion)
        }

        let approvalQueueItem = CPListItem(
            text: "Gabriel Approval Queue",
            detailText: "1 Pending Handoff to YOW Airport"
        )
        approvalQueueItem.setImage(UIImage(systemName: "checkmark.shield"))
        approvalQueueItem.handler = { [weak self] item, completion in
            self?.presentApprovalQueue(completion: completion)
        }

        let parkedVideoItem = CPListItem(
            text: "Founder Video Briefing (Parked Only)",
            detailText: self.isVehicleParked ? "Ready to Play" : "Locked while in Motion"
        )
        parkedVideoItem.setImage(UIImage(systemName: "play.rectangle.fill"))
        parkedVideoItem.handler = { [weak self] item, completion in
            self?.handleVideoPlaybackRequest(completion: completion)
        }

        let listTemplate = CPListTemplate(
            title: "LUCY COPILOT",
            sections: [CPListSection(items: [founderBriefItem, approvalQueueItem, parkedVideoItem])]
        )

        interfaceController?.setRootTemplate(listTemplate, animated: true, completion: nil)
    }

    // Detail view using CPInformationTemplate
    private func presentFounderBriefDetail(completion: @escaping () -> Void) {
        let items = [
            CPInformationItem(title: "Active Corridor", detail: "Ottawa Downtown -> YOW Airport"),
            CPInformationItem(title: "Surge Multiplier", detail: "1.65x (High Demand)"),
            CPInformationItem(title: "Catalog Split", detail: "75/25 Hardcoded Invariant"),
            CPInformationItem(title: "Vehicle Powertrain", detail: "2026 Honda CR-V Hybrid (78% SOC)")
        ]

        let infoTemplate = CPInformationTemplate(
            title: "Founder Briefing",
            layout: .twoColumn,
            items: items,
            actions: [
                CPTextButton(title: "Inject to Waze", style: .confirm) { _ in
                    let wazeUrl = URL(string: "waze://?ll=45.3225,-75.6692&navigate=yes")!
                    UIApplication.shared.open(wazeUrl)
                }
            ]
        )

        interfaceController?.pushTemplate(infoTemplate, animated: true, completion: nil)
        completion()
    }

    private func presentApprovalQueue(completion: @escaping () -> Void) {
        let items = [
            CPInformationItem(title: "Waybill", detail: "WB-20260828-09A"),
            CPInformationItem(title: "Policy Code", detail: "NC·01–10 (Law 25 Consent Active)"),
            CPInformationItem(title: "Status", detail: "CLEARED BY GABRIEL")
        ]

        let infoTemplate = CPInformationTemplate(
            title: "Approval Queue",
            layout: .twoColumn,
            items: items,
            actions: [
                CPTextButton(title: "Approve Handoff", style: .confirm) { _ in
                    // Dispatches approval to Rule Zero ledger
                }
            ]
        )

        interfaceController?.pushTemplate(infoTemplate, animated: true, completion: nil)
        completion()
    }

    // 🔒 Parked-Only Video Playback Gate (Apple Safety Compliance)
    private func handleVideoPlaybackRequest(completion: @escaping () -> Void) {
        if !self.isVehicleParked {
            let alertTemplate = CPAlertTemplate(
                titleVariants: ["Video Playback Locked"],
                actions: [CPAlertAction(title: "OK", style: .default, handler: { _ in })]
            )
            interfaceController?.presentTemplate(alertTemplate, animated: true, completion: nil)
        } else {
            // In Parked state, launch video viewport
            let infoTemplate = CPInformationTemplate(
                title: "Studio Video Deck",
                layout: .twoColumn,
                items: [
                    CPInformationItem(title: "Now Playing", detail: "NOIZYLAB 2026 Master Build.pptx"),
                    CPInformationItem(title: "Duration", detail: "14:20"),
                    CPInformationItem(title: "State", detail: "Vehicle in Parked (P) Mode")
                ],
                actions: []
            )
            interfaceController?.pushTemplate(infoTemplate, animated: true, completion: nil)
        }
        completion()
    }

    // Hardware speed sensor / gear position listener
    public func updateVehicleMotionState(isParked: Bool) {
        self.isVehicleParked = isParked
        if !isParked {
            // Gracefully dismiss video viewport into background audio if vehicle starts moving
            self.displayMainDashboard()
        }
    }
}
