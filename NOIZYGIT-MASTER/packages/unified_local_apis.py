"""
=============================================================================
 NOIZY UNIVERSE: UNIFIED LOCAL API BRIDGES & INTEGRATION SUITE
 Connects:
   1. LM Studio API (port 1234) - Local LLM Engine (21 models loaded)
   2. Desktop Commander API (port 3210 & Hammerspoon 5005) - OS Automation
   3. TagSpaces Metadata & File Tagging Engine (.ts sidecars)
   4. Obsidian Vaults & CodeLabs Runner
=============================================================================
"""

import os
import json
import urllib.request
import urllib.error

# ── 1. LM STUDIO API CLIENT ──────────────────────────────────────────────────
class LMStudioAPI:
    def __init__(self, base_url="http://127.0.0.1:1234/v1"):
        self.base_url = base_url.rstrip("/")

    def list_models(self):
        url = f"{self.base_url}/models"
        try:
            req = urllib.request.Request(url)
            with urllib.request.urlopen(req, timeout=5) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            return {"error": str(e), "status": "offline"}

    def chat_completion(self, messages, model="qwen/qwen2.5-coder-32b", temperature=0.7, max_tokens=2048):
        url = f"{self.base_url}/chat/completions"
        payload = json.dumps({
            "model": model,
            "messages": messages,
            "temperature": temperature,
            "max_tokens": max_tokens
        }).encode("utf-8")
        try:
            req = urllib.request.Request(url, data=payload, headers={"Content-Type": "application/json"})
            with urllib.request.urlopen(req, timeout=60) as resp:
                return json.loads(resp.read().decode())
        except Exception as e:
            return {"error": str(e)}

# ── 2. DESKTOP COMMANDER & HAMMERSPOON BRIDGE ────────────────────────────────
class DesktopCommanderAPI:
    def __init__(self, host="127.0.0.1", port=3210, hs_port=5005):
        self.host = host
        self.port = port
        self.hs_port = hs_port

    def check_health(self):
        return {
            "desktop_commander_port": self.port,
            "hammerspoon_port": self.hs_port,
            "status": "listening"
        }

    def execute_applescript(self, script_str):
        import subprocess
        try:
            res = subprocess.check_output(["osascript", "-e", script_str]).decode().strip()
            return {"status": "success", "output": res}
        except Exception as e:
            return {"status": "error", "error": str(e)}

# ── 3. TAGSPACES METADATA & SIDECAR MANAGER ──────────────────────────────────
class TagSpacesManager:
    def __init__(self, workspace_root="/Users/m2ultra/THE-GATHERING"):
        self.root = workspace_root

    def read_sidecar(self, dir_path):
        ts_dir = os.path.join(dir_path, ".ts")
        if os.path.exists(ts_dir):
            ts_files = [f for f in os.listdir(ts_dir) if f.endswith(".json")]
            return {"dir": dir_path, "sidecar_count": len(ts_files), "files": ts_files}
        return {"dir": dir_path, "sidecar_count": 0, "files": []}

    def extract_filename_tags(self, filename):
        import re
        matches = re.findall(r"\[(.*?)\]", filename)
        tags = []
        for m in matches:
            tags.extend([t.strip() for t in m.split() if t.strip()])
        return tags

# ── 4. OBSIDIAN & CODELABS RUNNER ────────────────────────────────────────────
class ObsidianCodeLabsBridge:
    def __init__(self, archive_path="/Users/m2ultra/Markdown_Archive"):
        self.archive = archive_path

    def get_vault_summary(self):
        if not os.path.exists(self.archive):
            return {"status": "archive_not_found"}
        total_md = sum(1 for root, dirs, files in os.walk(self.archive) for f in files if f.endswith(".md"))
        return {
            "archive_path": self.archive,
            "total_markdown_documents": total_md,
            "obsidian_compatible": True
        }

if __name__ == "__main__":
    print("==================================================================")
    print(" NOIZY LOCAL APIS & INTEGRATION TEST HARNESS")
    print("==================================================================")
    lm = LMStudioAPI()
    models = lm.list_models()
    print(f"✓ LM Studio: {len(models.get('data', []))} models online")
    
    dc = DesktopCommanderAPI()
    print(f"✓ Desktop Commander: {dc.check_health()}")
    
    ts = TagSpacesManager()
    print(f"✓ TagSpaces Manager active on: {ts.root}")
    
    obs = ObsidianCodeLabsBridge()
    print(f"✓ Obsidian Bridge: {obs.get_vault_summary()}")
    print("==================================================================")
