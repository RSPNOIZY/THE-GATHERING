import Foundation
import AppKit

/// Actor that controls Logic Pro via AppleScript and System Events
/// Uses keyboard shortcuts for most operations since Logic Pro has limited AppleScript support
actor LogicProController {
    private let bundleIdentifier = "com.apple.logic10"
    private let processName = "Logic Pro"

    // MARK: - App Control

    /// Check if Logic Pro is currently running
    func isRunning() -> Bool {
        NSWorkspace.shared.runningApplications.contains {
            $0.bundleIdentifier == bundleIdentifier
        }
    }

    /// Launch Logic Pro
    func launch() async throws -> String {
        if isRunning() {
            return "Logic Pro is already running"
        }

        let script = """
        tell application "Logic Pro" to activate
        delay 2
        return "Logic Pro launched successfully"
        """
        return try runAppleScript(script)
    }

    /// Bring Logic Pro to the front
    func activate() throws -> String {
        guard isRunning() else {
            throw LogicProError.logicProNotRunning
        }

        let script = """
        tell application "Logic Pro" to activate
        return "Logic Pro activated"
        """
        return try runAppleScript(script)
    }

    /// Quit Logic Pro
    func quit() throws -> String {
        guard isRunning() else {
            return "Logic Pro is not running"
        }

        let script = """
        tell application "Logic Pro" to quit
        return "Logic Pro quit"
        """
        return try runAppleScript(script)
    }

    // MARK: - Transport Control

    /// Play/Stop toggle (Space)
    func playStop() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKeyCode(49) // Space
    }

    /// Start playback
    func play() async throws -> String {
        return try await playStop()
    }

    /// Stop playback
    func stop() async throws -> String {
        return try await playStop()
    }

    /// Start recording (R)
    func record() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("r")
    }

    /// Go to beginning (Return)
    func goToBeginning() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKeyCode(36) // Return
    }

    /// Forward (.)
    func forward() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey(".")
    }

    /// Backward (,)
    func backward() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey(",")
    }

    /// Toggle cycle mode (C)
    func toggleCycle() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("c")
    }

    /// Toggle metronome (K)
    func toggleMetronome() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("k")
    }

    // MARK: - Track Management

    /// Create new track (Option+Command+N opens dialog)
    func createTrack(type: String) async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)

        // Open create track dialog
        _ = try pressShortcut(key: "n", modifiers: ["option", "command"])
        try await Task.sleep(nanoseconds: 500_000_000)

        // Select track type based on parameter
        switch type.lowercased() {
        case "midi", "software instrument":
            _ = try pressKey("s") // Software Instrument
        case "audio":
            _ = try pressKey("a") // Audio
        case "drummer":
            _ = try pressKey("d") // Drummer
        default:
            _ = try pressKey("s") // Default to Software Instrument
        }

        try await Task.sleep(nanoseconds: 200_000_000)
        _ = try pressKeyCode(36) // Return to confirm

        return "Created \(type) track"
    }

    /// Toggle solo on selected track (S)
    func soloTrack() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("s")
    }

    /// Toggle mute on selected track (M)
    func muteTrack() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("m")
    }

    /// Arm track for recording (Control+R)
    func armTrack() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "r", modifiers: ["control"])
    }

    /// Delete selected track (Command+Delete)
    func deleteTrack() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(keyCode: 51, modifiers: ["command"]) // Delete key
    }

    // MARK: - View/Window Control

    /// Toggle Mixer view (X)
    func toggleMixer() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("x")
    }

    /// Toggle Piano Roll (P)
    func togglePianoRoll() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("p")
    }

    /// Toggle Automation view (A)
    func toggleAutomation() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("a")
    }

    /// Toggle Editors (E)
    func toggleEditors() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("e")
    }

    /// Toggle Library (Y)
    func toggleLibrary() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("y")
    }

    /// Toggle Inspector (I)
    func toggleInspector() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("i")
    }

    /// Toggle Score Editor (N)
    func toggleScore() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("n")
    }

    /// Zoom in (Command+=)
    func zoomIn() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "=", modifiers: ["command"])
    }

    /// Zoom out (Command+-)
    func zoomOut() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "-", modifiers: ["command"])
    }

    /// Zoom to fit (Z)
    func zoomFit() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("z")
    }

    // MARK: - Editing Commands

    /// Undo (Command+Z)
    func undo() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "z", modifiers: ["command"])
    }

    /// Redo (Command+Shift+Z)
    func redo() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "z", modifiers: ["command", "shift"])
    }

    /// Cut (Command+X)
    func cut() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "x", modifiers: ["command"])
    }

    /// Copy (Command+C)
    func copy() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "c", modifiers: ["command"])
    }

    /// Paste (Command+V)
    func paste() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "v", modifiers: ["command"])
    }

    /// Duplicate region (Command+D)
    func duplicate() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "d", modifiers: ["command"])
    }

    /// Split region at playhead (Command+T)
    func split() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "t", modifiers: ["command"])
    }

    /// Join selected regions (Command+J)
    func join() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "j", modifiers: ["command"])
    }

    /// Quantize selected (Q)
    func quantize() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKey("q")
    }

    /// Select all (Command+A)
    func selectAll() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "a", modifiers: ["command"])
    }

    /// Delete selected (Delete)
    func deleteSelected() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressKeyCode(51) // Delete
    }

    // MARK: - Project Commands

    /// New project (Command+N)
    func newProject() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "n", modifiers: ["command"])
    }

    /// Open project dialog (Command+O)
    func openProject() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "o", modifiers: ["command"])
    }

    /// Save project (Command+S)
    func saveProject() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "s", modifiers: ["command"])
    }

    /// Save As (Command+Shift+S)
    func saveAs() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "s", modifiers: ["command", "shift"])
    }

    /// Open Bounce dialog (Command+B)
    func bounce() async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)
        return try pressShortcut(key: "b", modifiers: ["command"])
    }

    // MARK: - Generic Shortcut

    /// Execute any keyboard shortcut
    func executeShortcut(key: String, modifiers: [String]) async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)

        if modifiers.isEmpty {
            return try pressKey(key)
        } else {
            return try pressShortcut(key: key, modifiers: modifiers)
        }
    }

    /// Execute any keyboard shortcut by key code
    func executeShortcutByCode(keyCode: Int, modifiers: [String]) async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 200_000_000)

        if modifiers.isEmpty {
            return try pressKeyCode(keyCode)
        } else {
            return try pressShortcut(keyCode: keyCode, modifiers: modifiers)
        }
    }

    // MARK: - Screenshot

    /// Take a screenshot of Logic Pro window
    func screenshot(savePath: String?) async throws -> String {
        try ensureRunningAndActivate()
        try await Task.sleep(nanoseconds: 300_000_000)

        let outputPath = savePath ?? "/tmp/logic_pro_screenshot.png"

        let script = """
        tell application "System Events"
            tell process "Logic Pro"
                set frontWindow to front window
                set windowPosition to position of frontWindow
                set windowSize to size of frontWindow
                set x to item 1 of windowPosition
                set y to item 2 of windowPosition
                set w to item 1 of windowSize
                set h to item 2 of windowSize
            end tell
        end tell

        do shell script "screencapture -R" & x & "," & y & "," & w & "," & h & " '\(outputPath)'"
        return "\(outputPath)"
        """

        return try runAppleScript(script)
    }

    // MARK: - Window Info

    /// Get information about Logic Pro windows
    func getWindowInfo() throws -> String {
        guard isRunning() else {
            throw LogicProError.logicProNotRunning
        }

        let script = """
        tell application "System Events"
            tell process "Logic Pro"
                set windowList to {}
                repeat with w in windows
                    set windowInfo to {name of w, position of w, size of w}
                    set end of windowList to windowInfo
                end repeat
                return windowList as text
            end tell
        end tell
        """

        return try runAppleScript(script)
    }

    // MARK: - Private Helpers

    private func ensureRunningAndActivate() throws {
        guard isRunning() else {
            throw LogicProError.logicProNotRunning
        }
        _ = try activate()
    }

    private func pressKey(_ key: String) throws -> String {
        let script = """
        tell application "System Events"
            tell process "\(processName)"
                keystroke "\(key)"
            end tell
        end tell
        return "Key pressed: \(key)"
        """
        return try runAppleScript(script)
    }

    private func pressKeyCode(_ code: Int) throws -> String {
        let script = """
        tell application "System Events"
            tell process "\(processName)"
                key code \(code)
            end tell
        end tell
        return "Key code pressed: \(code)"
        """
        return try runAppleScript(script)
    }

    private func pressShortcut(key: String, modifiers: [String]) throws -> String {
        let modifierClause = buildModifierClause(modifiers)

        let script = """
        tell application "System Events"
            tell process "\(processName)"
                keystroke "\(key)"\(modifierClause)
            end tell
        end tell
        return "Shortcut executed: \(modifiers.joined(separator: "+"))+\(key)"
        """
        return try runAppleScript(script)
    }

    private func pressShortcut(keyCode: Int, modifiers: [String]) throws -> String {
        let modifierClause = buildModifierClause(modifiers)

        let script = """
        tell application "System Events"
            tell process "\(processName)"
                key code \(keyCode)\(modifierClause)
            end tell
        end tell
        return "Shortcut executed: \(modifiers.joined(separator: "+"))+keyCode(\(keyCode))"
        """
        return try runAppleScript(script)
    }

    private func buildModifierClause(_ modifiers: [String]) -> String {
        if modifiers.isEmpty {
            return ""
        }

        let modifierList = modifiers.map { modifier -> String in
            switch modifier.lowercased() {
            case "command", "cmd":
                return "command down"
            case "shift":
                return "shift down"
            case "option", "opt", "alt":
                return "option down"
            case "control", "ctrl":
                return "control down"
            default:
                return "\(modifier) down"
            }
        }.joined(separator: ", ")

        return " using {\(modifierList)}"
    }

    private func runAppleScript(_ source: String) throws -> String {
        var error: NSDictionary?
        let script = NSAppleScript(source: source)

        guard let result = script?.executeAndReturnError(&error) else {
            if let error = error {
                let errorMessage = error[NSAppleScript.errorMessage] as? String ?? "Unknown AppleScript error"
                let errorNumber = error[NSAppleScript.errorNumber] as? Int ?? -1

                // Check for permission errors
                if errorNumber == -1719 || errorNumber == -10004 || errorMessage.contains("not allowed") {
                    throw LogicProError.permissionDenied("System Events access")
                }

                throw LogicProError.appleScriptError(errorMessage)
            }
            throw LogicProError.appleScriptError("Script execution failed")
        }

        return result.stringValue ?? "OK"
    }
}
