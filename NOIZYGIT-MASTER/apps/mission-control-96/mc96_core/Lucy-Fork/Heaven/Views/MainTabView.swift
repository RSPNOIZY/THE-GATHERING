// Heaven — MainTabView
// Custom frosted glass tab bar for iPhone & iPad

import SwiftUI

struct MainTabView: View {
    @EnvironmentObject var appState: AppState
    @Namespace private var tabAnimation

    var body: some View {
        ZStack(alignment: .bottom) {
            // Content
            Group {
                switch appState.activeTab {
                case .dashboard:
                    DashboardView()
                case .voice:
                    VoiceView()
                case .chat:
                    ChatView()
                case .settings:
                    SettingsView()
                }
            }
            .frame(maxWidth: .infinity, maxHeight: .infinity)

            // Custom tab bar
            HeavenTabBar()
        }
        .ignoresSafeArea(edges: .bottom)
        .background(
            Color(red: 0.04, green: 0.02, blue: 0.12)
                .ignoresSafeArea()
        )
    }
}

// MARK: - Custom Tab Bar

struct HeavenTabBar: View {
    @EnvironmentObject var appState: AppState
    @Namespace private var animation

    var body: some View {
        HStack(spacing: 0) {
            ForEach(TabDestination.allCases, id: \.rawValue) { tab in
                TabBarItem(
                    tab: tab,
                    isSelected: appState.activeTab == tab,
                    accentColor: appState.identity.accentColor,
                    animation: animation
                )
                .onTapGesture {
                    withAnimation(.spring(response: 0.3, dampingFraction: 0.7)) {
                        appState.activeTab = tab
                    }
                    HapticManager.selection()
                }
            }
        }
        .padding(.horizontal, 8)
        .padding(.top, 12)
        .padding(.bottom, 28)
        .background(
            RoundedRectangle(cornerRadius: 0)
                .fill(.ultraThinMaterial)
                .overlay(
                    Rectangle()
                        .fill(
                            LinearGradient(
                                colors: [
                                    Color.white.opacity(0.08),
                                    Color.clear
                                ],
                                startPoint: .top,
                                endPoint: .bottom
                            )
                        )
                )
                .overlay(
                    Rectangle()
                        .frame(height: 0.5)
                        .foregroundStyle(Color.white.opacity(0.12)),
                    alignment: .top
                )
        )
    }
}

struct TabBarItem: View {
    let tab: TabDestination
    let isSelected: Bool
    let accentColor: Color
    var animation: Namespace.ID

    var body: some View {
        VStack(spacing: 4) {
            ZStack {
                if isSelected {
                    RoundedRectangle(cornerRadius: 12)
                        .fill(accentColor.opacity(0.2))
                        .frame(width: 48, height: 32)
                        .matchedGeometryEffect(id: "tabPill", in: animation)
                }

                Image(systemName: tab.rawValue)
                    .font(.system(size: 20, weight: isSelected ? .semibold : .regular))
                    .foregroundStyle(
                        isSelected ? accentColor : Color.white.opacity(0.4)
                    )
                    .scaleEffect(isSelected ? 1.1 : 1.0)
                    .animation(.spring(response: 0.3, dampingFraction: 0.6), value: isSelected)
            }
            .frame(height: 32)

            Text(tab.label)
                .font(.system(size: 10, weight: isSelected ? .semibold : .regular, design: .rounded))
                .foregroundStyle(isSelected ? accentColor : Color.white.opacity(0.35))
        }
        .frame(maxWidth: .infinity)
    }
}
