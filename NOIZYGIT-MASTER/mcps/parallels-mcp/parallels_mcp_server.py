#!/usr/bin/env python3
"""
parallels_mcp_server.py
MCP (Model Context Protocol) Server for Parallels Desktop 27 & Windows 11 Guest Automation.

Exposes tools for Claude, Desktop Commander, and AI Agents:
- get_vm_status
- start_vm
- stop_vm
- exec_command (PowerShell / CMD inside Windows 11)
- install_tools
- capture_screenshot
"""

import sys
import json
import subprocess

PRLCTL = "/usr/local/bin/prlctl"
VM_NAME = "Windows 11"

def handle_call(tool_name, arguments):
    if tool_name == "get_vm_status":
        res = subprocess.run([PRLCTL, "list", "-a", "--info", VM_NAME], capture_output=True, text=True)
        return {"output": res.stdout or res.stderr}

    elif tool_name == "start_vm":
        res = subprocess.run([PRLCTL, "start", VM_NAME], capture_output=True, text=True)
        return {"output": res.stdout or res.stderr, "status": "started" if res.returncode == 0 else "error"}

    elif tool_name == "stop_vm":
        mode = arguments.get("mode", "acpi")
        res = subprocess.run([PRLCTL, "stop", VM_NAME, f"--{mode}"], capture_output=True, text=True)
        return {"output": res.stdout or res.stderr, "status": "stopped" if res.returncode == 0 else "error"}

    elif tool_name == "exec_command":
        cmd = arguments.get("command", "")
        # prlctl exec <vm> <command>
        res = subprocess.run([PRLCTL, "exec", VM_NAME, "powershell.exe", "-Command", cmd], capture_output=True, text=True)
        return {"output": res.stdout or res.stderr, "exit_code": res.returncode}

    elif tool_name == "install_tools":
        res = subprocess.run([PRLCTL, "installtools", VM_NAME], capture_output=True, text=True)
        return {"output": res.stdout or res.stderr}

    elif tool_name == "capture_screenshot":
        out_path = arguments.get("output_path", "/tmp/windows11_screenshot.png")
        res = subprocess.run([PRLCTL, "capture", VM_NAME, "--file", out_path], capture_output=True, text=True)
        return {"output": f"Screenshot saved to {out_path}", "path": out_path}

    else:
        return {"error": f"Unknown tool: {tool_name}"}

def main():
    if len(sys.argv) > 1 and sys.argv[1] == "--test":
        print("Testing Parallels MCP tools:")
        print(handle_call("get_vm_status", {}))
        return

    # Standard JSON-RPC / MCP loop
    for line in sys.stdin:
        try:
            req = json.loads(line.strip())
            tool = req.get("tool")
            args = req.get("arguments", {})
            resp = handle_call(tool, args)
            print(json.dumps({"id": req.get("id"), "result": resp}))
            sys.stdout.flush()
        except Exception as e:
            print(json.dumps({"error": str(e)}))
            sys.stdout.flush()

if __name__ == "__main__":
    main()
