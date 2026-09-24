/**
 * ╔════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╗
 * ║     📱 A E O N   C O M P A N I O N   A P P   -   S W I F T U I 📱                                                     ║
 * ╚════════════════════════════════════════════════════════════════════════════════════════════════════════════════════════╝
 */

import SwiftUI
import CoreBluetooth
import AVFoundation

// MARK: - Power State Model
struct PowerState: Codable {
    var mode: String = "BUFFER"
    var soc: Double = 50.0
    var voltage: Double = 3.7
    var harvestMW: Double = 0
    var loadMW: Double = 0
    var netMW: Double = 0
    var supercapV: Double = 0
    var runtimeHr: Double = 10
    var alerts: UInt8 = 0
    var aiLevel: String = "NORMAL"
    var connected: Bool = false
    
    var socColor: Color {
        if soc > 50 { return .green }
        if soc > 20 { return .yellow }
        return .red
    }
    
    var modeColor: Color {
        switch mode {
        case "HARVEST": return .green
        case "BOOST": return .cyan
        case "BURST": return .orange
        case "CRITICAL": return .red
        default: return .blue
        }
    }
    
    var burstReady: Bool { alerts & 0x20 != 0 }
}

// MARK: - BLE Manager
class BLEManager: NSObject, ObservableObject, CBCentralManagerDelegate, CBPeripheralDelegate {
    @Published var powerState = PowerState()
    @Published var isConnected = false
    @Published var connectionStatus = "Disconnected"
    
    private var centralManager: CBCentralManager!
    private var pmicPeripheral: CBPeripheral?
    private var powerCharacteristic: CBCharacteristic?
    private var commandCharacteristic: CBCharacteristic?
    
    private let serviceUUID = CBUUID(string: "AE0N0001-0000-0000-0000-000000000001")
    private let powerCharUUID = CBUUID(string: "AE0N0001-0001-0000-0000-000000000001")
    private let commandCharUUID = CBUUID(string: "AE0N0001-0002-0000-0000-000000000001")
    
    override init() {
        super.init()
        centralManager = CBCentralManager(delegate: self, queue: nil)
    }
    
    func startScanning() {
        guard centralManager.state == .poweredOn else { return }
        connectionStatus = "Scanning..."
        centralManager.scanForPeripherals(withServices: [serviceUUID])
    }
    
    func sendBurstOn() { sendCommand(0x01) }
    func sendBurstOff() { sendCommand(0x02) }
    
    private func sendCommand(_ cmd: UInt8) {
        guard let char = commandCharacteristic, let peripheral = pmicPeripheral else { return }
        peripheral.writeValue(Data([cmd]), for: char, type: .withResponse)
    }
    
    func centralManagerDidUpdateState(_ central: CBCentralManager) {
        if central.state == .poweredOn { startScanning() }
    }
    
    func centralManager(_ central: CBCentralManager, didDiscover peripheral: CBPeripheral, advertisementData: [String: Any], rssi: NSNumber) {
        if peripheral.name?.contains("AEON") == true {
            pmicPeripheral = peripheral
            pmicPeripheral?.delegate = self
            centralManager.connect(peripheral)
            centralManager.stopScan()
            connectionStatus = "Connecting..."
        }
    }
    
    func centralManager(_ central: CBCentralManager, didConnect peripheral: CBPeripheral) {
        isConnected = true
        connectionStatus = "Connected"
        powerState.connected = true
        peripheral.discoverServices([serviceUUID])
    }
    
    func centralManager(_ central: CBCentralManager, didDisconnectPeripheral peripheral: CBPeripheral, error: Error?) {
        isConnected = false
        connectionStatus = "Disconnected"
        powerState.connected = false
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) { self.startScanning() }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverServices error: Error?) {
        guard let service = peripheral.services?.first else { return }
        peripheral.discoverCharacteristics([powerCharUUID, commandCharUUID], for: service)
    }
    
    func peripheral(_ peripheral: CBPeripheral, didDiscoverCharacteristicsFor service: CBService, error: Error?) {
        for char in service.characteristics ?? [] {
            if char.uuid == powerCharUUID {
                powerCharacteristic = char
                peripheral.setNotifyValue(true, for: char)
            } else if char.uuid == commandCharUUID {
                commandCharacteristic = char
            }
        }
    }
    
    func peripheral(_ peripheral: CBPeripheral, didUpdateValueFor characteristic: CBCharacteristic, error: Error?) {
        guard let data = characteristic.value, data.count >= 18 else { return }
        powerState.mode = ["HARVEST","BUFFER","BOOST","BURST","CRITICAL","SLEEP","OTA"][Int(data[0]) % 7]
        powerState.soc = Double(UInt16(data[1]) | (UInt16(data[2]) << 8)) / 100.0
        powerState.voltage = Double(UInt16(data[3]) | (UInt16(data[4]) << 8)) / 1000.0
        powerState.supercapV = Double(UInt16(data[5]) | (UInt16(data[6]) << 8)) / 1000.0
        powerState.harvestMW = Double(UInt16(data[7]) | (UInt16(data[8]) << 8))
        powerState.loadMW = Double(UInt16(data[9]) | (UInt16(data[10]) << 8))
        powerState.netMW = Double(Int16(bitPattern: UInt16(data[11]) | (UInt16(data[12]) << 8)))
        powerState.runtimeHr = Double(UInt16(data[13]) | (UInt16(data[14]) << 8)) / 60.0
        powerState.alerts = data[15]
        powerState.aiLevel = ["EMERGENCY","MINIMAL","REDUCED","NORMAL","FULL"][Int(data[16]) % 5]
    }
}

// MARK: - Cloud Manager
class CloudManager: ObservableObject {
    @Published var status = "Offline"
    @Published var burstSignal = "OFF"
    private let endpoint = "https://aeon-god-kernel-v2.workers.dev"
    private var timer: Timer?
    
    func start(ble: BLEManager) {
        timer = Timer.scheduledTimer(withTimeInterval: 1, repeats: true) { _ in
            self.sync(ble.powerState)
        }
    }
    
    func sync(_ state: PowerState) {
        guard let url = URL(string: "\(endpoint)/power") else { return }
        var req = URLRequest(url: url)
        req.httpMethod = "POST"
        req.setValue("application/json", forHTTPHeaderField: "Content-Type")
        req.httpBody = try? JSONEncoder().encode(state)
        
        URLSession.shared.dataTask(with: req) { data, _, _ in
            DispatchQueue.main.async {
                if let data = data, let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any] {
                    self.status = "Online"
                    self.burstSignal = json["burst_signal"] as? String ?? "OFF"
                } else {
                    self.status = "Error"
                }
            }
        }.resume()
    }
}

// MARK: - Main View
struct DashboardView: View {
    @StateObject var ble = BLEManager()
    @StateObject var cloud = CloudManager()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Battery Ring
                    ZStack {
                        Circle().stroke(Color.gray.opacity(0.3), lineWidth: 20)
                        Circle().trim(from: 0, to: CGFloat(ble.powerState.soc / 100))
                            .stroke(ble.powerState.socColor, style: StrokeStyle(lineWidth: 20, lineCap: .round))
                            .rotationEffect(.degrees(-90))
                        VStack {
                            Text("\(Int(ble.powerState.soc))%")
                                .font(.system(size: 48, weight: .bold))
                                .foregroundColor(ble.powerState.socColor)
                            Text(ble.powerState.mode)
                                .foregroundColor(ble.powerState.modeColor)
                        }
                    }.frame(height: 200).padding()
                    
                    // Stats Grid
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                        StatCard(title: "Harvest", value: "\(Int(ble.powerState.harvestMW)) mW", color: .yellow)
                        StatCard(title: "Load", value: "\(Int(ble.powerState.loadMW)) mW", color: .blue)
                        StatCard(title: "Runtime", value: String(format: "%.1f hr", ble.powerState.runtimeHr), color: .green)
                        StatCard(title: "Supercap", value: String(format: "%.1fV", ble.powerState.supercapV), color: .orange)
                    }.padding(.horizontal)
                    
                    // AI Level
                    HStack {
                        Image(systemName: "brain")
                        Text("AI: \(ble.powerState.aiLevel)")
                        Spacer()
                        Circle().fill(cloud.status == "Online" ? Color.green : Color.red).frame(width: 10)
                        Text(cloud.status).font(.caption)
                    }.padding()
                    
                    // Burst Button
                    if ble.powerState.burstReady {
                        Button(action: { ble.sendBurstOn() }) {
                            Label("BURST MODE", systemImage: "flame.fill")
                                .frame(maxWidth: .infinity).padding()
                                .background(Color.orange).foregroundColor(.white).cornerRadius(10)
                        }.padding(.horizontal)
                    }
                    
                    // Status
                    HStack {
                        Circle().fill(ble.isConnected ? Color.green : Color.red).frame(width: 10)
                        Text(ble.connectionStatus).font(.caption)
                        Spacer()
                        if !ble.isConnected { Button("Scan") { ble.startScanning() }.font(.caption) }
                    }.padding()
                }
            }
            .navigationTitle("⚡ AEON Power")
            .onAppear { cloud.start(ble: ble) }
        }
    }
}

struct StatCard: View {
    let title: String; let value: String; let color: Color
    var body: some View {
        VStack(alignment: .leading) {
            Text(title).font(.caption).foregroundColor(.secondary)
            Text(value).font(.title2).fontWeight(.bold)
        }
        .frame(maxWidth: .infinity, alignment: .leading)
        .padding().background(Color(.systemGray6)).cornerRadius(12)
    }
}

@main
struct AeonCompanionApp: App {
    var body: some Scene {
        WindowGroup { DashboardView().preferredColorScheme(.dark) }
    }
}
