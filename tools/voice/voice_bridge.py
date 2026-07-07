#!/usr/bin/env python3
"""
GORUNFREE VOICE BRIDGE
iPhone mic → Whisper (local, sovereign) → Claude Code / VS Code

Architecture:
  iPhone (Continuity Mic) → sounddevice capture → Whisper transcribe
  → clipboard paste → VS Code terminal ready for Claude Code

Usage:
  source ~/NOIZYLAB/venv/activate-audio.sh
  python3 ~/NOIZYLAB/tools/voice_bridge.py

  Then speak → your words appear in VS Code chat input automatically.
  Say "GABRIEL" to prepend as Claude Code command.
  Say "DEPLOY" to trigger wrangler deploy.
  Say "STOP" to exit.
"""

import sys
import json
import queue
import threading
import subprocess
import time
import tempfile
import os
from pathlib import Path

# Inject venv
_venv = Path.home() / "NOIZYLAB/venv/audio-stack/lib/python3.11/site-packages"
if _venv.exists() and str(_venv) not in sys.path:
    sys.path.insert(0, str(_venv))

import torch
import whisper
import numpy as np

# ── CONFIG ────────────────────────────────────────────────────────────────────
SAMPLE_RATE   = 16000
CHUNK_SECONDS = 5          # capture in 5s windows
SILENCE_THRESH = 0.01      # RMS threshold — below this = silence
WHISPER_MODEL = "base"     # tiny=fastest, base=good balance, small=best
DEVICE        = "cpu"      # Whisper is more stable on CPU even with MPS available

# ── WAKE WORDS → ACTIONS ──────────────────────────────────────────────────────
COMMANDS = {
    "deploy":     "cd ~/NOIZYLAB && wrangler deploy",
    "status":     "curl -s https://heaven.rsp-5f3.workers.dev/health | python3 -m json.tool",
    "health":     "curl -s https://heaven.rsp-5f3.workers.dev/health | python3 -m json.tool",
    "archivist":  "python3 ~/NOIZYLAB/tools/archivist.py --report",
    "monitor":    "python3 ~/NOIZYLAB/tools/gabriel_monitor.py",
    "boot":       "~/NOIZYLAB/empire-boot.sh",
}

GOLD  = "\033[33m"
GREEN = "\033[92m"
CYAN  = "\033[96m"
RED   = "\033[91m"
RESET = "\033[0m"
BOLD  = "\033[1m"

def paste_to_clipboard(text: str):
    """Put transcription on clipboard — paste into VS Code with Cmd+V."""
    subprocess.run(["pbcopy"], input=text.encode(), check=True)

def type_to_vscode(text: str):
    """Use osascript to type text into frontmost VS Code window."""
    script = f'''
    tell application "System Events"
        tell process "Code"
            set frontmost to true
            keystroke "{text.replace('"', '\\"')}"
        end tell
    end tell
    '''
    subprocess.run(["osascript", "-e", script], capture_output=True)

def notify(title: str, message: str):
    """macOS notification."""
    subprocess.run([
        "osascript", "-e",
        f'display notification "{message}" with title "{title}"'
    ], capture_output=True)

def run_command(cmd: str):
    """Execute a terminal command."""
    print(f"{GOLD}[EXECUTE]{RESET} {cmd}")
    subprocess.Popen(["osascript", "-e", f'''
        tell application "Terminal"
            activate
            do script "{cmd}"
        end tell
    '''])

def find_best_mic(prefer: str = "iPhone") -> int | None:
    """
    Find best mic. Priority:
      1. RSP iPhone Microphone (index 0)
      2. NOIZYIPAD (index 7)
      3. System default
    """
    try:
        import sounddevice as sd
        devices = sd.query_devices()
        priority = ["RSP iPhone Microphone", "NOIZYIPAD", "iPhone"]
        if prefer == "iPad":
            priority = ["NOIZYIPAD", "RSP iPhone Microphone", "iPhone"]
        for name in priority:
            for i, d in enumerate(devices):
                if name.lower() in d["name"].lower() and d["max_input_channels"] > 0:
                    print(f"{GREEN}[MIC]{RESET} Selected: {d['name']} (index {i})")
                    return i
        default = sd.query_devices(kind="input")
        print(f"{GREEN}[MIC]{RESET} Using system default: {default['name']}")
        return None
    except Exception as e:
        print(f"{RED}[MIC]{RESET} sounddevice error: {e}")
        return None

def find_iphone_mic() -> int | None:
    return find_best_mic("iPhone")

def is_silence(audio: np.ndarray) -> bool:
    rms = np.sqrt(np.mean(audio ** 2))
    return rms < SILENCE_THRESH

def main():
    print(f"\n{BOLD}{GOLD}")
    print("  GORUNFREE VOICE BRIDGE")
    print("  iPhone → Whisper → VS Code")
    print(f"{RESET}")

    # Load Whisper
    print(f"[WHISPER] Loading model '{WHISPER_MODEL}'...")
    model = whisper.load_model(WHISPER_MODEL, device=DEVICE)
    print(f"{GREEN}[WHISPER]{RESET} Ready")

    # Check sounddevice
    try:
        import sounddevice as sd
    except ImportError:
        print(f"{RED}[ERROR]{RESET} sounddevice not installed.")
        print("Run: pip install sounddevice")
        sys.exit(1)

    mic_idx = find_iphone_mic()
    print(f"\n{BOLD}LISTENING...{RESET} Speak now. Say STOP to exit.\n")
    notify("GORUNFREE", "Voice bridge active — speak now")

    audio_q = queue.Queue()

    def audio_callback(indata, frames, time_info, status):
        audio_q.put(indata.copy())

    try:
        with sd.InputStream(
            device=mic_idx,
            samplerate=SAMPLE_RATE,
            channels=1,
            dtype="float32",
            blocksize=int(SAMPLE_RATE * CHUNK_SECONDS),
            callback=audio_callback,
        ):
            session_count = 0
            while True:
                try:
                    chunk = audio_q.get(timeout=10)
                    audio_flat = chunk.flatten()

                    if is_silence(audio_flat):
                        print(".", end="", flush=True)
                        continue

                    print(f"\n{CYAN}[HEARD]{RESET} Processing...")

                    # Save to temp WAV and transcribe
                    with tempfile.NamedTemporaryFile(suffix=".wav", delete=False) as f:
                        tmp = f.name

                    import soundfile as sf
                    sf.write(tmp, audio_flat, SAMPLE_RATE)

                    result = model.transcribe(tmp, fp16=False, language="en")
                    text = result["text"].strip()
                    os.unlink(tmp)

                    if not text or len(text) < 2:
                        continue

                    print(f"{GREEN}[TRANSCRIBED]{RESET} \"{text}\"")
                    session_count += 1

                    text_lower = text.lower()

                    # Check stop
                    if "stop" in text_lower and len(text_lower) < 20:
                        print(f"\n{GOLD}[STOP]{RESET} Voice bridge stopped.")
                        notify("GORUNFREE", "Voice bridge stopped")
                        break

                    # Check empire commands
                    command_executed = False
                    for wake_word, cmd in COMMANDS.items():
                        if wake_word in text_lower:
                            run_command(cmd)
                            command_executed = True
                            break

                    if not command_executed:
                        # Paste to clipboard for VS Code
                        paste_to_clipboard(text)
                        print(f"{GOLD}[CLIPBOARD]{RESET} Copied — Cmd+V to paste in VS Code")
                        notify("GORUNFREE", f"Copied: {text[:50]}")

                except queue.Empty:
                    print(f"\n{GOLD}[WAITING]{RESET} No audio detected...")

    except KeyboardInterrupt:
        print(f"\n{GOLD}[STOP]{RESET} Interrupted.")
    except Exception as e:
        print(f"\n{RED}[ERROR]{RESET} {e}")
        raise

if __name__ == "__main__":
    main()
