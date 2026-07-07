#!/usr/bin/env python3
"""
GORUNFREE VOICE HTTP SERVER
Exposes local HTTP endpoints for Siri Shortcuts + iPhone/iPad triggers.
Runs on M2 Ultra. Bridges mobile → Claude Code / VS Code.

Endpoints:
  POST /voice      — receive transcribed text, paste to VS Code clipboard
  POST /command    — execute empire wake-word command
  GET  /status     — HEAVEN17 health + audio devices
  GET  /devices    — list available audio input devices

Start:
  source ~/NOIZYLAB/venv/activate-audio.sh
  python3 ~/NOIZYLAB/tools/voice_server.py

Then from iPhone Siri Shortcut:
  POST http://[GOD_IP]:9099/voice  {"text":"deploy heaven","actor":"RSP_001"}
"""

import sys
import json
import subprocess
import urllib.request
from http.server import HTTPServer, BaseHTTPRequestHandler
from pathlib import Path
from datetime import datetime
from difflib import get_close_matches
import time

_venv = Path.home() / "NOIZYLAB/venv/audio-stack/lib/python3.11/site-packages"
if _venv.exists() and str(_venv) not in sys.path:
    sys.path.insert(0, str(_venv))

PORT = 9099
HEAVEN17 = "https://heaven.rsp-5f3.workers.dev"

EMPIRE_COMMANDS = {
    "deploy":     "cd ~/NOIZYLAB && wrangler deploy",
    "status":     f"curl -s {HEAVEN17}/health",
    "health":     f"curl -s {HEAVEN17}/health",
    "archivist":  "python3 ~/NOIZYLAB/tools/archivist.py --report",
    "monitor":    "source ~/NOIZYLAB/venv/activate-audio.sh && python3 ~/NOIZYLAB/tools/gabriel_monitor.py",
    "boot":       "~/NOIZYLAB/empire-boot.sh",
}

def paste_to_clipboard(text: str):
    subprocess.run(["pbcopy"], input=text.encode(), check=True)

def heaven_health() -> dict:
    try:
        req = urllib.request.Request(
            f"{HEAVEN17}/health",
            headers={"User-Agent": "GORUNFREE/1.0"}
        )
        with urllib.request.urlopen(req, timeout=5) as r:
            return json.loads(r.read())
    except Exception as e:
        return {"status": "OFFLINE", "error": str(e)}

def log_to_heaven(event: dict):
    """Log voice command to HEAVEN17 D1 ledger."""
    try:
        payload = {
            "event_type": "voice_command",
            "actor_id": "RSP_001",
            "payload": event,
            "source_system": "GORUNFREE"
        }
        req = urllib.request.Request(
            f"{HEAVEN17}/api/v1/ledger/append",
            data=json.dumps(payload).encode(),
            headers={
                "Content-Type": "application/json",
                "User-Agent": "GORUNFREE/1.0"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=3) as r:
            return json.loads(r.read())
    except Exception as e:
        # Don't block execution on logging failure
        print(f"  [LOG ERROR] {str(e)}")
        return None

def match_command(text: str, threshold=0.6) -> tuple[str | None, float]:
    """Fuzzy match text to command. Returns (command, confidence)."""
    text_lower = text.lower().strip()

    # Exact substring match first (highest priority)
    for cmd in EMPIRE_COMMANDS.keys():
        if cmd in text_lower:
            return (cmd, 1.0)

    # Fuzzy match on remaining text
    matches = get_close_matches(text_lower, EMPIRE_COMMANDS.keys(), n=1, cutoff=threshold)
    if matches:
        return (matches[0], 0.8)

    return (None, 0.0)

def list_audio_devices() -> list:
    try:
        import sounddevice as sd
        return [
            {"index": i, "name": d["name"],
             "inputs": d["max_input_channels"],
             "outputs": d["max_output_channels"]}
            for i, d in enumerate(sd.query_devices())
        ]
    except Exception as e:
        return [{"error": str(e)}]

def run_in_terminal(cmd: str):
    subprocess.Popen(["osascript", "-e", f'''
        tell application "Terminal"
            activate
            do script "{cmd}"
        end tell
    '''])

class GoRunFreeHandler(BaseHTTPRequestHandler):
    def log_message(self, format, *args):
        ts = datetime.now().strftime("%H:%M:%S")
        print(f"  [{ts}] {self.address_string()} {format % args}")

    def send_json(self, data: dict, status: int = 200):
        body = json.dumps(data, indent=2).encode()
        self.send_response(status)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", len(body))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path == "/status":
            health = heaven_health()
            self.send_json({
                "server": "GORUNFREE Voice Server",
                "version": "1.0.0",
                "heaven": health,
                "audio_devices": len(list_audio_devices()),
                "timestamp": datetime.now().isoformat(),
            })

        elif self.path == "/devices":
            self.send_json({"devices": list_audio_devices()})

        elif self.path == "/health":
            self.send_json({"status": "ok", "server": "GORUNFREE"})

        else:
            self.send_json({"error": f"Unknown route: {self.path}"}, 404)

    def do_POST(self):
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length)) if length else {}
        start_time = time.time()

        if self.path == "/voice":
            text = body.get("text", "").strip()
            actor = body.get("actor", "unknown")

            if not text:
                self.send_json({"error": "text required"}, 400)
                return

            print(f"\n  [VOICE] {actor}: \"{text}\"")

            # Try fuzzy command matching
            matched_cmd, confidence = match_command(text)

            if matched_cmd and confidence > 0.6:
                cmd = EMPIRE_COMMANDS[matched_cmd]
                elapsed = time.time() - start_time

                run_in_terminal(cmd)

                result = {
                    "action": "command_executed",
                    "wake_word": matched_cmd,
                    "confidence": confidence,
                    "command": cmd,
                    "text": text,
                    "actor": actor,
                    "elapsed_ms": round(elapsed * 1000),
                }

                # Log to D1 (async, non-blocking)
                log_to_heaven({
                    "action": "command",
                    "wake_word": matched_cmd,
                    "confidence": confidence,
                    "text": text,
                })

                self.send_json(result)
                return

            # Otherwise paste to clipboard
            elapsed = time.time() - start_time
            paste_to_clipboard(text)

            result = {
                "action": "clipboard",
                "text": text,
                "actor": actor,
                "message": "Copied to clipboard — Cmd+V to paste in VS Code",
                "elapsed_ms": round(elapsed * 1000),
            }

            # Log to D1
            log_to_heaven({
                "action": "paste",
                "text": text,
                "length": len(text),
            })

            self.send_json(result)

        elif self.path == "/command":
            action = body.get("action", "").lower()
            actor = body.get("actor", "unknown")

            # Try fuzzy match on action too
            matched_action = action
            if action not in EMPIRE_COMMANDS:
                close_matches = get_close_matches(action, EMPIRE_COMMANDS.keys(), n=1, cutoff=0.7)
                if close_matches:
                    matched_action = close_matches[0]
                    print(f"  [CMD] Fuzzy matched '{action}' → '{matched_action}'")
                else:
                    self.send_json({
                        "error": f"Unknown command: {action}",
                        "available": list(EMPIRE_COMMANDS.keys()),
                        "did_you_mean": get_close_matches(action, EMPIRE_COMMANDS.keys(), n=3, cutoff=0.6)
                    }, 400)
                    return

            cmd = EMPIRE_COMMANDS[matched_action]
            elapsed = time.time() - start_time
            run_in_terminal(cmd)
            print(f"\n  [CMD] {actor} → {matched_action}: {cmd}")

            result = {
                "action": matched_action,
                "command": cmd,
                "actor": actor,
                "executed_at": datetime.now().isoformat(),
                "elapsed_ms": round(elapsed * 1000),
            }

            # Log to D1
            log_to_heaven({
                "action": "command",
                "wake_word": matched_action,
                "actor": actor,
            })

            self.send_json(result)

        else:
            self.send_json({"error": f"Unknown route: {self.path}"}, 404)


def main():
    # Get local IP
    try:
        import socket
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        local_ip = s.getsockname()[0]
        s.close()
    except Exception:
        local_ip = "127.0.0.1"

    server = HTTPServer(("0.0.0.0", PORT), GoRunFreeHandler)

    print(f"\n  GORUNFREE VOICE SERVER")
    print(f"  ══════════════════════════════════════")
    print(f"  Local:   http://localhost:{PORT}")
    print(f"  Network: http://{local_ip}:{PORT}")
    print(f"  ──────────────────────────────────────")
    print(f"  Endpoints:")
    print(f"    POST /voice      → text to clipboard/command")
    print(f"    POST /command    → execute empire action")
    print(f"    GET  /status     → empire health")
    print(f"    GET  /devices    → audio device list")
    print(f"  ──────────────────────────────────────")
    print(f"  iPhone Shortcut URL: http://{local_ip}:{PORT}/voice")
    print(f"  iPad Shortcut URL:   http://{local_ip}:{PORT}/command")
    print(f"  ══════════════════════════════════════")
    print(f"  Waiting for connections...\n")

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n  [STOP] Voice server stopped.")


if __name__ == "__main__":
    main()
