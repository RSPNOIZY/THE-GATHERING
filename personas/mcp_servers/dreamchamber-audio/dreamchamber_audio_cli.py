#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
DREAMCHAMBER AUDIO MCP
═══════════════════════════════════════════════════════════════
Controls Rogue Amoeba's Loopback + Audio Hijack + SoundSource
to orchestrate multi-AI voice collaboration sessions.
Architecture:
  LOOPBACK    → Creates virtual audio devices (the pipes)
  AUDIO HIJACK → Controls sessions programmatically (the valves)
  SOUNDSOURCE  → Per-app volume/mute control (the faders)
  THIS MCP     → Orchestrates all three via voice commands
How it works:
  1. Loopback creates virtual devices for each AI participant
     (configured once in Loopback GUI, persists forever)
  2. Audio Hijack sessions capture/route each AI's audio
     (controlled via JavaScript API + .ahcommand files)
  3. SoundSource handles per-app mute/unmute
     (controlled via AppleScript/shell commands)
  4. You speak: "Gabriel, mute Gemini, bring in Claude"
     → MCP translates to Audio Hijack commands
     → Audio routes change in real-time
Participants:
  - RSP_001 (Rob) — Apollo mic input
  - Claude — Anthropic API TTS output
  - Gabriel — Local agent on GOD
  - Gemini — Google API TTS output
  - GPT — OpenAI API TTS output
  - Perplexity — Perplexity API output
  - (up to 8 total AI participants)
Robert Stephen Plowman × Claude (Co-Architect)
March 23, 2026
═══════════════════════════════════════════════════════════════
"""
import subprocess
import json
import os
import tempfile
from pathlib import Path
from datetime import datetime
from typing import Optional

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

DREAMCHAMBER_CONFIG = {
    "max_participants": 8,
    "sample_rate": 48000,
    "bit_depth": 32,
    "monitor_device": "Built-in Output",  # What Rob hears through

    # Loopback virtual device names (create these in Loopback GUI)
    "loopback_devices": {
        "master": "DreamChamber Master",
        "rsp_001": "DreamChamber RSP_001",
        "claude": "DreamChamber Claude",
        "gabriel": "DreamChamber Gabriel",
        "gemini": "DreamChamber Gemini",
        "gpt": "DreamChamber GPT",
        "perplexity": "DreamChamber Perplexity",
        "slot_7": "DreamChamber Slot 7",
        "slot_8": "DreamChamber Slot 8",
    },

    # Audio Hijack session names (create these in Audio Hijack)
    "audio_hijack_sessions": {
        "master": "DreamChamber Master Session",
        "claude": "DreamChamber Claude Capture",
        "gabriel": "DreamChamber Gabriel Capture",
        "gemini": "DreamChamber Gemini Capture",
        "gpt": "DreamChamber GPT Capture",
        "perplexity": "DreamChamber Perplexity Capture",
    },

    # Log directory
    "log_dir": os.path.expanduser("~/Claude/dreamchamber_logs"),
    "ahcommand_dir": os.path.expanduser("~/Claude/dreamchamber_commands"),
}


# ═══════════════════════════════════════════════════════════════
# PARTICIPANT REGISTRY
# ═══════════════════════════════════════════════════════════════

class Participant:
    """Represents an AI participant in the DreamChamber session."""

    def __init__(self, name, slot, loopback_device, ah_session=None,
                 is_human=False, is_active=True, volume=100):
        self.name = name
        self.slot = slot
        self.loopback_device = loopback_device
        self.ah_session = ah_session
        self.is_human = is_human
        self.is_active = is_active
        self.is_muted = False
        self.volume = volume
        self.joined_at = datetime.now().isoformat()

    def to_dict(self):
        return {
            "name": self.name,
            "slot": self.slot,
            "loopback_device": self.loopback_device,
            "is_human": self.is_human,
            "is_active": self.is_active,
            "is_muted": self.is_muted,
            "volume": self.volume,
            "joined_at": self.joined_at,
        }


# ═══════════════════════════════════════════════════════════════
# AUDIO HIJACK CONTROLLER
# ═══════════════════════════════════════════════════════════════

class AudioHijackController:
    """
    Controls Audio Hijack via its JavaScript scripting API.
    Uses .ahcommand files for execution.
    """

    def __init__(self, command_dir):
        self.command_dir = Path(command_dir)
        self.command_dir.mkdir(parents=True, exist_ok=True)

    def execute(self, javascript_code, command_name="dreamchamber_cmd"):
        cmd_file = self.command_dir / f"{command_name}.ahcommand"
        cmd_file.write_text(javascript_code, encoding="utf-8")
        result = subprocess.run(
            ["open", str(cmd_file)],
            capture_output=True, text=True
        )
        return result.returncode == 0

    def start_session(self, session_name):
        js = f'''
let session = app.sessionWithName("{session_name}");
if (session && !session.running) {{
    session.start();
}}
'''
        return self.execute(js, f"start_{session_name.replace(' ', '_')}")

    def stop_session(self, session_name):
        js = f'''
let session = app.sessionWithName("{session_name}");
if (session && session.running) {{
    session.stop();
}}
'''
        return self.execute(js, f"stop_{session_name.replace(' ', '_')}")

    def toggle_session(self, session_name):
        js = f'''
let session = app.sessionWithName("{session_name}");
if (session) {{
    if (session.running) session.stop();
    else session.start();
}}
'''
        return self.execute(js, f"toggle_{session_name.replace(' ', '_')}")

    def start_all_sessions(self, session_names):
        lines = []
        for name in session_names:
            safe = name.replace(' ', '_')
            lines.append(f'''
let s_{safe} = app.sessionWithName("{name}");
if (s_{safe} && !s_{safe}.running) {{ s_{safe}.start(); }}''')
        return self.execute("\n".join(lines), "start_all")

    def stop_all_sessions(self, session_names):
        lines = []
        for name in session_names:
            safe = name.replace(' ', '_')
            lines.append(f'''
let s_{safe} = app.sessionWithName("{name}");
if (s_{safe} && s_{safe}.running) {{ s_{safe}.stop(); }}''')
        return self.execute("\n".join(lines), "stop_all")


# ═══════════════════════════════════════════════════════════════
# SOUNDSOURCE CONTROLLER
# ═══════════════════════════════════════════════════════════════

class SoundSourceController:
    """Controls SoundSource via AppleScript."""

    @staticmethod
    def set_app_volume(app_name, volume_percent):
        volume_float = volume_percent / 100.0
        script = f'set volume output volume {volume_percent}'
        subprocess.run(["osascript", "-e", script], capture_output=True)

    @staticmethod
    def mute_app(app_name):
        subprocess.run([
            "osascript", "-e",
            f'tell application "SoundSource" to set muted of first audio source whose name is "{app_name}" to true'
        ], capture_output=True, text=True)

    @staticmethod
    def unmute_app(app_name):
        subprocess.run([
            "osascript", "-e",
            f'tell application "SoundSource" to set muted of first audio source whose name is "{app_name}" to false'
        ], capture_output=True, text=True)

    @staticmethod
    def set_system_volume(volume_percent):
        subprocess.run([
            "osascript", "-e",
            f"set volume output volume {volume_percent}"
        ], capture_output=True)


# ═══════════════════════════════════════════════════════════════
# LOOPBACK SETUP GUIDE
# ═══════════════════════════════════════════════════════════════

class LoopbackSetup:
    @staticmethod
    def generate_setup_guide():
        devices = DREAMCHAMBER_CONFIG["loopback_devices"]
        guide = """
═══════════════════════════════════════════════════════════════
DREAMCHAMBER — ONE-TIME LOOPBACK SETUP GUIDE
═══════════════════════════════════════════════════════════════
Open Loopback on your M2 Ultra. Create these virtual devices:
"""
        for key, name in devices.items():
            if key == "master":
                guide += f"\nDEVICE: {name}\n  Type: Master mix bus\n  Sources: All other DreamChamber devices\n  Output Channels: 2 (stereo)\n  Monitor: {DREAMCHAMBER_CONFIG['monitor_device']}\n"
            elif key == "rsp_001":
                guide += f"\nDEVICE: {name}\n  Type: Your microphone input\n  Sources: Apollo interface (your mic)\n  Output Channels: 2 (stereo)\n"
            else:
                guide += f"\nDEVICE: {name}\n  Type: AI participant channel\n  Sources: Pass-Thru\n  Output Channels: 2 (stereo)\n"
        return guide


# ═══════════════════════════════════════════════════════════════
# DREAMCHAMBER SESSION MANAGER
# ═══════════════════════════════════════════════════════════════

class DreamChamberSession:
    def __init__(self):
        self.config = DREAMCHAMBER_CONFIG
        self.participants = {}
        self.is_active = False
        self.is_recording = False
        self.session_id = None
        self.session_start = None
        self.ah = AudioHijackController(self.config["ahcommand_dir"])
        self.ss = SoundSourceController()
        Path(self.config["log_dir"]).mkdir(parents=True, exist_ok=True)
        Path(self.config["ahcommand_dir"]).mkdir(parents=True, exist_ok=True)

    def start_session(self):
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_start = datetime.now()
        self.is_active = True
        self.participants["rsp_001"] = Participant(
            name="RSP_001 (Robert Stephen Plowman)",
            slot=1,
            loopback_device=self.config["loopback_devices"]["rsp_001"],
            is_human=True, is_active=True
        )
        master_session = self.config["audio_hijack_sessions"].get("master")
        if master_session:
            self.ah.start_session(master_session)
        self._log("SESSION_START", f"DreamChamber opened. Session: {self.session_id}")
        return {
            "status": "open", "session_id": self.session_id,
            "message": "DreamChamber is open. RSP_001 is in the room.",
            "participants": ["RSP_001"], "available_slots": list(range(2, 9))
        }

    def end_session(self):
        if not self.is_active:
            return {"status": "error", "message": "DreamChamber is not open."}
        if self.is_recording:
            self.stop_recording()
        all_sessions = list(self.config["audio_hijack_sessions"].values())
        self.ah.stop_all_sessions(all_sessions)
        duration = (datetime.now() - self.session_start).total_seconds()
        self._log("SESSION_END", f"Duration: {duration:.0f}s")
        self.is_active = False
        self.participants = {}
        return {"status": "closed", "session_id": self.session_id, "duration_seconds": round(duration)}

    def add_participant(self, name):
        if not self.is_active:
            return {"status": "error", "message": "DreamChamber is not open."}
        name_lower = name.lower().replace(" ", "_")
        if name_lower in self.participants:
            return {"status": "already_in", "message": f"{name} is already in the room."}
        if len(self.participants) >= self.config["max_participants"]:
            return {"status": "full", "message": "DreamChamber is full (8 max)."}
        loopback_device = self.config["loopback_devices"].get(name_lower)
        ah_session = self.config["audio_hijack_sessions"].get(name_lower)
        used_slots = {p.slot for p in self.participants.values()}
        next_slot = next(s for s in range(1, 9) if s not in used_slots)
        if not loopback_device:
            loopback_device = self.config["loopback_devices"].get(f"slot_{next_slot}", f"DreamChamber Slot {next_slot}")
        participant = Participant(name=name, slot=next_slot, loopback_device=loopback_device, ah_session=ah_session, is_active=True)
        self.participants[name_lower] = participant
        if ah_session:
            self.ah.start_session(ah_session)
        self._log("PARTICIPANT_JOIN", f"{name} joined slot {next_slot}")
        return {"status": "joined", "participant": name, "slot": next_slot, "loopback_device": loopback_device}

    def remove_participant(self, name):
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        participant = self.participants[name_lower]
        if participant.ah_session:
            self.ah.stop_session(participant.ah_session)
        del self.participants[name_lower]
        self._log("PARTICIPANT_LEAVE", f"{name} left")
        return {"status": "removed", "participant": name}

    def mute(self, name):
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        self.participants[name_lower].is_muted = True
        self.ss.mute_app(name)
        self._log("MUTE", f"{name} muted")
        return {"status": "muted", "participant": name}

    def unmute(self, name):
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        self.participants[name_lower].is_muted = False
        self.ss.unmute_app(name)
        self._log("UNMUTE", f"{name} unmuted")
        return {"status": "unmuted", "participant": name}

    def solo(self, name):
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        muted = []
        for key, p in self.participants.items():
            if key != name_lower and key != "rsp_001":
                p.is_muted = True
                self.ss.mute_app(p.name)
                muted.append(p.name)
        self.participants[name_lower].is_muted = False
        self.ss.unmute_app(name)
        self._log("SOLO", f"{name} soloed")
        return {"status": "soloed", "participant": name, "muted": muted}

    def unmute_all(self):
        for key, p in self.participants.items():
            p.is_muted = False
            self.ss.unmute_app(p.name)
        self._log("UNMUTE_ALL", "All unmuted")
        return {"status": "all_unmuted", "participants": [p.name for p in self.participants.values()]}

    def set_volume(self, name, volume_percent):
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        volume = max(0, min(100, volume_percent))
        self.participants[name_lower].volume = volume
        self.ss.set_app_volume(name, volume)
        self._log("VOLUME", f"{name} → {volume}%")
        return {"status": "volume_set", "participant": name, "volume": volume}

    def start_recording(self):
        if self.is_recording:
            return {"status": "already_recording"}
        self.is_recording = True
        self._log("RECORDING_START", "Recording started")
        return {"status": "recording"}

    def stop_recording(self):
        if not self.is_recording:
            return {"status": "not_recording"}
        self.is_recording = False
        self._log("RECORDING_STOP", "Recording stopped")
        return {"status": "stopped"}

    def list_participants(self):
        if not self.is_active:
            return {"status": "closed", "message": "DreamChamber is not open."}
        roster = []
        for key, p in self.participants.items():
            roster.append(p.to_dict())
        return {
            "status": "active", "session_id": self.session_id,
            "participant_count": len(self.participants),
            "is_recording": self.is_recording, "roster": roster
        }

    def _log(self, event_type, message):
        log_file = Path(self.config["log_dir"]) / f"session_{self.session_id}.log"
        timestamp = datetime.now().isoformat()
        with open(log_file, "a") as f:
            f.write(f"[{timestamp}] [{event_type}] {message}\n")
        print(f"DreamChamber | {event_type}: {message}")


# ═══════════════════════════════════════════════════════════════
# CLI COMMAND PARSER
# ═══════════════════════════════════════════════════════════════

class DreamChamberCLI:
    def __init__(self):
        self.session = DreamChamberSession()

    def execute(self, command: str) -> dict:
        cmd = command.lower().strip()
        if any(p in cmd for p in ["open the dreamchamber", "open dreamchamber", "start session"]):
            return self.session.start_session()
        if any(p in cmd for p in ["close the dreamchamber", "close dreamchamber", "end session"]):
            return self.session.end_session()
        if cmd.startswith("bring in ") or cmd.startswith("add "):
            name = cmd.replace("bring in ", "").replace("add ", "").strip()
            return self.session.add_participant(name)
        if cmd.startswith("remove ") or cmd.startswith("kick "):
            name = cmd.replace("remove ", "").replace("kick ", "").strip()
            return self.session.remove_participant(name)
        if cmd.startswith("mute "):
            return self.session.mute(cmd.replace("mute ", "").strip())
        if cmd.startswith("unmute "):
            return self.session.unmute(cmd.replace("unmute ", "").strip())
        if cmd.startswith("solo "):
            return self.session.solo(cmd.replace("solo ", "").strip())
        if cmd in ["everyone in", "unmute all", "all in"]:
            return self.session.unmute_all()
        if cmd.startswith("volume "):
            parts = cmd.replace("volume ", "").strip().split()
            if len(parts) >= 2:
                try:
                    vol = int(parts[-1])
                    name = " ".join(parts[:-1])
                    return self.session.set_volume(name, vol)
                except ValueError:
                    pass
        if any(p in cmd for p in ["record this", "start recording"]):
            return self.session.start_recording()
        if any(p in cmd for p in ["stop recording"]):
            return self.session.stop_recording()
        if any(p in cmd for p in ["who's in", "who is in", "list", "status", "roster"]):
            return self.session.list_participants()
        if any(p in cmd for p in ["setup guide", "setup loopback"]):
            return {"status": "guide", "message": LoopbackSetup.generate_setup_guide()}
        return {"status": "unknown", "message": f"Unknown command: '{command}'."}


if __name__ == "__main__":
    import sys
    cli = DreamChamberCLI()
    if len(sys.argv) > 1:
        result = cli.execute(" ".join(sys.argv[1:]))
        print(json.dumps(result, indent=2))
        sys.exit(0)
    print("""
═══════════════════════════════════════════════════════════════
  DREAMCHAMBER AUDIO CLI
  Voice-controlled multi-AI collaboration environment
═══════════════════════════════════════════════════════════════
  Commands: open/close the dreamchamber, bring in <name>,
  mute/unmute/solo <name>, everyone in, volume <name> <0-100>,
  who's in the room, record this, stop recording, setup guide
═══════════════════════════════════════════════════════════════
""")
    while True:
        try:
            command = input("\nDreamChamber > ").strip()
            if command.lower() in ["quit", "exit", "q"]:
                if cli.session.is_active:
                    cli.execute("close the dreamchamber")
                break
            if command:
                print(json.dumps(cli.execute(command), indent=2))
        except (KeyboardInterrupt, EOFError):
            break
