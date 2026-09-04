# Claude Today Scan

Date: 2026-09-01  
Scope: Local Claude configuration, sessions, project transcripts, security logs, plugin state, and live Claude/MCP process surface.

## Executive Summary

Claude had local activity today, but useful assistant execution appears blocked by billing. The main September 1 transcript contains two attempted turns, both ending in a Claude API `billing_error` with the message `Credit balance is too low`.

The active Claude surface is still important: settings grant broad local tool permissions, many plugins are enabled, multiple MCP processes are live, and Claude has access to sensitive local directories and mounted volumes. This should be treated as a governed action endpoint in the NOIZY fabric.

## Today-Modified Claude Files

Observed under `/Users/m2ultra/.claude`:

- `.last-cleanup`
- `mcp-needs-auth-cache.json`
- `settings.json`
- `plugins/installed_plugins.json`
- `plugins/known_marketplaces.json`
- `policy-limits.json`
- `remote-settings.json`
- `security/log.txt`
- `security/security_warnings_state_03ec83fc-dfaf-44d0-95d0-eab7edbecee3.json`
- `security/security_warnings_state_03ec83fc-dfaf-44d0-95d0-eab7edbecee3.lock`
- `security/agent-sdk-venv/pyvenv.cfg`
- `security/agent-sdk-venv/.gitignore`
- `sessions/99864.json`
- `sessions/99864.8fd142d4d5d9341381b2dbe57c62c218f1e562b4c0c3622358cff356160774b3.key`
- six `ide/*.lock` files
- one project transcript:
  `/Users/m2ultra/.claude/projects/-Users-m2ultra--copilot-copilot-worktrees-serena-noizygit-master-psychic-broccoli/03ec83fc-dfaf-44d0-95d0-eab7edbecee3.jsonl`

The directory named `CLAUDE-TODAY` exists, but its transcript was last modified on 2026-08-02, not today.

## Active September 1 Transcript

Session ID: `03ec83fc-dfaf-44d0-95d0-eab7edbecee3`  
Entrypoint: `claude-vscode`  
Claude version: `2.1.233`  
Working directory: `/Users/m2ultra/.copilot/copilot-worktrees/serena/noizygit-master-psychic-broccoli`

Transcript record counts:

- queue operations: 4
- attachments: 8
- user messages: 2
- assistant messages: 2
- file-history snapshots: 2
- last-prompt record: 1

Timeline:

- `2026-09-01T05:02:37Z`: Session startup hooks ran.
- `2026-09-01T05:02:54Z`: User prompt: GitHub Copilot setup/sign-in needed.
- `2026-09-01T05:02:56Z`: Assistant response failed with `billing_error`, HTTP 400.
- `2026-09-01T05:58:55Z`: User prompt: large "Brain Food" compilation for NOIZY APEX, Mistral, vector databases, audio DSP, and autonomous workflows.
- `2026-09-01T05:58:57Z`: Assistant response failed with `billing_error`, HTTP 400.

No successful assistant work was observed in this transcript after the user prompts.

## Enabled Claude Plugins

Enabled plugins from `settings.json`:

- `agent-sdk-dev@claude-plugins-official`
- `claude-code-setup@claude-plugins-official`
- `claude-md-management@claude-plugins-official`
- `code-review@claude-plugins-official`
- `code-simplifier@claude-plugins-official`
- `commit-commands@claude-plugins-official`
- `explanatory-output-style@claude-plugins-official`
- `feature-dev@claude-plugins-official`
- `firebase@firebase`
- `frontend-design@claude-plugins-official`
- `gitkraken-hooks@gitkraken`
- `hookify@claude-plugins-official`
- `learning-output-style@claude-plugins-official`
- `mcp-server-dev@claude-plugins-official`
- `playground@claude-plugins-official`
- `plugin-dev@claude-plugins-official`
- `pr-review-toolkit@claude-plugins-official`
- `pyright-lsp@claude-plugins-official`
- `ralph-loop@claude-plugins-official`
- `rust-analyzer-lsp@claude-plugins-official`
- `security-guidance@claude-plugins-official`
- `session-report@claude-plugins-official`
- `skill-creator@claude-plugins-official`
- `swift-lsp@claude-plugins-official`
- `typescript-lsp@claude-plugins-official`

## Permission Posture

Key settings:

- `defaultMode`: `auto`
- `skipAutoPermissionPrompt`: `true`
- `skipDangerousModePermissionPrompt`: `true`
- `agentPushNotifEnabled`: `true`
- `inputNeededNotifEnabled`: `true`

The allowlist includes broad local reads, shell commands, development CLIs, cloud CLIs, package managers, Docker, Terraform, GitHub CLI, web search/fetch, mounted volume reads, and several MCP tools.

Sensitive or high-impact allowed surfaces include:

- `Read(*)`
- `Read(//Users/m2ultra/**)`
- `Read(//Volumes/**)`
- `Read(//tmp/**)`
- `Bash(python3:*)`
- `Bash(node:*)`
- `Bash(npm:*)`
- `Bash(docker:*)`
- `Bash(terraform:*)`
- `Bash(brew:*)`
- `Bash(curl:*)`
- `Bash(gh:*)`
- `Bash(wrangler:*)`
- `Bash(gcloud:*)`
- `Bash(az login:*)`
- `Bash(/usr/bin/security dump-keychain *)`
- `Bash(/usr/bin/security find-generic-password *)`

Policy limits currently block:

- remote control
- routines
- quick web setup
- cobalt plinth
- web search MCP isolation override

## Live Claude/MCP Surface

Focused process scan found an active Claude binary:

- PID `99864`
- binary path: VS Code Insiders Anthropic extension native binary
- mode: stream JSON, verbose, debug enabled
- entrypoint: `claude-vscode`

Live MCP-related processes included GitKraken MCP, Firebase MCP, Sequential Thinking MCP, GitHub MCP, Azure MCP, Chrome DevTools MCP, Chroma MCP, Desktop Commander, Playwright MCP, Firecrawl MCP, Supabase MCP, Sentry MCP, MongoDB MCP, Notion MCP, Terraform MCP, MarkItDown MCP, and NOIZY/GABRIEL MCP services.

The process table included environment-variable names for some sensitive tokens, but this report intentionally does not copy token values or session key contents.

## Governance Findings

1. Claude is an action endpoint, not just a chat surface.
2. Claude can see sensitive local directories and mounted volumes.
3. Claude has broad command permissions and dangerous prompt-skipping enabled.
4. Today’s actual Claude assistant work failed due to low credit balance.
5. The active session is tied to the Serena worktree and should be associated with the Serena hang/debugging trail.
6. The `CLAUDE-TODAY` project name is misleading for September 1 analysis because its transcript is from August 2.

## Recommended Immediate Controls

1. Add a Claude endpoint passport to the governance fabric.
2. Require receipts for Claude-initiated writes, deletes, cloud operations, and MCP mutations.
3. Move keychain/security commands behind explicit founder approval.
4. Consider disabling `skipDangerousModePermissionPrompt`.
5. Treat mounted volume reads as governed archive access.
6. Quarantine failed Claude sessions when billing errors prevent successful assistant execution.
7. Keep session key files out of reports and inventories.

## Open Questions

- Which Claude-enabled MCP processes belong to Claude, Copilot, Codex, Antigravity, Windsurf, or other hosts?
- Which directories should remain in Claude `additionalDirectories`?
- Should Claude retain access to `/Volumes/**` by default?
- Should cloud CLIs remain broadly allowed under auto mode?
- Should `CLAUDE-TODAY` be archived or renamed since it does not represent current-day activity?
