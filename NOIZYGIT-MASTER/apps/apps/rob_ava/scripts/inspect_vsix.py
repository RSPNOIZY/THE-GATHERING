#!/usr/bin/env python3
"""Inspect a VSIX package and report reusable components."""

from __future__ import annotations

import argparse
import json
import re
import shutil
import subprocess
import sys
from pathlib import Path
from xml.etree import ElementTree as ET


KEYWORD_GROUPS = {
    "ai": ["openai", "llm", "prompt", "embedding", "rag", "vector"],
    "audio": ["audio", "voice", "tts", "stt", "speech", "phoneme"],
    "policy": ["consent", "license", "approval", "audit", "compliance"],
    "ui": ["webview", "react", "vue", "svelte", "ui", "dashboard"],
}
IGNORE_FILE_MARKERS = ("min.js", "min.css", "tabulator", "vendor", "bundle")


def run(command: list[str]) -> subprocess.CompletedProcess[str]:
    return subprocess.run(command, capture_output=True, text=True, check=False)


def parse_vsixmanifest(path: Path) -> dict:
    if not path.exists():
        return {}
    tree = ET.parse(path)
    root = tree.getroot()
    ns = {"v": "http://schemas.microsoft.com/developer/vsx-schema/2011"}

    identity = root.find(".//v:Identity", ns)
    display_name = root.findtext(".//v:DisplayName", default="", namespaces=ns)
    description = root.findtext(".//v:Description", default="", namespaces=ns)
    tags = root.findtext(".//v:Tags", default="", namespaces=ns)

    return {
        "id": identity.attrib.get("Id", "") if identity is not None else "",
        "publisher": identity.attrib.get("Publisher", "") if identity is not None else "",
        "version": identity.attrib.get("Version", "") if identity is not None else "",
        "display_name": display_name.strip(),
        "description": description.strip(),
        "tags": tags.strip(),
    }


def parse_package_json(path: Path) -> dict:
    if not path.exists():
        return {}
    try:
        payload = json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return {}

    contributes = payload.get("contributes", {}) if isinstance(payload, dict) else {}
    return {
        "name": payload.get("name", ""),
        "displayName": payload.get("displayName", ""),
        "version": payload.get("version", ""),
        "publisher": payload.get("publisher", ""),
        "description": payload.get("description", ""),
        "categories": payload.get("categories", []),
        "activationEvents": payload.get("activationEvents", []),
        "has_webview": "webview" in json.dumps(contributes).lower(),
    }


def keyword_scan(root: Path) -> dict[str, list[str]]:
    hits: dict[str, list[str]] = {key: [] for key in KEYWORD_GROUPS}
    files = [
        p
        for p in root.rglob("*")
        if p.is_file() and p.suffix.lower() in {".js", ".ts", ".json", ".md", ".txt", ".xml"}
    ]

    for file_path in files:
        lowered_name = file_path.name.lower()
        if any(marker in lowered_name for marker in IGNORE_FILE_MARKERS):
            continue
        try:
            text = file_path.read_text(encoding="utf-8", errors="ignore").lower()
        except OSError:
            continue

        for group, keywords in KEYWORD_GROUPS.items():
            if any(re.search(rf"\b{re.escape(keyword)}\b", text) for keyword in keywords):
                hits[group].append(str(file_path))

    return {k: sorted(v)[:30] for k, v in hits.items() if v}


def main() -> int:
    parser = argparse.ArgumentParser(description="Inspect VSIX package")
    parser.add_argument("vsix_path", help="Path to .vsix file")
    parser.add_argument(
        "--out-dir",
        default="/Users/m2ultra/NOIZYLAB/rob_ava/data/vsix_inspection",
        help="Extraction/report output directory",
    )
    parser.add_argument("--keep-existing", action="store_true")
    args = parser.parse_args()

    vsix_path = Path(args.vsix_path).expanduser().resolve()
    if not vsix_path.exists() or vsix_path.suffix.lower() != ".vsix":
        print(f"error: invalid VSIX path: {vsix_path}", file=sys.stderr)
        return 2

    base_name = vsix_path.stem
    out_root = Path(args.out_dir).expanduser().resolve() / base_name
    extracted = out_root / "extracted"

    if out_root.exists() and not args.keep_existing:
        shutil.rmtree(out_root)
    extracted.mkdir(parents=True, exist_ok=True)

    unzip_result = run(["unzip", "-q", str(vsix_path), "-d", str(extracted)])
    if unzip_result.returncode != 0:
        print(f"error: failed to unzip VSIX: {unzip_result.stderr}", file=sys.stderr)
        return 3

    manifest_info = parse_vsixmanifest(extracted / "extension.vsixmanifest")
    package_info = parse_package_json(extracted / "extension" / "package.json")
    hits = keyword_scan(extracted)
    ai_audio_hits = len(hits.get("ai", [])) + len(hits.get("audio", []))

    report = {
        "vsix_path": str(vsix_path),
        "extracted_dir": str(extracted),
        "manifest": manifest_info,
        "package": package_info,
        "keyword_hits": hits,
        "relevance_summary": {
            "likely_relevant_to_rob_ava": ai_audio_hits >= 2,
            "note": (
                "High potential for Rob.AVA integration (AI/audio code present)"
                if ai_audio_hits >= 2
                else "Low for Rob.AVA core; mostly IDE/debugger functionality"
            ),
        },
    }

    report_path = out_root / "inspection_report.json"
    report_path.write_text(json.dumps(report, indent=2), encoding="utf-8")

    print(json.dumps(report, indent=2))
    print(f"\nSaved report: {report_path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
