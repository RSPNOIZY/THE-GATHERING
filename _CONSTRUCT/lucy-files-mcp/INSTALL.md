# lucy-files-mcp  ·  Install Guide

A file management MCP server for the Lucy ecosystem.
Operates on macOS · Claude Desktop (Cowork).

---

## 1. Dependencies (already installed)

```
npm install
```
This installs `@modelcontextprotocol/sdk`. Node ≥ 18 required.

---

## 2. Configure your folders

Open `lucy-files-config.json` and add every folder you want the server to manage:

```json
{
  "allowedRoots": [
    "/Users/m2ultra/Music",
    "/Users/m2ultra/Documents/Projects",
    "/Users/m2ultra/Desktop"
  ],
  "tagspacesMetaDir": ".ts",
  "defaultHashAlgorithm": "md5"
}
```

**Operations outside these paths are blocked.** Add any folder freely — the list is your security boundary.

---

## 3. Add to Claude Desktop

Edit `~/Library/Application Support/Claude/claude_desktop_config.json`
and add this entry inside `"mcpServers"`:

```json
{
  "mcpServers": {
    "lucy-files": {
      "command": "node",
      "args": ["/Users/m2ultra/lucy-files-mcp/index.js"]
    }
  }
}
```

If the file doesn't exist yet, create it with exactly this structure:

```json
{
  "mcpServers": {
    "lucy-files": {
      "command": "node",
      "args": ["/Users/m2ultra/lucy-files-mcp/index.js"]
    }
  }
}
```

---

## 4. Restart Claude Desktop

Quit and reopen Claude Desktop (Cowork). The server registers on startup.
You should see the tools listed when you ask Claude to list available MCP tools.

---

## Available tools

| Tool | What it does |
|---|---|
| `scan_folder` | Inventory a folder — categories, sizes, tag status |
| `find_duplicates` | Detect exact duplicates by content hash across 1+ folders |
| `preview_rename` | Regex-based filename normalisation — preview before applying |
| `preview_reorganize` | Move files into sub-folders by category/extension — preview first |
| `apply_tags` | Write TagSpaces tags to files (via tscmd or direct sidecar) |
| `execute_plan` | Execute a previewed plan (requires planId + confirmationToken) |
| `repair_metadata` | Find orphaned `.ts/*.json` sidecars and produce a delete plan |
| `generate_index` | Write a `lucy-index.json` manifest for any folder |

---

## Safe rebuild workflow

```
1. scan_folder          → understand what you have
2. find_duplicates      → identify waste
3. apply_tags           → classify everything
4. preview_reorganize   → design the new structure
5. execute_plan         → apply it (confirm with the token)
6. preview_rename       → normalise filenames after the move
7. execute_plan         → apply the rename
8. repair_metadata      → clean up orphaned sidecars
9. generate_index       → capture the final state
```

---

## TagSpaces integration

- If `tscmd` is installed and on PATH, `apply_tags` uses it automatically.
- Otherwise it writes `.ts/<filename>.json` sidecars directly — fully compatible with TagSpaces.
- On every rename/move, sidecars travel with their files.

---

## Optional: install tscmd

```bash
npm install -g @tagspaces/tscmd
```

Check with: `tscmd --version`
