from __future__ import annotations

import argparse
import subprocess
import sys
from pathlib import Path

from audio_search.audio import TARGET_SAMPLE_RATE, choose_window_starts, load_window, probe_duration
from audio_search.db import TrackFingerprint, connect, has_current_embedding, init_schema, upsert_track
from audio_search.embeddings import EMBEDDING_DIM, ClapEmbedder, to_sqlite_vec_blob


AUDIO_EXTENSIONS = {
    ".aif",
    ".aiff",
    ".flac",
    ".m4a",
    ".mp3",
    ".ogg",
    ".opus",
    ".wav",
}


def iter_audio_files(inputs: list[Path]) -> list[Path]:
    files: list[Path] = []
    for input_path in inputs:
        path = input_path.expanduser()
        if path.is_dir():
            files.extend(
                child
                for child in sorted(path.rglob("*"))
                if child.is_file() and child.suffix.lower() in AUDIO_EXTENSIONS
            )
        elif path.is_file():
            files.append(path)
        else:
            raise FileNotFoundError(path)
    return files


def ingest_file(
    *,
    db_path: Path,
    embedder: ClapEmbedder,
    audio_path: Path,
    model_name: str,
    window_seconds: float,
    window_count: int,
    force: bool,
) -> None:
    fingerprint = TrackFingerprint.from_path(
        audio_path,
        model_name=model_name,
        sample_rate=TARGET_SAMPLE_RATE,
        window_count=window_count,
        window_seconds=window_seconds,
        embedding_dim=EMBEDDING_DIM,
    )
    with connect(db_path) as db:
        init_schema(db)
        if not force and has_current_embedding(db, fingerprint=fingerprint):
            print(f"skipped unchanged: {fingerprint.path}")
            return

    duration = probe_duration(audio_path)
    starts = choose_window_starts(
        duration_seconds=duration,
        window_seconds=window_seconds,
        window_count=window_count,
    )
    windows = [
        load_window(audio_path, start_seconds=start, duration_seconds=window_seconds)
        for start in starts
    ]
    embedding = embedder.embed_audio_windows(windows, sampling_rate=TARGET_SAMPLE_RATE)

    with connect(db_path) as db:
        init_schema(db)
        track_id = upsert_track(
            db,
            fingerprint=fingerprint,
            title=fingerprint.path.stem,
            duration_seconds=duration,
            embedded_window_count=len(windows),
            embedding=to_sqlite_vec_blob(embedding),
        )
    print(f"indexed #{track_id}: {fingerprint.path}")


def check_ffmpeg() -> None:
    for command in ("ffmpeg", "ffprobe"):
        try:
            subprocess.run(
                [command, "-version"],
                check=True,
                capture_output=True,
                text=True,
            )
        except (FileNotFoundError, subprocess.CalledProcessError) as exc:
            raise SystemExit(f"{command} is required but was not available on PATH") from exc


def main() -> None:
    parser = argparse.ArgumentParser(description="Index audio files into sqlite-vec with CLAP.")
    parser.add_argument("paths", nargs="+", type=Path, help="Audio files or folders to index")
    parser.add_argument("--db", type=Path, default=Path("audio_tracks.sqlite"))
    parser.add_argument("--model", default="laion/clap-htsat-fused")
    parser.add_argument("--window-seconds", type=float, default=7.0)
    parser.add_argument("--window-count", type=int, default=5)
    parser.add_argument("--force", action="store_true", help="Re-embed even if metadata is unchanged")
    parser.add_argument("--keep-going", action="store_true", help="Continue after file-level errors")
    args = parser.parse_args()

    check_ffmpeg()
    files = iter_audio_files(args.paths)
    if not files:
        raise SystemExit("No supported audio files found.")

    embedder = ClapEmbedder.load(args.model)
    with connect(args.db) as db:
        init_schema(db)

    failures = 0
    for audio_path in files:
        try:
            ingest_file(
                db_path=args.db,
                embedder=embedder,
                audio_path=audio_path,
                model_name=args.model,
                window_seconds=args.window_seconds,
                window_count=args.window_count,
                force=args.force,
            )
        except Exception as exc:
            if not args.keep_going:
                raise
            failures += 1
            print(f"failed: {audio_path}: {exc}", file=sys.stderr)

    if failures:
        raise SystemExit(f"Finished with {failures} failed file(s).")


if __name__ == "__main__":
    main()
