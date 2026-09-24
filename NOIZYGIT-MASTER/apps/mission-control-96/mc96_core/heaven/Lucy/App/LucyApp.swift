// Lucy — NOIZYLAB DreamChamber
// Forked from Heaven | Built for iPad | Swift 6 | SwiftUI
// "Where Heaven is cosmic and universal, Lucy is intimate and personal."
// Copyright © 2026 NOIZYLAB. All rights reserved.

import SwiftUI

@main
struct LucyApp: App {
    @StateObject private var appState = LucyState.shared
    @StateObject private var lucyClient = LucyClient.shared

    var body: some Scene {
        WindowGroup {
            LucyRootView()
                .environmentObject(appState)
                .environmentObject(lucyClient)
                .preferredColorScheme(.dark)
                .onAppear {
                    Task {
                        await appState.initialize()
                        await lucyClient.connect()
                    }
                }
        }
        .windowStyle(.automatic)
    }
}
