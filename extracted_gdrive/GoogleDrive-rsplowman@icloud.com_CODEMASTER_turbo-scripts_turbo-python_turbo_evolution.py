#!/usr/bin/env python3
"""
turbo_evolution.py
The Evolution Engine.
Analyzes MemCell V3 data to generate self-improvement insights.
"""
import json
from pathlib import Path
from collections import Counter
import datetime

# Configuration
MEMORY_DIR = Path.home() / "NOIZYANTHROPIC" / "NOIZYLAB" / "memory"
MEMORY_FILE = MEMORY_DIR / "memcell_v3.json"
EVOLUTION_FILE = MEMORY_DIR / "evolution_status.json"

def load_memory():
    if not MEMORY_FILE.exists():
        return None
    try:
        with open(MEMORY_FILE, 'r') as f:
            return json.load(f)
    except Exception:
        return None

def save_evolution(data):
    with open(EVOLUTION_FILE, 'w') as f:
        json.dump(data, f, indent=2)

def analyze_memory(mem):
    if not mem:
        return {"status": "NO_MEMORY", "insight": "I remember nothing."}

    ns = mem.get("neural_state", {})
    history = ns.get("short_term", [])

    if not history:
        return {"status": "BLANK_SLATE", "insight": "No history to analyze."}

    # 1. Vibe Consistency (Stability)
    vibes = []
    # Reconstruct vibes from actions (heuristic) since history stores action strings
    # Or rely on current vibe? Better to analyze history flow if possible.
    # MemCell V3 track() updates valid vibes in real-time but doesn't store vibe history PER action explicitly 
    # unless we infer it. Let's infer from action keywords for now or rely on current state.
    # Actually, let's look at the 'patterns' detected.
    
    patterns = ns.get("patterns", [])
    current_vibe = ns.get("vibe", "neutral")
    
    # 2. Focus Analysis (Obsession)
    subjects = [h.get('s', 'unknown') for h in history]
    subject_counts = Counter(subjects)
    top_focus = subject_counts.most_common(1)
    
    focus_insight = "No clear focus."
    if top_focus:
        topic, count = top_focus[0]
        focus_insight = f"Obsessed with '{topic}' ({count} actions)."

    # 3. evolutionary_status
    status = "STABLE"
    if current_vibe == "connected":
        status = "EVOLVING"
    elif current_vibe == "critical":
        status = "REPAIRING"
    
    # 4. Neural Density (How much are we doing?)
    density = len(history)
    
    insight = {
        "timestamp": datetime.datetime.now().isoformat(),
        "status": status,
        "vibe": current_vibe,
        "patterns_detected": len(patterns),
        "focus_insight": focus_insight,
        "neural_density": density,
        "message": f"System is {status}. {focus_insight}"
    }
    
    return insight

def main():
    print("🧬 RUNNING EVOLUTION ENGINE...")
    mem = load_memory()
    insight = analyze_memory(mem)
    
    print(f"   Status: {insight['status']}")
    print(f"   Insight: {insight['focus_insight']}")
    print(f"   Vibe: {insight['vibe']}")
    
    save_evolution(insight)
    print("✨ Evolution Data Saved.")

if __name__ == "__main__":
    main()
