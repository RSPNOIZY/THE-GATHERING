import SwiftUI

struct ContentView: View {
    @State private var selectedTab: Tab = .command

    enum Tab: String, CaseIterable {
        case command, dispatch, audit, family, voice, healing, settings

        var icon: String {
            switch self {
            case .command: return "shield.checkered"
            case .dispatch: return "arrow.triangle.branch"
            case .audit: return "list.bullet.clipboard"
            case .family: return "person.3"
            case .voice: return "waveform"
            case .healing: return "heart.circle"
            case .settings: return "gearshape"
            }
        }

        var label: String {
            switch self {
            case .command: return "Command"
            case .dispatch: return "Dispatch"
            case .audit: return "Audit"
            case .family: return "Family"
            case .voice: return "Voice"
            case .healing: return "Healing"
            case .settings: return "Settings"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            ForEach(Tab.allCases, id: \.self) { tab in
                Group {
                    switch tab {
                    case .command: CommandCenterView()
                    case .dispatch: DispatchView()
                    case .audit: AuditView()
                    case .family: FamilyOpsView()
                    case .voice: VoiceOpsView()
                    case .healing: HealingOpsView()
                    case .settings: SettingsView()
                    }
                }
                .tabItem {
                    Label(tab.label, systemImage: tab.icon)
                }
                .tag(tab)
            }
        }
        .tint(Color.orange)
    }
}

#Preview {
    ContentView()
        .preferredColorScheme(.dark)
}
