import Foundation

// ════════════════════════════════════════════════════════════
// HeavenWorkerBridge — Cloudflare Worker ↔ Swift
// Points to the 1427-line TS heaven worker.
// Config-driven: drop endpoint URLs in HeavenConfig.
// Offline-first: MCP engine handles locally, syncs to CF.
// ════════════════════════════════════════════════════════════

@MainActor
final class HeavenWorkerBridge: ObservableObject {
    static let shared = HeavenWorkerBridge()
    
    @Published var isConnected: Bool = false
    @Published var workerVersion: String = "unknown"
    @Published var lastSync: Date?
    
    private var config: HeavenConfig { HeavenConfig.current }
    private let proxy = ZeroTrustProxy.shared
    
    private init() {}
    
    // ════════════════════════════════════════════════════════
    // MARK: — Connect
    // ════════════════════════════════════════════════════════
    
    func connect() async {
        guard let url = URL(string: "\(config.workerURL)/health") else { return }
        
        do {
            let data = try await proxy.request(url: url)
            let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            workerVersion = json?["version"] as? String ?? "1.0"
            isConnected = true
            print("[Heaven] ✅ Worker connected: v\(workerVersion)")
        } catch {
            print("[Heaven] ⚠️ Worker unreachable — offline mode active")
            isConnected = false
        }
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Generic Call
    // ════════════════════════════════════════════════════════
    
    func call(endpoint: String, payload: [String: Any] = [:]) async -> String? {
        guard isConnected else {
            // Route to local fallback
            return await callLocal(endpoint: endpoint, payload: payload)
        }
        
        guard let url = URL(string: "\(config.workerURL)\(endpoint)") else { return nil }
        
        do {
            let body = try? JSONSerialization.data(withJSONObject: payload)
            let data = try await proxy.request(url: url, method: "POST", body: body)
            return String(data: data, encoding: .utf8)
        } catch {
            print("[Heaven] Call failed for \(endpoint): \(error)")
            // Fallback to local
            return await callLocal(endpoint: endpoint, payload: payload)
        }
    }
    
    private func callLocal(endpoint: String, payload: [String: Any]) async -> String? {
        guard let url = URL(string: "\(config.localMCPURL)\(endpoint)") else { return nil }
        
        do {
            let body = try? JSONSerialization.data(withJSONObject: payload)
            let (data, _) = try await URLSession.shared.data(
                for: makeRequest(url: url, method: "POST", body: body)
            )
            return String(data: data, encoding: .utf8)
        } catch {
            return "[Offline] Endpoint \(endpoint) unavailable"
        }
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Heaven Worker Endpoints
    // These mirror the TypeScript worker's route handlers.
    // ════════════════════════════════════════════════════════
    
    // ── Agent Execution ───────────────────────────────────────
    
    func runAgent(prompt: String, context: [String: Any] = [:]) async -> AgentResult {
        var payload: [String: Any] = ["prompt": prompt]
        payload.merge(context) { _, new in new }
        
        guard let result = await call(endpoint: "/agent/run", payload: payload) else {
            return AgentResult(output: "Agent unavailable", toolCalls: [], error: nil)
        }
        
        if let data = result.data(using: .utf8),
           let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
            return AgentResult(
                output: json["output"] as? String ?? result,
                toolCalls: json["toolCalls"] as? [[String: Any]] ?? [],
                error: nil
            )
        }
        
        return AgentResult(output: result, toolCalls: [], error: nil)
    }
    
    // ── Memory Sync (D1) ──────────────────────────────────────
    
    func syncMemoryToD1(entries: [MemoryEntry]) async -> Bool {
        guard isConnected else { return false }
        
        let payload: [String: Any] = [
            "entries": entries.map { $0.toJSON() },
            "source": "lucy-ios"
        ]
        
        let result = await call(endpoint: "/memory/sync", payload: payload)
        return result != nil
    }
    
    func pullMemoryFromD1() async -> [MemoryEntry] {
        guard isConnected else { return [] }
        
        guard let result = await call(endpoint: "/memory/all", payload: [:]),
              let data = result.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let entries = json["entries"] as? [[String: Any]] else {
            return []
        }
        
        return entries.compactMap { MemoryEntry(json: $0) }
    }
    
    // ── Creator Profile ───────────────────────────────────────
    
    func getProfile() async -> [String: Any]? {
        guard let result = await call(endpoint: "/profile/get", payload: [:]),
              let data = result.data(using: .utf8) else { return nil }
        return try? JSONSerialization.jsonObject(with: data) as? [String: Any]
    }
    
    func updateProfile(_ updates: [String: String]) async -> Bool {
        let result = await call(endpoint: "/profile/update", payload: updates)
        return result != nil
    }
    
    // ── MCP Relay (for cloud-side tool calls) ─────────────────
    
    func relayMCPCall(_ request: MCPRequest) async -> MCPResponse? {
        let payload: [String: Any] = [
            "method": request.method,
            "id": request.id.stringValue,
            "params": request.params ?? [:]
        ]
        
        guard let result = await call(endpoint: "/mcp/relay", payload: payload),
              let data = result.data(using: .utf8),
              let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] else {
            return nil
        }
        
        let id = MCPRequestID.string(json["id"] as? String ?? "0")
        if let resultData = json["result"] as? [String: Any] {
            return MCPResponse.result(id: id, result: resultData)
        }
        return nil
    }
    
    // ── Utility ───────────────────────────────────────────────
    
    private func makeRequest(url: URL, method: String, body: Data?) -> URLRequest {
        var req = URLRequest(url: url)
        req.httpMethod = method
        req.httpBody = body
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        return req
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — Supporting Types
// ════════════════════════════════════════════════════════════

struct AgentResult: Sendable {
    let output: String
    let toolCalls: [[String: Any]]
    let error: String?
}
