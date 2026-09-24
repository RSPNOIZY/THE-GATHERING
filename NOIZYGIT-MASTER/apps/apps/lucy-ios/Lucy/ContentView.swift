import SwiftUI

struct ContentView: View {
    @State private var selectedTab: Tab = .dashboard

    enum Tab: String, CaseIterable {
        case dashboard, analysis, insights, dreams, gabriel, settings

        var icon: String {
            switch self {
            case .dashboard: return "moon.stars"
            case .analysis: return "brain.head.profile"
            case .insights: return "lightbulb"
            case .dreams: return "sparkles"
            case .gabriel: return "shield.checkered"
            case .settings: return "gearshape"
            }
        }

        var label: String {
            switch self {
            case .dashboard: return "Lucy"
            case .analysis: return "Analysis"
            case .insights: return "Insights"
            case .dreams: return "Dreams"
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
                    case .dashboard: LucyDashboardView()
                    case .analysis: AnalysisView()
                    case .insights: InsightsView()
                    case .dreams: DreamsView()
                    case .gabriel: GabrielView()
                    case .settings: LucySettingsView()
                    }
                }
                .tabItem {
                    Label(tab.label, systemImage: tab.icon)
                }
                .tag(tab)
            }
        }
        .tint(Color.purple)
    }
}

#Preview {
    ContentView()
        .preferredColorScheme(.dark)
}
