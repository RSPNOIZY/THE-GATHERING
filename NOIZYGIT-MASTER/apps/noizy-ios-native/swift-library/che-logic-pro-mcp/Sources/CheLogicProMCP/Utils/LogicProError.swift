import Foundation

/// Errors that can occur when controlling Logic Pro
enum LogicProError: LocalizedError {
    case appleScriptError(String)
    case logicProNotRunning
    case logicProNotFound
    case invalidParameter(String)
    case operationFailed(String)
    case permissionDenied(String)

    var errorDescription: String? {
        switch self {
        case .appleScriptError(let message):
            return "AppleScript error: \(message)"
        case .logicProNotRunning:
            return "Logic Pro is not running. Use logic_launch to start it."
        case .logicProNotFound:
            return "Logic Pro is not installed on this system."
        case .invalidParameter(let message):
            return "Invalid parameter: \(message)"
        case .operationFailed(let message):
            return "Operation failed: \(message)"
        case .permissionDenied(let message):
            return "Permission denied: \(message). Please grant Accessibility permission in System Settings > Privacy & Security."
        }
    }
}

/// Errors that can occur with MIDI operations
enum MIDIError: LocalizedError {
    case clientCreationFailed(Int32)
    case portCreationFailed(Int32)
    case virtualSourceCreationFailed(Int32)
    case sendFailed(Int32)
    case notInitialized
    case invalidChannel(Int)
    case invalidNote(Int)
    case invalidVelocity(Int)
    case invalidController(Int)
    case invalidValue(Int)

    var errorDescription: String? {
        switch self {
        case .clientCreationFailed(let status):
            return "Failed to create MIDI client (status: \(status))"
        case .portCreationFailed(let status):
            return "Failed to create MIDI port (status: \(status))"
        case .virtualSourceCreationFailed(let status):
            return "Failed to create virtual MIDI source (status: \(status))"
        case .sendFailed(let status):
            return "Failed to send MIDI message (status: \(status))"
        case .notInitialized:
            return "MIDI Manager not initialized. Call midi_create_virtual_port first."
        case .invalidChannel(let channel):
            return "Invalid MIDI channel: \(channel). Must be 1-16."
        case .invalidNote(let note):
            return "Invalid MIDI note: \(note). Must be 0-127."
        case .invalidVelocity(let velocity):
            return "Invalid MIDI velocity: \(velocity). Must be 0-127."
        case .invalidController(let controller):
            return "Invalid MIDI controller: \(controller). Must be 0-127."
        case .invalidValue(let value):
            return "Invalid MIDI value: \(value). Must be 0-127."
        }
    }
}

/// Errors that can occur with Scripter template operations
enum ScripterError: LocalizedError {
    case templateNotFound(String)
    case cannotDeleteBuiltIn
    case invalidTemplateName(String)
    case saveFailed(String)

    var errorDescription: String? {
        switch self {
        case .templateNotFound(let name):
            return "Scripter template not found: \(name)"
        case .cannotDeleteBuiltIn:
            return "Cannot delete built-in template"
        case .invalidTemplateName(let name):
            return "Invalid template name: \(name). Use alphanumeric characters and underscores only."
        case .saveFailed(let message):
            return "Failed to save template: \(message)"
        }
    }
}
