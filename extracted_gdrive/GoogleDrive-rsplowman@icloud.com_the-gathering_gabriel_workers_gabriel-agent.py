#!/usr/bin/env python3
"""
GABRIEL Agent - Local HTTP server for tunnel commands
Run on GABRIEL (Windows) to receive commands from Cloudflare Worker
"""

from http.server import HTTPServer, BaseHTTPRequestHandler
import json
import subprocess
import socket
import platform
import psutil

PORT = 8080
ALLOWED_COMMANDS = ['systeminfo', 'dir', 'hostname', 'ipconfig', 'whoami', 'date', 'time', 'tasklist', 'wmic', 'netstat']

class GabrielHandler(BaseHTTPRequestHandler):
    def _cors(self):
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
    
    def _json(self, data, status=200):
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self._cors()
        self.end_headers()
        self.wfile.write(json.dumps(data).encode())
    
    def do_OPTIONS(self):
        self.send_response(204)
        self._cors()
        self.end_headers()
    
    def do_GET(self):
        if self.path == '/health':
            self._json({
                'status': 'online',
                'hostname': socket.gethostname(),
                'platform': platform.system(),
                'version': platform.version(),
                'cpu_percent': psutil.cpu_percent(),
                'memory_percent': psutil.virtual_memory().percent,
                'uptime': int(psutil.boot_time())
            })
        else:
            self._json({'error': 'Not found'}, 404)
    
    def do_POST(self):
        if self.path == '/exec':
            length = int(self.headers.get('Content-Length', 0))
            body = json.loads(self.rfile.read(length)) if length else {}
            
            cmd = body.get('cmd', '')
            timeout = min(body.get('timeout', 30), 60)  # Max 60s
            
            # Security: Only allow safe commands
            cmd_base = cmd.split()[0].lower() if cmd else ''
            if cmd_base not in ALLOWED_COMMANDS:
                self._json({'error': f'Command not allowed: {cmd_base}'}, 403)
                return
            
            try:
                result = subprocess.run(
                    cmd,
                    shell=True,
                    capture_output=True,
                    text=True,
                    timeout=timeout
                )
                self._json({
                    'output': result.stdout,
                    'error': result.stderr,
                    'code': result.returncode
                })
            except subprocess.TimeoutExpired:
                self._json({'error': 'Command timed out'}, 408)
            except Exception as e:
                self._json({'error': str(e)}, 500)
        else:
            self._json({'error': 'Not found'}, 404)
    
    def log_message(self, format, *args):
        print(f"[GABRIEL] {args[0]}")

if __name__ == '__main__':
    print(f"GABRIEL Agent starting on port {PORT}...")
    print(f"Hostname: {socket.gethostname()}")
    print(f"Allowed commands: {ALLOWED_COMMANDS}")
    print("")
    
    server = HTTPServer(('127.0.0.1', PORT), GabrielHandler)
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down...")
        server.shutdown()
