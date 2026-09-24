// LogicSessionVerifier.swift
// Logic Pro Session Verifier — RSP_001 Arsenal
// Verifies AU plugin config, confirms AU Net Send/Receive loaded,
// checks sample rate match across all devices, reports buffer/latency.
// Build: swiftc -framework CoreAudio -framework AudioToolbox -o logicverify LogicSessionVerifier.swift

import Foundation
import CoreAudio
import AudioToolbox

// MARK: - Output Helpers
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

// MARK: - Core Audio Queries

func getAudioDeviceIDs() -> [AudioDeviceID] {
    var propAddress = AudioObjectPropertyAddress(
        mSelector: kAudioHardwarePropertyDevices,
        mScope: kAudioObjectPropertyScopeGlobal,
        mElement: kAudioObjectPropertyElementMain
    )
    var dataSize: UInt32 = 0
    guard AudioObjectGetPropertyDataSize(AudioObjectID(kAudioObjectSystemObject), &propAddress, 0, nil, &dataSize) == noErr else { return [] }
    let count = Int(dataSize) / MemoryLayout<AudioDeviceID>.size
    var ids = [AudioDeviceID](repeating: 0, count: count)
    guard AudioObjectGetPropertyData(AudioObjectID(kAudioObjectSystemObject), &propAddress, 0, nil, &dataSize, &ids) == noErr else { return [] }
    return ids
}

func getString(_ id: AudioDeviceID, _ sel: AudioObjectPropertySelector) -> String? {
    var addr = AudioObjectPropertyAddress(mSelector: sel, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    var name: CFString = "" as CFString
    var size = UInt32(MemoryLayout<CFString>.size)
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, &name) == noErr else { return nil }
    return name as String
}

func getSampleRate(_ id: AudioDeviceID) -> Float64? {
    var addr = AudioObjectPropertyAddress(mSelector: kAudioDevicePropertyNominalSampleRate, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    var sr: Float64 = 0
    var size = UInt32(MemoryLayout<Float64>.size)
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, &sr) == noErr else { return nil }
    return sr
}

func getBufferSize(_ id: AudioDeviceID) -> UInt32? {
    var addr = AudioObjectPropertyAddress(mSelector: kAudioDevicePropertyBufferFrameSize, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    var bs: UInt32 = 0
    var size = UInt32(MemoryLayout<UInt32>.size)
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, &bs) == noErr else { return nil }
    return bs
}

func getTransportType(_ id: AudioDeviceID) -> UInt32? {
    var addr = AudioObjectPropertyAddress(mSelector: kAudioDevicePropertyTransportType, mScope: kAudioObjectPropertyScopeGlobal, mElement: kAudioObjectPropertyElementMain)
    var t: UInt32 = 0
    var size = UInt32(MemoryLayout<UInt32>.size)
    guard AudioObjectGetPropertyData(id, &addr, 0, nil, &size, &t) == noErr else { return nil }
    return t
}

// MARK: - AU Plugin Discovery

struct AUInfo {
    let name: String
    let type: String
    let subType: String
    let manufacturer: String
    let componentType: UInt32
}

func fourCC(_ val: UInt32) -> String {
    String([
        Character(UnicodeScalar((val >> 24) & 0xFF)!),
        Character(UnicodeScalar((val >> 16) & 0xFF)!),
        Character(UnicodeScalar((val >>  8) & 0xFF)!),
        Character(UnicodeScalar( val        & 0xFF)!)
    ])
}

func scanAllAU() -> [AUInfo] {
    var results: [AUInfo] = []
    var desc = AudioComponentDescription(componentType: 0, componentSubType: 0, componentManufacturer: 0, componentFlags: 0, componentFlagsMask: 0)
    var comp: AudioComponent? = AudioComponentFindNext(nil, &desc)
    while comp != nil {
        var d = AudioComponentDescription()
        AudioComponentGetDescription(comp!, &d)
        var cfName: Unmanaged<CFString>?
        AudioComponentCopyName(comp!, &cfName)
        let name = cfName?.takeRetainedValue() as String? ?? "?"
        results.append(AUInfo(name: name, type: fourCC(d.componentType), subType: fourCC(d.componentSubType), manufacturer: fourCC(d.componentManufacturer), componentType: d.componentType))
        comp = AudioComponentFindNext(comp, &desc)
    }
    return results
}

// MARK: - Logic Pro Process Check

func isLogicRunning() -> Bool {
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: "/usr/bin/pgrep")
    proc.arguments = ["-x", "Logic Pro"]
    let pipe = Pipe()
    proc.standardOutput = pipe
    proc.standardError = Pipe()
    do {
        try proc.run()
        proc.waitUntilExit()
        return proc.terminationStatus == 0
    } catch {
        return false
    }
}

func getLogicVersion() -> String? {
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: "/usr/bin/mdls")
    proc.arguments = ["-name", "kMDItemVersion", "/Applications/Logic Pro.app"]
    let pipe = Pipe()
    proc.standardOutput = pipe
    proc.standardError = Pipe()
    do {
        try proc.run()
        proc.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""
        if let range = output.range(of: "\"") {
            let start = output.index(range.lowerBound, offsetBy: 1)
            if let end = output[start...].firstIndex(of: "\"") {
                return String(output[start..<end])
            }
        }
    } catch {}
    return nil
}

// MARK: - Main

func main() {
    print("")
    print("\(C.bold)╔═══════════════════════════════════════════════════════╗\(C.reset)")
    print("\(C.bold)║     LOGIC PRO SESSION VERIFIER — RSP_001 ARSENAL     ║\(C.reset)")
    print("\(C.bold)║     \(Date())     ║\(C.reset)")
    print("\(C.bold)╚═══════════════════════════════════════════════════════╝\(C.reset)")

    // ─── Logic Pro Status ───
    header("LOGIC PRO STATUS")

    if let version = getLogicVersion() {
        ok("Logic Pro v\(version) installed")
    } else {
        fail("Logic Pro not found at /Applications/Logic Pro.app")
    }

    if isLogicRunning() {
        ok("Logic Pro is \(C.bold)RUNNING\(C.reset)")
    } else {
        info("Logic Pro is not running")
    }

    // ─── Sample Rate Consistency ───
    header("SAMPLE RATE CONSISTENCY CHECK")

    let devices = getAudioDeviceIDs()
    var rateMap: [String: Float64] = [:]
    var mismatch = false

    for id in devices {
        guard let name = getString(id, kAudioObjectPropertyName),
              let sr = getSampleRate(id) else { continue }
        rateMap[name] = sr

        let is48k = sr == 48000.0
        if is48k {
            ok("\(name): \(C.green)\(Int(sr)) Hz\(C.reset)")
        } else {
            warn("\(name): \(C.yellow)\(Int(sr)) Hz\(C.reset) (target: 48000)")
            mismatch = true
        }
    }

    if !mismatch && !rateMap.isEmpty {
        print("")
        ok("\(C.bold)All devices at 48kHz — SAMPLE RATE MATCH\(C.reset)")
    } else if mismatch {
        print("")
        warn("Sample rate mismatch detected — align all devices to 48000 Hz")
    }

    // ─── Buffer Size & Latency ───
    header("BUFFER SIZE & LATENCY")

    for id in devices {
        guard let name = getString(id, kAudioObjectPropertyName),
              let bs = getBufferSize(id),
              let sr = getSampleRate(id), sr > 0 else { continue }
        let latencyMs = Double(bs) / sr * 1000.0
        let latencyOk = latencyMs < 15.0
        let color = latencyOk ? C.green : C.yellow
        info("\(name): \(bs) frames → \(color)\(String(format: "%.2f", latencyMs)) ms\(C.reset)\(latencyOk ? "" : " (consider lowering buffer)")")
    }

    // ─── AU Net Send / Receive ───
    header("AU NET SEND / RECEIVE VERIFICATION")

    let allAU = scanAllAU()

    let netSend = allAU.filter { $0.subType == "nsnd" || $0.name.lowercased().contains("net send") }
    let netRecv = allAU.filter { $0.subType == "nrcv" || $0.name.lowercased().contains("net receive") }

    if !netSend.isEmpty {
        for p in netSend {
            ok("AU Net Send: \(C.bold)\(p.name)\(C.reset) [\(p.type)/\(p.subType)/\(p.manufacturer)]")
        }
    } else {
        fail("AU Net Send NOT FOUND — required for GOD ↔ Micky-P bridge")
        info("Open Logic Pro to force-register AU components")
        info("Check: /Library/Audio/Plug-Ins/Components/")
    }

    if !netRecv.isEmpty {
        for p in netRecv {
            ok("AU Net Receive: \(C.bold)\(p.name)\(C.reset) [\(p.type)/\(p.subType)/\(p.manufacturer)]")
        }
    } else {
        fail("AU Net Receive NOT FOUND — required for GOD ↔ Micky-P bridge")
    }

    // ─── Key AU Plugins ───
    header("KEY AU PLUGINS FOR RSP_001 SESSIONS")

    let keyPlugins = [
        ("Reverb", ["reverb", "space designer", "chromaverb", "valhalla"]),
        ("Compressor", ["compressor", "dynamics", "limiter"]),
        ("EQ", ["channel eq", "linear phase", "parametric"]),
        ("De-esser", ["de-ess", "deess"]),
        ("Noise Gate", ["noise gate", "gate"]),
        ("Pitch", ["pitch", "autotune", "melodyne"]),
        ("UAD", ["uad", "universal audio"]),
    ]

    for (category, terms) in keyPlugins {
        let found = allAU.filter { p in terms.contains(where: { p.name.lowercased().contains($0) }) }
        if !found.isEmpty {
            ok("\(category): \(found.count) plugin(s)")
            for p in found.prefix(3) {
                info("  \(p.name)")
            }
            if found.count > 3 { info("  ... +\(found.count - 3) more") }
        } else {
            info("\(category): none found")
        }
    }

    // ─── Aggregate Device Check ───
    header("AGGREGATE / MULTI-OUTPUT DEVICES")

    for id in devices {
        guard let name = getString(id, kAudioObjectPropertyName),
              let transport = getTransportType(id) else { continue }
        if transport == kAudioDeviceTransportTypeAggregate {
            ok("Aggregate Device: \(C.bold)\(name)\(C.reset)")
        }
    }

    // ─── Summary ───
    header("SESSION READINESS")

    var issues: [String] = []
    if netSend.isEmpty { issues.append("AU Net Send missing") }
    if netRecv.isEmpty { issues.append("AU Net Receive missing") }
    if mismatch { issues.append("Sample rate mismatch") }

    if issues.isEmpty {
        ok("\(C.bold)\(C.green)LOGIC PRO SESSION READY — ALL CHECKS PASSED\(C.reset)")
    } else {
        for i in issues { fail(i) }
        print("")
        fail("\(C.bold)\(issues.count) issue(s) must be resolved\(C.reset)")
    }

    // Plugin total
    print("")
    info("Total AU plugins: \(allAU.count)")
    let effects = allAU.filter { $0.type == "aufx" }.count
    let instruments = allAU.filter { $0.type == "aumu" }.count
    let generators = allAU.filter { $0.type == "augn" }.count
    info("  Effects: \(effects) | Instruments: \(instruments) | Generators: \(generators)")
    print("")
    print("\(C.dim)  Logic Pro Session Verifier v1.0 — NOIZY EMPIRE — 5th Epoch\(C.reset)")
    print("")
}

main()
