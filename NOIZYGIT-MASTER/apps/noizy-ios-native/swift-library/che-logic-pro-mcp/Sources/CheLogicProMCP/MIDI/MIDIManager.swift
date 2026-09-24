import CoreMIDI
import Foundation

/// Actor that manages MIDI operations using CoreMIDI
/// Creates a virtual MIDI source that appears in Logic Pro as an input device
actor MIDIManager {
    private var client: MIDIClientRef = 0
    private var outputPort: MIDIPortRef = 0
    private var virtualSource: MIDIEndpointRef = 0
    private var isInitialized = false
    private var portName: String = ""

    static let shared = MIDIManager()

    private init() {}

    // MARK: - Setup and Teardown

    /// Initialize MIDI and create a virtual source
    func setup(name: String = "Logic Pro MCP") throws -> String {
        if isInitialized {
            return "MIDI already initialized as '\(portName)'"
        }

        portName = name

        // Create MIDI client
        var status = MIDIClientCreateWithBlock(name as CFString, &client) { notification in
            // Handle MIDI setup changes if needed
            print("MIDI notification: \(notification.pointee.messageID)")
        }
        guard status == noErr else {
            throw MIDIError.clientCreationFailed(status)
        }

        // Create output port
        status = MIDIOutputPortCreate(client, "Output" as CFString, &outputPort)
        guard status == noErr else {
            throw MIDIError.portCreationFailed(status)
        }

        // Create virtual source (this appears in Logic Pro as an input)
        status = MIDISourceCreate(client, "\(name) Out" as CFString, &virtualSource)
        guard status == noErr else {
            throw MIDIError.virtualSourceCreationFailed(status)
        }

        isInitialized = true
        return "MIDI initialized. Virtual port '\(name) Out' created. Select it in Logic Pro's MIDI preferences."
    }

    /// Dispose of MIDI resources
    func dispose() {
        if virtualSource != 0 {
            MIDIEndpointDispose(virtualSource)
            virtualSource = 0
        }
        if client != 0 {
            MIDIClientDispose(client)
            client = 0
        }
        isInitialized = false
        portName = ""
    }

    /// Check if MIDI is initialized
    func isReady() -> Bool {
        return isInitialized
    }

    // MARK: - Note Messages

    /// Send Note On message
    func sendNoteOn(channel: Int, note: Int, velocity: Int) throws -> String {
        try validateMIDIParams(channel: channel, note: note, velocity: velocity)
        guard isInitialized else { throw MIDIError.notInitialized }

        let channelByte = UInt8(channel - 1) & 0x0F  // Convert 1-16 to 0-15
        var packet = MIDIPacket()
        packet.timeStamp = mach_absolute_time()
        packet.length = 3
        packet.data.0 = 0x90 | channelByte  // Note On
        packet.data.1 = UInt8(note) & 0x7F
        packet.data.2 = UInt8(velocity) & 0x7F

        var packetList = MIDIPacketList(numPackets: 1, packet: packet)
        let status = MIDIReceived(virtualSource, &packetList)
        guard status == noErr else {
            throw MIDIError.sendFailed(status)
        }

        return "Note On: channel=\(channel), note=\(note), velocity=\(velocity)"
    }

    /// Send Note Off message
    func sendNoteOff(channel: Int, note: Int) throws -> String {
        try validateChannel(channel)
        try validateNote(note)
        guard isInitialized else { throw MIDIError.notInitialized }

        let channelByte = UInt8(channel - 1) & 0x0F
        var packet = MIDIPacket()
        packet.timeStamp = mach_absolute_time()
        packet.length = 3
        packet.data.0 = 0x80 | channelByte  // Note Off
        packet.data.1 = UInt8(note) & 0x7F
        packet.data.2 = 0

        var packetList = MIDIPacketList(numPackets: 1, packet: packet)
        let status = MIDIReceived(virtualSource, &packetList)
        guard status == noErr else {
            throw MIDIError.sendFailed(status)
        }

        return "Note Off: channel=\(channel), note=\(note)"
    }

    /// Send a note with duration (Note On followed by Note Off)
    func sendNote(channel: Int, note: Int, velocity: Int, durationMs: Int) async throws -> String {
        _ = try sendNoteOn(channel: channel, note: note, velocity: velocity)
        try await Task.sleep(nanoseconds: UInt64(durationMs) * 1_000_000)
        _ = try sendNoteOff(channel: channel, note: note)
        return "Note sent: channel=\(channel), note=\(note), velocity=\(velocity), duration=\(durationMs)ms"
    }

    /// Send a chord (multiple notes simultaneously)
    func sendChord(channel: Int, notes: [Int], velocity: Int, durationMs: Int?) async throws -> String {
        try validateChannel(channel)
        try validateVelocity(velocity)
        for note in notes {
            try validateNote(note)
        }
        guard isInitialized else { throw MIDIError.notInitialized }

        // Send all Note On messages
        for note in notes {
            _ = try sendNoteOn(channel: channel, note: note, velocity: velocity)
        }

        // If duration specified, wait and send Note Off
        if let duration = durationMs {
            try await Task.sleep(nanoseconds: UInt64(duration) * 1_000_000)
            for note in notes {
                _ = try sendNoteOff(channel: channel, note: note)
            }
            return "Chord sent: notes=\(notes), velocity=\(velocity), duration=\(duration)ms"
        }

        return "Chord On: notes=\(notes), velocity=\(velocity)"
    }

    // MARK: - Control Change

    /// Send Control Change message
    func sendControlChange(channel: Int, controller: Int, value: Int) throws -> String {
        try validateChannel(channel)
        try validateController(controller)
        try validateValue(value)
        guard isInitialized else { throw MIDIError.notInitialized }

        let channelByte = UInt8(channel - 1) & 0x0F
        var packet = MIDIPacket()
        packet.timeStamp = mach_absolute_time()
        packet.length = 3
        packet.data.0 = 0xB0 | channelByte  // Control Change
        packet.data.1 = UInt8(controller) & 0x7F
        packet.data.2 = UInt8(value) & 0x7F

        var packetList = MIDIPacketList(numPackets: 1, packet: packet)
        let status = MIDIReceived(virtualSource, &packetList)
        guard status == noErr else {
            throw MIDIError.sendFailed(status)
        }

        return "CC sent: channel=\(channel), controller=\(controller), value=\(value)"
    }

    // MARK: - Program Change

    /// Send Program Change message
    func sendProgramChange(channel: Int, program: Int) throws -> String {
        try validateChannel(channel)
        guard program >= 0 && program <= 127 else {
            throw MIDIError.invalidValue(program)
        }
        guard isInitialized else { throw MIDIError.notInitialized }

        let channelByte = UInt8(channel - 1) & 0x0F
        var packet = MIDIPacket()
        packet.timeStamp = mach_absolute_time()
        packet.length = 2
        packet.data.0 = 0xC0 | channelByte  // Program Change
        packet.data.1 = UInt8(program) & 0x7F

        var packetList = MIDIPacketList(numPackets: 1, packet: packet)
        let status = MIDIReceived(virtualSource, &packetList)
        guard status == noErr else {
            throw MIDIError.sendFailed(status)
        }

        return "Program Change sent: channel=\(channel), program=\(program)"
    }

    // MARK: - Pitch Bend

    /// Send Pitch Bend message
    /// value: 0-16383, center = 8192
    func sendPitchBend(channel: Int, value: Int) throws -> String {
        try validateChannel(channel)
        guard value >= 0 && value <= 16383 else {
            throw MIDIError.invalidValue(value)
        }
        guard isInitialized else { throw MIDIError.notInitialized }

        let channelByte = UInt8(channel - 1) & 0x0F
        let lsb = UInt8(value & 0x7F)
        let msb = UInt8((value >> 7) & 0x7F)

        var packet = MIDIPacket()
        packet.timeStamp = mach_absolute_time()
        packet.length = 3
        packet.data.0 = 0xE0 | channelByte  // Pitch Bend
        packet.data.1 = lsb
        packet.data.2 = msb

        var packetList = MIDIPacketList(numPackets: 1, packet: packet)
        let status = MIDIReceived(virtualSource, &packetList)
        guard status == noErr else {
            throw MIDIError.sendFailed(status)
        }

        return "Pitch Bend sent: channel=\(channel), value=\(value)"
    }

    // MARK: - MMC (MIDI Machine Control)

    /// Send MMC command
    func sendMMCCommand(_ command: MMCCommand, deviceId: UInt8 = 0x7F) throws -> String {
        guard isInitialized else { throw MIDIError.notInitialized }

        // MMC uses SysEx: F0 7F <device_id> 06 <command> F7
        var packet = MIDIPacket()
        packet.timeStamp = mach_absolute_time()
        packet.length = 6
        packet.data.0 = 0xF0  // SysEx start
        packet.data.1 = 0x7F  // Universal Real Time
        packet.data.2 = deviceId  // Device ID (0x7F = all devices)
        packet.data.3 = 0x06  // MMC Command
        packet.data.4 = command.rawValue
        packet.data.5 = 0xF7  // SysEx end

        var packetList = MIDIPacketList(numPackets: 1, packet: packet)
        let status = MIDIReceived(virtualSource, &packetList)
        guard status == noErr else {
            throw MIDIError.sendFailed(status)
        }

        return "MMC \(command.description) sent"
    }

    // MARK: - List Ports

    /// List all available MIDI ports
    func listPorts() -> [[String: Any]] {
        var ports: [[String: Any]] = []

        // List sources (inputs)
        let sourceCount = MIDIGetNumberOfSources()
        for i in 0..<sourceCount {
            let source = MIDIGetSource(i)
            var name: Unmanaged<CFString>?
            MIDIObjectGetStringProperty(source, kMIDIPropertyName, &name)
            let portName = (name?.takeRetainedValue() as String?) ?? "Unknown"
            ports.append([
                "type": "source",
                "name": portName,
                "index": i
            ])
        }

        // List destinations (outputs)
        let destCount = MIDIGetNumberOfDestinations()
        for i in 0..<destCount {
            let dest = MIDIGetDestination(i)
            var name: Unmanaged<CFString>?
            MIDIObjectGetStringProperty(dest, kMIDIPropertyName, &name)
            let portName = (name?.takeRetainedValue() as String?) ?? "Unknown"
            ports.append([
                "type": "destination",
                "name": portName,
                "index": i
            ])
        }

        // Add our virtual source if initialized
        if isInitialized {
            ports.append([
                "type": "virtual_source",
                "name": "\(self.portName) Out",
                "note": "This is the MCP virtual output - select this in Logic Pro"
            ])
        }

        return ports
    }

    // MARK: - Validation Helpers

    private func validateMIDIParams(channel: Int, note: Int, velocity: Int) throws {
        try validateChannel(channel)
        try validateNote(note)
        try validateVelocity(velocity)
    }

    private func validateChannel(_ channel: Int) throws {
        guard channel >= 1 && channel <= 16 else {
            throw MIDIError.invalidChannel(channel)
        }
    }

    private func validateNote(_ note: Int) throws {
        guard note >= 0 && note <= 127 else {
            throw MIDIError.invalidNote(note)
        }
    }

    private func validateVelocity(_ velocity: Int) throws {
        guard velocity >= 0 && velocity <= 127 else {
            throw MIDIError.invalidVelocity(velocity)
        }
    }

    private func validateController(_ controller: Int) throws {
        guard controller >= 0 && controller <= 127 else {
            throw MIDIError.invalidController(controller)
        }
    }

    private func validateValue(_ value: Int) throws {
        guard value >= 0 && value <= 127 else {
            throw MIDIError.invalidValue(value)
        }
    }
}
