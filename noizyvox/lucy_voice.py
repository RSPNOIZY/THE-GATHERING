#!/usr/bin/env python3
"""
LUCY VOICE MODULE
=================
Interim TTS voice for LUCY using macOS Siri "Kate" (en-GB Premium).
Placeholder until NOIZYVOX FEMALE is selected, recorded, and trained.

Voice Chain:
  text → kate_speak() → say -v Kate -r 185 → macOS audio output
                     ↓
              (future) → NOIZYVOX FEMALE neural TTS model

Usage:
  from lucy_voice import lucy_say, lucy_announce, set_lucy_voice

  lucy_say("File analysis complete. 847 items catalogued.")
  lucy_announce("GABRIEL, the inbox has new instructions.")

Voice Registry (NOIZYVOX FEMALE candidates — not yet selected):
  - Kate     : en-GB, Siri Premium  ← CURRENT INTERIM
  - Serena   : en-GB, Siri Premium  (candidate)
  - Ava      : en-US, Siri Premium  (candidate)
  - Samantha : en-US, Siri Premium  (candidate)

Author: RSP_001 / NOIZY Empire / GOD.local
"""

import subprocess
import threading
import queue
import os
import time
from pathlib import Path

# ─────────────────────────────────────────────────────────────────
# VOICE CONFIG
# ─────────────────────────────────────────────────────────────────

LUCY_VOICE_CONFIG = {
    "name":          "Kate",          # macOS Siri Premium en-GB
    "rate":          185,             # WPM — natural, calm, precise
    "volume":        0.9,             # 0.0–1.0
    "codec":         "aiff",          # macOS say output format
    "description":   "Siri Premium 'Kate' — British English, interim LUCY voice",
    "interim":       True,
    "target_voice":  "NOIZYVOX FEMALE (unselected — pending recording session)",
    "status":        "ACTIVE_INTERIM",
}

# ─────────────────────────────────────────────────────────────────
# ASYNC VOICE QUEUE (non-blocking — LUCY never waits for herself)
# ─────────────────────────────────────────────────────────────────

_voice_queue: queue.Queue = queue.Queue()
_voice_thread = None
_speaking = False


def _voice_worker():
    """Background thread — processes TTS queue sequentially."""
    global _speaking
    while True:
        try:
            text, priority = _voice_queue.get(timeout=1.0)
            _speaking = True
            _speak_sync(text)
            _speaking = False
            _voice_queue.task_done()
        except queue.Empty:
            continue
        except Exception as e:
            print(f"[LUCY VOICE ERROR] {e}")
            _speaking = False


def _start_voice_thread():
    global _voice_thread
    if _voice_thread is None or not _voice_thread.is_alive():
        _voice_thread = threading.Thread(target=_voice_worker, daemon=True)
        _voice_thread.start()


def _speak_sync(text: str):
    """Blocking call to macOS say with Kate voice."""
    voice = LUCY_VOICE_CONFIG["name"]
    rate  = LUCY_VOICE_CONFIG["rate"]
    vol   = int(LUCY_VOICE_CONFIG["volume"] * 100)

    cmd = ["say", "-v", voice, "-r", str(rate), text]
    try:
        subprocess.run(cmd, check=True, timeout=60)
    except subprocess.CalledProcessError as e:
        # Kate not downloaded — fallback to Samantha then system default
        print(f"[LUCY VOICE] Kate unavailable, trying Samantha: {e}")
        try:
            subprocess.run(["say", "-v", "Samantha", "-r", str(rate), text],
                           check=True, timeout=60)
        except Exception:
            subprocess.run(["say", text], timeout=60)
    except Exception as e:
        print(f"[LUCY VOICE] TTS failed: {e}")


# ─────────────────────────────────────────────────────────────────
# PUBLIC API
# ─────────────────────────────────────────────────────────────────

def lucy_say(text: str, priority: int = 5, blocking: bool = False):
    """
    Queue text for LUCY to speak with Kate's voice.

    Args:
        text:     What LUCY says
        priority: 1 (urgent) – 10 (low). Currently informational only.
        blocking: If True, wait for speech to complete before returning.
    """
    _start_voice_thread()

    if blocking:
        _speak_sync(text)
    else:
        _voice_queue.put((text, priority))


def lucy_announce(text: str):
    """High-priority LUCY announcement — interrupts queue."""
    _start_voice_thread()
    # Clear low-priority items, add announcement at front
    while not _voice_queue.empty():
        try:
            _voice_queue.get_nowait()
            _voice_queue.task_done()
        except queue.Empty:
            break
    _voice_queue.put((text, 1))


def lucy_silent() -> bool:
    """Returns True if LUCY is not currently speaking."""
    return not _speaking and _voice_queue.empty()


def get_voice_status() -> dict:
    """Return current voice config + status for GABRIEL health check."""
    return {
        **LUCY_VOICE_CONFIG,
        "queue_depth":   _voice_queue.qsize(),
        "is_speaking":   _speaking,
        "thread_alive":  _voice_thread.is_alive() if _voice_thread else False,
    }


def set_lucy_voice(voice_name: str, rate: int = 185):
    """
    Hot-swap LUCY's voice. Called when NOIZYVOX FEMALE is ready.

    Example:
        set_lucy_voice("NOIZYVOX_FEMALE_V1", rate=175)
        lucy_say("Voice DNA locked. I am now LUCY.")
    """
    LUCY_VOICE_CONFIG["name"]     = voice_name
    LUCY_VOICE_CONFIG["rate"]     = rate
    LUCY_VOICE_CONFIG["interim"]  = False
    LUCY_VOICE_CONFIG["status"]   = "NOIZYVOX_ACTIVE"
    print(f"[LUCY VOICE] Voice set to: {voice_name} @ {rate} WPM")


# ─────────────────────────────────────────────────────────────────
# SAVE VOICE TO FILE (for playback / logging)
# ─────────────────────────────────────────────────────────────────

def lucy_save(text: str, output_path: str) -> str:
    """
    Render LUCY's voice to an AIFF file (for archive or broadcast).
    Used by NOIZYVOX pipeline to capture Kate reference recordings.
    """
    voice = LUCY_VOICE_CONFIG["name"]
    rate  = LUCY_VOICE_CONFIG["rate"]
    out   = Path(output_path)
    out.parent.mkdir(parents=True, exist_ok=True)

    subprocess.run(
        ["say", "-v", voice, "-r", str(rate), "-o", str(out), text],
        check=True
    )
    size = out.stat().st_size
    print(f"[LUCY VOICE] Saved {size:,} bytes → {out}")
    return str(out)


# ─────────────────────────────────────────────────────────────────
# SELF-TEST
# ─────────────────────────────────────────────────────────────────

if __name__ == "__main__":
    print("[LUCY VOICE] Testing Kate voice — interim NOIZYVOX FEMALE")
    print(f"[LUCY VOICE] Config: {LUCY_VOICE_CONFIG}")
    lucy_say(
        "Hello. I am LUCY. My current voice is Kate, Siri Premium, British English. "
        "This is a placeholder until the NOIZYVOX FEMALE voice is selected and recorded. "
        "Catalogue ready. GABRIEL, I am listening.",
        blocking=True
    )
    print("[LUCY VOICE] Test complete ✓")
