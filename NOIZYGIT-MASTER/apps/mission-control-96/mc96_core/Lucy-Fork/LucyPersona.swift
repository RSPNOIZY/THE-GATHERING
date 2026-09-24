import SwiftUI

// ═══════════════════════════════════════════════════════════
// Lucy — Forked from Heaven
// Lucy's persona: warm, expressive, family-oriented
// Backed by: noizy-family-keeper Ollama model
// ═══════════════════════════════════════════════════════════

extension HeavenPersona {
    static var defaultForLucy: HeavenPersona { .lucy }
}

// Lucy-specific configuration
struct LucyConfig {
    static let aiModel = "noizy-family-keeper"
    static let voiceName = "Lucy"
    static let heaven17Port = 17018  // Lucy's dedicated heaven17 instance
    static let primaryColor = "#FF6B9D"   // Pink
    static let accentColor  = "#FFD700"   // Gold
    
    static var config: HeavenConfig {
        HeavenConfig(
            dreamChamberURL: "http://localhost:7777",
            heaven17URL: "http://localhost:17018",  // lucy17 container
            ollamaURL: "http://localhost:11434",
            bridgeURL: "http://localhost:7778",
            persona: "Lucy"
        )
    }
    
    static var productionConfig: HeavenConfig {
        HeavenConfig(
            dreamChamberURL: "https://dreamchamber.noizy.ai",
            heaven17URL: "https://voice.noizy.ai/lucy",
            ollamaURL: "https://ai.noizy.ai",
            bridgeURL: "https://voice.noizy.ai/lucy/bridge",
            persona: "Lucy"
        )
    }
}

// Lucy App Entry - Heaven forked for Lucy
@main
struct LucyApp: App {
    @StateObject private var appState: AppState = {
        let state = AppState.shared
        state.persona = .lucy
        return state
    }()
    @StateObject private var voiceEngine = VoiceEngine.shared
    @StateObject private var dreamChamber = DreamChamberClient.shared
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .environmentObject(voiceEngine)
                .environmentObject(dreamChamber)
                .preferredColorScheme(.dark)
                .tint(Color(hex: "#FF6B9D"))
                .onAppear {
                    Task {
                        // Lucy always starts as Lucy
                        appState.switchPersona(to: .lucy)
                        await voiceEngine.requestPermissions()
                        await dreamChamber.connect()
                    }
                }
        }
    }
}
