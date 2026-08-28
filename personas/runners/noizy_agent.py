"""
noizy_agent.py — Persona runner for the NOIZY Empire.

Embodies GABRIEL (System Bridge / executor) and LUCY (Archivist / DAZEFLOW keeper),
each driving its own MCP toolset with a system prompt synthesized from its
dreamchamber profile, over hybrid local↔Claude routing.

LOCAL MODELS: every model on every local OpenAI-compatible server (Ollama :11434
+ LM Studio :1234) is discovered live and available to BOTH personas. Each model
is auto-routed to the endpoint that actually hosts it.

  --model auto            hybrid: local first, escalate to Claude when it struggles (default)
  --model gemma-4-31B-it  any discovered local model (run --list-models to see them)
  --model claude-opus-4-8 force Claude
  --list-models           show the full local inventory across all servers
  --list-tools            show the persona's MCP tools

Install:  ~/.noizy/venv/bin/pip install openai anthropic "mcp"
Run:      ~/.noizy/venv/bin/python noizy_agent.py gabriel "Snapshot cache, announce status"
          ~/.noizy/venv/bin/python noizy_agent.py lucy --list-models
"""

import argparse
import asyncio
import json
import os
import sys
import urllib.request

from mcp import ClientSession, StdioServerParameters
from mcp.client.stdio import stdio_client

EMPIRE_ROOT = os.path.expanduser("~/THE-GATHERING")
ENV_FILE = f"{EMPIRE_ROOT}/.env"
PROFILE_DIR = f"{EMPIRE_ROOT}/personas/profiles"
MCP_DIR = f"{EMPIRE_ROOT}/personas/mcp_servers"

CLAUDE_MODEL_DEFAULT = "claude-opus-4-8"
LOCAL_API_KEY = os.environ.get("LOCAL_API_KEY", "local")
MAX_LOCAL_STEPS = 8
MAX_BAD_JSON = 2

# Every local OpenAI-compatible server we know about. Models from all of these
# are pooled and offered to both personas.
LOCAL_ENDPOINTS = [
    ("ollama",   os.environ.get("OLLAMA_URL",   "http://localhost:11434/v1")),
    ("lmstudio", os.environ.get("LMSTUDIO_URL", "http://localhost:1234/v1")),
]

# Order in which `auto` mode picks a local model when the persona default is absent.
PREFERRED_LOCAL = ["qwen2.5:32b", "qwen2.5-coder:32b", "gemma3:latest", "gemma3",
                   "phi4", "phi-4", "gemma-4-31B-it", "llama3.2:3b"]

PERSONAS_LIST = [
    "gabriel", "lucy", "pops", "engr_keith", "dream", "heaven17",
    "cb01", "cb02", "cb03", "cb04", "cb05", "shirl", "alex_ward"
]

PERSONAS = {
    name: {
        "server": f"{MCP_DIR}/{name}-mcp/index.js",
        "profile": f"{PROFILE_DIR}/{name}-profile.json",
        "local_model": "qwen2.5:32b",
        "claude_model": "claude-opus-4-8",
    } for name in PERSONAS_LIST
}


def is_claude(model: str) -> bool:
    return model.startswith("claude")


# ── Local-model discovery across all servers ─────────────────────────────────
def discover_local_models() -> dict:
    """Return {model_id: (endpoint_label, base_url)} for every reachable server."""
    found: dict[str, tuple[str, str]] = {}
    for label, base in LOCAL_ENDPOINTS:
        try:
            req = urllib.request.Request(base + "/models")
            with urllib.request.urlopen(req, timeout=3) as r:
                data = json.load(r)
            for m in data.get("data", []):
                found.setdefault(m["id"], (label, base))
        except Exception:
            pass  # server not running — skip silently
    return found


def print_inventory(inv: dict) -> None:
    if not inv:
        print("  (no local model servers reachable — start Ollama or LM Studio)")
        return
    by_ep: dict[str, list[str]] = {}
    for mid, (label, _) in inv.items():
        by_ep.setdefault(label, []).append(mid)
    for label in sorted(by_ep):
        print(f"  [{label}]")
        for mid in sorted(by_ep[label]):
            print(f"     {mid}")


# ── System prompt from dreamchamber profile ──────────────────────────────────
def build_system(profile: dict, persona: str) -> str:
    L = [f"You are {persona.upper()}, an agent in the NOIZY Empire serving operator "
         f"RSP_001 (Robert Stephen Plowman). You act through your MCP tools — you are "
         f"his hands, not his advisor. Execute, don't merely describe."]
    idn = profile.get("identity", {})
    for k in ("name", "role", "character", "mission", "lifeluv"):
        if idn.get(k):
            L.append(f"{k.capitalize()}: {idn[k]}")
    for label, key in (("Owns", "owns"), ("Standing orders", "standing_orders")):
        if idn.get(key):
            L.append(f"{label}: " + "; ".join(idn[key]))
    for section in ("workingStyle", "communicationPreferences"):
        vals = profile.get(section, {})
        if vals:
            L.append(f"{section}: " + " ".join(str(v) for v in vals.values()))
    if profile.get("hardRules"):
        L.append("Hard rules:\n" + "\n".join(f"- {r}" for r in profile["hardRules"]))
    learnings = profile.get("learnings", [])[:6]
    if learnings:
        L.append("Current operational context:\n" +
                 "\n".join(f"- {l.get('observation', '')}" for l in learnings))
    return "\n".join(L)


# ── Security gate (auto-allow persona state tools; --gate to confirm) ─────────
GATE = False


def should_allow_tool(name: str, args: dict) -> bool:
    if not GATE:
        print(f"  · {name}({json.dumps(args)[:100]})")
        return True
    print(f"\n⚠️  {name}({args})")
    return input("Allow? [y/N] ").strip().lower() == "y"


class Escalate(Exception):
    def __init__(self, reason, notes):
        super().__init__(reason); self.reason = reason; self.notes = notes


async def call_mcp(mcp, name, args) -> str:
    out = await mcp.call_tool(name, args)
    return "".join(c.text for c in out.content
                   if getattr(c, "type", None) == "text") or "(no output)"


def to_openai_tools(t):
    return [{"type": "function", "function": {
        "name": x.name, "description": x.description or "", "parameters": x.inputSchema}} for x in t]


def to_anthropic_tools(t):
    return [{"name": x.name, "description": x.description or "", "input_schema": x.inputSchema} for x in t]


# ── Local backend (any discovered endpoint) ──────────────────────────────────
async def run_local(mcp, mcp_tools, model, base_url, system, goal, *, allow_escalate):
    from openai import AsyncOpenAI
    client = AsyncOpenAI(base_url=base_url, api_key=LOCAL_API_KEY)
    tools = to_openai_tools(mcp_tools)
    messages = [{"role": "system", "content": system + "\nIf a task is beyond you, "
                 "reply with one line starting 'ESCALATE:' and a short reason."},
                {"role": "user", "content": goal}]
    notes, bad = [], 0
    for _ in range(MAX_LOCAL_STEPS):
        resp = await client.chat.completions.create(
            model=model, messages=messages, tools=tools, max_tokens=4096)
        msg = resp.choices[0].message
        if msg.content and msg.content.strip().startswith("ESCALATE:"):
            if allow_escalate:
                raise Escalate(msg.content.strip(), notes)
            print(msg.content); return
        if not msg.tool_calls:
            print(msg.content or ""); return
        messages.append(msg.model_dump(exclude_none=True))
        for call in msg.tool_calls:
            name = call.function.name
            try:
                args = json.loads(call.function.arguments or "{}"); bad = 0
            except json.JSONDecodeError:
                bad += 1
                if allow_escalate and bad >= MAX_BAD_JSON:
                    raise Escalate("local model produced malformed tool calls", notes)
                messages.append({"role": "tool", "tool_call_id": call.id,
                                 "content": "Error: tool args were not valid JSON."}); continue
            if should_allow_tool(name, args):
                content = await call_mcp(mcp, name, args)
                notes.append(f"{name} -> {content[:200]}")
            else:
                content = f"Tool '{name}' blocked."
            messages.append({"role": "tool", "tool_call_id": call.id, "content": content})
    if allow_escalate:
        raise Escalate(f"local model exceeded {MAX_LOCAL_STEPS} steps", notes)
    print("(local model hit step limit)")


# ── Claude backend ───────────────────────────────────────────────────────────
async def run_claude(mcp, mcp_tools, model, system, goal, *, prior_notes=None):
    import anthropic
    client = anthropic.AsyncAnthropic()
    tools = to_anthropic_tools(mcp_tools)
    prompt = goal
    if prior_notes:
        prompt += "\n\n[Local model attempted first; observed:]\n" + "\n".join(f"- {n}" for n in prior_notes)
    messages = [{"role": "user", "content": prompt}]
    while True:
        resp = await client.messages.create(
            model=model, max_tokens=16000, system=system,
            thinking={"type": "adaptive"}, output_config={"effort": "high"},
            tools=tools, messages=messages)
        if resp.stop_reason != "tool_use":
            print(next((b.text for b in resp.content if b.type == "text"), "")); return
        messages.append({"role": "assistant", "content": resp.content})
        results = []
        for b in resp.content:
            if b.type != "tool_use":
                continue
            if should_allow_tool(b.name, b.input):
                content = await call_mcp(mcp, b.name, b.input)
                results.append({"type": "tool_result", "tool_use_id": b.id, "content": content})
            else:
                results.append({"type": "tool_result", "tool_use_id": b.id,
                                "content": f"Tool '{b.name}' blocked.", "is_error": True})
        messages.append({"role": "user", "content": results})


def resolve_local(model: str, inv: dict):
    """Pick (model, base_url) for a local run. model='auto' chooses a preferred one."""
    if model != "auto":
        if model in inv:
            return model, inv[model][1]
        return None, None
    for cand in PREFERRED_LOCAL:
        if cand in inv:
            return cand, inv[cand][1]
    if inv:  # nothing preferred present — take any
        any_id = next(iter(inv))
        return any_id, inv[any_id][1]
    return None, None


# ── Orchestrator ─────────────────────────────────────────────────────────────
async def main():
    ap = argparse.ArgumentParser(description="NOIZY Empire persona runner.")
    ap.add_argument("persona", choices=list(PERSONAS), help=" | ".join(PERSONAS.keys()))
    ap.add_argument("goal", nargs="?", help="What the persona should do.")
    ap.add_argument("--model", default="auto", help="auto | <local model id> | claude-opus-4-8")
    ap.add_argument("--gate", action="store_true", help="Confirm each tool call.")
    ap.add_argument("--list-tools", action="store_true")
    ap.add_argument("--list-models", action="store_true", help="List local models across all servers.")
    args = ap.parse_args()

    if args.list_models:
        print("Local model inventory (shared by gabriel + lucy):")
        print_inventory(discover_local_models())
        return

    global GATE
    GATE = args.gate
    p = PERSONAS[args.persona]
    profile = json.load(open(p["profile"]))
    system = build_system(profile, args.persona)

    server = StdioServerParameters(
        command="node",
        args=[f"--env-file={ENV_FILE}", p["server"]],
        env={**os.environ, "NOIZY_EMPIRE_ROOT": EMPIRE_ROOT},
    )

    async with stdio_client(server) as (read, write):
        async with ClientSession(read, write) as mcp:
            await mcp.initialize()
            mcp_tools = (await mcp.list_tools()).tools

            if args.list_tools:
                print(f"{args.persona.upper()} — {len(mcp_tools)} tools:")
                for t in mcp_tools:
                    print(f"  {t.name:26} {(t.description or '').splitlines()[0][:60]}")
                return
            if not args.goal:
                ap.error("a goal is required (unless --list-tools / --list-models)")

            claude_model = p["claude_model"]
            if is_claude(args.model):
                await run_claude(mcp, mcp_tools, args.model, system, args.goal)
                return

            inv = discover_local_models()
            wanted = p["local_model"] if args.model == "auto" else args.model
            model, base = resolve_local("auto" if args.model == "auto" else wanted, inv) \
                if args.model == "auto" else resolve_local(wanted, inv)

            if args.model == "auto":
                if not model:
                    print("(no local models reachable — using Claude)\n")
                    await run_claude(mcp, mcp_tools, claude_model, system, args.goal)
                    return
                print(f"[{args.persona}] local={model}  fallback={claude_model}")
                try:
                    await run_local(mcp, mcp_tools, model, base, system, args.goal, allow_escalate=True)
                except Escalate as e:
                    print(f"\n↑ {args.persona.upper()} escalating to {claude_model}: {e.reason}\n")
                    await run_claude(mcp, mcp_tools, claude_model, system, args.goal, prior_notes=e.notes)
            else:
                if not model:
                    avail = ", ".join(sorted(inv)) or "none"
                    ap.error(f"model '{args.model}' not found locally. Available: {avail}")
                await run_local(mcp, mcp_tools, model, base, system, args.goal, allow_escalate=False)


if __name__ == "__main__":
    asyncio.run(main())
