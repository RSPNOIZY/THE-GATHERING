// Micky — NOIZYLAB Legacy Bridge
// macOS app for Mickey-P (Old MacBook Pro)
// Bridges Loopback audio → Heaven → GOD via Cloudflare Tunnel
// Copyright © 2026 NOIZYLAB. All rights reserved.

import SwiftUI

@main
struct MickyApp: App {
    @State private var bridge = MickyBridge()

    var body: some Scene {
        WindowGroup {
            MickyRootView()
                .environment(bridge)
                .preferredColorScheme(.dark)
                .frame(minWidth: 480, minHeight: 600)
                .task { await bridge.boot() }
        }
        .windowStyle(.hiddenTitleBar)
        .defaultSize(width: 520, height: 700)

        // Menu bar presence — always accessible
        MenuBarExtra("Micky", systemImage: bridge.status == .streaming ? "waveform.circle.fill" : "desktopcomputer") {
            MenuBarView()
                .environment(bridge)
        }
    }
}
