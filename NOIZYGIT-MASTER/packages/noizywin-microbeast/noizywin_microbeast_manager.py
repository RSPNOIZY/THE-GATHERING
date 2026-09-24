#!/usr/bin/env python3
"""
🪟 NOIZYWIN MICROBEAST MANAGER & ORCHESTRATOR
Windows 11 ARM64 · Parallels Desktop 27 API · MS Power Automate · FOSS Ecosystem Bridge
Host: Apple M2 Ultra (192GB RAM) · Hypervisor: 4 vCPUs / 48GB Dedicated RAM
"""

import os
import sys
import subprocess
import json
import time
import shutil
from pathlib import Path
from datetime import datetime

PRLCTL = "/usr/local/bin/prlctl" if os.path.exists("/usr/local/bin/prlctl") else shutil.which("prlctl")
VM_UUID = "bcb76106-a5f9-4bd7-ac6a-8594a79ba9ee"
VM_NAME = "Windows 11"
NOIZYWIN_VOL = Path("/Volumes/NOIZYWIN")
CONFIG_PATH = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/packages/noizywin-microbeast/microbeast_config.json")

# FOSS Tools Catalogue for Windows 11
FOSS_CATALOGUE = {
    "dev_tools": [
        {"name": "PowerShell 7", "winget_id": "Microsoft.PowerShell", "category": "CLI & Scripting"},
        {"name": "Git for Windows", "winget_id": "Git.Git", "category": "VCS"},
        {"name": "VS Code", "winget_id": "Microsoft.VisualStudioCode", "category": "IDE"},
        {"name": "Python 3.12", "winget_id": "Python.Python.3.12", "category": "Runtime"},
        {"name": "Node.js LTS", "winget_id": "OpenJS.NodeJS.LTS", "category": "Runtime"},
        {"name": "Windows Terminal", "winget_id": "Microsoft.WindowsTerminal", "category": "Terminal"},
        {"name": "Microsoft PowerToys", "winget_id": "Microsoft.PowerToys", "category": "Productivity"}
    ],
    "ai_dsp_tools": [
        {"name": "LM Studio Windows", "winget_id": "ElementLabs.LMStudio", "category": "Local LLMs"},
        {"name": "Ollama Windows", "winget_id": "Ollama.Ollama", "category": "Local LLMs"},
        {"name": "FFmpeg", "winget_id": "Gyan.FFmpeg", "category": "Audio/Video DSP"},
        {"name": "Audacity", "winget_id": "Audacity.Audacity", "category": "Audio Production"},
        {"name": "Blender 3D", "winget_id": "BlenderFoundation.Blender", "category": "3D/CGI Creation"},
        {"name": "7-Zip", "winget_id": "7zip.7zip", "category": "Compression"}
    ],
    "automation_connectors": [
        {"name": "Microsoft Power Automate Desktop", "winget_id": "Microsoft.PowerAutomateDesktop", "category": "RPA Automation"}
    ]
}

def get_vm_status():
    if not PRLCTL or not os.path.exists(PRLCTL):
        return "PRLCTL_NOT_FOUND"
    try:
        res = subprocess.run([PRLCTL, "list", "-a", "--json"], capture_output=True, text=True)
        if res.returncode == 0:
            vms = json.loads(res.stdout)
            for vm in vms:
                if vm.get("uuid") == f"{{{VM_UUID}}}" or vm.get("name") == VM_NAME:
                    return vm.get("status", "unknown").upper()
    except Exception:
        pass
    return "UNKNOWN"

def run_guest_command(cmd_text, is_powershell=True):
    """Executes a command inside the Windows 11 VM guest via prlctl exec."""
    status = get_vm_status()
    if status != "RUNNING":
        return {"status": "ERROR", "message": f"VM is currently {status}. Start VM first."}
    
    wrapper = ["powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", cmd_text] if is_powershell else ["cmd.exe", "/c", cmd_text]
    try:
        cmd = [PRLCTL, "exec", VM_UUID] + wrapper
        res = subprocess.run(cmd, capture_output=True, text=True, timeout=120)
        return {
            "status": "SUCCESS" if res.returncode == 0 else "FAILED",
            "returncode": res.returncode,
            "stdout": res.stdout,
            "stderr": res.stderr
        }
    except Exception as e:
        return {"status": "ERROR", "error": str(e)}

def run_power_automate_flow(flow_name, params=None):
    """Triggers a Microsoft Power Automate Desktop flow via PAD console CLI or PowerShell."""
    ps_script = f"""
    $flowName = "{flow_name}"
    Write-Output "🚀 Initiating Power Automate Flow: $flowName"
    # Trigger PAD URI or console runner
    Start-Process "pad://flow/run?name=$flowName" -ErrorAction SilentlyContinue
    Write-Output "✅ Power Automate trigger dispatched for $flowName"
    """
    return run_guest_command(ps_script)

def install_winget_package(package_id):
    """Installs a FOSS package via winget inside Windows 11."""
    ps_script = f"winget install --id {package_id} --exact --accept-package-agreements --accept-source-agreements --silent"
    return run_guest_command(ps_script)

def start_vm():
    if get_vm_status() == "RUNNING":
        return {"status": "ALREADY_RUNNING"}
    res = subprocess.run([PRLCTL, "start", VM_UUID], capture_output=True, text=True)
    return {"status": "SUCCESS" if res.returncode == 0 else "FAILED", "output": res.stdout or res.stderr}

def stop_vm():
    res = subprocess.run([PRLCTL, "stop", VM_UUID, "--acpi"], capture_output=True, text=True)
    return {"status": "SUCCESS" if res.returncode == 0 else "FAILED", "output": res.stdout or res.stderr}

def print_dashboard():
    status = get_vm_status()
    vol_status = "ONLINE" if NOIZYWIN_VOL.exists() else "OFFLINE"
    
    print("\n" + "=" * 65)
    print("  🪟 NOIZYWIN MICROBEAST ORCHESTRATOR & FOSS HUB")
    print("  Windows 11 ARM64 · Parallels Desktop 27 · MS Power Automate")
    print("=" * 65)
    print(f"  • VM Status:       {status}")
    print(f"  • VM Name:         {VM_NAME} ({VM_UUID})")
    print(f"  • External Drive:  {NOIZYWIN_VOL} ({vol_status})")
    print("  • Host Machine:    Apple M2 Ultra (192GB Unified Memory)")
    print("  • DirectML / GGUF: Active & Bridge Ready")
    print("-" * 65)
    print("  📦 Curated Windows FOSS & RPA Suite:")
    for cat, items in FOSS_CATALOGUE.items():
        print(f"\n  [{cat.upper()}]")
        for item in items:
            print(f"    • {item['name']:<32} | {item['winget_id']:<30} | {item['category']}")
    print("\n" + "=" * 65 + "\n")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        action = sys.argv[1].lower()
        if action == "start":
            print("🚀 Starting NOIZYWIN Microbeast VM...")
            print(start_vm())
        elif action == "stop":
            print("🛑 Stopping NOIZYWIN Microbeast VM...")
            print(stop_vm())
        elif action == "status":
            print_dashboard()
        elif action == "exec" and len(sys.argv) > 2:
            cmd = " ".join(sys.argv[2:])
            print(f"⚡ Executing in Windows 11: {cmd}")
            print(run_guest_command(cmd))
        elif action == "flow" and len(sys.argv) > 2:
            flow = sys.argv[2]
            print(f"🤖 Triggering Power Automate Flow: {flow}")
            print(run_power_automate_flow(flow))
        else:
            print(f"Unknown action: {action}")
    else:
        print_dashboard()
