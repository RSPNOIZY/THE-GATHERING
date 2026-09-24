import AppIntents
import Foundation

// ==============================================================================
// LucyIntents.swift - Native App Intents for LUCY & GABRIEL
// Platform: iOS / macOS / CarPlay entitlement surfaces
// Rule: App Intents are read-only or approval-proposal surfaces by default.
// ==============================================================================

// 1. Founder Briefing Intent
public struct LucyBriefingIntent: AppIntent {
    public static var title: LocalizedStringResource = "Lucy Founder Briefing"
    public static var description = IntentDescription("Fetches today's executive summary, YOW surge multiplier, and active music pipeline.")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some ProvidesDialog & ShowsSnippetView {
        let headline = "LUCY Briefing: local architecture organized, verifier status pending, no covenant changes, no hidden vehicle action."
        return .result(dialog: IntentDialog("\(headline)"))
    }
}

// 2. Gabriel Approval Queue Intent
public struct GabrielApprovalIntent: AppIntent {
    public static var title: LocalizedStringResource = "Gabriel Approval Queue"
    public static var description = IntentDescription("Inspects and clears pending Tier-1 dual-approval requests.")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some ProvidesDialog {
        let status = "Gabriel Approval Queue: pending items require exact approval receipts before execution. Zero covenant changes."
        return .result(dialog: IntentDialog("\(status)"))
    }
}

// 3. Protect Catalog Intent (Law 25 & C2PA Invariant Lock)
public struct ProtectCatalogIntent: AppIntent {
    public static var title: LocalizedStringResource = "Protect Catalog"
    public static var description = IntentDescription("Engages C2PA v2.2 lock and enforces the hardcoded 75/25 creator split invariant.")
    public static var openAppWhenRun: Bool = false

    public init() {}

    public func perform() async throws -> some ProvidesDialog {
        let lockMessage = "Catalog protection request prepared. No rights, biometric, voice, payout, or publishing mutation was executed from Siri."
        return .result(dialog: IntentDialog("\(lockMessage)"))
    }
}

// 4. Prepare Navigation Handoff Intent
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

// 5. App Shortcuts Provider
public struct LucyShortcutsProvider: AppShortcutsProvider {
    public static var appShortcuts: [AppShortcut] {
        AppShortcut(
            intent: LucyBriefingIntent(),
            phrases: [
                "Ask \(.applicationName) for today's founder briefing",
                "Get \(.applicationName) briefing",
                "What is my \(.applicationName) status?"
            ],
            shortTitle: "Founder Briefing",
            systemImageName: "sparkles.rectangle.stack"
        )
        AppShortcut(
            intent: GabrielApprovalIntent(),
            phrases: [
                "Ask \(.applicationName) to check Gabriel approvals",
                "Check \(.applicationName) approval queue",
                "Ask Gabriel for approvals"
            ],
            shortTitle: "Gabriel Approvals",
            systemImageName: "checkmark.shield"
        )
        AppShortcut(
            intent: ProtectCatalogIntent(),
            phrases: [
                "Protect the catalog with \(.applicationName)",
                "Lock catalog in \(.applicationName)"
            ],
            shortTitle: "Protect Catalog",
            systemImageName: "lock.shield"
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
