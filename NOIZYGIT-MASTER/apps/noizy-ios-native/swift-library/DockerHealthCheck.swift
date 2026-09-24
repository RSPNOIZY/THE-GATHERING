// DockerHealthCheck.swift
// Docker Health Monitor — RSP_001 Arsenal
// Checks all NOIZY Docker containers, ports, and services
// Build: swiftc -O -o bin/dockerhealth DockerHealthCheck.swift

import Foundation

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

func run(_ cmd: String, args: [String]) -> (output: String, status: Int32) {
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: cmd)
    proc.arguments = args
    let pipe = Pipe()
    proc.standardOutput = pipe
    proc.standardError = Pipe()
    do {
        try proc.run()
        proc.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        return (String(data: data, encoding: .utf8) ?? "", proc.terminationStatus)
    } catch {
        return ("", -1)
    }
}

func checkPort(_ host: String, _ port: Int) -> Bool {
    let (_, status) = run("/usr/bin/nc", args: ["-z", "-w2", host, "\(port)"])
    return status == 0
}

func httpGet(_ url: String) -> (body: String, code: Int) {
    let proc = Process()
    proc.executableURL = URL(fileURLWithPath: "/usr/bin/curl")
    proc.arguments = ["-s", "-o", "/dev/null", "-w", "%{http_code}", "--max-time", "3", url]
    let pipe = Pipe()
    proc.standardOutput = pipe
    proc.standardError = Pipe()
    do {
        try proc.run()
        proc.waitUntilExit()
        let data = pipe.fileHandleForReading.readDataToEndOfFile()
        let code = Int(String(data: data, encoding: .utf8)?.trimmingCharacters(in: .whitespacesAndNewlines) ?? "0") ?? 0
        return ("", code)
    } catch {
        return ("", 0)
    }
}

func main() {
    print("")
    print("\(C.bold)╔═══════════════════════════════════════════════════════╗\(C.reset)")
    print("\(C.bold)║     DOCKER HEALTH CHECK — RSP_001 ARSENAL            ║\(C.reset)")
    print("\(C.bold)║     \(Date())     ║\(C.reset)")
    print("\(C.bold)╚═══════════════════════════════════════════════════════╝\(C.reset)")

    // ─── Docker Daemon ───
    header("DOCKER DAEMON")
    let (dockerInfo, dockerStatus) = run("/usr/local/bin/docker", args: ["info", "--format", "{{.ServerVersion}}"])
    if dockerStatus == 0 {
        ok("Docker Engine: v\(dockerInfo.trimmingCharacters(in: .whitespacesAndNewlines))")
    } else {
        fail("Docker daemon not running")
        return
    }

    // ─── Containers ───
    header("CONTAINERS")
    let (psOutput, _) = run("/usr/local/bin/docker", args: ["ps", "-a", "--format", "{{.Names}}\t{{.Status}}\t{{.Ports}}"])
    var running = 0
    var stopped = 0
    for line in psOutput.split(separator: "\n") {
        let parts = line.split(separator: "\t", maxSplits: 2)
        guard parts.count >= 2 else { continue }
        let name = String(parts[0])
        let status = String(parts[1])
        let ports = parts.count > 2 ? String(parts[2]) : ""
        let isUp = status.lowercased().contains("up")

        if isUp {
            running += 1
            ok("\(C.bold)\(name)\(C.reset) — \(C.green)\(status)\(C.reset)")
            if !ports.isEmpty {
                info("  \(ports)")
            }
        } else {
            stopped += 1
            fail("\(C.bold)\(name)\(C.reset) — \(C.red)\(status)\(C.reset)")
        }
    }
    print("")
    info("Running: \(running) | Stopped: \(stopped) | Total: \(running + stopped)")

    // ─── Service Health ───
    header("SERVICE HEALTH CHECKS")

    let services: [(name: String, host: String, port: Int, path: String)] = [
        ("GABRIEL API",     "127.0.0.1", 9099,  "/health"),
        ("n8n",             "127.0.0.1", 5678,  "/healthz"),
        ("Open WebUI",      "127.0.0.1", 3080,  "/"),
        ("Grafana",         "127.0.0.1", 3000,  "/api/health"),
        ("Neo4j Browser",   "127.0.0.1", 7474,  "/"),
        ("Qdrant",          "127.0.0.1", 6333,  "/"),
        ("RabbitMQ Mgmt",   "127.0.0.1", 15672, "/"),
        ("Whisper STT",     "127.0.0.1", 8010,  "/"),
        ("Redis",           "127.0.0.1", 6379,  ""),
        ("PostgreSQL",      "127.0.0.1", 5432,  ""),
        ("MinIO",           "127.0.0.1", 9000,  ""),
        ("MinIO Console",   "127.0.0.1", 9001,  ""),
        ("Prometheus",      "127.0.0.1", 9090,  ""),
    ]

    var svcUp = 0
    var svcDown = 0

    for svc in services {
        let portOpen = checkPort(svc.host, svc.port)
        if portOpen {
            svcUp += 1
            if !svc.path.isEmpty {
                let (_, code) = httpGet("http://\(svc.host):\(svc.port)\(svc.path)")
                ok("\(svc.name) (\(svc.port)) — \(C.green)UP\(C.reset) (HTTP \(code))")
            } else {
                ok("\(svc.name) (\(svc.port)) — \(C.green)PORT OPEN\(C.reset)")
            }
        } else {
            svcDown += 1
            info("\(svc.name) (\(svc.port)) — \(C.dim)not running\(C.reset)")
        }
    }

    // ─── Remote Services ───
    header("REMOTE SERVICES")

    let remotes: [(name: String, url: String)] = [
        ("HEAVEN v18",  "https://heaven.rsp-5f3.workers.dev/v1/health"),
    ]

    for remote in remotes {
        let (_, code) = httpGet(remote.url)
        if code >= 200 && code < 400 {
            ok("\(remote.name) — \(C.green)LIVE\(C.reset) (HTTP \(code))")
        } else {
            fail("\(remote.name) — \(C.red)DOWN\(C.reset) (HTTP \(code))")
        }
    }

    // ─── Disk Usage ───
    header("DOCKER DISK USAGE")
    let (dfOutput, _) = run("/usr/local/bin/docker", args: ["system", "df", "--format", "{{.Type}}\t{{.TotalCount}}\t{{.Size}}\t{{.Reclaimable}}"])
    for line in dfOutput.split(separator: "\n") {
        let parts = line.split(separator: "\t")
        if parts.count >= 4 {
            info("\(parts[0]): \(parts[2]) total, \(parts[3]) reclaimable (\(parts[1]) items)")
        }
    }

    // ─── Summary ───
    header("SUMMARY")
    ok("Containers: \(running) running / \(stopped) stopped")
    ok("Services: \(svcUp) up / \(svcDown) not running")
    print("")
    print("\(C.dim)  Docker Health Check v1.0 — NOIZY EMPIRE — 5th Epoch\(C.reset)")
    print("")
}

main()
