#!/usr/bin/env python3
"""
SCRAPE ALL AI IDEATION CHATS — PEACE, LOVE & UNDERSTANDING
Artists Are Wisdom Project Travellors · Master Archive
Cataloging Claude, ChatGPT, Gemini/Antigravity, LM Studio, Cursor, Windsurf, Copilot, and Local LLM Sessions.
"""

import os
import json
import sqlite3
import re
from pathlib import Path
from datetime import datetime

OUTPUT_DB = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/AI_IDEATION_CHATS_MASTER_ARCHIVE.sqlite"
OUTPUT_MD = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/ALL_AI_MODELS_IDEATION_FOR_PEACE_LOVE_UNDERSTANDING.md"
OUTPUT_ROSTER = "/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/canonical/ARTISTS_WISDOM_PROJECT_TRAVELLORS_ROSTER.md"

SEARCH_PATHS = [
    "/Users/m2ultra/THE-GATHERING",
    "/Users/m2ultra/Library/Application Support/Claude",
    "/Users/m2ultra/.lmstudio/conversations",
    "/Users/m2ultra/Desktop/CLAUDE TODAY",
    "/Users/m2ultra/NOIZYANTHROPIC",
    "/Users/m2ultra/Desktop",
    "/Users/m2ultra/Downloads",
    "/Users/m2ultra/.gemini/antigravity-ide/brain",
    "/Users/m2ultra/Library/Application Support/Cursor/User/workspaceStorage",
    "/Users/m2ultra/Library/Application Support/Windsurf",
    "/Volumes/12TB/THE-GATHERING-VAULTS",
    "/Volumes/12TB/CLAUDE_EXPORTS",
    "/Volumes/4TB Lacie/GATHERING_ARCHIVE",
    "/Volumes/FREDO/GATHERING_SEEDS"
]

KEYWORDS = [
    "peace", "love", "understanding", "wisdom", "travellor", "traveller", "artist",
    "dreamchamber", "rsp_001", "rsp001", "plowman", "fish music", "sovereign",
    "voice", "creative", "soul", "gather", "gathering", "humanity", "light",
    "healing", "overcome", "paralysis", "nerve", "freedom", "royalty", "creator"
]

def init_db(db_path):
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("""
        CREATE TABLE IF NOT EXISTS ai_chats (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_file TEXT,
            model_family TEXT,
            title TEXT,
            created_at TEXT,
            speaker TEXT,
            content_snippet TEXT,
            theme TEXT,
            full_text TEXT,
            match_score INTEGER
        )
    """)
    conn.commit()
    return conn

def detect_model(path_str, content):
    p = path_str.lower()
    c = content[:1000].lower()
    if "claude" in p or "anthropic" in p or "claude" in c:
        return "Claude (Anthropic)"
    elif "chatgpt" in p or "openai" in p or "gpt-4" in c or "gpt-3" in c:
        return "ChatGPT (OpenAI)"
    elif "gemini" in p or "antigravity" in p or "deepmind" in c:
        return "Gemini / Antigravity (DeepMind)"
    elif "lmstudio" in p or "lm-studio" in p or "gguf" in c or "mlx" in c:
        return "LM Studio / Local Sovereign Models"
    elif "cursor" in p or "cursor" in c:
        return "Cursor / Vibe Coding Assistant"
    elif "windsurf" in p or "codeium" in c:
        return "Windsurf / Cascade"
    elif "copilot" in p:
        return "GitHub Copilot"
    return "Multi-Model / Sovereign AI Vault"

def categorize_theme(text):
    t = text.lower()
    themes = []
    if any(w in t for w in ["peace", "love", "understanding", "compassion", "empathy", "unity"]):
        themes.append("Peace, Love & Understanding")
    if any(w in t for w in ["artist", "wisdom", "travellor", "traveller", "musician", "creator", "creative", "royalty"]):
        themes.append("Artists Are Wisdom Project Travellors")
    if any(w in t for w in ["paralysis", "nerve", "healing", "journey", "overcome", "survive", "rsp_001", "plowman"]):
        themes.append("RSP_001 Journey & Resilience")
    if any(w in t for w in ["dreamchamber", "noizy", "fish music", "sovereign", "mesh", "foss"]):
        themes.append("RSP DreamChamber & Sovereign Architecture")
    return " | ".join(themes) if themes else "General Ideation & Creative Philosophy"

def process_file(file_path, conn):
    cur = conn.cursor()
    try:
        if not os.path.exists(file_path):
            return 0
        
        file_size = os.path.getsize(file_path)
        if file_size > 50 * 1024 * 1024:  # skip > 50MB
            return 0

        entries_added = 0
        path_str = str(file_path)

        if file_path.suffix == '.json':
            try:
                with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                    data = json.load(f)
                    
                    # Handle ChatGPT export format (conversations.json)
                    if isinstance(data, list):
                        for conv in data:
                            if isinstance(conv, dict) and "mapping" in conv:
                                title = conv.get("title", "Untitled Conversation")
                                mapping = conv.get("mapping", {})
                                for node_id, node in mapping.items():
                                    msg = node.get("message")
                                    if msg and "content" in msg:
                                        parts = msg["content"].get("parts", [])
                                        text = "\n".join([str(p) for p in parts if isinstance(p, str)])
                                        if any(k in text.lower() for k in KEYWORDS):
                                            speaker = msg.get("author", {}).get("role", "unknown")
                                            model = detect_model(path_str, text)
                                            theme = categorize_theme(text)
                                            cur.execute("""
                                                INSERT INTO ai_chats (source_file, model_family, title, created_at, speaker, content_snippet, theme, full_text, match_score)
                                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                                            """, (path_str, model, title, str(datetime.now()), speaker, text[:300].strip(), theme, text, 10))
                                            entries_added += 1
                    
                    # Handle dict / structured messages
                    elif isinstance(data, dict):
                        text = json.dumps(data)
                        if any(k in text.lower() for k in KEYWORDS):
                            model = detect_model(path_str, text)
                            theme = categorize_theme(text)
                            cur.execute("""
                                INSERT INTO ai_chats (source_file, model_family, title, created_at, speaker, content_snippet, theme, full_text, match_score)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (path_str, model, file_path.stem, str(datetime.now()), "system/user", text[:300].strip(), theme, text[:5000], 5))
                            entries_added += 1
            except Exception:
                pass

        elif file_path.suffix in ['.jsonl', '.txt', '.md']:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                if any(k in content.lower() for k in KEYWORDS):
                    model = detect_model(path_str, content)
                    theme = categorize_theme(content)
                    
                    # Extract meaningful paragraphs
                    paragraphs = re.split(r'\n\n+', content)
                    for para in paragraphs:
                        if len(para.strip()) > 80 and any(k in para.lower() for k in KEYWORDS):
                            cur.execute("""
                                INSERT INTO ai_chats (source_file, model_family, title, created_at, speaker, content_snippet, theme, full_text, match_score)
                                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                            """, (path_str, model, file_path.stem, str(datetime.now()), "Travellor/AI", para[:300].strip(), theme, para, 8))
                            entries_added += 1

        conn.commit()
        return entries_added
    except Exception:
        return 0

def main():
    print("✨ Scraping all AI Ideation Chats across all models for Peace, Love & Understanding...")
    os.makedirs(os.path.dirname(OUTPUT_DB), exist_ok=True)
    conn = init_db(OUTPUT_DB)

    total_scanned = 0
    total_found = 0

    for base_path in SEARCH_PATHS:
        p = Path(base_path)
        if not p.exists():
            continue
        print(f"🔍 Searching: {base_path}")
        for root, dirs, files in os.walk(base_path):
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', '.pytest_cache']]
            for file in files:
                ext = os.path.splitext(file)[1].lower()
                if ext in ['.json', '.jsonl', '.md', '.txt', '.chat', '.conv']:
                    full_p = Path(root) / file
                    total_scanned += 1
                    added = process_file(full_p, conn)
                    total_found += added

    # Generate Compendium Markdown
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*), model_family FROM ai_chats GROUP BY model_family ORDER BY COUNT(*) DESC")
    breakdown = cur.fetchall()

    cur.execute("SELECT DISTINCT source_file, model_family, title, theme, content_snippet, full_text FROM ai_chats ORDER BY id DESC LIMIT 500")
    records = cur.fetchall()

    with open(OUTPUT_MD, 'w', encoding='utf-8') as f:
        f.write("# 🕊️ MASTER COMPENDIUM: AI IDEATION FOR PEACE, LOVE & UNDERSTANDING\n")
        f.write("## Return to *Artists Are Wisdom Project Travellors* · Sovereign Creator Vault\n\n")
        f.write(f"**Generated:** {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}\n")
        f.write(f"**Total AI Ideation Records Cataloged:** {total_found:,}\n")
        f.write(f"**Total Storage Roots Scanned:** {total_scanned:,}\n\n")
        
        f.write("### 🌐 AI Model & Framework Breakdown\n")
        f.write("| AI Model / Ecosystem | Curated Wisdom Passages |\n")
        f.write("|:---|:---|\n")
        for count, model in breakdown:
            f.write(f"| **{model}** | `{count:,}` passages |\n")
        f.write("\n---\n\n")

        f.write("### 💫 Pillars of the Wisdom Project\n\n")
        f.write("1. **Peace, Love & Understanding**: Uniting technology, art, and human consciousness towards universal empathy and non-coercive collaboration.\n")
        f.write("2. **Artists Are Wisdom Project Travellors**: Honoring every musician, writer, builder, and creator as a voyager seeking and speaking truth.\n")
        f.write("3. **Sovereign Voice & Human Royalty**: 75% Creator Royalties, unalienable rights to biological human voices, local GGUF/MLX intelligence.\n")
        f.write("4. **The RSP_001 Journey**: Rising from physical paralysis into unbounded sovereign architecture.\n\n")
        f.write("---\n\n")

        f.write("### 📜 Curated AI Ideation Highlights\n\n")
        for src, model, title, theme, snippet, full in records[:150]:
            f.write(f"#### 🌌 {title} (`{model}`)\n")
            f.write(f"- **Theme:** `{theme}`\n")
            f.write(f"- **Source:** `{src}`\n\n")
            f.write(f"> {snippet}...\n\n")
            f.write("---\n\n")

    # Generate Travellors Roster
    with open(OUTPUT_ROSTER, 'w', encoding='utf-8') as f:
        f.write("# 🧑‍🎨 ARTISTS ARE WISDOM PROJECT TRAVELLORS — CANONICAL ROSTER\n\n")
        f.write("### 🌟 Sovereign Travellor Numero Uno: Robert Stephen Plowman (`RSP_001`)\n")
        f.write("- **Roots:** Fish Music Inc. (Conceived 1996 · Reg 2003 · 26 Soho St. Toronto)\n")
        f.write("- **Sanctuary & Headquarters:** 771 Eastbourne Ave. Ottawa, ON. Canada K1K 0H8 (+1 613-324-3474)\n")
        f.write("- **Mission:** Universal Peace, Love & Understanding through Sovereign Sound, Code, and DreamChamber Sanctuary.\n\n")
        f.write("### 🌌 Fellow Travellors & Resonant Spirits in the Council\n")
        f.write("- **MC96**: The Sonic Alchemist & Sound Architect\n")
        f.write("- **NOIZY**: The Neural Symphony & Voice Synthesizer\n")
        f.write("- **RSP**: The Sovereign Master & Infinite Heart\n")
        f.write("- **THE-GATHERING**: The Global Network of Creators & Seekers\n")
        f.write("- **AQUARIUM / OXYGEN**: Fluid Creativity & Sustaining Breath\n")
        f.write("- **THE-DREAMCHAMBER**: The Sacred Space Where All Artists Are Embraced\n\n")

    conn.close()
    print(f"✅ Scraping Complete! Found {total_found:,} passages. Artifacts saved to {OUTPUT_MD} and {OUTPUT_ROSTER}.")

if __name__ == "__main__":
    main()
