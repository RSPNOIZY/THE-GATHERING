"""
Claude (Opus 4.8) agent loop driving Desktop Commander over MCP.

Desktop Commander is an MCP server that can run arbitrary shell commands and
edit files. This script connects to it, exposes its tools to Claude, and runs a
MANUAL agentic loop so that a human-in-the-loop gate sits in front of every
tool call. (The auto-running tool_runner is the wrong choice for a tool that has
a root shell behind it.)

Install:
    pip install "anthropic[mcp]"      # Python 3.10+
    # Node is required so `npx` can launch Desktop Commander.
    # ANTHROPIC_API_KEY must be set in the environment.

Run:
    python dc_claude_agent.py "List the largest 5 files under ~/Downloads"
"""

import asyncio
import sys

import anthropic
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

MODEL = "claude-opus-4-8"

# Desktop Commander launched as a stdio MCP server.
# Confirm the package name against Desktop Commander's current install docs.
DESKTOP_COMMANDER = StdioServerParameters(
    command="npx",
    args=["-y", "@wonderwhy-er/desktop-commander"],
)


def should_allow_tool(name: str, args: dict) -> bool:
    """Security boundary: decide whether a Desktop Commander tool call runs.

    THIS IS THE DECISION THAT MATTERS. Desktop Commander can execute arbitrary
    terminal commands and overwrite files, so this function is the entire
    difference between a safe assistant and an unsandboxed LLM-driven root shell.

    There are several valid strategies, each a real trade-off:
      - Allowlist:  only auto-run known-safe, read-only tools (e.g. listing,
                    reading); refuse or prompt for anything that writes/executes.
      - Prompt:     print the tool name + args and ask the operator y/N for any
                    call with side effects.
      - Path-fence: allow file ops only under a sandbox directory; deny writes
                    outside it.

    TODO(you): implement the policy you want. Return True to auto-run the call,
    or False to deny it (the model is told the call was blocked and adapts).
    Suggested starting point: auto-allow read-only tools, prompt on everything
    else. ~5-10 lines.
    """
    raise NotImplementedError("Define your tool-execution policy in should_allow_tool()")


def mcp_to_anthropic_tools(mcp_tools) -> list[dict]:
    """Translate MCP tool descriptors into Anthropic tool definitions."""
    return [
        {
            "name": t.name,
            "description": t.description or "",
            "input_schema": t.inputSchema,
        }
        for t in mcp_tools
    ]


async def run(goal: str) -> None:
    client = anthropic.AsyncAnthropic()  # reads ANTHROPIC_API_KEY

    async with stdio_client(DESKTOP_COMMANDER) as (read, write):
        async with ClientSession(read, write) as mcp:
            await mcp.initialize()
            tools = mcp_to_anthropic_tools((await mcp.list_tools()).tools)

            messages: list[dict] = [{"role": "user", "content": goal}]

            while True:
                response = await client.messages.create(
                    model=MODEL,
                    max_tokens=16000,
                    thinking={"type": "adaptive"},
                    output_config={"effort": "high"},
                    tools=tools,
                    messages=messages,
                )

                if response.stop_reason != "tool_use":
                    final = next((b.text for b in response.content if b.type == "text"), "")
                    print(final)
                    return

                # Preserve the full assistant turn (thinking + tool_use blocks).
                messages.append({"role": "assistant", "content": response.content})

                results = []
                for block in response.content:
                    if block.type != "tool_use":
                        continue
                    if should_allow_tool(block.name, block.input):
                        out = await mcp.call_tool(block.name, block.input)
                        text = "".join(
                            c.text for c in out.content
                            if getattr(c, "type", None) == "text"
                        )
                        results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": text or "(no output)",
                        })
                    else:
                        results.append({
                            "type": "tool_result",
                            "tool_use_id": block.id,
                            "content": f"Tool '{block.name}' was blocked by local policy.",
                            "is_error": True,
                        })

                messages.append({"role": "user", "content": results})


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python dc_claude_agent.py "<your goal>"')
        raise SystemExit(1)
    asyncio.run(run(sys.argv[1]))
