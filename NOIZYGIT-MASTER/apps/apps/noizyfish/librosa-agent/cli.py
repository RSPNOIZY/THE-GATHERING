from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path
from typing import Optional

from .agent import AUDIO_EXTENSIONS, AudioIntakeAgent, IntakeConfig, _iter_audio_files


def _parse_sr(value: str) -> Optional[int]:
    lowered = value.strip().lower()
    if lowered in {"none", "null", "no", "false", "0"}:
        return None
    return int(value)


def _build_parser() -> argparse.ArgumentParser:
    parser = argparse.ArgumentParser(
        description="Local librosa-based audio intake agent.",
    )
    parser.add_argument(
        "inputs",
        nargs="+",
        help="Audio files or directories to intake.",
    )
    parser.add_argument(
        "--sr",
        type=_parse_sr,
        default=22050,
        help="Target sample rate (use 'none' to preserve original).",
    )
    mono_group = parser.add_mutually_exclusive_group()
    mono_group.add_argument("--mono", action="store_true", default=True, help="Force mono output.")
    mono_group.add_argument("--stereo", dest="mono", action="store_false", help="Preserve channels.")
    parser.add_argument("--offset", type=float, default=0.0, help="Start position (seconds).")
    parser.add_argument("--duration", type=float, default=None, help="Max duration (seconds).")
    parser.add_argument("--dtype", type=str, default="float32", help="Output dtype.")
    parser.add_argument("--res-type", type=str, default="soxr_hq", help="Resampling mode.")
    parser.add_argument(
        "--output-dir",
        type=Path,
        default=None,
        help="Directory to save arrays and metadata.",
    )
    parser.add_argument(
        "--save-format",
        choices=["npz", "npy", "none"],
        default="npz",
        help="Array format when saving.",
    )
    parser.add_argument(
        "--no-recursive",
        action="store_true",
        help="Disable recursive directory scanning.",
    )
    parser.add_argument(
        "--pretty",
        action="store_true",
        help="Pretty-print JSON metadata to stdout.",
    )
    parser.add_argument(
        "--extensions",
        action="store_true",
        help="Print supported file extensions and exit.",
    )
    return parser


def main(argv: Optional[list[str]] = None) -> int:
    parser = _build_parser()
    args = parser.parse_args(argv)

    if args.extensions:
        print("\n".join(sorted(AUDIO_EXTENSIONS)))
        return 0

    config = IntakeConfig(
        sr=args.sr,
        mono=args.mono,
        offset=args.offset,
        duration=args.duration,
        dtype=args.dtype,
        res_type=args.res_type,
    )
    agent = AudioIntakeAgent(config=config)

    inputs = [Path(item) for item in args.inputs]
    paths = _iter_audio_files(inputs, recursive=not args.no_recursive)

    if not paths:
        print("No audio files found.", file=sys.stderr)
        return 1

    errors = 0
    for path in paths:
        try:
            result = agent.intake(
                path,
                output_dir=args.output_dir,
                save_format=args.save_format,
            )
            metadata = result["metadata"]
            if args.output_dir is None:
                if args.pretty:
                    print(json.dumps(metadata, indent=2, sort_keys=True))
                else:
                    print(json.dumps(metadata))
        except Exception as exc:
            errors += 1
            print(f"ERROR: {path}: {exc}", file=sys.stderr)

    return 1 if errors else 0


if __name__ == "__main__":
    raise SystemExit(main())
