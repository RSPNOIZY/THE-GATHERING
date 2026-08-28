# shortcuts-mcp

Universal MCP that runs macOS Shortcuts. Control surface for any app that exposes Shortcut actions: Audio Hijack, Loopback, SoundSource, Airfoil, Logic Pro, Music, Notes, Reminders, etc.

## Tools

| Tool | Purpose |
|---|---|
| `shortcut_list` | List all shortcuts on this Mac |
| `shortcut_list_folders` | List shortcut folders |
| `shortcut_run` | Run a shortcut by name with optional input |
| `shortcut_view` | Open a shortcut for editing in the Shortcuts app |

## Workflow

1. Open **Shortcuts.app**
2. Create a shortcut, drag in actions from the app to control
3. Name predictably (e.g. `AH Start Dreamchamber`)
4. Claude calls `shortcut_run("AH Start Dreamchamber")`

Why this beats AppleScript: Rogue Amoeba dropped AppleScript support. Shortcuts is the only sanctioned IPC for modern RA apps and many Apple apps on Apple Silicon.
