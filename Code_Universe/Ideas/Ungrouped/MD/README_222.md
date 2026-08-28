# NOIZY OpenCode Skeleton

OpenCode configuration, MCP servers, and GitHub live ops for the NOIZY studio system.

---

## Quick start (4 commands)

```bash
cd ~/noizy
make deps            # install npm deps for all apps
make github-install  # ONCE — GitHub App + workflow + secrets (guided)
make start           # launch OpenCode TUI
```

Then on any GitHub issue: `/oc deploy HEAVEN and fix the wrangler.toml`

---

## Repo layout

```text
opencode.json                    ← project config ({env:VAR} headers, permission wildcards)
apps/
  gabriel-mcp/                   ← GABRIEL durable session memory MCP server
    server.mjs                   ←   tools: note, marker, export, recall, status
    package.json
  voice-bridge-local/            ← Voice Bridge Lane 1 (local stdio)
    server.mjs                   ←   tools: analyze, stamp, session_log
    package.json
.github/
  workflows/opencode.yml         ← /oc trigger → anomalyco/opencode/github@latest
  ISSUE_TEMPLATE/opencode_op.md  ← pre-loaded NOIZY constitutional context
Makefile                         ← session control + ops shortcuts
.env.example                     ← all tokens, CF account, vault paths
```

---

## MCP server map

| Server                       | Lane            | Enabled by default | Tools                                                                                  |
| ---------------------------- | --------------- | ------------------ | -------------------------------------------------------------------------------------- |
| `noizy-voice-bridge-local`   | Local stdio     | ✅                 | `voice_analyze`, `voice_stamp`, `voice_session_log`                                    |
| `noizy-voice-bridge-http`    | Local HTTP      | ❌                 | same                                                                                   |
| `noizy-voice-mcp-cloudflare` | Cloudflare edge | ❌                 | same                                                                                   |
| `noizy-gabriel`              | Local stdio     | ✅                 | `gabriel_note`, `gabriel_marker`, `gabriel_export`, `gabriel_recall`, `gabriel_status` |

Toggle `enabled` in `opencode.json` to switch lanes — never remove an entry.

---

## DreamChamber Session Recovery Protocol

Use this ladder after a session drift, disconnect, or tool failure.

| Step                  | Situation                                            | Command                                    |
| --------------------- | ---------------------------------------------------- | ------------------------------------------ |
| **0 — Discover**      | Find recent session IDs                              | `make session-list`                        |
| **1 — Soft reattach** | Backend still running, TUI dropped                   | `make attach`                              |
| **2 — Continue**      | Last session intact, fast resume                     | `make continue`                            |
| **3 — Fork**          | State suspect, preserve context, isolate new actions | `make fork`                                |
| **4 — Fork by ID**    | Resume a specific known-good session                 | `make fork-session ID=<id>`                |
| **5 — MCP lane swap** | Remote MCP endpoint flaky                            | Flip `enabled` in `opencode.json`, restart |
| **6 — Full restart**  | Nothing else works                                   | `make start` (fresh session)               |

---

## Tool permissions (opencode.json)

```jsonc
"permission": {
  "noizy-gabriel_*": "allow",        // disk writes, pre-approved
  "noizy-voice-bridge-*": "ask"      // side-effects, operator confirms
}
```

---

## GitHub live ops

After `make github-install`:

```text
/oc deploy HEAVEN and fix the wrangler.toml
/oc refactor KnowledgeForge.swift — extract a protocol, keep SacredInvariants untouched
/oc run noizy-check.sh and post results as a PR comment
```

The agent opens a PR with changes and posts status back to the issue.

---

## Key Makefile targets

```text
make start               fresh OpenCode session
make continue            --continue (last session)
make fork                --continue --fork (isolate new actions)
make session ID=<id>     resume by session ID
make attach              TUI → running backend
make session-list        operator discovery of recent sessions
make deps                npm install for all apps
make gabriel-install     npm install in apps/gabriel-mcp
make voice-install       npm install in apps/voice-bridge-local
make gabriel-test        stdio ping of GABRIEL MCP server
make github-install      guided GitHub App + workflow + secrets setup
make logs ID=<id>        tail GABRIEL notes live
make markers ID=<id>     tail GABRIEL markers live
```
