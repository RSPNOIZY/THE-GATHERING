from __future__ import annotations

import json
import subprocess
from pathlib import Path

import numpy as np


TARGET_SAMPLE_RATE = 48_000


def probe_duration(path: Path) -> float:
    """Return duration in seconds using ffprobe."""
    result = subprocess.run(
        [
            "ffprobe",
            "-v",
            "error",
            "-show_entries",
            "format=duration",
            "-of",
            "json",
            str(path),
        ],
        check=True,
        capture_output=True,
        text=True,
    )
    payload = json.loads(result.stdout)
    return float(payload["format"]["duration"])


def load_window(path: Path, *, start_seconds: float, duration_seconds: float) -> np.ndarray:
    """Decode one mono 48 kHz float32 audio window with ffmpeg."""
    result = subprocess.run(
        [
            "ffmpeg",
            "-v",
            "error",
            "-ss",
            f"{start_seconds:.3f}",
            "-t",
            f"{duration_seconds:.3f}",
            "-i",
            str(path),
            "-ar",
            str(TARGET_SAMPLE_RATE),
            "-ac",
            "1",
            "-f",
            "f32le",
            "-",
        ],
        check=True,
        capture_output=True,
    )
    audio = np.frombuffer(result.stdout, dtype=np.float32)
    if audio.size == 0:
        raise ValueError(f"ffmpeg decoded no audio from {path}")
    return audio


def choose_window_starts(
    *,
    duration_seconds: float,
    window_seconds: float,
    window_count: int,
) -> list[float]:
    """Pick evenly spaced windows while avoiding the extreme start and end."""
    if duration_seconds <= window_seconds:
        return [0.0]

    usable_end = max(0.0, duration_seconds - window_seconds)
    if window_count <= 1:
        return [usable_end / 2.0]

    margin = min(10.0, usable_end / 4.0)
    start = margin
    end = max(start, usable_end - margin)
    return np.linspace(start, end, num=window_count).tolist()
