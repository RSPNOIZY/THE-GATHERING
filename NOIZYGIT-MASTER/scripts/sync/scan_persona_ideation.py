#!/usr/bin/env python3
"""
scan_persona_ideation.py
Scans and collects all conceptual ideation, blueprints, rules, and transcripts for:
- Gabriel Almeida
- Lucy Cortez
- Engr_Keith
- Pops Plowman
- Michael Corlione / Merkle
- Alex Warden
Generates structured Markdown dossiers in NOIZYGIT-MASTER/docs/personas/.
"""

import os
import re
import time
from pathlib import Path

ROOT = Path("/Users/m2ultra/THE-GATHERING/NOIZYGIT-MASTER")
OUTPUT_DIR = ROOT / "docs" / "personas"
OUTPUT_DIR.mkdir(parents=True, exist_ok=True)

SEARCH_ROOTS = [
    Path("/Users/m2ultra/THE-GATHERING"),
    Path("/Users/m2ultra/NOIZYANTHROPIC"),
    Path("/Users/m2ultra/Desktop/CLAUDE TODAY"),
]

PERSONAS = {
    "gabriel": {
        "title": "Gabriel Almeida",
        "role": "Master Voice/Audio Orchestrator, Swarm Leader & Release Commander",
        "keywords": [r"\bgabriel\b", r"alameida", r"almeida", r"release commander", r"audio orchestrator"],
        "filename": "GABRIEL_ALMEIDA_IDEATION_DOSSIER.md"
    },
    "lucy": {
        "title": "Lucy Cortez",
        "role": "Personal OS Guardian, Voice Estate & World Model Lead",
        "keywords": [r"\blucy\b", r"cortez", r"voice estate", r"personal os", r"world model"],
        "filename": "LUCY_CORTEZ_IDEATION_DOSSIER.md"
    },
    "keith": {
        "title": "Engr Keith Plowman",
        "role": "Infrastructure Engineer, Hot Rod DevOps & Hardware SRE",
        "keywords": [r"engr_keith", r"engr keith", r"keith plowman", r"\bkeith\b.*infrastructure", r"hot rod devops"],
        "filename": "ENGR_KEITH_IDEATION_DOSSIER.md"
    },
    "pops": {
        "title": "Pops Plowman (Robert Sr.)",
        "role": "No-Code Orchestrator, Heritage Patriarch & Wisdom Keeper",
        "keywords": [r"pops plowman", r"\bpops\b", r"robert plowman sr", r"heritage patriarch", r"no-code orchestrator"],
        "filename": "POPS_PLOWMAN_IDEATION_DOSSIER.md"
    },
    "michael": {
        "title": "Michael Corlione (Michael Merkle)",
        "role": "Merkle Archivist, Legal & Consent Enforcer, Immutable Ledger Guardian",
        "keywords": [r"corlion", r"corliono", r"corleone", r"michael merkle", r"merkle archivist", r"consent oracle"],
        "filename": "MICHAEL_CORLIONE_IDEATION_DOSSIER.md"
    },
    "alex": {
        "title": "Alex Warden",
        "role": "Chief Business Strategist, Financial Advisor & Sovereign Capital Architect",
        "keywords": [r"alex warden", r"\bwarden\b", r"business strateg", r"financial advisor", r"financial model", r"75/25 perpetual", r"sovereign accounting", r"venture capital", r"monetization", r"financial plan"],
        "filename": "ALEX_WARDEN_IDEATION_DOSSIER.md"
    },
    "shirl": {
        "title": "Shirl (Shirley Marie Plowman)",
        "role": "Sample Intelligence Analyst, Living Memory & Sovereign Emotional Anchor",
        "keywords": [r"\bshirl\b", r"shirley marie", r"shirley plowman", r"living memory", r"sample intelligence", r"maternal guardian"],
        "filename": "SHIRL_SHIRLEY_MARIE_IDEATION_DOSSIER.md"
    },
    "dream_magenta": {
        "title": "Dream (DreamChamber / Google Magenta)",
        "role": "Creative Neural Audio Co-Producer, DAW Whisperer & Magenta Music Engine",
        "keywords": [r"dreamchamber", r"\bmagenta\b", r"daw whisperer", r"neural audio", r"music synthesis", r"generative audio"],
        "filename": "DREAM_MAGENTA_IDEATION_DOSSIER.md"
    }
}

VALID_EXTS = {".md", ".txt", ".json", ".ts", ".js", ".py", ".jsonl"}
EXCLUDE_DIRS = {"node_modules", ".git", ".next", ".cache", "dist", "build", "venv", ".venv"}

def scan_ideation():
    print("Scanning all ideation files for Key Personas...")
    start_time = time.time()
    
    results = {k: [] for k in PERSONAS}
    compiled_patterns = {
        k: [re.compile(p, re.IGNORECASE) for p in data["keywords"]]
        for k, data in PERSONAS.items()
    }
    
    scanned_count = 0
    
    for s_root in SEARCH_ROOTS:
        if not s_root.exists():
            continue
        print(f"Searching in {s_root}...")
        for root, dirs, files in os.walk(s_root):
            dirs[:] = [d for d in dirs if d not in EXCLUDE_DIRS and not d.startswith(".")]
            for f in files:
                ext = os.path.splitext(f)[1].lower()
                if ext not in VALID_EXTS or f.startswith("."):
                    continue
                file_path = Path(root) / f
                scanned_count += 1
                try:
                    if file_path.stat().st_size > 2 * 1024 * 1024:
                        continue
                    with open(file_path, "r", encoding="utf-8", errors="ignore") as file_obj:
                        content = file_obj.read()
                        
                    for p_key, patterns in compiled_patterns.items():
                        matches = 0
                        matched_snippets = []
                        for pat in patterns:
                            finds = list(pat.finditer(content))
                            if finds:
                                matches += len(finds)
                                for match in finds[:3]:
                                    start = max(0, match.start() - 100)
                                    end = min(len(content), match.end() + 150)
                                    snippet = content[start:end].replace("\n", " ").strip()
                                    matched_snippets.append(f"... {snippet} ...")
                                    
                        if matches > 0:
                            mtime = time.strftime("%Y-%m-%d", time.gmtime(file_path.stat().st_mtime))
                            results[p_key].append({
                                "filename": f,
                                "path": str(file_path),
                                "mtime": mtime,
                                "match_count": matches,
                                "snippets": matched_snippets[:2]
                            })
                except Exception:
                    continue

    print(f"\nScanned {scanned_count:,} files in {round(time.time() - start_time, 2)}s.")
    
    # Generate Markdown Dossiers
    for p_key, p_data in PERSONAS.items():
        doc_list = sorted(results[p_key], key=lambda x: (x["match_count"], x["mtime"]), reverse=True)
        out_file = OUTPUT_DIR / p_data["filename"]
        
        md = f"""# 👤 {p_data['title']} — Master Ideation Dossier

- **Role**: `{p_data['role']}`
- **Total Associated Artifacts**: `{len(doc_list)}`
- **Generated**: `{time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())}`

---

## 📑 Core Ideation, Blueprints & References

| Date | Document Name | Mentions | Path |
| :---: | :--- | :---: | :--- |
"""
        for item in doc_list[:50]:
            md += f"| `{item['mtime']}` | **{item['filename']}** | `{item['match_count']}` | [`link`](file://{item['path']}) |\n"

        md += "\n---\n\n## 💡 Key Ideation Excerpts & Focus\n\n"
        for item in doc_list[:15]:
            md += f"### 📄 [`{item['filename']}`](file://{item['path']})\n"
            md += f"**Date:** `{item['mtime']}` · **Mentions:** `{item['match_count']}`\n\n"
            for snip in item["snippets"]:
                md += f"> {snip}\n\n"

        with open(out_file, "w", encoding="utf-8") as f:
            f.write(md)
        print(f"  ✓ Written {out_file.name} ({len(doc_list)} entries)")

    # Generate Master Council Index
    council_index = OUTPUT_DIR / "MASTER_PERSONAS_COUNCIL_INDEX.md"
    council_md = f"""# 🏛️ MC96ECO Master Personas & Council Ideation Index

- **Total Council Members**: `{len(PERSONAS)}`
- **Generated**: `{time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime())}`

---

## 👥 Persona Council Registry

| Persona | Role / Domain | Tracked Blueprints | Dossier Link |
| :--- | :--- | :---: | :--- |
"""
    for p_key, p_data in PERSONAS.items():
        cnt = len(results[p_key])
        council_md += f"| **{p_data['title']}** | {p_data['role']} | `{cnt}` | [`{p_data['filename']}`](file://{OUTPUT_DIR}/{p_data['filename']}) |\n"

    with open(council_index, "w", encoding="utf-8") as f:
        f.write(council_md)
    print(f"\nGenerated Council Index: {council_index}")

if __name__ == "__main__":
    scan_ideation()
