// EmpireStatus.swift
// NOIZY Empire Master Status — RSP_001 Arsenal
// Single command to check EVERYTHING: audio, network, docker, services, vault
// Build: swiftc -framework CoreAudio -framework AudioToolbox -framework Network -O -o bin/empirestatus EmpireStatus.swift

import Foundation

struct C {
    static let reset  = "\u{001B}[0m"
    static let bold   = "\u{001B}[1m"
    static let red    = "\u{001B}[31m"
    static let green  = "\u{001B}[32m"
    static let yellow = "\u{001B}[33m"
    static let cyan   = "\u{001B}[36m"
    static let dim    = "\u{001B}[2m"
    static let mag    = "\u{001B}[35m"
}

func run(_ cmd: String, _ args: [String]) -> String {
    let p = Process()
    p.executableURL = URL(fileURLWithPath: cmd)
    p.arguments = args
    let pipe = Pipe()
    p.standardOutput = pipe
    p.standardError = Pipe()
    do { try p.run(); p.waitUntilExit() } catch { return "" }
    return String(data: pipe.fileHandleForReading.readDataToEndOfFile(), encoding: .utf8) ?? ""
}

func portOpen(_ host: String, _ port: Int) -> Bool {
    let p = Process()
    p.executableURL = URL(fileURLWithPath: "/usr/bin/nc")
    p.arguments = ["-z", "-w1", host, "\(port)"]
    p.standardOutput = Pipe(); p.standardError = Pipe()
    do { try p.run(); p.waitUntilExit() } catch { return false }
    return p.terminationStatus == 0
}

func httpCode(_ url: String) -> Int {
    let out = run("/usr/bin/curl", ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "3", url])
    return Int(out.trimmingCharacters(in: .whitespacesAndNewlines)) ?? 0
}

func dot(_ ok: Bool) -> String { ok ? "\(C.green)●\(C.reset)" : "\(C.red)●\(C.reset)" }

func main() {
    let now = ISO8601DateFormatter().string(from: Date())

    print("")
    print("\(C.bold)\(C.mag)╔═══════════════════════════════════════════════════════╗\(C.reset)")
    print("\(C.bold)\(C.mag)║          NOIZY EMPIRE — MASTER STATUS                ║\(C.reset)")
    print("\(C.bold)\(C.mag)║          RSP_001 • GOD (M2 Ultra) • \(now.prefix(10))     ║\(C.reset)")
    print("\(C.bold)\(C.mag)╚═══════════════════════════════════════════════════════╝\(C.reset)")

    // ─── SERVICES ───
    print("\n\(C.bold)  SERVICES\(C.reset)")

    let services: [(String, String, Int, String)] = [
        ("GABRIEL API",       "127.0.0.1", 9099,  "/health"),
        ("n8n Orchestration", "127.0.0.1", 5678,  "/healthz"),
        ("HEAVEN v18",        "", 0, "https://heaven.rsp-5f3.workers.dev/v1/health"),
        ("Open WebUI",        "127.0.0.1", 3080,  "/"),
        ("Grafana",           "127.0.0.1", 3000,  "/api/health"),
        ("Neo4j",             "127.0.0.1", 7474,  "/"),
        ("Qdrant",            "127.0.0.1", 6333,  "/"),
        ("RabbitMQ",          "127.0.0.1", 15672, "/"),
        ("Whisper STT",       "127.0.0.1", 8010,  "/"),
    ]

    for svc in services {
        let up: Bool
        if svc.1.isEmpty {
            up = httpCode(svc.3) >= 200 && httpCode(svc.3) < 500
        } else {
            up = portOpen(svc.1, svc.2)
        }
        let portStr = svc.2 > 0 ? ":\(svc.2)" : ""
        print("  \(dot(up)) \(C.bold)\(svc.0)\(C.reset)\(portStr)")
    }

    // ─── DOCKER ───
    print("\n\(C.bold)  DOCKER\(C.reset)")
    let ps = run("/usr/local/bin/docker", ["ps", "--format", "{{.Names}}"])
    let running = ps.split(separator: "\n").count
    let psAll = run("/usr/local/bin/docker", ["ps", "-a", "--format", "{{.Names}}"])
    let total = psAll.split(separator: "\n").count
    print("  \(dot(running > 0)) \(running) running / \(total) total containers")

    // ─── AUDIO ───
    print("\n\(C.bold)  AUDIO\(C.reset)")
    let auval = run("/usr/bin/auval", ["-a"])
    let pluginCount = auval.split(separator: "\n").count
    print("  \(dot(pluginCount > 100)) \(pluginCount) AU plugins registered")
    let uadCount = auval.split(separator: "\n").filter { $0.lowercased().contains("universal audio") }.count
    print("  \(dot(uadCount > 0)) \(uadCount) UAD plugins")
    let hasNetSend = auval.contains("nsnd")
    let hasNetRecv = auval.contains("nrcv")
    print("  \(dot(hasNetSend)) AU Net Send")
    print("  \(dot(hasNetRecv)) AU Net Receive")

    // ─── NETWORK ───
    print("\n\(C.bold)  NETWORK\(C.reset)")
    let ifconfig = run("/sbin/ifconfig", [])
    let has1090 = ifconfig.contains("10.90.90")
    print("  \(dot(has1090)) Studio subnet (10.90.90.x)")
    let sshKey = FileManager.default.fileExists(atPath: NSHomeDirectory() + "/.ssh/noizynet_ed25519")
    print("  \(dot(sshKey)) NOIZYNET SSH key")
    let wgConf = FileManager.default.fileExists(atPath: NSHomeDirectory() + "/.config/wireguard/noizynet.conf")
    print("  \(dot(wgConf)) WireGuard VPN config")
    let cfTunnel = FileManager.default.fileExists(atPath: NSHomeDirectory() + "/.cloudflared/noizynet-tunnel.yml")
    print("  \(dot(cfTunnel)) Cloudflare Tunnel config")

    // ─── TOOLS ───
    print("\n\(C.bold)  TOOLS (~/swift-library/bin/)\(C.reset)")
    let binDir = NSHomeDirectory() + "/swift-library/bin"
    if let files = try? FileManager.default.contentsOfDirectory(atPath: binDir) {
        let sorted = files.filter { !$0.hasPrefix(".") }.sorted()
        for f in sorted {
            print("  \(C.green)●\(C.reset) \(f)")
        }
        print("  \(C.dim)\(sorted.count) tools total\(C.reset)")
    }

    // ─── VAULT ───
    print("\n\(C.bold)  RSP_001 VAULT\(C.reset)")
    let vaultBase = NSHomeDirectory() + "/NOIZYLAB/RSP_001_VAULT"
    let demos = (try? FileManager.default.contentsOfDirectory(atPath: vaultBase + "/voice_demos"))?.count ?? 0
    let archives = (try? FileManager.default.contentsOfDirectory(atPath: vaultBase + "/recordings"))?.count ?? 0
    let docs = (try? FileManager.default.contentsOfDirectory(atPath: vaultBase + "/gabriel_archive"))?.count ?? 0
    print("  \(dot(demos > 0)) \(demos) voice demos")
    print("  \(dot(archives > 0)) \(archives) recording archive(s)")
    print("  \(dot(docs > 0)) \(docs) GABRIEL docs")

    // ─── VOLUMES ───
    print("\n\(C.bold)  MOUNTED VOLUMES\(C.reset)")
    if let vols = try? FileManager.default.contentsOfDirectory(atPath: "/Volumes") {
        for v in vols.sorted() {
            if v.hasPrefix(".") { continue }
            print("  \(C.green)●\(C.reset) /Volumes/\(v)")
        }
    }

    print("\n\(C.dim)  Empire Status v1.0 — \(now) — 5th Epoch\(C.reset)\n")
}

main()
