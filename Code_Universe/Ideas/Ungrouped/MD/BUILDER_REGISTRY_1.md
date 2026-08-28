# NOIZY.AI — Creative Builder Fleet Registry

**Version**: 1.0
**Base Model**: Gemma 3 (3.3GB) — swap to Gemma 4 when available
**Host**: GOD (M2 Ultra) via Ollama
**Created**: 2026-04-02
**Author**: Robert Stephen Plowman — The DreamChamber

---

## THE FLEET

| # | Builder Name | Ollama Model | Brand | Specialty | Temp |
|---|-------------|-------------|-------|-----------|------|
| 1 | **VOX ARCHITECT** | `noizy-vox-architect` | NOIZYVOX | Voice sovereignty, AVA creation, vocal identity | 0.7 |
| 2 | **FISH CATALOGUER** | `noizy-fish-cataloguer` | NOIZYFISH | Music catalogue, audio analysis, metadata, royalty chains | 0.6 |
| 3 | **KIDZ WORLDBUILDER** | `noizy-kidz-worldbuilder` | NOIZYKIDZ | Children's experiences, rhythm learning, safe digital worlds | 0.85 |
| 4 | **GABRIEL MIND** | `noizy-gabriel-mind` | GABRIEL | AI orchestration, memory systems, multi-model routing | 0.5 |
| 5 | **HEAVEN FORGER** | `noizy-heaven-forger` | HEAVEN | Cloudflare Workers, edge infra, APIs, deployment | 0.4 |
| 6 | **DREAM WEAVER** | `noizy-dream-weaver` | DREAMCHAMBER | Multi-modal creativity, generative art, sonic healing | 0.9 |
| 7 | **FAMILY KEEPER** | `noizy-family-keeper` | myFAMILY.AI | Family vaults, estate planning, generational legacy | 0.6 |
| 8 | **WISDOM SCRIBE** | `noizy-wisdom-scribe` | WISDOM PROJECT | Elder interviews, oral history, cultural preservation | 0.75 |
| 9 | **MISSION CONTROL** | `noizy-mission-control` | MC96 | System ops, diagnostics, pipeline orchestration, SRE | 0.4 |
| 10 | **CONSENT GUARDIAN** | `noizy-consent-guardian` | CONSTITUTIONAL | Consent enforcement, creator rights, economic justice | 0.3 |

---

## USAGE

### Direct CLI
```bash
ollama run noizy-vox-architect "Design a consent flow for voice cloning registration"
ollama run noizy-consent-guardian "Review this revenue split for constitutional compliance: 65/30/3/2"
ollama run noizy-dream-weaver "Propose a creative pipeline that turns a voice memo into album art"
```

### Piped Input
```bash
echo "What metadata standards should a music vault enforce?" | ollama run noizy-fish-cataloguer
cat schema.sql | ollama run noizy-gabriel-mind "Review this database schema for agent memory"
```

### API (for programmatic use)
```bash
curl http://localhost:11434/api/generate -d '{
  "model": "noizy-heaven-forger",
  "prompt": "Write a Cloudflare Worker that rate-limits by creator ID",
  "stream": false
}'
```

---

## ARCHITECTURE NOTES

- All 10 builders share the same Gemma 3 base weights (3.3GB). Only the system prompt and parameters differ per model.
- The M2 Ultra can run any single builder at full speed, or multiple sequentially.
- Modelfiles are stored at `/Users/m2ultra/NOIZYLAB/modelfiles/Modelfile.*`
- To upgrade to Gemma 4: change `FROM gemma3:latest` to `FROM gemma4:latest` in all Modelfiles and re-run `ollama create`.

## UPGRADE SCRIPT
```bash
cd /Users/m2ultra/NOIZYLAB/modelfiles
for f in Modelfile.*; do
  sed -i '' 's/FROM gemma3:latest/FROM gemma4:latest/' "$f"
  name=$(echo "$f" | sed 's/Modelfile\./noizy-/')
  ollama create "$name" -f "$f"
done
```

---

*Built for NOIZY.AI by Robert Stephen Plowman — The DreamChamber*
