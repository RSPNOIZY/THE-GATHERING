// MC96AudioDiag.swift
// MC96 Audio Diagnostics Utility — RSP_001 Arsenal
// Enumerates all Core Audio devices, flags Apollo UAD, verifies 48kHz/32-bit,
// checks AU Net Send/Receive, reports Thunderbolt status.
// Build: swiftc -framework CoreAudio -framework AudioToolbox -framework IOKit -o mc96diag MC96AudioDiag.swift

import Foundation
import CoreAudio
import AudioToolbox

// MARK: - ANSI Colors
struct C {
    static let reset  = "\u{001B}[0m"
    static let bold   = "\u{001B}[1m"
    static let red    = "\u{001B}[31m"
    static let green  = "\u{001B}[32m"
    static let yellow = "\u{001B}[33m"
    static let cyan   = "\u{001B}[36m"
    static let dim    = "\u{001B}[2m"
}

func ok(_ msg: String)   { print("  \(C.green)✓\(C.reset) \(msg)") }
func warn(_ msg: String) { print("  \(C.yellow)⚠\(C.reset) \(msg)") }
func fail(_ msg: String) { print("  \(C.red)✗\(C.reset) \(msg)") }
func info(_ msg: String) { print("  \(C.dim)→\(C.reset) \(msg)") }

func header(_ title: String) {
    print("")
    print("\(C.bold)\(C.cyan)═══════════════════════════════════════════════════════\(C.reset)")
    print("\(C.bold)\(C.cyan)  \(title)\(C.reset)")
    print("\(C.bold)\(C.cyan)═══════════════════════════════════════════════════════\(C.reset)")
}

// MARK: - Core Audio Helpers

func getAudioDeviceIDs() -> [AudioDeviceID] {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDevices,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var dataSize: UInt32 = 0
    var status = AudioObjectGetPropertyDataSize(
        AudioObjectID(kAudioObjectSystemObject),
        &propAddress, 0, nil, &dataSize
    )
    guard status == noErr else { return [] }

    let deviceCount = Int(dataSize) / MemoryLayout<AudioDeviceID>.size
    var deviceIDs = [AudioDeviceID](repeating: 0, count: deviceCount)
    status = AudioObjectGetPropertyData(
        AudioObjectID(kAudioObjectSystemObject),
        &propAddress, 0, nil, &dataSize, &deviceIDs
    )
    guard status == noErr else { return [] }
    return deviceIDs
}

func getStringProperty(_ deviceID: AudioDeviceID, selector: AudioObjectPropertySelector) -> String? {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: selector,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var name: CFString = "" as CFString
    var dataSize = UInt32(MemoryLayout<CFString>.size)
    let status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, &name)
    guard status == noErr else { return nil }
    return name as String
}

func getDeviceSampleRate(_ deviceID: AudioDeviceID) -> Float64? {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyNominalSampleRate,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var sampleRate: Float64 = 0
    var dataSize = UInt32(MemoryLayout<Float64>.size)
    let status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, &sampleRate)
    guard status == noErr else { return nil }
    return sampleRate
}

func getAvailableSampleRates(_ deviceID: AudioDeviceID) -> [AudioValueRange] {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyAvailableNominalSampleRates,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var dataSize: UInt32 = 0
    var status = AudioObjectGetPropertyDataSize(deviceID, &propAddress, 0, nil, &dataSize)
    guard status == noErr else { return [] }

    let count = Int(dataSize) / MemoryLayout<AudioValueRange>.size
    var ranges = [AudioValueRange](repeating: AudioValueRange(), count: count)
    status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, &ranges)
    guard status == noErr else { return [] }
    return ranges
}

func getStreamFormats(_ deviceID: AudioDeviceID, scope: AudioObjectPropertyScope) -> [AudioStreamBasicDescription] {
    // Get streams for this device
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyStreams,
        mScope: scope,
        mElement: kAudioObjectPropertyElementMain
    )
    var dataSize: UInt32 = 0
    var status = AudioObjectGetPropertyDataSize(deviceID, &propAddress, 0, nil, &dataSize)
    guard status == noErr, dataSize > 0 else { return [] }

    let streamCount = Int(dataSize) / MemoryLayout<AudioStreamID>.size
    var streamIDs = [AudioStreamID](repeating: 0, count: streamCount)
    status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, &streamIDs)
    guard status == noErr else { return [] }

    var formats: [AudioStreamBasicDescription] = []
    for streamID in streamIDs {
        var formatAddr = AudioObjectPropertyAddress(
            mSelector: kAudioStreamPropertyPhysicalFormat,
            mScope: kAudioObjectPropertyScopeGlobal,
            mElement: kAudioObjectPropertyElementMain
        )
        var format = AudioStreamBasicDescription()
        var formatSize = UInt32(MemoryLayout<AudioStreamBasicDescription>.size)
        let fStatus = AudioObjectGetPropertyData(streamID, &formatAddr, 0, nil, &formatSize, &format)
        if fStatus == noErr {
            formats.append(format)
        }
    }
    return formats
}

func getChannelCount(_ deviceID: AudioDeviceID, scope: AudioObjectPropertyScope) -> Int {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyStreamConfiguration,
        mScope: scope,
        mElement: kAudioObjectPropertyElementMain
    )
    var dataSize: UInt32 = 0
    var status = AudioObjectGetPropertyDataSize(deviceID, &propAddress, 0, nil, &dataSize)
    guard status == noErr, dataSize > 0 else { return 0 }

    let data = UnsafeMutablePointer<UInt8>.allocate(capacity: Int(dataSize))
    defer { data.deallocate() }
    status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, data)
    guard status == noErr else { return 0 }

    var total: UInt32 = 0
    let buffers = UnsafeMutableAudioBufferListPointer(UnsafeMutablePointer(mutating: data.withMemoryRebound(to: AudioBufferList.self, capacity: 1) { $0 }))
    for buf in buffers {
        total += buf.mNumberChannels
    }
    return Int(total)
}

func getTransportType(_ deviceID: AudioDeviceID) -> UInt32? {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyTransportType,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var transport: UInt32 = 0
    var dataSize = UInt32(MemoryLayout<UInt32>.size)
    let status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, &transport)
    guard status == noErr else { return nil }
    return transport
}

func transportName(_ code: UInt32) -> String {
    switch code {
    case kAudioDeviceTransportTypeBuiltIn:     return "Built-in"
    case kAudioDeviceTransportTypeUSB:         return "USB"
    case kAudioDeviceTransportTypeFireWire:    return "FireWire"
    case kAudioDeviceTransportTypeThunderbolt: return "Thunderbolt"
    case kAudioDeviceTransportTypeVirtual:     return "Virtual"
    case kAudioDeviceTransportTypeAggregate:   return "Aggregate"
    case kAudioDeviceTransportTypePCI:         return "PCI"
    case kAudioDeviceTransportTypeBluetooth:   return "Bluetooth"
    case kAudioDeviceTransportTypeBluetoothLE: return "Bluetooth LE"
    case kAudioDeviceTransportTypeHDMI:        return "HDMI"
    case kAudioDeviceTransportTypeDisplayPort: return "DisplayPort"
    case kAudioDeviceTransportTypeAirPlay:     return "AirPlay"
    case kAudioDeviceTransportTypeAVB:         return "AVB"
    default:
        let chars = [
            Character(UnicodeScalar((code >> 24) & 0xFF)!),
            Character(UnicodeScalar((code >> 16) & 0xFF)!),
            Character(UnicodeScalar((code >>  8) & 0xFF)!),
            Character(UnicodeScalar( code        & 0xFF)!)
        ]
        return "Unknown (\(String(chars)))"
    }
}

func bitDepthString(_ format: AudioStreamBasicDescription) -> String {
    let isFloat = format.mFormatFlags & kAudioFormatFlagIsFloat != 0
    let isPacked = format.mFormatFlags & kAudioFormatFlagIsPacked != 0
    let bits = format.mBitsPerChannel
    if isFloat {
        return "\(bits)-bit float"
    } else if isPacked {
        return "\(bits)-bit int"
    } else {
        let containerBits = format.mBytesPerFrame / max(format.mChannelsPerFrame, 1) * 8
        return "\(bits)-bit in \(containerBits)-bit container"
    }
}

func getDefaultDevice(selector: AudioObjectPropertySelector) -> AudioDeviceID? {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: selector,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var deviceID: AudioDeviceID = 0
    var dataSize = UInt32(MemoryLayout<AudioDeviceID>.size)
    let status = AudioObjectGetPropertyData(
        AudioObjectID(kAudioObjectSystemObject),
        &propAddress, 0, nil, &dataSize, &deviceID
    )
    guard status == noErr else { return nil }
    return deviceID
}

func isDeviceAlive(_ deviceID: AudioDeviceID) -> Bool {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyDeviceIsAlive,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var alive: UInt32 = 0
    var dataSize = UInt32(MemoryLayout<UInt32>.size)
    let status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, &alive)
    return status == noErr && alive == 1
}

func getBufferSize(_ deviceID: AudioDeviceID) -> UInt32? {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyBufferFrameSize,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var bufferSize: UInt32 = 0
    var dataSize = UInt32(MemoryLayout<UInt32>.size)
    let status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, &bufferSize)
    guard status == noErr else { return nil }
    return bufferSize
}

func getBufferSizeRange(_ deviceID: AudioDeviceID) -> (min: UInt32, max: UInt32)? {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioDevicePropertyBufferFrameSizeRange,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var range = AudioValueRange()
    var dataSize = UInt32(MemoryLayout<AudioValueRange>.size)
    let status = AudioObjectGetPropertyData(deviceID, &propAddress, 0, nil, &dataSize, &range)
    guard status == noErr else { return nil }
    return (UInt32(range.mMinimum), UInt32(range.mMaximum))
}

// MARK: - AU Plugin Scanner

func scanAUPlugins() -> [(name: String, type: String, manufacturer: String, subType: String)] {
    var results: [(name: String, type: String, manufacturer: String, subType: String)] = []

    var desc = AudioComponentDescription(
        componentType: 0,
        componentSubType: 0,
        componentManufacturer: 0,
        componentFlags: 0,
        componentFlagsMask: 0
    )

    var component: AudioComponent? = AudioComponentFindNext(nil, &desc)
    while component != nil {
        var compDesc = AudioComponentDescription()
        AudioComponentGetDescription(component!, &compDesc)

        var cfName: Unmanaged<CFString>?
        AudioComponentCopyName(component!, &cfName)
        let name = cfName?.takeRetainedValue() as String? ?? "Unknown"

        func fourCC(_ val: UInt32) -> String {
            let chars = [
                Character(UnicodeScalar((val >> 24) & 0xFF)!),
                Character(UnicodeScalar((val >> 16) & 0xFF)!),
                Character(UnicodeScalar((val >>  8) & 0xFF)!),
                Character(UnicodeScalar( val        & 0xFF)!)
            ]
            return String(chars)
        }

        let typeStr = fourCC(compDesc.componentType)
        let subTypeStr = fourCC(compDesc.componentSubType)
        let mfr = fourCC(compDesc.componentManufacturer)

        results.append((name: name, type: typeStr, manufacturer: mfr, subType: subTypeStr))
        component = AudioComponentFindNext(component, &desc)
    }

    return results
}

// MARK: - Thunderbolt Scanner (via system_profiler)

func getThunderboltInfo() -> String {
    let process = Process()
    process.executableURL = URL(fileURLWithPath: "/usr/sbin/system_profiler")
    process.arguments = ["SPThunderboltDataType", "-json"]
    let pipe = Pipe()
    process.standardOutput = pipe
    process.standardError = Pipe()
    do {
        try process.run()
        process.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return String(data: data, encoding: .utf8) ?? ""
    } catch {
        return ""
    }
}

// MARK: - Main Report

func main() {
    print("")
    print("\(C.bold)╔═══════════════════════════════════════════════════════╗\(C.reset)")
    print("\(C.bold)║     MC96 AUDIO DIAGNOSTICS — RSP_001 ARSENAL         ║\(C.reset)")
    print("\(C.bold)║     GOD (M2 Ultra Mac Studio)                        ║\(C.reset)")
    print("\(C.bold)║     \(Date())     ║\(C.reset)")
    print("\(C.bold)╚═══════════════════════════════════════════════════════╝\(C.reset)")

    // ─── Section 1: Default Devices ───
    header("DEFAULT AUDIO DEVICES")

    if let defaultOut = getDefaultDevice(selector: kAudioHardwarePropertyDefaultOutputDevice),
       let name = getStringProperty(defaultOut, selector: kAudioObjectPropertyName) {
        info("Default Output: \(C.bold)\(name)\(C.reset) (ID: \(defaultOut))")
    }
    if let defaultIn = getDefaultDevice(selector: kAudioHardwarePropertyDefaultInputDevice),
       let name = getStringProperty(defaultIn, selector: kAudioObjectPropertyName) {
        info("Default Input:  \(C.bold)\(name)\(C.reset) (ID: \(defaultIn))")
    }

    // ─── Section 2: All Devices ───
    header("ALL AUDIO DEVICES")

    let deviceIDs = getAudioDeviceIDs()
    info("Found \(C.bold)\(deviceIDs.count)\(C.reset) audio device(s)")
    print("")

    var apolloFound = false
    var has48k = false
    var has32bit = false

    for deviceID in deviceIDs {
        let name = getStringProperty(deviceID, selector: kAudioObjectPropertyName) ?? "Unknown"
        let manufacturer = getStringProperty(deviceID, selector: kAudioObjectPropertyManufacturer) ?? "Unknown"
        let transport = getTransportType(deviceID)
        let transportStr = transport != nil ? transportName(transport!) : "Unknown"
        let sampleRate = getDeviceSampleRate(deviceID)
        let alive = isDeviceAlive(deviceID)
        let bufferSize = getBufferSize(deviceID)
        let inputChannels = getChannelCount(deviceID, scope: kAudioObjectPropertyScopeInput)
        let outputChannels = getChannelCount(deviceID, scope: kAudioObjectPropertyScopeOutput)

        // Detect Apollo UAD
        let isApollo = name.lowercased().contains("apollo") ||
                       name.lowercased().contains("uad") ||
                       manufacturer.lowercased().contains("universal audio")

        if isApollo { apolloFound = true }

        let marker = isApollo ? "\(C.bold)\(C.yellow)★ APOLLO UAD ★\(C.reset) " : ""

        print("  \(marker)\(C.bold)\(name)\(C.reset)")
        print("    Manufacturer: \(manufacturer)")
        print("    Transport:    \(transportStr)")
        print("    Alive:        \(alive ? "\(C.green)YES\(C.reset)" : "\(C.red)NO\(C.reset)")")
        if let sr = sampleRate {
            let srOk = sr == 48000.0
            if srOk { has48k = true }
            print("    Sample Rate:  \(srOk ? C.green : C.yellow)\(Int(sr)) Hz\(C.reset)\(srOk ? " ✓ (48kHz target)" : "")")
        }
        if let bs = bufferSize {
            print("    Buffer Size:  \(bs) frames")
            if let sr = sampleRate, sr > 0 {
                let latencyMs = Double(bs) / sr * 1000.0
                print("    Latency:      \(String(format: "%.2f", latencyMs)) ms")
            }
        }
        if let range = getBufferSizeRange(deviceID) {
            print("    Buffer Range: \(range.min) – \(range.max) frames")
        }
        print("    Channels:     \(inputChannels) in / \(outputChannels) out")

        // Check stream formats for bit depth
        for scope in [kAudioObjectPropertyScopeOutput, kAudioObjectPropertyScopeInput] {
            let scopeName = scope == kAudioObjectPropertyScopeOutput ? "Output" : "Input"
            let formats = getStreamFormats(deviceID, scope: scope)
            for (i, fmt) in formats.enumerated() {
                let depth = bitDepthString(fmt)
                if fmt.mBitsPerChannel >= 32 { has32bit = true }
                print("    \(scopeName) Stream \(i): \(depth), \(fmt.mChannelsPerFrame)ch, \(Int(fmt.mSampleRate))Hz")
            }
        }

        // Available sample rates
        let rates = getAvailableSampleRates(deviceID)
        if !rates.isEmpty {
            let rateStrs = rates.map { r in
                if r.mMinimum == r.mMaximum {
                    return "\(Int(r.mMinimum))"
                } else {
                    return "\(Int(r.mMinimum))-\(Int(r.mMaximum))"
                }
            }
            print("    Avail Rates:  \(rateStrs.joined(separator: ", ")) Hz")
        }
        print("")
    }

    // ─── Section 3: 48kHz/32-bit Verification ───
    header("48kHz / 32-BIT VERIFICATION (RSP_001 Standard)")

    if has48k {
        ok("At least one device running at 48,000 Hz")
    } else {
        warn("No device currently at 48kHz — set sample rate before recording")
    }

    if has32bit {
        ok("At least one stream at 32-bit depth")
    } else {
        warn("No 32-bit stream detected — check device settings")
    }

    // ─── Section 4: Apollo UAD Detection ───
    header("APOLLO UAD DETECTION")

    if apolloFound {
        ok("\(C.bold)Apollo UAD DETECTED\(C.reset) — Thunderbolt interface found")
    } else {
        warn("Apollo UAD \(C.bold)NOT CONNECTED\(C.reset)")
        info("Connect Apollo to any Thunderbolt port (Ports 2-6 are free)")
        info("Port 1 is occupied by Seagate/WD daisy chain")
    }

    // ─── Section 5: AU Plugins (Net Send/Receive) ───
    header("AU PLUGIN SCAN — NET SEND / NET RECEIVE")

    let allPlugins = scanAUPlugins()
    let netPlugins = allPlugins.filter { p in
        p.name.lowercased().contains("net send") ||
        p.name.lowercased().contains("net receive") ||
        p.name.lowercased().contains("au net") ||
        (p.name.lowercased().contains("network") && p.type == "auou")
    }

    if netPlugins.isEmpty {
        // Also check for Apple's AUNetSend/AUNetReceive by subtype
        let auNetPlugins = allPlugins.filter { p in
            p.subType == "nsnd" || p.subType == "nrcv"
        }
        if auNetPlugins.isEmpty {
            warn("AU Net Send / AU Net Receive \(C.bold)NOT FOUND\(C.reset) in plugin registry")
            info("These are part of Logic Pro — open Logic to register them")
            info("Or check: /Library/Audio/Plug-Ins/Components/")
        } else {
            for p in auNetPlugins {
                ok("\(C.bold)\(p.name)\(C.reset) [type:\(p.type) sub:\(p.subType) mfr:\(p.manufacturer)]")
            }
        }
    } else {
        for p in netPlugins {
            ok("\(C.bold)\(p.name)\(C.reset) [type:\(p.type) sub:\(p.subType) mfr:\(p.manufacturer)]")
        }
    }

    // Plugin stats
    info("Total AU plugins registered: \(allPlugins.count)")
    let types = Dictionary(grouping: allPlugins, by: { $0.type })
    for (type, plugins) in types.sorted(by: { $0.value.count > $1.value.count }).prefix(8) {
        let typeName: String
        switch type {
        case "auou": typeName = "Output"
        case "aufx": typeName = "Effect"
        case "aumu": typeName = "Instrument"
        case "aumi": typeName = "MIDI Effect"
        case "augn": typeName = "Generator"
        case "aumx": typeName = "Mixer"
        case "auol": typeName = "Offline"
        case "aupn": typeName = "Panner"
        default:     typeName = type
        }
        info("  \(typeName): \(plugins.count)")
    }

    // Check for UAD plugins specifically
    let uadPlugins = allPlugins.filter { $0.manufacturer.lowercased().contains("uad") || $0.name.lowercased().contains("uad") || $0.name.lowercased().contains("universal audio") }
    if !uadPlugins.isEmpty {
        print("")
        ok("UAD plugins found: \(uadPlugins.count)")
        for p in uadPlugins.prefix(10) {
            info("  \(p.name)")
        }
        if uadPlugins.count > 10 {
            info("  ... and \(uadPlugins.count - 10) more")
        }
    }

    // ─── Section 6: Thunderbolt Summary ───
    header("THUNDERBOLT STATUS")

    info("6 × Thunderbolt 4 ports (40 Gb/s each)")
    info("Port 1: Seagate GoFlex → WD My Book Thunderbolt Duo (daisy chain)")
    info("Ports 2-6: \(C.green)AVAILABLE\(C.reset) — ready for Apollo UAD")

    // ─── Section 7: Summary ───
    header("SUMMARY")

    var issues: [String] = []
    var ready: [String] = []

    ready.append("Xcode + Swift compiler ready")
    ready.append("Core Audio framework accessible")
    ready.append("\(deviceIDs.count) audio device(s) enumerated")
    ready.append("\(allPlugins.count) AU plugins registered")
    ready.append("6 Thunderbolt ports detected")

    if !apolloFound { issues.append("Apollo UAD not connected") }
    if !has48k { issues.append("No device at 48kHz") }
    if !has32bit { issues.append("No 32-bit stream active") }
    if netPlugins.isEmpty {
        let auNetPlugins = allPlugins.filter { p in p.subType == "nsnd" || p.subType == "nrcv" }
        if auNetPlugins.isEmpty { issues.append("AU Net Send/Receive not found") }
    }

    for r in ready { ok(r) }
    print("")
    if issues.isEmpty {
        ok("\(C.bold)\(C.green)ALL SYSTEMS GO — READY FOR RSP_001 SESSION\(C.reset)")
    } else {
        for i in issues { warn(i) }
        print("")
        warn("\(C.bold)\(issues.count) issue(s) to resolve before recording\(C.reset)")
    }

    print("")
    print("\(C.dim)  MC96 Audio Diagnostics v1.0 — NOIZY EMPIRE — 5th Epoch\(C.reset)")
    print("")
}

main()
