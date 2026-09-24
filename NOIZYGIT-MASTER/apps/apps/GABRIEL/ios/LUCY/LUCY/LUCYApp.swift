import SwiftUI

@main
struct LUCYApp: App {
    @StateObject private var chatVM = ChatViewModel()

    var body: some Scene {
        WindowGroup {
            ChatView()
                .environmentObject(chatVM)
                .preferredColorScheme(.dark)
        }
    }
}
