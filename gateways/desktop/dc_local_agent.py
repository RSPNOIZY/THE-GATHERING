"""
Local-model (Gemma / Phi-4) agent loop driving Desktop Commander over MCP.

This is the LOCAL counterpart to dc_claude_agent.py. Instead of the Anthropic
API it talks to a local OpenAI-compatible server (Ollama / LM Studio / llama.cpp)
and uses OpenAI-style function calling. Desktop Commander is reached over MCP.

Install:
    pip install openai "mcp"          # Python 3.10+
    # A local server must be running, e.g.:  ollama serve
    # Pull a model first:                    ollama pull phi4    (or: gemma3)
    # Node is required so `npx` can launch Desktop Commander.

Run:
    python dc_local_agent.py "List the largest 5 files under ~/Downloads"
    MODEL=gemma3 python dc_local_agent.py "..."

NOTE: 14B-class local models are much weaker than hosted frontier models at
multi-step tool use. Expect occasional malformed tool calls. The approval gate
below is your safety net — keep it strict.
"""

import asyncio
import json
import os
import sys

from openai import AsyncOpenAI
from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# Point at your local OpenAI-compatible server.
BASE_URL = os.environ.get("LOCAL_BASE_URL", "http://localhost:11434/v1")  # Ollama
API_KEY = os.environ.get("LOCAL_API_KEY", "ollama")                       # dummy key
MODEL = os.environ.get("MODEL", "phi4")                                   # or "gemma3"

DESKTOP_COMMANDER = StdioServerParameters(
    command="npx",
    args=["-y", "@wonderwhy-er/desktop-commander"],
)


def should_allow_tool(name: str, args: dict) -> bool:
    """Security boundary — see dc_claude_agent.py for the full rationale.
    Local models are LESS reliable at tool use, so if anything keep this stricter.
    TODO(you): implement your policy. Return True to run, False to block.
    """
    READ_ONLY = {"read_file", "list_directory", "search_files", "get_file_info"}
    if name in READ_ONLY:
        return True
    print(f"\n⚠️  Model wants to run: {name}({args})")
    return input("Allow? [y/N] ").strip().lower() == "y"


def mcp_to_openai_tools(mcp_tools) -> list[dict]:
    """Translate MCP tool descriptors into OpenAI function-tool definitions."""
    return [
        {
            "type": "function",
            "function": {
                "name": t.name,
                "description": t.description or "",
                "parameters": t.inputSchema,
            },
        }
        for t in mcp_tools
    ]


async def run(goal: str) -> None:
    client = AsyncOpenAI(base_url=BASE_URL, api_key=API_KEY)

    async with stdio_client(DESKTOP_COMMANDER) as (read, write):
        async with ClientSession(read, write) as mcp:
            await mcp.initialize()
            tools = mcp_to_openai_tools((await mcp.list_tools()).tools)

            messages: list[dict] = [{"role": "user", "content": goal}]

            while True:
                resp = await client.chat.completions.create(
                    model=MODEL,
                    messages=messages,
                    tools=tools,
                    max_tokens=4096,
                )
                msg = resp.choices[0].message

                if not msg.tool_calls:
                    print(msg.content or "")
                    return

                # Echo the assistant turn (with its tool_calls) back into history.
                messages.append(msg.model_dump(exclude_none=True))

                for call in msg.tool_calls:
                    name = call.function.name
                    try:
                        args = json.loads(call.function.arguments or "{}")
                    except json.JSONDecodeError:
                        # Local models sometimes emit malformed JSON args.
                        messages.append({
                            "role": "tool",
                            "tool_call_id": call.id,
                            "content": "Error: tool arguments were not valid JSON.",
                        })
                        continue

                    if should_allow_tool(name, args):
                        out = await mcp.call_tool(name, args)
                        text = "".join(
                            c.text for c in out.content
                            if getattr(c, "type", None) == "text"
                        )
                        content = text or "(no output)"
                    else:
                        content = f"Tool '{name}' was blocked by local policy."

                    messages.append({
                        "role": "tool",
                        "tool_call_id": call.id,
                        "content": content,
                    })


if __name__ == "__main__":
    if len(sys.argv) < 2:
        print('Usage: python dc_local_agent.py "<your goal>"')
        raise SystemExit(1)
    asyncio.run(run(sys.argv[1]))
