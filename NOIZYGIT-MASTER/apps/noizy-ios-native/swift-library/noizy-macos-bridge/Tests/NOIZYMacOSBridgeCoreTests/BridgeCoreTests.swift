import Foundation
import Testing
@testable import NOIZYMacOSBridgeCore

@Suite("NOIZY macOS Bridge core")
struct BridgeCoreTests {
    @Test("BridgeConfig loads defaults and env overrides")
    func configLoad() {
        let config = BridgeConfig.load(
            processEnvironment: [
                "NOIZY_BRIDGE_ID": "test-bridge",
                "NOIZY_BRIDGE_PORT": "9799",
                "NOIZY_BRIDGE_REDACT_TEXT_VALUES": "false"
            ],
            arguments: ["bridge"]
        )

        #expect(config.bridgeId == "test-bridge")
        #expect(config.port == 9799)
        #expect(config.redactTextValues == false)
        #expect(config.bindHost == "127.0.0.1")
    }

    @Test("JSONValue round trips nested payloads")
    func jsonValueRoundTrip() throws {
        let value: JSONValue = .object([
            "name": .string("event"),
            "count": .int(3),
            "flags": .array([.bool(true), .null])
        ])
        let data = try JSONEncoder.noizy.encode(value)
        let decoded = try JSONDecoder.noizy.decode(JSONValue.self, from: data)
        #expect(decoded == value)
    }

    @Test("EventHub journals and spools events")
    func hubRecordsEvents() async throws {
        let root = temporaryDirectory()
        let journal = DurableEventJournal(url: root.appendingPathComponent("events.jsonl"))
        let deliveryQueue = DurableDeliveryQueue(
            directory: root.appendingPathComponent("pending", isDirectory: true),
            enabled: true
        )
        let hub = EventHub(journal: journal, deliveryQueue: deliveryQueue)
        let event = BridgeEvent(sequence: 1, source: "test", name: "unit")

        try await hub.record(event)

        let recent = await hub.recent(limit: 10)
        let pending = await deliveryQueue.pendingBatch(limit: 10)
        #expect(recent == [event])
        #expect(pending.map(\.event) == [event])

        await deliveryQueue.ack(pending)
        #expect(await deliveryQueue.pendingCount() == 0)
    }

    @Test("HTTPRequest parses query, headers, and body")
    func httpRequestParse() throws {
        let raw = """
        POST /events/test?limit=2 HTTP/1.1\r
        Host: localhost\r
        Authorization: Bearer abc\r
        Content-Length: 5\r
        \r
        hello
        """
        let request = try #require(HTTPRequest(data: Data(raw.utf8)))
        #expect(request.method == "POST")
        #expect(request.path == "/events/test")
        #expect(request.query["limit"] == "2")
        #expect(request.headers["authorization"] == "Bearer abc")
        #expect(String(data: request.body, encoding: .utf8) == "hello")
    }

    private func temporaryDirectory() -> URL {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent("noizy-macos-bridge-tests-\(UUID().uuidString)", isDirectory: true)
        try? FileManager.default.createDirectory(at: url, withIntermediateDirectories: true)
        return url
    }
}
