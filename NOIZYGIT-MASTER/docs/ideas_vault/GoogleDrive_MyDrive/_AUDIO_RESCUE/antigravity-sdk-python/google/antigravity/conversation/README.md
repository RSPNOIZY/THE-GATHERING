# Google Antigravity SDK Conversation

The `conversation` package provides the `Conversation` class, which is the Layer 2 session API in the Google Antigravity SDK. It wraps a `Connection` and adds stateful session management features.

## Core Concepts

### `Conversation`

`Conversation` is the primary interface for power users who need more control than the high-level `Agent` class provides, but don't want to deal with the low-level details of `Connection`.

## Mental Model: Agent vs Conversation

The SDK has three layers. Understanding which layer owns which concern
prevents confusion:

```
┌──────────────────────────────────────────────┐
│  Agent  (Layer 1 — Lifecycle & Config)       │
│  Owns: config, hooks, triggers, policies,    │
│        MCP bridges, tool runner, chat()      │
│                                              │
│  ┌──────────────────────────────────────────┐│
│  │  Conversation  (Layer 2 — Session)       ││
│  │  Owns: history, turn tracking,           ││
│  │        compaction indices, usage,        ││
│  │        send(), receive_steps(), chat()   ││
│  │                                          ││
│  │  ┌──────────────────────────────────────┐││
│  │  │  Connection  (Layer 3 — Transport)   │││
│  │  │  Owns: wire protocol, binary,        │││
│  │  │        idle/wakeup, disconnect       │││
│  │  └──────────────────────────────────────┘││
│  └──────────────────────────────────────────┘│
└──────────────────────────────────────────────┘
```

**What lives where:**

| Concern | Owner | Why |
|:--------|:------|:----|
| Config, hooks, policies, tools | **Agent** | These are *declarative setup* — they define what the agent can do, not what it has done. |
| History, turns, usage, compaction | **Conversation** | These are *session state* — they accumulate as the agent interacts. |
| Wire protocol, process lifecycle | **Connection** | This is *transport plumbing* — how bytes move. |

**Can an Agent have multiple Conversations?**

Today, each `Agent` session (`async with Agent(...)`) creates exactly one
`Conversation`. To run multiple independent conversations, create multiple
`Agent` instances (see `multi_conversation_example.py`) or use `Conversation`
directly with a `ConnectionStrategy`.

**When should I use `agent.conversation`?**

Most users only need `agent.chat()`. Use `agent.conversation` when you
need:

- **History inspection** — `agent.conversation.history`
- **Token usage tracking** — `agent.conversation.total_usage`
- **Step-level streaming** — `agent.conversation.send()` +
  `agent.conversation.receive_steps()`
- **Transport access** — `agent.conversation.connection`

Key features:
- **Step History Accumulation**: It automatically records all `Step` objects received from the connection.
- **History Limits**: It supports a maximum history size to prevent memory issues in long sessions, discarding oldest steps when the limit is exceeded.
- **Turn Tracking**: It tracks where each turn (user prompt) starts in the history.
- **Compaction Tracking**: It tracks where the model's context was compacted.
- **Convenience Methods**:
    - `chat(prompt)`: Sends a prompt and waits for the complete response, returning a `ChatResponse`. Natively supports both standard strings and rich `types.Content` multimodal payloads (lists of text strings and semantic content files like `Image` and `Document`).
    - `send(prompt)`: Sends a prompt turn (non-blocking). Accepts strings or complex multimodal payloads.
    - `receive_steps()`: Async iterator for receiving steps for the current turn.

## Usage Example

### Using `chat()` (High-level)

```python
from google.antigravity.conversation.conversation import Conversation
from google.antigravity.connections.local import LocalConnectionStrategy
from google.antigravity import types

strategy = LocalConnectionStrategy(...)

async with Conversation.create(strategy) as conversation:
    response = await conversation.chat("What files are in the current directory?")
    print(await response.text())
    
    print(f"Total steps: {len(conversation.history)}")
```

### Using `send()` and `receive_steps()` (Low-level steps)

```python
async with Conversation.create(strategy) as conversation:
    await conversation.send("Tell me a story.")
    async for step in conversation.receive_steps():
        if (
            step.source == types.StepSource.MODEL
            and step.type == types.StepType.TEXT_RESPONSE
        ):
            print(step.content, end="")
```

### Real-Time Streaming (High-level Delta Chunks)

For fluid UI applications, you can stream tokens, thoughts, or tool calls in real-time using highly-sugared properties on `ChatResponse`:

```python
async with Conversation.create(strategy) as conversation:
    response = await conversation.chat("Tell me a story.")
    
    # 1. Stream text answer tokens directly as raw strings
    async for token in response:
        print(token, end="", flush=True)
        
    # 2. Stream model reasoning thoughts directly as raw strings
    async for thought in response.thoughts:
        show_thinking_bubble(thought)
```

## Files

- `conversation.py`: Defines the `Conversation` class.
