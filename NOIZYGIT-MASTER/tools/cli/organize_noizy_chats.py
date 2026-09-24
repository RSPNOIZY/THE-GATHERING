#!/usr/bin/env python3
"""
NOIZY.AI chat organizer for THE-GATHERING.

This script organizes exported/copied chat files from:
  NOIZY.AI/_CHAT_ARCHIVE/_UNSORTED_INBOX

Into:
  NOIZY.AI/_CHAT_ARCHIVE/YYYY/YYYY-MM-DD_PROJECT_TOPIC.md

It does not fetch chats from Copilot, ChatGPT, GitHub, or any private sidebar.
It only organizes files you have exported or copied into the inbox.
"""

from __future__ import annotations

import hashlib
import json
import re
from datetime import datetime
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
ARCHIVE = ROOT / "NOIZY.AI" / "_CHAT_ARCHIVE"
INBOX = ARCHIVE / "_UNSORTED_INBOX"
INDEX_DIR = ARCHIVE / "_INDEX"
EMPTY_DUPES = ARCHIVE / "_EMPTY_OR_DUPLICATE"

PROJECT_KEYWORDS = [
    ("NOIZYLAB.CA", ["noizylab", "hvs", "human voice sovereignty", "cira", "hexonet", "centralnic"]),
    ("NOIZYKIDZ.COM", ["noizykidz", "kidz", "kids"]),
    ("NOIZYAI", ["noizy.ai", "noizyai", "noizy ai", "noisy ai"]),
    ("NOIZYWORLD", ["noizyworld", "noisyworld"]),
    ("NOIZYBEAST", ["noizybeast", "noisy beast"]),
    ("DREAMCHAMBER", ["dreamchamber", "dream chamber"]),
    ("THEAQUARIUM", ["aquarium", "the aquarium"]),
    ("MC96", ["mc96"]),
    ("TITANSTACK", ["titanstack", "titan stack"]),
    ("DOMAIN_DNS", ["cloudflare", "dns", "nameserver", "registrar", "domain"]),
    ("IDENTITY_EMAIL", ["icloud", "email", "rsp@", "rsplowman", "recovery"]),
    ("GITHUB_REPO", ["github", "repo", "repository", "the-gathering"]),
]

DATE_PATTERNS = [
    re.compile(r"(20\d{2})[-_/\.](\d{2})[-_/\.](\d{2})"),
    re.compile(r"(\d{2})[-_/\.](\d{2})[-_/\.](20\d{2})"),
]


def slug(text: str) -> str:
    text = text.upper().replace("NOISY", "NOIZY")
    text = re.sub(r"[^A-Z0-9]+", "_", text)
    text = re.sub(r"_+", "_", text).strip("_")
    return text[:80] or "CHAT"


def sha256_text(text: str) -> str:
    return hashlib.sha256(text.encode("utf-8", errors="ignore")).hexdigest()


def read_file(path: Path) -> str:
    data = path.read_text(errors="ignore")
    if path.suffix.lower() == ".json":
        try:
            parsed = json.loads(data)
            return json.dumps(parsed, indent=2, ensure_ascii=False)
        except Exception:
            return data
    return data


def infer_date(path: Path, text: str) -> str:
    haystacks = [path.name, text[:5000]]
    for hay in haystacks:
        for pattern in DATE_PATTERNS:
            m = pattern.search(hay)
            if not m:
                continue
            a, b, c = m.groups()
            if a.startswith("20"):
                y, mo, d = a, b, c
            else:
                mo, d, y = a, b, c
            try:
                return datetime(int(y), int(mo), int(d)).strftime("%Y-%m-%d")
            except ValueError:
                pass
    return datetime.fromtimestamp(path.stat().st_mtime).strftime("%Y-%m-%d")


def infer_project(text: str, filename: str) -> str:
    hay = f"{filename}\n{text}".lower()
    scored = []
    for project, words in PROJECT_KEYWORDS:
        score = sum(hay.count(w.lower()) for w in words)
        if score:
            scored.append((score, project))
    if not scored:
        return "UNCLASSIFIED"
    scored.sort(reverse=True)
    return scored[0][1]


def infer_topic(text: str, filename: str, project: str) -> str:
    first_lines = [line.strip("# \t") for line in text.splitlines() if line.strip()][:8]
    candidate = first_lines[0] if first_lines else Path(filename).stem
    candidate = candidate.replace("noisy", "noizy").replace("Noisy", "NOIZY")
    candidate = slug(candidate)
    if candidate in {"CHAT", "UNTITLED", "CONVERSATION"}:
        candidate = project
    return candidate


def main() -> None:
    INBOX.mkdir(parents=True, exist_ok=True)
    INDEX_DIR.mkdir(parents=True, exist_ok=True)
    EMPTY_DUPES.mkdir(parents=True, exist_ok=True)

    seen_hashes: dict[str, Path] = {}
    records = []

    for path in sorted(INBOX.iterdir()):
        if not path.is_file() or path.name == "README.md":
            continue
        if path.suffix.lower() not in {".md", ".txt", ".json"}:
            continue

        text = read_file(path)
        digest = sha256_text(text)
        non_ws_len = len(re.sub(r"\s+", "", text))

        if non_ws_len < 20:
            target = EMPTY_DUPES / path.name
            path.rename(target)
            records.append(("empty", path.name, str(target), digest))
            continue

        if digest in seen_hashes:
            target = EMPTY_DUPES / f"DUPLICATE_OF_{seen_hashes[digest].name}__{path.name}"
            path.rename(target)
            records.append(("duplicate", path.name, str(target), digest))
            continue

        seen_hashes[digest] = path
        date = infer_date(path, text)
        year = date[:4]
        project = infer_project(text, path.name)
        topic = infer_topic(text, path.name, project)
        target_dir = ARCHIVE / year
        target_dir.mkdir(parents=True, exist_ok=True)
        target = target_dir / f"{date}_{project}_{topic}.md"

        counter = 2
        while target.exists():
            target = target_dir / f"{date}_{project}_{topic}_{counter}.md"
            counter += 1

        header = (
            f"# {project} — {topic}\n\n"
            f"Original file: `{path.name}`\n"
            f"Archived: {datetime.now().isoformat(timespec='seconds')}\n"
            f"SHA256: `{digest}`\n\n"
            "---\n\n"
        )
        target.write_text(header + text, encoding="utf-8")
        path.unlink()
        records.append(("archived", path.name, str(target.relative_to(ROOT)), digest))

    index_path = INDEX_DIR / "CHAT_INDEX.md"
    lines = ["# NOIZY.AI Chat Index", "", f"Generated: {datetime.now().isoformat(timespec='seconds')}", "", "| Status | Source | Target | SHA256 |", "|---|---|---|---|"]
    for status, source, target, digest in records:
        lines.append(f"| {status} | `{source}` | `{target}` | `{digest[:16]}` |")
    if len(records) == 0:
        lines.append("| no-op | No new files found |  |  |")
    index_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(f"Wrote {index_path}")


if __name__ == "__main__":
    main()
