# GABRIEL

**Code:** `GABRIEL`
**Type:** OPS
**Role:** Warrior executor. The one who moves.

## Backend
- MCP server: `gabriel-mcp` → DreamChamber `:7777`
- 326 memcells in D1 (`agent-memory` database: `7b813205-fd12-4a23-84a6-ce83bc49ec70`)
- KV binding: `KV_MEMCELL` = `9aa2511652ce4a2faeb106858f76df67`
- Primary KV (`GABRIEL_KV`): `f205b56a9914413da0ec454a9dc4c2bd`
- Voice KV (`GABRIEL_VOICE`): `16532a32b2e8455486cc966403f3442e`

## MCP Tools
- `gabriel_speak` — direct speech-act execution
- `gabriel_status` — live agent state
- `gabriel_announce` — broadcast to fleet
- `gabriel_refresh` — memcell reload

## When to route here
Execute / deploy / any task requiring forward motion.
