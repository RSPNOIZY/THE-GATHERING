from __future__ import annotations

from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Any, Dict, List, Optional, Sequence, Tuple
import json

import librosa
import numpy as np

AUDIO_EXTENSIONS = {
    ".aif",
    ".aiff",
    ".aifc",
    ".aac",
    ".flac",
    ".m4a",
    ".mp3",
    ".ogg",
    ".opus",
    ".wav",
    ".wma",
}


@dataclass(frozen=True)
class IntakeConfig:
    sr: Optional[int] = 22050
    mono: bool = True
    offset: float = 0.0
    duration: Optional[float] = None
    dtype: str = "float32"
    res_type: str = "soxr_hq"

    def to_dict(self) -> Dict[str, Any]:
        return asdict(self)


def _normalize_path(path: Path) -> str:
    try:
        return str(path.resolve())
    except OSError:
        return str(path)


def _num_channels(y: np.ndarray) -> int:
    if y.ndim == 1:
        return 1
    return int(y.shape[0])


def _num_samples(y: np.ndarray) -> int:
    if y.ndim == 0:
        return 0
    return int(y.shape[-1])


def compute_metadata(path: Path, y: np.ndarray, sr: int, config: IntakeConfig) -> Dict[str, Any]:
    num_samples = _num_samples(y)
    duration = float(num_samples) / float(sr) if sr else 0.0
    return {
        "path": _normalize_path(path),
        "sample_rate": int(sr),
        "num_samples": num_samples,
        "duration_sec": duration,
        "channels": _num_channels(y),
        "dtype": str(y.dtype),
        "config": config.to_dict(),
    }


def load_audio(path: Path, config: IntakeConfig) -> Tuple[np.ndarray, int]:
    y, sr = librosa.load(
        path,
        sr=config.sr,
        mono=config.mono,
        offset=config.offset,
        duration=config.duration,
        dtype=config.dtype,
        res_type=config.res_type,
    )
    return y, sr


class AudioIntakeAgent:
    def __init__(self, config: Optional[IntakeConfig] = None) -> None:
        self.config = config or IntakeConfig()

    def intake(
        self,
        path: Path | str,
        output_dir: Optional[Path | str] = None,
        save_format: str = "npz",
    ) -> Dict[str, Any]:
        path = Path(path)
        if not path.exists():
            raise FileNotFoundError(f"Audio path not found: {path}")

        y, sr = load_audio(path, self.config)
        metadata = compute_metadata(path, y, sr, self.config)

        saved: Dict[str, str] = {}
        if output_dir is not None and save_format != "none":
            output_dir = Path(output_dir)
            output_dir.mkdir(parents=True, exist_ok=True)
            stem = path.stem

            if save_format == "npz":
                array_path = output_dir / f"{stem}.npz"
                np.savez_compressed(array_path, y=y, sr=sr)
                saved["array"] = _normalize_path(array_path)
            elif save_format == "npy":
                array_path = output_dir / f"{stem}.npy"
                np.save(array_path, y)
                saved["array"] = _normalize_path(array_path)
            else:
                raise ValueError(f"Unsupported save_format: {save_format}")

            meta_path = output_dir / f"{stem}.json"
            meta_path.write_text(json.dumps(metadata, indent=2, sort_keys=True))
            saved["metadata"] = _normalize_path(meta_path)

        return {
            "path": _normalize_path(path),
            "sample_rate": sr,
            "array": y,
            "metadata": metadata,
            "saved": saved,
        }


def _iter_audio_files(paths: Sequence[Path], recursive: bool = True) -> List[Path]:
    results: List[Path] = []
    for path in paths:
        if path.is_dir():
            if recursive:
                candidates = path.rglob("*")
            else:
                candidates = path.glob("*")
            for item in candidates:
                if item.is_file() and item.suffix.lower() in AUDIO_EXTENSIONS:
                    results.append(item)
        else:
            results.append(path)
    return results


def intake_many(
    inputs: Sequence[Path | str],
    config: Optional[IntakeConfig] = None,
    output_dir: Optional[Path | str] = None,
    save_format: str = "npz",
    recursive: bool = True,
) -> List[Dict[str, Any]]:
    agent = AudioIntakeAgent(config=config)
    paths = _iter_audio_files([Path(p) for p in inputs], recursive=recursive)
    return [agent.intake(path, output_dir=output_dir, save_format=save_format) for path in paths]
