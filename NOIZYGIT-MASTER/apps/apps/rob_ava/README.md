# Rob.AVA Weekend Prototype

Minimal implementation for:
- persona schema
- approve/reject trust loop
- collaboration safety rules
- never-clause enforcement

## Install

```bash
python3 -m venv .venv
source .venv/bin/activate
pip install -r rob_ava/requirements.txt
```

## Run (full policy-aware service)

```bash
uvicorn rob_ava.server:app --reload --port 8091
```

## New Endpoints

- `POST /ava/rag/query` -> policy-enforced RAG interaction
- `POST /demo/multilang/render` -> director-note multilang demo orchestration
- `POST /collaboration/contracts` -> create/update collaboration contract
- `GET /collaboration/contracts` -> list contracts (optional `ava_id` filter)
- `GET /collaboration/contracts/{collaboration_id}` -> fetch one contract
- `GET /actor/{owner_id}/approval/queue` -> actor approval queue
- `POST /actor/{owner_id}/approval/{persona_id}` -> actor approval decision
- `GET /policy/ava-fan-boundary` -> AVA-to-fan boundary policy

## Stress Test

```bash
python3 rob_ava/scripts/regulation_stress_test.py
```

## VSI Demo

```bash
npm run demo:vsi
npm run demo:vsi:json
npm run demo:vsi:workflow
```

## VSIX Inspection

```bash
python3 rob_ava/scripts/inspect_vsix.py /path/to/package.vsix
```

## Run (50-line starter)

```bash
uvicorn rob_ava.rob_ava_50line:app --reload --port 8092
```

## Files

- `persona_profiles/persona_profile.schema.json`
- `persona_profiles/rsp001_candidate.example.json`
- `policy/never_clauses.json`
- `policy/ava_fan_boundary.json`
- `config/morrison_character_dna.json`
- `config/director_note_deltas.json`
- `config/regional_performance_templates.json`
- `schemas/collaboration_contract.schema.json`
- `schemas/collaboration_contract.example.json`
- `docs/actor_onboarding_ritual.md`
- `docs/voice_of_refusal.md`
- `docs/rob_ava_safe_collaboration_mesh.md`
- `docs/rob_ava_scaling_architecture.md`
- `docs/actor_approval_ui_flow.md`
- `docs/ava_to_fan_interaction_boundary.md`
- `docs/regulation_stress_test.md`
- `docs/multilang_morrison_rag_workflow.md`
- `pseudocode/rag_pipeline.py`
- `multilang_workflow.py`
- `rag_integration.py`
- `scripts/regulation_stress_test.py`
- `scripts/inspect_vsix.py`
- `scripts/run_multilang_workflow.py`
- `scripts/vsi_character_consistency_demo.py`
- `server.py`
- `rob_ava_50line.py`
