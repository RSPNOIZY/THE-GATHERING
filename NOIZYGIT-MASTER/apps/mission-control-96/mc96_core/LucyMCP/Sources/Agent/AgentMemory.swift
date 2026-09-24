import Foundation
import Combine

// ════════════════════════════════════════════════════════════
// AgentMemory — Local cache + Cloudflare D1 sync
// Offline-first: reads/writes always succeed locally.
// Syncs to D1 when ZeroTrust is connected.
// ════════════════════════════════════════════════════════════

@MainActor
final class AgentMemory: ObservableObject {
    static let shared = AgentMemory()
    
    @Published var entries: [String: MemoryEntry] = [:]
    @Published var profile: CreatorProfile = .default
    @Published var syncStatus: SyncStatus = .unsynced
    @Published var lastSyncDate: Date?
    
    // Local persistence via UserDefaults (Phase 1)
    // Phase 3: replace with CoreData + encrypted keychain
    private let defaults = UserDefaults(suiteName: "ai.noizy.lucy.memory")
    private let encoder = JSONEncoder()
    private let decoder = JSONDecoder()
    
    private init() {}
    
    // ════════════════════════════════════════════════════════
    // MARK: — Local Cache
    // ════════════════════════════════════════════════════════
    
    func loadLocalCache() async {
        guard let data = defaults?.data(forKey: "memory.entries"),
              let loaded = try? decoder.decode([String: MemoryEntry].self, from: data) else {
            print("[Memory] No local cache — starting fresh")
            return
        }
        entries = loaded.filter { $0.value.expiresAt == nil || $0.value.expiresAt! > Date() }
        
        if let profileData = defaults?.data(forKey: "memory.profile"),
           let loadedProfile = try? decoder.decode(CreatorProfile.self, from: profileData) {
            profile = loadedProfile
        }
        
        print("[Memory] ✅ Loaded \(entries.count) local entries")
    }
    
    private func persist() {
        if let data = try? encoder.encode(entries) {
            defaults?.set(data, forKey: "memory.entries")
        }
        if let data = try? encoder.encode(profile) {
            defaults?.set(data, forKey: "memory.profile")
        }
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — CRUD (always local, async sync to D1)
    // ════════════════════════════════════════════════════════
    
    func store(key: String, value: String, ttl: Int? = nil) async {
        let expiresAt = ttl.map { Date().addingTimeInterval(TimeInterval($0)) }
        let entry = MemoryEntry(
            key: key,
            value: value,
            createdAt: entries[key]?.createdAt ?? Date(),
            updatedAt: Date(),
            expiresAt: expiresAt,
            synced: false
        )
        entries[key] = entry
        persist()
        
        // Background D1 sync
        Task.detached(priority: .background) {
            await self.syncEntryToD1(entry)
        }
    }
    
    func retrieve(key: String) async -> String? {
        guard let entry = entries[key] else { return nil }
        if let exp = entry.expiresAt, exp < Date() {
            entries.removeValue(forKey: key)
            persist()
            return nil
        }
        return entry.value
    }
    
    func search(query: String, limit: Int = 10) async -> [MemoryEntry] {
        let lower = query.lowercased()
        return entries.values
            .filter { $0.key.lowercased().contains(lower) || $0.value.lowercased().contains(lower) }
            .sorted { $0.updatedAt > $1.updatedAt }
            .prefix(limit)
            .map { $0 }
    }
    
    func all() async -> [[String: String]] {
        entries.map { ["key": $0.key, "value": $0.value.value] }
    }
    
    func delete(key: String) async {
        entries.removeValue(forKey: key)
        persist()
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Creator Profile
    // ════════════════════════════════════════════════════════
    
    func getProfile() async -> CreatorProfile { profile }
    
    func updateProfile(field: String, value: String) async {
        profile.update(field: field, value: value)
        persist()
        
        Task.detached(priority: .background) {
            _ = await HeavenWorkerBridge.shared.updateProfile([field: value])
        }
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — D1 Sync
    // ════════════════════════════════════════════════════════
    
    func syncWithD1() async {
        syncStatus = .syncing
        
        // Push local unsynced entries to D1
        let unsynced = entries.values.filter { !$0.synced }
        if !unsynced.isEmpty {
            let pushed = await HeavenWorkerBridge.shared.syncMemoryToD1(entries: Array(unsynced))
            if pushed {
                for key in unsynced.map({ $0.key }) {
                    entries[key]?.synced = true
                }
            }
        }
        
        // Pull new entries from D1
        let remote = await HeavenWorkerBridge.shared.pullMemoryFromD1()
        for entry in remote {
            if entries[entry.key] == nil || entries[entry.key]!.updatedAt < entry.updatedAt {
                entries[entry.key] = entry
            }
        }
        
        persist()
        syncStatus = .synced
        lastSyncDate = Date()
        print("[Memory] ✅ D1 sync complete — \(entries.count) entries")
    }
    
    private func syncEntryToD1(_ entry: MemoryEntry) async {
        guard ZeroTrustProxy.shared.isConnected else { return }
        let success = await HeavenWorkerBridge.shared.syncMemoryToD1(entries: [entry])
        if success {
            entries[entry.key]?.synced = true
            persist()
        }
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — Models
// ════════════════════════════════════════════════════════════

struct MemoryEntry: Codable, Identifiable, Sendable {
    var id: String { key }
    let key: String
    var value: String
    let createdAt: Date
    var updatedAt: Date
    var expiresAt: Date?
    var synced: Bool
    
    init(key: String, value: String, createdAt: Date = Date(),
         updatedAt: Date = Date(), expiresAt: Date? = nil, synced: Bool = false) {
        self.key = key; self.value = value; self.createdAt = createdAt
        self.updatedAt = updatedAt; self.expiresAt = expiresAt; self.synced = synced
    }
    
    init?(json: [String: Any]) {
        guard let key = json["key"] as? String,
              let value = json["value"] as? String else { return nil }
        self.key = key; self.value = value
        self.createdAt = Date(); self.updatedAt = Date()
        self.expiresAt = nil; self.synced = true
    }
    
    func toJSON() -> [String: Any] {
        var j: [String: Any] = ["key": key, "value": value, "synced": synced]
        if let exp = expiresAt { j["expiresAt"] = ISO8601DateFormatter().string(from: exp) }
        return j
    }
}

struct CreatorProfile: Codable, Sendable {
    var name: String
    var persona: String
    var preferredModel: String
    var accessibilityMode: String
    var creativeStyle: [String]
    var language: String
    var customFields: [String: String]
    
    static var `default`: CreatorProfile {
        CreatorProfile(
            name: "Lucy",
            persona: "Lucy — Family Keeper & Creative Companion",
            preferredModel: "noizy-family-keeper",
            accessibilityMode: "voice",
            creativeStyle: ["music", "storytelling", "visual-art"],
            language: "en-US",
            customFields: [:]
        )
    }
    
    mutating func update(field: String, value: String) {
        switch field {
        case "name":             name = value
        case "persona":          persona = value
        case "preferredModel":   preferredModel = value
        case "accessibilityMode": accessibilityMode = value
        case "language":         language = value
        default:                 customFields[field] = value
        }
    }
    
    func toJSON() -> String {
        let dict: [String: Any] = [
            "name": name,
            "persona": persona,
            "preferredModel": preferredModel,
            "accessibilityMode": accessibilityMode,
            "creativeStyle": creativeStyle,
            "language": language,
            "customFields": customFields
        ]
        let data = try? JSONSerialization.data(withJSONObject: dict, options: .prettyPrinted)
        return data.flatMap { String(data: $0, encoding: .utf8) } ?? "{}"
    }
}

enum SyncStatus: String, Sendable {
    case unsynced, syncing, synced, error
}
