import Foundation

/// MIDI Machine Control (MMC) Commands
/// These are standard commands defined in the MIDI specification for controlling transport
enum MMCCommand: UInt8 {
    case stop = 0x01
    case play = 0x02
    case deferredPlay = 0x03
    case fastForward = 0x04
    case rewind = 0x05
    case recordStrobe = 0x06
    case recordExit = 0x07
    case recordPause = 0x08
    case pause = 0x09
    case eject = 0x0A
    case chase = 0x0B
    case commandErrorReset = 0x0C
    case mmcReset = 0x0D

    var description: String {
        switch self {
        case .stop: return "Stop"
        case .play: return "Play"
        case .deferredPlay: return "Deferred Play"
        case .fastForward: return "Fast Forward"
        case .rewind: return "Rewind"
        case .recordStrobe: return "Record Strobe (Punch In)"
        case .recordExit: return "Record Exit (Punch Out)"
        case .recordPause: return "Record Pause"
        case .pause: return "Pause"
        case .eject: return "Eject"
        case .chase: return "Chase"
        case .commandErrorReset: return "Command Error Reset"
        case .mmcReset: return "MMC Reset"
        }
    }
}

/// Common MIDI note names for reference
enum MIDINoteName: String, CaseIterable {
    case C = "C"
    case CSharp = "C#"
    case D = "D"
    case DSharp = "D#"
    case E = "E"
    case F = "F"
    case FSharp = "F#"
    case G = "G"
    case GSharp = "G#"
    case A = "A"
    case ASharp = "A#"
    case B = "B"

    /// Convert note name and octave to MIDI note number
    /// Middle C (C4) = 60
    static func toMIDINote(name: String, octave: Int) -> Int? {
        let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        guard let index = noteNames.firstIndex(of: name.uppercased()) else {
            return nil
        }
        let note = (octave + 1) * 12 + index
        guard note >= 0 && note <= 127 else {
            return nil
        }
        return note
    }

    /// Convert MIDI note number to note name and octave
    static func fromMIDINote(_ note: Int) -> (name: String, octave: Int)? {
        guard note >= 0 && note <= 127 else {
            return nil
        }
        let noteNames = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"]
        let noteName = noteNames[note % 12]
        let octave = (note / 12) - 1
        return (noteName, octave)
    }
}

/// Common chord types with their intervals
enum ChordType: String, CaseIterable {
    case major = "major"
    case minor = "minor"
    case diminished = "diminished"
    case augmented = "augmented"
    case major7 = "major7"
    case minor7 = "minor7"
    case dominant7 = "dominant7"
    case sus2 = "sus2"
    case sus4 = "sus4"

    var intervals: [Int] {
        switch self {
        case .major: return [0, 4, 7]
        case .minor: return [0, 3, 7]
        case .diminished: return [0, 3, 6]
        case .augmented: return [0, 4, 8]
        case .major7: return [0, 4, 7, 11]
        case .minor7: return [0, 3, 7, 10]
        case .dominant7: return [0, 4, 7, 10]
        case .sus2: return [0, 2, 7]
        case .sus4: return [0, 5, 7]
        }
    }

    /// Build chord notes from root note
    func buildChord(root: Int) -> [Int] {
        intervals.map { root + $0 }.filter { $0 <= 127 }
    }
}
