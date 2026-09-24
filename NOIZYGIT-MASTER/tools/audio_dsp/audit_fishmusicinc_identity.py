#!/usr/bin/env python3
"""Audit FISHMUSICINC identity references in THE-GATHERING.

Fails when active files contain forbidden legacy defaults.
Allowed contexts are audit/docs that explicitly mark rp@fishmusicinc.com as legacy.
"""
from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
FORBIDDEN = [
    "GoogleDrive-rp@fishmusicinc.com",
]
LEGACY_EMAIL = "rp@fishmusicinc.com"
CANONICAL_EMAIL = "rsp@fishmusicinc.com"
ALLOWED_LEGACY_PATH_PARTS = {
    "NOIZY.AI/FISHMUSICINC.COM/specs/EMAIL_IDENTITY_AUDIT.md",
}
ALLOWED_LEGACY_CONTEXT = re.compile(r"legacy|audit-only|NOIZY_ALLOW_LEGACY_RP_DRIVE", re.IGNORECASE)


def tracked_files() -> list[Path]:
    result = subprocess.run(["git", "ls-files"], cwd=ROOT, check=True, capture_output=True, text=True)
    return [ROOT / line for line in result.stdout.splitlines() if line.strip()]


def main() -> int:
    violations = []
    canonical_hits = []

    for path in tracked_files():
        if not path.is_file():
            continue
        rel = path.relative_to(ROOT).as_posix()
        try:
            text = path.read_text(encoding="utf-8")
        except UnicodeDecodeError:
            continue

        for token in FORBIDDEN:
            if token in text:
                violations.append({"file": rel, "token": token, "reason": "legacy drive mount is forbidden as an active/default reference"})

        if LEGACY_EMAIL in text:
            if rel not in ALLOWED_LEGACY_PATH_PARTS and not ALLOWED_LEGACY_CONTEXT.search(text):
                violations.append({"file": rel, "token": LEGACY_EMAIL, "reason": "legacy email must be marked legacy/audit-only"})

        if CANONICAL_EMAIL in text:
            canonical_hits.append(rel)

    receipt = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        "tool": "scripts/audit_fishmusicinc_identity.py",
        "canonical_email": CANONICAL_EMAIL,
        "legacy_email": LEGACY_EMAIL,
        "canonical_hit_count": len(set(canonical_hits)),
        "violations": violations,
    }
    receipt_dir = ROOT / "NOIZY.AI" / "FISHMUSICINC.COM" / "receipts"
    receipt_dir.mkdir(parents=True, exist_ok=True)
    with (receipt_dir / "identity-audit-latest.json").open("w", encoding="utf-8") as fh:
        json.dump(receipt, fh, indent=2)
        fh.write("\n")

    if violations:
        print("❌ FISHMUSICINC identity audit failed:")
        for item in violations:
            print(f"  - {item['file']}: {item['token']} ({item['reason']})")
        return 1

    print("✅ FISHMUSICINC identity audit passed")
    print(f"   canonical references: {len(set(canonical_hits))}")
    print(f"   receipt: {receipt_dir / 'identity-audit-latest.json'}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
