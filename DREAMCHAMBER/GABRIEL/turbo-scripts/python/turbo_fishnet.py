#!/usr/bin/env python3
"""
turbo_fishnet.py
The Global Fishnet.
Scans the universe for Heavy Media ("Big Fish") effectively.
Daily Catch Protocol.

Identity rule:
- Canonical FISHMUSICINC contact: rsp@fishmusicinc.com
- Legacy alias: rp@fishmusicinc.com (audit-only)
- Legacy GoogleDrive-rp@fishmusicinc.com mount is disabled unless NOIZY_ALLOW_LEGACY_RP_DRIVE=1
"""
from __future__ import annotations

import argparse
import datetime
import json
import os
import shutil
import subprocess
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
from typing import Iterable, Optional

# Configuration
SEARCH_DIRS = [
    Path.home() / "NOIZYANTHROPIC" / "NOIZYLAB",
    Path.home() / "Documents" / "PROJECTS",
]
TARGET_EXTENSIONS = {
    ".nki", ".nkm", ".nkc", ".nicnt",  # Kontakt
    ".nkx", ".ncw",                    # Kontakt Samples
    ".wav", ".aif", ".aiff", ".flac",  # Audio
    ".mp4", ".mov", ".mkv", ".avi",    # Video
    ".dmg", ".iso", ".img",            # Disk Images
    ".logicx", ".zip", ".tar.gz",       # Archives/Projects
}
ARCHIVE_ROOT = Path("/Volumes/HP-OMEN/ARCHIVE")
LOCAL_ARCHIVE = Path.home() / "NOIZYANTHROPIC" / "NOIZYLAB" / "_ARCHIVE"
LOCAL_MEDIA_VAULT = Path.home() / "NOIZY_AI" / "_MEDIA_VAULT"
RECEIPT_FILE = Path(os.environ.get("NOIZY_RECEIPT_FILE", str(Path.home() / "NOIZY_AI" / "_RECEIPTS" / "fishnet.jsonl")))


def expand(path: str) -> Path:
    return Path(os.path.expanduser(path))


def media_drive_candidates() -> Iterable[Path]:
    env_path = os.environ.get("NOIZY_MEDIA_DRIVE")
    if env_path:
        yield expand(env_path)

    yield Path.home() / "Library/CloudStorage/GoogleDrive-rsplowman@icloud.com/My Drive"
    yield Path.home() / "Library/CloudStorage/GoogleDrive-rsp@fishmusicinc.com/My Drive"
    yield Path.home() / "Library/CloudStorage/GoogleDrive-rsp@noizy.ai/My Drive"
    yield LOCAL_MEDIA_VAULT

    if os.environ.get("NOIZY_ALLOW_LEGACY_RP_DRIVE") == "1":
        yield Path.home() / "Library/CloudStorage/GoogleDrive-rp@fishmusicinc.com/My Drive"
        yield Path.home() / "Library/CloudStorage/GoogleDrive-rp@fishmusicinc.com/Shared Drives"


def resolve_media_drive(explicit: Optional[str] = None) -> Path:
    if explicit:
        candidate = expand(explicit)
        if candidate.exists():
            return candidate
        print(f"⚠️  Explicit drive path missing, using fallback: {candidate}")

    for candidate in media_drive_candidates():
        if candidate.exists():
            return candidate

    LOCAL_MEDIA_VAULT.mkdir(parents=True, exist_ok=True)
    return LOCAL_MEDIA_VAULT


def emit_receipt(action: str, status: str, **extra: object) -> None:
    RECEIPT_FILE.parent.mkdir(parents=True, exist_ok=True)
    payload = {
        "timestamp": datetime.datetime.now(datetime.timezone.utc).isoformat(),
        "tool": "turbo_fishnet.py",
        "action": action,
        "status": status,
        "canonical_contact": "rsp@fishmusicinc.com",
        "legacy_alias": "rp@fishmusicinc.com",
        "legacy_drive_enabled": os.environ.get("NOIZY_ALLOW_LEGACY_RP_DRIVE") == "1",
        **extra,
    }
    with RECEIPT_FILE.open("a", encoding="utf-8") as fh:
        fh.write(json.dumps(payload, ensure_ascii=False) + "\n")


def get_size_mb(path: Path) -> float:
    return path.stat().st_size / (1024 * 1024)


def _scan_one_dir(root_dir: Path, min_mb: float) -> list[tuple[Path, float]]:
    hits: list[tuple[Path, float]] = []
    if not root_dir.exists():
        return hits
    for path in root_dir.rglob("*"):
        if path.is_file() and path.suffix.lower() in TARGET_EXTENSIONS:
            if "_ARCHIVE" in str(path):
                continue
            try:
                size = get_size_mb(path)
                if size > min_mb:
                    hits.append((path, size))
            except OSError:
                pass
    return hits


def scan_ocean(min_mb: float = 10.0) -> list[tuple[Path, float]]:
    print("🌊 CASTING THE GLOBAL FISHNET (PARALLEL)...")
    print(f"   Targets: {', '.join(sorted(TARGET_EXTENSIONS))}")
    print(f"   Min size: {min_mb:.1f} MB")

    big_fish: list[tuple[Path, float]] = []
    total_size = 0.0

    with ThreadPoolExecutor(max_workers=max(1, len(SEARCH_DIRS))) as pool:
        results = pool.map(lambda root: _scan_one_dir(root, min_mb), SEARCH_DIRS)

    for hits in results:
        for path, size in hits:
            big_fish.append((path, size))
            total_size += size
            print(f"   🐟 CAUGHT: {path.name} ({size:.1f} MB)")

    print("-" * 40)
    print(f"🦈 TOTAL CATCH: {len(big_fish)} Fish")
    print(f"⚖️  TOTAL WEIGHT: {total_size:.1f} MB")
    print("-" * 40)
    emit_receipt("scan", "ok", count=len(big_fish), total_mb=round(total_size, 2))
    return big_fish


def archive_catch(fish_list: list[tuple[Path, float]], dry_run: bool = False) -> None:
    dest_root = ARCHIVE_ROOT if ARCHIVE_ROOT.exists() else LOCAL_ARCHIVE
    dest_root.mkdir(parents=True, exist_ok=True)

    print(f"📦 ARCHIVING TO: {dest_root}")

    moved = 0
    for fish, _size in fish_list:
        try:
            rel_path = fish.relative_to(Path.home())
        except ValueError:
            rel_path = Path(fish.name)

        dest_path = dest_root / rel_path
        dest_path.parent.mkdir(parents=True, exist_ok=True)

        print(f"   -> Moving {fish.name}...")
        if dry_run:
            continue
        try:
            shutil.move(str(fish), str(dest_path))
            moved += 1
        except Exception as e:  # noqa: BLE001
            print(f"   ❌ FAILED to move {fish.name}: {e}")

    emit_receipt("archive", "ok", moved=moved, dry_run=dry_run, destination=str(dest_root))
    print("✨ DECK CLEARED.")


def install_cron() -> None:
    script_path = Path(__file__).resolve()
    cron_cmd = f"0 4 * * * /usr/bin/python3 {script_path} --scan >> {Path.home()}/NOIZYANTHROPIC/NOIZYLAB/logs/fishnet.log 2>&1"

    current_cron = subprocess.run(["crontab", "-l"], capture_output=True, text=True).stdout
    if str(script_path) in current_cron:
        print("✅ Fishnet Cron already active.")
        emit_receipt("install-cron", "already_active")
        return

    new_cron = current_cron + "\n" + cron_cmd + "\n"
    proc = subprocess.Popen(["crontab", "-"], stdin=subprocess.PIPE, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
    _out, err = proc.communicate(input=new_cron)

    if proc.returncode == 0:
        print("✅ FISHNET SCHEDULED: Daily @ 04:00 AM")
        emit_receipt("install-cron", "ok")
    else:
        print(f"❌ Cron Install Failed: {err}")
        emit_receipt("install-cron", "failed", error=err)


def archive_catch_to_drive(fish_list: list[tuple[Path, float]], dest_root: Path, dry_run: bool = False) -> None:
    dest_root.mkdir(parents=True, exist_ok=True)
    count = 0
    for fish, size in fish_list:
        try:
            rel_path = fish.relative_to(Path.home())
        except ValueError:
            rel_path = Path(fish.name)

        target = dest_root / rel_path
        target.parent.mkdir(parents=True, exist_ok=True)

        if not target.exists() or target.stat().st_size != fish.stat().st_size:
            print(f"   📤 UPLOADING: {fish.name} ({size:.1f} MB)...")
            if not dry_run:
                shutil.copy2(str(fish), str(target))
            count += 1

    emit_receipt("backup-drive", "ok", uploaded=count, dry_run=dry_run, destination=str(dest_root))
    print(f"✨ BACKUP COMPLETE. {count} Files {'Would Upload' if dry_run else 'Uploaded'}.")


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="NOIZY fishnet media scanner/backer-upper")
    parser.add_argument("--archive", action="store_true", help="move found media into archive")
    parser.add_argument("--install-cron", action="store_true", help="install daily cron job")
    parser.add_argument("--kontakt-only", action="store_true", help="scan Kontakt-related formats only")
    parser.add_argument("--backup-drive", action="store_true", help="copy found media to resolved media drive")
    parser.add_argument("--drive", help="explicit media drive path for this run")
    parser.add_argument("--min-mb", type=float, default=10.0, help="minimum file size in MB")
    parser.add_argument("--dry-run", action="store_true", help="show actions without moving/copying")
    return parser.parse_args()


def main() -> None:
    global TARGET_EXTENSIONS
    args = parse_args()

    if args.install_cron:
        install_cron()
        return

    if args.kontakt_only:
        print("🎹 KONTAKT MODE ENGAGED. Scanning for Instruments & Samples...")
        TARGET_EXTENSIONS = {".nki", ".nkm", ".nkc", ".nicnt", ".nkx", ".ncw", ".wav", ".aif"}

    fish = scan_ocean(min_mb=args.min_mb)

    if args.archive:
        archive_catch(fish, dry_run=args.dry_run)
        return

    if args.backup_drive:
        drive_path = resolve_media_drive(args.drive)
        dest = drive_path / "NOIZYLAB_LIBRARIES"
        print("♾️  INFINITE BACKUP STARTED.")
        print(f"   Destination: {dest}")
        archive_catch_to_drive(fish, dest, dry_run=args.dry_run)
        return

    print("\nOptions: --archive, --install-cron, --kontakt-only, --backup-drive, --drive PATH, --min-mb N, --dry-run")


if __name__ == "__main__":
    main()
