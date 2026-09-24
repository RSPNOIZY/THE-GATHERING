// Heaven — AppState
// Centralized observable state for the entire app

import SwiftUI
import Combine

@MainActor
final class AppState: ObservableObject {
    // MARK: - Navigation
    @Published var activeTab: TabDestination = .dashboard
    @Published var isOnboarded: Bool = false
    @Published var showSplash: Bool = true

    // MARK: - Identity
    @Published var identity: HeavenIdentity = .heaven

    // MARK: - Session
    @Published var currentSession: HeavenSession?
    @Published var isConnected: Bool = false
    @Published var backendHealth: BackendHealth = .unknown

    // MARK: - Init
    func initialize() async {
        isOnboarded = UserDefaults.standard.bool(forKey: "onboarded")
        await checkBackendHealth()
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2s splash
        withAnimation(.easeOut(duration: 0.6)) {
            showSplash = false
        }
    }

    func checkBackendHealth() async {
        do {
            let healthy = try await HeavenNetworkService.shared.ping()
            backendHealth = healthy ? .healthy : .degraded
            isConnected = healthy
        } catch {
            backendHealth = .offline
            isConnected = false
        }
    }
}

// MARK: - Types

enum TabDestination: String, CaseIterable {
    case dashboard = "house.fill"
    case voice     = "waveform"
    case chat      = "bubble.left.and.bubble.right.fill"
    case settings  = "gearshape.fill"

    var label: String {
        switch self {
        case .dashboard: return "Heaven"
        case .voice:     return "Voice"
        case .chat:      return "Chat"
        case .settings:  return "Settings"
        }
    }
}

enum HeavenIdentity: String {
    case heaven = "Heaven"
    case lucy   = "Lucy"

    var accentColor: Color {
        switch self {
        case .heaven: return Color("HeavenPurple")
        case .lucy:   return Color("LucyRose")
        }
    }

    var gradientColors: [Color] {
        switch self {
        case .heaven: return [Color("HeavenPurple"), Color("HeavenBlue")]
        case .lucy:   return [Color("LucyRose"), Color("LucyGold")]
        }
    }
}

enum BackendHealth {
    case unknown, healthy, degraded, offline

    var color: Color {
        switch self {
        case .unknown:  return .gray
        case .healthy:  return .green
        case .degraded: return .yellow
        case .offline:  return .red
        }
    }

    var label: String {
        switch self {
        case .unknown:  return "Connecting..."
        case .healthy:  return "Connected"
        case .degraded: return "Degraded"
        case .offline:  return "Offline"
        }
    }
}

struct HeavenSession: Identifiable, Codable {
    let id: UUID
    var name: String
    var createdAt: Date
    var messages: [ChatMessage]
    var identity: String

    init(identity: HeavenIdentity = .heaven) {
        self.id = UUID()
        self.name = "Session \(Date().formatted(.dateTime.month().day().hour().minute()))"
        self.createdAt = Date()
        self.messages = []
        self.identity = identity.rawValue
    }
}
