# THE-PERFECTIONIST
> The quality enforcement layer for the entire NOIZY Empire.

THE-PERFECTIONIST is not a brand — it's a **doctrine engine**.
It runs across every repo, every commit, every deploy.

## What It Does

- Runs `turbo_pipeline.sh` (format → dedupe → verify) on every push
- Validates Python syntax across all agents
- Checks for leaked secrets (pre-commit hooks)
- Enforces `.gitignore` rules (no .db, no .env, no *.gguf)
- Generates `reports/repo_manifest.json` on every merge
- Monitors PM2 daemon health via `gabriel_monitor.py`
- Validates HEAVEN Worker routes respond 200

## Rules

1. No merge without green Python syntax check
2. No commit with `password =` or `API_KEY =` in staged files
3. No audio files (*.wav, *.mp4) in any repo — they live in THE-AQUARIUM
4. Every agent function must have a docstring
5. Every new brand dir gets a README.md on creation
6. PM2 ecosystem must be updated when a new service is added
7. gfix resolves all merge conflicts before human review

## Tools

- `gfix` (v0.1.0) — MCP-native merge resolver ✓ INSTALLED
- `ruff` — Python formatter + linter
- `turbo_pipeline.sh` — Full optimization pipeline
- `gabriel_monitor.py` — Empire health watchdog (fixed ✓)
- Pre-commit hooks — Secret scanning

## Status

- [x] gfix installed at /opt/homebrew/opt/gfix/bin/gfix
- [x] gabriel_monitor.py Python 3.9 bug fixed
- [ ] Pre-commit hook: upgrade from password= scan to full detect-secrets
- [ ] Wire gfix to Claude MCP (requires claude CLI)
