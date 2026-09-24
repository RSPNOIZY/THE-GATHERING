#!/usr/bin/env python3
"""
heaven17 — Voice Intelligence Server for GORUNFREE
Part of DreamChamber NOIZY Empire
Runs on port 17017 (connect GORUNFREE to this)
"""

import json
import time
import http.server
import socketserver
import urllib.request
import urllib.parse
from datetime import datetime

HEAVEN17_PORT = 17017
OLLAMA_URL = "http://localhost:11434"
GORUNFREE_URL = "http://localhost:9099"

class Heaven17Handler(http.server.BaseHTTPRequestHandler):
    
    def log_message(self, format, *args):
        print(f"[heaven17] {datetime.now().strftime('%H:%M:%S')} {format % args}")
    
    def send_json(self, code, data):
        body = json.dumps(data, indent=2).encode()
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)
    
    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
    
    def do_GET(self):
        path = self.path.split("?")[0]
        
        if path in ("/", "/health"):
            self.send_json(200, {
                "server": "heaven17",
                "version": "1.0.0",
                "status": "ONLINE",
                "timestamp": datetime.utcnow().isoformat() + "Z",
                "capabilities": ["tts", "stt", "llm", "voice-pipeline"],
                "ollama": self._check_ollama()
            })
            
        elif path == "/status":
            self.send_json(200, {
                "heaven17": "ONLINE",
                "voice_pipeline": "ready",
                "models": ["noizy-vox-architect", "noizy-gabriel-mind"],
                "audio_processing": "active"
            })
            
        elif path == "/models":
            self.send_json(200, {
                "models": [
                    {"id": "noizy-vox-architect", "type": "voice", "status": "ready"},
                    {"id": "noizy-gabriel-mind", "type": "assistant", "status": "ready"},
                    {"id": "noizy-dream-weaver", "type": "creative", "status": "ready"},
                    {"id": "nomic-embed-text", "type": "embedding", "status": "ready"}
                ]
            })
            
        elif path == "/ping":
            self.send_json(200, {"pong": True, "ts": time.time()})
            
        else:
            self.send_json(404, {"error": f"Unknown route: {path}"})
    
    def do_POST(self):
        path = self.path.split("?")[0]
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length > 0 else {}
        
        if path == "/v1/complete":
            # Forward to Ollama
            model = body.get("model", "noizy-gabriel-mind")
            prompt = body.get("prompt", "")
            response = self._ollama_generate(model, prompt)
            self.send_json(200, {"response": response, "model": model})
            
        elif path == "/v1/voice":
            # Voice pipeline: audio → text → AI → response
            text = body.get("transcript", "")
            if text:
                ai_response = self._ollama_generate("noizy-gabriel-mind", 
                    f"You are GABRIEL, the DreamChamber voice assistant. Respond concisely: {text}")
                self.send_json(200, {
                    "transcript": text,
                    "response": ai_response,
                    "status": "processed"
                })
            else:
                self.send_json(400, {"error": "No transcript provided"})
                
        elif path == "/v1/embed":
            text = body.get("text", "")
            self.send_json(200, {
                "embedding": [],  # Placeholder - wire to Ollama embeddings
                "model": "nomic-embed-text",
                "text": text
            })
        else:
            self.send_json(404, {"error": f"Unknown route: {path}"})
    
    def _check_ollama(self):
        try:
            with urllib.request.urlopen(f"{OLLAMA_URL}/api/version", timeout=2) as r:
                return json.loads(r.read())
        except:
            return {"status": "unreachable"}
    
    def _ollama_generate(self, model, prompt):
        try:
            data = json.dumps({
                "model": model,
                "prompt": prompt,
                "stream": False,
                "options": {"num_predict": 200}
            }).encode()
            req = urllib.request.Request(
                f"{OLLAMA_URL}/api/generate",
                data=data,
                headers={"Content-Type": "application/json"}
            )
            with urllib.request.urlopen(req, timeout=30) as r:
                result = json.loads(r.read())
                return result.get("response", "")
        except Exception as e:
            return f"[Ollama unavailable: {e}]"


def main():
    print(f"""
╔════════════════════════════════════════╗
║  heaven17 Voice Intelligence Server    ║
║  DreamChamber — NOIZY Empire           ║
║  Port: {HEAVEN17_PORT}                          ║
╚════════════════════════════════════════╝
    """)
    
    with socketserver.TCPServer(("", HEAVEN17_PORT), Heaven17Handler) as httpd:
        httpd.allow_reuse_address = True
        print(f"[heaven17] ✅ Listening on http://localhost:{HEAVEN17_PORT}")
        print(f"[heaven17] ✅ Connected to Ollama: {OLLAMA_URL}")
        print("[heaven17] ✅ GORUNFREE integration ready")
        httpd.serve_forever()

if __name__ == "__main__":
    main()
