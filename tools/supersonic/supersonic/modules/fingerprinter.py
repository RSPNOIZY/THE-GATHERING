"""
SUPERSONIC Fingerprinter — Duplicate Detection & Audio Identity
================================================================
Uses SHA-256 for exact byte matches, and acoustic fingerprinting
for content-level matching (same song, different encoding).
"""

from __future__ import annotations
import hashlib
from collections import defaultdict
from typing import Optional
from ..models import AudioAsset


class AudioFingerprinter:
    """
    Two-layer duplicate detection:
    1. SHA-256: Exact byte-for-byte duplicates
    2. Acoustic fingerprint: Same content, different encoding/quality
    """

    def __init__(self, use_acoustid: bool = False):
        """
        Args:
            use_acoustid: Enable chromaprint fingerprinting.
                          Requires fpcalc binary installed.
        """
        self.use_acoustid = use_acoustid
        self._hash_groups: dict[str, list[AudioAsset]] = defaultdict(list)
        self._acoustic_groups: dict[str, list[AudioAsset]] = defaultdict(list)

    def fingerprint(self, asset: AudioAsset) -> AudioAsset:
        """Compute fingerprints for a single asset."""
        if asset.is_empty or asset.file_size_bytes == 0:
            return asset

        # Layer 1: SHA-256
        try:
            sha = self._compute_sha256(asset.file_path)
            asset.sha256 = sha
            self._hash_groups[sha].append(asset)
        except Exception:
            asset.tags.append("hash_error")

        # Layer 2: Acoustic fingerprint (if enabled and fpcalc available)
        if self.use_acoustid:
            try:
                fp = self._compute_chromaprint(asset.file_path)
                if fp:
                    asset.waveform.chromaprint = fp
                    # Use first 100 chars as group key (fuzzy matching)
                    key = fp[:100] if len(fp) > 100 else fp
                    self._acoustic_groups[key].append(asset)
            except Exception:
                asset.tags.append("chromaprint_error")

        return asset

    def find_duplicates(self, assets: list[AudioAsset]) -> list[AudioAsset]:
        """
        After fingerprinting all assets, identify duplicate groups.
        Returns the same list with duplicate_group_id and is_primary_copy set.
        """
        # Reset groups
        self._hash_groups.clear()

        # Group by SHA-256
        for asset in assets:
            if asset.sha256:
                self._hash_groups[asset.sha256].append(asset)

        # Mark duplicates
        group_counter = 0
        for sha, group in self._hash_groups.items():
            if len(group) > 1:
                group_counter += 1
                group_id = f"DUP_{group_counter:04d}"

                # Sort by path — shortest/cleanest path is primary
                group.sort(key=lambda a: len(a.file_path))

                for i, asset in enumerate(group):
                    asset.duplicate_group_id = group_id
                    asset.is_primary_copy = (i == 0)
                    asset.duplicate_paths = [a.file_path for a in group if a.file_path != asset.file_path]

        # Content-level duplicates (same song, different format)
        # Group by filename stem (e.g., "Half the Battle" appears as .wav and .mp3)
        name_groups: dict[str, list[AudioAsset]] = defaultdict(list)
        for asset in assets:
            # Normalize: strip numbers, extensions, common prefixes
            stem = self._normalize_name(asset.file_name)
            if stem:
                name_groups[stem].append(asset)

        for stem, group in name_groups.items():
            if len(group) > 1:
                # Check if they're actually different formats of the same content
                formats = set(a.format for a in group)
                if len(formats) > 1:
                    # Multi-format group — tag them
                    for asset in group:
                        if "multi_format" not in asset.tags:
                            asset.tags.append("multi_format")
                            asset.tags.append(f"also_as:{','.join(f.value for f in formats if f != asset.format)}")

        return assets

    def _compute_sha256(self, filepath: str) -> str:
        """Compute SHA-256 hash of file contents."""
        sha = hashlib.sha256()
        with open(filepath, "rb") as f:
            for chunk in iter(lambda: f.read(65536), b""):
                sha.update(chunk)
        return sha.hexdigest()

    def _compute_chromaprint(self, filepath: str) -> Optional[str]:
        """Compute chromaprint acoustic fingerprint using fpcalc."""
        import subprocess
        try:
            result = subprocess.run(
                ["fpcalc", "-json", filepath],
                capture_output=True, text=True, timeout=30
            )
            if result.returncode == 0:
                import json
                data = json.loads(result.stdout)
                return data.get("fingerprint")
        except (FileNotFoundError, subprocess.TimeoutExpired, Exception):
            return None
        return None

    def _normalize_name(self, filename: str) -> str:
        """Normalize filename for content-level comparison."""
        from pathlib import Path
        stem = Path(filename).stem.lower()
        # Strip common prefixes like track numbers
        import re
        # Remove leading numbers, dots, dashes, spaces
        stem = re.sub(r"^[\d\.\-\s_x]+", "", stem)
        # Remove common suffixes
        for suffix in ["(single)", "master", "final", "_v1", "_v2", "48 24"]:
            stem = stem.replace(suffix.lower(), "")
        # Collapse whitespace
        stem = re.sub(r"\s+", " ", stem).strip()
        return stem

    @property
    def duplicate_count(self) -> int:
        """Total number of files that are duplicates (not counting primaries)."""
        count = 0
        for group in self._hash_groups.values():
            if len(group) > 1:
                count += len(group) - 1
        return count

    @property
    def duplicate_groups(self) -> dict[str, list[str]]:
        """Return duplicate groups as {group_id: [paths]}."""
        result = {}
        seen = set()
        for sha, group in self._hash_groups.items():
            if len(group) > 1 and sha not in seen:
                seen.add(sha)
                gid = group[0].duplicate_group_id or sha[:12]
                result[gid] = [a.file_path for a in group]
        return result
