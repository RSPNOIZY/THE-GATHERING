"""
NOIZY VAULT ENGINE BOOTSTRAP
Author: Rob Plowman (NOIZY.AI)
Purpose: Mass Music Vault + Hivebrain integration - file scanning, metadata generation,
embedding, auto-tagging.
"""

from __future__ import annotations

import argparse
import hashlib
import json
from datetime import datetime
from pathlib import Path
from typing import Iterable

import librosa
import numpy as np

# Optional: use this if openl3 is available
try:
    import openl3

    OPENL3_AVAILABLE = True
except ImportError:
    OPENL3_AVAILABLE = False

# ------------ Path Configuration ------------
# Primary: MAG 4TB — NOIZYFISH AQUARIUM audio catalogue
# Fallback: local GABRIEL/VAULT for development
_MAG_AUDIO = Path("/Volumes/MAG 4TB/NOIZYFISH_THE_AQAURIUM/_01.AUDIO FROM ALL")
_LOCAL_VAULT = Path.home() / "NOIZYLAB/noizyfish/vault"

BASE_DIR = _MAG_AUDIO if _MAG_AUDIO.exists() else _LOCAL_VAULT
AUDIO_DIR = BASE_DIR  # Audio files are at root of aquarium audio dir
# Output dirs always write to NOIZYLAB (never modify MAG)
_OUTPUT_BASE = Path.home() / "NOIZYLAB/noizyfish/vault"
METADATA_DIR   = _OUTPUT_BASE / "metadata"    # .json metadata files
EMBEDDINGS_DIR = _OUTPUT_BASE / "embeddings"  # .npy vector store

SUPPORTED_EXTENSIONS = {".wav", ".flac", ".aif", ".aiff", ".mp3"}
FEATURE_SR = 22050
EMBEDDING_SR = 48000

for d in (_OUTPUT_BASE, METADATA_DIR, EMBEDDINGS_DIR):
    d.mkdir(parents=True, exist_ok=True)


# ------------ Helper Functions ------------
def compute_sha256(file_path: Path) -> str:
    sha = hashlib.sha256()
    with file_path.open("rb") as f:
        while True:
            chunk = f.read(8192)
            if not chunk:
                break
            sha.update(chunk)
    return sha.hexdigest()


def file_signature(file_path: Path) -> dict:
    stat = file_path.stat()
    return {"file_size_bytes": stat.st_size, "file_mtime": stat.st_mtime}


def metadata_path_for(file_path: Path, metadata_dir: Path) -> Path:
    return metadata_dir / f"{file_path.stem}.json"


def legacy_metadata_path_for(file_path: Path, metadata_dir: Path) -> Path:
    return metadata_dir / f"{file_path.name}.json"


def read_metadata(path: Path) -> dict | None:
    try:
        return json.loads(path.read_text())
    except (OSError, json.JSONDecodeError):
        return None


def write_metadata(path: Path, metadata: dict) -> None:
    path.write_text(json.dumps(metadata, indent=2, sort_keys=True))


def extract_features(file_path: Path) -> dict:
    y, sr = librosa.load(file_path, sr=FEATURE_SR, mono=True)
    duration = librosa.get_duration(y=y, sr=sr)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
    chroma = librosa.feature.chroma_stft(y=y, sr=sr).mean(axis=1).tolist()
    mfcc = librosa.feature.mfcc(y=y, sr=sr, n_mfcc=13).mean(axis=1).tolist()
    centroid = float(librosa.feature.spectral_centroid(y=y, sr=sr).mean())
    rms = float(librosa.feature.rms(y=y).mean())
    return {
        "duration": float(duration),
        "tempo": float(tempo),
        "rms": rms,
        "spectral_centroid": centroid,
        "chroma": chroma,
        "mfcc": mfcc,
    }


def generate_metadata(file_path: Path, metadata_dir: Path) -> dict:
    filename = file_path.name
    sha256 = compute_sha256(file_path)
    features = extract_features(file_path)
    metadata = {
        "filename": filename,
        "path": str(file_path),
        "sha256": sha256,
        "analyzed_at": datetime.utcnow().isoformat(),
        **features,
    }
    metadata.update(file_signature(file_path))
    out_file = metadata_path_for(file_path, metadata_dir)
    write_metadata(out_file, metadata)
    return metadata


# ------------ Embedding Pipeline (OpenL3) ------------
def extract_embedding(file_path: Path, embeddings_dir: Path) -> list | None:
    if not OPENL3_AVAILABLE:
        print("openl3 not available. Skipping embedding.")
        return None
    audio, sr = librosa.load(file_path, sr=EMBEDDING_SR, mono=True)
    emb, _ts = openl3.get_audio_embedding(
        audio,
        sr,
        content_type="music",
        input_repr="mel256",
        embedding_size=512,
    )
    emb_avg = emb.mean(axis=0)
    emb_file = embeddings_dir / f"{file_path.stem}.npy"
    np.save(emb_file, emb_avg)
    return emb_avg.tolist()


def iter_audio_files(audio_dir: Path, recursive: bool) -> Iterable[Path]:
    if recursive:
        for path in audio_dir.rglob("*"):
            if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
                yield path
        return
    for path in audio_dir.iterdir():
        if path.is_file() and path.suffix.lower() in SUPPORTED_EXTENSIONS:
            yield path


def is_unchanged(file_path: Path, metadata: dict) -> bool:
    signature = file_signature(file_path)
    return (
        metadata.get("file_size_bytes") == signature["file_size_bytes"]
        and metadata.get("file_mtime") == signature["file_mtime"]
    )


# ------------ Scanner ------------
def scan_and_process_audio(
    audio_dir: Path = AUDIO_DIR,
    metadata_dir: Path = METADATA_DIR,
    embeddings_dir: Path = EMBEDDINGS_DIR,
    include_embeddings: bool = True,
    recursive: bool = False,
    force: bool = False,
    migrate_legacy: bool = True,
) -> dict:
    if not audio_dir.exists():
        raise FileNotFoundError(f"Audio directory not found: {audio_dir}")
    metadata_dir.mkdir(parents=True, exist_ok=True)
    embeddings_dir.mkdir(parents=True, exist_ok=True)

    print("Scanning for new audio files...")
    stats = {"processed": 0, "skipped": 0, "errors": 0, "embeddings": 0}

    for file in iter_audio_files(audio_dir, recursive=recursive):
        try:
            target_meta = metadata_path_for(file, metadata_dir)
            legacy_meta = legacy_metadata_path_for(file, metadata_dir)
            existing_meta_path = None
            if target_meta.exists():
                existing_meta_path = target_meta
            elif legacy_meta.exists():
                existing_meta_path = legacy_meta

            metadata = read_metadata(existing_meta_path) if existing_meta_path else None

            if metadata and not force:
                # Backfill signature fields for faster change detection.
                if "file_size_bytes" not in metadata or "file_mtime" not in metadata:
                    metadata.update(file_signature(file))
                    metadata["path"] = str(file)
                    write_metadata(existing_meta_path, metadata)

                if is_unchanged(file, metadata):
                    if migrate_legacy and existing_meta_path == legacy_meta and not target_meta.exists():
                        write_metadata(target_meta, metadata)
                    stats["skipped"] += 1
                    continue

            print(f"Processing: {file.name}")
            meta = generate_metadata(file, metadata_dir)
            if include_embeddings and OPENL3_AVAILABLE:
                emb = extract_embedding(file, embeddings_dir)
                meta["embedding"] = emb
                embeddings_dir.mkdir(parents=True, exist_ok=True)
                stats["embeddings"] += 1 if emb is not None else 0
                write_metadata(metadata_path_for(file, metadata_dir), meta)
            stats["processed"] += 1
        except Exception as exc:
            stats["errors"] += 1
            print(f"ERROR: {file}: {exc}")

    print(
        "Done. processed={processed} skipped={skipped} embeddings={embeddings} errors={errors}".format(
            **stats
        )
    )
    return stats


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(description="NOIZY Vault Engine scanner.")
    parser.add_argument("--root", type=Path, default=BASE_DIR, help="Root vault directory.")
    parser.add_argument("--recursive", action="store_true", help="Scan audio subfolders.")
    parser.add_argument("--force", action="store_true", help="Reprocess even if unchanged.")
    parser.add_argument(
        "--no-embeddings",
        action="store_true",
        help="Skip openL3 embeddings even if available.",
    )
    parser.add_argument(
        "--no-migrate-legacy",
        action="store_true",
        help="Do not copy legacy metadata (.wav.json) to new .json format.",
    )
    return parser


if __name__ == "__main__":
    args = _build_parser().parse_args()
    root = args.root
    scan_and_process_audio(
        audio_dir=root / "audio",
        metadata_dir=root / "metadata",
        embeddings_dir=root / "embeddings",
        include_embeddings=not args.no_embeddings,
        recursive=args.recursive,
        force=args.force,
        migrate_legacy=not args.no_migrate_legacy,
    )
