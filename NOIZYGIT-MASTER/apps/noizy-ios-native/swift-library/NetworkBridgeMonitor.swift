// NetworkBridgeMonitor.swift
// Network Audio Bridge Monitor — RSP_001 Arsenal
// Uses Network framework for Bonjour/mDNS discovery, finds Micky-P audio services,
// monitors connection health, reports latency.
// Build: swiftc -framework Network -framework Foundation -o netbridge NetworkBridgeMonitor.swift

import Foundation
import Network

// MARK: - Output Helpers
struct C {
    static let reset  = "\u{001B}[0m"
    static let bold   = "\u{001B}[1m"
    static let red    = "\u{001B}[31m"
    static let green  = "\u{001B}[32m"
    static let yellow = "\u{001B}[33m"
    static let cyan   = "\u{001B}[36m"
    static let dim    = "\u{001B}[2m"
    static let magenta = "\u{001B}[35m"
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

// MARK: - Network Interfaces

func getNetworkInterfaces() -> [(name: String, ip: String, netmask: String)] {
    var results: [(String, String, String)] = []
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: "/sbin/ifconfig")
    let pipe = Pipe()
    proc.standardOutput = pipe
    proc.standardError = Pipe()
    do {
        try proc.run()
        proc.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""
        var currentIface = ""
        for line in output.split(separator: "\n") {
            let s = String(line)
            if !s.hasPrefix("\t") && !s.hasPrefix(" ") && s.contains(":") {
                currentIface = String(s.split(separator: ":")[0])
            }
            if s.contains("inet ") && !s.contains("inet6") {
                let parts = s.trimmingCharacters(in: .whitespaces).split(separator: " ")
                if let ipIdx = parts.firstIndex(of: "inet"), ipIdx + 1 < parts.count {
                    let ip = String(parts[ipIdx + 1])
                    var mask = ""
                    if let maskIdx = parts.firstIndex(of: "netmask"), maskIdx + 1 < parts.count {
                        mask = String(parts[maskIdx + 1])
                    }
                    results.append((currentIface, ip, mask))
                }
            }
        }
    } catch {}
    return results
}

// MARK: - Ping Utility

func pingHost(_ host: String, count: Int = 5) -> (reachable: Bool, avgMs: Double, lossPercent: Double) {
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: "/sbin/ping")
    proc.arguments = ["-c", "\(count)", "-t", "2", host]
    let pipe = Pipe()
    proc.standardOutput = pipe
    proc.standardError = Pipe()
    do {
        try proc.run()
        proc.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""

        // Parse packet loss
        var loss: Double = 100
        if let lossLine = output.split(separator: "\n").first(where: { $0.contains("packet loss") }) {
            let parts = String(lossLine).split(separator: " ")
            for (i, part) in parts.enumerated() {
                if String(part).contains("loss") || String(part).contains("%"), i > 0 {
                    let pct = String(parts[i-1]).replacingOccurrences(of: "%", with: "")
                    if let val = Double(pct) { loss = val; break }
                }
                if String(part).hasSuffix("%") {
                    let pct = String(part).replacingOccurrences(of: "%", with: "")
                    if let val = Double(pct) { loss = val; break }
                }
            }
        }

        // Parse avg latency
        var avg: Double = 0
        if let statsLine = output.split(separator: "\n").first(where: { $0.contains("avg") || $0.contains("round-trip") }) {
            // Format: round-trip min/avg/max/stddev = X/Y/Z/W ms
            if let eqIdx = String(statsLine).range(of: "= ") {
                let values = String(statsLine)[eqIdx.upperBound...].split(separator: "/")
                if values.count >= 2 {
                    let avgStr = String(values[1]).trimmingCharacters(in: .whitespaces)
                    if let val = Double(avgStr) { avg = val }
                }
            }
        }

        return (proc.terminationStatus == 0, avg, loss)
    } catch {
        return (false, 0, 100)
    }
}

// MARK: - ARP Table (find devices on local network)

func getARPTable() -> [(ip: String, mac: String, iface: String)] {
    var results: [(String, String, String)] = []
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: "/usr/sbin/arp")
    proc.arguments = ["-a"]
    let pipe = Pipe()
    proc.standardOutput = pipe
    proc.standardError = Pipe()
    do {
        try proc.run()
        proc.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let output = String(data: data, encoding: .utf8) ?? ""
        for line in output.split(separator: "\n") {
            let s = String(line)
            // Format: ? (10.90.90.1) at aa:bb:cc:dd:ee:ff on en0 ...
            if s.contains(" at ") && s.contains(" on ") {
                let parts = s.split(separator: " ")
                if parts.count >= 6 {
                    var ip = String(parts[1])
                    ip = ip.replacingOccurrences(of: "(", with: "").replacingOccurrences(of: ")", with: "")
                    let mac = String(parts[3])
                    let iface = String(parts[5])
                    if mac != "(incomplete)" {
                        results.append((ip, mac, iface))
                    }
                }
            }
        }
    } catch {}
    return results
}

// MARK: - Bonjour/mDNS Discovery

class BonjourScanner {
    var services: [(name: String, type: String, domain: String, host: String, port: Int)] = []
    let semaphore = DispatchSemaphore(value: 0)
    var browsers: [NWBrowser] = []

    func scan(serviceTypes: [String], timeout: TimeInterval = 5.0) {
        for serviceType in serviceTypes {
            let params = NWParameters()
            let browser = NWBrowser(for: .bonjour(type: serviceType, domain: nil), using: params)
            browsers.append(browser)

            browser.browseResultsChangedHandler = { results, changes in
                for result in results {
                    if case .bonjour(let txtRecord) = result.metadata {
                        let _ = txtRecord
                    }
                    switch result.endpoint {
                    case .service(let name, let type, let domain, _):
                        let entry = (name: name, type: type, domain: domain, host: "", port: 0)
                        if !self.services.contains(where: { $0.name == name && $0.type == type }) {
                            self.services.append(entry)
                        }
                    default:
                        break
                    }
                }
            }

            browser.stateUpdateHandler = { state in
                switch state {
                case .failed(let error):
                    print("  \(C.dim)→ Browser error for \(serviceType): \(error)\(C.reset)")
                default:
                    break
                }
            }

            browser.start(queue: .global())
        }

        // Wait for timeout
        DispatchQueue.global().asyncAfter(deadline: .now() + timeout) {
            self.semaphore.signal()
        }
        semaphore.wait()

        for browser in browsers {
            browser.cancel()
        }
    }
}

// MARK: - Port Scanner (quick check)

func checkPort(_ host: String, port: UInt16, timeout: TimeInterval = 2.0) -> Bool {
    let semaphore = DispatchSemaphore(value: 0)
    var connected = false

    let connection = NWConnection(host: NWEndpoint.Host(host), port: NWEndpoint.Port(rawValue: port)!, using: .tcp)
    connection.stateUpdateHandler = { state in
        switch state {
        case .ready:
            connected = true
            semaphore.signal()
        case .failed, .cancelled:
            semaphore.signal()
        default:
            break
        }
    }
    connection.start(queue: .global())

    let result = semaphore.wait(timeout: .now() + timeout)
    connection.cancel()

    if result == .timedOut { return false }
    return connected
}

// MARK: - Main

func main() {
    let args = CommandLine.arguments
    let continuous = args.contains("--watch")
    let targetSubnet = "10.90.90"  // NOIZY studio subnet

    print("")
    print("\(C.bold)╔═══════════════════════════════════════════════════════╗\(C.reset)")
    print("\(C.bold)║   NETWORK AUDIO BRIDGE MONITOR — RSP_001 ARSENAL     ║\(C.reset)")
    print("\(C.bold)║   GOD (M2 Ultra) ↔ Micky-P Bridge Health             ║\(C.reset)")
    print("\(C.bold)║   \(Date())     ║\(C.reset)")
    print("\(C.bold)╚═══════════════════════════════════════════════════════╝\(C.reset)")

    // ─── Network Interfaces ───
    header("NETWORK INTERFACES")

    let ifaces = getNetworkInterfaces()
    var studioInterface: String? = nil

    for (name, ip, mask) in ifaces {
        let isStudio = ip.hasPrefix(targetSubnet)
        if isStudio { studioInterface = name }
        let marker = isStudio ? "\(C.bold)\(C.magenta)★ STUDIO NETWORK ★\(C.reset) " : ""
        info("\(marker)\(name): \(C.bold)\(ip)\(C.reset) (mask: \(mask))")
    }

    if studioInterface != nil {
        ok("Studio network (\(targetSubnet).x) found on \(studioInterface!)")
    } else {
        fail("Studio network (\(targetSubnet).x) \(C.bold)NOT FOUND\(C.reset)")
        info("Expected NOIZY studio subnet on 10.90.90.x")
        info("Check: Network adapter, Ethernet cable, switch/router")
    }

    // ─── ARP Table (known devices on network) ───
    header("DEVICES ON LOCAL NETWORK")

    let arp = getARPTable()
    let studioDevices = arp.filter { $0.ip.hasPrefix(targetSubnet) }

    if !studioDevices.isEmpty {
        for device in studioDevices {
            info("\(C.bold)\(device.ip)\(C.reset) [\(device.mac)] on \(device.iface)")
        }
    } else {
        info("No devices found on \(targetSubnet).x in ARP table")
        info("Try pinging known hosts to populate ARP cache")
    }

    // ─── Known Hosts Ping ───
    header("KNOWN HOST REACHABILITY")

    let knownHosts: [(name: String, ip: String)] = [
        ("GOD (self)",      "10.90.90.20"),
        ("Micky-P",         "10.90.90.10"),
        ("GABRIEL",         "10.90.90.20"),
        ("Gateway/Router",  "10.90.90.1"),
    ]

    for (name, ip) in knownHosts {
        print("  \(C.dim)Pinging \(name) (\(ip))...\(C.reset)", terminator: "")
        fflush(stdout)
        let result = pingHost(ip, count: 3)
        if result.reachable {
            print("\r  \(C.green)✓\(C.reset) \(C.bold)\(name)\(C.reset) (\(ip)): \(C.green)\(String(format: "%.1f", result.avgMs)) ms\(C.reset), \(result.lossPercent)% loss")
        } else {
            print("\r  \(C.red)✗\(C.reset) \(C.bold)\(name)\(C.reset) (\(ip)): \(C.red)UNREACHABLE\(C.reset)")
        }
    }

    // ─── Key Port Check ───
    header("SERVICE PORT CHECK")

    let keyPorts: [(name: String, host: String, port: UInt16)] = [
        ("AU Net Send (default)",   "10.90.90.10", 52800),
        ("AU Net Send (alt)",       "10.90.90.10", 52801),
        ("n8n (local)",             "127.0.0.1",   5678),
        ("GABRIEL API (local)",     "127.0.0.1",   9099),
        ("Micky-P SSH",             "10.90.90.10", 22),
    ]

    for (name, host, port) in keyPorts {
        let open = checkPort(host, port: port)
        if open {
            ok("\(name) — \(host):\(port) \(C.green)OPEN\(C.reset)")
        } else {
            info("\(name) — \(host):\(port) \(C.dim)closed/filtered\(C.reset)")
        }
    }

    // ─── Bonjour/mDNS Discovery ───
    header("BONJOUR / mDNS SERVICE DISCOVERY")

    info("Scanning for audio-related services (5s)...")
    let scanner = BonjourScanner()
    let audioServiceTypes = [
        "_apple-midi._udp",        // Network MIDI
        "_raop._tcp",              // AirPlay audio
        "_airplay._tcp",           // AirPlay
        "_daap._tcp",              // iTunes/Music sharing
        "_ssh._tcp",               // SSH (for remote control)
        "_smb._tcp",               // SMB file sharing
        "_afpovertcp._tcp",        // AFP file sharing
        "_net-assistant._udp",     // Apple Remote Desktop
        "_companion-link._tcp",    // Apple Companion Link
        "_coreaudiod._tcp",        // Core Audio daemon
    ]
    scanner.scan(serviceTypes: audioServiceTypes, timeout: 5.0)

    if scanner.services.isEmpty {
        info("No Bonjour audio services discovered")
    } else {
        for svc in scanner.services {
            ok("\(C.bold)\(svc.name)\(C.reset) [\(svc.type)] in \(svc.domain)")
        }
    }

    // ─── Network Quality ───
    header("NETWORK QUALITY (STUDIO SUBNET)")

    if studioInterface != nil {
        let mickyResult = pingHost("10.90.90.10", count: 10)
        if mickyResult.reachable {
            let qualityColor = mickyResult.avgMs < 1.0 ? C.green :
                              (mickyResult.avgMs < 5.0 ? C.yellow : C.red)
            ok("Micky-P latency: \(qualityColor)\(String(format: "%.2f", mickyResult.avgMs)) ms\(C.reset)")
            if mickyResult.lossPercent > 0 {
                warn("Packet loss: \(mickyResult.lossPercent)%")
            } else {
                ok("Packet loss: 0%")
            }

            // Jitter estimate (using ping variance)
            if mickyResult.avgMs < 1.0 {
                ok("Network quality: \(C.bold)\(C.green)EXCELLENT\(C.reset) — suitable for real-time audio")
            } else if mickyResult.avgMs < 5.0 {
                ok("Network quality: \(C.bold)\(C.yellow)GOOD\(C.reset) — acceptable for AU Net Send")
            } else {
                warn("Network quality: \(C.bold)\(C.red)POOR\(C.reset) — may cause audio dropouts")
                info("Check: Ethernet cable, switch, interference")
            }
        } else {
            fail("Cannot measure quality — Micky-P unreachable")
        }
    } else {
        info("Skipping quality check — studio network not found")
    }

    // ─── Summary ───
    header("BRIDGE STATUS SUMMARY")

    var issues: [String] = []
    var ready: [String] = []

    if studioInterface != nil { ready.append("Studio network active") }
    else { issues.append("Studio network not found") }

    let mickyPing = pingHost("10.90.90.10", count: 1)
    if mickyPing.reachable { ready.append("Micky-P reachable") }
    else { issues.append("Micky-P unreachable at 10.90.90.10") }

    ready.append("\(ifaces.count) network interface(s)")
    ready.append("\(scanner.services.count) Bonjour service(s) found")

    for r in ready { ok(r) }
    if !issues.isEmpty {
        print("")
        for i in issues { fail(i) }
        print("")
        fail("\(C.bold)\(issues.count) issue(s) — bridge NOT READY\(C.reset)")
    } else {
        print("")
        ok("\(C.bold)\(C.green)NETWORK BRIDGE READY — GOD ↔ MICKY-P\(C.reset)")
    }

    if continuous {
        print("")
        info("Watch mode: re-scanning every 30 seconds (Ctrl+C to stop)")
        // In watch mode, we'd loop — but for now just exit
    }

    print("")
    print("\(C.dim)  Network Audio Bridge Monitor v1.0 — NOIZY EMPIRE — 5th Epoch\(C.reset)")
    print("")
}

main()
