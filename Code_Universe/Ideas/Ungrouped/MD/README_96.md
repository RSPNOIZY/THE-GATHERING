# NOIZYBEAST VS Code Extension
**Works in: VS Code · VS Code Insiders · Windsurf · Cursor**

## Fix npm cache first (one-time)
```bash
sudo chown -R $(whoami) ~/.npm
```

## Build & Package
```bash
cd ~/NOIZYLAB/noizybeast/vscode-extension
npm install
npm run compile   # TypeScript → out/
npx vsce package --no-dependencies --allow-missing-repository
# → generates: noizybeast-1.0.0.vsix
```

## Install in Each IDE

**VS Code / VS Code Insiders:**
```bash
code --install-extension noizybeast-1.0.0.vsix
code-insiders --install-extension noizybeast-1.0.0.vsix
```

**Cursor:**
```bash
cursor --install-extension noizybeast-1.0.0.vsix
# Or: Cursor → Extensions → ⋯ → Install from VSIX
```

**Windsurf:**
```
Windsurf → Extensions → ⋯ → Install from VSIX → select noizybeast-1.0.0.vsix
```

## What's Installed

### Status Bar (always visible)
| Item | Position | Action |
|------|----------|--------|
| `✓ GABRIEL V4` | Bottom-left | Ping GABRIEL :7777 |
| `21d 4h → Apr 17` | Bottom-left | Open Empire Panel |
| `🗄 T4` | Bottom-right | Cell Burst → memcells |
| `🌙 T10` | Bottom-right | Dream Capture |
| `⚡ NOIZY` | Bottom-right | Open Empire Panel |

### Command Palette (`Cmd+Shift+P` → type "NOIZY")
All 16 commands available — T1 through T10, consent snap, status, deploy...

### Keyboard Shortcuts
| Mac | Win/Linux | Command |
|-----|-----------|---------|
| `⌘⇧⌥N` | `Ctrl+Shift+Alt+N` | Open Empire Panel |
| `⌘⇧⌥2` | `Ctrl+Shift+Alt+2` | T2 Flow Sync |
| `⌘⇧⌥3` | `Ctrl+Shift+Alt+3` | T3 Deploy Cannon |
| `⌘⇧⌥4` | `Ctrl+Shift+Alt+4` | T4 Cell Burst |
| `⌘⇧⌥5` | `Ctrl+Shift+Alt+5` | T5 Consent Snap |
| `⌘⇧⌥0` | `Ctrl+Shift+Alt+0` | T10 Dream Capture |
| `⌘⇧⌥9` | `Ctrl+Shift+Alt+9` | T9 Fix Canon |

### Activity Bar
NOIZYBEAST icon → three sidebar panels:
- **Empire Status** — live webview with turbo buttons + system status
- **Turbo Scripts** — click-to-run T1-T10 tree
- **Standing Orders** — live TODO board with urgency levels

### Right-Click Menus
**Editor:** Consent Snap · Cell Burst · Scaffold  
**Explorer:** Deploy Cannon · Fix Canon

### Code Snippets (TypeScript + JavaScript)
| Prefix | Inserts |
|--------|---------|
| `noizy-worker` | Hono CF Worker boilerplate |
| `noizy-consent` | Inline consent check |
| `noizy-mutlog` | Mutation codex log call |
| `noizy-mcp` | MCP Server scaffold |

### Settings (`Cmd+,` → search NOIZYBEAST)
- `gabrielUrl` — GABRIEL V4 endpoint (default: localhost:7777)
- `cfAccount` — CF Account ID (pre-filled: 2446d788…)
- `operator` — RSP_001
- `noizyLabPath` — path to ~/NOIZYLAB
- `autoFlowSync` — run T2 on startup (default: true)

## Architecture
The extension tries GABRIEL API first for every turbo command.  
If GABRIEL is offline, falls back to running the local CLI directly:  
`node ~/NOIZYLAB/noizybeast/turbo-scripts/noizybeast-turbo.js T# [arg]`

This means it works even when the DreamChamber server isn't running.

## Extension Files
```
vscode-extension/
  package.json          ← manifest: commands, keybindings, views, config
  tsconfig.json         ← TS compilation config
  .vscodeignore         ← package exclusions
  src/
    extension.ts        ← main: activation, 16 commands, GABRIEL routing
    statusBar.ts        ← 5 status bar items + live health check
    empirePanel.ts      ← webview: turbo buttons, sys status, orders
    turboProvider.ts    ← T1-T10 sidebar tree
    ordersProvider.ts   ← Standing orders tree with urgency
  out/                  ← compiled JS (git-ignored)
  snippets/
    noizy-ts.json       ← TS/JS snippets
  resources/
    icon-mono.svg       ← activity bar icon
```
