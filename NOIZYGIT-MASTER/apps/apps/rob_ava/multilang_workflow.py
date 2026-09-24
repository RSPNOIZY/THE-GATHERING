#!/usr/bin/env python3
"""Multilingual character-consistency workflow for Rob.AVA."""

from __future__ import annotations

import hashlib
import json
import os
import re
from datetime import datetime, timezone
from pathlib import Path
from typing import Any, Literal, Optional
from urllib import error, request

from pydantic import BaseModel, Field


ROOT = Path(__file__).resolve().parent
CONFIG_DIR = ROOT / "config"
DATA_DIR = ROOT / "data"
KNOWLEDGE_PATH = DATA_DIR / "knowledge_store.json"
OUTPUT_DIR = DATA_DIR / "multilang_demo"
DNA_PATH = CONFIG_DIR / "morrison_character_dna.json"
NOTE_DELTAS_PATH = CONFIG_DIR / "director_note_deltas.json"
TEMPLATES_PATH = CONFIG_DIR / "regional_performance_templates.json"


def _utc_now() -> str:
    return datetime.now(timezone.utc).isoformat()


def _load_json(path: Path, fallback: dict[str, Any]) -> dict[str, Any]:
    if not path.exists():
        return fallback
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except json.JSONDecodeError:
        return fallback


def _clamp(value: float) -> float:
    return max(0.0, min(1.0, round(value, 4)))


def _tokenize(text: str) -> set[str]:
    return {token for token in re.findall(r"[a-z0-9]+", text.lower()) if len(token) > 1}


class MultilangDemoRequest(BaseModel):
    ava_id: str
    base_line: str = Field(min_length=4, max_length=500)
    director_note_key: Literal[
        "more_weariness",
        "restrained_anger",
        "vulnerable_confession",
    ] = "restrained_anger"
    locales: list[str] = Field(
        default_factory=lambda: ["en-US", "ja-JP", "fr-FR", "ar-EG", "es-ES"]
    )
    consent_key_signed: bool = False
    require_consent: bool = True
    use_llm: bool = False
    write_artifact: bool = True


class RegionalRender(BaseModel):
    locale: str
    region_label: str
    performance_color: str
    execution_markers: list[str]
    emotional_signature: str
    expressive_vector: dict[str, float]
    rag_context: list[dict[str, Any]]
    generated_line: str
    render_job_id: str
    render_status: Literal["queued", "completed"] = "completed"
    artifact_uri: str


class MultilangDemoResponse(BaseModel):
    allowed: bool
    refusal: Optional[str] = None
    reasons: list[str] = Field(default_factory=list)
    reason_codes: list[str] = Field(default_factory=list)
    session_id: str
    character_id: Optional[str] = None
    character_name: Optional[str] = None
    director_note_key: str
    emotional_signature: Optional[str] = None
    directed_dna: dict[str, float] = Field(default_factory=dict)
    regional_renders: list[RegionalRender] = Field(default_factory=list)
    artifact_path: Optional[str] = None


def _load_character_dna() -> dict[str, Any]:
    fallback = {
        "character_id": "morrison_v1",
        "name": "Detective Morrison",
        "slow_burn_tension": 0.76,
        "sarcasm_defense": 0.71,
        "moral_weight": 0.84,
        "vulnerability_latency": 0.68,
        "controlled_breath": 0.73,
    }
    return _load_json(DNA_PATH, fallback)


def _load_note_deltas() -> dict[str, dict[str, float]]:
    fallback = {
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
    loaded = _load_json(NOTE_DELTAS_PATH, fallback)
    return loaded if loaded else fallback


def _load_regional_templates() -> dict[str, dict[str, Any]]:
    fallback = {
        "en-US": {
            "label": "English (Brooklyn)",
            "performance_color": "hard-edged cynicism",
            "execution_markers": ["sharp sarcasm", "clipped phrases", "working-class grit"],
            "intensity_scale": 1.0,
            "breath_scale": 1.0,
        }
    }
    loaded = _load_json(TEMPLATES_PATH, fallback)
    return loaded if loaded else fallback


def _apply_director_note(base_dna: dict[str, Any], note_key: str) -> dict[str, float]:
    deltas = _load_note_deltas().get(note_key, {})
    fields = [
        "slow_burn_tension",
        "sarcasm_defense",
        "moral_weight",
        "vulnerability_latency",
        "controlled_breath",
    ]
    directed: dict[str, float] = {}
    for key in fields:
        directed[key] = _clamp(float(base_dna.get(key, 0.5)) + float(deltas.get(key, 0.0)))
    return directed


def _signature(character_id: str, directed_dna: dict[str, float]) -> str:
    payload = (
        f"{character_id}|{directed_dna['slow_burn_tension']:.4f}|"
        f"{directed_dna['sarcasm_defense']:.4f}|{directed_dna['moral_weight']:.4f}|"
        f"{directed_dna['vulnerability_latency']:.4f}|{directed_dna['controlled_breath']:.4f}"
    )
    return hashlib.sha256(payload.encode("utf-8")).hexdigest()[:12]


def _map_emotion_to_culture(
    directed_dna: dict[str, float], template: dict[str, Any]
) -> dict[str, float]:
    intensity_scale = float(template.get("intensity_scale", 1.0))
    breath_scale = float(template.get("breath_scale", 1.0))
    return {
        "intensity": _clamp(directed_dna["slow_burn_tension"] * intensity_scale),
        "guardedness": _clamp(directed_dna["sarcasm_defense"] * intensity_scale),
        "moral_weight": _clamp(directed_dna["moral_weight"]),
        "vulnerability_reveal": _clamp(1.0 - directed_dna["vulnerability_latency"]),
        "breath_control": _clamp(directed_dna["controlled_breath"] * breath_scale),
    }


def _retrieve_rag_context(ava_id: str, query: str, locale: str) -> list[dict[str, Any]]:
    fallback = {
        "farm": {
            "rsp001_commander_v1": [
                {
                    "id": "farm-001",
                    "language": "en-US",
                    "text": "Morrison archetype: cynical protector with exhausted moral center.",
                },
                {
                    "id": "farm-002",
                    "language": "fr-FR",
                    "text": "Maintain noir tone while preserving trust in vulnerable scenes.",
                },
            ]
        }
    }
    store = _load_json(KNOWLEDGE_PATH, fallback)
    docs = store.get("farm", {}).get(ava_id, [])
    if not docs:
        docs = store.get("farm", {}).get("rsp001_commander_v1", [])

    q_tokens = _tokenize(query)
    scored: list[tuple[int, dict[str, Any]]] = []
    for doc in docs:
        language = str(doc.get("language", ""))
        if language and language != locale:
            continue
        d_tokens = _tokenize(str(doc.get("text", "")))
        scored.append((len(q_tokens.intersection(d_tokens)), doc))

    scored.sort(key=lambda item: item[0], reverse=True)
    selected = [doc for score, doc in scored[:3] if score > 0]
    return selected if selected else docs[:2]


def _build_prompt(
    base_line: str,
    note_key: str,
    directed_dna: dict[str, float],
    template: dict[str, Any],
    expressive_vector: dict[str, float],
    rag_context: list[dict[str, Any]],
) -> str:
    context_lines = "\n".join(f"- {doc.get('text', '')}" for doc in rag_context)
    markers = ", ".join(template.get("execution_markers", []))
    return (
        f"BASE_LINE: {base_line}\n"
        f"DIRECTOR_NOTE: {note_key}\n"
        f"DNA: {json.dumps(directed_dna, ensure_ascii=True)}\n"
        f"REGIONAL_MARKERS: {markers}\n"
        f"EXPRESSIVE_VECTOR: {json.dumps(expressive_vector, ensure_ascii=True)}\n"
        f"RAG_CONTEXT:\n{context_lines}\n"
        "TASK: Produce one culturally-authentic line preserving emotional intent."
    )


def _llm_generate(prompt: str, locale: str, character_name: str) -> str:
    api_key = os.getenv("OPENAI_API_KEY")
    if not api_key:
        return ""

    payload = {
        "model": os.getenv("ROB_AVA_LLM_MODEL", "gpt-4o-mini"),
        "temperature": 0.45,
        "messages": [
            {
                "role": "system",
                "content": (
                    "You generate one culturally authentic line per locale while preserving "
                    "the exact emotional intent defined in the DNA vector."
                ),
            },
            {
                "role": "user",
                "content": f"Locale: {locale}\nCharacter: {character_name}\n{prompt}",
            },
        ],
    }

    req = request.Request(
        url="https://api.openai.com/v1/chat/completions",
        method="POST",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
        },
    )

    try:
        with request.urlopen(req, timeout=30) as response:
            body = json.loads(response.read().decode("utf-8"))
            content = (
                body.get("choices", [{}])[0]
                .get("message", {})
                .get("content", "")
            )
            return content.strip() if isinstance(content, str) else ""
    except (TimeoutError, error.URLError, error.HTTPError, json.JSONDecodeError):
        return ""


def _fallback_line(
    base_line: str,
    template: dict[str, Any],
    note_key: str,
) -> str:
    markers = ", ".join(template.get("execution_markers", []))
    color = template.get("performance_color", "grounded delivery")
    if note_key == "restrained_anger":
        note_fragment = "pressure held under calm surface"
    elif note_key == "vulnerable_confession":
        note_fragment = "defenses lowering without losing dignity"
    else:
        note_fragment = "weariness layered under composure"
    return f"{base_line} [{color}; {note_fragment}; markers: {markers}]"


def run_multilang_demo(
    request_model: MultilangDemoRequest,
    persona: dict[str, Any],
    policy: dict[str, Any],
    refusal_builder: Any,
) -> MultilangDemoResponse:
    session_id = f"demo_{datetime.now(timezone.utc).strftime('%Y%m%d%H%M%S%f')}"

    reasons: list[str] = []
    reason_codes: list[str] = []
    if request_model.require_consent and not request_model.consent_key_signed:
        reasons.append("Consent key signature is required for multi-language render.")
        reason_codes.append("CONSENT_KEY_MISSING")

    if persona.get("status") != "approved":
        reasons.append("Persona must be approved before rendering demo.")
        reason_codes.append("PERSONA_NOT_APPROVED")

    blocked_topics = [topic.lower().strip() for topic in policy.get("global_blocked_topics", [])]
    lowered_line = request_model.base_line.lower()
    for topic in blocked_topics:
        if topic and topic in lowered_line:
            reasons.append(f"Blocked topic in base line: {topic}")
            reason_codes.append("TOPIC_PROHIBITED")
            break

    if reasons:
        refusal = refusal_builder(
            reasons[0],
            "firm",
            "sign consent key and revise line to comply with policy",
        )
        return MultilangDemoResponse(
            allowed=False,
            refusal=refusal,
            reasons=reasons,
            reason_codes=reason_codes,
            session_id=session_id,
            director_note_key=request_model.director_note_key,
        )

    base_dna = _load_character_dna()
    directed_dna = _apply_director_note(base_dna, request_model.director_note_key)
    emotional_signature = _signature(str(base_dna.get("character_id", "character")), directed_dna)

    templates = _load_regional_templates()
    renders: list[RegionalRender] = []

    for locale in request_model.locales:
        template = templates.get(locale)
        if not template:
            continue

        expressive_vector = _map_emotion_to_culture(directed_dna, template)
        rag_context = _retrieve_rag_context(
            ava_id=request_model.ava_id,
            query=f"{request_model.base_line} {request_model.director_note_key}",
            locale=locale,
        )

        prompt = _build_prompt(
            base_line=request_model.base_line,
            note_key=request_model.director_note_key,
            directed_dna=directed_dna,
            template=template,
            expressive_vector=expressive_vector,
            rag_context=rag_context,
        )

        generated = ""
        if request_model.use_llm:
            generated = _llm_generate(
                prompt=prompt,
                locale=locale,
                character_name=str(base_dna.get("name", "Character")),
            )
        if not generated:
            generated = _fallback_line(
                base_line=request_model.base_line,
                template=template,
                note_key=request_model.director_note_key,
            )

        render_job_id = f"render_{locale}_{session_id}"
        artifact_uri = f"rob_ava/data/renders/{session_id}/{locale}.wav"
        renders.append(
            RegionalRender(
                locale=locale,
                region_label=str(template.get("label", locale)),
                performance_color=str(template.get("performance_color", "")),
                execution_markers=[str(item) for item in template.get("execution_markers", [])],
                emotional_signature=emotional_signature,
                expressive_vector=expressive_vector,
                rag_context=rag_context,
                generated_line=generated,
                render_job_id=render_job_id,
                artifact_uri=artifact_uri,
            )
        )

    artifact_path = None
    if request_model.write_artifact:
        OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
        payload = {
            "session_id": session_id,
            "created_at": _utc_now(),
            "request": request_model.model_dump(),
            "character": {
                "character_id": base_dna.get("character_id"),
                "name": base_dna.get("name"),
            },
            "director_note_key": request_model.director_note_key,
            "emotional_signature": emotional_signature,
            "directed_dna": directed_dna,
            "regional_renders": [item.model_dump() for item in renders],
        }
        artifact_file = OUTPUT_DIR / f"{session_id}.json"
        artifact_file.write_text(json.dumps(payload, indent=2), encoding="utf-8")
        artifact_path = str(artifact_file)

    return MultilangDemoResponse(
        allowed=True,
        session_id=session_id,
        character_id=str(base_dna.get("character_id", "")),
        character_name=str(base_dna.get("name", "")),
        director_note_key=request_model.director_note_key,
        emotional_signature=emotional_signature,
        directed_dna=directed_dna,
        regional_renders=renders,
        artifact_path=artifact_path,
    )
