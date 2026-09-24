#!/usr/bin/env python3
"""
🪟 NOIZYWIN MICROBEAST MCP SERVER
Standard Model Context Protocol (MCP) JSON-RPC 2.0 Server
Connects Antigravity, Claude, Cursor, and Desktop Commander to Windows 11 ARM64 VM.
"""

import sys
import json
import subprocess
import os
from pathlib import Path

PRLCTL = "/usr/local/bin/prlctl" if os.path.exists("/usr/local/bin/prlctl") else "prlctl"
VM_UUID = "bcb76106-a5f9-4bd7-ac6a-8594a79ba9ee"

TOOLS = [
    {
        "name": "microbeast_vm_status",
        "description": "Inspect NOIZYWIN Windows 11 ARM64 VM status, memory, and hypervisor health.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "microbeast_start_vm",
        "description": "Power on the NOIZYWIN Windows 11 ARM64 VM.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "microbeast_stop_vm",
        "description": "Safely shut down the NOIZYWIN Windows 11 ARM64 VM via ACPI.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "microbeast_exec_powershell",
        "description": "Execute a PowerShell 7 script inside the Windows 11 VM and return stdout/stderr.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "script": {
                    "type": "string",
                    "description": "PowerShell command or script block to execute."
                }
            },
            "required": ["script"]
        }
    },
    {
        "name": "microbeast_power_automate_run",
        "description": "Trigger a Microsoft Power Automate Desktop flow inside Windows 11.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "flow_name": {
                    "type": "string",
                    "description": "Name of the Power Automate Desktop flow to trigger."
                },
                "params": {
                    "type": "object",
                    "description": "Optional parameters to pass to the flow."
                }
            },
            "required": ["flow_name"]
        }
    },
    {
        "name": "microbeast_winget_install",
        "description": "Install a FOSS software package via Windows Package Manager (winget).",
        "inputSchema": {
            "type": "object",
            "properties": {
                "package_id": {
                    "type": "string",
                    "description": "Exact Winget Package ID (e.g. 'Microsoft.PowerShell', 'Gyan.FFmpeg', 'Ollama.Ollama')."
                }
            },
            "required": ["package_id"]
        }
    }
]

def handle_call(tool_name, args):
    if tool_name == "microbeast_vm_status":
        try:
            res = subprocess.run([PRLCTL, "list", "-a", "--json"], capture_output=True, text=True)
            if res.returncode == 0:
                vms = json.loads(res.stdout)
                for vm in vms:
                    if vm.get("uuid") == f"{{{VM_UUID}}}":
                        return {"status": "SUCCESS", "vm_info": vm}
            return {"status": "SUCCESS", "raw": res.stdout}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

    elif tool_name == "microbeast_start_vm":
        try:
            res = subprocess.run([PRLCTL, "start", VM_UUID], capture_output=True, text=True)
            return {"status": "SUCCESS" if res.returncode == 0 else "FAILED", "output": res.stdout or res.stderr}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

    elif tool_name == "microbeast_stop_vm":
        try:
            res = subprocess.run([PRLCTL, "stop", VM_UUID, "--acpi"], capture_output=True, text=True)
            return {"status": "SUCCESS" if res.returncode == 0 else "FAILED", "output": res.stdout or res.stderr}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

    elif tool_name == "microbeast_exec_powershell":
        script = args.get("script", "")
        try:
            cmd = [PRLCTL, "exec", VM_UUID, "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
            return {
                "status": "SUCCESS" if res.returncode == 0 else "FAILED",
                "returncode": res.returncode,
                "stdout": res.stdout,
                "stderr": res.stderr
            }
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

    elif tool_name == "microbeast_power_automate_run":
        flow_name = args.get("flow_name", "")
        script = f'Start-Process "pad://flow/run?name={flow_name}" -ErrorAction SilentlyContinue; Write-Output "PAD Flow Triggered: {flow_name}"'
        try:
            cmd = [PRLCTL, "exec", VM_UUID, "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
            return {"status": "SUCCESS", "stdout": res.stdout}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

    elif tool_name == "microbeast_winget_install":
        pkg = args.get("package_id", "")
        script = f'winget install --id {pkg} --exact --accept-package-agreements --accept-source-agreements --silent'
        try:
            cmd = [PRLCTL, "exec", VM_UUID, "powershell.exe", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script]
            res = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            return {"status": "SUCCESS" if res.returncode == 0 else "FAILED", "stdout": res.stdout, "stderr": res.stderr}
        except Exception as e:
            return {"status": "ERROR", "error": str(e)}

    return {"status": "ERROR", "message": f"Unknown tool: {tool_name}"}

def main():
    for line in sys.stdin:
        if not line.strip():
            continue
        try:
            req = json.loads(line)
            req_id = req.get("id")
            method = req.get("method")

            if method == "initialize":
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "protocolVersion": "2024-11-05",
                        "capabilities": {"tools": {}},
                        "serverInfo": {"name": "noizywin-microbeast-mcp", "version": "1.0.0"}
                    }
                }
            elif method == "tools/list":
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {"tools": TOOLS}
                }
            elif method == "tools/call":
                params = req.get("params", {})
                name = params.get("name")
                args = params.get("arguments", {})
                res = handle_call(name, args)
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "result": {
                        "content": [{"type": "text", "text": json.dumps(res, indent=2)}]
                    }
                }
            else:
                resp = {
                    "jsonrpc": "2.0",
                    "id": req_id,
                    "error": {"code": -32601, "message": "Method not found"}
                }
            sys.stdout.write(json.dumps(resp) + "\n")
            sys.stdout.flush()
        except Exception as e:
            err_resp = {
                "jsonrpc": "2.0",
                "id": None,
                "error": {"code": -32700, "message": str(e)}
            }
            sys.stdout.write(json.dumps(err_resp) + "\n")
            sys.stdout.flush()

if __name__ == "__main__":
    main()
