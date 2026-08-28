# mcp-servers/

Custom Model Context Protocol servers owned by this repo.

## Pattern
- One subfolder per server.
- Each contains: `server.ts` (or `server.py`), `README.md` (tool list),
  `manifest.json` (install manifest).

## First servers to consider
- [ ] `pops/` — the Pops guardian hooks
- [ ] `gabriel-voice/` — voice capture + state machine
- [ ] `lucy-memory/` — read/write helpers into D1 for other agents
