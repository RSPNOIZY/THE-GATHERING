#!/usr/bin/env python3
"""
group_applications_best_practices.py
Scans applications in /Users/m2ultra/Applications and /Applications.
Creates categorized 'Use & Best Practice' subfolder symlinks in /Users/m2ultra/Applications.
Generates APPLICATIONS_BEST_PRACTICES_GUIDE.md.
"""

from pathlib import Path

USER_APPS = Path("/Users/m2ultra/Applications")
SYSTEM_APPS = Path("/Applications")
MONOREPO_DOCS = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/architecture")
MONOREPO_DOCS.mkdir(parents=True, exist_ok=True)

CATEGORIES = {
    "01_AI_&_Neural_Intelligence": {
        "title": "AI, Neural Intelligence & LLM Workspaces",
        "description": "Large language model interfaces, local AI engines, voice transcriptions, and assistant bridges",
        "keywords": ["claude", "chatgpt", "ollama", "lm studio", "whisper", "itermAI", "wispr", "ai", "transcription", "gemini", "antigravity"]
    },
    "02_Audio_DAW_&_Music_IP": {
        "title": "Audio Engineering, DAW & DSP Suites",
        "description": "Logic Pro, Universal Audio, Native Instruments, Audio Units, Loopback routing, and DJ tools",
        "keywords": ["logic", "universal audio", "ua connect", "ilok", "djay", "voicechanger", "volume booster", "db meter", "to mp3", "videohub", "audio", "imovie"]
    },
    "03_Developer_IDEs_&_Terminal": {
        "title": "Developer IDEs, Cloud Terminals & SDKs",
        "description": "Visual Studio Code, Xcode, Warp, iTerm, Termius, Postman, Transmit, and Git tooling",
        "keywords": ["visual studio code", "xcode", "warp", "iterm", "termius", "terminux", "termix", "xterminal", "vvterm", "transmit", "transporter", "testflight", "turbowarp", "typst", "templates for swift", "pbxproj"]
    },
    "04_NOIZY_VOX_&_Empire_Runtimes": {
        "title": "NOIZY VOX & Sovereign Empire Runtimes",
        "description": "NOIZY VOX live, ingest, status, start/stop hooks and agent communication bridges",
        "keywords": ["noizy", "vox", "gabriel", "lucy", "websitepublisher"]
    },
    "05_Cloud_Databases_&_Governance": {
        "title": "Cloud, Databases, Sync & Governance",
        "description": "Database management, Notion, Trello, Monday, Valentina Studio, and cloud storage clients",
        "keywords": ["valentina", "notion", "trello", "monday", "ugreen nas", "virtualos", "utm", "uipath", "wappalyzer"]
    },
    "06_Creative_Video_&_Graphics": {
        "title": "Creative Media, Video Production & Design",
        "description": "Krita, Kdenlive, GIMP, Aseprite, iCreator, and media conversion engines",
        "keywords": ["krita", "kdenlive", "youcut", "icreator", "gimp", "aseprite", "text toolset", "translatekit", "itranslate"]
    },
    "07_System_Security_&_Utilities": {
        "title": "Security, Network Tunneling & Utilities",
        "description": "Tailscale, WireGuard, ZeroTier, Talon Voice Control, DEVONsphere, The Unarchiver, XMenu",
        "keywords": ["tailscale", "wireguard", "zerotier", "talon", "devonsphere", "the unarchiver", "xmenu", "wordservice", "wifi analyzer", "techtool", "ihosts", "verify"]
    }
}

def scan_and_group():
    print(f"Scanning Applications and organizing into {USER_APPS}...")
    
    all_apps = {}
    
    # Scan System Applications
    if SYSTEM_APPS.exists():
        for item in SYSTEM_APPS.iterdir():
            if item.suffix == ".app" or item.is_dir() and not item.name.startswith("."):
                all_apps[item.name] = item
                
    # Scan User Applications
    if USER_APPS.exists():
        for item in USER_APPS.iterdir():
            if item.suffix == ".app" or (item.name.endswith(".localized") and item.name.startswith("0") is False):
                all_apps[item.name] = item
                
    print(f"Found {len(all_apps)} total applications across system & user paths.")
    
    # Create category folders & symlinks
    categorized = {k: [] for k in CATEGORIES}
    
    for cat_folder, info in CATEGORIES.items():
        cat_path = USER_APPS / cat_folder
        cat_path.mkdir(exist_ok=True)
        
        for app_name, app_path in all_apps.items():
            app_lower = app_name.lower()
            if any(k in app_lower for k in info["keywords"]):
                symlink_target = cat_path / app_name
                categorized[cat_folder].append((app_name, app_path))
                if not symlink_target.exists():
                    try:
                        symlink_target.symlink_to(app_path)
                    except Exception:
                        pass
                        
    # Generate Guide
    guide_md = """# 🚀 NOIZY Applications — Use & Best Practice Guide

*Organized by Functional Roles & Production Workflows*  
*Root: `/Users/m2ultra/Applications`*

---

"""
    for cat_folder, info in CATEGORIES.items():
        apps_in_cat = categorized[cat_folder]
        guide_md += f"## 📁 [`{cat_folder}/`](file://{USER_APPS}/{cat_folder})\n"
        guide_md += f"### **{info['title']}**\n"
        guide_md += f"*{info['description']}*\n\n"
        guide_md += f"**Total Apps:** `{len(apps_in_cat)}`\n\n"
        if apps_in_cat:
            guide_md += "| Application | Original Location | Action / Role |\n| :--- | :--- | :--- |\n"
            for app_name, app_path in sorted(apps_in_cat, key=lambda x: x[0].lower()):
                guide_md += f"| **`{app_name}`** | [`{app_path}`](file://{app_path}) | Launch via symlink in `{cat_folder}/` |\n"
        guide_md += "\n---\n\n"
        
    guide_path = USER_APPS / "APPLICATIONS_BEST_PRACTICES_GUIDE.md"
    with open(guide_path, "w", encoding="utf-8") as f:
        f.write(guide_md)
    print(f"Saved guide to {guide_path}")
    
    monorepo_guide = MONOREPO_DOCS / "APPLICATIONS_DIRECTORY_CATALOG.md"
    with open(monorepo_guide, "w", encoding="utf-8") as f:
        f.write(guide_md)
    print(f"Saved monorepo catalog to {monorepo_guide}")

if __name__ == "__main__":
    scan_and_group()
