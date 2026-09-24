import SwiftUI

// ════════════════════════════════════════════════════════════
// LucyApp — Heaven Worker iOS Wrapper
// Phase 1: Local MCP execution on iPad, offline-first
// Foundation: Cloudflare ZeroTrust → Google → Microsoft → Apple
//
// Architecture:
//   iPad ← SwiftUI UI
//         ← MCPEngine (protocol, on-device, zero latency)
//         ← HeavenWorkerBridge (CF Worker endpoints, config-driven)
//         ← D1Client (agent memory, Cloudflare D1)
//         ← AirPlayRouter (multi-device audio, no 3rd party)
//         ← ZeroTrustProxy (VPN/SSH routing through heaven)
// ════════════════════════════════════════════════════════════

@main
struct LucyApp: App {
    
    @StateObject private var mcpEngine   = MCPEngine.shared
    @StateObject private var heavenBridge = HeavenWorkerBridge.shared
    @StateObject private var airplay     = AirPlayRouter.shared
    @StateObject private var agentMemory = AgentMemory.shared
    @StateObject private var ztProxy     = ZeroTrustProxy.shared
    
    var body: some Scene {
        WindowGroup {
            LucyRootView()
                .environmentObject(mcpEngine)
                .environmentObject(heavenBridge)
                .environmentObject(airplay)
                .environmentObject(agentMemory)
                .environmentObject(ztProxy)
                .preferredColorScheme(.dark)
                .onAppear { bootstrap() }
        }
        // iPad: full-window, no split unless needed
        .windowResizability(.contentSize)
    }
    
    // Boot sequence — offline first, then reach Cloudflare
    private func bootstrap() {
        Task {
            // 1. Start local MCP engine (no network required)
            await mcpEngine.start()
            
            // 2. Load agent memory from local cache
            await agentMemory.loadLocalCache()
            
            // 3. Start AirPlay discovery on LAN
            await airplay.startDiscovery()
            
            // 4. Attempt ZeroTrust connection (non-blocking)
            Task.detached(priority: .background) {
                await ztProxy.connect()
                // 5. Sync D1 memory once online
                if await ztProxy.isConnected {
                    await agentMemory.syncWithD1()
                    await heavenBridge.connect()
                }
            }
        }
    }
}
