import Foundation
import NOIZYMacOSBridgeCore

@main
struct NOIZYMacOSBridgeMain {
    static func main() {
        let arguments = CommandLine.arguments

        if arguments.contains("--help") || arguments.contains("-h") {
            printHelp()
            return
        }

        if arguments.contains("setup") {
            do {
                let envURL = try BridgeConfig.setup()
                print("NOIZY macOS Bridge config ready: \(envURL.path)")
            } catch {
                fputs("setup failed: \(error.localizedDescription)\n", stderr)
                Foundation.exit(1)
            }
            return
        }

        let config = BridgeConfig.load(arguments: arguments)

        if arguments.contains("--print-config") {
            printJSON(config)
            return
        }

        if arguments.contains("--check-permissions") {
            printJSON(Permissions.snapshot(prompt: config.promptForAccessibilityPermission))
            return
        }

        do {
            try FileManager.default.createDirectory(
                at: config.dataDirectory,
                withIntermediateDirectories: true
            )

            let sequencer = EventSequencer()
            let journal = DurableEventJournal(url: config.journalURL)
            let deliveryQueue = DurableDeliveryQueue(
                directory: config.pendingDeliveryDirectory,
                enabled: config.langGraphWebhookURL != nil
            )
            let hub = EventHub(journal: journal, deliveryQueue: deliveryQueue)
            let forwarder = LangGraphForwarder(config: config, deliveryQueue: deliveryQueue)
            let scriptingProbe = ScriptingBridgeProbe(sequencer: sequencer)
            let accessibilityMonitor = AccessibilityMonitor(
                config: config,
                hub: hub,
                sequencer: sequencer,
                scriptingProbe: scriptingProbe
            )
            let server = HTTPServer(
                config: config,
                hub: hub,
                deliveryQueue: deliveryQueue,
                forwarder: forwarder,
                sequencer: sequencer
            )

            try server.start()
            forwarder.start()
            accessibilityMonitor.start()

            print("""
            NOIZY macOS Bridge online
              health: http://\(config.bindHost):\(config.port)/health
              events: http://\(config.bindHost):\(config.port)/events/stream
              journal: \(config.journalURL.path)
              langgraph: \(config.langGraphWebhookURL?.absoluteString ?? "local-only")
            """)

            RunLoop.main.run()
        } catch {
            fputs("bridge failed: \(error.localizedDescription)\n", stderr)
            Foundation.exit(1)
        }
    }
}

private func printHelp() {
    print("""
    NOIZY macOS Bridge \(BridgeConfig.version)

    Usage:
      noizy-macos-bridge setup
      noizy-macos-bridge --check-permissions
      noizy-macos-bridge --print-config
      noizy-macos-bridge [--env PATH] [--data-dir PATH] [--port 9788]

    Environment:
      NOIZY_BRIDGE_ID
      NOIZY_BRIDGE_PORT
      NOIZY_BRIDGE_BIND_HOST
      NOIZY_BRIDGE_DATA_DIR
      LANGGRAPH_WEBHOOK_URL
      NOIZY_BRIDGE_SHARED_SECRET
      NOIZY_BRIDGE_AUTH_TOKEN
      NOIZY_BRIDGE_BATCH_SIZE
      NOIZY_BRIDGE_FLUSH_INTERVAL_MS
      NOIZY_BRIDGE_REDACT_TEXT_VALUES
      NOIZY_BRIDGE_AX_TRUST_PROMPT
    """)
}

private func printJSON<T: Encodable>(_ value: T) {
    do {
        let data = try JSONEncoder.noizy.encode(value)
        print(String(data: data, encoding: .utf8) ?? "{}")
    } catch {
        fputs("json encode failed: \(error.localizedDescription)\n", stderr)
        Foundation.exit(1)
    }
}
