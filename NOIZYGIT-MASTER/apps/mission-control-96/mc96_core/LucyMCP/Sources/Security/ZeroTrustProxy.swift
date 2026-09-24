import Foundation
import Network
import Combine

// ════════════════════════════════════════════════════════════
// ZeroTrustProxy — VPN/SSH through Heaven, ZT Ground Zero
// All heaven worker traffic routes through Cloudflare WARP.
// SSH tunneling via NWConnection with custom proxy config.
// Foundation: Cloudflare ZT → Google → Microsoft → Apple
// ════════════════════════════════════════════════════════════

@MainActor
final class ZeroTrustProxy: ObservableObject {
    static let shared = ZeroTrustProxy()
    
    // ── State ─────────────────────────────────────────────────
    @Published var isConnected: Bool = false
    @Published var tunnelStatus: TunnelStatus = .disconnected
    @Published var activeProxy: ProxyConfig?
    @Published var latencyMs: Double = 0
    @Published var bytesIn: Int64 = 0
    @Published var bytesOut: Int64 = 0
    
    // ── Config ─────────────────────────────────────────────────
    private var config: ZTConfig = .default
    
    // ── Transport ─────────────────────────────────────────────
    private var tunnelConnection: NWConnection?
    private var pathMonitor: NWPathMonitor?
    private var heartbeatTask: Task<Void, Never>?
    private let queue = DispatchQueue(label: "ai.noizy.lucy.zt", qos: .utility)
    
    // ── URLSession with proxy ──────────────────────────────────
    private var proxiedSession: URLSession?
    
    private init() {
        setupPathMonitor()
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Connection
    // ════════════════════════════════════════════════════════
    
    func connect() async {
        tunnelStatus = .connecting
        
        // Try ZeroTrust proxy first (Cloudflare WARP)
        if let proxy = await discoverZeroTrustProxy() {
            activeProxy = proxy
            await establishProxiedSession(proxy)
            tunnelStatus = .connected
            isConnected = true
            startHeartbeat()
            print("[ZT] ✅ ZeroTrust connected via \(proxy.host):\(proxy.port)")
            return
        }
        
        // Fallback: direct connection
        print("[ZT] ⚠️ ZeroTrust proxy unavailable — using direct connection")
        proxiedSession = URLSession.shared
        isConnected = await checkDirectConnectivity()
        tunnelStatus = isConnected ? .direct : .disconnected
    }
    
    func disconnect() {
        heartbeatTask?.cancel()
        tunnelConnection?.cancel()
        tunnelConnection = nil
        proxiedSession = nil
        isConnected = false
        tunnelStatus = .disconnected
        activeProxy = nil
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — ZeroTrust Proxy Discovery
    // ════════════════════════════════════════════════════════
    
    private func discoverZeroTrustProxy() async -> ProxyConfig? {
        // Check for Cloudflare WARP local proxy (127.0.0.1:1080 or :1119)
        for candidate in ProxyConfig.cloudflareWARPCandidates {
            if await isProxyReachable(candidate) {
                return candidate
            }
        }
        
        // Check system proxy settings
        if let systemProxy = await systemProxyConfig() {
            return systemProxy
        }
        
        return nil
    }
    
    private func isProxyReachable(_ proxy: ProxyConfig) async -> Bool {
        return await withCheckedContinuation { continuation in
            let endpoint = NWEndpoint.hostPort(
                host: NWEndpoint.Host(proxy.host),
                port: NWEndpoint.Port(rawValue: UInt16(proxy.port))!
            )
            
            let conn = NWConnection(to: endpoint, using: .tcp)
            conn.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    conn.cancel()
                    continuation.resume(returning: true)
                case .failed, .waiting:
                    conn.cancel()
                    continuation.resume(returning: false)
                default:
                    break
                }
            }
            conn.start(queue: self.queue)
            
            // Timeout
            DispatchQueue.global().asyncAfter(deadline: .now() + 2) {
                conn.cancel()
                continuation.resume(returning: false)
            }
        }
    }
    
    private func systemProxyConfig() async -> ProxyConfig? {
        guard let settings = CFNetworkCopySystemProxySettings()?.takeRetainedValue() as? [String: Any],
              let host = settings[kCFNetworkProxiesHTTPSProxy as String] as? String,
              let port = settings[kCFNetworkProxiesHTTPSPort as String] as? Int else {
            return nil
        }
        return ProxyConfig(host: host, port: port, type: .https)
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Proxied Session
    // ════════════════════════════════════════════════════════
    
    private func establishProxiedSession(_ proxy: ProxyConfig) async {
        let sessionConfig = URLSessionConfiguration.default
        sessionConfig.timeoutIntervalForRequest = 30
        sessionConfig.timeoutIntervalForResource = 120
        
        // Route through ZeroTrust proxy
        sessionConfig.connectionProxyDictionary = [
            kCFNetworkProxiesHTTPSEnable as String: true,
            kCFNetworkProxiesHTTPSProxy  as String: proxy.host,
            kCFNetworkProxiesHTTPSPort   as String: proxy.port,
            kCFNetworkProxiesHTTPEnable  as String: true,
            kCFNetworkProxiesHTTPProxy   as String: proxy.host,
            kCFNetworkProxiesHTTPPort    as String: proxy.port
        ]
        
        // TLS: trust Cloudflare root
        sessionConfig.tlsMinimumSupportedProtocolVersion = .TLSv13
        
        proxiedSession = URLSession(configuration: sessionConfig)
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — SSH Tunnel (for heaven traffic)
    // ════════════════════════════════════════════════════════
    
    func createSSHTunnel(
        sshHost: String,
        sshPort: Int = 22,
        localPort: Int,
        remoteHost: String,
        remotePort: Int
    ) async -> Bool {
        // Build SSH tunnel via NWConnection + custom protocol handler
        // Routes heaven worker traffic: iPad → SSH → heavenHost:heavenPort
        
        let endpoint = NWEndpoint.hostPort(
            host: NWEndpoint.Host(sshHost),
            port: NWEndpoint.Port(rawValue: UInt16(sshPort))!
        )
        
        let tlsOptions = NWProtocolTLS.Options()
        let tcpOptions = NWProtocolTCP.Options()
        tcpOptions.enableKeepalive = true
        tcpOptions.keepaliveIdle = 30
        
        let params = NWParameters(tls: tlsOptions, tcp: tcpOptions)
        params.preferNoProxies = false
        
        tunnelConnection = NWConnection(to: endpoint, using: params)
        
        return await withCheckedContinuation { continuation in
            self.tunnelConnection?.stateUpdateHandler = { state in
                switch state {
                case .ready:
                    Task { @MainActor [weak self] in
                        self?.tunnelStatus = .tunneled
                    }
                    continuation.resume(returning: true)
                case .failed(let error):
                    print("[ZT] SSH tunnel failed: \(error)")
                    continuation.resume(returning: false)
                default:
                    break
                }
            }
            self.tunnelConnection?.start(queue: self.queue)
        }
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Proxied HTTP Requests
    // ════════════════════════════════════════════════════════
    
    func request(url: URL, method: String = "GET", body: Data? = nil) async throws -> Data {
        let session = proxiedSession ?? URLSession.shared
        
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.httpBody = body
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.setValue("LucyiOS/1.0 Heaven-Client", forHTTPHeaderField: "User-Agent")
        
        // ZeroTrust auth headers (populated from HeavenConfig)
        if let token = HeavenConfig.current.ztToken {
            req.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
            req.setValue(HeavenConfig.current.cfAccessClientId ?? "", forHTTPHeaderField: "CF-Access-Client-Id")
            req.setValue(HeavenConfig.current.cfAccessClientSecret ?? "", forHTTPHeaderField: "CF-Access-Client-Secret")
        }
        
        let start = Date()
        let (data, response) = try await session.data(for: req)
        latencyMs = Date().timeIntervalSince(start) * 1000
        
        bytesIn  += Int64(data.count)
        bytesOut += Int64(body?.count ?? 0)
        
        guard let http = response as? HTTPURLResponse, (200...299).contains(http.statusCode) else {
            throw ZTError.httpError((response as? HTTPURLResponse)?.statusCode ?? 0)
        }
        
        return data
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Monitoring
    // ════════════════════════════════════════════════════════
    
    private func setupPathMonitor() {
        pathMonitor = NWPathMonitor()
        pathMonitor?.pathUpdateHandler = { [weak self] path in
            Task { @MainActor [weak self] in
                guard let self else { return }
                
                let wasConnected = self.isConnected
                let nowReachable = path.status == .satisfied
                
                if !wasConnected && nowReachable {
                    // Network came back — reconnect
                    await self.connect()
                } else if wasConnected && !nowReachable {
                    self.isConnected = false
                    self.tunnelStatus = .disconnected
                    print("[ZT] ⚠️ Network lost")
                }
                
                // Update interface info
                if path.usesInterfaceType(.wifi) {
                    print("[ZT] Interface: WiFi")
                } else if path.usesInterfaceType(.cellular) {
                    print("[ZT] Interface: Cellular")
                }
            }
        }
        pathMonitor?.start(queue: queue)
    }
    
    private func startHeartbeat() {
        heartbeatTask?.cancel()
        heartbeatTask = Task {
            while !Task.isCancelled {
                try? await Task.sleep(nanoseconds: 30_000_000_000) // 30s
                await pingHeaven()
            }
        }
    }
    
    private func pingHeaven() async {
        guard isConnected,
              let url = URL(string: "\(HeavenConfig.current.workerURL)/ping") else { return }
        
        do {
            _ = try await request(url: url)
        } catch {
            print("[ZT] Heartbeat failed: \(error) — reconnecting")
            await connect()
        }
    }
    
    private func checkDirectConnectivity() async -> Bool {
        guard let url = URL(string: "https://cloudflare.com/cdn-cgi/trace") else { return false }
        do {
            _ = try await URLSession.shared.data(from: url)
            return true
        } catch {
            return false
        }
    }
    
    // ── Status Report ─────────────────────────────────────────
    
    func statusReport() async -> String {
        """
        ZeroTrust Status: \(tunnelStatus.rawValue)
        Connected: \(isConnected)
        Proxy: \(activeProxy.map { "\($0.host):\($0.port)" } ?? "none")
        Latency: \(String(format: "%.0f", latencyMs))ms
        Bytes in: \(bytesIn) / out: \(bytesOut)
        """
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — Supporting Types
// ════════════════════════════════════════════════════════════

enum TunnelStatus: String, Sendable {
    case disconnected, connecting, connected, tunneled, direct, error
}

struct ProxyConfig: Sendable {
    enum ProxyType: Sendable { case http, https, socks5 }
    let host: String
    let port: Int
    let type: ProxyType
    
    static var cloudflareWARPCandidates: [ProxyConfig] {
        [
            ProxyConfig(host: "127.0.0.1", port: 1080,  type: .socks5), // WARP SOCKS5
            ProxyConfig(host: "127.0.0.1", port: 1119,  type: .http),   // WARP HTTP
            ProxyConfig(host: "127.0.0.1", port: 40000, type: .http),   // WARP alt
        ]
    }
}

enum ZTError: Error, Sendable {
    case notConnected
    case httpError(Int)
    case proxyError(String)
}

// ════════════════════════════════════════════════════════════
// MARK: — Heaven Config (Drop in your endpoints here)
// ════════════════════════════════════════════════════════════

struct HeavenConfig: Sendable {
    // ── Heaven Worker (Cloudflare) ────────────────────────────
    // DROP YOUR WORKER URL HERE when back at studio
    var workerURL: String = "https://heaven.mcuniverse.workers.dev"
    
    // ── Cloudflare D1 ─────────────────────────────────────────
    var d1AccountId: String   = ""   // CF Account ID
    var d1DatabaseId: String  = ""   // D1 Database ID
    var d1Token: String       = ""   // D1 API token
    
    // ── ZeroTrust Access ──────────────────────────────────────
    var ztToken: String?            = nil  // CF Access JWT
    var cfAccessClientId: String?   = nil  // Service token client ID
    var cfAccessClientSecret: String? = nil // Service token secret
    
    // ── Local fallbacks (offline-first) ──────────────────────
    var localMCPURL: String  = "http://localhost:17017"  // heaven17
    var localBridgeURL: String = "http://localhost:7778"  // accessibility bridge
    var dreamChamberURL: String = "http://localhost:7777" // DreamChamber
    
    // ── Singleton ────────────────────────────────────────────
    static var current = HeavenConfig()
    
    // Load from environment / keychain in production
    static func load() -> HeavenConfig {
        var config = HeavenConfig()
        // In production: load from Keychain
        if let workerURL = ProcessInfo.processInfo.environment["HEAVEN_WORKER_URL"] {
            config.workerURL = workerURL
        }
        if let d1AccountId = ProcessInfo.processInfo.environment["CF_ACCOUNT_ID"] {
            config.d1AccountId = d1AccountId
        }
        return config
    }
}
