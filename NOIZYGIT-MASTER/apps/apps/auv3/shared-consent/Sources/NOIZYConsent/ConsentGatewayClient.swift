// ConsentGatewayClient.swift
// NOIZY Empire — Heaven Consent Gateway client for the AUv3 Consent HUD
//
// Async/await client. Hits Heaven's /v1/can_i_do endpoint with X-NOIZY-Key auth.
// Responses are cached locally in OfflineCache so the audio render thread NEVER
// blocks on network. The audio thread reads cached state; this client refreshes
// the cache off-thread.
//
// Spec: DREAMCHAMBER_5_FRESH_IDEAS.md §1
// Auth: .claude/rules/heaven-api.md (X-NOIZY-Key on every protected route)
// Doctrine: Never Clauses 1, 5, 6, 7 — enforced before audio passes

import Foundation

/// Configuration for the gateway client.
public struct ConsentGatewayConfig: Sendable {
    public let baseURL: URL
    public let apiKey: String
    public let actorId: String

    /// How long the audio thread can read stale cached state before refusing audio.
    /// Strict default: 30 seconds. After that, fail-closed unless an offline override is active.
    public let maxCacheAgeSeconds: TimeInterval

    public init(
        baseURL: URL,
        apiKey: String,
        actorId: String,
        maxCacheAgeSeconds: TimeInterval = 30
    ) {
        self.baseURL = baseURL
        self.apiKey = apiKey
        self.actorId = actorId
        self.maxCacheAgeSeconds = maxCacheAgeSeconds
    }

    /// Default config for local development against the Gabriel backend (no Heaven yet).
    public static let localDev = ConsentGatewayConfig(
        baseURL: URL(string: "http://127.0.0.1:9090")!,
        apiKey: "dev-key-not-for-production",
        actorId: "RSP_001"
    )
}

/// Result of a consent check.
public struct ConsentDecision: Codable, Sendable, Equatable {
    public enum Verdict: String, Codable, Sendable {
        case allow              // Green light — synthesis may proceed
        case deny               // Red light — fail-closed
        case offline            // Gateway unreachable — fall through to OfflineCache policy
    }

    public let verdict: Verdict
    public let token: ConsentToken?
    public let violations: [NeverClause]
    public let checkedAt: Date
    public let reason: String?
}

/// Errors from the gateway client.
public enum ConsentGatewayError: Error, Sendable {
    case missingApiKey
    case networkUnreachable
    case httpStatus(Int)
    case invalidResponse
    case timeout
}

/// Async client. Off-the-audio-thread. The audio thread reads OfflineCache instead.
public actor ConsentGatewayClient {
    public let config: ConsentGatewayConfig
    private let session: URLSession

    public init(config: ConsentGatewayConfig) {
        self.config = config
        let urlConfig = URLSessionConfiguration.default
        urlConfig.timeoutIntervalForRequest = 5
        urlConfig.timeoutIntervalForResource = 10
        self.session = URLSession(configuration: urlConfig)
    }

    /// Ask the gateway whether the actor may perform a given scope right now.
    /// Returns a ConsentDecision. NEVER throws — failures become `.offline` so the
    /// caller can apply the OfflineCache fail-mode policy uniformly.
    public func canIDo(scope: Scope, territory: String = "CA") async -> ConsentDecision {
        var components = URLComponents(url: config.baseURL.appendingPathComponent("/v1/can_i_do"), resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "actor_id", value: config.actorId),
            URLQueryItem(name: "scope", value: scope.rawValue),
            URLQueryItem(name: "territory", value: territory),
        ]
        guard let url = components?.url else {
            return ConsentDecision(verdict: .deny, token: nil, violations: [], checkedAt: Date(), reason: "invalid url")
        }

        var request = URLRequest(url: url)
        request.httpMethod = "GET"
        request.addValue(config.apiKey, forHTTPHeaderField: "X-NOIZY-Key")
        request.addValue("application/json", forHTTPHeaderField: "Accept")

        do {
            let (data, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse else {
                return ConsentDecision(verdict: .offline, token: nil, violations: [], checkedAt: Date(), reason: "non-http response")
            }
            switch http.statusCode {
            case 200:
                if let decoded = try? JSONDecoder.noizy.decode(ConsentDecision.self, from: data) {
                    return decoded
                }
                return ConsentDecision(verdict: .deny, token: nil, violations: [], checkedAt: Date(), reason: "invalid JSON")
            case 401, 403:
                return ConsentDecision(verdict: .deny, token: nil, violations: [], checkedAt: Date(), reason: "auth failure")
            case 404:
                // No token exists for this (actor, scope, territory). Default deny.
                return ConsentDecision(verdict: .deny, token: nil, violations: [.synthWithoutConsent], checkedAt: Date(), reason: "no token")
            default:
                return ConsentDecision(verdict: .offline, token: nil, violations: [], checkedAt: Date(), reason: "http \(http.statusCode)")
            }
        } catch {
            // Network unreachable, timeout, etc. — caller applies OfflineCache policy.
            return ConsentDecision(verdict: .offline, token: nil, violations: [], checkedAt: Date(), reason: "network: \(error.localizedDescription)")
        }
    }

    /// Health check — returns true if the gateway is reachable.
    public func health() async -> Bool {
        let url = config.baseURL.appendingPathComponent("/api/health")
        var request = URLRequest(url: url)
        request.timeoutInterval = 3
        do {
            let (_, response) = try await session.data(for: request)
            return (response as? HTTPURLResponse)?.statusCode == 200
        } catch {
            return false
        }
    }
}

extension JSONDecoder {
    static let noizy: JSONDecoder = {
        let d = JSONDecoder()
        d.dateDecodingStrategy = .iso8601
        return d
    }()
}
