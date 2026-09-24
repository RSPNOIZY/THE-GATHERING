#!/usr/bin/env python3
"""
THE ARCHIVIST — NOIZY Empire Document Vacuum & Router
Phase 1: CATALOG — scans all non-system paths, classifies every .md file by project
Phase 2: SORT    — routes files to canonical homes (requires --execute flag)

Usage:
    python3 archivist.py                    # catalog only (safe, no moves)
    python3 archivist.py --execute          # catalog + move files
    python3 archivist.py --report           # print summary to terminal
    python3 archivist.py --output catalog.json  # save catalog to file
"""

import os
import json
import hashlib
import argparse
from pathlib import Path
from datetime import datetime
from collections import defaultdict

# ─────────────────────────────────────────────────────────────────
# ENTITY TAXONOMY
# Each project has: keywords (found in content or filename),
#                   path_patterns (folder names that signal this project),
#                   aliases (alternate names)
# ─────────────────────────────────────────────────────────────────
TAXONOMY = {
    "NOIZY": {
        "keywords": [
            "noizy.ai", "NOIZY.ai", "noizy beast", "noisy beast", "NOIZY BEAST",
            "MC96ECO", "mc96eco", "5th epoch", "consent oracle", "synthesis oracle",
            "provenance weaver", "fair trade ai", "NOIZY PROOF", "noizy-cortex",
            "noizycortex", "the mothership", "HEAVEN worker", "HEAVEN17"
        ],
        "path_patterns": [
            "noizy_platform", "noizy-platform", "NOIZY.AI", "noizy-ai",
            "NOIZY_AI", "noizyempire", "NOIZYEMPIRE"
        ],
        "aliases": ["NOIZY BEAST", "MC96", "THE MOTHERSHIP", "NOIZY.AI"]
    },
    "NOIZYLAB": {
        "keywords": [
            "noizylab", "NOIZYLAB", "repair shop", "$89 flat", "device repair",
            "12/day", "gorunfree", "GORUNFREE", "LABS_CHECKLIST", "noizylab-portal",
            "NOIZYLAB-PORTAL", "389K"
        ],
        "path_patterns": [
            "noizylab", "NOIZYLAB", "gorunfree", "GORUNFREE"
        ],
        "aliases": ["LABS", "THE LAB", "REPAIR"]
    },
    "NOIZYKIDZ": {
        "keywords": [
            "noizykidz", "NOIZYKIDZ", "haptic music", "haptics", "deaf children",
            "autism spectrum", "LIFELUV", "lifeluv", "nims", "Nims", "Nemesvary",
            "quadriplegic", "accessibility music", "haptic interface"
        ],
        "path_patterns": [
            "noizykidz", "NOIZYKIDZ", "lifeluv", "LIFELUV"
        ],
        "aliases": ["LIFELUV", "KIDZ", "LUCY"]
    },
    "NOIZYFISH": {
        "keywords": [
            "noizyfish", "NOIZYFISH", "fishmusicinc", "fish music inc",
            "Fish Music Inc", "THE AQUARIUM", "AQUARIUM", "34TB", "sync licensing",
            "catalog licensing", "the aquarium", "fishmusicinc.com",
            "FISH_MUSIC", "fish_music", "fish-music"
        ],
        "path_patterns": [
            "fishmusicinc", "fish-music", "FISH_MUSIC", "AQUARIUM",
            "fish_music", "FishMusic"
        ],
        "aliases": ["FISH MUSIC INC", "FMI", "THE AQUARIUM", "FISH"]
    },
    "GABRIEL": {
        "keywords": [
            "gabriel", "GABRIEL", "gabriel_v3", "GABRIEL_V3", "gabrielv4", "GABRIELV4",
            "memcell", "memcells", "heaven worker", "HEAVEN", "10.90.90.20",
            "AEON", "aeon-power", "mc96-command-central", "gabriel-webhooks",
            "voice-orchestrator", "god-kernel", "ekkOS", "ekk"
        ],
        "path_patterns": [
            "gabriel", "GABRIEL", "GABRIEL_V3", "GABRIELV4"
        ],
        "aliases": ["GAB", "G4", "GABRIELV4"]
    },
    "NOIZYVOX": {
        "keywords": [
            "noizyvox", "NOIZYVOX", "aiva", "A.I.V.A", "AIVA",
            "artificially intelligent voice acting", "voice actor", "voice estate",
            "RVC", "XTTS", "voice army", "RSP_001", "rsp001", "rsp_001",
            "rob-ava", "rob_ava", "noizyvox-portal", "rsp001_pipeline"
        ],
        "path_patterns": [
            "noizyvox", "NOIZYVOX", "rob_ava", "rsp001", "rsp001_pipeline",
            "noizyvox-portal"
        ],
        "aliases": ["VOICE", "AIVA", "A.I.V.A.", "VOICE ARMY"]
    },
    "DREAMCHAMBER": {
        "keywords": [
            "dreamchamber", "DreamChamber", "DREAMCHAMBER", "500-year vision",
            "500 year", "dream chamber", "codex", "7 epochs", "2526",
            "looking back from 2030", "looking back from 2036",
            "founding origin story", "five catalysts"
        ],
        "path_patterns": [
            "dreamchamber", "DREAMCHAMBER", "dream-chamber"
        ],
        "aliases": ["DC", "THE CHAMBER", "DREAM"]
    },
    "INFRASTRUCTURE": {
        "keywords": [
            "cloudflare", "wrangler", "workers", "D1 database", "KV store",
            "tunnel", "dns", "aeon", "webhook", "cloudflare worker",
            "secure_transport", "unified_integration", "dlink", "DLINK",
            "jumbo frame", "network switch"
        ],
        "path_patterns": [
            "workers", "infrastructure", "cloudflare", "tunnel", "noizylab-tunnel"
        ],
        "aliases": ["INFRA", "CLOUD", "CF"]
    },
    "PERSONAS/ENGR_KEITH": {
        "keywords": ["ENGR_KEITH", "engr_keith", "KEITH", "engineer keith"],
        "path_patterns": ["ENGR_KEITH", "engr_keith", "keith"],
        "aliases": ["KEITH"]
    },
    "PERSONAS/DREAM": {
        "keywords": ["DREAM persona", "dream agent", "DREAM_AGENT"],
        "path_patterns": ["DREAM"],
        "aliases": []
    },
    "PERSONAS/POPS": {
        "keywords": ["POPS", "POPS persona", "pops agent"],
        "path_patterns": ["POPS"],
        "aliases": []
    },
    "PERSONAS/SHIRL": {
        "keywords": ["SHIRL", "SHIRLEY", "shirl persona", "shirley persona"],
        "path_patterns": ["SHIRL", "SHIRLEY"],
        "aliases": ["SHIRLEY"]
    },
    "PERSONAS/EMG": {
        "keywords": ["EMG", " emg "],
        "path_patterns": ["EMG"],
        "aliases": []
    },
    "PERSONAS/RP": {
        "keywords": [
            "RSP_001", "Rob Plowman", "rob plowman", "rplowman",
            "rsplowman", "rp@fishmusicinc"
        ],
        "path_patterns": ["RSP_001", "rsp001", "RP"],
        "aliases": ["ROB", "RSP001", "RP"]
    },
}

# ─────────────────────────────────────────────────────────────────
# SCAN ROOTS — directories to search (skip system paths)
# ─────────────────────────────────────────────────────────────────
HOME = Path.home()

SCAN_ROOTS = [
    HOME / "NOIZYLAB",
    HOME / "NOIZYEMPIRE",
    HOME / "NOIZYANTHROPIC",
    HOME / "GORUNFREE",
    HOME / "noizy",
    HOME / "Projects",
    HOME / "_Config",
    HOME / "Downloads",
    HOME / "Documents",
    HOME / ".claude",
    HOME / ".cursor",
    HOME / ".windsurf",
]

# Add mounted volumes (skip system ones)
VOLUME_SKIP = {"Macintosh HD", "com.apple.TimeMachineLocalSnapshots"}
for vol in Path("/Volumes").iterdir():
    if vol.name not in VOLUME_SKIP and vol.is_dir():
        SCAN_ROOTS.append(vol)

# Skip patterns — never descend into these
SKIP_DIRS = {
    ".git", "node_modules", "__pycache__", ".venv", "venv",
    ".mypy_cache", ".pytest_cache", "dist", "build", ".next",
    "site-packages", "Caches", "com.apple", "CoreData",
    "com.crashlytics", "com.google", "MobileSync",
    ".npm", ".yarn", "bower_components", ".cargo", "target",
    ".gradle", "vendor", "third_party", "extern",
    "ARCHIVE",  # skip old GOLD_SCAN archives — already processed
}

SKIP_PATH_FRAGMENTS = [
    "/System/", "/Library/", "/private/", "/usr/", "/bin/",
    "/sbin/", "/opt/homebrew/", "/.Trash/",
    "/node_modules/", "/site-packages/", "/.git/",
    "/venv/", "/.venv/", "/dist/", "/build/",
    "/Volumes/4TB", "/Volumes/2TB", "/Volumes/MAG",   # raw media drives — skip
    "/Volumes/FISH", "/Volumes/RSP",                   # personal archives — skip
    "/Volumes/NOIZYWIN",                               # Windows mirror — skip
    "/.npm-global/lib/node_modules/",                  # n8n + global packages
    "/Library/CloudStorage/",                          # Google Drive mount — skip (too large)
]

FILE_TYPES = {".md", ".markdown", ".txt", ".rst"}

# ─────────────────────────────────────────────────────────────────
# CLASSIFIER
# ─────────────────────────────────────────────────────────────────

def file_hash(path: Path) -> str:
    h = hashlib.sha256()
    try:
        with open(path, "rb") as f:
            h.update(f.read(65536))  # first 64KB is enough for dedup
    except Exception:
        return ""
    return h.hexdigest()[:16]


def classify_file(path: Path, content: str) -> list[tuple[str, int, list[str]]]:
    """
    Returns list of (project, score, reasons) sorted by score descending.
    Score is based on keyword/path matches. Higher = more confident.
    """
    path_str = str(path).lower()
    content_lower = content.lower()
    filename = path.name.lower()
    scores = defaultdict(lambda: {"score": 0, "reasons": []})

    for project, rules in TAXONOMY.items():
        proj_lower = project.lower()

        # Path pattern match (strong signal — 3 pts each)
        for pattern in rules["path_patterns"]:
            if pattern.lower() in path_str:
                scores[project]["score"] += 3
                scores[project]["reasons"].append(f"path:{pattern}")

        # Filename match (medium signal — 2 pts each)
        for kw in rules["keywords"]:
            kw_lower = kw.lower()
            if kw_lower in filename:
                scores[project]["score"] += 2
                scores[project]["reasons"].append(f"filename:{kw}")

        # Content keyword match (1 pt each, capped at 5 to avoid noise)
        content_hits = 0
        for kw in rules["keywords"]:
            kw_lower = kw.lower()
            if kw_lower in content_lower:
                if content_hits < 5:
                    scores[project]["score"] += 1
                    scores[project]["reasons"].append(f"content:{kw}")
                    content_hits += 1

    results = [
        (proj, data["score"], data["reasons"])
        for proj, data in scores.items()
        if data["score"] > 0
    ]
    results.sort(key=lambda x: x[1], reverse=True)
    return results


# ─────────────────────────────────────────────────────────────────
# SCANNER
# ─────────────────────────────────────────────────────────────────

def should_skip(path: Path) -> bool:
    path_str = str(path)
    for fragment in SKIP_PATH_FRAGMENTS:
        if fragment in path_str:
            return True
    return False


def scan_for_docs(roots: list[Path]):
    """Yield (path, content) for all doc files under roots."""
    seen_paths = set()
    for root in roots:
        if not root.exists():
            continue
        try:
            for dirpath, dirnames, filenames in os.walk(root, followlinks=False):
                dp = Path(dirpath)
                if should_skip(dp):
                    dirnames.clear()
                    continue
                # Prune skip dirs in-place
                dirnames[:] = [d for d in dirnames if d not in SKIP_DIRS]
                for fname in filenames:
                    fpath = dp / fname
                    if fpath.suffix.lower() not in FILE_TYPES:
                        continue
                    if str(fpath) in seen_paths:
                        continue
                    seen_paths.add(str(fpath))
                    try:
                        content = fpath.read_text(errors="ignore")
                    except Exception:
                        content = ""
                    yield fpath, content
        except PermissionError:
            continue


# ─────────────────────────────────────────────────────────────────
# CANONICAL DESTINATION TREE
# ─────────────────────────────────────────────────────────────────

def canonical_dest(project: str, filename: str, empire_root: Path) -> Path:
    """Map a project string to its canonical folder under empire_root."""
    mapping = {
        "NOIZY":               empire_root / "NOIZY",
        "NOIZYLAB":            empire_root / "NOIZYLAB",
        "NOIZYKIDZ":           empire_root / "NOIZYKIDZ",
        "NOIZYFISH":           empire_root / "NOIZYFISH",
        "GABRIEL":             empire_root / "GABRIEL",
        "NOIZYVOX":            empire_root / "NOIZYVOX",
        "DREAMCHAMBER":        empire_root / "DREAMCHAMBER",
        "INFRASTRUCTURE":      empire_root / "INFRASTRUCTURE",
        "PERSONAS/ENGR_KEITH": empire_root / "PERSONAS" / "ENGR_KEITH",
        "PERSONAS/DREAM":      empire_root / "PERSONAS" / "DREAM",
        "PERSONAS/POPS":       empire_root / "PERSONAS" / "POPS",
        "PERSONAS/SHIRL":      empire_root / "PERSONAS" / "SHIRL",
        "PERSONAS/EMG":        empire_root / "PERSONAS" / "EMG",
        "PERSONAS/RP":         empire_root / "PERSONAS" / "RP",
    }
    folder = mapping.get(project, empire_root / "_UNCLASSIFIED")
    return folder / filename


# ─────────────────────────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────────────────────────

def main():
    parser = argparse.ArgumentParser(description="THE ARCHIVIST — NOIZY Empire doc vacuum")
    parser.add_argument("--execute", action="store_true",
                        help="Actually move files (default: dry run)")
    parser.add_argument("--report", action="store_true",
                        help="Print summary report to terminal")
    parser.add_argument("--output", type=str, default="archivist_catalog.json",
                        help="Output file for catalog JSON")
    parser.add_argument("--empire-root", type=str,
                        default=str(HOME / "NOIZY_EMPIRE"),
                        help="Root folder for sorted output")
    args = parser.parse_args()

    empire_root = Path(args.empire_root)

    print(f"\n{'='*60}")
    print("  THE ARCHIVIST — NOIZY Empire Document Vacuum")
    print(f"  Mode: {'EXECUTE (files will move)' if args.execute else 'DRY RUN (catalog only)'}")
    print(f"  Empire root: {empire_root}")
    print(f"  Scanning {len(SCAN_ROOTS)} root paths...")
    print(f"{'='*60}\n")

    catalog = []
    seen_hashes = {}
    stats = defaultdict(int)
    project_counts = defaultdict(int)

    for fpath, content in scan_for_docs(SCAN_ROOTS):
        stats["total"] += 1
        fhash = file_hash(fpath)

        # Deduplication
        duplicate_of = None
        if fhash and fhash in seen_hashes:
            duplicate_of = seen_hashes[fhash]
            stats["duplicates"] += 1
        elif fhash:
            seen_hashes[fhash] = str(fpath)

        # Classify
        matches = classify_file(fpath, content)

        if not matches:
            project = "_UNCLASSIFIED"
            confidence = 0
            reasons = []
            stats["unclassified"] += 1
        elif len(matches) >= 2 and matches[0][1] == matches[1][1]:
            # Tie — send to conflicts
            project = "_CONFLICTS"
            confidence = matches[0][1]
            reasons = matches[0][2] + [f"TIE_WITH:{matches[1][0]}"]
            stats["conflicts"] += 1
        else:
            project = matches[0][0]
            confidence = matches[0][1]
            reasons = matches[0][2]
            stats["classified"] += 1

        project_counts[project] += 1

        dest = canonical_dest(project, fpath.name, empire_root) if project not in ("_UNCLASSIFIED", "_CONFLICTS") else empire_root / project / fpath.name

        entry = {
            "source": str(fpath),
            "filename": fpath.name,
            "project": project,
            "confidence": confidence,
            "reasons": reasons,
            "dest": str(dest),
            "hash": fhash,
            "duplicate_of": duplicate_of,
            "size_bytes": fpath.stat().st_size if fpath.exists() else 0,
            "scanned_at": datetime.now().isoformat(),
        }
        catalog.append(entry)

        if args.report:
            dupe_flag = " [DUPE]" if duplicate_of else ""
            print(f"  [{project:25s}] {fpath.name}{dupe_flag}")

    # Write catalog
    output_path = Path(args.output)
    with open(output_path, "w") as f:
        json.dump({
            "generated_at": datetime.now().isoformat(),
            "empire_root": str(empire_root),
            "stats": dict(stats),
            "project_counts": dict(sorted(project_counts.items(), key=lambda x: -x[1])),
            "files": catalog,
        }, f, indent=2)

    # Print summary
    print(f"\n{'='*60}")
    print("  CATALOG COMPLETE")
    print(f"{'='*60}")
    print(f"  Total files scanned:  {stats['total']}")
    print(f"  Classified:           {stats['classified']}")
    print(f"  Unclassified:         {stats['unclassified']}")
    print(f"  Conflicts (ties):     {stats['conflicts']}")
    print(f"  Duplicates found:     {stats['duplicates']}")
    print("\n  BY PROJECT:")
    for proj, count in sorted(project_counts.items(), key=lambda x: -x[1]):
        print(f"    {proj:30s} {count:4d} files")
    print(f"\n  Catalog saved to: {output_path}")

    if args.execute:
        print(f"\n{'='*60}")
        print("  EXECUTING SORT...")
        print(f"{'='*60}")
        moved = 0
        skipped_dupes = 0
        errors = 0
        for entry in catalog:
            if entry["duplicate_of"]:
                skipped_dupes += 1
                continue
            if entry["project"] in ("_UNCLASSIFIED", "_CONFLICTS", "PERSONAS/EMG"):
                continue  # These need human review
            src = Path(entry["source"])
            dst = Path(entry["dest"])
            if not src.exists():
                continue
            try:
                dst.parent.mkdir(parents=True, exist_ok=True)
                # Don't overwrite existing files — rename with suffix
                if dst.exists():
                    stem = dst.stem
                    suffix = dst.suffix
                    dst = dst.parent / f"{stem}__{entry['hash']}{suffix}"
                src.rename(dst)
                entry["moved_to"] = str(dst)
                moved += 1
            except Exception as e:
                entry["error"] = str(e)
                errors += 1

        # Re-save catalog with move results
        with open(output_path, "w") as f:
            json.dump({
                "generated_at": datetime.now().isoformat(),
                "empire_root": str(empire_root),
                "executed": True,
                "stats": {**dict(stats), "moved": moved, "skipped_dupes": skipped_dupes, "errors": errors},
                "project_counts": dict(sorted(project_counts.items(), key=lambda x: -x[1])),
                "files": catalog,
            }, f, indent=2)

        print(f"  Moved:   {moved} files")
        print(f"  Skipped (dupes): {skipped_dupes}")
        print(f"  Errors:  {errors}")
        print(f"  Manifest updated: {output_path}")
    else:
        print(f"\n  Run with --execute to move files into {empire_root}/")
        print("  Review _UNCLASSIFIED and _CONFLICTS in the catalog first.\n")


if __name__ == "__main__":
    main()
