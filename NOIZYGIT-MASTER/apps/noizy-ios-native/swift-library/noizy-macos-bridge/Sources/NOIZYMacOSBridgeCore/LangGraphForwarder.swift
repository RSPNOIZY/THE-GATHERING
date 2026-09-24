import CryptoKit
import Foundation

public struct ForwarderSnapshot: Codable, Sendable, Equatable {
    public var enabled: Bool
    public var webhookURL: String?
    public var delivered: UInt64
    public var failedAttempts: UInt64
    public var lastSuccessAt: String?
    public var lastFailureAt: String?
    public var lastError: String?
}

public final class LangGraphForwarder: @unchecked Sendable {
    private let config: BridgeConfig
    private let deliveryQueue: DurableDeliveryQueue
    private let session: URLSession
    private let state = ForwarderState()
    private var task: Task<Void, Never>?

    public init(
        config: BridgeConfig,
        deliveryQueue: DurableDeliveryQueue,
        session: URLSession = .shared
    ) {
        self.config = config
        self.deliveryQueue = deliveryQueue
        self.session = session
    }

    deinit {
        task?.cancel()
    }

    public func start() {
        guard task == nil else { return }
        task = Task.detached(priority: .utility) { [config, deliveryQueue, session, state] in
            guard config.langGraphWebhookURL != nil else {
                await state.setEnabled(false, webhookURL: nil)
                return
            }
            await state.setEnabled(true, webhookURL: config.langGraphWebhookURL?.absoluteString)
            while !Task.isCancelled {
                await Self.drainOnce(
                    config: config,
                    deliveryQueue: deliveryQueue,
                    session: session,
                    state: state
                )
                try? await Task.sleep(nanoseconds: UInt64(config.flushIntervalMilliseconds) * 1_000_000)
            }
        }
    }

    public func snapshot() async -> ForwarderSnapshot {
        await state.snapshot()
    }

    private static func drainOnce(
        config: BridgeConfig,
        deliveryQueue: DurableDeliveryQueue,
        session: URLSession,
        state: ForwarderState
    ) async {
        guard let webhookURL = config.langGraphWebhookURL else {
            return
        }
        let batch = await deliveryQueue.pendingBatch(limit: config.batchSize)
        guard !batch.isEmpty else {
            return
        }

        do {
            let envelope = LangGraphEnvelope(
                bridgeId: config.bridgeId,
                version: BridgeConfig.version,
                sentAt: DateStamp.now(),
                events: batch.map(\.event)
            )
            let body = try JSONEncoder.noizy.encode(envelope)
            var request = URLRequest(url: webhookURL)
            request.httpMethod = "POST"
            request.httpBody = body
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.setValue("noizy-macos-bridge/\(BridgeConfig.version)", forHTTPHeaderField: "User-Agent")
            request.setValue(config.bridgeId, forHTTPHeaderField: "X-NOIZY-Bridge-Id")
            request.setValue("\(batch.count)", forHTTPHeaderField: "X-NOIZY-Event-Count")
            if let signature = hmac(body: body, secret: config.sharedSecret) {
                request.setValue(signature, forHTTPHeaderField: "X-NOIZY-Signature")
            }

            let (_, response) = try await session.data(for: request)
            guard let http = response as? HTTPURLResponse, (200..<300).contains(http.statusCode) else {
                let code = (response as? HTTPURLResponse)?.statusCode ?? -1
                throw ForwarderError.httpStatus(code)
            }

            await deliveryQueue.ack(batch)
            await state.markSuccess(count: UInt64(batch.count))
        } catch {
            await state.markFailure(error.localizedDescription)
        }
    }

    private static func hmac(body: Data, secret: String?) -> String? {
        guard let secret, !secret.isEmpty else { return nil }
        let key = SymmetricKey(data: Data(secret.utf8))
        let signature = HMAC<SHA256>.authenticationCode(for: body, using: key)
        let hex = signature.map { String(format: "%02x", $0) }.joined()
        return "sha256=\(hex)"
    }
}

private actor ForwarderState {
    private var snapshotValue = ForwarderSnapshot(
        enabled: false,
        webhookURL: nil,
        delivered: 0,
        failedAttempts: 0,
        lastSuccessAt: nil,
        lastFailureAt: nil,
        lastError: nil
    )

    func setEnabled(_ enabled: Bool, webhookURL: String?) {
        snapshotValue.enabled = enabled
        snapshotValue.webhookURL = webhookURL
    }

    func markSuccess(count: UInt64) {
        snapshotValue.delivered += count
        snapshotValue.lastSuccessAt = DateStamp.now()
        snapshotValue.lastError = nil
    }

    func markFailure(_ error: String) {
        snapshotValue.failedAttempts += 1
        snapshotValue.lastFailureAt = DateStamp.now()
        snapshotValue.lastError = error
    }

    func snapshot() -> ForwarderSnapshot {
        snapshotValue
    }
}

private struct LangGraphEnvelope: Codable, Sendable {
    var bridgeId: String
    var version: String
    var sentAt: String
    var events: [BridgeEvent]
}

private enum ForwarderError: LocalizedError {
    case httpStatus(Int)

    var errorDescription: String? {
        switch self {
        case .httpStatus(let code):
            return "LangGraph webhook returned HTTP \(code)"
        }
    }
}
