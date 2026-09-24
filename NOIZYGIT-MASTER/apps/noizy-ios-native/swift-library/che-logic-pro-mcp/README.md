# che-logic-pro-mcp

MCP Server for controlling Logic Pro on macOS.

## Features

- **AppleScript Control** - Transport, track management, view control, editing commands via keyboard shortcuts
- **MIDI Control** - Virtual MIDI port, note/CC/chord messages, MMC (MIDI Machine Control)
- **Scripter Templates** - Built-in and custom JavaScript templates for Logic Pro's Scripter MIDI FX

## Installation

### Build

```bash
cd che-logic-pro-mcp
swift build -c release
```

Binary location: `.build/release/CheLogicProMCP`

### Configure

#### Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "che-logic-pro-mcp": {
      "command": "/path/to/che-logic-pro-mcp/.build/release/CheLogicProMCP"
    }
  }
}
```

#### Claude Code

```bash
# Copy to ~/bin and add to Claude Code
# --scope user    : available across all projects (stored in ~/.claude.json)
# --transport stdio: local binary execution via stdin/stdout
# --              : separator between claude options and the command
mkdir -p ~/bin
cp .build/release/CheLogicProMCP ~/bin/
claude mcp add --scope user --transport stdio che-logic-pro-mcp -- ~/bin/CheLogicProMCP
```

> **💡 Tip:** Always install the binary to a local directory like `~/bin/`. Avoid placing it in cloud-synced folders (Dropbox, iCloud, OneDrive) as file sync operations can cause MCP connection timeouts.

### macOS Permissions

The MCP server requires the following permissions in **System Settings > Privacy & Security**:

1. **Accessibility** - For System Events keyboard simulation
2. **Automation** - For controlling Logic Pro

## Available Tools

### App Control (4 tools)
| Tool | Description |
|------|-------------|
| `logic_is_running` | Check if Logic Pro is running |
| `logic_launch` | Launch Logic Pro |
| `logic_activate` | Bring Logic Pro to front |
| `logic_quit` | Quit Logic Pro |

### Transport Control (8 tools)
| Tool | Description |
|------|-------------|
| `logic_play` | Start playback |
| `logic_stop` | Stop playback |
| `logic_record` | Start recording |
| `logic_rewind` | Go to beginning |
| `logic_forward` | Move playhead forward |
| `logic_backward` | Move playhead backward |
| `logic_toggle_cycle` | Toggle cycle mode |
| `logic_toggle_metronome` | Toggle metronome |

### Track Management (5 tools)
| Tool | Description |
|------|-------------|
| `logic_create_track` | Create track (midi/audio/drummer) |
| `logic_solo_track` | Toggle solo |
| `logic_mute_track` | Toggle mute |
| `logic_arm_track` | Arm for recording |
| `logic_delete_track` | Delete selected track |

### View Control (10 tools)
| Tool | Description |
|------|-------------|
| `logic_toggle_mixer` | Toggle Mixer (X) |
| `logic_toggle_piano_roll` | Toggle Piano Roll (P) |
| `logic_toggle_automation` | Toggle Automation (A) |
| `logic_toggle_editors` | Toggle Editors (E) |
| `logic_toggle_library` | Toggle Library (Y) |
| `logic_toggle_inspector` | Toggle Inspector (I) |
| `logic_toggle_score` | Toggle Score Editor (N) |
| `logic_zoom_in` | Zoom in |
| `logic_zoom_out` | Zoom out |
| `logic_zoom_fit` | Zoom to fit |

### Editing Commands (11 tools)
| Tool | Description |
|------|-------------|
| `logic_undo` | Undo |
| `logic_redo` | Redo |
| `logic_cut` | Cut |
| `logic_copy` | Copy |
| `logic_paste` | Paste |
| `logic_duplicate` | Duplicate region |
| `logic_split` | Split at playhead |
| `logic_join` | Join regions |
| `logic_quantize` | Quantize |
| `logic_select_all` | Select all |
| `logic_delete_selected` | Delete selected |

### Project Commands (5 tools)
| Tool | Description |
|------|-------------|
| `logic_new_project` | New project |
| `logic_open_project` | Open project |
| `logic_save_project` | Save project |
| `logic_save_as` | Save as |
| `logic_bounce` | Bounce dialog |

### Generic Shortcut
| Tool | Description |
|------|-------------|
| `logic_shortcut` | Execute any keyboard shortcut |

### Utility (2 tools)
| Tool | Description |
|------|-------------|
| `logic_screenshot` | Screenshot Logic Pro window |
| `logic_window_info` | Get window information |

### MIDI Tools (7 tools)
| Tool | Description |
|------|-------------|
| `midi_create_virtual_port` | Create virtual MIDI port |
| `midi_list_ports` | List MIDI ports |
| `midi_send_note` | Send MIDI note |
| `midi_send_cc` | Send Control Change |
| `midi_send_chord` | Send chord |
| `midi_send_program_change` | Send Program Change |
| `midi_send_pitch_bend` | Send Pitch Bend |

### MMC Commands (6 tools)
| Tool | Description |
|------|-------------|
| `midi_mmc_play` | MMC Play |
| `midi_mmc_stop` | MMC Stop |
| `midi_mmc_record` | MMC Record |
| `midi_mmc_rewind` | MMC Rewind |
| `midi_mmc_fast_forward` | MMC Fast Forward |
| `midi_mmc_pause` | MMC Pause |

### Scripter Templates (4 tools)
| Tool | Description |
|------|-------------|
| `scripter_list_templates` | List available templates |
| `scripter_get_template` | Get template code |
| `scripter_create_template` | Save new template |
| `scripter_delete_template` | Delete template |

## Usage Examples

### Basic Recording Session
```
1. logic_launch
2. logic_create_track (type: "audio")
3. logic_arm_track
4. logic_record
```

### MIDI Composition
```
1. midi_create_virtual_port (name: "Claude MIDI")
2. Select "Claude MIDI Out" in Logic Pro's MIDI preferences
3. midi_send_chord (channel: 1, notes: [60, 64, 67], velocity: 100, duration_ms: 1000)
```

### Using Scripter Templates
```
1. scripter_list_templates
2. scripter_get_template (name: "arpeggiator")
3. Copy the code to Logic Pro's Scripter plugin
```

## Built-in Scripter Templates

- **arpeggiator** - Plays held notes in sequence
- **chord_generator** - Generates chords from single notes
- **midi_filter** - Filters MIDI events by type/range
- **velocity_processor** - Adjusts note velocities
- **note_delay** - Delays notes with optional echo
- **transpose** - Transposes notes by semitones

## Technical Notes

- Logic Pro has limited AppleScript support - most control is via System Events keyboard simulation
- MIDI control uses CoreMIDI virtual ports - requires enabling the port in Logic's preferences
- MMC (MIDI Machine Control) requires enabling in Logic Pro's Synchronization settings

## Requirements

- macOS 13+
- Logic Pro
- Swift 5.9+ (for building)
