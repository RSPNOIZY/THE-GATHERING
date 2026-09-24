import Foundation

actor HeavenAPI {
    static let shared = HeavenAPI()

    private var baseURL: String
    private var apiKey: String

    private init() {
        self.baseURL = UserDefaults.standard.string(forKey: "heaven_base_url")
            ?? "https://heaven.rsp-5f3.workers.dev"
        self.apiKey = UserDefaults.standard.string(forKey: "heaven_api_key") ?? ""
    }

    func configure(baseURL: String, apiKey: String) {
        self.baseURL = baseURL
        self.apiKey = apiKey
        UserDefaults.standard.set(baseURL, forKey: "heaven_base_url")
        // API key stored in Keychain in production — UserDefaults for dev
        UserDefaults.standard.set(apiKey, forKey: "heaven_api_key")
    }

    var currentBaseURL: String { baseURL }
    var isConfigured: Bool { !apiKey.isEmpty }

    // MARK: - Core Networking

    private func request(_ path: String, method: String = "GET", body: [String: Any]? = nil) async throws -> Data {
        guard let url = URL(string: "\(baseURL)\(path)") else {
            throw HeavenError.invalidURL
        }

        var req = URLRequest(url: url)
        req.httpMethod = method
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")

        if !apiKey.isEmpty {
            req.setValue(apiKey, forHTTPHeaderField: "X-Noizy-Key")
        }

        if let body {
            req.httpBody = try JSONSerialization.data(withJSONObject: body)
        }

        let (data, response) = try await URLSession.shared.data(for: req)

        guard let http = response as? HTTPURLResponse else {
            throw HeavenError.invalidResponse
        }

        if http.statusCode == 401 {
            throw HeavenError.unauthorized
        }

        if http.statusCode >= 400 {
            if let errResp = try? JSONDecoder().decode(APIResponse<String>.self, from: data) {
                throw HeavenError.serverError(errResp.error ?? "Unknown error")
            }
            throw HeavenError.serverError("HTTP \(http.statusCode)")
        }

        return data
    }

    // MARK: - Health

    func health() async throws -> HealthResponse {
        let data = try await request("/api/health")
        return try JSONDecoder().decode(HealthResponse.self, from: data)
    }

    // MARK: - Family

    func registerFamilyMember(email: String, displayName: String) async throws -> RegisterResponse {
        let data = try await request("/api/family/register", method: "POST", body: [
            "email": email,
            "display_name": displayName,
        ])
        return try JSONDecoder().decode(RegisterResponse.self, from: data)
    }

    func storeConsent(memberId: String, useCases: [String], beneficiaryIds: [String], expiresAt: String? = nil) async throws -> ConsentResponse {
        var body: [String: Any] = [
            "member_id": memberId,
            "use_cases": useCases,
            "beneficiary_ids": beneficiaryIds,
        ]
        if let expiresAt { body["expires_at"] = expiresAt }
        let data = try await request("/api/family/consent", method: "POST", body: body)
        return try JSONDecoder().decode(ConsentResponse.self, from: data)
    }

    // MARK: - Voice

    func registerVoice(memberId: String, fileRef: String, sampleRate: Int = 48000, bitDepth: Int = 32) async throws -> VoiceResponse {
        let data = try await request("/api/voice/register", method: "POST", body: [
            "member_id": memberId,
            "file_ref": fileRef,
            "sample_rate": sampleRate,
            "bit_depth": bitDepth,
        ])
        return try JSONDecoder().decode(VoiceResponse.self, from: data)
    }

    // MARK: - Messages

    func sendMessage(fromMemberId: String, toBeneficiaryIds: [String], messageType: String, fileRef: String) async throws -> MessageResponse {
        let data = try await request("/api/family/message", method: "POST", body: [
            "from_member_id": fromMemberId,
            "to_beneficiary_ids": toBeneficiaryIds,
            "message_type": messageType,
            "file_ref": fileRef,
        ])
        return try JSONDecoder().decode(MessageResponse.self, from: data)
    }

    // MARK: - Healing

    func logHealingSession(beneficiaryId: String, protocolType: String, frequencyHz: Double? = nil, durationSeconds: Int? = nil) async throws -> HealingSessionResponse {
        var body: [String: Any] = [
            "beneficiary_member_id": beneficiaryId,
            "protocol_type": protocolType,
            "consent_verified": true,
        ]
        if let frequencyHz { body["frequency_hz"] = frequencyHz }
        if let durationSeconds { body["duration_seconds"] = durationSeconds }
        let data = try await request("/api/heal/session", method: "POST", body: body)
        return try JSONDecoder().decode(HealingSessionResponse.self, from: data)
    }

    // MARK: - Gabriel Audit

    func gabrielEvents(actorId: String) async throws -> GabrielResponse {
        let data = try await request("/api/gabriel/\(actorId)")
        return try JSONDecoder().decode(GabrielResponse.self, from: data)
    }

    // MARK: - Signup (public)

    func signup(email: String) async throws {
        _ = try await request("/api/signup", method: "POST", body: ["email": email])
    }
}

// MARK: - Errors

enum HeavenError: LocalizedError {
    case invalidURL
    case invalidResponse
    case unauthorized
    case serverError(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid API URL"
        case .invalidResponse: return "Invalid response from Heaven"
        case .unauthorized: return "Unauthorized — check your API key"
        case .serverError(let msg): return "Heaven: \(msg)"
        }
    }
}
