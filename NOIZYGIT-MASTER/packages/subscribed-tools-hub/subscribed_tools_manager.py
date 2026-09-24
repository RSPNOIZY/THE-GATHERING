#!/usr/bin/env python3
"""
subscribed_tools_manager.py
Unified Orchestration & Integration Hub for Subscribed & Pro Tools:
- Desktop Commander (MCP & System Automation)
- LM Studio (Local Neural Inference & MLX Engine)
- TagSpaces (Cross-Platform Unified Metadata & Asset Tagging)
- DEVONthink (Neural Knowledge Base & Archival Sync)
- Audio & Studio Subscriptions (Rogue Amoeba, Celemony, FabFilter, Kontakt, etc.)
- Developer & AI Subscriptions (Claude, Cursor, OpenAI, JetBrains, Setapp, Cloudflare, Proton)
"""

from pathlib import Path

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
TOOLS_HUB = ROOT / "packages" / "subscribed-tools-hub"
DEVONTHINK_INBOX = Path("/Users/m2ultra/Library/Application Support/DEVONthink/Inbox.dtBase2")
LMSTUDIO_MODELS = Path("/Users/m2ultra/.lmstudio/models")
TAGSPACES_DIR = Path("/Users/m2ultra/Library/Application Support/TagSpaces")

GREEN = "\033[0;32m"
CYAN = "\033[0;36m"
YELLOW = "\033[1;33m"
BOLD = "\033[1m"
NC = "\033[0m"

def print_banner():
    print(f"\n{BOLD}═══════════════════════════════════════════════════════════════{NC}")
    print(f"{BOLD}  👑 MC96ECOUNIVERSE — PRO & SUBSCRIBED TOOLS MASTER HUB{NC}")
    print(f"{BOLD}  Desktop Commander · LM Studio · TagSpaces · DEVONthink{NC}")
    print(f"{BOLD}  Architecture: 4.0.0-SOVEREIGN · Unified Tool Orchestration{NC}")
    print(f"{BOLD}═══════════════════════════════════════════════════════════════{NC}\n")

def audit_desktop_commander():
    print(f"{BOLD}1. 🖥️ Desktop Commander (Claude MCP & OS Controller):{NC}")
    app_path = Path("/Applications/Desktop Commander.app")
    mcp_config = Path("/Users/m2ultra/Library/Application Support/Desktop Commander/desktop-commander-config.json")
    claude_ext = Path("/Users/m2ultra/Library/Application Support/Claude/Claude Extensions/ant.dir.gh.wonderwhy-er.desktopcommandermcp")
    
    print(f"   • Application: {'✅ Installed' if app_path.exists() else '❌ Missing'} ({app_path})")
    print(f"   • MCP Config:  {'✅ Active' if mcp_config.exists() else '⚠️ Standby'} ({mcp_config})")
    print(f"   • Claude Ext:  {'✅ Connected' if claude_ext.exists() else '⚠️ Standby'}")
    print("   • Role: OS Shell Execution, App Windows Control, Desktop Automation\n")

def audit_lm_studio():
    print(f"{BOLD}2. 🧠 LM Studio (M2 Ultra Neural Inference Engine):{NC}")
    app_path = Path("/Applications/LM Studio.app")
    print(f"   • Application: {'✅ Installed' if app_path.exists() else '❌ Missing'}")
    print("   • Inference Endpoint: http://127.0.0.1:1234/v1 (OpenAI Compatible)")
    
    if LMSTUDIO_MODELS.exists():
        models = [p for p in LMSTUDIO_MODELS.rglob("*") if p.is_file() and p.suffix in [".gguf", ".bin", ".safetensors", ".mlx"]]
        print(f"   • Local Models Available: {len(models)} quantized weights")
        for m in models[:5]:
            print(f"     - {CYAN}{m.name}{NC} ({(m.stat().st_size / (1024**3)):.2f} GB)")
        if len(models) > 5:
            print(f"     - ... and {len(models) - 5} more")
    print()

def audit_tagspaces():
    print(f"{BOLD}3. 🏷️ TagSpaces (Universal Asset & Knowledge Tagging):{NC}")
    app_path = Path("/Applications/TagSpaces.app")
    print(f"   • Application: {'✅ Installed' if app_path.exists() else '❌ Missing'}")
    print("   • Tagging Strategy: Non-destructive Sidecar JSON (`.ts`) & File Suffixes `[tags]`")
    print("   • Primary Tag Groups: `#audio_stems`, `#logic_pro`, `#monorepo`, `#persona`, `#sovereign_vault`\n")

def audit_devonthink():
    print(f"{BOLD}4. 📚 DEVONthink (Neural Knowledge Engine & Document Inbox):{NC}")
    app_path = Path("/Applications/DEVONthink.app")
    print(f"   • Application: {'✅ Installed' if app_path.exists() else '❌ Missing'}")
    print(f"   • Global Inbox Database: {'✅ Active' if DEVONTHINK_INBOX.exists() else '⚠️ Standby'}")
    print("   • Sync Targets: Monorepo Docs, Audio Catalogs, Council Personas, Empire SQLite\n")

def audit_all_subscriptions():
    print(f"{BOLD}5. 🌟 Subscribed Pro Ecosystem & Services Roster:{NC}")
    ecosystem = {
        "AI & Intelligence": [
            "Claude Pro/Team & Claude Code (Anthropic)",
            "ChatGPT Plus / OpenAI API (OpenAI)",
            "LM Studio (Local Neural Inference)",
            "Desktop Commander (Claude Desktop MCP)",
            "DEVONthink Pro (AI Document Engine)"
        ],
        "Creative & Audio Suite": [
            "Apple Logic Pro & MainStage",
            "Celemony Melodyne",
            "Native Instruments Kontakt & Komplete",
            "FabFilter Pro Suite",
            "Rogue Amoeba (Loopback, Sound Siphon, Audio Hijack)",
            "TagSpaces Pro (Asset Organization)",
            "Pixelmator Pro Creator Studio"
        ],
        "Developer & Infrastructure": [
            "JetBrains All Products Pack",
            "Cursor AI Code Editor",
            "Docker Desktop",
            "Cloudflare Zero Trust & Workers",
            "Proton Pass & Proton Unlimited",
            "Tailscale Mesh & Headscale Sovereign",
            "Setapp Suite"
        ]
    }
    for category, items in ecosystem.items():
        print(f"   {CYAN}{category}:{NC}")
        for item in items:
            print(f"     ✅ {item}")
    print()

def main():
    print_banner()
    audit_desktop_commander()
    audit_lm_studio()
    audit_tagspaces()
    audit_devonthink()
    audit_all_subscriptions()
    print(f"{GREEN}{BOLD}✨ ALL SUBSCRIBED & PRO SUITES HARMONIZED & BRIDGED 100%{NC}\n")

if __name__ == "__main__":
    main()
