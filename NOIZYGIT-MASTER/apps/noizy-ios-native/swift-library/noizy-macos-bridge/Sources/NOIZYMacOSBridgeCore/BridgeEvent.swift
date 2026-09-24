import Foundation

public struct BridgeEvent: Codable, Equatable, Identifiable, Sendable {
    public var id: String
    public var sequence: UInt64
    public var observedAt: String
    public var monotonicNanos: UInt64
    public var source: String
    public var name: String
    public var pid: Int32?
    public var bundleIdentifier: String?
    public var applicationName: String?
    public var elementRole: String?
    public var elementTitle: String?
    public var payload: [String: JSONValue]

    public init(
        id: String = UUID().uuidString,
        sequence: UInt64,
        observedAt: String = DateStamp.now(),
        monotonicNanos: UInt64 = DispatchTime.now().uptimeNanoseconds,
        source: String,
        name: String,
        pid: Int32? = nil,
        bundleIdentifier: String? = nil,
        applicationName: String? = nil,
        elementRole: String? = nil,
        elementTitle: String? = nil,
        payload: [String: JSONValue] = [:]
    ) {
        self.id = id
        self.sequence = sequence
        self.observedAt = observedAt
        self.monotonicNanos = monotonicNanos
        self.source = source
        self.name = name
        self.pid = pid
        self.bundleIdentifier = bundleIdentifier
        self.applicationName = applicationName
        self.elementRole = elementRole
        self.elementTitle = elementTitle
        self.payload = payload
    }
}

public actor EventSequencer {
    private var nextValue: UInt64 = 1

    public init() {}

    public func next() -> UInt64 {
        defer { nextValue += 1 }
        return nextValue
    }
}

public enum DateStamp {
    public static func now() -> String {
        string(from: Date())
    }

    public static func string(from date: Date) -> String {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter.string(from: date)
    }
}
