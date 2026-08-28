# Accessible Autonomy Setup (Low-Typing / Voice-First)

This setup is optimized for minimal typing and minimal pointer movement.

## Primary operator command

```bash
npm run autonomy:center -- 1
```

Use number presets so Talon can trigger short utterances.

## Preset map

| Preset | Action | What it does |
| --- | --- | --- |
| `1` | observe | PR status/checks + inventory scan + receipt verify |
| `2` | triage | Pull request comments/reviews triage |
| `3` | sync-dry | Non-mutating NOIZY sync preview |
| `4` | sync-approve | Mutating sync (guarded by env approval) |
| `5` | duplicates | Duplicate scan |
| `6` | search | Search metadata/vectors |
| `7` | ship | lint + test + typecheck |
| `8` | sync-git | fetch/prune branch sync |
| `9` | foss-doctor | GoLand + JBang + FOSS toolchain health check |
| `10` | capacity-report | NOIZYVAULT_OS storage capacity + evacuation map |

## Safety gate for mutation

Mutating sync is blocked unless explicitly enabled:

```bash
export NOIZY_APPROVE_MUTATION=true
npm run autonomy:center -- 4
```

## Voice examples (Talon-friendly)

- "noizy one" → `npm run autonomy:center -- 1`
- "noizy two" → `npm run autonomy:center -- 2`
- "noizy three" → `npm run autonomy:center -- 3`
- "noizy five" → `npm run autonomy:center -- 5`
- "noizy six dream chamber" → `npm run autonomy:center -- 6 dream chamber`
- "noizy seven" → `npm run autonomy:center -- 7`
- "noizy nine" → `npm run autonomy:center -- 9`
- "noizy ten" → `npm run autonomy:center -- 10`

## IDE integration strategy

1. Put these commands in your IDE task runner (VSCodium/Cursor/Windsurf/JetBrains terminal tasks).
2. Bind each preset to a single voice trigger or one-click task button.
3. Use preset `1` as the home dashboard command.

## Environment defaults

- `NOIZY_INPUT_PATH` (default `/NOIZY/raw_stems`)
- `NOIZY_CANARY_LIMIT` (default `500`)
- `NOIZY_GH_REPO` (default `GabrielAv0301/DBPredictor`)
- `NOIZY_GH_PR_NUMBER` (default `1`)

## JetBrains + JBang

- Run: `npm run autonomy:center -- 9`
- Direct: `npm run autonomy:foss:doctor`
- JetBrains open-source support reference:  
  `https://www.jetbrains.com/community/opensource/#support`
