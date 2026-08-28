# NOIZYLAB Architecture

## 🏗️ System Architecture

### Core Components

```
NOIZYLAB Ecosystem
├── MissionControl96 (Control Layer)
│   ├── Network Control
│   │   ├── Jumbo Frames (MTU 9000)
│   │   ├── TCP Optimization
│   │   └── Adapter Tuning
│   ├── System Control
│   │   ├── Power Management
│   │   ├── Memory Optimization
│   │   └── Service Management
│   └── Security Control
│       ├── AUTOALLOW Rules
│       ├── Firewall Management
│       └── Execution Policies
│
├── Inspiron ReBirth (Optimization Layer)
│   ├── System Optimization
│   │   ├── Cleanup Scripts
│   │   ├── Driver Management
│   │   └── Performance Tuning
│   ├── Monitoring Dashboard
│   │   ├── Real-time Metrics
│   │   ├── Historical Data
│   │   └── Alert System
│   └── Display Calibration
│       ├── Planar 2495 Support
│       └── Color Calibration
│
└── VTFX Studio (VR Development Layer)
    ├── Unity Integration
    ├── Oculus SDK
    └── Haptic System
```

## 🔄 Data Flow

### Monitoring Flow
```
System Metrics → Python Collector → JSON Storage → Dashboard API → Web UI
```

### Optimization Flow
```
User Action → PowerShell Script → System Changes → Verification → Report
```

### Network Flow
```
Network Interface → MTU Configuration → TCP Stack → Adapter Settings → Verification
```

## 🔌 Integration Points

### MC96 ↔ Inspiron
- Network configuration shared
- Dashboard API integration
- Optimization script execution

### MC96 ↔ VTFX Studio
- Network optimization for VR streaming
- System performance for Unity builds
- Resource management

### Inspiron ↔ Dashboard
- Real-time metrics API
- Optimization trigger API
- Status reporting

## 📊 Monitoring Architecture

```
┌─────────────────┐
│  System Metrics │
│  (psutil/WMI)   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Python Monitor │
│  (60s interval) │
└────────┬────────┘
         │
         ▼
┌─────────────────┐     ┌──────────────┐
│  JSON Storage    │────▶│  Dashboard   │
│  (data/*.json)  │     │  (Port 8080) │
└─────────────────┘     └──────────────┘
```

## 🛡️ Security Architecture

### AUTOALLOW System
```
PowerShell Execution Policy
    ↓
Firewall Rules (MC96-*)
    ↓
Windows Defender Exclusions
    ↓
Network Permissions
    ↓
Scheduled Task (Boot)
```

### Persistence Layer
- Registry keys for settings
- Scheduled tasks for auto-run
- Firewall rules for network
- Execution policies for scripts

## 🚀 Performance Architecture

### Optimization Pipeline
```
1. AUTOALLOW Configuration
2. Network Optimization (Jumbo Frames + TCP)
3. System Optimization (Power + Memory + Services)
4. Verification & Reporting
```

### Network Stack
```
Application Layer
    ↓
TCP Stack (Optimized)
    ↓
Network Adapter (MTU 9000)
    ↓
Physical Layer (CAT Cables)
```

## 📦 Component Dependencies

### MissionControl96
- PowerShell 5.1+
- Windows 10/11
- Administrator rights

### Inspiron ReBirth
- Python 3.8+
- psutil library
- PowerShell scripts
- Web browser (for dashboard)

### VTFX Studio
- Unity 2020.3.25f1
- Oculus XR SDK
- C# .NET Framework
- Oculus hardware

## 🔗 External Integrations

### Network Services
- DNS: Cloudflare (1.1.1.1) + Google (8.8.8.8)
- Firewall: Windows Firewall API
- Network Profiles: Windows Networking API

### System Services
- Power Management: powercfg.exe
- Service Control: Get-Service/Set-Service
- Registry: .NET Registry APIs

### Monitoring Services
- System Metrics: psutil (Python)
- Network Stats: Get-NetAdapter (PowerShell)
- Process Info: WMI/CIM (PowerShell)

---

**Architecture designed for maximum performance and full control!** 🎯

