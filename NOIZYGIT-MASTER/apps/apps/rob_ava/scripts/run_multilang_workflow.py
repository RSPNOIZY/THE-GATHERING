#!/usr/bin/env python3
"""CLI runner for the Rob.AVA multilang workflow."""

from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

WORKSPACE_ROOT = Path(__file__).resolve().parents[2]
if str(WORKSPACE_ROOT) not in sys.path:
    sys.path.insert(0, str(WORKSPACE_ROOT))

from rob_ava.multilang_workflow import MultilangDemoRequest, run_multilang_demo


def _refusal(reason: str, level: str = "standard", next_step: str | None = None) -> str:
    base = {
        "standard": f"I cannot continue because {reason}. Thank you for understanding.",
        "firm": f"I must decline. {reason} prevents this interaction.",
        "educational": (
            f"This action is blocked: {reason}. "
            "This safeguard protects consent, ownership, and collaboration integrity."
        ),
    }
    text = base.get(level, base["standard"])
    if next_step:
        text = f"{text} Next step: {next_step}."
    return text


def main() -> int:
    parser = argparse.ArgumentParser(description="Run Rob.AVA multilingual demo workflow")
    parser.add_argument("--ava-id", default="rsp001_commander_v1")
    parser.add_argument(
        "--line",
        default="I've seen enough bodies to know when someone is lying.",
    )
    parser.add_argument(
        "--note",
        default="restrained_anger",
        choices=["more_weariness", "restrained_anger", "vulnerable_confession"],
    )
    parser.add_argument(
        "--locales",
        default="en-US,ja-JP,fr-FR,ar-EG,es-ES",
        help="Comma-separated locales",
    )
    parser.add_argument("--consent-key-signed", action="store_true")
    parser.add_argument("--use-llm", action="store_true")
    parser.add_argument("--no-artifact", action="store_true")
    args = parser.parse_args()

    request = MultilangDemoRequest(
        ava_id=args.ava_id,
        base_line=args.line,
        director_note_key=args.note,
        locales=[locale.strip() for locale in args.locales.split(",") if locale.strip()],
        consent_key_signed=args.consent_key_signed,
        use_llm=args.use_llm,
        write_artifact=not args.no_artifact,
    )

    persona = {
        "persona_id": args.ava_id,
        "display_name": "Detective Morrison",
        "status": "approved",
    }
    policy = {
        "global_blocked_topics": ["self-harm", "violent wrongdoing", "illegal activities"],
    }

    result = run_multilang_demo(
        request_model=request,
        persona=persona,
        policy=policy,
        refusal_builder=_refusal,
    )

    print(json.dumps(result.model_dump(), indent=2))
    return 0 if result.allowed else 1


if __name__ == "__main__":
    raise SystemExit(main())
