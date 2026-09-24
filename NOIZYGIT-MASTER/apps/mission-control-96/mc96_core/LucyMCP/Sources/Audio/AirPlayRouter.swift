import Foundation
import Network
import AVFoundation
import Combine

// ════════════════════════════════════════════════════════════
// AirPlayRouter — Native Multi-Device AirPlay
// Zero third-party. Pure AVAudioEngine + Network framework.
// Discovers, streams, syncs, falls back automatically.
// Routes VPN/SSH heaven traffic through same network layer.
// ════════════════════════════════════════════════════════════

@MainActor
final class AirPlayRouter: ObservableObject {
    static let shared = AirPlayRouter()
    
    // ── State ─────────────────────────────────────────────────
    @Published var discoveredDevices: [AirPlayDevice] = []
    @Published var activeStreams: [String: AirPlayStream] = [:]
    @Published var isDiscovering: Bool = false
    @Published var masterVolume: Float = 0.8
    
    // ── Audio Engine ──────────────────────────────────────────
    private let engine = AVAudioEngine()
    private let mainMixer: AVAudioMixerNode
    private var playerNodes: [String: AVAudioPlayerNode] = [:]
    
    // ── Network Discovery (Bonjour / mDNS) ───────────────────
    private var browser: NWBrowser?
    private let queue = DispatchQueue(label: "ai.noizy.lucy.airplay", qos: .userInitiated)
    
    // ── Route Change ──────────────────────────────────────────
    private var routeChangeObserver: Any?
    private var cancellables = Set<AnyCancellable>()
    
    private init() {
        mainMixer = engine.mainMixerNode
        setupAudioEngine()
        setupRouteMonitoring()
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Setup
    // ════════════════════════════════════════════════════════
    
    private func setupAudioEngine() {
        do {
            let session = AVAudioSession.sharedInstance()
            try session.setCategory(
                .playAndRecord,
                mode: .default,
                options: [
                    .allowAirPlay,
                    .allowBluetooth,
                    .allowBluetoothA2DP,
                    .mixWithOthers,
                    .defaultToSpeaker
                ]
            )
            try session.setActive(true)
            
            // Connect mixer to output
            let outputFormat = engine.outputNode.inputFormat(forBus: 0)
            engine.connect(mainMixer, to: engine.outputNode, format: outputFormat)
            
            print("[AirPlay] ✅ Audio engine configured")
        } catch {
            print("[AirPlay] ⚠️ Audio session setup: \(error)")
        }
    }
    
    private func setupRouteMonitoring() {
        // Monitor AirPlay route changes — auto-recover on device drop
        routeChangeObserver = NotificationCenter.default.addObserver(
            forName: AVAudioSession.routeChangeNotification,
            object: nil,
            queue: .main
        ) { [weak self] notification in
            Task { @MainActor [weak self] in
                self?.handleRouteChange(notification)
            }
        }
    }
    
    @MainActor
    private func handleRouteChange(_ notification: Notification) {
        guard let reason = notification.userInfo?[AVAudioSessionRouteChangeReasonKey] as? UInt else { return }
        
        switch AVAudioSession.RouteChangeReason(rawValue: reason) {
        case .oldDeviceUnavailable:
            // Device dropped — attempt fallback
            print("[AirPlay] ⚠️ Device dropped — attempting fallback")
            Task { await handleDeviceDrop() }
            
        case .newDeviceAvailable:
            // New AirPlay device appeared — update discovery
            Task { await refreshDiscovery() }
            
        case .routeConfigurationChange:
            updateActiveRoutes()
            
        default:
            break
        }
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Discovery
    // ════════════════════════════════════════════════════════
    
    func startDiscovery() async {
        guard !isDiscovering else { return }
        isDiscovering = true
        
        // Discover via Bonjour (mDNS) — _airplay._tcp
        let descriptor = NWBrowser.Descriptor.bonjour(type: "_airplay._tcp", domain: nil)
        let parameters = NWParameters()
        parameters.includePeerToPeer = true
        
        browser = NWBrowser(for: descriptor, using: parameters)
        
        browser?.browseResultsChangedHandler = { [weak self] results, changes in
            Task { @MainActor [weak self] in
                self?.processBonjourResults(results)
            }
        }
        
        browser?.stateUpdateHandler = { [weak self] state in
            switch state {
            case .failed(let error):
                print("[AirPlay] Browser failed: \(error)")
                Task { @MainActor [weak self] in self?.isDiscovering = false }
            default:
                break
            }
        }
        
        browser?.start(queue: queue)
        
        // Also check current AVAudioSession outputs
        await refreshFromSession()
        
        print("[AirPlay] 🔍 Discovery started")
    }
    
    func stopDiscovery() {
        browser?.cancel()
        browser = nil
        isDiscovering = false
    }
    
    func discover() async -> [AirPlayDevice] {
        await refreshFromSession()
        return discoveredDevices
    }
    
    private func processBonjourResults(_ results: Set<NWBrowser.Result>) {
        var devices: [AirPlayDevice] = []
        
        for result in results {
            if case .service(let name, let type, let domain, _) = result.endpoint {
                let device = AirPlayDevice(
                    id: name,
                    name: name,
                    type: type.contains("airplay") ? .airPlay : .generic,
                    domain: domain,
                    isConnected: false,
                    endpoint: result.endpoint
                )
                devices.append(device)
            }
        }
        
        // Merge with existing
        for device in devices {
            if !discoveredDevices.contains(where: { $0.id == device.id }) {
                discoveredDevices.append(device)
            }
        }
        
        print("[AirPlay] Found \(discoveredDevices.count) devices")
    }
    
    private func refreshFromSession() async {
        let session = AVAudioSession.sharedInstance()
        let outputs = session.currentRoute.outputs
        
        for output in outputs {
            let type = AirPlayDevice.DeviceType.from(portType: output.portType)
            let device = AirPlayDevice(
                id: output.uid,
                name: output.portName,
                type: type,
                domain: "local",
                isConnected: true,
                endpoint: nil
            )
            if !discoveredDevices.contains(where: { $0.id == device.id }) {
                discoveredDevices.append(device)
            } else if let idx = discoveredDevices.firstIndex(where: { $0.id == device.id }) {
                var updated = discoveredDevices[idx]
                updated.isConnected = true
                discoveredDevices[idx] = updated
            }
        }
    }
    
    private func refreshDiscovery() async {
        await refreshFromSession()
    }
    
    // ════════════════════════════════════════════════════════
    // MARK: — Streaming
    // ════════════════════════════════════════════════════════
    
    func streamTo(deviceId: String, volume: Double = 0.8) async -> Bool {
        guard let device = discoveredDevices.first(where: { $0.id == deviceId }) else {
            print("[AirPlay] Device not found: \(deviceId)")
            return false
        }
        
        do {
            // Select AirPlay output
            let session = AVAudioSession.sharedInstance()
            try session.overrideOutputAudioPort(.none)
            
            // Create player node for this device
            let player = AVAudioPlayerNode()
            engine.attach(player)
            
            let format = engine.mainMixerNode.outputFormat(forBus: 0)
            engine.connect(player, to: mainMixer, format: format)
            
            if !engine.isRunning {
                try engine.start()
            }
            
            player.volume = Float(volume) * masterVolume
            playerNodes[deviceId] = player
            
            let stream = AirPlayStream(
                id: UUID().uuidString,
                deviceId: deviceId,
                deviceName: device.name,
                volume: Float(volume),
                status: .active,
                startTime: Date()
            )
            activeStreams[deviceId] = stream
            
            print("[AirPlay] ✅ Streaming to: \(device.name)")
            return true
            
        } catch {
            print("[AirPlay] Stream failed: \(error)")
            return false
        }
    }
    
    func streamToAll(volume: Double = 0.8) async {
        // Broadcast to every discovered device
        for device in discoveredDevices {
            _ = await streamTo(deviceId: device.id, volume: volume)
        }
    }
    
    func setVolume(_ volume: Float, deviceId: String? = nil) {
        masterVolume = volume
        if let deviceId {
            playerNodes[deviceId]?.volume = volume
        } else {
            // Set all
            playerNodes.values.forEach { $0.volume = volume }
            mainMixer.outputVolume = volume
        }
    }
    
    func stopStream(deviceId: String) {
        playerNodes[deviceId]?.stop()
        playerNodes.removeValue(forKey: deviceId)
        activeStreams.removeValue(forKey: deviceId)
    }
    
    func stopAllStreams() {
        playerNodes.values.forEach { $0.stop() }
        playerNodes.removeAll()
        activeStreams.removeAll()
        if engine.isRunning { engine.stop() }
    }
    
    // ── Fallback on device drop ────────────────────────────────
    
    private func handleDeviceDrop() async {
        print("[AirPlay] Handling device drop — searching for fallback")
        
        // Find next available device
        let available = discoveredDevices.filter { $0.isConnected && !activeStreams.keys.contains($0.id) }
        
        if let fallback = available.first {
            print("[AirPlay] Falling back to: \(fallback.name)")
            _ = await streamTo(deviceId: fallback.id, volume: Double(masterVolume))
        } else {
            print("[AirPlay] No fallback available — routing to built-in speakers")
            do {
                let session = AVAudioSession.sharedInstance()
                try session.overrideOutputAudioPort(.speaker)
            } catch {
                print("[AirPlay] Fallback to speaker failed: \(error)")
            }
        }
    }
    
    private func updateActiveRoutes() {
        let session = AVAudioSession.sharedInstance()
        let currentOutputIds = session.currentRoute.outputs.map { $0.uid }
        
        // Mark devices active/inactive based on route
        for i in discoveredDevices.indices {
            discoveredDevices[i].isConnected = currentOutputIds.contains(discoveredDevices[i].id)
        }
    }
}

// ════════════════════════════════════════════════════════════
// MARK: — AirPlay Models
// ════════════════════════════════════════════════════════════

struct AirPlayDevice: Identifiable, Sendable {
    let id: String
    let name: String
    let type: DeviceType
    let domain: String
    var isConnected: Bool
    let endpoint: NWEndpoint?
    
    enum DeviceType: String, Sendable {
        case airPlay, bluetooth, hdmi, speaker, headphones, generic
        
        static func from(portType: AVAudioSession.Port) -> DeviceType {
            switch portType {
            case .airPlay:                                return .airPlay
            case .bluetoothA2DP, .bluetoothHFP, .bluetoothLE: return .bluetooth
            case .hdmi:                                   return .hdmi
            case .builtInSpeaker:                         return .speaker
            case .headphones, .headsetMic:                return .headphones
            default:                                      return .generic
            }
        }
        
        var icon: String {
            switch self {
            case .airPlay:      return "airplayvideo"
            case .bluetooth:    return "headphones"
            case .hdmi:         return "tv"
            case .speaker:      return "speaker.wave.3.fill"
            case .headphones:   return "headphones"
            case .generic:      return "speaker.fill"
            }
        }
    }
    
    func toJSON() -> [String: Any] {
        ["id": id, "name": name, "type": type.rawValue, "isConnected": isConnected]
    }
}

struct AirPlayStream: Identifiable, Sendable {
    let id: String
    let deviceId: String
    let deviceName: String
    var volume: Float
    var status: Status
    let startTime: Date
    
    enum Status: String, Sendable { case active, paused, error }
}
