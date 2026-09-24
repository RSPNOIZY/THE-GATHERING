// Heaven — NOIZYLAB DreamChamber Experience
// Built for iPhone & iPad | Swift 6 | SwiftUI
// Copyright © 2026 NOIZYLAB. All rights reserved.

import SwiftUI

@main
struct HeavenApp: App {
    @StateObject private var appState = AppState()
    @StateObject private var audioEngine = AudioEngine.shared
    @StateObject private var aiOrchestrator = AIOrchestrator.shared

    var body: some Scene {
        WindowGroup {
            RootView()
                .environmentObject(appState)
                .environmentObject(audioEngine)
                .environmentObject(aiOrchestrator)
                .preferredColorScheme(.dark)
                .onAppear {
                    Task { await appState.initialize() }
                }
        }
    }
}
