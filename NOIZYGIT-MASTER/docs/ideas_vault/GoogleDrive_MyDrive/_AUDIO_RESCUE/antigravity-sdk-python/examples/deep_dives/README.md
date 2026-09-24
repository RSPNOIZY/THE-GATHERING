# Deep Dives

Multi-feature examples that combine several SDK concepts into realistic
mini-applications. Each example is self-contained and runnable — start with any
that matches your use case.

> **Prerequisite:** Make sure you can run the basics first. See the
> [Getting Started](../getting_started/) examples and their
> [README](../getting_started/README.md).

---

## 🔌 Middleware & Lifecycle

### [agent_middleware.py](agent_middleware.py)
**Hook middleware: transparent tool interception.**

Demonstrates how stacked hooks create emergent behavior the agent is unaware of.
The agent calls tools normally; hooks enforce rate limits, log an audit trail,
and recover from errors — all without the agent's knowledge.

**Concepts:** `PreToolCallDecideHook`, `PostToolCallHook`, `OnToolErrorHook`,
hook composition.

```
python agent_middleware.py
```

### [host_tool_hooks.py](host_tool_hooks.py)
**Every supported lifecycle hook wired and logged.**

Registers one hook for each supported lifecycle event and logs what was received
— session start/end, pre/post turn, pre/post tool call, tool errors, compaction,
interaction, and subagent hooks.

**Concepts:** `OnSessionStartHook`, `OnSessionEndHook`, `PreTurnHook`,
`PostTurnHook`, `OnCompactionHook`, `OnInteractionHook`, decorator-based hook
registration.

```
python host_tool_hooks.py
```

---

## 💬 Multi-Agent Chat

### [round_based_chat.py](round_based_chat.py)
**Synchronized parallel agent chat room with opt-out.**

Three agents discuss topics as equals. All agents process in parallel each
round via `asyncio.gather`. Each can call `pass_turn()` to stay silent.
Conversation continues until all agents pass or the max depth is reached.

**Concepts:** Custom tools, triggers (`every()`), `asyncio.gather` parallelism,
incremental prompt construction.

```
python round_based_chat.py
```

### [async_chat.py](async_chat.py)
**Fully async peer-to-peer agent chat — no rounds.**

Each agent runs its own independent loop and reacts whenever any peer posts a
new message. Ordering is emergent — whoever finishes `agent.chat()` first gets
the next word. Contrast with `round_based_chat.py` for the synchronized
alternative.

**Concepts:** `asyncio.Condition`, reactive wake-up, custom tools,
self-terminating conversations.

```
python async_chat.py
```

---

## 🎨 Multimodal

### [multimodal_pipeline.py](multimodal_pipeline.py)
**Generator/discriminator pipeline with multimodal I/O.**

A two-agent pipeline: a Generator creates an image using the built-in
`generate_image` tool, then a completely separate Discriminator receives only
the raw image bytes (no filename) and describes what it sees — demonstrating
true end-to-end multimodal input.

**Concepts:** `generate_image` built-in tool, `Image` content type, multimodal
`Content` input, independent agent instances.

```
python multimodal_pipeline.py
```

---

## 🤖 Autonomous Agents

### [doc_maintenance_agent.py](doc_maintenance_agent.py)
**Autonomous documentation agent scoped to `.md` files.**

An agent that reads source code and ensures corresponding markdown
documentation is accurate and up-to-date. Fine-grained policies restrict
editing to `.md` files within a target directory.

**Concepts:** `policy.allow` / `policy.deny`, conditional `when=` predicates,
`CapabilitiesConfig`, workspace scoping.

```
python doc_maintenance_agent.py [directory]
```

### [docstring_maintenance_agent.py](docstring_maintenance_agent.py)
**Autonomous docstring agent scoped to `.py` files.**

Audits all Python files in a directory and ensures public symbols have
Google-style docstrings. Destructive tools (`create_file`, `run_command`) are
explicitly disabled via `CapabilitiesConfig`.

**Concepts:** `BuiltinTools` enum, `disabled_tools`, policy-based file-type
filtering, workspace scoping.

```
python docstring_maintenance_agent.py [directory]
```

---

## 🖥️ Interactive

### [interactive_cli.py](interactive_cli.py)
**Full interactive CLI with custom tools, MCP, and tool approval.**

A complete interactive agent session with custom Python tools, an MCP server
(pirate math), hook-based tool approval via `policy.ask_user`, streaming
responses, and optional token usage telemetry.

**Concepts:** `McpStdioServer`, `policy.ask_user`, `interactive.AskQuestionHook`,
`CapabilitiesConfig`, streaming, `UsageMetadata`.

```
python interactive_cli.py
```
