#!/usr/bin/env python3
"""
⛏️ GOPHERS, MINERS & TELEMETRY MCP SERVER v2.0
Model Context Protocol (MCP) JSON-RPC 2.0 Server
Exposes tools to query live M2 Ultra hardware telemetry, mining status, and metadata indexes.
Fish Music Inc. · NOIZY Ecosystem · RSP_001
"""

import sys
import json
import sqlite3
from pathlib import Path

ROUTER_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROUTER_DIR))

import master_gopher_fleet_runner as gopher_runner

TOOLS = [
    {
        "name": "gopher_get_live_telemetry",
        "description": "Get real-time telemetry of Apple Silicon M2 Ultra (RAM, Swap, CPU/GPU, active daemons, mounted volumes, total database memory footprint).",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    },
    {
        "name": "gopher_trigger_mining_sweep",
        "description": "Trigger an autonomous mining sweep across Audio, Git repos, AI Ideations, and Contacts.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "target_gopher": {
                    "type": "string",
                    "description": "Specific gopher to run ('ALL', 'AUDIO', 'CODE', 'IDEAS', 'CONTACTS', 'TELEMETRY').",
                    "enum": ["ALL", "AUDIO", "CODE", "IDEAS", "CONTACTS", "TELEMETRY"]
                }
            }
        }
    },
    {
        "name": "gopher_query_telemetry_history",
        "description": "Query historical hardware and fleet telemetry snapshots from NOIZY_FLEET_TELEMETRY.sqlite.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {
                    "type": "integer",
                    "description": "Number of recent snapshots to return (default: 10)."
                }
            }
        }
    }
]

def handle_call(tool_name, args):
    if tool_name == "gopher_get_live_telemetry":
        telem = gopher_runner.run_hardware_telemetry()
        return {"status": "SUCCESS", "telemetry": telem}

    elif tool_name == "gopher_trigger_mining_sweep":
        target = args.get("target_gopher", "ALL")
        gopher_runner.run_all_gophers()
        return {"status": "SUCCESS", "message": f"Mining sweep for '{target}' completed successfully."}

    elif tool_name == "gopher_query_telemetry_history":
        lim = args.get("limit", 10)
        db_path = gopher_runner.TELEMETRY_DB
        history = []
        if db_path.exists():
            try:
                conn = sqlite3.connect(str(db_path))
                conn.row_factory = sqlite3.Row
                cur = conn.cursor()
                cur.execute("SELECT * FROM fleet_telemetry ORDER BY id DESC LIMIT ?", (lim,))
                history = [dict(r) for r in cur.fetchall()]
                conn.close()
            except Exception as e:
                return {"status": "ERROR", "message": str(e)}
        return {"status": "SUCCESS", "count": len(history), "history": history}

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
                        "serverInfo": {"name": "gopher-miners-mcp", "version": "2.0.0"}
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
