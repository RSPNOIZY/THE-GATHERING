# DreamChamber Audio MCP

Voice-controlled multi-AI audio collaboration for GOD.local (M2 Ultra Mac Studio).

## Architecture

```
Rob speaks → Voice Bridge (8080) → Claude → MCP tool → Audio route change
```

**Loopback** creates virtual audio devices (configured once in GUI).
**Audio Hijack** controls capture sessions (via .ahcommand JS scripting).
**SoundSource** handles per-app mute/unmute/volume (via AppleScript).
**This MCP** orchestrates all three through Claude-callable tools.

## Setup

```bash
# One-time: install dependencies
cd ~/NOIZYLAB/dreamchamber-audio-mcp
pip install -e .

# One-time: create Loopback virtual devices
# (run the setup_guide tool or see server.py for device list)
```

## MCP Tools (13)

| Tool | Description |
|------|-------------|
| `dreamchamber_open` | Open a session — starts master AH session, registers RSP_001 |
| `dreamchamber_close` | Close session — stops all AH sessions, clears state |
| `dreamchamber_bring_in` | Add a participant (claude, gabriel, gemini, gpt, perplexity, shirley) |
| `dreamchamber_remove` | Remove a participant |
| `dreamchamber_mute` | Mute a participant |
| `dreamchamber_unmute` | Unmute a participant |
| `dreamchamber_solo` | Solo — mute everyone except the named participant (and Rob) |
| `dreamchamber_unmute_all` | Everyone in — unmute all |
| `dreamchamber_volume` | Set volume (0-100) |
| `dreamchamber_record` | Start recording |
| `dreamchamber_stop_recording` | Stop recording |
| `dreamchamber_status` | Who's in the room? Full roster with mute/volume state |
| `dreamchamber_setup_guide` | One-time Loopback virtual device setup instructions |

## Claude Code Config

Add to `~/.claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "dreamchamber-audio": {
      "command": "python",
      "args": ["/Users/m2ultra/NOIZYLAB/dreamchamber-audio-mcp/server.py"],
      "env": {}
    }
  }
}
```

## Voice Commands

Once wired through the Voice Bridge, Rob can say:

- "Open the DreamChamber"
- "Bring in Claude"
- "Mute Gemini"
- "Solo Claude"
- "Everyone in"
- "Volume Claude 80"
- "Who's in the room?"
- "Record this"
- "Close the DreamChamber"

---

Robert Stephen Plowman × Claude (Co-Architect) — March 2026
