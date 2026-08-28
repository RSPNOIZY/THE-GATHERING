# Commander One MCP — Installation Guide

## Prerequisites

- macOS with Apple Silicon (M2 Ultra)
- Python 3.11+
- Claude Code or Claude Desktop

## Optional (for full archive support)

```bash
brew install p7zip     # 7z format support
brew install unrar     # RAR extraction
```

## Quick Install

```bash
# 1. Navigate to the MCP directory
cd ~/commander_one_mcp

# 2. Copy the files from this folder
cp -r /path/to/commander_one_mcp/* .

# 3. Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Verify syntax
python -m py_compile server.py && echo "OK"

# 6. Test run
python server.py
```

## Claude Code Configuration

Add to your `~/.claude/claude_code_config.json`:

```json
{
  "mcpServers": {
    "commander-one": {
      "command": "/Users/rob/commander_one_mcp/.venv/bin/python",
      "args": ["/Users/rob/commander_one_mcp/server.py"],
      "env": {}
    }
  }
}
```

## Claude Desktop Configuration

Add to `~/Library/Application Support/Claude/claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "commander-one": {
      "command": "/Users/rob/commander_one_mcp/.venv/bin/python",
      "args": ["/Users/rob/commander_one_mcp/server.py"]
    }
  }
}
```

## Available Tools (26 total)

### Dual-Pane Navigation
- `co1_pane_state` — Manage left/right pane paths, swap, set active

### File Operations
- `co1_list_directory` — List with item numbers for voice commands
- `co1_read_file` — Read text files with line range support
- `co1_file_viewer` — F3 viewer: text, hex, binary, image info
- `co1_write_file` — Create/write files
- `co1_copy` — Copy files/dirs (F5), supports #N item refs
- `co1_move` — Move/rename, supports #N item refs
- `co1_delete` — Delete with dry-run safety, secure delete option
- `co1_batch_rename` — Wildcards, regex, sequence numbering
- `co1_permissions` — chmod/chown with recursive option
- `co1_file_info` — Cmd+I metadata including xattr

### Search
- `co1_search` — 4 modes: filename, content, regex, Spotlight (mdfind)

### Navigation & Views
- `co1_tree` — ASCII directory tree
- `co1_disk_usage` — Volume stats + top space consumers
- `co1_mounted_volumes` — All volumes and network shares
- `co1_favorites` — Add/remove/list bookmarks

### Archives
- `co1_archive_create` — ZIP, tar.gz, tar.bz2, 7z (with password)
- `co1_archive_extract` — ZIP, tar, RAR, 7z (with password)
- `co1_archive_browse` — Browse archive contents without extracting

### System
- `co1_terminal` — Execute shell commands (Ctrl+O)
- `co1_process_list` — Process viewer with filter/sort
- `co1_process_kill` — Kill by PID (SIGTERM or SIGKILL)
- `co1_system_info` — OS, chip, memory, disk stats

### Utility
- `co1_hash_file` — md5, sha1, sha256, sha512
- `co1_find_duplicates` — SHA-256 duplicate detection
- `co1_compare` — File and directory comparison

### Voice Commands
- `co1_item_action` — Act on items by number: "item 3 open", "copy item 5"

## Item Number Voice Command System

Every `co1_list_directory` call assigns sequential item numbers (#1, #2, ...).
These persist until the next listing and can be referenced in commands:

- "Open item 3" → `co1_item_action(item_number=3, action="open")`
- "Copy item 5" → `co1_item_action(item_number=5, action="copy")`
- "Delete item 7" → `co1_item_action(item_number=7, action="delete")` (dry-run)
- "View item 2" → `co1_item_action(item_number=2, action="view")`
- "Info on item 1" → `co1_item_action(item_number=1, action="info")`

Copy/move without destination defaults to the other pane (dual-pane behavior).

## Safety Features

- System root paths blocked from destructive operations
- Delete defaults to dry_run=True (preview mode)
- Secure delete option overwrites file data before unlinking
- Item references validated against registry
- 10MB file read limit with line-range support for larger files
