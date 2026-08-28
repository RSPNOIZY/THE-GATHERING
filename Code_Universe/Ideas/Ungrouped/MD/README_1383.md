# Model Context Protocol (MCP) Master Repository
**Central Repository for System Agent Integration — RSP_001 Assistive Stack**

This repository consolidates all custom Model Context Protocol (MCP) servers used by **Gabriel**, **Lucy**, and other local AI agents to automate files, audio tools, search engines, database queries, and GUI applications across your Mac studio workspace.

---

## 📂 MCP Servers Directory

### 🖥️ System & Application Control
- **[`mac-apps-mcp`](./mac-apps-mcp)**: Exposed tools to list, launch, focus, quit, and automate any macOS application via a universal **JXA (JavaScript for Automation)** and **AppleScript** engine. Perfect for controlling Logic Pro, DEVONagent, and LM Studio.
- **[`DesktopCommanderMCP`](./DesktopCommanderMCP)**: Comprehensive terminal execution, process monitoring, file editing, and advanced Spotlight/Ripgrep file searching.
- **[`shortcuts-mcp`](./shortcuts-mcp)**: Connects agents directly to macOS Shortcuts, allowing execution by name and piping text inputs.

### 🧠 Knowledge & Organization
- **[`devonthink-mcp`](./devonthink-mcp)**: Full integration with **DEVONthink 3** for searching open databases, fetching records by UUID, creating new markdown files, applying tags, and utilizing DEVONthink's semantic 'See Also' search.
- **[`tagspaces-mcp`](./tagspaces-mcp)**: Scans, tags, and manages location-level perspectives and sidecar indexes using the TagSpaces `.ts` metadata format.
- **[`obsidian-mcp`](./obsidian-mcp)**: Search and query your local Obsidian vaults and notes.

### 🤖 Agent Orchestration (NOIZY Core)
- **[`gabriel-mcp`](./gabriel-mcp)**: Always-on orchestration daemon providing memory caching, active monitoring, and strategic decisions.
- **[`lucy-mcp`](./lucy-mcp)**: Intake pipeline dispatcher, consensus-weighted synthesis of multiple model responses, task logger, and DAZEFLOW keeper.
- **[`heaven-mcp`](./heaven-mcp)**: Interface with the global HEAVEN consent kernel worker to check Never Clauses, agreements, and split ratios.
- **[`lmstudio-mcp`](./lmstudio-mcp)**: Local AI Model Server Bridge for chatting, Switch Model, embeddings, and Qwen classification.

---

## ⚙️ Configuration & Installation

### 1. Register Servers
To activate these servers for your AI agents, copy the configurations from [`mcp_config.template.json`](./mcp_config.template.json) into your global config files:
- **Claude Code/Desktop:** `/Users/m2ultra/.gemini/antigravity-ide/mcp_config.json`
- **Workspace-specific:** `/Users/m2ultra/NOIZYANTHROPIC/.mcp.json`

### 2. Environment Activation
Python-based servers (like `devonthink-mcp` and `tagspaces-mcp`) must be run using the designated python virtual environment:
```bash
/Users/m2ultra/NOIZYANTHROPIC/mc96_venv/bin/python <server_file.py>
```

---

## 🛠️ Management CLI (`mcp-manage.sh`)
Run `./mcp-manage.sh` in this folder to:
- List all local servers.
- Verify node/python source file integrity.
- Run quick diagnostic checks.
