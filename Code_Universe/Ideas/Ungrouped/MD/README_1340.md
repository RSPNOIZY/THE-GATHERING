# Lucy FOSS MCP

Local stdio MCP server for Lucy to control existing macOS/FOSS tools safely.

## What this build includes

- Exact MCP JSON: `mcp.lucy-foss.json`
- Minimal server implementation: `server.py`
- Safe command allowlist: `allowlist.json`
- Detected local tools/apps summary: `detected-tools.json`
- Smoke test: `test_server.py`
- Claude Code install helper: `claude-code-add-command.sh`

## Detected platform

- OS: macOS 15.7.8
- Architecture: Apple Silicon arm64
- Host: GABRIEL.local
- Workspace: `/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive`

## Detected FOSS-friendly tools

- Search/list: `rg`, `fd`, `bat`, `eza`
- Media: `ffmpeg`, ImageMagick `magick`, `identify`
- Data: `sqlite3`, `jq`, `meilisearch`
- System/dev: `git`, `docker`, `ollama`
- Runtime: Python 3, Node, npm, uv/uvx

## Install in Claude Code

From any terminal:

```bash
bash "/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/output/lucy-foss-mcp/claude-code-add-command.sh"
```

Or paste the content of `mcp.lucy-foss.json` into the MCP config for the client you use.

## Install in Claude Desktop

Add the server object from `mcp.lucy-foss.json` to:

```text
~/Library/Application Support/Claude/claude_desktop_config.json
```

Then restart Claude Desktop.

## Tools exposed to Lucy

- `inventory`: detect apps and CLI tools.
- `list_directory`: list files under the configured workspace.
- `search_files`: find filenames with `fd`.
- `search_text`: search file contents with `rg`.
- `organize_preview`: group files by extension without moving them.
- `media_probe`: inspect image/audio/video metadata.
- `convert_image_to_output`: convert images only into the output folder.
- `system_status`: read uptime, disk, memory, Docker, and Ollama status.
- `run_allowed_command`: run named safe actions like `git_status`, `docker_ps`, and `sqlite_readonly`.

## Rebuild workflow using only current tools

1. Edit `server.py` with BBEdit, VS Code, Codex, Claude, or any text editor.
2. Keep destructive actions out of `run_allowed_command` unless you intentionally add confirmation logic.
3. Run the smoke test:

```bash
/opt/homebrew/bin/python3 "/Users/m2ultra/Library/CloudStorage/GoogleDrive-rspplowman@gmail.com/My Drive/output/lucy-foss-mcp/test_server.py"
```

4. Restart the MCP client.
5. Ask Lucy: `Use lucy-foss inventory` or `Use lucy-foss system_status`.

## Safety model

- No arbitrary shell tool is exposed.
- Paths are restricted to the configured workspace and output folder.
- File organization is preview-only.
- Image conversion writes only to the output folder.
- SQLite queries must start with `SELECT`, `PRAGMA`, or `EXPLAIN` and run with `sqlite3 -readonly`.

## Next useful extensions

- Add a real TagSpaces adapter once the local tag storage format is confirmed.
- Add Obsidian vault actions after choosing which vault Lucy should manage.
- Add CalDAV actions once the calendar endpoint and credentials strategy are chosen.
- Add destructive file operations only behind explicit preview and confirmation steps.
