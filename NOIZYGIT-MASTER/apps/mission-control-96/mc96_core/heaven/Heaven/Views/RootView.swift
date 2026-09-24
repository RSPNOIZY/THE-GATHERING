// Heaven — RootView
// Handles splash → onboarding → main tab navigation

import SwiftUI

struct RootView: View {
    @EnvironmentObject var appState: AppState

    var body: some View {
        ZStack {
            if appState.showSplash {
                SplashView()
                    .transition(.opacity)
            } else if !appState.isOnboarded {
                OnboardingView()
                    .transition(.move(edge: .trailing).combined(with: .opacity))
            } else {
                MainTabView()
                    .transition(.opacity)
            }
        }
        .animation(.easeInOut(duration: 0.5), value: appState.showSplash)
        .animation(.easeInOut(duration: 0.5), value: appState.isOnboarded)
    }
}
