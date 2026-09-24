// Lucy — API Client
// Connects to Heaven Worker via Cloudflare Tunnel → lucy.noizy.ai
// Fallback: localhost:8081 (Docker Express)

import Foundation

@MainActor
final class LucyClient: ObservableObject {
    static let shared = LucyClient()

    @Published var isConnected: Bool = false
    @Published var isLoading: Bool = false
    @Published var lastError: String?

    private let session: URLSession

    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 120
        self.session = URLSession(configuration: config)
    }

    // ── Connect & Health Check ───────────────────────────────

    func connect() async {
        let state = LucyState.shared
        state.connectionStatus = .connecting

        guard let url = URL(string: "\(state.effectiveURL)/health") else {
            state.connectionStatus = .error("Invalid URL")
            return
        }

        do {
            let (data, response) = try await session.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
                state.connectionStatus = .disconnected
                return
            }
            let health = try JSONDecoder().decode(HealthResponse.self, from: data)
            isConnected = health.status == "healthy"
            state.connectionStatus = isConnected ? .connected : .disconnected
        } catch {
            state.connectionStatus = .error(error.localizedDescription)
            isConnected = false

            // Fallback: try localhost if tunnel fails
            if state.useTunnel {
                state.useTunnel = false
                await connect()
            }
        }
    }

    // ── Send Message ─────────────────────────────────────────

    func sendMessage(_ text: String, history: [LucyMessage]) async throws -> String {
        let state = LucyState.shared
        guard let url = URL(string: "\(state.effectiveURL)/api/chat") else {
            throw LucyError.invalidURL
        }

        isLoading = true
        defer { isLoading = false }

        let payload = ChatRequest(
            messages: history.map { msg in
                ChatRequest.Message(
                    role: msg.role.rawValue,
                    content: msg.content
                )
            } + [ChatRequest.Message(role: "user", content: text)],
            identity: "lucy"
        )

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try JSONEncoder().encode(payload)

        let (data, response) = try await session.data(for: request)

        guard let http = response as? HTTPURLResponse else {
            throw LucyError.networkError("Not HTTP")
        }

        guard http.statusCode == 200 else {
            throw LucyError.serverError(http.statusCode)
        }

        let chatResponse = try JSONDecoder().decode(ChatResponse.self, from: data)
        lastError = nil
        return chatResponse.reply
    }

    // ── Who Am I ─────────────────────────────────────────────

    func whoami() async -> WhoAmIResponse? {
        let state = LucyState.shared
        guard let url = URL(string: "\(state.effectiveURL)/api/whoami") else { return nil }

        do {
            let (data, _) = try await session.data(from: url)
            return try JSONDecoder().decode(WhoAmIResponse.self, from: data)
        } catch {
            return nil
        }
    }
}

// ── Network Models ───────────────────────────────────────────

struct HealthResponse: Codable {
    let service: String
    let status: String
    let identity: String?
    let version: String?
}

struct ChatRequest: Codable {
    let messages: [Message]
    let identity: String

    struct Message: Codable {
        let role: String
        let content: String
    }
}

struct ChatResponse: Codable {
    let reply: String
    let identity: String?
    let model: String?
    let user: String?
}

struct WhoAmIResponse: Codable {
    let identity: String
    let user: UserInfo?
    let timestamp: String?

    struct UserInfo: Codable {
        let email: String?
        let sub: String?
    }
}

enum LucyError: LocalizedError {
    case invalidURL
    case networkError(String)
    case serverError(Int)
    case decodingError

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid server URL"
        case .networkError(let msg): return "Network error: \(msg)"
        case .serverError(let code): return "Server error: \(code)"
        case .decodingError: return "Could not understand server response"
        }
    }
}
