#!/usr/bin/env python3
"""VSI live demo: character consistency + regional authenticity.

This script demonstrates:
- one shared character DNA
- one shared director note
- region-specific execution styles
- identical emotional signature across languages
"""

from __future__ import annotations

import argparse
import hashlib
import json
from dataclasses import dataclass
from pathlib import Path


DATA_OUTPUT = Path(__file__).resolve().parents[1] / "data" / "vsi_demo_output.json"


@dataclass(frozen=True)
class CharacterDNA:
    character_id: str
    name: str
    slow_burn_tension: float
    sarcasm_defense: float
    moral_weight: float
    vulnerability_latency: float
    controlled_breath: float


@dataclass(frozen=True)
class RegionalFramework:
    locale: str
    label: str
    execution_markers: tuple[str, ...]
    performance_color: str


NOTE_DELTAS = {
    "more_weariness": {
        "slow_burn_tension": 0.10,
        "sarcasm_defense": -0.05,
        "moral_weight": 0.14,
        "vulnerability_latency": 0.08,
        "controlled_breath": 0.06,
    },
    "restrained_anger": {
        "slow_burn_tension": 0.18,
        "sarcasm_defense": 0.02,
        "moral_weight": 0.10,
        "vulnerability_latency": -0.04,
        "controlled_breath": 0.16,
    },
    "vulnerable_confession": {
        "slow_burn_tension": 0.05,
        "sarcasm_defense": -0.22,
        "moral_weight": 0.08,
        "vulnerability_latency": -0.25,
        "controlled_breath": -0.10,
    },
}


REGIONS = (
    RegionalFramework(
        locale="en-US",
        label="English (Brooklyn)",
        execution_markers=(
            "sharp sarcasm",
            "clipped phrases",
            "working-class grit",
        ),
        performance_color="hard-edged cynicism",
    ),
    RegionalFramework(
        locale="ja-JP",
        label="Japanese (Tokyo)",
        execution_markers=(
            "weighted pauses",
            "controlled restraint",
            "quiet bitterness",
        ),
        performance_color="dangerous calm",
    ),
    RegionalFramework(
        locale="fr-FR",
        label="French (Paris)",
        execution_markers=(
            "existential tone",
            "cold precision",
            "bitter poetics",
        ),
        performance_color="philosophical noir",
    ),
    RegionalFramework(
        locale="ar-EG",
        label="Arabic (Cairo)",
        execution_markers=(
            "fatalistic wisdom",
            "street-smart wariness",
            "moral warning cadence",
        ),
        performance_color="prophetic realism",
    ),
    RegionalFramework(
        locale="es-ES",
        label="Spanish (Madrid)",
        execution_markers=(
            "direct candor",
            "dry irony",
            "urban urgency",
        ),
        performance_color="streetwise resolve",
    ),
)


def clamp(value: float) -> float:
    return max(0.0, min(1.0, round(value, 4)))


def apply_note(dna: CharacterDNA, note_key: str) -> CharacterDNA:
    if note_key not in NOTE_DELTAS:
        raise KeyError(f"unknown note key: {note_key}")
    delta = NOTE_DELTAS[note_key]
    return CharacterDNA(
        character_id=dna.character_id,
        name=dna.name,
        slow_burn_tension=clamp(dna.slow_burn_tension + delta["slow_burn_tension"]),
        sarcasm_defense=clamp(dna.sarcasm_defense + delta["sarcasm_defense"]),
        moral_weight=clamp(dna.moral_weight + delta["moral_weight"]),
        vulnerability_latency=clamp(
            dna.vulnerability_latency + delta["vulnerability_latency"]
        ),
        controlled_breath=clamp(dna.controlled_breath + delta["controlled_breath"]),
    )


def emotional_signature(dna: CharacterDNA) -> str:
    payload = (
        f"{dna.character_id}|{dna.slow_burn_tension:.4f}|{dna.sarcasm_defense:.4f}|"
        f"{dna.moral_weight:.4f}|{dna.vulnerability_latency:.4f}|{dna.controlled_breath:.4f}"
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:12]


def render_line(base_line: str, note_key: str, region: RegionalFramework) -> str:
    if note_key == "more_weariness":
        return (
            f"{base_line} [{region.performance_color}; markers: "
            f"{', '.join(region.execution_markers)}]"
        )
    if note_key == "restrained_anger":
        return (
            f"{base_line} [{region.performance_color}; pressure held under calm surface; "
            f"markers: {', '.join(region.execution_markers)}]"
        )
    return (
        f"{base_line} [{region.performance_color}; defenses lower with controlled exposure; "
        f"markers: {', '.join(region.execution_markers)}]"
    )


def run_demo(note_key: str, base_line: str) -> dict:
    base_dna = CharacterDNA(
        character_id="morrison_v1",
        name="Detective Morrison",
        slow_burn_tension=0.76,
        sarcasm_defense=0.71,
        moral_weight=0.84,
        vulnerability_latency=0.68,
        controlled_breath=0.73,
    )
    directed_dna = apply_note(base_dna, note_key)
    signature = emotional_signature(directed_dna)

    performances = []
    for region in REGIONS:
        performances.append(
            {
                "locale": region.locale,
                "region": region.label,
                "character": base_dna.name,
                "director_note": note_key,
                "emotional_signature": signature,
                "rendered_line": render_line(base_line, note_key, region),
                "execution_markers": list(region.execution_markers),
            }
        )

    return {
        "character": base_dna.name,
        "note_key": note_key,
        "base_line": base_line,
        "emotional_signature": signature,
        "dna_after_note": {
            "slow_burn_tension": directed_dna.slow_burn_tension,
            "sarcasm_defense": directed_dna.sarcasm_defense,
            "moral_weight": directed_dna.moral_weight,
            "vulnerability_latency": directed_dna.vulnerability_latency,
            "controlled_breath": directed_dna.controlled_breath,
        },
        "performances": performances,
    }


def print_report(report: dict) -> None:
    print("VSI Character Consistency Demo")
    print("=" * 32)
    print(f"Character: {report['character']}")
    print(f"Director note: {report['note_key']}")
    print(f"Shared emotional signature: {report['emotional_signature']}")
    print(f"Base line: {report['base_line']}")
    print()

    for item in report["performances"]:
        print(f"- {item['region']} [{item['locale']}]")
        print(f"  signature: {item['emotional_signature']}")
        print(f"  output: {item['rendered_line']}")
    print()
    print("Result: same character DNA signal across all locales, localized execution preserved.")


def main() -> int:
    parser = argparse.ArgumentParser(description="Run VSI localization consistency demo")
    parser.add_argument(
        "--note",
        default="restrained_anger",
        choices=sorted(NOTE_DELTAS.keys()),
        help="Director note to apply across locales.",
    )
    parser.add_argument(
        "--line",
        default="I've seen enough bodies to know when someone is lying.",
        help="Base script line for the character.",
    )
    parser.add_argument(
        "--write-json",
        action="store_true",
        help="Write full demo output to rob_ava/data/vsi_demo_output.json",
    )
    args = parser.parse_args()

    report = run_demo(note_key=args.note, base_line=args.line)
    print_report(report)

    if args.write_json:
        DATA_OUTPUT.parent.mkdir(parents=True, exist_ok=True)
        DATA_OUTPUT.write_text(json.dumps(report, indent=2), encoding="utf-8")
        print(f"Saved: {DATA_OUTPUT}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
