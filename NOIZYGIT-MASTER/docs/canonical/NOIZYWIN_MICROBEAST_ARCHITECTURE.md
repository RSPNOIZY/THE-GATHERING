# 🪟 NOIZYWIN MICROBEAST ARCHITECTURE & FOSS POWER AUTOMATE SUITE
## Windows 11 ARM64 · Parallels Desktop 27 API · MS Power Automate · DirectML
**Author:** Robert Stephen Plowman (`RSP_001`) · **Status:** CANONICAL MASTER BLUEPRINT  
**Host Architecture:** Apple M2 Ultra (192GB Unified Memory, 24-core CPU, 76-core GPU)  
**Virtual Machine:** `Windows 11` (UUID: `bcb76106-a5f9-4bd7-ac6a-8594a79ba9ee`)  
**Dedicated Storage:** `/Volumes/NOIZYWIN` (233.5 GB NVMe / Expandable Volume)  

---

## 🎯 Vision & Transformation
**NOIZYWIN Microbeast** bridges the best of Apple Silicon Unix architecture with the complete Windows 11 enterprise automation, gaming, audio DSP, and FOSS development ecosystem.

Through direct hypervisor APIs (`prlctl`), Model Context Protocol (MCP), Microsoft Power Automate Desktop, PowerShell 7, and DirectML AI acceleration, NOIZYWIN operates as an autonomous, high-throughput coprocessor to the macOS master station.

---

## ⚡ Core System Architecture

```
═════════════════════════════════════════════════════════════════════
  🍎 macOS HOST: Apple M2 Ultra (192GB RAM)
  ├── 🎮 Desktop Commander / Antigravity / Claude
  ├── 🛡️ NOIZYWIN Microbeast Controller (Python 3.11 / prlctl API)
  └── 🔌 MCP Server: mcps/noizywin_microbeast_mcp_server.py
═════════════════════════════════════════════════════════════════════
                       │  Bidirectional IPC / Shared Memory / virtio
                       ▼
═════════════════════════════════════════════════════════════════════
  🪟 GUEST OS: Windows 11 ARM64 (Parallels Desktop 27 Pro)
  ├── ⚡ PowerShell 7.4 (Core Scripting Engine)
  ├── 🤖 Microsoft Power Automate Desktop (RPA & Flow Orchestration)
  ├── 📦 Winget / Chocolatey FOSS Repository (FFmpeg, Python, VSCode)
  ├── 🧠 DirectML / ONNX Runtime (GPU-Accelerated Local AI)
  └── 💽 Dedicated Storage: C:\NOIZY <--> /Volumes/NOIZYWIN
═════════════════════════════════════════════════════════════════════
```

---

## 📦 Installed & Curated FOSS Windows Suite

| Category | Application | Package ID / Winget | Role |
|:---|:---|:---|:---|
| **RPA & Automation** | **MS Power Automate** | `Microsoft.PowerAutomateDesktop` | Robotic process automation, UI flows |
| **Shell & Core** | **PowerShell 7** | `Microsoft.PowerShell` | High-performance modern automation CLI |
| **Development** | **VS Code** | `Microsoft.VisualStudioCode` | Multi-language code editor & debugger |
| **Development** | **Git for Windows** | `Git.Git` | Sovereign monorepo sync & versioning |
| **Runtime** | **Python 3.12** | `Python.Python.3.12` | DirectML, PyTorch, audio script execution |
| **Runtime** | **Node.js LTS** | `OpenJS.NodeJS.LTS` | Windows MCP servers, n8n edge nodes |
| **Productivity** | **PowerToys** | `Microsoft.PowerToys` | OCR, FancyZones, Keyboard Manager |
| **Audio/DSP** | **FFmpeg** | `Gyan.FFmpeg` | 24-bit 48kHz audio transcoding & normalization |
| **Audio/DSP** | **Audacity** | `Audacity.Audacity` | Multi-track audio editing & waveform analysis |
| **3D / Creative** | **Blender 3D** | `BlenderFoundation.Blender` | 3D rendering, avatar asset generation |
| **Local AI** | **LM Studio Win** | `ElementLabs.LMStudio` | DirectML GGUF execution on Windows |
| **Local AI** | **Ollama Win** | `Ollama.Ollama` | Local LLM inference server |

---

## 🛠️ MCP Tools Exposed to AI Agents

1. `microbeast_vm_status`: Real-time inspection of VM state, RAM allocation, and hypervisor metrics.
2. `microbeast_start_vm`: Boot VM instance with zero host latency.
3. `microbeast_stop_vm`: Clean ACPI shutdown or sleep state.
4. `microbeast_exec_powershell`: Execute arbitrary PowerShell commands inside Windows 11 and return output.
5. `microbeast_power_automate_run`: Dispatches Power Automate Desktop flows on demand.
6. `microbeast_winget_install`: Installs any Windows FOSS package silently.

---

## 🚀 Quickstart Commands

```bash
# 1. View Microbeast Dashboard
python3 packages/noizywin-microbeast/noizywin_microbeast_manager.py status

# 2. Boot Windows 11 VM
python3 packages/noizywin-microbeast/noizywin_microbeast_manager.py start

# 3. Execute PowerShell command inside guest
python3 packages/noizywin-microbeast/noizywin_microbeast_manager.py exec "Get-Process | Select-Object -First 10"

# 4. Trigger Power Automate Flow
python3 packages/noizywin-microbeast/noizywin_microbeast_manager.py flow "NoizyAudioHarvestAndNormalize"
```

> *"GORUNFREE. DEFY THE DREED. BUILD THE NOIZYEMPIRE."*
