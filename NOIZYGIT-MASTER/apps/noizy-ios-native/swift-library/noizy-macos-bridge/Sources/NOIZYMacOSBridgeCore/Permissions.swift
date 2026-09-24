import Foundation
@preconcurrency import ApplicationServices

public struct PermissionStatus: Codable, Sendable, Equatable {
    public var accessibilityTrusted: Bool
    public var accessibilityPrompted: Bool
    public var note: String
}

public enum Permissions {
    public static func snapshot(prompt: Bool) -> PermissionStatus {
        PermissionStatus(
            accessibilityTrusted: accessibilityTrusted(prompt: prompt),
            accessibilityPrompted: prompt,
            note: "Grant Accessibility to the terminal or built binary in System Settings > Privacy & Security > Accessibility."
        )
    }

    public static func accessibilityTrusted(prompt: Bool) -> Bool {
        let key = kAXTrustedCheckOptionPrompt.takeUnretainedValue() as String
        let options = [key: prompt] as CFDictionary
        return AXIsProcessTrustedWithOptions(options)
    }
}
