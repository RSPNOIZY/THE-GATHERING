"""
SUPERSONIC Scanner — Finds Every Sound on the Machine
======================================================
Recursive file discovery with intelligent filtering.
Knows the difference between your masters and scipy test data.
"""

from __future__ import annotations
import os
import stat
from pathlib import Path
from datetime import datetime
from typing import Generator
from ..models import AudioAsset, AudioFormat, ScanReport

# Every audio extension SUPERSONIC recognizes
AUDIO_EXTENSIONS: dict[str, AudioFormat] = {
    ".wav": AudioFormat.WAV,
    ".mp3": AudioFormat.MP3,
    ".flac": AudioFormat.FLAC,
    ".aif": AudioFormat.AIF,
    ".aiff": AudioFormat.AIFF,
    ".m4a": AudioFormat.M4A,
    ".ogg": AudioFormat.OGG,
    ".opus": AudioFormat.OPUS,
    ".au": AudioFormat.AU,
    ".caf": AudioFormat.CAF,
    ".wma": AudioFormat.WMA,
}

# Paths that are ALWAYS noise — never real user audio
NOISE_PATH_PATTERNS: list[str] = [
    "site-packages/scipy/io/tests",
    "site-packages/gradio/test_data",
    "site-packages/gradio/media_assets",
    "node_modules/",
    ".Trash/",
    "GarageBand Library",
    "Logic Pro Library.bundle",
    "ProgramData/Lenovo",
    "ProgramData/Wondershare",
    "ProgramData/CyberLink",
    ".app/Contents/",
    "__pycache__/",
    ".git/",
    "venv/lib/python",
    ".venv/lib/python",
    "/Library/Audio/",
    "/Library/Sounds/",
]

# VST/AU plugin paths (special handling)
PLUGIN_PATH_PATTERNS: list[str] = [
    "/Library/Audio/Plug-Ins/",
    "Audio Music Apps/",
    ".component/",
    ".vst/",
    ".vst3/",
    "Sonnox/",
]


def is_noise_path(filepath: str) -> bool:
    """Check if a file path is known noise (test data, system sounds, etc.)."""
    for pattern in NOISE_PATH_PATTERNS:
        if pattern in filepath:
            return True
    return False


def is_plugin_path(filepath: str) -> bool:
    """Check if this is a VST/AU plugin-related audio file."""
    for pattern in PLUGIN_PATH_PATTERNS:
        if pattern in filepath:
            return True
    return False


def get_audio_format(filepath: str) -> AudioFormat:
    """Determine audio format from file extension."""
    ext = Path(filepath).suffix.lower()
    return AUDIO_EXTENSIONS.get(ext, AudioFormat.UNKNOWN)


class SupersonicScanner:
    """
    The eyes of SUPERSONIC. Walks every directory,
    finds every sound, and builds initial AudioAsset records.
    """

    def __init__(
        self,
        scan_paths: list[str] | None = None,
        exclude_noise: bool = True,
        include_empty: bool = True,
        machine_name: str = "GOD",
        max_depth: int | None = None,
    ):
        self.scan_paths = scan_paths or [os.path.expanduser("~")]
        self.exclude_noise = exclude_noise
        self.include_empty = include_empty
        self.machine_name = machine_name
        self.max_depth = max_depth
        self.report = ScanReport(
            machine=machine_name,
            scan_paths=self.scan_paths,
        )

    def scan(self) -> ScanReport:
        """Run the full scan. Returns a ScanReport with all discovered assets."""
        self.report.started_at = datetime.now()

        for scan_path in self.scan_paths:
            path = Path(scan_path).expanduser().resolve()
            if not path.exists():
                self.report.errors.append(f"Path not found: {scan_path}")
                continue
            if not path.is_dir():
                # Single file scan
                asset = self._process_file(path)
                if asset:
                    self.report.assets.append(asset)
                continue

            for asset in self._walk_directory(path):
                self.report.assets.append(asset)

        # Compile statistics
        self._compile_stats()
        self.report.completed_at = datetime.now()
        return self.report

    def _walk_directory(self, root: Path, depth: int = 0) -> Generator[AudioAsset, None, None]:
        """Recursively walk a directory tree finding audio files."""
        if self.max_depth is not None and depth > self.max_depth:
            return

        try:
            entries = sorted(root.iterdir())
        except PermissionError:
            self.report.errors.append(f"Permission denied: {root}")
            return
        except OSError as e:
            self.report.errors.append(f"OS error scanning {root}: {e}")
            return

        for entry in entries:
            try:
                if entry.is_symlink():
                    continue  # Skip symlinks to avoid loops

                if entry.is_dir():
                    # Skip hidden dirs (except specific ones we care about)
                    if entry.name.startswith(".") and entry.name not in (".noizy",):
                        continue
                    yield from self._walk_directory(entry, depth + 1)

                elif entry.is_file():
                    self.report.total_files_found += 1
                    asset = self._process_file(entry)
                    if asset:
                        yield asset

            except PermissionError:
                continue
            except OSError:
                continue

    def _process_file(self, filepath: Path) -> AudioAsset | None:
        """Process a single file. Returns AudioAsset if it's audio, None otherwise."""
        ext = filepath.suffix.lower()
        if ext not in AUDIO_EXTENSIONS:
            return None

        self.report.total_audio_files += 1
        str_path = str(filepath)

        # Get file stats
        try:
            st = filepath.stat()
        except OSError:
            return None

        file_size = st.st_size
        self.report.total_size_bytes += file_size

        # Check for empty files
        is_empty = file_size == 0
        if is_empty:
            self.report.total_empty += 1
            if not self.include_empty:
                return None

        # Check for noise
        is_noise = is_noise_path(str_path)
        if is_noise:
            self.report.total_noise += 1
            if self.exclude_noise:
                return None

        # Build the asset
        asset = AudioAsset(
            file_path=str_path,
            file_name=filepath.name,
            file_extension=ext,
            file_size_bytes=file_size,
            format=AUDIO_EXTENSIONS[ext],
            is_empty=is_empty,
            is_noise=is_noise,
            source_machine=self.machine_name,
            original_path=str_path,
            file_created=datetime.fromtimestamp(st.st_birthtime) if hasattr(st, "st_birthtime") else None,
            file_modified=datetime.fromtimestamp(st.st_mtime),
        )

        # Quick path-based classification hints
        if is_plugin_path(str_path):
            asset.tags.append("plugin_related")
        if "Audio Hijack" in str_path:
            asset.tags.append("audio_hijack")
        if "Logic" in str_path or ".logicx" in str_path:
            asset.tags.append("logic_pro")
        if "dreamchamber" in str_path.lower():
            asset.tags.append("dreamchamber")
        if "voice" in str_path.lower():
            asset.tags.append("voice")
        if "DESIGN" in str_path or "Design" in str_path:
            asset.tags.append("design_album")
        if "MASTER" in str_path.upper():
            asset.tags.append("mastered")
        if "OneDrive" in str_path:
            asset.tags.append("onedrive_import")
        if "GABRIEL" in str_path.upper():
            asset.tags.append("gabriel")
        if "NOIZY" in str_path.upper():
            asset.tags.append("noizy")

        return asset

    def _compile_stats(self):
        """Compile statistics from discovered assets."""
        for asset in self.report.assets:
            # Format counts
            fmt = asset.format.value
            self.report.formats[fmt] = self.report.formats.get(fmt, 0) + 1

            # Category counts (will be populated after classification)
            cat = asset.category.value
            self.report.categories[cat] = self.report.categories.get(cat, 0) + 1

        self.report.total_real_audio = (
            self.report.total_audio_files
            - self.report.total_noise
            - self.report.total_empty
        )
