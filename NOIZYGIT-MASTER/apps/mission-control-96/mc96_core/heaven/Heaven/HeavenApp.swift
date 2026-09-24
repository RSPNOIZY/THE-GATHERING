import SwiftUI

// ═══════════════════════════════════════════════════════════
// Heaven — Entry Point
// DreamChamber iOS/iPadOS App
// NOIZY Empire | RSP Accessibility Platform
// ═══════════════════════════════════════════════════════════

@main
struct HeavenApp: App {
    @StateObject private var appState = AppState.shared
    @StateObject private var voiceEngine = VoiceEngine.shared
    @StateObject private var dreamChamber = DreamChamberClient.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(voiceEngine)
                .environmentObject(dreamChamber)
                .preferredColorScheme(.dark)
                .onAppear {
                    Task {
                        await appState.initialize()
                        await voiceEngine.requestPermissions()
                        await dreamChamber.connect()
                    }
                }
        }
        .windowStyle(.automatic)
        .windowResizability(.contentSize)
    }
}
