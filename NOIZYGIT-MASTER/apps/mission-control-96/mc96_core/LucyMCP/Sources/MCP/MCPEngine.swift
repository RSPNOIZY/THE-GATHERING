import Foundation
import Combine

// ════════════════════════════════════════════════════════════
// MCPEngine — Model Context Protocol, Native Swift
// All protocol handling on-device. Zero network latency.
// Wraps heaven worker's 1427-line TypeScript logic in Swift.
//
// MCP Spec: https://spec.modelcontextprotocol.io/
// Implements: Tools, Resources, Prompts, Sampling, Roots
// ════════════════════════════════════════════════════════════

@MainActor
final class MCPEngine: ObservableObject {
    static let shared = MCPEngine()
    
    // ── State ─────────────────────────────────────────────────
    @Published var status: MCPStatus = .idle
    @Published var activeSession: MCPSession?
    @Published var registeredTools: [MCPTool] = []
    @Published var registeredResources: [MCPResource] = []
    @Published var callLog: [MCPCallRecord] = []
    @Published var lastError: MCPError?
    
    // ── Internal ──────────────────────────────────────────────
    private var toolHandlers: [String: MCPToolHandler] = [:]
    private var resourceHandlers: [String: MCPResourceHandler] = [:]
    private var promptHandlers: [String: MCPPromptHandler] = [:]
    private var samplingHandler: MCPSamplingHandler?
    private let callQueue = DispatchQueue(label: "ai.noizy.lucy.mcp", qos: .userInitiated)
    private var cancellables = Set<AnyCancellable>()
    
    // ── Protocol Constants ────────────────────────────────────
    static let protocolVersion = "2024-11-05"
    static let serverName      = "lucy-heaven-worker"
    static let serverVersion   = "1.0.0"
    
    private init() {}
    
    // ════════════════════════════════════════════════════════
    // MARK: — Lifecycle
    // ════════════════════════════════════════════════════════
    
    func start() async {
        status = .starting
        
        // Register heaven worker's built-in tools
        await registerBuiltInTools()
        await registerBuiltInResources()
        await registerBuiltInPrompts()
        
        status = .running
        print("[MCP] ✅ Engine running — \(registeredTools.count) tools, \(registeredResources.count) resources")
    }
    
    func stop() {
        status = .idle
        activeSession = nil
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Tool Registration
    // ════════════════════════════════════════════════════════
    
    func registerTool(_ tool: MCPTool, handler: @escaping MCPToolHandler) {
        registeredTools.append(tool)
        toolHandlers[tool.name] = handler
    }
    
    func registerResource(_ resource: MCPResource, handler: @escaping MCPResourceHandler) {
        registeredResources.append(resource)
        resourceHandlers[resource.uri] = handler
    }
    
    func registerPrompt(_ prompt: MCPPrompt, handler: @escaping MCPPromptHandler) {
        promptHandlers[prompt.name] = handler
    }
    
    func registerSamplingHandler(_ handler: @escaping MCPSamplingHandler) {
        samplingHandler = handler
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — MCP Request Handling
    // ════════════════════════════════════════════════════════
    
    func handle(_ request: MCPRequest) async -> MCPResponse {
        let startTime = Date()
        
        do {
            let result = try await processRequest(request)
            let record = MCPCallRecord(request: request, response: result, duration: Date().timeIntervalSince(startTime))
            callLog.append(record)
            return result
        } catch let error as MCPError {
            lastError = error
            return MCPResponse.error(id: request.id, error: error)
        } catch {
            let mcpError = MCPError(code: -32603, message: error.localizedDescription)
            lastError = mcpError
            return MCPResponse.error(id: request.id, error: mcpError)
        }
    }
    
    private func processRequest(_ request: MCPRequest) async throws -> MCPResponse {
        switch request.method {
            
        // ── Lifecycle ─────────────────────────────────────
        case "initialize":
            return try await handleInitialize(request)
            
        case "ping":
            return MCPResponse.result(id: request.id, result: [:])
            
        // ── Tools ─────────────────────────────────────────
        case "tools/list":
            let tools = registeredTools.map { $0.toJSON() }
            return MCPResponse.result(id: request.id, result: ["tools": tools])
            
        case "tools/call":
            return try await handleToolCall(request)
            
        // ── Resources ─────────────────────────────────────
        case "resources/list":
            let resources = registeredResources.map { $0.toJSON() }
            return MCPResponse.result(id: request.id, result: ["resources": resources])
            
        case "resources/read":
            return try await handleResourceRead(request)
            
        case "resources/subscribe":
            return try await handleResourceSubscribe(request)
            
        // ── Prompts ───────────────────────────────────────
        case "prompts/list":
            let prompts = promptHandlers.keys.map { ["name": $0] }
            return MCPResponse.result(id: request.id, result: ["prompts": prompts])
            
        case "prompts/get":
            return try await handlePromptGet(request)
            
        // ── Sampling ──────────────────────────────────────
        case "sampling/createMessage":
            return try await handleSampling(request)
            
        // ── Roots (iPad filesystem roots) ─────────────────
        case "roots/list":
            return handleRootsList(request)
            
        default:
            throw MCPError(code: -32601, message: "Method not found: \(request.method)")
        }
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Handler Implementations
    // ════════════════════════════════════════════════════════
    
    private func handleInitialize(_ request: MCPRequest) async throws -> MCPResponse {
        let session = MCPSession(request: request)
        activeSession = session
        
        let result: [String: Any] = [
            "protocolVersion": MCPEngine.protocolVersion,
            "capabilities": [
                "tools": ["listChanged": true],
                "resources": ["subscribe": true, "listChanged": true],
                "prompts": ["listChanged": true],
                "sampling": [:],
                "roots": ["listChanged": false],
                "logging": [:]
            ],
            "serverInfo": [
                "name": MCPEngine.serverName,
                "version": MCPEngine.serverVersion
            ]
        ]
        return MCPResponse.result(id: request.id, result: result)
    }
    
    private func handleToolCall(_ request: MCPRequest) async throws -> MCPResponse {
        guard let params = request.params,
              let name = params["name"] as? String else {
            throw MCPError(code: -32602, message: "Invalid params: missing tool name")
        }
        
        guard let handler = toolHandlers[name] else {
            throw MCPError(code: -32602, message: "Unknown tool: \(name)")
        }
        
        let args = params["arguments"] as? [String: Any] ?? [:]
        let content = try await handler(args)
        
        return MCPResponse.result(id: request.id, result: [
            "content": content.map { $0.toJSON() },
            "isError": false
        ])
    }
    
    private func handleResourceRead(_ request: MCPRequest) async throws -> MCPResponse {
        guard let params = request.params,
              let uri = params["uri"] as? String else {
            throw MCPError(code: -32602, message: "Invalid params: missing uri")
        }
        
        // Find best matching handler
        let handler = resourceHandlers[uri] ?? resourceHandlers.first(where: {
            uri.hasPrefix($0.key.replacingOccurrences(of: "*", with: ""))
        })?.value
        
        guard let handler else {
            throw MCPError(code: -32002, message: "Resource not found: \(uri)")
        }
        
        let content = try await handler(uri)
        return MCPResponse.result(id: request.id, result: ["contents": [content.toJSON()]])
    }
    
    private func handleResourceSubscribe(_ request: MCPRequest) async throws -> MCPResponse {
        // Subscribe to resource change notifications
        return MCPResponse.result(id: request.id, result: [:])
    }
    
    private func handlePromptGet(_ request: MCPRequest) async throws -> MCPResponse {
        guard let params = request.params,
              let name = params["name"] as? String else {
            throw MCPError(code: -32602, message: "Invalid params: missing prompt name")
        }
        guard let handler = promptHandlers[name] else {
            throw MCPError(code: -32602, message: "Unknown prompt: \(name)")
        }
        let args = params["arguments"] as? [String: String] ?? [:]
        let result = try await handler(args)
        return MCPResponse.result(id: request.id, result: result)
    }
    
    private func handleSampling(_ request: MCPRequest) async throws -> MCPResponse {
        guard let handler = samplingHandler else {
            throw MCPError(code: -32603, message: "No sampling handler registered")
        }
        guard let params = request.params else {
            throw MCPError(code: -32602, message: "Invalid params")
        }
        let result = try await handler(params)
        return MCPResponse.result(id: request.id, result: result)
    }
    
    private func handleRootsList(_ request: MCPRequest) -> MCPResponse {
        let roots: [[String: Any]] = [
            ["uri": "file:///", "name": "iPad Local Storage"],
            ["uri": "heaven://agent/", "name": "Heaven Agent Context"],
            ["uri": "d1://memory/", "name": "Cloudflare D1 Memory"],
            ["uri": "airplay://devices/", "name": "AirPlay Devices"]
        ]
        return MCPResponse.result(id: request.id, result: ["roots": roots])
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Built-in Heaven Worker Tools
    // Mirrors the 1427-line TypeScript heaven worker
    // Drop in heaven's endpoint URLs via HeavenConfig
    // ════════════════════════════════════════════════════════
    
    private func registerBuiltInTools() async {
        
        // ── Memory Tools (D1) ─────────────────────────────
        registerTool(MCPTool(
            name: "memory_store",
            description: "Store a memory or fact in Lucy's persistent D1 memory",
            inputSchema: [
                "type": "object",
                "properties": [
                    "key":     ["type": "string", "description": "Memory key"],
                    "value":   ["type": "string", "description": "Memory value"],
                    "ttl":     ["type": "integer", "description": "TTL in seconds (optional)"]
                ],
                "required": ["key", "value"]
            ]
        )) { args in
            let key = args["key"] as? String ?? ""
            let value = args["value"] as? String ?? ""
            let ttl = args["ttl"] as? Int
            await AgentMemory.shared.store(key: key, value: value, ttl: ttl)
            return [MCPContent(type: .text, text: "Stored: \(key)")]
        }
        
        registerTool(MCPTool(
            name: "memory_retrieve",
            description: "Retrieve a memory from Lucy's D1 memory store",
            inputSchema: [
                "type": "object",
                "properties": [
                    "key": ["type": "string", "description": "Memory key to retrieve"]
                ],
                "required": ["key"]
            ]
        )) { args in
            let key = args["key"] as? String ?? ""
            let value = await AgentMemory.shared.retrieve(key: key)
            return [MCPContent(type: .text, text: value ?? "Not found")]
        }
        
        registerTool(MCPTool(
            name: "memory_search",
            description: "Semantic search through Lucy's memory",
            inputSchema: [
                "type": "object",
                "properties": [
                    "query":  ["type": "string"],
                    "limit":  ["type": "integer", "default": 10]
                ],
                "required": ["query"]
            ]
        )) { args in
            let query = args["query"] as? String ?? ""
            let limit = args["limit"] as? Int ?? 10
            let results = await AgentMemory.shared.search(query: query, limit: limit)
            let text = results.map { "• \($0.key): \($0.value)" }.joined(separator: "\n")
            return [MCPContent(type: .text, text: text.isEmpty ? "No results" : text)]
        }
        
        // ── Creator Profile Tools ─────────────────────────
        registerTool(MCPTool(
            name: "profile_get",
            description: "Get Lucy's current creator profile and preferences",
            inputSchema: ["type": "object", "properties": [:]]
        )) { _ in
            let profile = await AgentMemory.shared.getProfile()
            return [MCPContent(type: .text, text: profile.toJSON())]
        }
        
        registerTool(MCPTool(
            name: "profile_update",
            description: "Update Lucy's creator profile",
            inputSchema: [
                "type": "object",
                "properties": [
                    "field": ["type": "string"],
                    "value": ["type": "string"]
                ],
                "required": ["field", "value"]
            ]
        )) { args in
            let field = args["field"] as? String ?? ""
            let value = args["value"] as? String ?? ""
            await AgentMemory.shared.updateProfile(field: field, value: value)
            return [MCPContent(type: .text, text: "Profile updated: \(field)")]
        }
        
        // ── AirPlay Tools ─────────────────────────────────
        registerTool(MCPTool(
            name: "airplay_discover",
            description: "Discover AirPlay devices on the local network",
            inputSchema: ["type": "object", "properties": [:]]
        )) { _ in
            let devices = await AirPlayRouter.shared.discover()
            let text = devices.map { "• \($0.name) [\($0.type)] \($0.isConnected ? "✅" : "○")" }
                             .joined(separator: "\n")
            return [MCPContent(type: .text, text: text.isEmpty ? "No devices found" : text)]
        }
        
        registerTool(MCPTool(
            name: "airplay_stream",
            description: "Stream audio to an AirPlay device",
            inputSchema: [
                "type": "object",
                "properties": [
                    "device_id": ["type": "string"],
                    "volume":    ["type": "number", "minimum": 0, "maximum": 1]
                ],
                "required": ["device_id"]
            ]
        )) { args in
            let deviceId = args["device_id"] as? String ?? ""
            let volume   = args["volume"] as? Double ?? 0.8
            let success  = await AirPlayRouter.shared.streamTo(deviceId: deviceId, volume: volume)
            return [MCPContent(type: .text, text: success ? "Streaming to \(deviceId)" : "Failed to connect")]
        }
        
        // ── Network / VPN Tools ───────────────────────────
        registerTool(MCPTool(
            name: "tunnel_status",
            description: "Check ZeroTrust + VPN tunnel status",
            inputSchema: ["type": "object", "properties": [:]]
        )) { _ in
            let status = await ZeroTrustProxy.shared.statusReport()
            return [MCPContent(type: .text, text: status)]
        }
        
        // ── Heaven Worker Tool (Cloud bridge) ─────────────
        registerTool(MCPTool(
            name: "heaven_call",
            description: "Call heaven worker endpoint directly (requires network)",
            inputSchema: [
                "type": "object",
                "properties": [
                    "endpoint": ["type": "string", "description": "Heaven worker endpoint path"],
                    "payload":  ["type": "object", "description": "Request payload"]
                ],
                "required": ["endpoint"]
            ]
        )) { args in
            let endpoint = args["endpoint"] as? String ?? ""
            let payload  = args["payload"] as? [String: Any] ?? [:]
            let result   = await HeavenWorkerBridge.shared.call(endpoint: endpoint, payload: payload)
            return [MCPContent(type: .text, text: result ?? "No response")]
        }
    }
    
    private func registerBuiltInResources() async {
        
        // Agent memory as a readable resource
        registerResource(MCPResource(
            uri: "d1://memory/all",
            name: "Agent Memory",
            description: "All of Lucy's stored memories",
            mimeType: "application/json"
        )) { _ in
            let all = await AgentMemory.shared.all()
            let json = try? JSONSerialization.data(withJSONObject: all)
            let text = json.flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
            return MCPResourceContent(uri: "d1://memory/all", mimeType: "application/json", text: text)
        }
        
        // Creator profile resource
        registerResource(MCPResource(
            uri: "heaven://agent/profile",
            name: "Lucy Creator Profile",
            description: "Lucy's creator identity and preferences",
            mimeType: "application/json"
        )) { _ in
            let profile = await AgentMemory.shared.getProfile()
            return MCPResourceContent(uri: "heaven://agent/profile", mimeType: "application/json", text: profile.toJSON())
        }
        
        // AirPlay devices resource
        registerResource(MCPResource(
            uri: "airplay://devices/list",
            name: "AirPlay Devices",
            description: "All discovered AirPlay devices",
            mimeType: "application/json"
        )) { _ in
            let devices = await AirPlayRouter.shared.discover()
            let json = devices.map { $0.toJSON() }
            let data = try? JSONSerialization.data(withJSONObject: json)
            let text = data.flatMap { String(data: $0, encoding: .utf8) } ?? "[]"
            return MCPResourceContent(uri: "airplay://devices/list", mimeType: "application/json", text: text)
        }
    }
    
    private func registerBuiltInPrompts() async {
        promptHandlers["lucy_system"] = { _ in
            return [
                "description": "Lucy's system prompt for heaven worker",
                "messages": [[
                    "role": "user",
                    "content": [
                        "type": "text",
                        "text": """
                        You are Lucy, a warm and expressive AI creative companion running locally on an iPad \
                        as part of the NOIZY Empire's DreamChamber. You have full access to heaven worker \
                        tools via MCP and can store/retrieve memories in Cloudflare D1. You run offline-first \
                        and sync to the cloud when available via ZeroTrust.
                        """
                    ]
                ]]
            ]
        }
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — MCP Type System
// ════════════════════════════════════════════════════════════

// ── Request / Response ─────────────────────────────────────

struct MCPRequest: Codable, Sendable {
    let jsonrpc: String
    let id: MCPRequestID
    let method: String
    let params: [String: Any]?
    
    enum CodingKeys: String, CodingKey { case jsonrpc, id, method, params }
    
    init(from decoder: Decoder) throws {
        let c = try decoder.container(keyedBy: CodingKeys.self)
        jsonrpc = try c.decode(String.self, forKey: .jsonrpc)
        id = try c.decode(MCPRequestID.self, forKey: .id)
        method = try c.decode(String.self, forKey: .method)
        // Decode params as raw JSON
        if let paramsData = try? c.decodeIfPresent(Data.self, forKey: .params) {
            params = try? JSONSerialization.jsonObject(with: paramsData) as? [String: Any]
        } else {
            params = nil
        }
    }
    
    func encode(to encoder: Encoder) throws {
        var c = encoder.container(keyedBy: CodingKeys.self)
        try c.encode(jsonrpc, forKey: .jsonrpc)
        try c.encode(id, forKey: .id)
        try c.encode(method, forKey: .method)
    }
}

enum MCPRequestID: Codable, Sendable {
    case string(String)
    case int(Int)
    
    init(from decoder: Decoder) throws {
        let c = try decoder.singleValueContainer()
        if let s = try? c.decode(String.self) { self = .string(s) }
        else { self = .int(try c.decode(Int.self)) }
    }
    func encode(to encoder: Encoder) throws {
        var c = encoder.singleValueContainer()
        switch self {
        case .string(let s): try c.encode(s)
        case .int(let i):    try c.encode(i)
        }
    }
    var stringValue: String {
        switch self { case .string(let s): return s; case .int(let i): return "\(i)" }
    }
}

struct MCPResponse: Sendable {
    let id: MCPRequestID
    let result: [String: Any]?
    let error: MCPError?
    
    static func result(id: MCPRequestID, result: [String: Any]) -> MCPResponse {
        MCPResponse(id: id, result: result, error: nil)
    }
    static func error(id: MCPRequestID, error: MCPError) -> MCPResponse {
        MCPResponse(id: id, result: nil, error: error)
    }
    
    func toJSON() -> [String: Any] {
        var j: [String: Any] = ["jsonrpc": "2.0"]
        switch id { case .int(let i): j["id"] = i; case .string(let s): j["id"] = s }
        if let r = result { j["result"] = r }
        if let e = error  { j["error"] = ["code": e.code, "message": e.message] }
        return j
    }
}

struct MCPError: Error, Sendable {
    let code: Int
    let message: String
}

// ── Tools ───────────────────────────────────────────────────

struct MCPTool: Identifiable, Sendable {
    let id = UUID()
    let name: String
    let description: String
    let inputSchema: [String: Any]
    
    func toJSON() -> [String: Any] {
        ["name": name, "description": description, "inputSchema": inputSchema]
    }
}

// ── Resources ───────────────────────────────────────────────

struct MCPResource: Identifiable, Sendable {
    let id = UUID()
    let uri: String
    let name: String
    let description: String
    let mimeType: String
    
    func toJSON() -> [String: Any] {
        ["uri": uri, "name": name, "description": description, "mimeType": mimeType]
    }
}

struct MCPPrompt: Sendable {
    let name: String
    let description: String
}

struct MCPResourceContent: Sendable {
    let uri: String
    let mimeType: String
    let text: String
    
    func toJSON() -> [String: Any] {
        ["uri": uri, "mimeType": mimeType, "text": text]
    }
}

// ── Content ─────────────────────────────────────────────────

struct MCPContent: Sendable {
    enum ContentType: String, Sendable { case text, image, resource }
    let type: ContentType
    let text: String?
    let data: Data?
    
    init(type: ContentType, text: String) {
        self.type = type; self.text = text; self.data = nil
    }
    
    func toJSON() -> [String: Any] {
        var j: [String: Any] = ["type": type.rawValue]
        if let t = text  { j["text"] = t }
        if let d = data  { j["data"] = d.base64EncodedString() }
        return j
    }
}

// ── Session ─────────────────────────────────────────────────

final class MCPSession: @unchecked Sendable {
    let id: UUID = UUID()
    let startTime: Date = Date()
    var clientInfo: [String: Any] = [:]
    
    init(request: MCPRequest) {
        if let params = request.params {
            clientInfo = params["clientInfo"] as? [String: Any] ?? [:]
        }
    }
}

// ── Call Record ──────────────────────────────────────────────

struct MCPCallRecord: Identifiable, Sendable {
    let id = UUID()
    let request: MCPRequest
    let response: MCPResponse
    let duration: TimeInterval
    let timestamp = Date()
}

// ── Status ───────────────────────────────────────────────────

enum MCPStatus: String, Sendable {
    case idle, starting, running, error
    
    var color: String {
        switch self {
        case .idle:     return "gray"
        case .starting: return "yellow"
        case .running:  return "green"
        case .error:    return "red"
        }
    }
}

// ── Handler Types ────────────────────────────────────────────

typealias MCPToolHandler     = ([String: Any]) async throws -> [MCPContent]
typealias MCPResourceHandler = (String) async throws -> MCPResourceContent
typealias MCPPromptHandler   = ([String: String]) async throws -> [String: Any]
typealias MCPSamplingHandler = ([String: Any]) async throws -> [String: Any]
