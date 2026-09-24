import Foundation
@preconcurrency import Network

public final class HTTPServer: @unchecked Sendable {
    private let config: BridgeConfig
    private let hub: EventHub
    private let deliveryQueue: DurableDeliveryQueue
    private let forwarder: LangGraphForwarder
    private let sequencer: EventSequencer
    private let queue = DispatchQueue(label: "ai.noizy.macos-bridge.http", qos: .userInitiated)
    private var listener: NWListener?

    public init(
        config: BridgeConfig,
        hub: EventHub,
        deliveryQueue: DurableDeliveryQueue,
        forwarder: LangGraphForwarder,
        sequencer: EventSequencer
    ) {
        self.config = config
        self.hub = hub
        self.deliveryQueue = deliveryQueue
        self.forwarder = forwarder
        self.sequencer = sequencer
    }

    public func start() throws {
        let port = NWEndpoint.Port(rawValue: config.port) ?? 9788
        let parameters = NWParameters.tcp
        parameters.allowLocalEndpointReuse = true
        parameters.requiredLocalEndpoint = .hostPort(
            host: NWEndpoint.Host(config.bindHost),
            port: port
        )
        let listener = try NWListener(using: parameters)
        listener.newConnectionHandler = { [weak self] connection in
            self?.handle(connection)
        }
        listener.stateUpdateHandler = { state in
            if case .failed(let error) = state {
                fputs("HTTP listener failed: \(error)\n", stderr)
            }
        }
        listener.start(queue: queue)
        self.listener = listener
    }

    private func handle(_ connection: NWConnection) {
        connection.start(queue: queue)
        connection.receive(minimumIncompleteLength: 1, maximumLength: 128 * 1024) { [weak self] data, _, _, error in
            guard let self else {
                connection.cancel()
                return
            }
            if let error {
                fputs("HTTP receive failed: \(error)\n", stderr)
                connection.cancel()
                return
            }
            guard let data, let request = HTTPRequest(data: data) else {
                self.send(.badRequest("Malformed HTTP request."), on: connection)
                return
            }
            Task {
                let response = await self.route(request, connection: connection)
                if let response {
                    self.send(response, on: connection)
                }
            }
        }
    }

    private func route(_ request: HTTPRequest, connection: NWConnection) async -> HTTPResponse? {
        guard authorized(request) else {
            return .json(status: 401, body: ["error": "unauthorized"])
        }

        switch (request.method, request.path) {
        case ("GET", "/health"):
            let hubSnapshot = await hub.snapshot()
            let forwarderSnapshot = await forwarder.snapshot()
            let pending = await deliveryQueue.pendingCount()
            return .json(body: HealthResponse(
                server: "noizy-macos-bridge",
                version: BridgeConfig.version,
                status: "online",
                bridgeId: config.bridgeId,
                port: Int(config.port),
                bindHost: config.bindHost,
                bootTime: hubSnapshot.bootTime,
                received: hubSnapshot.received,
                subscribers: hubSnapshot.subscribers,
                pendingDelivery: pending,
                langGraph: forwarderSnapshot
            ))

        case ("GET", "/permissions"):
            return .json(body: Permissions.snapshot(prompt: false))

        case ("GET", "/events/recent"):
            let requested = Int(request.query["limit"] ?? "") ?? 50
            let limit = min(max(requested, 1), 500)
            return .json(body: await hub.recent(limit: limit))

        case ("GET", "/events/stream"):
            streamEvents(on: connection)
            return nil

        case ("POST", "/events/test"):
            let event = BridgeEvent(
                sequence: await sequencer.next(),
                source: "rest",
                name: "test-event",
                payload: [
                    "message": .string("NOIZY macOS Bridge test event"),
                    "bodyBytes": .int(request.body.count)
                ]
            )
            do {
                try await hub.record(event)
                return .json(status: 202, body: event)
            } catch {
                return .json(status: 500, body: ["error": error.localizedDescription])
            }

        default:
            return .json(status: 404, body: NotFoundResponse(
                error: "not_found",
                routes: [
                    "GET /health",
                    "GET /permissions",
                    "GET /events/recent?limit=50",
                    "GET /events/stream",
                    "POST /events/test"
                ]
            ))
        }
    }

    private func streamEvents(on connection: NWConnection) {
        let headers = """
        HTTP/1.1 200 OK\r
        Content-Type: text/event-stream\r
        Cache-Control: no-cache\r
        Connection: keep-alive\r
        Access-Control-Allow-Origin: *\r
        \r

        """
        connection.send(content: Data(headers.utf8), completion: .contentProcessed { error in
            if let error {
                fputs("SSE header send failed: \(error)\n", stderr)
                connection.cancel()
            }
        })

        let task = Task { [hub] in
            let ready = "event: ready\ndata: {\"server\":\"noizy-macos-bridge\"}\n\n"
            connection.send(content: Data(ready.utf8), completion: .contentProcessed { _ in })
            for await event in await hub.stream(replay: 10) {
                guard !Task.isCancelled else { break }
                guard let payload = try? JSONEncoder.noizy.encode(event),
                      let json = String(data: payload, encoding: .utf8)
                else {
                    continue
                }
                let wire = "id: \(event.id)\nevent: \(event.name)\ndata: \(json)\n\n"
                connection.send(content: Data(wire.utf8), completion: .contentProcessed { error in
                    if error != nil {
                        connection.cancel()
                    }
                })
            }
        }
        connection.stateUpdateHandler = { state in
            switch state {
            case .cancelled, .failed:
                task.cancel()
            default:
                break
            }
        }
    }

    private func authorized(_ request: HTTPRequest) -> Bool {
        guard let authToken = config.authToken else {
            return true
        }
        return request.headers["authorization"] == "Bearer \(authToken)"
    }

    private func send(_ response: HTTPResponse, on connection: NWConnection) {
        var payload = Data()
        let statusText = HTTPURLResponse.localizedString(forStatusCode: response.status)
        payload.append(Data("HTTP/1.1 \(response.status) \(statusText)\r\n".utf8))
        payload.append(Data("Content-Type: \(response.contentType)\r\n".utf8))
        payload.append(Data("Content-Length: \(response.body.count)\r\n".utf8))
        payload.append(Data("Connection: close\r\n".utf8))
        payload.append(Data("Access-Control-Allow-Origin: *\r\n".utf8))
        payload.append(Data("\r\n".utf8))
        payload.append(response.body)
        connection.send(content: payload, completion: .contentProcessed { _ in
            connection.cancel()
        })
    }
}

public struct HTTPRequest: Sendable, Equatable {
    public var method: String
    public var rawTarget: String
    public var path: String
    public var query: [String: String]
    public var headers: [String: String]
    public var body: Data

    public init?(data: Data) {
        guard let text = String(data: data, encoding: .utf8),
              let headerEnd = text.range(of: "\r\n\r\n")
        else {
            return nil
        }
        let headerText = String(text[..<headerEnd.lowerBound])
        let headerLines = headerText.components(separatedBy: "\r\n")
        guard let requestLine = headerLines.first else {
            return nil
        }
        let requestParts = requestLine.split(separator: " ", maxSplits: 2).map(String.init)
        guard requestParts.count >= 2 else {
            return nil
        }

        method = requestParts[0].uppercased()
        rawTarget = requestParts[1]
        let components = URLComponents(string: "http://localhost\(rawTarget)")
        path = components?.path ?? rawTarget
        var parsedQuery: [String: String] = [:]
        for item in components?.queryItems ?? [] {
            parsedQuery[item.name] = item.value ?? ""
        }
        query = parsedQuery

        var parsedHeaders: [String: String] = [:]
        for line in headerLines.dropFirst() {
            guard let colon = line.firstIndex(of: ":") else {
                continue
            }
            let name = String(line[..<colon]).trimmingCharacters(in: .whitespacesAndNewlines).lowercased()
            let value = String(line[line.index(after: colon)...]).trimmingCharacters(in: .whitespacesAndNewlines)
            parsedHeaders[name] = value
        }
        headers = parsedHeaders

        let bodyStart = headerEnd.upperBound
        body = Data(text[bodyStart...].utf8)
    }
}

public struct HTTPResponse: Sendable {
    public var status: Int
    public var contentType: String
    public var body: Data

    public static func json<T: Encodable>(status: Int = 200, body: T) -> HTTPResponse {
        let data = (try? JSONEncoder.noizy.encode(body)) ?? Data("{}".utf8)
        return HTTPResponse(status: status, contentType: "application/json", body: data)
    }

    public static func badRequest(_ message: String) -> HTTPResponse {
        .json(status: 400, body: ["error": message])
    }
}

private struct HealthResponse: Codable, Sendable {
    var server: String
    var version: String
    var status: String
    var bridgeId: String
    var port: Int
    var bindHost: String
    var bootTime: String
    var received: UInt64
    var subscribers: Int
    var pendingDelivery: Int
    var langGraph: ForwarderSnapshot
}

private struct NotFoundResponse: Codable, Sendable {
    var error: String
    var routes: [String]
}
