import Foundation

/// Connects to GABRIEL daemon on GOD machine (M2 Ultra)
final class GabrielClient: ObservableObject {

    // MARK: - Configuration
    // GOD machine on Tailscale / local network
    static let defaultHost = "10.90.90.10"
    static let port = 7777

    @Published var isConnected = false

    private var baseURL: URL {
        URL(string: "http://\(Self.defaultHost):\(Self.port)")!
    }

    // MARK: - LUCY Ask (text → response)
    func askLucy(text: String) async throws -> String {
        let url = baseURL.appendingPathComponent("agent/lucy/ask")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("LUCY-iPad/1.0", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 30

        let body: [String: Any] = ["text": text, "agent": "LUCY_001"]
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse, http.statusCode == 200 else {
            let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
            throw GabrielError.serverError(statusCode)
        }

        let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        guard let responseText = json?["response"] as? String else {
            throw GabrielError.noResponse
        }
        return responseText
    }

    // MARK: - Voice Upload (audio blob → pipeline)
    func uploadVoice(data: Data, mimeType: String = "audio/m4a") async throws -> String {
        let url = baseURL.appendingPathComponent("voice/upload")
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue(mimeType, forHTTPHeaderField: "Content-Type")
        request.setValue("LUCY-iPad/1.0", forHTTPHeaderField: "User-Agent")
        request.timeoutInterval = 60
        request.httpBody = data

        let (responseData, response) = try await URLSession.shared.data(for: request)

        guard let http = response as? HTTPURLResponse, (200...202).contains(http.statusCode) else {
            throw GabrielError.serverError((response as? HTTPURLResponse)?.statusCode ?? 0)
        }

        let json = try JSONSerialization.jsonObject(with: responseData) as? [String: Any]
        return json?["runId"] as? String ?? "unknown"
    }

    // MARK: - Health Check
    func checkHealth() async -> Bool {
        let url = baseURL.appendingPathComponent("health")
        do {
            let (data, response) = try await URLSession.shared.data(from: url)
            guard let http = response as? HTTPURLResponse, http.statusCode == 200 else { return false }
            let json = try JSONSerialization.jsonObject(with: data) as? [String: Any]
            let ok = json?["ok"] as? Bool ?? false
            await MainActor.run { self.isConnected = ok }
            return ok
        } catch {
            await MainActor.run { self.isConnected = false }
            return false
        }
    }
}

enum GabrielError: LocalizedError {
    case serverError(Int)
    case noResponse

    var errorDescription: String? {
        switch self {
        case .serverError(let code): return "GABRIEL returned status \(code)"
        case .noResponse: return "No response from LUCY"
        }
    }
}
