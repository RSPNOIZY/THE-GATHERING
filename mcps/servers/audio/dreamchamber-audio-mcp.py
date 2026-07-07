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
        "master": "DreamChamber Master",      # Master mix bus
        "rsp_001": "DreamChamber RSP_001",    # Rob's mic
        "claude": "DreamChamber Claude",       # Claude's voice
        "gabriel": "DreamChamber Gabriel",     # Gabriel's voice  
        "gemini": "DreamChamber Gemini",       # Gemini's voice
        "gpt": "DreamChamber GPT",            # GPT's voice
        "perplexity": "DreamChamber Perplexity", # Perplexity's voice
        "slot_7": "DreamChamber Slot 7",       # Open slot
        "slot_8": "DreamChamber Slot 8",       # Open slot
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
        self.slot = slot                    # 1-8
        self.loopback_device = loopback_device
        self.ah_session = ah_session        # Audio Hijack session name
        self.is_human = is_human
        self.is_active = is_active
        self.is_muted = False
        self.volume = volume                # 0-100
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
    
    Audio Hijack has a full JS engine accessible via:
    1. .ahcommand files (plain text JS, opened to execute)
    2. macOS Shortcuts (Run a Script / Run Javascript actions)
    3. Internal script library (managed in Audio Hijack UI)
    
    We use .ahcommand files for maximum flexibility.
    The MCP writes a JS command to a temp file with .ahcommand extension,
    then opens it — Audio Hijack executes the script immediately.
    """
    
    def __init__(self, command_dir):
        self.command_dir = Path(command_dir)
        self.command_dir.mkdir(parents=True, exist_ok=True)
    
    def execute(self, javascript_code, command_name="dreamchamber_cmd"):
        """Execute JavaScript in Audio Hijack via .ahcommand file."""
        cmd_file = self.command_dir / f"{command_name}.ahcommand"
        cmd_file.write_text(javascript_code, encoding="utf-8")
        
        # Open the .ahcommand file — Audio Hijack executes it
        result = subprocess.run(
            ["open", str(cmd_file)],
            capture_output=True, text=True
        )
        return result.returncode == 0
    
    def start_session(self, session_name):
        """Start an Audio Hijack session by name."""
        js = f'''
let session = app.sessionWithName("{session_name}");
if (session && !session.running) {{
    session.start();
}}
'''
        return self.execute(js, f"start_{session_name.replace(' ', '_')}")
    
    def stop_session(self, session_name):
        """Stop an Audio Hijack session by name."""
        js = f'''
let session = app.sessionWithName("{session_name}");
if (session && session.running) {{
    session.stop();
}}
'''
        return self.execute(js, f"stop_{session_name.replace(' ', '_')}")
    
    def toggle_session(self, session_name):
        """Toggle an Audio Hijack session on/off."""
        js = f'''
let session = app.sessionWithName("{session_name}");
if (session) {{
    if (session.running) session.stop();
    else session.start();
}}
'''
        return self.execute(js, f"toggle_{session_name.replace(' ', '_')}")
    
    def start_all_sessions(self, session_names):
        """Start multiple Audio Hijack sessions."""
        lines = []
        for name in session_names:
            lines.append(f'''
let s_{name.replace(' ', '_')} = app.sessionWithName("{name}");
if (s_{name.replace(' ', '_')} && !s_{name.replace(' ', '_')}.running) {{
    s_{name.replace(' ', '_')}.start();
}}''')
        return self.execute("\n".join(lines), "start_all")
    
    def stop_all_sessions(self, session_names):
        """Stop all Audio Hijack sessions."""
        lines = []
        for name in session_names:
            lines.append(f'''
let s_{name.replace(' ', '_')} = app.sessionWithName("{name}");
if (s_{name.replace(' ', '_')} && s_{name.replace(' ', '_')}.running) {{
    s_{name.replace(' ', '_')}.stop();
}}''')
        return self.execute("\n".join(lines), "stop_all")


# ═══════════════════════════════════════════════════════════════
# SOUNDSOURCE CONTROLLER
# ═══════════════════════════════════════════════════════════════

class SoundSourceController:
    """
    Controls SoundSource via AppleScript/shell commands.
    
    SoundSource provides per-app volume and output device control.
    We use AppleScript to mute/unmute and adjust volume for
    individual AI participant apps.
    """
    
    @staticmethod
    def set_app_volume(app_name, volume_percent):
        """Set volume for a specific app (0-100)."""
        # SoundSource doesn't have a direct AppleScript API,
        # but we can use osascript to control system audio
        # and CoreAudio for per-app control
        volume_float = volume_percent / 100.0
        script = f'''
        do shell script "osascript -e 'set volume output volume {volume_percent}'"
        '''
        subprocess.run(["osascript", "-e", script], capture_output=True)
    
    @staticmethod
    def mute_app(app_name):
        """Mute a specific app's audio output."""
        # Using CoreAudio command-line tools
        subprocess.run([
            "osascript", "-e",
            f'tell application "SoundSource" to set muted of first audio source whose name is "{app_name}" to true'
        ], capture_output=True, text=True)
    
    @staticmethod
    def unmute_app(app_name):
        """Unmute a specific app's audio output."""
        subprocess.run([
            "osascript", "-e",
            f'tell application "SoundSource" to set muted of first audio source whose name is "{app_name}" to false'
        ], capture_output=True, text=True)
    
    @staticmethod
    def set_system_volume(volume_percent):
        """Set the master system volume."""
        subprocess.run([
            "osascript", "-e",
            f"set volume output volume {volume_percent}"
        ], capture_output=True)


# ═══════════════════════════════════════════════════════════════
# LOOPBACK SETUP GUIDE
# ═══════════════════════════════════════════════════════════════

class LoopbackSetup:
    """
    Loopback has NO scripting API. Configuration is GUI-only.
    But virtual devices persist forever once created.
    
    This class generates the setup guide for creating
    the DreamChamber virtual devices in Loopback.
    
    YOU DO THIS ONCE. Then it works forever.
    """
    
    @staticmethod
    def generate_setup_guide():
        """Generate the one-time Loopback setup instructions."""
        devices = DREAMCHAMBER_CONFIG["loopback_devices"]
        
        guide = """
═══════════════════════════════════════════════════════════════
DREAMCHAMBER — ONE-TIME LOOPBACK SETUP GUIDE
═══════════════════════════════════════════════════════════════

Open Loopback on your M2 Ultra. Create these virtual devices:

"""
        for key, name in devices.items():
            if key == "master":
                guide += f"""
DEVICE: {name}
  Type: Master mix bus
  Sources: All other DreamChamber devices
  Output Channels: 2 (stereo)
  Monitor: {DREAMCHAMBER_CONFIG['monitor_device']}
  Notes: This is what you hear. All AI voices mixed together.
"""
            elif key == "rsp_001":
                guide += f"""
DEVICE: {name}
  Type: Your microphone input
  Sources: Apollo interface (your mic)
  Output Channels: 2 (stereo)
  Monitor: None (you hear yourself naturally)
  Notes: Your voice goes here. Other AIs listen to this device.
"""
            else:
                guide += f"""
DEVICE: {name}
  Type: AI participant channel
  Sources: Pass-Thru (the AI app outputs to this device)
  Output Channels: 2 (stereo)
  Monitor: None (monitored via Master device)
  Notes: {key.replace('_', ' ').title()}'s dedicated audio channel.
"""
        
        guide += """
═══════════════════════════════════════════════════════════════
WIRING:

  Each AI device → wired to → Master device (as a source)
  Master device → monitored through → Built-in Output (or Apollo)
  
  RSP_001 device → wired to → each AI's input
  (so they can hear you speak)

AFTER SETUP:
  Quit Loopback. The devices persist across reboots.
  The MCP handles everything else via Audio Hijack + SoundSource.
═══════════════════════════════════════════════════════════════
"""
        return guide


# ═══════════════════════════════════════════════════════════════
# DREAMCHAMBER SESSION MANAGER
# ═══════════════════════════════════════════════════════════════

class DreamChamberSession:
    """
    The main session controller.
    
    Voice commands from Rob → parsed by Claude → executed here.
    
    Commands:
      "Open the DreamChamber"       → start_session()
      "Bring in Claude"             → add_participant("claude")
      "Mute Gemini"                 → mute("gemini")
      "Unmute Gemini"               → unmute("gemini")
      "Solo Claude"                 → solo("claude")
      "Everyone in"                 → unmute_all()
      "Close the DreamChamber"      → end_session()
      "Volume Claude 80"            → set_volume("claude", 80)
      "Who's in the room?"          → list_participants()
      "Record this session"         → start_recording()
      "Stop recording"              → stop_recording()
    """
    
    def __init__(self):
        self.config = DREAMCHAMBER_CONFIG
        self.participants = {}
        self.is_active = False
        self.is_recording = False
        self.session_id = None
        self.session_start = None
        
        # Controllers
        self.ah = AudioHijackController(self.config["ahcommand_dir"])
        self.ss = SoundSourceController()
        
        # Ensure directories exist
        Path(self.config["log_dir"]).mkdir(parents=True, exist_ok=True)
        Path(self.config["ahcommand_dir"]).mkdir(parents=True, exist_ok=True)
    
    # ── SESSION LIFECYCLE ──
    
    def start_session(self):
        """Open the DreamChamber. Initialize all audio routing."""
        self.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        self.session_start = datetime.now()
        self.is_active = True
        
        # Register RSP_001 (always present)
        self.participants["rsp_001"] = Participant(
            name="RSP_001 (Robert Stephen Plowman)",
            slot=1,
            loopback_device=self.config["loopback_devices"]["rsp_001"],
            is_human=True,
            is_active=True
        )
        
        # Start the master Audio Hijack session
        master_session = self.config["audio_hijack_sessions"].get("master")
        if master_session:
            self.ah.start_session(master_session)
        
        self._log("SESSION_START", f"DreamChamber opened. Session: {self.session_id}")
        
        return {
            "status": "open",
            "session_id": self.session_id,
            "message": "DreamChamber is open. RSP_001 is in the room. Who do you want to bring in?",
            "participants": ["RSP_001"],
            "available_slots": list(range(2, 9))
        }
    
    def end_session(self):
        """Close the DreamChamber. Stop all routing."""
        if not self.is_active:
            return {"status": "error", "message": "DreamChamber is not open."}
        
        # Stop recording if active
        if self.is_recording:
            self.stop_recording()
        
        # Stop all Audio Hijack sessions
        all_sessions = list(self.config["audio_hijack_sessions"].values())
        self.ah.stop_all_sessions(all_sessions)
        
        # Log session summary
        duration = (datetime.now() - self.session_start).total_seconds()
        participant_names = [p.name for p in self.participants.values()]
        
        self._log("SESSION_END", f"Duration: {duration:.0f}s. Participants: {', '.join(participant_names)}")
        
        self.is_active = False
        self.participants = {}
        
        return {
            "status": "closed",
            "session_id": self.session_id,
            "duration_seconds": round(duration),
            "message": "DreamChamber closed. All audio routing stopped."
        }
    
    # ── PARTICIPANT MANAGEMENT ──
    
    def add_participant(self, name):
        """Bring an AI participant into the DreamChamber."""
        if not self.is_active:
            return {"status": "error", "message": "DreamChamber is not open. Say 'Open the DreamChamber' first."}
        
        name_lower = name.lower().replace(" ", "_")
        
        if name_lower in self.participants:
            return {"status": "already_in", "message": f"{name} is already in the room."}
        
        if len(self.participants) >= self.config["max_participants"]:
            return {"status": "full", "message": "DreamChamber is full (8 participants max)."}
        
        # Find the Loopback device and AH session for this participant
        loopback_device = self.config["loopback_devices"].get(name_lower)
        ah_session = self.config["audio_hijack_sessions"].get(name_lower)
        
        if not loopback_device:
            # Assign to next available slot
            used_slots = {p.slot for p in self.participants.values()}
            next_slot = next(s for s in range(1, 9) if s not in used_slots)
            slot_key = f"slot_{next_slot}"
            loopback_device = self.config["loopback_devices"].get(slot_key, f"DreamChamber Slot {next_slot}")
        else:
            used_slots = {p.slot for p in self.participants.values()}
            next_slot = next(s for s in range(1, 9) if s not in used_slots)
        
        # Create participant
        participant = Participant(
            name=name,
            slot=next_slot,
            loopback_device=loopback_device,
            ah_session=ah_session,
            is_active=True
        )
        self.participants[name_lower] = participant
        
        # Start their Audio Hijack session
        if ah_session:
            self.ah.start_session(ah_session)
        
        self._log("PARTICIPANT_JOIN", f"{name} joined on slot {next_slot}")
        
        return {
            "status": "joined",
            "participant": name,
            "slot": next_slot,
            "loopback_device": loopback_device,
            "message": f"{name} is in the room. Slot {next_slot}.",
            "total_participants": len(self.participants)
        }
    
    def remove_participant(self, name):
        """Remove an AI participant from the DreamChamber."""
        name_lower = name.lower().replace(" ", "_")
        
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        
        participant = self.participants[name_lower]
        
        # Stop their Audio Hijack session
        if participant.ah_session:
            self.ah.stop_session(participant.ah_session)
        
        del self.participants[name_lower]
        self._log("PARTICIPANT_LEAVE", f"{name} left the room")
        
        return {
            "status": "removed",
            "participant": name,
            "message": f"{name} has left the room.",
            "remaining": len(self.participants)
        }
    
    # ── MUTE/UNMUTE/SOLO/VOLUME ──
    
    def mute(self, name):
        """Mute a participant."""
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        
        self.participants[name_lower].is_muted = True
        self.ss.mute_app(name)
        self._log("MUTE", f"{name} muted")
        
        return {"status": "muted", "participant": name, "message": f"{name} is muted."}
    
    def unmute(self, name):
        """Unmute a participant."""
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        
        self.participants[name_lower].is_muted = False
        self.ss.unmute_app(name)
        self._log("UNMUTE", f"{name} unmuted")
        
        return {"status": "unmuted", "participant": name, "message": f"{name} is live."}
    
    def solo(self, name):
        """Solo a participant (mute everyone else)."""
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        
        muted = []
        for key, p in self.participants.items():
            if key != name_lower and key != "rsp_001":  # Never mute Rob
                p.is_muted = True
                self.ss.mute_app(p.name)
                muted.append(p.name)
        
        self.participants[name_lower].is_muted = False
        self.ss.unmute_app(name)
        
        self._log("SOLO", f"{name} soloed. Muted: {', '.join(muted)}")
        
        return {
            "status": "soloed",
            "participant": name,
            "muted": muted,
            "message": f"{name} is soloed. Everyone else is muted."
        }
    
    def unmute_all(self):
        """Unmute all participants."""
        for key, p in self.participants.items():
            p.is_muted = False
            self.ss.unmute_app(p.name)
        
        self._log("UNMUTE_ALL", "All participants unmuted")
        names = [p.name for p in self.participants.values()]
        
        return {
            "status": "all_unmuted",
            "participants": names,
            "message": f"Everyone is live. {len(names)} participants in the room."
        }
    
    def set_volume(self, name, volume_percent):
        """Set a participant's volume (0-100)."""
        name_lower = name.lower().replace(" ", "_")
        if name_lower not in self.participants:
            return {"status": "not_found", "message": f"{name} is not in the room."}
        
        volume = max(0, min(100, volume_percent))
        self.participants[name_lower].volume = volume
        self.ss.set_app_volume(name, volume)
        
        self._log("VOLUME", f"{name} volume set to {volume}%")
        
        return {"status": "volume_set", "participant": name, "volume": volume}
    
    # ── RECORDING ──
    
    def start_recording(self):
        """Start recording the DreamChamber session."""
        if self.is_recording:
            return {"status": "already_recording", "message": "Already recording."}
        
        self.is_recording = True
        # Audio Hijack handles the actual recording
        self._log("RECORDING_START", "Recording started")
        
        return {"status": "recording", "message": "Recording. Everything is being captured."}
    
    def stop_recording(self):
        """Stop recording."""
        if not self.is_recording:
            return {"status": "not_recording", "message": "Not currently recording."}
        
        self.is_recording = False
        self._log("RECORDING_STOP", "Recording stopped")
        
        return {"status": "stopped", "message": "Recording stopped. File saved."}
    
    # ── STATUS ──
    
    def list_participants(self):
        """Who's in the room?"""
        if not self.is_active:
            return {"status": "closed", "message": "DreamChamber is not open."}
        
        roster = []
        for key, p in self.participants.items():
            status = "MUTED" if p.is_muted else "LIVE"
            role = "HUMAN" if p.is_human else "AI"
            roster.append(f"  Slot {p.slot}: {p.name} [{role}] [{status}] Vol:{p.volume}%")
        
        return {
            "status": "active",
            "session_id": self.session_id,
            "participant_count": len(self.participants),
            "is_recording": self.is_recording,
            "roster": "\n".join(roster),
            "message": f"DreamChamber is open. {len(self.participants)} participants:\n" + "\n".join(roster)
        }
    
    # ── LOGGING ──
    
    def _log(self, event_type, message):
        """Log session events for audit trail."""
        log_file = Path(self.config["log_dir"]) / f"session_{self.session_id}.log"
        timestamp = datetime.now().isoformat()
        entry = f"[{timestamp}] [{event_type}] {message}\n"
        
        with open(log_file, "a") as f:
            f.write(entry)
        
        # Also print to console for real-time feedback
        print(f"DreamChamber | {event_type}: {message}")


# ═══════════════════════════════════════════════════════════════
# MCP COMMAND PARSER
# ═══════════════════════════════════════════════════════════════

class DreamChamberMCP:
    """
    The MCP interface. Parses natural language commands
    and routes them to the session manager.
    
    Voice command → Claude → MCP → Audio routing change
    
    Commands Rob can speak:
      "Open the DreamChamber"
      "Bring in Claude"
      "Bring in Gemini"
      "Mute Gemini"
      "Unmute Gemini"  
      "Solo Claude"
      "Everyone in"
      "Volume Claude 80"
      "Who's in the room?"
      "Record this"
      "Stop recording"
      "Remove GPT"
      "Close the DreamChamber"
    """
    
    def __init__(self):
        self.session = DreamChamberSession()
    
    def execute(self, command: str) -> dict:
        """Parse and execute a DreamChamber command."""
        cmd = command.lower().strip()
        
        # Session lifecycle
        if any(phrase in cmd for phrase in ["open the dreamchamber", "open dreamchamber", "start session"]):
            return self.session.start_session()
        
        if any(phrase in cmd for phrase in ["close the dreamchamber", "close dreamchamber", "end session"]):
            return self.session.end_session()
        
        # Participant management
        if cmd.startswith("bring in ") or cmd.startswith("add "):
            name = cmd.replace("bring in ", "").replace("add ", "").strip()
            return self.session.add_participant(name)
        
        if cmd.startswith("remove ") or cmd.startswith("kick "):
            name = cmd.replace("remove ", "").replace("kick ", "").strip()
            return self.session.remove_participant(name)
        
        # Mute/unmute/solo
        if cmd.startswith("mute "):
            name = cmd.replace("mute ", "").strip()
            return self.session.mute(name)
        
        if cmd.startswith("unmute "):
            name = cmd.replace("unmute ", "").strip()
            return self.session.unmute(name)
        
        if cmd.startswith("solo "):
            name = cmd.replace("solo ", "").strip()
            return self.session.solo(name)
        
        if cmd in ["everyone in", "unmute all", "all in"]:
            return self.session.unmute_all()
        
        # Volume
        if cmd.startswith("volume "):
            parts = cmd.replace("volume ", "").strip().split()
            if len(parts) >= 2:
                name = " ".join(parts[:-1])
                try:
                    vol = int(parts[-1])
                    return self.session.set_volume(name, vol)
                except ValueError:
                    pass
        
        # Recording
        if any(phrase in cmd for phrase in ["record this", "start recording", "record"]):
            return self.session.start_recording()
        
        if any(phrase in cmd for phrase in ["stop recording", "stop record"]):
            return self.session.stop_recording()
        
        # Status
        if any(phrase in cmd for phrase in ["who's in", "who is in", "list", "status", "roster"]):
            return self.session.list_participants()
        
        # Setup guide
        if any(phrase in cmd for phrase in ["setup guide", "setup loopback", "how to setup"]):
            return {"status": "guide", "message": LoopbackSetup.generate_setup_guide()}
        
        return {"status": "unknown", "message": f"Unknown command: '{command}'. Try 'open the dreamchamber' to start."}


# ═══════════════════════════════════════════════════════════════
# MAIN — Interactive mode
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    import sys
    
    mcp = DreamChamberMCP()
    
    # Single command mode
    if len(sys.argv) > 1:
        command = " ".join(sys.argv[1:])
        result = mcp.execute(command)
        print(json.dumps(result, indent=2))
        sys.exit(0)
    
    # Interactive mode
    print("""
═══════════════════════════════════════════════════════════════
  DREAMCHAMBER AUDIO MCP
  Voice-controlled multi-AI collaboration environment
═══════════════════════════════════════════════════════════════
  
  Commands:
    open the dreamchamber    — Start a session
    bring in claude          — Add a participant
    mute gemini              — Mute a participant
    unmute gemini            — Unmute
    solo claude              — Solo (mute everyone else)
    everyone in              — Unmute all
    volume claude 80         — Set volume (0-100)
    who's in the room        — List participants
    record this              — Start recording
    stop recording           — Stop recording
    remove gpt               — Remove a participant
    close the dreamchamber   — End session
    setup guide              — Show Loopback setup instructions
    quit                     — Exit
  
═══════════════════════════════════════════════════════════════
""")
    
    while True:
        try:
            command = input("\nDreamChamber > ").strip()
            if command.lower() in ["quit", "exit", "q"]:
                if mcp.session.is_active:
                    mcp.execute("close the dreamchamber")
                print("Goodbye.")
                break
            if command:
                result = mcp.execute(command)
                print(json.dumps(result, indent=2))
        except KeyboardInterrupt:
            print("\nGoodbye.")
            break
        except EOFError:
            break
