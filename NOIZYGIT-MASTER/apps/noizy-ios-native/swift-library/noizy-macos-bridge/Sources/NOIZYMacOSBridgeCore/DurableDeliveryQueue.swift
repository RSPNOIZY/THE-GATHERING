import Foundation

public struct PendingDelivery: Sendable {
    public var url: URL
    public var event: BridgeEvent
}

public actor DurableDeliveryQueue {
    private let directory: URL
    private let enabled: Bool
    private let encoder: JSONEncoder
    private let decoder: JSONDecoder

    public init(
        directory: URL,
        enabled: Bool,
        encoder: JSONEncoder = .noizy,
        decoder: JSONDecoder = .noizy
    ) {
        self.directory = directory
        self.enabled = enabled
        self.encoder = encoder
        self.decoder = decoder
    }

    public func enqueue(_ event: BridgeEvent) throws {
        guard enabled else { return }
        try FileManager.default.createDirectory(at: directory, withIntermediateDirectories: true)
        let safeId = event.id.replacingOccurrences(of: "/", with: "_")
        let basename = String(format: "%020llu-%@", event.sequence, safeId)
        let finalURL = directory.appendingPathComponent("\(basename).json")
        if FileManager.default.fileExists(atPath: finalURL.path) {
            return
        }
        let tempURL = directory.appendingPathComponent("\(basename).json.tmp")
        try encoder.encode(event).write(to: tempURL, options: .atomic)
        try FileManager.default.moveItem(at: tempURL, to: finalURL)
    }

    public func pendingBatch(limit: Int) -> [PendingDelivery] {
        guard enabled, limit > 0 else { return [] }
        guard let urls = try? FileManager.default.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: nil
        ) else {
            return []
        }
        return urls
            .filter { $0.pathExtension == "json" }
            .sorted { $0.lastPathComponent < $1.lastPathComponent }
            .prefix(limit)
            .compactMap { url in
                guard let data = try? Data(contentsOf: url),
                      let event = try? decoder.decode(BridgeEvent.self, from: data)
                else {
                    return nil
                }
                return PendingDelivery(url: url, event: event)
            }
    }

    public func ack(_ deliveries: [PendingDelivery]) {
        for delivery in deliveries {
            try? FileManager.default.removeItem(at: delivery.url)
        }
    }

    public func pendingCount() -> Int {
        guard enabled else { return 0 }
        guard let urls = try? FileManager.default.contentsOfDirectory(
            at: directory,
            includingPropertiesForKeys: nil
        ) else {
            return 0
        }
        return urls.filter { $0.pathExtension == "json" }.count
    }
}
