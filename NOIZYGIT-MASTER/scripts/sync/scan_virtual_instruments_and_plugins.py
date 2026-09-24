#!/usr/bin/env python3
"""
scan_virtual_instruments_and_plugins.py
Scans and regroups all commercial samples, Virtual Instruments (AU, VST, VST3, CLAP, AAX),
Kontakt Libraries, Logic Pro EXS/Sampler instruments, and audio FX across the MC96ECOUNIVERSE.
Generates PLUGINS_DATABASE.sqlite, COMMERCIAL_INSTRUMENTS_AND_PLUGINS_CATALOG.md, and PLUGINS_REGISTRY.json.
"""

import sqlite3
import json
import time
from pathlib import Path

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
OUTPUT_DIR = ROOT / "docs" / "audio_plugins"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = OUTPUT_DIR / "PLUGINS_DATABASE.sqlite"
MD_PATH = OUTPUT_DIR / "COMMERCIAL_INSTRUMENTS_AND_PLUGINS_CATALOG.md"
JSON_PATH = OUTPUT_DIR / "PLUGINS_REGISTRY.json"

PLUGIN_ROOTS = [
    ("/Library/Audio/Plug-Ins/Components", "AU (Audio Unit)"),
    ("/Library/Audio/Plug-Ins/VST", "VST2"),
    ("/Library/Audio/Plug-Ins/VST3", "VST3"),
    ("/Library/Audio/Plug-Ins/CLAP", "CLAP"),
    ("/Users/m2ultra/Library/Audio/Plug-Ins/Components", "User AU"),
    ("/Users/m2ultra/Library/Audio/Plug-Ins/VST", "User VST2"),
    ("/Users/m2ultra/Library/Audio/Plug-Ins/VST3", "User VST3"),
    ("/Library/Application Support/Native Instruments", "Native Instruments"),
    ("/Library/Audio/Sounds", "System Sound Libraries"),
    ("/Users/m2ultra/Music", "Local Music & Sampler Stems"),
    ("/Users/m2ultra/THE-GATHERING/06_AUDIO_MUSIC_IP", "NOIZY Audio & Music IP"),
]

def classify_plugin(name, ext, parent_format):
    name_lower = name.lower()
    
    # Vendor Detection
    vendor = "Independent / Third-Party"
    if "iz" in name_lower or "rx" in name_lower or "ozone" in name_lower or "neutron" in name_lower or "nectar" in name_lower or "stutter" in name_lower or "trash" in name_lower or "vocalsynth" in name_lower or "tonalbalance" in name_lower:
        vendor = "iZotope"
    elif "khs" in name_lower or "kilohearts" in name_lower:
        vendor = "Kilohearts"
    elif "uaudio" in name_lower or "uad" in name_lower:
        vendor = "Universal Audio (UADx)"
    elif "native instruments" in name_lower or "kontakt" in name_lower or "massive" in name_lower or "reaktor" in name_lower or "battery" in name_lower:
        vendor = "Native Instruments"
    elif "fabfilter" in name_lower:
        vendor = "FabFilter"
    elif "waves" in name_lower:
        vendor = "Waves Audio"
    elif "arturia" in name_lower:
        vendor = "Arturia"
    elif "valhalla" in name_lower:
        vendor = "Valhalla DSP"
    elif "soundtoys" in name_lower:
        vendor = "Soundtoys"
    elif "plogue" in name_lower or "sforzando" in name_lower:
        vendor = "Plogue"
    elif "air" in name_lower or "theriser" in name_lower:
        vendor = "AIR Music Tech"
    elif "apple" in name_lower or "logic" in name_lower:
        vendor = "Apple Logic Pro"
        
    # Category Detection
    category = "Audio Processor / FX"
    if any(k in name_lower for k in ["synth", "instrument", "sampler", "kontakt", "sforzando", "piano", "organ", "drum", "keys", "riser", "phatmatik"]):
        category = "Virtual Instrument (Synth/Sampler)"
    elif any(k in name_lower for k in ["denoise", "declick", "declip", "dehum", "dereverb", "de-ess", "mouth", "spectral", "breath", "repair", "clean"]):
        category = "Spectral Restoration & Voice Isolation"
    elif any(k in name_lower for k in ["compressor", "limiter", "eq", "equalizer", "dynamics", "channel", "neve", "api", "pultec", "fairchild", "teletronix", "la-2", "1073"]):
        category = "Dynamics & Analog Modeling (EQ/Comp/Tape)"
    elif any(k in name_lower for k in ["reverb", "delay", "echo", "space", "lexicon", "galaxy"]):
        category = "Time & Spatial FX (Reverb/Delay)"
    elif any(k in name_lower for k in ["distortion", "bitcrush", "trash", "saturat", "phase", "ring mod"]):
        category = "Harmonic & Distortion FX"
    elif any(k in name_lower for k in ["vocal", "voice", "doubler", "pitch", "formant", "auto-tune", "tuning"]):
        category = "Vocal Processing & Pitch"
        
    return vendor, category

def scan_plugins():
    print(f"Scanning Audio Plugins & Virtual Instruments into: {DB_PATH}")
    conn = sqlite3.connect(DB_PATH)
    cur = conn.cursor()
    cur.execute("DROP TABLE IF EXISTS plugins")
    cur.execute("""
        CREATE TABLE plugins (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            format TEXT NOT NULL,
            vendor TEXT NOT NULL,
            category TEXT NOT NULL,
            path TEXT UNIQUE NOT NULL,
            size_mb REAL,
            modified_date TEXT
        )
    """)
    cur.execute("CREATE INDEX idx_plugins_vendor ON plugins(vendor)")
    cur.execute("CREATE INDEX idx_plugins_category ON plugins(category)")
    cur.execute("CREATE INDEX idx_plugins_format ON plugins(format)")
    
    total_plugins = 0
    registry = []
    
    for root_dir, format_label in PLUGIN_ROOTS:
        p_root = Path(root_dir)
        if not p_root.exists():
            continue
            
        print(f"Scanning [{format_label}]: {root_dir}...")
        for item in sorted(p_root.iterdir()):
            if item.name.startswith("."):
                continue
            name = item.name
            ext = item.suffix.lower()
            
            # Check plugin bundle
            if ext in [".component", ".vst", ".vst3", ".clap", ".aax", ".dls", ".nki", ".nkm", ".exs", ".patch", ".cst"] or item.is_dir():
                try:
                    stat = item.stat()
                    mtime = time.strftime("%Y-%m-%d", time.gmtime(stat.st_mtime))
                    if item.is_dir():
                        size_bytes = sum(f.stat().st_size for f in item.rglob("*") if f.is_file())
                    else:
                        size_bytes = stat.st_size
                    size_mb = round(size_bytes / (1024 * 1024), 2)
                    
                    vendor, category = classify_plugin(name, ext, format_label)
                    
                    cur.execute("""
                        INSERT OR IGNORE INTO plugins (name, format, vendor, category, path, size_mb, modified_date)
                        VALUES (?, ?, ?, ?, ?, ?, ?)
                    """, (name, format_label, vendor, category, str(item), size_mb, mtime))
                    
                    registry.append({
                        "name": name,
                        "format": format_label,
                        "vendor": vendor,
                        "category": category,
                        "size_mb": size_mb,
                        "path": str(item),
                        "modified_date": mtime
                    })
                    total_plugins += 1
                except Exception:
                    continue
                    
    conn.commit()
    print(f"\n✅ Total Plugins & Instruments Cataloged: {total_plugins:,}")
    
    # Save JSON Registry
    with open(JSON_PATH, "w", encoding="utf-8") as f:
        json.dump({"total_plugins": total_plugins, "plugins": registry}, f, indent=2)
    print(f"Saved JSON Registry: {JSON_PATH}")
    
    # Generate Markdown Catalog
    generate_markdown_catalog(conn)
    conn.close()

def generate_markdown_catalog(conn):
    cur = conn.cursor()
    cur.execute("SELECT COUNT(*), SUM(size_mb) FROM plugins")
    total_count, total_mb = cur.fetchone()
    total_gb = round((total_mb or 0) / 1024, 2)
    
    cur.execute("SELECT vendor, COUNT(*), SUM(size_mb) FROM plugins GROUP BY vendor ORDER BY COUNT(*) DESC")
    vendor_stats = cur.fetchall()
    
    cur.execute("SELECT category, COUNT(*), SUM(size_mb) FROM plugins GROUP BY category ORDER BY COUNT(*) DESC")
    category_stats = cur.fetchall()
    
    cur.execute("SELECT format, COUNT(*) FROM plugins GROUP BY format ORDER BY COUNT(*) DESC")
    format_stats = cur.fetchall()
    
    md = f"""# 🎛️ MC96ECOUNIVERSE — Master Virtual Instruments & Audio Plugins Catalog

- **Catalog Database**: [`PLUGINS_DATABASE.sqlite`](file://{DB_PATH})
- **JSON Registry**: [`PLUGINS_REGISTRY.json`](file://{JSON_PATH})
- **Total Tracked Plugins & Instruments**: `{total_count:,}` ({total_gb} GB)
- **Generated**: `{time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())}`

---

## 🏛️ Top Vendors & DSP Suites

| Vendor | Total Plugins | Total Size (MB) |
| :--- | :---: | :---: |
"""
    for v, c, sz in vendor_stats:
        md += f"| **{v}** | `{c:,}` | `{round(sz or 0, 2):,}` MB |\n"

    md += "\n---\n\n## 🎼 Distribution by Plugin Category\n\n| Category | Count | Total Size (MB) |\n| :--- | :---: | :---: |\n"
    for cat, c, sz in category_stats:
        md += f"| **{cat}** | `{c:,}` | `{round(sz or 0, 2):,}` MB |\n"

    md += "\n---\n\n## 🔌 Format Breakdown\n\n| Format | Count |\n| :--- | :---: |\n"
    for fmt, c in format_stats:
        md += f"| **{fmt}** | `{c:,}` |\n"

    md += "\n---\n\n## 🎹 Complete Inventory of Virtual Instruments & Processors\n\n"
    
    cur.execute("SELECT name, vendor, category, format, size_mb, path FROM plugins ORDER BY vendor ASC, name ASC")
    rows = cur.fetchall()
    
    md += "| Plugin / Instrument Name | Vendor | Category | Format | Size | Local Path |\n| :--- | :--- | :--- | :---: | :---: | :--- |\n"
    for name, vendor, cat, fmt, sz, path in rows:
        md += f"| **`{name}`** | {vendor} | {cat} | `{fmt}` | `{sz} MB` | [`path`](file://{path}) |\n"

    with open(MD_PATH, "w", encoding="utf-8") as f:
        f.write(md)
    print(f"Saved Markdown Catalog: {MD_PATH}")

if __name__ == "__main__":
    scan_plugins()
