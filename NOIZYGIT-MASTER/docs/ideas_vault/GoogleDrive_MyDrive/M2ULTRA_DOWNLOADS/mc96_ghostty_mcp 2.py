#!/usr/bin/env python3
"""
MC96 GHOSTTY MCP v0.1 — Sovereign terminal control plane
Zero dependencies. Python stdlib only. MIT-clean. RSP_001 authority.
Rule Zero: 1 command -> 1 action -> 1 receipt.

Tools:
  ghostty_version       - installed version
  ghostty_list_themes   - all available themes (filterable)
  ghostty_get_config    - read current config file
  ghostty_set_config    - set/replace a config key (receipt + backup)
  ghostty_set_theme     - shortcut: set theme key
  ghostty_run           - open new Ghostty window running a command
  ghostty_reload_hint   - how to reload config (Ghostty has no CLI reload)

Install (Claude Code):
  claude mcp add ghostty -- python3 /Users/m2ultra/RSPNOIZY/THE-GATHERING/tools/mc96_ghostty_mcp.py

Install (claude_desktop_config.json):
  {"mcpServers":{"ghostty":{"command":"python3",
   "args":["/Users/m2ultra/RSPNOIZY/THE-GATHERING/tools/mc96_ghostty_mcp.py"]}}}
"""
import json
import os
import re
import shutil
import subprocess
import sys
import time
from datetime import datetime, timezone

HOME = os.path.expanduser("~")
CONFIG_PATH = os.environ.get("GHOSTTY_CONFIG",
    os.path.join(HOME, ".config", "ghostty", "config"))
RECEIPTS = os.environ.get("MC96_RECEIPTS",
    os.path.join(HOME, "RSPNOIZY", "THE-GATHERING", "receipts"))
GHOSTTY_BIN = shutil.which("ghostty") or \
    "/Applications/Ghostty.app/Contents/MacOS/ghostty"

# ---------- receipts (Rule Zero) ----------
def receipt(action, detail):
    try:
        os.makedirs(RECEIPTS, exist_ok=True)
        path = os.path.join(RECEIPTS,
            f"ghostty_mcp_{datetime.now().strftime('%Y%m%d')}.jsonl")
        with open(path, "a") as f:
            f.write(json.dumps({
                "ts": datetime.now(timezone.utc).isoformat(),
                "authority": "RSP_001", "mode": "NOIZYBEAST",
                "action": action, "detail": detail}) + "\n")
    except Exception:
        pass  # receipts must never break the tool

def run_cli(args, timeout=10):
    try:
        r = subprocess.run([GHOSTTY_BIN] + args, capture_output=True,
                           text=True, timeout=timeout)
        return r.returncode, r.stdout.strip(), r.stderr.strip()
    except FileNotFoundError:
        return 127, "", f"ghostty binary not found at {GHOSTTY_BIN}"
    except subprocess.TimeoutExpired:
        return 124, "", "ghostty CLI timed out"

# ---------- tool implementations ----------
def t_version(_):
    code, out, err = run_cli(["+version"])
    return out or err

def t_list_themes(a):
    code, out, err = run_cli(["+list-themes", "--plain"], timeout=15)
    if code != 0:
        code, out, err = run_cli(["+list-themes"], timeout=15)
    themes = [l.strip() for l in out.splitlines() if l.strip()]
    flt = (a or {}).get("filter", "")
    if flt:
        themes = [t for t in themes if flt.lower() in t.lower()]
    return "\n".join(themes[:200]) or err or "no themes found"

def t_get_config(_):
    if not os.path.exists(CONFIG_PATH):
        return f"(no config file at {CONFIG_PATH} — Ghostty uses defaults)"
    with open(CONFIG_PATH) as f:
        return f.read()

def t_set_config(a):
    key, value = a.get("key", "").strip(), str(a.get("value", "")).strip()
    if not key:
        return "ERROR: key required"
    os.makedirs(os.path.dirname(CONFIG_PATH), exist_ok=True)
    lines = []
    if os.path.exists(CONFIG_PATH):
        shutil.copy2(CONFIG_PATH, CONFIG_PATH + ".bak")  # backup first
        with open(CONFIG_PATH) as f:
            lines = f.readlines()
    pat = re.compile(rf"^\s*{re.escape(key)}\s*=")
    new = [l for l in lines if not pat.match(l)]
    new.append(f"{key} = {value}\n")
    with open(CONFIG_PATH, "w") as f:
        f.writelines(new)
    receipt("set_config", {"key": key, "value": value})
    return f"OK: {key} = {value} (backup at {CONFIG_PATH}.bak). Reload: cmd+shift+, or restart Ghostty."

def t_set_theme(a):
    return t_set_config({"key": "theme", "value": a.get("theme", "")})

def t_run(a):
    cmd = a.get("command", "").strip()
    if not cmd:
        return "ERROR: command required"
    # block obviously destructive footguns
    if re.search(r"rm\s+-rf\s+/(\s|$)|mkfs|diskutil\s+erase", cmd):
        receipt("run_BLOCKED", {"command": cmd})
        return "BLOCKED: destructive pattern. Escalate to RSP_001."
    if sys.platform == "darwin":
        osa = ('tell application "Ghostty" to activate\n'
               'tell application "System Events" to keystroke "n" using command down')
        subprocess.run(["osascript", "-e", osa], capture_output=True, timeout=8)
        time.sleep(0.6)
        subprocess.run(["osascript", "-e",
            f'tell application "System Events" to keystroke {json.dumps(cmd)}\n'
            'tell application "System Events" to key code 36'],
            capture_output=True, timeout=8)
        receipt("run", {"command": cmd})
        return f"Sent to new Ghostty window: {cmd}"
    code, out, err = run_cli(["-e", cmd], timeout=15)
    receipt("run", {"command": cmd, "code": code})
    return out or err or f"exit {code}"

def t_reload_hint(_):
    return ("Ghostty reloads config with cmd+shift+, (macOS) or ctrl+shift+, "
            "(Linux), or via the menu: Ghostty > Reload Configuration. "
            "There is no CLI reload command by design.")

TOOLS = {
  "ghostty_version":     (t_version,     "Get installed Ghostty version", {}),
  "ghostty_list_themes": (t_list_themes, "List available Ghostty themes",
      {"filter": {"type": "string", "description": "substring filter"}}),
  "ghostty_get_config":  (t_get_config,  "Read the Ghostty config file", {}),
  "ghostty_set_config":  (t_set_config,  "Set a config key=value (backs up, receipts)",
      {"key": {"type": "string"}, "value": {"type": "string"}}),
  "ghostty_set_theme":   (t_set_theme,   "Set the Ghostty theme",
      {"theme": {"type": "string"}}),
  "ghostty_run":         (t_run,         "Open new Ghostty window running a command",
      {"command": {"type": "string"}}),
  "ghostty_reload_hint": (t_reload_hint, "How to reload Ghostty config", {}),
}

# ---------- minimal MCP stdio JSON-RPC ----------
def reply(id_, result=None, error=None):
    msg = {"jsonrpc": "2.0", "id": id_}
    if error: msg["error"] = error
    else:     msg["result"] = result
    sys.stdout.write(json.dumps(msg) + "\n"); sys.stdout.flush()

def main():
    receipt("server_start", {"config": CONFIG_PATH, "bin": GHOSTTY_BIN})
    for line in sys.stdin:
        line = line.strip()
        if not line: continue
        try: req = json.loads(line)
        except json.JSONDecodeError: continue
        m, id_ = req.get("method"), req.get("id")
        if m == "initialize":
            reply(id_, {"protocolVersion": "2024-11-05",
                "capabilities": {"tools": {}},
                "serverInfo": {"name": "mc96-ghostty", "version": "0.1.0"}})
        elif m == "notifications/initialized":
            continue
        elif m == "tools/list":
            reply(id_, {"tools": [
                {"name": n, "description": d,
                 "inputSchema": {"type": "object", "properties": p,
                                 "required": [k for k in p]}}
                for n, (_, d, p) in TOOLS.items()]})
        elif m == "tools/call":
            name = req["params"]["name"]
            args = req["params"].get("arguments", {})
            fn = TOOLS.get(name, (None,))[0]
            if not fn:
                reply(id_, error={"code": -32601, "message": f"unknown tool {name}"})
                continue
            try:
                out = fn(args)
                reply(id_, {"content": [{"type": "text", "text": str(out)}]})
            except Exception as e:
                reply(id_, {"content": [{"type": "text",
                    "text": f"ERROR: {e}"}], "isError": True})
        elif id_ is not None:
            reply(id_, error={"code": -32601, "message": f"unknown method {m}"})

if __name__ == "__main__":
    main()
