import Foundation

/// Gabriel Engine — Warrior executor state and mission tracking
@Observable
final class GabrielEngine {
    static let shared = GabrielEngine()

    // MARK: - Deadline

    static let deadline = DateComponents(
        calendar: .current, year: 2026, month: 4, day: 17,
        hour: 23, minute: 59, second: 59
    ).date!

    var daysRemaining: Int {
        Calendar.current.dateComponents([.day], from: Date(), to: Self.deadline).day ?? 0
    }

    var hoursRemaining: Int {
        Calendar.current.dateComponents([.hour], from: Date(), to: Self.deadline).hour ?? 0
    }

    var deadlinePassed: Bool { Date() > Self.deadline }

    // MARK: - Agent Fleet

    struct Agent: Identifiable {
        let id: String
        let name: String
        let role: String
        let icon: String
        var status: AgentStatus

        enum AgentStatus: String {
            case online = "ONLINE"
            case standby = "STANDBY"
            case dispatched = "DISPATCHED"
            case offline = "OFFLINE"

            var color: String {
                switch self {
                case .online: return "green"
                case .standby: return "yellow"
                case .dispatched: return "cyan"
                case .offline: return "red"
                }
            }
        }
    }

    var agents: [Agent] = [
        Agent(id: "gabriel", name: "GABRIEL", role: "Warrior Executor & Lead Orchestrator", icon: "shield.checkered", status: .online),
        Agent(id: "lucy", name: "LUCY", role: "Nightly Deep Analysis Engine", icon: "moon.stars", status: .standby),
        Agent(id: "shirl", name: "SHIRL", role: "Compassion & Wellbeing Monitor", icon: "heart.circle", status: .standby),
        Agent(id: "engr-keith", name: "ENGR KEITH", role: "Infrastructure & Recording Engineer", icon: "wrench.and.screwdriver", status: .standby),
        Agent(id: "dream-weaver", name: "DREAM WEAVER", role: "Creative AI Mixing", icon: "sparkles", status: .standby),
        Agent(id: "cb01", name: "CB01", role: "Constitutional Compliance", icon: "doc.text.magnifyingglass", status: .standby),
        Agent(id: "shirley", name: "SHIRLEY", role: "Code & File Manager", icon: "folder", status: .standby),
        Agent(id: "family-agent", name: "FAMILY", role: "myFamily.AI Operations", icon: "person.3", status: .standby),
        Agent(id: "audio-agent", name: "AUDIO", role: "DreamChamber Audio Pipeline", icon: "waveform", status: .standby),
    ]

    // MARK: - Never Clauses

    struct NeverClause: Identifiable {
        let id: Int
        let clause: String
        let category: String
        var verified: Bool
    }

    let neverClauses: [NeverClause] = [
        NeverClause(id: 1, clause: "Never synthesize without explicit consent", category: "personal", verified: true),
        NeverClause(id: 2, clause: "Never share voice data with third parties", category: "personal", verified: true),
        NeverClause(id: 3, clause: "Never use voice of deceased without estate authorization", category: "personal", verified: true),
        NeverClause(id: 4, clause: "Never create deepfakes or deceptive content", category: "personal", verified: true),
        NeverClause(id: 5, clause: "Never bypass Kill Switch revocation", category: "personal", verified: true),
        NeverClause(id: 6, clause: "Never reduce artist share below 75%", category: "personal", verified: true),
        NeverClause(id: 7, clause: "Never UPDATE or DELETE from noizy_ledger", category: "system", verified: true),
        NeverClause(id: 8, clause: "Never commit .env files or API keys", category: "system", verified: true),
        NeverClause(id: 9, clause: "Never deploy without smoke tests", category: "system", verified: true),
    ]

    // MARK: - Mission Log

    struct MissionEntry: Identifiable {
        let id = UUID()
        let timestamp: Date
        let action: String
        let agent: String
        let status: String
    }

    var missionLog: [MissionEntry] = []

    func log(action: String, agent: String = "GABRIEL", status: String = "COMPLETE") {
        missionLog.insert(
            MissionEntry(timestamp: Date(), action: action, agent: agent, status: status),
            at: 0
        )
    }

    // MARK: - System Health

    struct SystemStatus {
        var heavenOnline = false
        var gabrielWatching = false
        var version = "—"
        var portals: [String] = []
        var lastCheck: Date?
    }

    var system = SystemStatus()

    func checkHealth() async {
        do {
            let health = try await HeavenAPI.shared.health()
            system.heavenOnline = health.status == "alive"
            system.gabrielWatching = health.gabriel == "watching"
            system.version = health.version
            system.portals = health.portals
            system.lastCheck = Date()
            log(action: "Health check passed — v\(health.version)")
        } catch {
            system.heavenOnline = false
            system.gabrielWatching = false
            log(action: "Health check FAILED: \(error.localizedDescription)", status: "ERROR")
        }
    }

    private init() {}
}
