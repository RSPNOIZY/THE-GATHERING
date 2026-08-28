# Rob.AVA Multilang Morrison Workflow (RAG + Director Notes)

## Goal
Generate multi-language performances where character DNA remains constant and cultural execution adapts by locale.

## Runtime Components
- `Character DNA`: immutable emotional baseline (`config/morrison_character_dna.json`).
- `Director Note Matrix`: note deltas applied to DNA (`config/director_note_deltas.json`).
- `Regional Templates`: cultural execution per locale (`config/regional_performance_templates.json`).
- `RAG Context`: persona/farm references (`data/knowledge_store.json`).
- `Policy Gate`: consent + blocked topic checks (`policy/never_clauses.json`).
- `Refusal Layer`: graceful policy-safe refusal (`ava_refusal`).

## FastAPI Entry Point
- `POST /demo/multilang/render`
- Request model: `MultilangDemoRequest`
- Engine: `run_multilang_demo(...)` in `multilang_workflow.py`

## End-to-End Pseudocode
```python
def multilang_render(request):
    persona = load_persona(request.ava_id)
    policy = load_policy()

    # 1) Governance gate
    if request.require_consent and not request.consent_key_signed:
        return refusal("CONSENT_KEY_MISSING")
    if persona.status != "approved":
        return refusal("PERSONA_NOT_APPROVED")
    if contains_blocked_topic(request.base_line, policy):
        return refusal("TOPIC_PROHIBITED")

    # 2) Character DNA + direction note
    base_dna = load_character_dna("morrison_v1")
    directed_dna = apply_director_note(base_dna, request.director_note_key)
    signature = hash_emotional_signature(base_dna.character_id, directed_dna)

    # 3) Locale loop (emotion-to-culture mapping)
    renders = []
    for locale in request.locales:
        template = load_regional_template(locale)
        expressive_vector = map_emotion_to_culture(directed_dna, template)

        # 4) RAG augmentation
        rag_context = retrieve_farm_context(
            ava_id=request.ava_id,
            locale=locale,
            query=request.base_line + " " + request.director_note_key,
        )
        prompt = build_prompt(
            base_line=request.base_line,
            note=request.director_note_key,
            dna=directed_dna,
            template=template,
            expressive_vector=expressive_vector,
            rag_context=rag_context,
        )

        # 5) Generation
        localized_line = generate_with_llm(prompt) or fallback_template_render(...)

        # 6) Render orchestration payload
        render_job = {
            "locale": locale,
            "line": localized_line,
            "voice_profile": template,
            "emotional_signature": signature,
            "artifact_uri": f"renders/{session_id}/{locale}.wav",
        }
        renders.append(render_job)

    # 7) Persist artifact and audit event
    save_session_artifact(session_id, directed_dna, renders)
    append_audit_event("session_completed", session_id)

    return {
        "session_id": session_id,
        "emotional_signature": signature,
        "renders": renders,
    }
```

## Why This Proves the Thesis
- The same `directed_dna` creates one shared `emotional_signature` hash for all locales.
- Locale-specific markers are injected only in `map_emotion_to_culture(...)`.
- RAG context keeps persona continuity and prevents out-of-character drift.
- Policy gates and refusal logic prevent unsafe or unauthorized render paths.

## CLI Runner
- `python3 rob_ava/scripts/run_multilang_workflow.py --consent-key-signed`

## API Example
```bash
curl -X POST http://127.0.0.1:8091/demo/multilang/render \
  -H "Content-Type: application/json" \
  -d '{
    "ava_id": "rsp001_commander_v1",
    "base_line": "I have seen enough bodies to know when someone is lying.",
    "director_note_key": "restrained_anger",
    "locales": ["en-US", "ja-JP", "fr-FR", "ar-EG", "es-ES"],
    "consent_key_signed": true,
    "require_consent": true,
    "use_llm": false,
    "write_artifact": true
  }'
```
