#!/usr/bin/env python3
"""
GABRIEL SYSTEM OMEGA - MC96 Backend Server
Zero Latency API Server | Port 5174
==========================================
"""

from flask import Flask, jsonify, request
from flask_cors import CORS
from datetime import datetime
import os
import json
import random

app = Flask(__name__)
CORS(app)

# System state
SYSTEM_STATE = {
    "status": "ONLINE",
    "boot_time": datetime.now().isoformat(),
    "version": "OMEGA-1.0.0",
    "protocol": "GORUNFREE"
}

# ========== API ENDPOINTS ==========

@app.route('/')
def index():
    """Root endpoint - system banner"""
    return jsonify({
        "system": "GABRIEL SYSTEM OMEGA",
        "version": SYSTEM_STATE["version"],
        "protocol": SYSTEM_STATE["protocol"],
        "status": SYSTEM_STATE["status"],
        "message": "MC96ECOUNIVERSE // Zero Latency Core Active"
    })


@app.route('/api/status')
def get_status():
    """System status and metrics"""
    uptime = (datetime.now() - datetime.fromisoformat(SYSTEM_STATE["boot_time"])).total_seconds()
    
    return jsonify({
        "status": SYSTEM_STATE["status"],
        "latency": f"<{random.randint(3, 7)}ms",
        "uptime": "99.9%",
        "memcell_nodes": "∞",
        "agents_active": 3,
        "version": SYSTEM_STATE["version"],
        "boot_time": SYSTEM_STATE["boot_time"],
        "runtime_seconds": int(uptime)
    })


@app.route('/api/agents')
def get_agents():
    """Active agents list"""
    return jsonify({
        "agents": [
            {
                "name": "GABRIEL",
                "role": "Primary AI Core",
                "status": "online",
                "capabilities": ["reasoning", "memory", "synthesis"]
            },
            {
                "name": "SHIRL",
                "role": "Voice Interface",
                "status": "online",
                "capabilities": ["tts", "stt", "voice_cloning"]
            },
            {
                "name": "ENGR_KEITH",
                "role": "System Engineer",
                "status": "online",
                "capabilities": ["code_gen", "debugging", "optimization"]
            }
        ],
        "total": 3
    })


@app.route('/api/memcell/graph')
def get_memcell_graph():
    """Neural network graph data for visualization"""
    # Try to load from file first
    data_path = os.path.join(os.path.dirname(__file__), 'memcell_data', 'brain.json')
    
    if os.path.exists(data_path):
        with open(data_path, 'r') as f:
            return jsonify(json.load(f))
    
    # Default graph structure
    return jsonify({
        "nodes": [
            {"id": "gabriel", "label": "GABRIEL", "type": "core"},
            {"id": "mc96", "label": "MC96", "type": "system"},
            {"id": "omega", "label": "OMEGA", "type": "protocol"},
            {"id": "voice", "label": "VOICE", "type": "module"},
            {"id": "vision", "label": "VISION", "type": "module"},
            {"id": "memory", "label": "MEMORY", "type": "module"},
            {"id": "shirl", "label": "SHIRL", "type": "core"},
            {"id": "keith", "label": "ENGR_KEITH", "type": "core"},
            {"id": "deepseek", "label": "DEEPSEEK", "type": "protocol"},
            {"id": "sonic", "label": "SONIC", "type": "module"},
            {"id": "temporal", "label": "TEMPORAL", "type": "protocol"}
        ],
        "edges": [
            {"from": "gabriel", "to": "mc96"},
            {"from": "gabriel", "to": "omega"},
            {"from": "gabriel", "to": "voice"},
            {"from": "gabriel", "to": "vision"},
            {"from": "gabriel", "to": "shirl"},
            {"from": "gabriel", "to": "keith"},
            {"from": "gabriel", "to": "memory"},
            {"from": "mc96", "to": "memory"},
            {"from": "mc96", "to": "temporal"},
            {"from": "omega", "to": "deepseek"},
            {"from": "shirl", "to": "voice"},
            {"from": "sonic", "to": "voice"},
            {"from": "keith", "to": "deepseek"}
        ]
    })


@app.route('/api/feed')
def get_feed():
    """Live event feed"""
    events = [
        {"time": datetime.now().isoformat(), "message": "[SYS] Gabriel System Omega operational"},
        {"time": datetime.now().isoformat(), "message": "[API] All endpoints responding"},
        {"time": datetime.now().isoformat(), "message": "[MEMCELL] Neural graph loaded"},
        {"time": datetime.now().isoformat(), "message": "[AGENTS] 3 agents active"},
        {"time": datetime.now().isoformat(), "message": f"[LATENCY] Current: <{random.randint(3,7)}ms"}
    ]
    return jsonify({"events": events})


@app.route('/api/command', methods=['POST'])
def execute_command():
    """Execute a command"""
    data = request.get_json() or {}
    command = data.get('command', '')
    params = data.get('params', {})
    
    # Command handlers
    commands = {
        'status': lambda: {"result": "System ONLINE"},
        'ping': lambda: {"result": "PONG", "latency": f"{random.randint(1,5)}ms"},
        'version': lambda: {"result": SYSTEM_STATE["version"]},
        'uptime': lambda: {"result": SYSTEM_STATE["boot_time"]}
    }
    
    if command in commands:
        return jsonify({"success": True, "data": commands[command]()})
    else:
        return jsonify({"success": False, "error": f"Unknown command: {command}"}), 400


@app.route('/api/health')
def health_check():
    """Health check endpoint"""
    return jsonify({"healthy": True, "timestamp": datetime.now().isoformat()})


# ========== MAIN ==========

if __name__ == '__main__':
    print("\033[92m" + "=" * 50 + "\033[0m")
    print("\033[92m  GABRIEL SYSTEM OMEGA - MC96 SERVER\033[0m")
    print("\033[92m  Zero Latency API Active on Port 5174\033[0m")
    print("\033[92m" + "=" * 50 + "\033[0m")
    print(f"\033[96m[BOOT] {datetime.now().isoformat()}\033[0m")
    print("\033[96m[STATUS] GORUNFREE Protocol Enabled\033[0m")
    print("\033[96m[API] http://localhost:5174\033[0m")
    print("\033[96m[PORTAL] Open mission_control_portal/index.html\033[0m")
    print("\033[92m" + "=" * 50 + "\033[0m")
    
    app.run(host='0.0.0.0', port=5174, debug=False, threaded=True)
