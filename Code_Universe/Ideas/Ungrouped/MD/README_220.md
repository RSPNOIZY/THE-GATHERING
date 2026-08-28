# noizyempire-claude

Claude prompt toolkit for NOIZYEMPIRE — DreamChamber prompt library, CLI, and preview server.

## Quickstart
1. Copy `.env.example` to `.env` and set `CLAUDE_API_KEY`.
2. Install: `npm ci`
3. Run preview server: `npm start` → open http://localhost:3000
4. Run CLI: `npm run cli`

## Features
- Prompt templates in `src/prompts/`
- CLI to generate prompts and call Claude
- Local storage of responses in `data/responses.json`
- VS Code devcontainer for reproducible dev environment

## Notes
- Replace `CLAUDE_API_URL` if your Claude endpoint differs.
- Keep API keys secret. Use a secrets manager for production.

## Security# Copy to .env and fill
CLAUDE_API_KEY=sk-REPLACE_WITH_YOreCLAUDE_API_KEY=sk-REPLtiCLAUDE_API_URL=https://api.anthropic.cClPORT=3000
DATA_DIR=./data
