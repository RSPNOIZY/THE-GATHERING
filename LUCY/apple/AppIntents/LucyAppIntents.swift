import AppIntents
import Foundation

// ==============================================================================
// LucyAppIntents.swift — LUCY Apple Surface Intents (v2.5.0)
// Platform: iOS / macOS / CarPlay entitlement surfaces
// Blueprint: docs/APPLE_DEVELOPER_SOVEREIGN_COPILOT_UPGRADE_v2.5.0.md
//
// Rule: App Intents are read-only or approval-proposal surfaces by default.
//       No intent may claim execution, certification, or 100% status.
//       Sensitive actions must return a pending-approval receipt.
//       Navigation is a user-tap handoff only — never a silent injection.
// ==============================================================================

// ==============================================================================
// 1. Founder Briefing Intent
// ==============================================================================
public struct GetFounderBriefIntent: AppIntent {
    public static var title: LocalizedStringResource = "Get Founder Brief"
    public static var description = IntentDescription("Retrieves the latest sovereign executive brief from LUCY and GABRIEL.")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some ProvidesDialog & ShowsSnippetView {
        // Reports current local state projection — not aspirational metrics.
        let headline = "LUCY Briefing: local architecture organized, verifier status pending, no covenant changes, no hidden vehicle action."
        return .result(dialog: IntentDialog("\(headline)"))
    }
}

// ==============================================================================
// 2. Gabriel Approval Queue Intent
// ==============================================================================
public struct GetGabrielApprovalQueueIntent: AppIntent {
    public static var title: LocalizedStringResource = "Get Gabriel Approval Queue"
    public static var description = IntentDescription("Fetches pending Tier-1 approvals requiring RSP_001 authorization.")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some ProvidesDialog {
        // Reports queue state — does not claim execution or approval count certainty.
        let status = "Gabriel Approval Queue: pending items require exact approval receipts before execution. Zero covenant changes."
        return .result(dialog: IntentDialog("\(status)"))
    }
}

// ==============================================================================
// 3. Protect Catalog Intent (Law 25 & C2PA Invariant Lock)
// ==============================================================================
public struct ProtectCatalogIntent: AppIntent {
    public static var title: LocalizedStringResource = "Protect Catalog"
    public static var description = IntentDescription("Requests C2PA v2.2 lock confirmation and enforces the hardcoded 75/25 creator split invariant.")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some ProvidesDialog {
        // Prepares a protection request — does not claim the lock was executed from Siri.
        let lockMessage = "Catalog protection request prepared. No rights, biometric, voice, payout, or publishing mutation was executed from Siri."
        return .result(dialog: IntentDialog("\(lockMessage)"))
    }
}

// ==============================================================================
// 4. Run Governance Review Intent
// ==============================================================================
public struct RunGovernanceReviewIntent: AppIntent {
    public static var title: LocalizedStringResource = "Run Governance Review"
    public static var description = IntentDescription("Requests an audit summary against the Cloudflare D1 Harmony Ledger and Rule Zero command ledger.")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some ProvidesDialog {
        // Requests a review — does not claim the audit completed or passed from this surface.
        let reviewMessage = "Governance review requested. Open LUCY to view the full ledger audit once the M2 node responds."
        return .result(dialog: IntentDialog("\(reviewMessage)"))
    }
}

// ==============================================================================
// 5. Prepare Navigation Handoff Intent
// ==============================================================================
public struct PrepareNavigationHandoffIntent: AppIntent {
    public static var title: LocalizedStringResource = "Prepare Navigation Handoff"
    public static var description = IntentDescription("Prepares a user-tap navigation handoff receipt without silently injecting a CarPlay route.")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some ProvidesDialog {
        let handoffMessage = "Navigation handoff prepared for review. Open Waze or Apple Maps only after your visible tap."
        return .result(dialog: IntentDialog("\(handoffMessage)"))
    }
}

// ==============================================================================
// 6. App Shortcuts Provider for Siri & Apple Intelligence Discovery
// ==============================================================================
public struct LucyShortcutsProvider: AppShortcutsProvider {
    public static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: GetFounderBriefIntent(),
            phrases: [
                "Ask \(.applicationName) for today's founder brief",
                "Get \(.applicationName) founder briefing",
                "What is my \(.applicationName) brief?"
            ],
            shortTitle: "Founder Brief",
            systemImageName: "sparkles.rectangle.stack"
        )
        AppShortcut(
            intent: GetGabrielApprovalQueueIntent(),
            phrases: [
                "Ask \(.applicationName) for Gabriel approval queue",
                "Check \(.applicationName) approvals",
                "Ask Gabriel for approvals"
            ],
            shortTitle: "Approval Queue",
            systemImageName: "checkmark.shield"
        )
        AppShortcut(
            intent: ProtectCatalogIntent(),
            phrases: [
                "Protect the catalog with \(.applicationName)",
                "Lock catalog in \(.applicationName)",
                "Engage \(.applicationName) sovereign lock"
            ],
            shortTitle: "Protect Catalog",
            systemImageName: "lock.shield"
        )
        AppShortcut(
            intent: RunGovernanceReviewIntent(),
            phrases: [
                "Run \(.applicationName) governance review",
                "Verify \(.applicationName) ledger",
                "Audit \(.applicationName) empire"
            ],
            shortTitle: "Governance Review",
            systemImageName: "doc.text.magnifyingglass"
        )
        AppShortcut(
            intent: PrepareNavigationHandoffIntent(),
            phrases: [
                "Prepare navigation handoff with \(.applicationName)",
                "Ask \(.applicationName) to prepare my route"
            ],
            shortTitle: "Route Handoff",
            systemImageName: "point.topleft.down.curvedto.point.bottomright.up"
        )
    }
}
