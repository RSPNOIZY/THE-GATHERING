# Google Antigravity SDK Tools

The `tools` package provides utilities for managing and executing tools within the Google Antigravity SDK. Tools are Python callables that the agent can invoke to perform actions or fetch information.

## Core Concepts

### `ToolRunner`

`ToolRunner` is a registry and executor for in-process Python tools. It maintains a mapping of tool names to callables and handles their execution, including running synchronous functions in a separate thread to avoid blocking the async event loop.

Key features:
- **Registration**: Register tools with `register(tool, name=None)`.
- **Execution**: Execute a tool by name with `execute(tool_name, **kwargs)`.
- **Batch Processing**: Process a list of `ToolCall` objects and return `ToolResult` objects with `process_tool_calls(tool_calls)`.
- **Support for Sync and Async**: Automatically detects if a tool is async or sync and handles it appropriately.

### `ToolWithSchema`

A wrapper class for callables that have an explicit JSON Schema defined. This is useful for tools that come from external sources like MCP servers.

### `ToolContext`

`ToolContext` is a conversation-aware context injected into tools that request
it. It provides access to the connection and a per-conversation state store.

This is useful when a tool needs to:

- Maintain state across multiple invocations within the same conversation (e.g.,
  a cursor for pagination or a scratchpad).
- Access conversation metadata or the underlying connection to perform advanced
  operations.
- Share data with other tools used in the same conversation.

**Note on State Sharing**: The state store in `ToolContext` (accessed via
`get_state` and `set_state`) is independent of the `HookContext` used by hooks.
State set by a tool is not visible to hooks. Similarly, state set by hooks is
not visible to tools. See `hooks/README.md` for details on this separation.

## Available Tools and Utilities

## Usage Example

```python
from google.antigravity.tools.tool_runner import ToolRunner

def my_custom_tool(param: str) -> str:
    """A custom tool that does something."""
    return f"Processed: {param}"

tool_runner = ToolRunner(tools=[my_custom_tool])

# Execute directly
result = await tool_runner.execute("my_custom_tool", param="input value")
print(result)

# Process structured tool calls
from google.antigravity import types
calls = [types.ToolCall(name="my_custom_tool", args={"param": "another input"})]
results = await tool_runner.process_tool_calls(calls)
print(results[0].result)
```

## Tool Access Control: Disabling vs. Denying

The SDK provides two distinct mechanisms for restricting which tools an agent
can use. They operate at different levels and have different trade-offs:

### Disabling tools (config-level)

Use `CapabilitiesConfig.enabled_tools` or `CapabilitiesConfig.disabled_tools`
to control which builtin tools the harness exposes to the model. A disabled
tool is **removed from the model's context entirely** — the model never sees
its definition, never considers calling it, and never wastes tokens on it.

```python
from google.antigravity.types import CapabilitiesConfig, BuiltinTools

# Only expose read-only tools — the model can't even see write tools.
config = LocalAgentConfig(
    capabilities=CapabilitiesConfig(
        enabled_tools=BuiltinTools.read_only(),
    ),
)
```

### Denying tools (policy-level)

Use `policy.deny()` to reject specific tool calls at runtime via the hooks
system. The tool **remains visible** in the model's context, but calls are
rejected with a denial message. This allows the model to understand why access
was refused, but each rejected call costs tokens.

```python
from google.antigravity.hooks.policy import deny, allow

# The model sees run_command but can't use it for destructive operations.
policies = [
    deny("run_command",
         when=lambda args: "rm" in args.get("CommandLine", "")),
    allow("*"),
]
```

### When to use which

| Approach | Model sees the tool? | Token cost | Best for |
|---|---|---|---|
| `disabled_tools` / `enabled_tools` | No | None | Tools irrelevant to the agent's purpose |
| `policy.deny()` | Yes | Wasted on failed calls | Conditional or argument-dependent restrictions |

**Guideline**: Prefer `CapabilitiesConfig` to remove tools the agent should
never need. Use policies for runtime guardrails where the decision depends on
context, arguments, or user approval.

## Files

- `tool_runner.py`: Defines `ToolRunner` and `ToolWithSchema`.
