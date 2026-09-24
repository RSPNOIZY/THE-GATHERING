// Gabriel — NOIZYLAB DreamChamber
// Release Commander & Swarm Leader | iPhone-first | Swift 6
// Connects via: gabriel.dreamchamber.noizy.ai → GOD:7777
// Copyright © 2026 NOIZYLAB. All rights reserved.

import SwiftUI

@main
struct GabrielApp: App {
    @State private var commander = GabrielCommander()

    var body: some Scene {
        WindowGroup {
            GabrielRootView()
                .environment(commander)
                .preferredColorScheme(.dark)
                .task {
                    await commander.boot()
                }
        }
    }
}
