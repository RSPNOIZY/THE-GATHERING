import Foundation

public struct BridgeConfig: Codable, Sendable, Equatable {
    public static let version = "0.1.0"

    public var bridgeId: String
    public var port: UInt16
    public var bindHost: String
    public var dataDirectory: URL
    public var langGraphWebhookURL: URL?
    public var sharedSecret: String?
    public var authToken: String?
    public var batchSize: Int
    public var flushIntervalMilliseconds: Int
    public var redactTextValues: Bool
    public var promptForAccessibilityPermission: Bool

    public var journalURL: URL {
        dataDirectory.appendingPathComponent("events.jsonl", isDirectory: false)
    }

    public var pendingDeliveryDirectory: URL {
        dataDirectory.appendingPathComponent("pending", isDirectory: true)
    }

    public var envURL: URL {
        dataDirectory.appendingPathComponent(".env", isDirectory: false)
    }

    public init(
        bridgeId: String,
        port: UInt16,
        bindHost: String,
        dataDirectory: URL,
        langGraphWebhookURL: URL?,
        sharedSecret: String?,
        authToken: String?,
        batchSize: Int,
        flushIntervalMilliseconds: Int,
        redactTextValues: Bool,
        promptForAccessibilityPermission: Bool
    ) {
        self.bridgeId = bridgeId
        self.port = port
        self.bindHost = bindHost
        self.dataDirectory = dataDirectory
        self.langGraphWebhookURL = langGraphWebhookURL
        self.sharedSecret = sharedSecret
        self.authToken = authToken
        self.batchSize = batchSize
        self.flushIntervalMilliseconds = flushIntervalMilliseconds
        self.redactTextValues = redactTextValues
        self.promptForAccessibilityPermission = promptForAccessibilityPermission
    }

    public static func load(
        processEnvironment: [String: String] = ProcessInfo.processInfo.environment,
        arguments: [String] = CommandLine.arguments
    ) -> BridgeConfig {
        let home = FileManager.default.homeDirectoryForCurrentUser
        let defaultDataDirectory = home.appendingPathComponent(".noizy/macos-bridge", isDirectory: true)
        let requestedDataDirectory = argumentValue("--data-dir", in: arguments)
            ?? processEnvironment["NOIZY_BRIDGE_DATA_DIR"]
        let dataDirectory = requestedDataDirectory
            .map { URL(fileURLWithPath: ($0 as NSString).expandingTildeInPath, isDirectory: true) }
            ?? defaultDataDirectory

        let envFileValues = loadEnvFile(
            argumentValue("--env", in: arguments)
                .map { URL(fileURLWithPath: ($0 as NSString).expandingTildeInPath) }
                ?? dataDirectory.appendingPathComponent(".env")
        )

        let env = envFileValues.merging(processEnvironment) { _, processValue in processValue }

        return BridgeConfig(
            bridgeId: argumentValue("--bridge-id", in: arguments)
                ?? env["NOIZY_BRIDGE_ID"]
                ?? Host.current().localizedName
                ?? "m2-ultra",
            port: UInt16(argumentValue("--port", in: arguments) ?? env["NOIZY_BRIDGE_PORT"] ?? "") ?? 9788,
            bindHost: argumentValue("--bind-host", in: arguments) ?? env["NOIZY_BRIDGE_BIND_HOST"] ?? "127.0.0.1",
            dataDirectory: dataDirectory,
            langGraphWebhookURL: URL(string: env["LANGGRAPH_WEBHOOK_URL"] ?? ""),
            sharedSecret: nonEmpty(env["NOIZY_BRIDGE_SHARED_SECRET"]),
            authToken: nonEmpty(env["NOIZY_BRIDGE_AUTH_TOKEN"]),
            batchSize: max(1, Int(env["NOIZY_BRIDGE_BATCH_SIZE"] ?? "") ?? 50),
            flushIntervalMilliseconds: max(50, Int(env["NOIZY_BRIDGE_FLUSH_INTERVAL_MS"] ?? "") ?? 250),
            redactTextValues: bool(env["NOIZY_BRIDGE_REDACT_TEXT_VALUES"], default: true),
            promptForAccessibilityPermission: bool(env["NOIZY_BRIDGE_AX_TRUST_PROMPT"], default: true)
        )
    }

    public static func setup(at dataDirectory: URL? = nil) throws -> URL {
        let config = BridgeConfig.load()
        let targetDirectory = dataDirectory ?? config.dataDirectory
        try FileManager.default.createDirectory(at: targetDirectory, withIntermediateDirectories: true)
        let envURL = targetDirectory.appendingPathComponent(".env")
        if !FileManager.default.fileExists(atPath: envURL.path) {
            try exampleEnv(dataDirectory: targetDirectory).write(to: envURL, atomically: true, encoding: .utf8)
            try FileManager.default.setAttributes([.posixPermissions: 0o600], ofItemAtPath: envURL.path)
        }
        try FileManager.default.createDirectory(
            at: targetDirectory.appendingPathComponent("pending", isDirectory: true),
            withIntermediateDirectories: true
        )
        return envURL
    }

    public static func exampleEnv(dataDirectory: URL? = nil) -> String {
        let dir = dataDirectory?.path ?? "~/.noizy/macos-bridge"
        return """
        # NOIZY macOS Bridge local configuration.
        # Keep this file local. It may contain routing secrets.

        NOIZY_BRIDGE_ID=m2-ultra
        NOIZY_BRIDGE_PORT=9788
        NOIZY_BRIDGE_BIND_HOST=127.0.0.1
        NOIZY_BRIDGE_DATA_DIR=\(dir)

        # LangGraph ingress. Leave blank to run local-only.
        LANGGRAPH_WEBHOOK_URL=

        # Optional HMAC for outbound LangGraph payloads.
        NOIZY_BRIDGE_SHARED_SECRET=

        # Optional bearer token for local HTTP endpoints.
        NOIZY_BRIDGE_AUTH_TOKEN=

        NOIZY_BRIDGE_BATCH_SIZE=50
        NOIZY_BRIDGE_FLUSH_INTERVAL_MS=250
        NOIZY_BRIDGE_REDACT_TEXT_VALUES=true
        NOIZY_BRIDGE_AX_TRUST_PROMPT=true

        """
    }
}

private func nonEmpty(_ value: String?) -> String? {
    guard let value, !value.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
        return nil
    }
    return value
}

private func bool(_ value: String?, default defaultValue: Bool) -> Bool {
    guard let value else { return defaultValue }
    switch value.trimmingCharacters(in: .whitespacesAndNewlines).lowercased() {
    case "1", "true", "yes", "on":
        return true
    case "0", "false", "no", "off":
        return false
    default:
        return defaultValue
    }
}

private func argumentValue(_ name: String, in arguments: [String]) -> String? {
    let prefix = "\(name)="
    for (index, argument) in arguments.enumerated() {
        if argument.hasPrefix(prefix) {
            return String(argument.dropFirst(prefix.count))
        }
        if argument == name, arguments.indices.contains(index + 1) {
            return arguments[index + 1]
        }
    }
    return nil
}

private func loadEnvFile(_ url: URL) -> [String: String] {
    guard let text = try? String(contentsOf: url, encoding: .utf8) else {
        return [:]
    }
    var values: [String: String] = [:]
    for rawLine in text.split(whereSeparator: \.isNewline) {
        let line = rawLine.trimmingCharacters(in: .whitespacesAndNewlines)
        if line.isEmpty || line.hasPrefix("#") {
            continue
        }
        guard let equals = line.firstIndex(of: "=") else {
            continue
        }
        let key = String(line[..<equals]).trimmingCharacters(in: .whitespacesAndNewlines)
        var value = String(line[line.index(after: equals)...]).trimmingCharacters(in: .whitespacesAndNewlines)
        if value.hasPrefix("\""), value.hasSuffix("\""), value.count >= 2 {
            value.removeFirst()
            value.removeLast()
        }
        if !key.isEmpty {
            values[key] = value
        }
    }
    return values
}
