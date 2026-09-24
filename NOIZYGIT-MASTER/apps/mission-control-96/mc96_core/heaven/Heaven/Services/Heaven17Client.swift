import Foundation

// ═══════════════════════════════════════════════════════════
// Heaven17Client — Connects Swift app to heaven17 backend
// Routes: App → heaven17(:17017) → Ollama → DreamChamber
// ═══════════════════════════════════════════════════════════

final class Heaven17Client: @unchecked Sendable {
    static let shared = Heaven17Client()
    
    private var baseURL: String = "http://localhost:17017"
    private let session: URLSession
    
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = 30
        config.timeoutIntervalForResource = 60
        self.session = URLSession(configuration: config)
    }
    
    func configure(baseURL: String) {
        self.baseURL = baseURL
    }
    
    // ── Health Check ──────────────────────────────────────────
    
    func checkHealth() async -> Heaven17Status? {
        guard let url = URL(string: "\(baseURL)/health") else { return nil }
        
        do {
            let (data, _) = try await session.data(from: url)
            return try? JSONDecoder().decode(Heaven17Status.self, from: data)
        } catch {
            return nil
        }
    }
    
    // ── Voice Processing ──────────────────────────────────────
    
    func processVoice(transcript: String, device: Int = 4) async -> String? {
        guard let url = URL(string: "\(baseURL)/v1/voice") else { return nil }
        
        let payload = VoiceRequest(transcript: transcript, device: device)
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(payload)
        
        do {
            let (data, _) = try await session.data(for: request)
            let response = try JSONDecoder().decode(VoiceResponse.self, from: data)
            return response.response
        } catch {
            print("[Heaven17] Voice processing failed: \(error)")
            return nil
        }
    }
    
    // ── AI Completion ─────────────────────────────────────────
    
    func complete(prompt: String, model: String = "noizy-gabriel-mind") async -> String? {
        guard let url = URL(string: "\(baseURL)/v1/complete") else { return nil }
        
        let payload = CompletionRequest(model: model, prompt: prompt)
        
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.httpBody = try? JSONEncoder().encode(payload)
        
        do {
            let (data, _) = try await session.data(for: request)
            let response = try JSONDecoder().decode(CompletionResponse.self, from: data)
            return response.response
        } catch {
            return nil
        }
    }
    
    // ── Models ────────────────────────────────────────────────
    
    func fetchModels() async -> [Heaven17Model] {
        guard let url = URL(string: "\(baseURL)/models") else { return [] }
        
        do {
            let (data, _) = try await session.data(from: url)
            let response = try JSONDecoder().decode(ModelsResponse.self, from: data)
            return response.models
        } catch {
            return []
        }
    }
}

// ── Network Models ────────────────────────────────────────────

struct Heaven17Status: Codable {
    let server: String
    let version: String
    let status: String
    let capabilities: [String]
    let ollama: OllamaInfo?
    
    struct OllamaInfo: Codable {
        let version: String
    }
}

struct VoiceRequest: Codable {
    let transcript: String
    let device: Int
    let user: String
    let context: String
    
    init(transcript: String, device: Int = 4) {
        self.transcript = transcript
        self.device = device
        self.user = "RSP"
        self.context = "heaven-ios"
    }
}

struct VoiceResponse: Codable {
    let transcript: String?
    let response: String?
    let status: String?
}

struct CompletionRequest: Codable {
    let model: String
    let prompt: String
}

struct CompletionResponse: Codable {
    let response: String
    let model: String
}

struct Heaven17Model: Codable, Identifiable {
    var id: String { modelId }
    let modelId: String
    let type: String
    let status: String
    
    enum CodingKeys: String, CodingKey {
        case modelId = "id"
        case type, status
    }
}

struct ModelsResponse: Codable {
    let models: [Heaven17Model]
}
