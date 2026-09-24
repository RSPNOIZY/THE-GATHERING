import Foundation

public struct EventHubSnapshot: Codable, Sendable, Equatable {
    public var bootTime: String
    public var received: UInt64
    public var subscribers: Int
    public var recentInMemory: Int
}

public actor EventHub {
    private let journal: DurableEventJournal
    private let deliveryQueue: DurableDeliveryQueue
    private let recentLimit: Int
    private var recentEvents: [BridgeEvent] = []
    private var subscribers: [UUID: AsyncStream<BridgeEvent>.Continuation] = [:]
    private var received: UInt64 = 0
    private let bootTime = DateStamp.now()

    public init(
        journal: DurableEventJournal,
        deliveryQueue: DurableDeliveryQueue,
        recentLimit: Int = 500
    ) {
        self.journal = journal
        self.deliveryQueue = deliveryQueue
        self.recentLimit = recentLimit
    }

    public func record(_ event: BridgeEvent) async throws {
        try await journal.append(event)
        try await deliveryQueue.enqueue(event)
        received += 1
        recentEvents.append(event)
        if recentEvents.count > recentLimit {
            recentEvents.removeFirst(recentEvents.count - recentLimit)
        }
        for subscriber in subscribers.values {
            subscriber.yield(event)
        }
    }

    public func recent(limit: Int) async -> [BridgeEvent] {
        if limit <= recentEvents.count {
            return Array(recentEvents.suffix(limit))
        }
        return await journal.recent(limit: limit)
    }

    public func stream(replay count: Int = 0) -> AsyncStream<BridgeEvent> {
        let id = UUID()
        let replayEvents = Array(recentEvents.suffix(max(0, count)))
        return AsyncStream { continuation in
            for event in replayEvents {
                continuation.yield(event)
            }
            subscribers[id] = continuation
            continuation.onTermination = { @Sendable _ in
                Task { await self.removeSubscriber(id) }
            }
        }
    }

    public func snapshot() -> EventHubSnapshot {
        EventHubSnapshot(
            bootTime: bootTime,
            received: received,
            subscribers: subscribers.count,
            recentInMemory: recentEvents.count
        )
    }

    private func removeSubscriber(_ id: UUID) {
        subscribers[id] = nil
    }
}
