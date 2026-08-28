# Claude Agent SDK — Canonical Reference (NOIZY edition)

**Captured:** 2026-04-20 from <https://code.claude.com/docs> (index at `/docs/llms.txt`).
**Scope:** Single-file reference for building any Claude-powered agent inside the NOIZY Empire using `@anthropic-ai/claude-agent-sdk`.
**Companion:** [`AGENT_SDK_CUSTOM_TOOLS.md`](./AGENT_SDK_CUSTOM_TOOLS.md) covers the custom-tool authoring patterns in full detail.
**NOIZY doctrine it inherits:** `.claude/rules/*` (consent kernel, coding standards, hooks, mcp-builder, identity, contact).

> Always verify upstream before writing code: docs evolve. This file is a snapshot. If a detail disagrees with upstream, upstream wins — update this file.

---

## 0 · Topic index

1. [MCP Integration](#1--mcp-integration) — connect external tools over stdio, HTTP, or SSE
2. [Tool Search](#2--tool-search) — scale to thousands of tools without bloating context
3. [Subagents](#3--subagents) — delegate focused subtasks in isolated contexts
4. [Hosting](#4--hosting) — run the SDK in production (containers, patterns, providers)
5. [Secure Deployment](#5--secure-deployment) — isolation, credentials, network controls
6. [Behavior Customization](#6--behavior-customization) — system prompts, slash commands, skills, plugins
7. [TypeScript SDK Reference](#7--typescript-sdk-reference-abbreviated) — key exports and the `Options` shape
8. [NOIZY Integration Playbook](#8--noizy-integration-playbook) — how to wire each of the above into GABRIEL, HEAVEN, LUCY, DreamChamber

---

## 1 · MCP Integration

**Source:** `/docs/en/agent-sdk/mcp`

MCP servers can run as local processes, connect over HTTP, or execute directly inside the SDK application. Three transport types:

| Transport            | When                                                                 | Config shape                                   |
| -------------------- | -------------------------------------------------------------------- | ---------------------------------------------- |
| **stdio**            | Local processes — run `npx`, `node`, or `python` on the same machine | `{ command, args, env }`                       |
| **HTTP / SSE**       | Cloud-hosted or remote MCP servers                                   | `{ type: "http" \| "sse", url, headers? }`     |
| **SDK (in-process)** | Tools defined in your code                                           | `createSdkMcpServer` / `create_sdk_mcp_server` |

### Quick reference — passing MCP servers to `query()`

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Use the docs MCP server to explain what hooks are in Claude Code",
  options: {
    mcpServers: {
      "claude-code-docs": { type: "http", url: "https://code.claude.com/docs/mcp" },
      filesystem: {
        command: "npx",
        args: ["-y", "@modelcontextprotocol/server-filesystem", "/Users/me/projects"],
      },
    },
    allowedTools: ["mcp__claude-code-docs__*", "mcp__filesystem__*"],
  },
})) {
  if (message.type === "result" && message.subtype === "success") console.log(message.result);
}
```

### Naming rule

Tool surface name = `mcp__<server_name>__<tool_name>`. Wildcard `mcp__<server>__*` pre-approves every tool from one server.

### Config file (`.mcp.json`)

Loaded when `settingSources` includes `"project"`:

```json
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_TOKEN": "${GITHUB_TOKEN}" }
    }
  }
}
```

`${VAR}` expands from process env at runtime.

### Auth patterns

- **stdio:** `env` field injects per-server variables.
- **HTTP / SSE:** `headers` field carries `Authorization: Bearer ...`.
- **OAuth 2.1:** SDK does not drive the flow; complete in your app, then pass the access token via headers.

### Troubleshooting

- Check `SystemMessage` with `subtype: "init"` for `mcp_servers` status. Any entry whose `status !== "connected"` failed.
- Default connection timeout is 60 s.
- Tools present but never called? The `Agent` tool must be in `allowedTools` for subagents, and the MCP tool itself must be in `allowedTools` (or covered by wildcard).

---

## 2 · Tool Search

**Source:** `/docs/en/agent-sdk/tool-search`

Tool definitions are expensive. 50 tools can consume 10–20K tokens. Claude's tool-selection accuracy also degrades beyond 30–50 tools in context.

**Default:** tool search is ON. Tool definitions withheld from context; Claude searches the catalog and loads 3–5 most relevant defs on demand.

### `ENABLE_TOOL_SEARCH` env var

| Value          | Behavior                                                              |
| -------------- | --------------------------------------------------------------------- |
| unset / `true` | Always on                                                             |
| `auto`         | Activates when total tool-def tokens exceed 10% of the context window |
| `auto:N`       | Same as `auto` with custom percent (`auto:5` = 5%)                    |
| `false`        | Off — all tool defs in context every turn                             |

### Set in `query()` options

```typescript
options: {
  mcpServers: { "enterprise-tools": { type: "http", url: "https://tools.example.com/mcp" } },
  allowedTools: ["mcp__enterprise-tools__*"],
  env: { ENABLE_TOOL_SEARCH: "auto:5" },
}
```

### Limits

- Model support: Sonnet 4+ or Opus 4+. **Haiku does not support tool search.**
- Max catalog size: 10,000 tools.
- Returns 3–5 results per search.

### Optimization

Good tool **names and descriptions** drive better search hits:

- `search_slack_messages` > `query_slack`.
- "Search Slack messages by keyword, channel, or date range" > "Query Slack".
- Optionally add a line to the system prompt: _"You can search for tools to interact with Slack, GitHub, and Jira."_

---

## 3 · Subagents

**Source:** `/docs/en/agent-sdk/subagents`

Separate agent instances the main agent can spawn for focused subtasks. Each runs in its own fresh conversation.

### Benefits

| Benefit                      | Use case                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------- |
| **Context isolation**        | A `research-assistant` explores dozens of files; only its final summary returns to the parent. |
| **Parallelization**          | Run `style-checker`, `security-scanner`, `test-coverage` concurrently during code review.      |
| **Specialized instructions** | `database-migration` agent has SQL best practices in its prompt without bloating main agent.   |
| **Tool restrictions**        | `doc-reviewer` limited to `Read`/`Grep` only — can analyze, cannot modify.                     |

### Programmatic definition (preferred for SDK apps)

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";

for await (const message of query({
  prompt: "Review the authentication module for security issues",
  options: {
    allowedTools: ["Read", "Grep", "Glob", "Agent"], // Agent tool required to invoke subagents
    agents: {
      "code-reviewer": {
        description: "Expert code review specialist. Use for quality, security, maintainability.",
        prompt:
          "You are a code review specialist... Identify vulnerabilities, check performance, verify standards.",
        tools: ["Read", "Grep", "Glob"], // read-only
        model: "sonnet",
      },
      "test-runner": {
        description: "Runs and analyzes test suites. Use for test execution and coverage.",
        prompt: "Focus on running tests, analyzing output, identifying failures.",
        tools: ["Bash", "Read", "Grep"],
      },
    },
  },
})) {
  if ("result" in message) console.log(message.result);
}
```

### `AgentDefinition` fields

| Field         | Type                                         | Req | Notes                                                  |
| ------------- | -------------------------------------------- | --- | ------------------------------------------------------ |
| `description` | string                                       | ✓   | Natural-language "when to use" — Claude routes on this |
| `prompt`      | string                                       | ✓   | Agent's system prompt                                  |
| `tools`       | `string[]`                                   | —   | Omit to inherit all                                    |
| `model`       | `'sonnet' \| 'opus' \| 'haiku' \| 'inherit'` | —   | Defaults to main                                       |
| `skills`      | `string[]`                                   | —   | Skill names available to this agent                    |
| `memory`      | `'user' \| 'project' \| 'local'`             | —   | Python only                                            |
| `mcpServers`  | `(string \| object)[]`                       | —   | MCP servers available to this agent                    |

**Subagents cannot spawn subagents.** Don't include `Agent` in a subagent's own `tools` array.

### What subagents inherit (the channel is narrow)

| Receive                                               | Do NOT receive                                   |
| ----------------------------------------------------- | ------------------------------------------------ |
| Own `prompt` + the Agent-tool prompt string           | Parent conversation history or tool results      |
| Project `CLAUDE.md` (via `settingSources`)            | Skills unless listed in `AgentDefinition.skills` |
| Tool definitions (full set, or the subset in `tools`) | Parent's system prompt                           |

Pass everything the subagent needs (file paths, errors, decisions) **inside the Agent tool's prompt string**.

### Filesystem-based definition (`.claude/agents/*.md`)

Alternative to programmatic. Loaded at startup only — restart the session after adding a file. Programmatic agents take precedence over same-named filesystem agents.

### Invoking

- **Automatic:** Claude matches on `description`. Write clear descriptions.
- **Explicit:** mention by name — _"Use the code-reviewer agent to..."_.

### Detecting invocation

- Subagent is called via the **Agent** tool (was `Task` before Claude Code v2.1.63; check both names for compat).
- Messages emitted inside a subagent's run carry `parent_tool_use_id`.

### Resuming

- Capture `session_id` from `ResultMessage`.
- Parse `agentId:` from Agent-tool-result content (stringify and regex).
- Call `query({ ..., options: { resume: sessionId, agents: { ... } } })` and mention the agent ID in the prompt.

### Common tool combos

| Use                | Tools                                   |
| ------------------ | --------------------------------------- |
| Read-only analysis | `Read`, `Grep`, `Glob`                  |
| Test execution     | `Bash`, `Read`, `Grep`                  |
| Code modification  | `Read`, `Edit`, `Write`, `Grep`, `Glob` |
| Full access        | Omit `tools` field                      |

---

## 4 · Hosting

**Source:** `/docs/en/agent-sdk/hosting`

The SDK is a **long-running process** that maintains conversation state, executes commands in a persistent shell, and handles file ops with prior-turn context. It is not a stateless API.

### System requirements per SDK instance

- Python 3.10+ **or** Node.js 18+ (SDK bundles the Claude Code native binary — no separate install).
- 1 GiB RAM · 5 GiB disk · 1 CPU (scale per workload).
- Outbound HTTPS to `api.anthropic.com`.
- Optional: MCP / tool endpoints.

### Four production patterns

| Pattern                           | Best for                                                    | NOIZY example                                                  |
| --------------------------------- | ----------------------------------------------------------- | -------------------------------------------------------------- |
| **Ephemeral sessions**            | One-off tasks; spin up → complete → destroy                 | Consent-audit runs, DMCA notice generation, invoice processing |
| **Long-running sessions**         | Proactive agents, high-frequency chat                       | GABRIEL daemon, email triage agent, NOIZYARMY soldiers         |
| **Hybrid sessions**               | Intermittent work that resumes from DB/session state        | Deep-research agents, support tickets spanning days            |
| **Single container, many agents** | Close-collaborating agents that must share filesystem/state | DreamChamber multi-agent simulations                           |

### Provider options (sandboxed containers)

Modal Sandbox · Cloudflare Sandboxes · Daytona · E2B · Fly Machines · Vercel Sandbox.
Self-host alternatives: Docker · gVisor · Firecracker (covered in Secure Deployment).

### FAQ highlights

- **Session timeout:** agent sessions do NOT time out — set `maxTurns` in `Options` to prevent loops.
- **Cost:** tokens dominate; containers ~5¢/hr idle.
- **Idle shutdown:** tune per provider; match typical inter-turn latency.
- **CLI upgrades:** Claude Code CLI is semver — breaking changes versioned.
- **Monitoring:** treat containers as regular servers — same logging infra.

### Communication

Expose HTTP / WebSocket endpoints on the container to clients outside. SDK runs inside.

---

## 5 · Secure Deployment

**Source:** `/docs/en/agent-sdk/secure-deployment`

The SDK generates actions **dynamically**, so content it processes (README files, web pages, user input) can influence behavior — this is **prompt injection**. Claude is trained to resist, but defense-in-depth is good practice.

### Built-in security features

- **Permissions system** — per-tool / per-bash allow / block / prompt rules with glob patterns. See `/en/permissions`.
- **Command parsing** — bash commands are AST-parsed and matched against permission rules. `eval` etc. always require approval.
- **Web search summarization** — search results are summarized, not raw-injected.
- **Sandbox mode** — bash runs in a sandbox restricting filesystem + network. See `/en/sandboxing`.

### Three principles

1. **Security boundaries** — run sensitive resources (API keys) outside the agent's environment; inject via proxy.
2. **Least privilege** — mount only needed dirs (prefer read-only); restrict network; drop Linux capabilities.
3. **Defense in depth** — layer container isolation, network restrictions, filesystem controls, request validation.

### Isolation technologies (ranked by strength)

| Tech                                        | Isolation       | Overhead    | Complexity  |
| ------------------------------------------- | --------------- | ----------- | ----------- |
| Sandbox runtime (bubblewrap / sandbox-exec) | Good            | Very low    | Low         |
| Containers (Docker)                         | Setup dependent | Low         | Medium      |
| gVisor                                      | Excellent       | Medium/high | Medium      |
| VMs (Firecracker / QEMU)                    | Excellent       | High        | Medium/high |

### Sandbox runtime quick start

```bash
npm install @anthropic-ai/sandbox-runtime
# Then create a JSON config with allowed filesystem paths + domain allowlist.
```

Uses OS primitives (`bubblewrap` on Linux, `sandbox-exec` on macOS) — no Docker needed.

**Caveats:** shares host kernel (a kernel CVE could escape); no TLS inspection.

### Hardened Docker one-liner

```bash
docker run \
  --cap-drop ALL \
  --security-opt no-new-privileges \
  --security-opt seccomp=/path/to/seccomp-profile.json \
  --read-only \
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \
  --tmpfs /home/agent:rw,noexec,nosuid,size=500m \
  --network none \
  --memory 2g --cpus 2 --pids-limit 100 \
  --user 1000:1000 \
  -v /path/to/code:/workspace:ro \
  -v /var/run/proxy.sock:/var/run/proxy.sock:ro \
  agent-image
```

With `--network none`, the only egress is the mounted Unix socket to a host-side proxy.

### gVisor (syscall-level isolation)

Runs `runsc` runtime; intercepts syscalls in userspace before they reach host kernel. ~0% CPU-bound overhead, up to 200× slower for heavy open/close I/O. Worth it for multi-tenant / untrusted content.

### Firecracker microVMs

Boots <125 ms, <5 MiB memory overhead. Agent VM has no external network interface — all egress via vsock to host proxy.

### Credential proxy pattern (RECOMMENDED)

Run a proxy outside the agent's boundary. Agent sends requests without credentials; proxy injects them. Benefits:

1. Agent never sees real credentials.
2. Proxy enforces domain allowlist.
3. Proxy logs all requests (audit).
4. Credentials in one place.

**Two proxy config options:**

- `ANTHROPIC_BASE_URL` — route sampling API only; proxy sees plaintext.
- `HTTP_PROXY` / `HTTPS_PROXY` — system-wide; HTTPS is a CONNECT tunnel unless you TLS-terminate (needs CA cert in agent trust store).

Proxy options: Envoy (with `credential_injector` filter), mitmproxy, Squid, LiteLLM.

### Files to **never** mount into an agent

`.env` · `.env.local` · `~/.git-credentials` · `~/.aws/credentials` · `~/.config/gcloud/application_default_credentials.json` · `~/.azure/` · `~/.docker/config.json` · `~/.kube/config` · `.npmrc` · `.pypirc` · `*-service-account.json` · `*.pem` · `*.key`.

### Writable locations

- `tmpfs` for ephemeral workspace (cleared on container stop).
- Overlay FS if you want to review changes before persisting.
- Dedicated volume — separate from sensitive dirs.

---

## 6 · Behavior Customization

**Source:** `/docs/en/agent-sdk/modifying-system-prompts`, `/slash-commands`, `/skills`, `/plugins`

Rob's paste listed these as titles to log. Brief summary; fetch full upstream before implementing.

### 6.1 System prompt modes

`systemPrompt` option accepts three shapes:

| Form                                                                                     | Effect                                                                                            |
| ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| `string`                                                                                 | Custom prompt replaces the default                                                                |
| `{ type: "preset", preset: "claude_code" }`                                              | Uses Claude Code's full prompt                                                                    |
| `{ type: "preset", preset: "claude_code", append: "..." }`                               | Adds to the preset                                                                                |
| `{ type: "preset", preset: "claude_code", append: "...", excludeDynamicSections: true }` | Moves per-session context to first user message — **improves prompt-cache reuse across machines** |

### 6.2 Slash commands (SDK)

Define custom slash commands the SDK recognizes. Full doc: `/docs/en/agent-sdk/slash-commands`. Relevant for surfacing NOIZY-specific workflows like `/consent-audit`, `/heaven-deploy`, `/lucy-standup`.

### 6.3 Agent Skills (SDK)

Progressive-disclosure markdown playbooks (same shape as `.claude/skills/*/SKILL.md`) that load when a matching trigger appears in user input. NOIZY already has 21+ skills; future programmatic loading via the `skills` option on `AgentDefinition`.

### 6.4 Plugins (SDK)

Load custom plugins from local paths via the `plugins: SdkPluginConfig[]` option. Plugin structure mirrors Claude Code plugins (manifest + components). Useful for shipping NOIZY-branded plugin bundles.

**TODO:** fetch these four pages in full and expand sections 6.1–6.4 with working examples. This section is a placeholder until then.

---

## 7 · TypeScript SDK Reference (abbreviated)

**Source:** `/docs/en/agent-sdk/typescript` — full page is long; last capture was truncated mid-`Query` interface. Fetch upstream when authoring new NOIZY agents.

### Install

```bash
npm install @anthropic-ai/claude-agent-sdk
```

Bundles a platform-native Claude Code binary as optional dependency (e.g. `@anthropic-ai/claude-agent-sdk-darwin-arm64`). If package manager skipped optional deps, set `pathToClaudeCodeExecutable` to a separately-installed `claude` binary.

### Core exports

| Export                                                   | Purpose                                                                                  |
| -------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `query({ prompt, options })`                             | Primary call; returns `Query` (async generator of `SDKMessage`)                          |
| `startup({ options, initializeTimeoutMs })`              | Pre-warms the CLI subprocess; returns `WarmQuery` you can call `.query(prompt)` on later |
| `tool(name, description, inputSchema, handler, extras?)` | Define an in-process SDK tool using a Zod schema                                         |
| `createSdkMcpServer({ name, version?, tools? })`         | Wrap tools into an in-process MCP server                                                 |
| `listSessions(options?)`                                 | Discover past sessions by dir / limit / git-worktrees                                    |
| `getSessionMessages(sessionId, options?)`                | Read messages from a session transcript                                                  |
| `getSessionInfo(sessionId, options?)`                    | Metadata only — no transcript scan                                                       |
| `renameSession(sessionId, title, options?)`              | Append custom-title entry (idempotent)                                                   |
| `tagSession(sessionId, tag \| null, options?)`           | Set/clear a session tag                                                                  |

### `Options` — most relevant fields for NOIZY

| Field                                           | Effect                                                                                                  |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| `mcpServers`                                    | Record of MCP server configs (stdio / http / sse / sdk)                                                 |
| `allowedTools: string[]`                        | Auto-approve list; unlisted tools go through permission flow                                            |
| `disallowedTools: string[]`                     | Always denied; overrides `allowedTools` and `permissionMode`                                            |
| `permissionMode`                                | `'default' \| 'acceptEdits' \| 'bypassPermissions' \| 'plan'`                                           |
| `agents`                                        | Programmatic subagents (see §3)                                                                         |
| `agent`                                         | Name of the main-thread agent (must be in `agents` or settings)                                         |
| `hooks`                                         | `Partial<Record<HookEvent, HookCallbackMatcher[]>>` — PreToolUse, PostToolUse, Stop, SessionStart, etc. |
| `settingSources`                                | Which filesystem settings to load; pass `[]` to disable user/project/local                              |
| `systemPrompt`                                  | See §6.1                                                                                                |
| `cwd`                                           | Working dir; defaults to `process.cwd()`                                                                |
| `additionalDirectories: string[]`               | Extra dirs Claude can access                                                                            |
| `model` / `fallbackModel`                       | Override model; auto-fallback                                                                           |
| `maxTurns`                                      | Loop-limit safety                                                                                       |
| `maxBudgetUsd`                                  | Stop when client-side cost estimate hits this USD value                                                 |
| `thinking: ThinkingConfig`                      | `{ type: 'adaptive' }` default on supported models                                                      |
| `effort`                                        | `'low' \| 'medium' \| 'high' \| 'xhigh' \| 'max'` — guides thinking depth                               |
| `sandbox: SandboxSettings`                      | Programmatic sandbox config                                                                             |
| `plugins: SdkPluginConfig[]`                    | Local plugin loading                                                                                    |
| `outputFormat: { type: 'json_schema', schema }` | Structured final result                                                                                 |
| `resume: string` / `forkSession: boolean`       | Session resumption                                                                                      |
| `persistSession: boolean`                       | Defaults `true`; set `false` to skip disk persistence                                                   |
| `includePartialMessages: boolean`               | Stream partial events                                                                                   |
| `canUseTool: CanUseTool`                        | Custom per-tool permission function                                                                     |
| `env`                                           | Proc env; includes `CLAUDE_AGENT_SDK_CLIENT_APP` (User-Agent tagging)                                   |

### `Query` object methods

Returned by `query()`. Extends `AsyncGenerator<SDKMessage, void>` plus:

- `interrupt()` — abort in flight
- `rewindFiles(userMessageId, options?)` — rewind file changes to before a given user message (requires `enableFileCheckpointing`)
- `setPermissionMode(mode)` · `setModel(model?)` · `setMaxThinkingTokens(n | null)`
- `initializationResult()` — init handshake result
- `supportedCommands()` · `supportedModels()` · `supportedAgents()`
- `mcpServerStatus()` · `reconnectMcpServer(name)` · `toggleMcpServer(name, enabled)` · `setMcpServers(record)`
- `accountInfo()` · `streamInput(stream)` · `stopTask(taskId)` · `close()`

### Tool annotations (`ToolAnnotations`)

| Field             | Default     | Meaning                                |
| ----------------- | ----------- | -------------------------------------- |
| `title`           | `undefined` | Human-readable title                   |
| `readOnlyHint`    | `false`     | Tool doesn't modify env                |
| `destructiveHint` | `true`      | Tool may perform destructive updates   |
| `idempotentHint`  | `false`     | Repeated calls same args → same effect |
| `openWorldHint`   | `true`      | Tool reaches outside the process       |

---

## 8 · NOIZY Integration Playbook

Concrete, NOIZY-specific wiring that applies the patterns above.

### 8.1 Load the full NOIZY arsenal into GABRIEL CLI

Edit `GABRIEL/src/gabriel.ts` (currently does a plain `query()` with no MCPs / skills / agents):

```typescript
import { query } from "@anthropic-ai/claude-agent-sdk";
import { readFileSync } from "node:fs";

const mcpConfig = JSON.parse(
  readFileSync("/Users/m2ultra/NOIZYANTHROPIC/.mcp.json", "utf8"),
).mcpServers;

for await (const msg of query({
  prompt: userInput,
  options: {
    mcpServers: mcpConfig, // all 14–17 MCP servers
    settingSources: ["project", "user"], // load .claude/skills/agents/prompts
    allowedTools: [
      "mcp__*", // auto-approve all MCP tools
      "Bash",
      "Read",
      "Edit",
      "Write",
      "Glob",
      "Grep",
      "Agent",
    ],
    systemPrompt: { type: "preset", preset: "claude_code", append: GABRIEL_CHARACTER },
    env: { ENABLE_TOOL_SEARCH: "auto:5" }, // scale-safe
    model: "claude-sonnet-4-6", // or opus for warrior ops
    maxTurns: 50,
  },
})) {
  // ... existing stream handling, plus speak() call per voice.ts
}
```

### 8.2 HEAVEN control plane as an in-process SDK tool

Expose Heaven API as a custom tool so every NOIZY agent gets ledger write for free:

```typescript
import { tool, createSdkMcpServer } from "@anthropic-ai/claude-agent-sdk";
import { z } from "zod";

const heavenLedgerAppend = tool(
  "heaven_ledger_append",
  "Append an event to the NOIZY ledger via Heaven API. Required for every mutating op.",
  { actor_id: z.string(), event_kind: z.string(), payload: z.record(z.any()) },
  async (args) => {
    const res = await fetch("https://heaven.rsp-5f3.workers.dev/api/v1/ledger", {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-NOIZY-Key": process.env.NOIZY_API_KEY! },
      body: JSON.stringify(args),
    });
    if (!res.ok) return { content: [{ type: "text", text: `fail: ${res.status}` }], isError: true };
    return { content: [{ type: "text", text: JSON.stringify(await res.json()) }] };
  },
  { annotations: { readOnlyHint: false, idempotentHint: false } },
);

export const heavenServer = createSdkMcpServer({
  name: "heaven",
  version: "1.0.0",
  tools: [heavenLedgerAppend /* add more Heaven endpoints as they come online */],
});
```

### 8.3 Subagent roster matching `.claude/agents/`

Programmatic mirror of the filesystem agents; ensures consistent behavior across sessions:

```typescript
agents: {
  "lucy":       { description: "DAZEFLOW keeper. Use for logs/intake/memcells.",   prompt: "...", model: "sonnet", tools: ["Read","Grep","Glob","Agent"] },
  "pops":       { description: "Grounding + wellbeing checks.",                     prompt: "...", model: "sonnet", tools: ["Read","Grep"] },
  "shirl":      { description: "Break-enforcer + wellbeing watchdog.",              prompt: "...", model: "sonnet", tools: ["Read","Grep"] },
  "shirley":    { description: "Code stats, file inventory, TODO scan.",            prompt: "...", model: "sonnet", tools: ["Read","Grep","Glob","Bash"] },
  "engr_keith": { description: "Engineering review + schema + infra custody.",      prompt: "...", model: "opus",   tools: ["Read","Edit","Bash","Grep","Glob"] },
  "dream":      { description: "Visionary / 5th Epoch strategy.",                   prompt: "...", model: "opus",   tools: ["Read","Grep","Glob"] },
  "cb01":       { description: "DNS / GoDaddy exit / domain ops.",                  prompt: "...", model: "sonnet", tools: ["Bash","Read","Edit"] },
  "consent-auditor": { description: "Never Clause 9-point audit before any consent-touching deploy.", prompt: "...", tools: ["Read","Grep","Bash"] },
}
```

### 8.4 Secure deployment for NOIZY remote agents

When a NOIZY agent needs to run on a shared / cloud environment (e.g. `agent.noizy.ai`):

1. **Sandbox:** Firecracker microVM via Modal or Fly Machines.
2. **Network:** `--network none` + proxy mounted as Unix socket; allow `api.anthropic.com` + `*.noizy.ai` + listed MCP hosts.
3. **Credentials:** never mount `.env`. Run a proxy outside the VM that injects `NOIZY_API_KEY`, `SUPABASE_SERVICE_KEY`, `ANTHROPIC_API_KEY` only for allowed destinations.
4. **Filesystem:** repo mounted read-only; agent writes go to `tmpfs`.
5. **Audit:** all traffic logged at the proxy + every mutating tool writes to `cp_audit_log` (Supabase control plane) + `noizy_ledger` (Heaven).

### 8.5 Cost + turn safety

Every NOIZY agent should set:

```typescript
maxTurns: 50,                              // hard stop to prevent loops
maxBudgetUsd: 5,                           // per-session USD cap (tune per role)
env: { ENABLE_TOOL_SEARCH: "auto:5" },     // keep context lean
thinking: { type: "adaptive" },            // default; only override for deep-analysis agents
```

### 8.6 Consent-kernel integration (TODO, non-negotiable)

Before any tool with `destructiveHint: true` fires against real data, the handler MUST check `hvs_never_clauses` via `mcp__heaven-mcp__*`. If a Never Clause matches, return `isError: true` with the clause number. Silent bypass is doctrine violation.

---

## 9 · Related docs (upstream URLs to fetch when deeper detail is needed)

- Custom tools: <https://code.claude.com/docs/en/agent-sdk/custom-tools>
- MCP: <https://code.claude.com/docs/en/agent-sdk/mcp>
- Tool search: <https://code.claude.com/docs/en/agent-sdk/tool-search>
- Subagents: <https://code.claude.com/docs/en/agent-sdk/subagents>
- Hosting: <https://code.claude.com/docs/en/agent-sdk/hosting>
- Secure deployment: <https://code.claude.com/docs/en/agent-sdk/secure-deployment>
- TypeScript ref: <https://code.claude.com/docs/en/agent-sdk/typescript>
- Python ref: <https://code.claude.com/docs/en/agent-sdk/python>
- Permissions: <https://code.claude.com/docs/en/agent-sdk/permissions>
- Modifying system prompts: <https://code.claude.com/docs/en/agent-sdk/modifying-system-prompts>
- Slash commands: <https://code.claude.com/docs/en/agent-sdk/slash-commands>
- Agent skills (SDK): <https://code.claude.com/docs/en/agent-sdk/skills>
- Plugins (SDK): <https://code.claude.com/docs/en/agent-sdk/plugins>
- Structured outputs: <https://code.claude.com/docs/en/agent-sdk/structured-outputs>
- Sessions: <https://code.claude.com/docs/en/agent-sdk/sessions>
- Cost tracking: <https://code.claude.com/docs/en/agent-sdk/cost-tracking>
- File checkpointing: <https://code.claude.com/docs/en/agent-sdk/file-checkpointing>
- Index: <https://code.claude.com/docs/llms.txt>

---

_This file is the captured-state reference for NOIZY agents. When the upstream docs change materially, update this file in a single commit — do not keep divergent fragments._

---

## Appendix A · TypeScript SDK V2 Preview (unstable)

**Source:** `/docs/en/agent-sdk/typescript-v2-preview` · status: **preview**, APIs may change.

Simpler multi-turn pattern than V1's async-generator coordination. Three concepts:

- `unstable_v2_createSession(options)` · `unstable_v2_resumeSession(sessionId, options)`
- `session.send(message)` — dispatch
- `session.stream()` — consume (`AsyncGenerator<SDKMessage, void>`)

### Quick start

```typescript
import { unstable_v2_createSession } from "@anthropic-ai/claude-agent-sdk";

await using session = unstable_v2_createSession({ model: "claude-opus-4-7" });
await session.send("Hello!");
for await (const msg of session.stream()) {
  if (msg.type === "assistant") {
    const text = msg.message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("");
    console.log(text);
  }
}
// `await using` auto-closes at block exit (TS 5.2+). Else call session.close().
```

### One-shot convenience

```typescript
import { unstable_v2_prompt } from "@anthropic-ai/claude-agent-sdk";

const result = await unstable_v2_prompt("What is 2 + 2?", { model: "claude-opus-4-7" });
if (result.subtype === "success") console.log(result.result);
```

### Multi-turn with context continuity

Call `send()` / consume `stream()` again on the same session; prior turns remain in context. No generator-state juggling.

### Resume across process restarts

Capture `session_id` from any received message, then:

```typescript
await using resumed = unstable_v2_resumeSession(sessionId, { model: "claude-opus-4-7" });
await resumed.send("What number did I ask you to remember?");
```

### V2 gaps

Session forking (`forkSession`) and some advanced streaming-input patterns still only in V1.

---

## Appendix B · Python SDK quick reference

**Source:** `/docs/en/agent-sdk/python` — truncated mid-`ClaudeAgentOptions` table in the captured paste.

### Install

```bash
pip install claude-agent-sdk
```

### `query()` vs `ClaudeSDKClient`

| Feature                 | `query()`     | `ClaudeSDKClient`                   |
| ----------------------- | ------------- | ----------------------------------- |
| Session                 | New each call | Reused across calls                 |
| Multi-turn conversation | ❌            | ✅                                  |
| Interrupts              | ❌            | ✅                                  |
| Hooks                   | ✅            | ✅                                  |
| Custom tools            | ✅            | ✅                                  |
| Best for                | One-off tasks | Chat / REPL / response-driven logic |

### `query()` shape

```python
from claude_agent_sdk import query, ClaudeAgentOptions

async def main():
    options = ClaudeAgentOptions(
        system_prompt="You are an expert Python developer",
        permission_mode="acceptEdits",
        cwd="/path/to/project",
    )
    async for message in query(prompt="Create a Python web server", options=options):
        print(message)
```

### `@tool` decorator

```python
from claude_agent_sdk import tool, create_sdk_mcp_server

@tool("greet", "Greet a user", {"name": str})
async def greet(args):
    return {"content": [{"type": "text", "text": f"Hello, {args['name']}!"}]}

# Wrap into an in-process MCP server
calculator = create_sdk_mcp_server(name="calc", version="1.0.0", tools=[greet])
```

Schema options:

- **Simple type mapping** (preferred): `{"text": str, "count": int, "enabled": bool}` — all keys required.
- **Full JSON Schema** (for enums, ranges, optional, nested): standard `{"type": "object", "properties": {...}, "required": [...]}` dict.

### `ClaudeSDKClient` — persistent conversations

```python
async with ClaudeSDKClient() as client:
    await client.query("What's the capital of France?")
    async for msg in client.receive_response():
        ...  # process

    await client.query("What's the population of that city?")   # keeps context
    async for msg in client.receive_response():
        ...
```

Interrupts: `await client.interrupt()` → buffer still carries the interrupted task's final `ResultMessage(subtype="error_during_execution")` — **drain it with `receive_response()` before sending a new query**, otherwise you'll read stale messages.

### Session helpers (sync, return immediately)

- `list_sessions(directory=None, limit=None, include_worktrees=True)` → `list[SDKSessionInfo]`
- `get_session_messages(session_id, directory=None, limit=None, offset=0)` → `list[SessionMessage]`
- `get_session_info(session_id, directory=None)` → `SDKSessionInfo | None`
- `rename_session(session_id, title, directory=None)`
- `tag_session(session_id, tag | None, directory=None)` — pass `None` to clear

### Dataclass vs TypedDict gotcha

`@dataclass` types (`ResultMessage`, `AgentDefinition`, `TextBlock`) are **object instances** — use `msg.result`.
`TypedDict` types (`ThinkingConfigEnabled`, `McpStdioServerConfig`, `SyncHookJSONOutput`) are **plain dicts** — use `config["budget_tokens"]`, NOT `config.budget_tokens`.

### `ClaudeAgentOptions` — the Python equivalent of `Options`

Python field names are snake_case versions of the TS fields. Notable mappings:

| TS `Options`                       | Python `ClaudeAgentOptions`          |
| ---------------------------------- | ------------------------------------ |
| `mcpServers`                       | `mcp_servers`                        |
| `allowedTools` / `disallowedTools` | `allowed_tools` / `disallowed_tools` |
| `permissionMode`                   | `permission_mode`                    |
| `systemPrompt`                     | `system_prompt`                      |
| `maxTurns` / `maxBudgetUsd`        | `max_turns` / `max_budget_usd`       |
| `settingSources`                   | `setting_sources`                    |
| `canUseTool`                       | `can_use_tool`                       |
| `enableFileCheckpointing`          | `enable_file_checkpointing`          |
| `forkSession`                      | `fork_session`                       |
| `includePartialMessages`           | `include_partial_messages`           |

`Transport` abstract base class (low-level; may change) exposes `connect() / write(data) / read_messages() / close() / is_ready() / end_input()` — implement for non-subprocess comms (remote Claude process, container-bridge, etc.).

---

## Appendix C · Migration — Claude Code SDK → Claude Agent SDK

**Source:** `/docs/en/agent-sdk/migration` (v0.1.0 rename).

| Aspect              | Old                         | New                              |
| ------------------- | --------------------------- | -------------------------------- |
| TS/JS package       | `@anthropic-ai/claude-code` | `@anthropic-ai/claude-agent-sdk` |
| Python package      | `claude-code-sdk`           | `claude-agent-sdk`               |
| Python options type | `ClaudeCodeOptions`         | `ClaudeAgentOptions`             |
| Docs location       | Claude Code docs            | API Guide → Agent SDK section    |

### Breaking changes you must handle

1. **System prompt no longer default.** SDK starts with a minimal prompt. To restore pre-rename behavior:

   ```typescript
   systemPrompt: { type: "preset", preset: "claude_code" }
   ```

   ```python
   system_prompt={"type": "preset", "preset": "claude_code"}
   ```

2. **Settings sources no longer loaded by default** — but current SDK releases **reverted** this for `query()`: omitting the option once again loads `user`, `project`, `local`. Pass `settingSources: []` (TS) or `setting_sources=[]` (Py) to force isolated behavior. Python SDK 0.1.59 and earlier treated `[]` same as omitted — upgrade before relying on it.

### Migration commands

```bash
# TypeScript
npm uninstall @anthropic-ai/claude-code
npm install @anthropic-ai/claude-agent-sdk

# Python
pip uninstall claude-code-sdk
pip install claude-agent-sdk
```

Update imports, update type names (`ClaudeCodeOptions` → `ClaudeAgentOptions`), restore settings sources or system-prompt preset if your app depended on prior defaults.

### NOIZY migration checklist

- [ ] `GABRIEL/package.json` — confirmed using `@anthropic-ai/claude-agent-sdk` (already on new name per earlier `npm install`).
- [ ] `GABRIEL/src/gabriel.ts` — when wired per §8.1, explicitly pass `systemPrompt: { type: "preset", preset: "claude_code", append: GABRIEL_CHARACTER }` and `settingSources: ["project", "user"]`.
- [ ] Any Python helper agents we build for DreamChamber or LUCY: use `ClaudeAgentOptions(system_prompt={"type":"preset","preset":"claude_code"})` explicitly.

---

_End of Agent SDK reference. Appendices captured 2026-04-20. Treat as snapshot — fetch upstream `llms.txt` when authoring new agents._
