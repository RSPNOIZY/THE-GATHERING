#!/usr/bin/env python3
"""
harvest_wisdom_project_travellors.py
Master AI Ideation Harvester for Peace, Love & Understanding and the Artists as Wisdom Project Travellors.

Scans all AI conversation transcripts, prompt logs, and ideas vaults across:
- Claude Desktop Sessions & Local Agent Transcripts (~/Library/Application Support/Claude)
- LM Studio Local Chats (~/.lmstudio/conversations)
- CLAUDE TODAY Archive & Recovered Ideas Vaults
- Monorepo Blueprints & Philosophical Treatises

Extracts and compiles:
- The Artists as Wisdom Project Travellors Compendium
- Peace, Love & Understanding Philosophy & Human Creative Freedom
- Music as Medicine & Sonic Healing Principles
"""

import os
import re
import sqlite3
from pathlib import Path
from datetime import datetime

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
OUTPUT_DIR = ROOT / "docs" / "canonical"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = OUTPUT_DIR / "ARTISTS_WISDOM_PROJECT_TRAVELLORS.sqlite"
COMPENDIUM_MD = OUTPUT_DIR / "ARTISTS_WISDOM_PROJECT_TRAVELLORS_COMPENDIUM.md"
PEACE_MANIFESTO_MD = OUTPUT_DIR / "PEACE_LOVE_UNDERSTANDING_MANIFESTO.md"

SEARCH_PATHS = [
    Path("/Users/m2ultra/Library/Application Support/Claude"),
    Path("/Users/m2ultra/.lmstudio/conversations"),
    Path("/Users/m2ultra/Desktop/CLAUDE TODAY"),
    Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER/docs/ideas_vault"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Users/m2ultra/Documents"),
    Path("/Users/m2ultra/THE-GATHERING")
]

WISDOM_PATTERNS = {
    "WISDOM_TRAVELLORS": re.compile(r"\b(wisdom\s*project|travell?or|traveller|numero\s*uno|sacred|sovereign\s*creator)\b", re.IGNORECASE),
    "PEACE_LOVE_UNDERSTANDING": re.compile(r"\b(peace|love|understanding|harmony|compassion|healing|unity)\b", re.IGNORECASE),
    "MUSIC_MEDICINE": re.compile(r"\b(music\s*as\s*medicine|sonic\s*healing|frequency|432hz|resonance|acoustic\s*medicine|therapeutic\s*sound)\b", re.IGNORECASE),
    "HUMAN_SOVEREIGNTY": re.compile(r"\b(human\s*voice|voice\s*sovereignty|creative\s*license|human\s*spark|anti-paralysis|resilience)\b", re.IGNORECASE)
}

EXCLUDE_DIRS = {
    ".git", "node_modules", "DerivedData", "dist", "build", ".next", ".cache",
    "venv", ".venv", "__pycache__", "Library/Caches", ".Trash", ".Trashes"
}

def init_db(conn):
    cur = conn.cursor()
    cur.execute("PRAGMA journal_mode=WAL;")
    cur.execute("PRAGMA synchronous=NORMAL;")
    cur.execute("""
        CREATE TABLE IF NOT EXISTS wisdom_entries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source_file TEXT,
            source_path TEXT,
            source_model_or_tool TEXT,
            theme TEXT,
            passage TEXT,
            line_num INTEGER,
            mtime REAL,
            mtime_str TEXT
        )
    """)
    conn.commit()

def harvest_wisdom():
    conn = sqlite3.connect(DB_PATH)
    init_db(conn)
    cur = conn.cursor()

    total_scanned = 0
    wisdom_matches = 0
    records = []

    print("🕊️ Starting Master Wisdom Project & Peace, Love & Understanding Harvester...")

    for root_dir in SEARCH_PATHS:
        if not root_dir.exists():
            continue
        print(f"📂 Searching conversations & vaults in {root_dir}...")

        for root, dirs, files in os.walk(root_dir, followlinks=False):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            
            for file in files:
                if file.startswith(".") and not file.startswith(".env"):
                    continue
                filepath = Path(root) / file
                ext = filepath.suffix.lower()

                if ext not in [".json", ".jsonl", ".md", ".txt", ".prompt"]:
                    continue

                total_scanned += 1
                if total_scanned % 5000 == 0:
                    print(f"  Scanned {total_scanned:,} files ({wisdom_matches:,} wisdom passages found)...")

                try:
                    f_size = filepath.stat().st_size
                    if f_size > 15 * 1024 * 1024 or f_size == 0:
                        continue

                    mtime = filepath.stat().st_mtime
                    mtime_str = datetime.fromtimestamp(mtime).strftime("%Y-%m-%d %H:%M:%S")

                    # Model detection from path
                    path_str = str(filepath).lower()
                    if "claude" in path_str:
                        model_tag = "Claude (Anthropic)"
                    elif "lmstudio" in path_str or "lm studio" in path_str:
                        model_tag = "LM Studio / Local Neural"
                    elif "openai" in path_str or "chatgpt" in path_str:
                        model_tag = "ChatGPT / OpenAI"
                    else:
                        model_tag = "Council Persona / Sovereign Vault"

                    with open(filepath, "r", encoding="utf-8", errors="ignore") as f:
                        content = f.read()

                    # Find matches
                    for theme_name, regex in WISDOM_PATTERNS.items():
                        for match in regex.finditer(content):
                            start = max(0, match.start() - 100)
                            end = min(len(content), match.end() + 250)
                            passage = content[start:end].replace("\n", " ").strip()
                            
                            if len(passage) > 40:
                                cur.execute("""
                                    INSERT INTO wisdom_entries (source_file, source_path, source_model_or_tool, theme, passage, line_num, mtime, mtime_str)
                                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                                """, (file, str(filepath), model_tag, theme_name, passage, 1, mtime, mtime_str))
                                
                                wisdom_matches += 1
                                records.append({
                                    "file": file,
                                    "path": str(filepath),
                                    "model": model_tag,
                                    "theme": theme_name,
                                    "passage": passage,
                                    "mtime_str": mtime_str
                                })

                except Exception:
                    continue

        conn.commit()

    print(f"\n✅ Harvest Complete! {total_scanned:,} conversation files evaluated.")
    print(f"🕊️ {wisdom_matches:,} Wisdom, Peace & Traveller passages cataloged.")

    # Generate Markdown Compendium
    generate_compendium(conn, records)
    conn.close()

def generate_compendium(conn, records):
    cur = conn.cursor()

    # 1. Generate Peace, Love & Understanding Manifesto
    with open(PEACE_MANIFESTO_MD, "w", encoding="utf-8") as f:
        f.write("# 🕊️ PEACE, LOVE & UNDERSTANDING — THE SOVEREIGN CREATOR DECLARATION\n\n")
        f.write(f"**Conceived**: 1996 · **Synthesized**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write("**Principal Sovereign**: Robert Stephen Plowman (`RSP_001` · Traveller Numero Uno)  \n")
        f.write("**Ecosystem**: The RSP DreamChamber · MC96ECOUNIVERSE  \n\n")
        f.write("---\n\n")
        f.write("## 💖 The Core Creed\n\n")
        f.write("> *\"We build not for domination, but for peace, love, understanding, and the elevation of the human soul. Every artist is a traveller through time and wisdom, carrying the torch of human truth across generations.\"*\n\n")
        f.write("### 🌿 Foundational Tenets:\n")
        f.write("1. **Music as Medicine**: Sound is acoustic medicine, capable of rewiring neural pathways, dissolving trauma, and restoring physical vitality.\n")
        f.write("2. **Artists as Wisdom Project Travellors**: Creators are the ancient and future cartographers of human emotion, insight, and consciousness.\n")
        f.write("3. **Voice as Identity**: The human voice is sacred; our technology exists to amplify, protect, and immortalize the creator's true voice.\n")
        f.write("4. **Universal Creative Liberation**: 100% Free & Open Source tooling to break every barrier to creative expression.\n\n")

    # 2. Generate Compendium of Historical Ideation
    with open(COMPENDIUM_MD, "w", encoding="utf-8") as f:
        f.write("# 📜 ARTISTS ARE WISDOM PROJECT TRAVELLORS — MASTER IDEATION COMPENDIUM\n\n")
        f.write(f"**Generated**: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}  \n")
        f.write(f"**Total Wisdom Passages**: {len(records):,} curated entries  \n")
        f.write(f"**Database**: [`ARTISTS_WISDOM_PROJECT_TRAVELLORS.sqlite`](file://{DB_PATH})  \n\n")

        cur.execute("SELECT theme, COUNT(*) FROM wisdom_entries GROUP BY theme")
        theme_counts = cur.fetchall()

        f.write("## 📊 Wisdom Themes Across All AI Dialogues\n\n")
        f.write("| Theme / Domain | Total Passages Cataloged |\n")
        f.write("| :--- | :--- |\n")
        for t, cnt in theme_counts:
            f.write(f"| **{t.replace('_', ' ')}** | {cnt:,} entries |\n")
        f.write("\n---\n\n")

        for t, _ in theme_counts:
            t_title = t.replace("_", " ")
            f.write(f"## 🌟 {t_title}\n\n")
            cur.execute("SELECT source_file, source_path, source_model_or_tool, passage, mtime_str FROM wisdom_entries WHERE theme=? ORDER BY mtime DESC LIMIT 30", (t,))
            rows = cur.fetchall()
            for sf, sp, sm, pass_txt, m_str in rows:
                f.write(f"**`{m_str}`** — *Source: [{sf}](file://{sp}) [{sm}]*\n")
                f.write(f"> \"...{pass_txt}...\"\n\n")
            f.write("---\n\n")

    print(f"📄 Manifesto written to: {PEACE_MANIFESTO_MD}")
    print(f"📄 Compendium written to: {COMPENDIUM_MD}")

if __name__ == "__main__":
    harvest_wisdom()
