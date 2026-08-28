```
  ██████╗ ██████╗ ███╗   ██╗████████╗██╗███╗   ██╗██╗   ██╗███████╗
 ██╔════╝██╔═══██╗████╗  ██║╚══██╔══╝██║████╗  ██║██║   ██║██╔════╝
 ██║     ██║   ██║██╔██╗ ██║   ██║   ██║██╔██╗ ██║██║   ██║█████╗
 ██║     ██║   ██║██║╚██╗██║   ██║   ██║██║╚██╗██║██║   ██║██╔══╝
 ╚██████╗╚██████╔╝██║ ╚████║   ██║   ██║██║ ╚████║╚██████╔╝███████╗
  ╚═════╝ ╚═════╝ ╚═╝  ╚═══╝   ╚═╝   ╚═╝╚═╝  ╚═══╝ ╚═════╝ ╚══════╝
```

# Continue configuration export

This archive contains your Continue configurations for your personal workspace `rob-plowman-1`.

## What is included

- **`agents/`** — Self-contained agent YAMLs with all dependencies inlined. No Hub connection needed.
- **`blocks/`** — Standalone block files (models, rules, context, MCP servers, etc.) for reference or manual use.

## Quick start

Copy the `agents/` folder into `~/.continue/agents/` and they will be picked up by the extensions.

**macOS / Linux**
```sh
mkdir -p ~/.continue
cp -r agents ~/.continue/agents
```

**Windows (PowerShell)**
```powershell
New-Item -ItemType Directory -Force -Path $env:USERPROFILE\.continue
Copy-Item -Recurse agents $env:USERPROFILE\.continue\agents
```

## Using block files

The `blocks/` folder contains standalone versions of each block (models, rules, context providers, etc.) for reference. You can:

- Reference them with `file://` syntax in your YAML configs (e.g., `file://./path/to/block.yaml`)
- Copy them into `~/.continue/{type}/` to make them available globally

> **Warning:** If you copy blocks into `~/.continue/{type}/`, be careful about duplicates — the same definitions are already inlined in the agent YAMLs.

## Customizing locally

Learn more here - https://docs.continue.dev/customize/overview
