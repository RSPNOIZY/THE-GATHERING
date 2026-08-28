"""
dc_agent.py — Unified Desktop Commander agent with hybrid local↔Claude routing.

Supersedes dc_claude_agent.py and dc_local_agent.py. One agent, two backends,
one MCP connection, one security gate.

  • --model phi4 | gemma3 | claude-opus-4-8 | auto
      anything starting with "claude" → Anthropic backend; otherwise local
      (OpenAI-compatible). "auto" = hybrid: try local first, escalate to Claude
      when the local model struggles.
  • Hybrid routing: a small 14B model handles the easy steps cheaply/offline;
      Claude takes over only when the task exceeds the local model's reach.

Install:
    pip install openai anthropic "mcp"          # Python 3.10+
    # Local backend needs a running server:      ollama serve  (+ ollama pull phi4)
    # Claude backend needs:                       export ANTHROPIC_API_KEY=sk-ant-...
    # Node is required so `npx` can launch Desktop Commander.

Examples:
    python dc_agent.py "List the 5 largest files under ~/Downloads"          # auto
    python dc_agent.py --model phi4 "..."                                    # force local
    python dc_agent.py --model claude-opus-4-8 "..."                         # force Claude
    python dc_agent.py --list-tools                                          # inspect DC tools
    python dc_agent.py --base-url http://localhost:1234/v1 --model gemma3 "..."   # LM Studio
"""

import argparse
import asyncio
import json
import os
import sys

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

# ── Configuration ────────────────────────────────────────────────────────────
CLAUDE_MODEL_DEFAULT = "claude-opus-4-8"
LOCAL_BASE_URL = os.environ.get("LOCAL_BASE_URL", "http://localhost:11434/v1")  # Ollama
LOCAL_API_KEY = os.environ.get("LOCAL_API_KEY", "ollama")                       # dummy

# Hybrid escalation thresholds (tune to taste):
MAX_LOCAL_STEPS = 8        # give up on local after this many tool rounds
MAX_BAD_JSON = 2           # consecutive malformed tool calls before escalating

DESKTOP_COMMANDER = StdioServerParameters(
    command="npx",
    args=["-y", "@wonderwhy-er/desktop-commander"],
)

LOCAL_SYSTEM = (
    "You are a careful assistant with file/terminal tools. Work step by step. "
    "If a task is beyond your ability or you get stuck, reply with a single line "
    "starting 'ESCALATE:' followed by a short reason, instead of guessing."
)


def is_claude(model: str) -> bool:
    return model.startswith("claude")


# ── Shared security boundary ─────────────────────────────────────────────────
def should_allow_tool(name: str, args: dict) -> bool:
    """The one decision that governs what the LLM may do to your machine.
    Auto-allow read-only tools; prompt for anything with side effects.
    TODO(you): tighten READ_ONLY to match Desktop Commander's real tool names
    (run `python dc_agent.py --list-tools` to see them)."""
    READ_ONLY = {"read_file", "list_directory", "search_files", "get_file_info"}
    if name in READ_ONLY:
        return True
    print(f"\n⚠️  Wants to run: {name}({args})")
    return input("Allow? [y/N] ").strip().lower() == "y"


class Escalate(Exception):
    """Raised by the local loop to hand the task to Claude."""
    def __init__(self, reason: str, notes: list[str]):
        super().__init__(reason)
        self.reason = reason
        self.notes = notes


# ── MCP helpers ──────────────────────────────────────────────────────────────
async def call_mcp(mcp: ClientSession, name: str, args: dict) -> str:
    out = await mcp.call_tool(name, args)
    return "".join(c.text for c in out.content if getattr(c, "type", None) == "text") or "(no output)"


def to_openai_tools(mcp_tools) -> list[dict]:
    return [{"type": "function",
             "function": {"name": t.name, "description": t.description or "", "parameters": t.inputSchema}}
            for t in mcp_tools]


def to_anthropic_tools(mcp_tools) -> list[dict]:
    return [{"name": t.name, "description": t.description or "", "input_schema": t.inputSchema}
            for t in mcp_tools]


# ── Local backend (OpenAI-compatible) ────────────────────────────────────────
async def run_local(mcp, mcp_tools, model: str, goal: str, *, allow_escalate: bool) -> None:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(base_url=LOCAL_BASE_URL, api_key=LOCAL_API_KEY)
    tools = to_openai_tools(mcp_tools)
    messages = [{"role": "system", "content": LOCAL_SYSTEM},
                {"role": "user", "content": goal}]
    notes: list[str] = []
    bad_json = 0

    for step in range(MAX_LOCAL_STEPS):
        resp = await client.chat.completions.create(
            model=model, messages=messages, tools=tools, max_tokens=4096)
        msg = resp.choices[0].message

        if msg.content and msg.content.strip().startswith("ESCALATE:"):
            if allow_escalate:
                raise Escalate(msg.content.strip(), notes)
            print(msg.content)
            return

        if not msg.tool_calls:
            print(msg.content or "")
            return

        messages.append(msg.model_dump(exclude_none=True))
        for call in msg.tool_calls:
            name = call.function.name
            try:
                args = json.loads(call.function.arguments or "{}")
                bad_json = 0
            except json.JSONDecodeError:
                bad_json += 1
                if allow_escalate and bad_json >= MAX_BAD_JSON:
                    raise Escalate("local model produced malformed tool calls", notes)
                messages.append({"role": "tool", "tool_call_id": call.id,
                                 "content": "Error: tool arguments were not valid JSON."})
                continue

            if should_allow_tool(name, args):
                content = await call_mcp(mcp, name, args)
                notes.append(f"{name}({json.dumps(args)[:120]}) -> {content[:200]}")
            else:
                content = f"Tool '{name}' was blocked by local policy."
            messages.append({"role": "tool", "tool_call_id": call.id, "content": content})

    if allow_escalate:
        raise Escalate(f"local model exceeded {MAX_LOCAL_STEPS} steps without finishing", notes)
    print("(local model hit its step limit without a final answer)")


# ── Claude backend (Anthropic) ───────────────────────────────────────────────
async def run_claude(mcp, mcp_tools, model: str, goal: str, *, prior_notes: list[str] | None = None) -> None:
    import anthropic

    client = anthropic.AsyncAnthropic()
    tools = to_anthropic_tools(mcp_tools)

    prompt = goal
    if prior_notes:
        prompt += "\n\n[A local model attempted this first. What it observed:]\n" + "\n".join(
            f"- {n}" for n in prior_notes)

    messages = [{"role": "user", "content": prompt}]
    while True:
        resp = await client.messages.create(
            model=model, max_tokens=16000,
            thinking={"type": "adaptive"}, output_config={"effort": "high"},
            tools=tools, messages=messages)

        if resp.stop_reason != "tool_use":
            print(next((b.text for b in resp.content if b.type == "text"), ""))
            return

        messages.append({"role": "assistant", "content": resp.content})
        results = []
        for block in resp.content:
            if block.type != "tool_use":
                continue
            if should_allow_tool(block.name, block.input):
                content = await call_mcp(mcp, block.name, block.input)
                results.append({"type": "tool_result", "tool_use_id": block.id, "content": content})
            else:
                results.append({"type": "tool_result", "tool_use_id": block.id,
                                "content": f"Tool '{block.name}' blocked by policy.", "is_error": True})
        messages.append({"role": "user", "content": results})


# ── Orchestrator ─────────────────────────────────────────────────────────────
async def main() -> None:
    ap = argparse.ArgumentParser(description="Desktop Commander agent (local ↔ Claude).")
    ap.add_argument("goal", nargs="?", help="What you want the agent to do.")
    ap.add_argument("--model", default="auto",
                    help="phi4 | gemma3 | claude-opus-4-8 | auto (hybrid). Default: auto.")
    ap.add_argument("--claude-model", default=CLAUDE_MODEL_DEFAULT,
                    help="Claude model for the fallback/forced-Claude path.")
    ap.add_argument("--base-url", help="Override the local OpenAI-compatible base URL.")
    ap.add_argument("--list-tools", action="store_true", help="Print Desktop Commander's tools and exit.")
    args = ap.parse_args()

    if args.base_url:
        global LOCAL_BASE_URL
        LOCAL_BASE_URL = args.base_url

    async with stdio_client(DESKTOP_COMMANDER) as (read, write):
        async with ClientSession(read, write) as mcp:
            await mcp.initialize()
            mcp_tools = (await mcp.list_tools()).tools

            if args.list_tools:
                for t in mcp_tools:
                    print(f"  {t.name:24} {(t.description or '').splitlines()[0][:70]}")
                return

            if not args.goal:
                ap.error("a goal is required (unless --list-tools)")

            if args.model == "auto":                       # hybrid
                try:
                    await run_local(mcp, mcp_tools, "phi4", args.goal, allow_escalate=True)
                except Escalate as e:
                    print(f"\n↑ Escalating to {args.claude_model}: {e.reason}\n")
                    await run_claude(mcp, mcp_tools, args.claude_model, args.goal, prior_notes=e.notes)
            elif is_claude(args.model):                    # forced Claude
                await run_claude(mcp, mcp_tools, args.model, args.goal)
            else:                                          # forced local
                await run_local(mcp, mcp_tools, args.model, args.goal, allow_escalate=False)


if __name__ == "__main__":
    asyncio.run(main())
