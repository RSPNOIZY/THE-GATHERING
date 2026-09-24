// Heaven — AIOrchestrator
// Routes messages to DreamChamber backend (Heaven or Lucy identity)

import Foundation

@MainActor
final class AIOrchestrator: ObservableObject {
    static let shared = AIOrchestrator()

    private var backendURL: String {
        UserDefaults.standard.string(forKey: "backendURL") ?? "http://localhost:8080"
    }

    private init() {}

    func sendMessage(_ message: String, identity: HeavenIdentity, history: [ChatMessage]) async throws -> String {
        let systemPrompt = identity == .heaven ? HeavenPrompts.heaven : HeavenPrompts.lucy

        let payload: [String: Any] = [
            "identity": identity.rawValue,
            "system": systemPrompt,
            "messages": history.suffix(20).map { ["role": $0.role.rawValue, "content": $0.content] } + [
                ["role": "user", "content": message]
            ]
        ]

        guard let url = URL(string: "\(backendURL)/api/chat") else {
            throw HeavenError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Heaven-iOS/1.0", forHTTPHeaderField: "User-Agent")
        request.httpBody = try JSONSerialization.data(withJSONObject: payload)
        request.timeoutInterval = 30

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let httpResponse = response as? HTTPURLResponse,
              (200...299).contains(httpResponse.statusCode) else {
            throw HeavenError.serverError
        }

        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let reply = json["reply"] as? String ?? json["content"] as? String ?? json["message"] as? String else {
            throw HeavenError.invalidResponse
        }

        return reply
    }
}

// MARK: - Network Service

final class HeavenNetworkService {
    static let shared = HeavenNetworkService()

    private var backendURL: String {
        UserDefaults.standard.string(forKey: "backendURL") ?? "http://localhost:8080"
    }

    func ping() async throws -> Bool {
        guard let url = URL(string: "\(backendURL)/health") else { return false }
        var request = URLRequest(url: url)
        request.timeoutInterval = 5
        let (_, response) = try await URLSession.shared.data(for: request)
        return (response as? HTTPURLResponse)?.statusCode == 200
    }
}

// MARK: - Errors

enum HeavenError: LocalizedError {
    case invalidURL
    case serverError
    case invalidResponse
    case unauthorized

    var errorDescription: String? {
        switch self {
        case .invalidURL:       return "Invalid backend URL"
        case .serverError:      return "Backend server error"
        case .invalidResponse:  return "Unexpected response format"
        case .unauthorized:     return "Authentication required"
        }
    }
}
