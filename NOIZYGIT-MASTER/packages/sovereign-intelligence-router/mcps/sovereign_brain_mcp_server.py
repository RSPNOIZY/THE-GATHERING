#!/usr/bin/env python3
"""
🧠 SOVEREIGN BRAIN & COUNCIL MCP SERVER v2.0
Model Context Protocol (MCP) JSON-RPC 2.0 Server
Connects Antigravity, Claude, Cursor, Windsurf, and Desktop Commander to Sovereign Memory & Council Personas.
"""

import sys
import json
from pathlib import Path

# Add router directory to sys.path
ROUTER_DIR = Path(__file__).parent.parent
sys.path.insert(0, str(ROUTER_DIR))

import sovereign_intelligence_router as router

TOOLS = [
    {
        "name": "sovereign_search_memory",
        "description": "Perform lightning RAG semantic & multi-keyword search across all 16 canonical SQLite databases in the sovereign fleet.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "query": {
                    "type": "string",
                    "description": "Keywords, artist names, invoices, tools, ideation, or domain terms to search."
                },
                "limit": {
                    "type": "integer",
                    "description": "Maximum number of results to return (default: 15)."
                },
                "db_filter": {
                    "type": "string",
                    "description": "Optional substring filter to restrict search to a specific database name."
                }
            },
            "required": ["query"]
        }
    },
    {
        "name": "sovereign_ask_council",
        "description": "Deliberate with the Sovereign AI Council (RSP_001, GABRIEL, LUCY, MC96) with automatic domain classification and live multi-database RAG memory.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "prompt": {
                    "type": "string",
                    "description": "The mission, challenge, creative ideation, or architectural decision to address."
                },
                "persona": {
                    "type": "string",
                    "description": "Optional override: 'RSP_001', 'GABRIEL', 'LUCY', or 'MC96'. If omitted, auto-routes based on intent.",
                    "enum": ["RSP_001", "GABRIEL", "LUCY", "MC96"]
                }
            },
            "required": ["prompt"]
        }
    },
    {
        "name": "sovereign_model_health",
        "description": "Check the status and loaded models in local LM Studio (127.0.0.1:1234), Ollama (127.0.0.1:11434), and Apple Silicon M2 Ultra accelerators.",
        "inputSchema": {
            "type": "object",
            "properties": {}
        }
    }
]

def handle_call(tool_name, args):
    if tool_name == "sovereign_search_memory":
        q = args.get("query", "")
        lim = args.get("limit", 15)
        db_f = args.get("db_filter")
        results = router.query_sovereign_memory(q, limit=lim, db_filter=db_f)
        return {"status": "SUCCESS", "telemetry": results}

    elif tool_name == "sovereign_ask_council":
        prompt = args.get("prompt", "")
        persona = args.get("persona")
        delib = router.execute_council_deliberation(prompt, forced_persona=persona)
        return {"status": "SUCCESS", "deliberation": delib}

    elif tool_name == "sovereign_model_health":
        health = router.check_local_model_health()
        return {"status": "SUCCESS", "health": health}

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
                        "serverInfo": {"name": "sovereign-brain-mcp", "version": "4.2.0"}
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
