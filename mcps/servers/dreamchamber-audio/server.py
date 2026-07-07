#!/usr/bin/env python3
"""
═══════════════════════════════════════════════════════════════
DREAMCHAMBER AUDIO MCP SERVER
═══════════════════════════════════════════════════════════════
FastMCP server for voice-controlled multi-AI audio collaboration.

Orchestrates Rogue Amoeba's Loopback + Audio Hijack + SoundSource
on GOD.local (M2 Ultra Mac Studio) to create a real-time
multi-AI voice mixing environment.

Architecture:
  LOOPBACK      → Virtual audio devices (the pipes) — GUI config, persists
  AUDIO HIJACK  → Session control (the valves) — .ahcommand JS scripting
  SOUNDSOURCE   → Per-app volume/mute (the faders) — AppleScript
  THIS SERVER   → MCP tools that Claude/Gabriel can call

Pipeline:
  Rob speaks → Voice Bridge (8080) → Claude → MCP tool call → Audio route change

Robert Stephen Plowman × Claude (Co-Architect)
March 2026
═══════════════════════════════════════════════════════════════
"""

import json
import os
import subprocess
from datetime import datetime
from pathlib import Path
from typing import Optional, List
from enum import Enum

from mcp.server.fastmcp import FastMCP
from pydantic import BaseModel, Field, ConfigDict

# ═══════════════════════════════════════════════════════════════
# MCP SERVER INITIALIZATION
# ═══════════════════════════════════════════════════════════════

mcp = FastMCP("dreamchamber_audio_mcp")

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

CONFIG = {
    "max_participants": 8,
    "sample_rate": 48000,
    "bit_depth": 32,
    "monitor_device": "Built-in Output",

    "loopback_devices": {
        "master": "DreamChamber Master",
        "rsp_001": "DreamChamber RSP_001",
        "claude": "DreamChamber Claude",
        "gabriel": "DreamChamber Gabriel",
        "gemini": "DreamChamber Gemini",
        "gpt": "DreamChamber GPT",
        "perplexity": "DreamChamber Perplexity",
        "shirley": "DreamChamber Shirley",
        "slot_8": "DreamChamber Slot 8",
    },

    "audio_hijack_sessions": {
        "master": "DreamChamber Master Session",
        "claude": "DreamChamber Claude Capture",
        "gabriel": "DreamChamber Gabriel Capture",
        "gemini": "DreamChamber Gemini Capture",
        "gpt": "DreamChamber GPT Capture",
        "perplexity": "DreamChamber Perplexity Capture",
        "shirley": "DreamChamber Shirley Capture",
    },

    "log_dir": os.path.expanduser("~/NOIZYLAB/dreamchamber-audio-mcp/logs"),
    "ahcommand_dir": os.path.expanduser("~/NOIZYLAB/dreamchamber-audio-mcp/commands"),
}

# ═══════════════════════════════════════════════════════════════
# STATE
# ═══════════════════════════════════════════════════════════════

class SessionState:
    """In-memory session state. Single instance on GOD.local."""

    def __init__(self):
        self.is_active = False
        self.is_recording = False
        self.session_id = None
        self.session_start = None
        self.participants = {}  # key → {name, slot, device, muted, volume, human, joined}

    def reset(self):
        self.is_active = False
        self.is_recording = False
        self.session_id = None
        self.session_start = None
        self.participants = {}

state = SessionState()

# ═══════════════════════════════════════════════════════════════
# AUDIO HIJACK CONTROLLER
# ═══════════════════════════════════════════════════════════════

def ah_execute(javascript: str, name: str = "cmd") -> bool:
    """Execute JavaScript in Audio Hijack via .ahcommand file."""
    cmd_dir = Path(CONFIG["ahcommand_dir"])
    cmd_dir.mkdir(parents=True, exist_ok=True)
    cmd_file = cmd_dir / f"{name}.ahcommand"
    cmd_file.write_text(javascript, encoding="utf-8")
    result = subprocess.run(["open", str(cmd_file)], capture_output=True, text=True)
    return result.returncode == 0

def ah_start_session(session_name: str) -> bool:
    js = f'let s = app.sessionWithName("{session_name}"); if (s && !s.running) {{ s.start(); }}'
    return ah_execute(js, f"start_{session_name.replace(' ', '_')}")

def ah_stop_session(session_name: str) -> bool:
    js = f'let s = app.sessionWithName("{session_name}"); if (s && s.running) {{ s.stop(); }}'
    return ah_execute(js, f"stop_{session_name.replace(' ', '_')}")

def ah_stop_all() -> bool:
    lines = []
    for name in CONFIG["audio_hijack_sessions"].values():
        safe = name.replace(' ', '_').replace("'", "")
        lines.append(f'let s_{safe} = app.sessionWithName("{name}"); if (s_{safe} && s_{safe}.running) {{ s_{safe}.stop(); }}')
    return ah_execute("\n".join(lines), "stop_all")

# ═══════════════════════════════════════════════════════════════
# SOUNDSOURCE CONTROLLER
# ═══════════════════════════════════════════════════════════════

def ss_mute(app_name: str):
    subprocess.run([
        "osascript", "-e",
        f'tell application "SoundSource" to set muted of first audio source whose name is "{app_name}" to true'
    ], capture_output=True, text=True)

def ss_unmute(app_name: str):
    subprocess.run([
        "osascript", "-e",
        f'tell application "SoundSource" to set muted of first audio source whose name is "{app_name}" to false'
    ], capture_output=True, text=True)

def ss_set_volume(app_name: str, volume: int):
    subprocess.run([
        "osascript", "-e",
        f"set volume output volume {volume}"
    ], capture_output=True)

# ═══════════════════════════════════════════════════════════════
# LOGGING
# ═══════════════════════════════════════════════════════════════

def log_event(event_type: str, message: str):
    """Append to session log file."""
    if not state.session_id:
        return
    log_dir = Path(CONFIG["log_dir"])
    log_dir.mkdir(parents=True, exist_ok=True)
    log_file = log_dir / f"session_{state.session_id}.log"
    timestamp = datetime.now().isoformat()
    with open(log_file, "a") as f:
        f.write(f"[{timestamp}] [{event_type}] {message}\n")

# ═══════════════════════════════════════════════════════════════
# INPUT MODELS
# ═══════════════════════════════════════════════════════════════

class ParticipantName(BaseModel):
    """A participant name."""
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str = Field(
        ...,
        description="Participant name: claude, gabriel, gemini, gpt, perplexity, shirley, or any custom name",
        min_length=1, max_length=50
    )

class VolumeInput(BaseModel):
    """Participant name + volume level."""
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")
    name: str = Field(..., description="Participant name", min_length=1, max_length=50)
    volume: int = Field(..., description="Volume level 0-100", ge=0, le=100)

# ═══════════════════════════════════════════════════════════════
# MCP TOOLS — SESSION LIFECYCLE
# ═══════════════════════════════════════════════════════════════

@mcp.tool(
    name="dreamchamber_open",
    annotations={
        "title": "Open the DreamChamber",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_open() -> str:
    """
    Open the DreamChamber audio session.
    Starts the master Audio Hijack session and registers RSP_001.
    Rob is always participant #1.
    """
    if state.is_active:
        return json.dumps({"status": "already_open", "session_id": state.session_id,
                           "participants": list(state.participants.keys())})

    state.session_id = datetime.now().strftime("%Y%m%d_%H%M%S")
    state.session_start = datetime.now()
    state.is_active = True

    # RSP_001 is always in the room
    state.participants["rsp_001"] = {
        "name": "RSP_001 (Robert Stephen Plowman)",
        "slot": 1,
        "device": CONFIG["loopback_devices"]["rsp_001"],
        "muted": False,
        "volume": 100,
        "human": True,
        "joined": datetime.now().isoformat(),
    }

    # Start master Audio Hijack session
    master = CONFIG["audio_hijack_sessions"].get("master")
    if master:
        ah_start_session(master)

    log_event("SESSION_START", f"DreamChamber opened. Session: {state.session_id}")

    return json.dumps({
        "status": "open",
        "session_id": state.session_id,
        "message": "DreamChamber is open. RSP_001 is in the room. Who do you want to bring in?",
        "participants": ["RSP_001"],
        "available_slots": list(range(2, 9)),
    })


@mcp.tool(
    name="dreamchamber_close",
    annotations={
        "title": "Close the DreamChamber",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_close() -> str:
    """
    Close the DreamChamber. Stops all Audio Hijack sessions,
    stops recording if active, and clears participant state.
    """
    if not state.is_active:
        return json.dumps({"status": "not_open", "message": "DreamChamber is not open."})

    if state.is_recording:
        state.is_recording = False
        log_event("RECORDING_STOP", "Recording stopped (session closing)")

    ah_stop_all()

    duration = (datetime.now() - state.session_start).total_seconds() if state.session_start else 0
    participant_names = [p["name"] for p in state.participants.values()]

    log_event("SESSION_END", f"Duration: {duration:.0f}s. Participants: {', '.join(participant_names)}")

    state.reset()

    return json.dumps({
        "status": "closed",
        "duration_seconds": round(duration),
        "message": "DreamChamber closed. All audio routing stopped.",
    })


# ═══════════════════════════════════════════════════════════════
# MCP TOOLS — PARTICIPANT MANAGEMENT
# ═══════════════════════════════════════════════════════════════

@mcp.tool(
    name="dreamchamber_bring_in",
    annotations={
        "title": "Bring a participant into the DreamChamber",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_bring_in(params: ParticipantName) -> str:
    """
    Add an AI participant to the DreamChamber.
    Starts their Audio Hijack capture session and assigns a Loopback device slot.
    Known participants: claude, gabriel, gemini, gpt, perplexity, shirley.
    Custom names get assigned to open slots.
    """
    if not state.is_active:
        return json.dumps({"status": "error", "message": "DreamChamber is not open. Open it first."})

    key = params.name.lower().replace(" ", "_")

    if key in state.participants:
        return json.dumps({"status": "already_in", "message": f"{params.name} is already in the room."})

    if len(state.participants) >= CONFIG["max_participants"]:
        return json.dumps({"status": "full", "message": "DreamChamber is full (8 participants max)."})

    used_slots = {p["slot"] for p in state.participants.values()}
    next_slot = next(s for s in range(1, 9) if s not in used_slots)

    device = CONFIG["loopback_devices"].get(key, f"DreamChamber Slot {next_slot}")
    ah_session = CONFIG["audio_hijack_sessions"].get(key)

    state.participants[key] = {
        "name": params.name,
        "slot": next_slot,
        "device": device,
        "muted": False,
        "volume": 100,
        "human": False,
        "joined": datetime.now().isoformat(),
    }

    if ah_session:
        ah_start_session(ah_session)

    log_event("JOIN", f"{params.name} joined on slot {next_slot}")

    return json.dumps({
        "status": "joined",
        "participant": params.name,
        "slot": next_slot,
        "device": device,
        "message": f"{params.name} is in the room. Slot {next_slot}.",
        "total": len(state.participants),
    })


@mcp.tool(
    name="dreamchamber_remove",
    annotations={
        "title": "Remove a participant from the DreamChamber",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_remove(params: ParticipantName) -> str:
    """
    Remove an AI participant from the DreamChamber.
    Stops their Audio Hijack capture session and frees the slot.
    Cannot remove RSP_001 (Rob is always in the room).
    """
    key = params.name.lower().replace(" ", "_")

    if key == "rsp_001":
        return json.dumps({"status": "error", "message": "Cannot remove RSP_001. Rob is always in the room."})

    if key not in state.participants:
        return json.dumps({"status": "not_found", "message": f"{params.name} is not in the room."})

    ah_session = CONFIG["audio_hijack_sessions"].get(key)
    if ah_session:
        ah_stop_session(ah_session)

    del state.participants[key]
    log_event("LEAVE", f"{params.name} removed")

    return json.dumps({
        "status": "removed",
        "participant": params.name,
        "remaining": len(state.participants),
    })


# ═══════════════════════════════════════════════════════════════
# MCP TOOLS — MUTE / UNMUTE / SOLO / VOLUME
# ═══════════════════════════════════════════════════════════════

@mcp.tool(
    name="dreamchamber_mute",
    annotations={
        "title": "Mute a participant",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_mute(params: ParticipantName) -> str:
    """Mute a participant's audio output via SoundSource."""
    key = params.name.lower().replace(" ", "_")
    if key not in state.participants:
        return json.dumps({"status": "not_found", "message": f"{params.name} is not in the room."})

    state.participants[key]["muted"] = True
    ss_mute(params.name)
    log_event("MUTE", f"{params.name} muted")

    return json.dumps({"status": "muted", "participant": params.name})


@mcp.tool(
    name="dreamchamber_unmute",
    annotations={
        "title": "Unmute a participant",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_unmute(params: ParticipantName) -> str:
    """Unmute a participant's audio output via SoundSource."""
    key = params.name.lower().replace(" ", "_")
    if key not in state.participants:
        return json.dumps({"status": "not_found", "message": f"{params.name} is not in the room."})

    state.participants[key]["muted"] = False
    ss_unmute(params.name)
    log_event("UNMUTE", f"{params.name} unmuted")

    return json.dumps({"status": "unmuted", "participant": params.name})


@mcp.tool(
    name="dreamchamber_solo",
    annotations={
        "title": "Solo a participant (mute everyone else)",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": False,
        "openWorldHint": True,
    }
)
async def dreamchamber_solo(params: ParticipantName) -> str:
    """
    Solo a participant — mute everyone else except RSP_001 (Rob never gets muted).
    The soloed participant is unmuted.
    """
    key = params.name.lower().replace(" ", "_")
    if key not in state.participants:
        return json.dumps({"status": "not_found", "message": f"{params.name} is not in the room."})

    muted_names = []
    for k, p in state.participants.items():
        if k != key and k != "rsp_001":
            p["muted"] = True
            ss_mute(p["name"])
            muted_names.append(p["name"])

    state.participants[key]["muted"] = False
    ss_unmute(params.name)

    log_event("SOLO", f"{params.name} soloed. Muted: {', '.join(muted_names)}")

    return json.dumps({
        "status": "soloed",
        "participant": params.name,
        "muted": muted_names,
        "message": f"{params.name} is soloed. Everyone else is muted.",
    })


@mcp.tool(
    name="dreamchamber_unmute_all",
    annotations={
        "title": "Unmute all participants — everyone in",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_unmute_all() -> str:
    """Unmute all participants. Everyone is live."""
    if not state.is_active:
        return json.dumps({"status": "error", "message": "DreamChamber is not open."})

    for k, p in state.participants.items():
        p["muted"] = False
        ss_unmute(p["name"])

    names = [p["name"] for p in state.participants.values()]
    log_event("UNMUTE_ALL", "All participants unmuted")

    return json.dumps({
        "status": "all_unmuted",
        "participants": names,
        "message": f"Everyone is live. {len(names)} participants in the room.",
    })


@mcp.tool(
    name="dreamchamber_volume",
    annotations={
        "title": "Set a participant's volume (0-100)",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_volume(params: VolumeInput) -> str:
    """Set a participant's volume level (0 = silent, 100 = full)."""
    key = params.name.lower().replace(" ", "_")
    if key not in state.participants:
        return json.dumps({"status": "not_found", "message": f"{params.name} is not in the room."})

    state.participants[key]["volume"] = params.volume
    ss_set_volume(params.name, params.volume)
    log_event("VOLUME", f"{params.name} → {params.volume}%")

    return json.dumps({
        "status": "volume_set",
        "participant": params.name,
        "volume": params.volume,
    })


# ═══════════════════════════════════════════════════════════════
# MCP TOOLS — RECORDING
# ═══════════════════════════════════════════════════════════════

@mcp.tool(
    name="dreamchamber_record",
    annotations={
        "title": "Start recording the DreamChamber session",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_record() -> str:
    """Start recording. Audio Hijack captures all channels."""
    if not state.is_active:
        return json.dumps({"status": "error", "message": "DreamChamber is not open."})
    if state.is_recording:
        return json.dumps({"status": "already_recording", "message": "Already recording."})

    state.is_recording = True
    log_event("RECORDING_START", "Recording started")

    return json.dumps({"status": "recording", "message": "Recording. Everything is being captured."})


@mcp.tool(
    name="dreamchamber_stop_recording",
    annotations={
        "title": "Stop recording",
        "readOnlyHint": False,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": True,
    }
)
async def dreamchamber_stop_recording() -> str:
    """Stop recording the DreamChamber session."""
    if not state.is_recording:
        return json.dumps({"status": "not_recording", "message": "Not currently recording."})

    state.is_recording = False
    log_event("RECORDING_STOP", "Recording stopped")

    return json.dumps({"status": "stopped", "message": "Recording stopped."})


# ═══════════════════════════════════════════════════════════════
# MCP TOOLS — STATUS
# ═══════════════════════════════════════════════════════════════

@mcp.tool(
    name="dreamchamber_status",
    annotations={
        "title": "Get DreamChamber session status — who's in the room?",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def dreamchamber_status() -> str:
    """
    Returns the current DreamChamber session status:
    who's in the room, mute state, volume levels, recording status.
    """
    if not state.is_active:
        return json.dumps({"status": "closed", "message": "DreamChamber is not open."})

    roster = []
    for key, p in state.participants.items():
        status_label = "MUTED" if p["muted"] else "LIVE"
        role = "HUMAN" if p["human"] else "AI"
        roster.append({
            "key": key,
            "name": p["name"],
            "slot": p["slot"],
            "role": role,
            "status": status_label,
            "volume": p["volume"],
            "device": p["device"],
        })

    duration = (datetime.now() - state.session_start).total_seconds() if state.session_start else 0

    return json.dumps({
        "status": "active",
        "session_id": state.session_id,
        "duration_seconds": round(duration),
        "participant_count": len(state.participants),
        "is_recording": state.is_recording,
        "roster": roster,
    })


# ═══════════════════════════════════════════════════════════════
# MCP TOOLS — SETUP GUIDE
# ═══════════════════════════════════════════════════════════════

@mcp.tool(
    name="dreamchamber_setup_guide",
    annotations={
        "title": "Get the one-time Loopback setup guide",
        "readOnlyHint": True,
        "destructiveHint": False,
        "idempotentHint": True,
        "openWorldHint": False,
    }
)
async def dreamchamber_setup_guide() -> str:
    """
    Returns the one-time setup guide for creating virtual audio devices
    in Rogue Amoeba Loopback. These devices persist across reboots.
    You only need to do this once on GOD.local.
    """
    devices = CONFIG["loopback_devices"]
    guide_lines = [
        "DREAMCHAMBER — ONE-TIME LOOPBACK SETUP GUIDE",
        "=" * 50,
        "",
        "Open Loopback on GOD.local. Create these virtual devices:",
        "",
    ]

    for key, name in devices.items():
        if key == "master":
            guide_lines.append(f"DEVICE: {name}")
            guide_lines.append(f"  Type: Master mix bus — all AI voices mixed")
            guide_lines.append(f"  Sources: All other DreamChamber devices")
            guide_lines.append(f"  Monitor: {CONFIG['monitor_device']}")
            guide_lines.append("")
        elif key == "rsp_001":
            guide_lines.append(f"DEVICE: {name}")
            guide_lines.append(f"  Type: Rob's mic input (Apollo)")
            guide_lines.append(f"  Sources: Apollo interface")
            guide_lines.append("")
        else:
            guide_lines.append(f"DEVICE: {name}")
            guide_lines.append(f"  Type: AI channel — {key}")
            guide_lines.append(f"  Sources: Pass-Thru")
            guide_lines.append("")

    guide_lines.extend([
        "WIRING:",
        "  Each AI device → Master device (as source)",
        "  Master device → Built-in Output (or Apollo monitors)",
        "  RSP_001 device → each AI's input (so they hear Rob)",
        "",
        "After setup: quit Loopback. Devices persist forever.",
        "The MCP handles everything else via Audio Hijack + SoundSource.",
    ])

    return "\n".join(guide_lines)


# ═══════════════════════════════════════════════════════════════
# ENTRY POINT
# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    mcp.run()
