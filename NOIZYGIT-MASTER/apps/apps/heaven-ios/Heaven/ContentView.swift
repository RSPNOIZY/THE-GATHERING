import SwiftUI

struct ContentView: View {
    @State private var selectedTab: Tab = .dashboard

    enum Tab: String, CaseIterable {
        case dashboard, family, voice, healing, gabriel, settings

        var icon: String {
            switch self {
            case .dashboard: return "square.grid.2x2"
            case .family: return "person.3"
            case .voice: return "waveform"
            case .healing: return "heart.circle"
            case .gabriel: return "shield.checkered"
            case .settings: return "gearshape"
            }
        }

        var label: String {
            switch self {
            case .dashboard: return "Empire"
            case .family: return "Family"
            case .voice: return "Voice"
            case .healing: return "Healing"
            case .gabriel: return "Gabriel"
            case .settings: return "Settings"
            }
        }
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            ForEach(Tab.allCases, id: \.self) { tab in
                Group {
                    switch tab {
                    case .dashboard: DashboardView()
                    case .family: FamilyView()
                    case .voice: VoiceView()
                    case .healing: HealingView()
                    case .gabriel: GabrielView()
                    case .settings: SettingsView()
                    }
                }
                .tabItem {
                    Label(tab.label, systemImage: tab.icon)
                }
                .tag(tab)
            }
        }
        .tint(Color("AccentColor"))
    }
}

#Preview {
    ContentView()
        .preferredColorScheme(.dark)
}
