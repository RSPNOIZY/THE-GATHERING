from __future__ import annotations

import argparse
import json
from pathlib import Path

from audio_search.audio import TARGET_SAMPLE_RATE, choose_window_starts, load_window, probe_duration
from audio_search.db import connect, init_schema
from audio_search.embeddings import ClapEmbedder, to_sqlite_vec_blob


def search(db_path: Path, query_embedding: bytes, limit: int) -> list[dict]:
    with connect(db_path) as db:
        init_schema(db)
        rows = db.execute(
            """
            SELECT
                t.id,
                t.path,
                t.title,
                t.duration_seconds,
                t.model_name,
                t.window_count,
                t.window_seconds,
                t.embedded_window_count,
                v.distance
            FROM vec_audio_tracks AS v
            JOIN audio_tracks AS t ON t.id = v.rowid
            WHERE v.embedding MATCH ?
              AND k = ?
            ORDER BY v.distance
            """,
            (query_embedding, limit),
        ).fetchall()
    return [dict(row) for row in rows]


def audio_query_embedding(
    *,
    embedder: ClapEmbedder,
    path: Path,
    window_seconds: float,
    window_count: int,
) -> bytes:
    duration = probe_duration(path)
    starts = choose_window_starts(
        duration_seconds=duration,
        window_seconds=window_seconds,
        window_count=window_count,
    )
    windows = [
        load_window(path, start_seconds=start, duration_seconds=window_seconds)
        for start in starts
    ]
    embedding = embedder.embed_audio_windows(windows, sampling_rate=TARGET_SAMPLE_RATE)
    return to_sqlite_vec_blob(embedding)


def main() -> None:
    parser = argparse.ArgumentParser(description="Search indexed audio by text or audio example.")
    query = parser.add_mutually_exclusive_group(required=True)
    query.add_argument("--text", help="Text prompt, such as 'warm analog synth pad'")
    query.add_argument("--audio", type=Path, help="Audio file to use as the query")
    parser.add_argument("--db", type=Path, default=Path("audio_tracks.sqlite"))
    parser.add_argument("--model", default="laion/clap-htsat-fused")
    parser.add_argument("--limit", type=int, default=10)
    parser.add_argument("--window-seconds", type=float, default=7.0)
    parser.add_argument("--window-count", type=int, default=5)
    parser.add_argument("--json", action="store_true", help="Print machine-readable JSON")
    args = parser.parse_args()

    embedder = ClapEmbedder.load(args.model)
    if args.text:
        embedding = to_sqlite_vec_blob(embedder.embed_text(args.text))
    else:
        embedding = audio_query_embedding(
            embedder=embedder,
            path=args.audio,
            window_seconds=args.window_seconds,
            window_count=args.window_count,
        )

    results = search(args.db, embedding, args.limit)
    if args.json:
        print(json.dumps(results, indent=2))
        return

    for rank, row in enumerate(results, start=1):
        duration = row["duration_seconds"] or 0.0
        print(
            f"{rank:>2}. distance={row['distance']:.4f} "
            f"duration={duration:.1f}s "
            f"windows={row['embedded_window_count']}/{row['window_count']}x{row['window_seconds']:.1f}s "
            f"path={row['path']}"
        )


if __name__ == "__main__":
    main()
