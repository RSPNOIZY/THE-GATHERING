import Foundation
@preconcurrency import ScriptingBridge

public final class ScriptingBridgeProbe: @unchecked Sendable {
    private let sequencer: EventSequencer

    public init(sequencer: EventSequencer) {
        self.sequencer = sequencer
    }

    public func frontmostSnapshotEvent() async -> BridgeEvent {
        let sequence = await sequencer.next()
        let systemEvents = SBApplication(bundleIdentifier: "com.apple.SystemEvents")
        let systemEventsRunning = systemEvents?.isRunning ?? false
        let script = """
        tell application "System Events"
            set frontApp to first application process whose frontmost is true
            set appName to name of frontApp
            set bundleId to bundle identifier of frontApp
            set winTitle to ""
            try
                set winTitle to name of window 1 of frontApp
            end try
            return appName & tab & bundleId & tab & winTitle
        end tell
        """

        var errorInfo: NSDictionary?
        let descriptor = NSAppleScript(source: script)?.executeAndReturnError(&errorInfo)
        var payload: [String: JSONValue] = [
            "systemEventsRunning": .bool(systemEventsRunning)
        ]
        var applicationName: String?
        var bundleIdentifier: String?
        var windowTitle: String?

        if let value = descriptor?.stringValue {
            let parts = value.components(separatedBy: "\t")
            if parts.indices.contains(0) { applicationName = parts[0] }
            if parts.indices.contains(1) { bundleIdentifier = parts[1] }
            if parts.indices.contains(2) { windowTitle = parts[2] }
            payload["frontmostWindowTitle"] = .optional(windowTitle)
        } else if let errorInfo {
            payload["error"] = .string(String(describing: errorInfo))
        } else {
            payload["error"] = .string("System Events returned no descriptor.")
        }

        return BridgeEvent(
            sequence: sequence,
            source: "scripting-bridge",
            name: "frontmost-application-snapshot",
            bundleIdentifier: bundleIdentifier,
            applicationName: applicationName,
            elementRole: "application",
            elementTitle: windowTitle,
            payload: payload
        )
    }
}
