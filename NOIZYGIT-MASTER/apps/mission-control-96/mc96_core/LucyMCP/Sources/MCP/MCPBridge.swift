import Foundation
import JavaScriptCore

// ════════════════════════════════════════════════════════════
// MCPBridge — Central Nervous System
// Routes all MCP calls:
//   Local tools → MCPEngine (native Swift, zero latency)
//   Heaven tools → HeavenJSRuntime (JSC, on-device)
//   Cloud relay  → HeavenWorkerBridge (ZeroTrust, when online)
//
// Priority: Local → JSC → Cloud (graceful degradation)
// ════════════════════════════════════════════════════════════

@MainActor
final class MCPBridge: ObservableObject {
    static let shared = MCPBridge()
    
    // ── Components ────────────────────────────────────────────
    private let mcpEngine   = MCPEngine.shared
    private let jsRuntime   = HeavenJSRuntime.shared
    private let cloudBridge = HeavenWorkerBridge.shared
    private let agentMemory = AgentMemory.shared
    
    // ── State ─────────────────────────────────────────────────
    @Published var executionPath: ExecutionPath = .local
    @Published var callMetrics: CallMetrics = CallMetrics()
    @Published var isReady: Bool = false
    
    private init() {}
    
    // ════════════════════════════════════════════════════════
    // MARK: — Initialization
    // ════════════════════════════════════════════════════════
    
    func initialize() async {
        // Start native MCP engine (always)
        await mcpEngine.start()
        
        // Load JSC runtime with worker bundle
        do {
            try await jsRuntime.loadBundledWorker()
            print("[MCPBridge] ✅ JSC runtime loaded")
        } catch {
            print("[MCPBridge] ⚠️ JSC runtime failed: \(error) — native Swift fallback active")
        }
        
        // Register JSC-backed tools in the MCP engine
        await registerJSCTools()
        
        isReady = true
        print("[MCPBridge] ✅ Ready — \(mcpEngine.registeredTools.count) tools active")
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Primary Entry Point
    // ════════════════════════════════════════════════════════
    
    /// Main dispatch — routes MCP tool call through optimal path
    func dispatch(_ toolName: String, args: [String: Any]) async -> MCPBridgeResult {
        let start = Date()
        
        // 1. Try JSC (heaven worker, on-device)
        if jsRuntime.workerLoaded {
            do {
                let result = try await jsRuntime.executeToolCall(toolName: toolName, args: args)
                let ms = Date().timeIntervalSince(start) * 1000
                callMetrics.record(tool: toolName, path: .jsc, ms: ms, success: true)
                executionPath = .jsc
                return MCPBridgeResult(value: result, path: .jsc, latencyMs: ms)
            } catch {
                print("[MCPBridge] JSC failed: \(error) — trying native Swift")
            }
        }
        
        // 2. Try native Swift MCP engine
        let request = MCPRequest.tool(toolName, args: args)
        let response = await mcpEngine.handle(request)
        
        if response.error == nil {
            let ms = Date().timeIntervalSince(start) * 1000
            callMetrics.record(tool: toolName, path: .local, ms: ms, success: true)
            executionPath = .local
            return MCPBridgeResult(value: response.result ?? [:], path: .local, latencyMs: ms)
        }
        
        // 3. Try cloud (ZeroTrust, when online)
        if ZeroTrustProxy.shared.isConnected {
            let cloudResult = await cloudBridge.call(endpoint: "/mcp/\(toolName)", payload: args)
            let ms = Date().timeIntervalSince(start) * 1000
            callMetrics.record(tool: toolName, path: .cloud, ms: ms, success: cloudResult != nil)
            executionPath = .cloud
            return MCPBridgeResult(value: cloudResult ?? "No response", path: .cloud, latencyMs: ms)
        }
        
        // 4. Offline fallback
        let ms = Date().timeIntervalSince(start) * 1000
        callMetrics.record(tool: toolName, path: .local, ms: ms, success: false)
        return MCPBridgeResult(
            value: "[\(toolName)] Offline — running on local Swift MCP engine",
            path: .local,
            latencyMs: ms,
            error: "Cloud unavailable"
        )
    }
    
    /// Gabriel agent execution — primary Lucy command interface
    func gabrielExecute(prompt: String, context: [String: Any] = [:]) async -> String {
        var args = context
        args["prompt"] = prompt
        args["persona"] = "Lucy"
        args["model"] = "noizy-family-keeper"
        
        let result = await dispatch("gabrielExecute", args: args)
        
        if let dict = result.value as? [String: Any],
           let output = dict["output"] as? String {
            return output
        }
        
        return result.value as? String ?? "I'm processing that..."
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — JSC Tool Registration
    // Wires heaven worker's JS tools into the native MCP engine
    // ════════════════════════════════════════════════════════
    
    private func registerJSCTools() async {
        
        // Bridge: gabrie lExecue via JSC
        await mcpEngine.registerTool(MCPTool(
            name: "gabrielExecute",
            description: "Execute the heaven worker's Gabriel AI agent on-device via JSC",
            inputSchema: [
                "type": "object",
                "properties": [
                    "prompt":  ["type": "string"],
                    "model":   ["type": "string"],
                    "context": ["type": "object"]
                ],
                "required": ["prompt"]
            ]
        )) { args in
            if self.jsRuntime.workerLoaded {
                if let result = try? await self.jsRuntime.executeToolCall(toolName: "gabrielExecute", args: args),
                   let dict = result as? [String: Any],
                   let output = dict["output"] as? String {
                    return [MCPContent(type: .text, text: output)]
                }
            }
            // Swift fallback
            return [MCPContent(type: .text, text: "Gabriel: JSC runtime active. Heaven worker loading...")]
        }
        
        // Bridge: heaven worker fetch handler
        await mcpEngine.registerTool(MCPTool(
            name: "heavenFetch",
            description: "Execute heaven worker's fetch handler with a synthetic Request",
            inputSchema: [
                "type": "object",
                "properties": [
                    "path":    ["type": "string"],
                    "method":  ["type": "string"],
                    "body":    ["type": "object"]
                ],
                "required": ["path"]
            ]
        )) { args in
            let path   = args["path"] as? String ?? "/"
            let method = args["method"] as? String ?? "GET"
            
            let js = """
            (async () => {
                var req = new Request('\(HeavenConfig.current.workerURL)\(path)', {
                    method: '\(method)'
                });
                if (typeof __heavenExports.fetch === 'function') {
                    var resp = await __heavenExports.fetch(req, env, ctx_exec);
                    return await resp.text();
                }
                return 'No fetch handler';
            })()
            """
            
            let result = self.jsRuntime.evaluate(js)?.toString() ?? ""
            return [MCPContent(type: .text, text: result)]
        }
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — Supporting Types
// ════════════════════════════════════════════════════════════

enum ExecutionPath: String {
    case local = "Swift/Local"
    case jsc   = "JSC/Heaven"
    case cloud = "Cloud/ZT"
    
    var icon: String {
        switch self {
        case .local: return "swift"
        case .jsc:   return "terminal.fill"
        case .cloud: return "cloud.fill"
        }
    }
    
    var color: String {
        switch self {
        case .local: return "#FF9F0A"
        case .jsc:   return "#30D158"
        case .cloud: return "#0A84FF"
        }
    }
}

struct MCPBridgeResult: Sendable {
    let value: Any
    let path: ExecutionPath
    let latencyMs: Double
    var error: String? = nil
    
    var description: String {
        "[\(path.rawValue)] \(String(format: "%.0f", latencyMs))ms"
    }
}

struct CallMetrics: Sendable {
    var totalCalls: Int = 0
    var successRate: Double = 1.0
    var avgLatencyMs: Double = 0
    var pathDistribution: [ExecutionPath: Int] = [:]
    private var allLatencies: [Double] = []
    
    mutating func record(tool: String, path: ExecutionPath, ms: Double, success: Bool) {
        totalCalls += 1
        allLatencies.append(ms)
        avgLatencyMs = allLatencies.reduce(0, +) / Double(allLatencies.count)
        pathDistribution[path, default: 0] += 1
    }
}

// ── MCPRequest factory ────────────────────────────────────────

extension MCPRequest {
    static func tool(_ name: String, args: [String: Any]) -> MCPRequest {
        MCPRequest(
            jsonrpc: "2.0",
            id: .string(UUID().uuidString),
            method: "tools/call",
            params: ["name": name, "arguments": args]
        )
    }
}
