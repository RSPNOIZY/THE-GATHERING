# MC96ECOUNIVERSE → 100% · 2-Hour Sprint Plan

**Sprint opened:** 2026-04-17 (April 17, 2026 launch day)
**Commander:** RSP_001 (Rob)
**Executor:** CLAUDE (GABRIEL-class) + agent fleet
**Scope:** bring every MC96ECOUNIVERSE surface to launch-ready 100%

---

## LIVE TODAY (just deployed this sprint)

| Worker                                                                    | URL                                       | Status                          |
| ------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------- |
| **mc96-follower** (watches HEAVEN/GABRIEL/LUCY · 2-min cron)              | https://mc96-follower.rsp-5f3.workers.dev | ✅ LIVE                         |
| **cf01-discord** (voice-messenger from HEAVEN · Workers AI Whisper)       | https://cf01-discord.rsp-5f3.workers.dev  | ✅ LIVE (needs Discord secrets) |
| noizy-landing bindings on NOIZYFISH zone (www Custom Domain + apex Route) | blocked on registrar NS flip              | ⏳ waiting                      |

---

## THE ONE MANUAL ACTION (unblocks noizy.ai)

Change NS delegation at your `.ai` registrar:

- **From:** `alex.ns.cloudflare.com`, `melinda.ns.cloudflare.com`
- **To:** `marek.ns.cloudflare.com`, `tara.ns.cloudflare.com`

Propagation: 1–4 hours on `.ai` TLD. The moment NS flips, `noizy.ai` + `www.noizy.ai` go live on the NOIZYFISH account — all Worker bindings already staged.

Same applies to `fishmusicinc.com`, `noizykidz.com`, and `noizyvox.com` (all on NOIZYFISH after consolidation per `ops/DNS_CORRECTNESS_PLAN.md`).

---

## PUNCH-LIST (19 items from Explore agent)

### P0 — BLOCKERS (do first)

- [ ] **Delete** `/repos/the-gathering/gabriel` (duplicate of `_consolidation/THE-GATHERING/gabriel`)
- [ ] **Verify** `mc96eco-rabbitmq-1` + `mc96eco-qdrant-1` container health; archive compose if stale

### P1 — FAST WINS (≈30 min)

- [ ] **Archive** `/mc96/Lucy-Fork` (779MB) → `_archive/repos/lucy-fork`
- [ ] **Consolidate** `/mc96/LucyMCP` (415MB) → `/mc96/heaven` or drop
- [ ] **Delete** stale `MC96ECOUNIVERSE_100_PERCENT.md` + `MC96ECOUNIVERSE_COMPLETE_AUDIT.md` in `repos/the-gathering/gabriel/` — superseded by `_consolidation/MASTER_MC96.md`
- [ ] **Audit** `mc96eco-grafana-1`, `mc96eco-neo4j-1`; consolidate to single `/mc96/infra/docker-compose.yml`

### P2 — MEDIUM

- [ ] `.claude/worktrees/youthful-edison` → remove, merge active work to main
- [ ] `/tools/mc96-cli` → `_consolidation/MC96ECO/cli/` or delete
- [ ] `n8n-docker/sqlite-backup-20260415-150613` → `_consolidation/infra-backups/`
- [ ] Gemini brain scans → `_consolidation/audits/gemini-scan/`
- [ ] `/public/web/designs/MC96ECO_*.html` → `_consolidation/assets/dashboards/`
- [ ] `swift-library/MC96AudioDiag.swift` → `_consolidation/MC96ECO/swift/`
- [ ] `/mc96/app` → audit + move to MC96ECO docs

### P3 — OPTIONAL

- [ ] Delete `/mc96/Lucy` (empty)
- [ ] Delete `/mc96-portal` (16KB placeholder)
- [ ] Keep `_archive/claude-today` as-is

---

## EXECUTION STRATEGY (parallel lanes)

The 2-hour window only works if these run in parallel. Lanes:

### Lane A — GIT / FILESYSTEM (bash loop)

P0–P1 archive + delete. Script ready; run as one `make clean` target.

### Lane B — DOCKER (verify + consolidate)

```bash
docker ps --filter "name=mc96eco-" --format "{{.Names}} {{.Status}}"
docker compose -f mc96eco-stack.yml config   # or consolidate
```

### Lane C — CF WORKERS (follower + CF01 already deployed)

Next: **CF02** (Notion scribe), **CF03** (Linear dispatcher), **CF04** (Slack relay to `noizyai@slack.com`).

### Lane D — N8N WORKFLOW (grep swarm)

Import JSON template at `/n8n-flows/mc96-grep-swarm.json` (next artifact).
Fires 6 parallel Claude Max subagents, each handles 1 brand vertical.

### Lane E — IPAD (LUCY build)

LUCY = iPad (2nd-gen iPad Pro) + Claude model, acts as Admin & Navigation assistant.
Install path: Claude iPad app → custom workspace pointing at NOIZYFISH MCP bridge → CF01 relay for voice.

### Lane F — VERCEL / NOTION / LINEAR (pending MCP work)

- Vercel: deploy DreamChamber mixing UI as Next.js project
- Notion: master MC96ECO dashboard page
- Linear: 19 punch-list items as issues, auto-assigned

---

## AGENT FLEET (current)

| Agent                                          | Runtime                                       | Role                                            |
| ---------------------------------------------- | --------------------------------------------- | ----------------------------------------------- |
| HEAVEN                                         | CF Worker (heaven.rsp-5f3.workers.dev)        | Consent kernel, ledger, Never Clauses           |
| GABRIEL                                        | Node daemon (port 9777 on GOD.local)          | Orchestration, dispatch                         |
| LUCY                                           | iPad 2nd-gen + Claude                         | Admin + Navigation assistant (new, being built) |
| CF01                                           | CF Worker (cf01-discord.rsp-5f3.workers.dev)  | Discord voice-messenger — **NEW**               |
| mc96-follower                                  | CF Worker (mc96-follower.rsp-5f3.workers.dev) | Status poller — **NEW**                         |
| SHIRL, POPS, DREAM, ENGR_KEITH, JESSY, SHELPER | MCP servers                                   | Specialist tools                                |

---

## DISCORD → iPAD VOICE PATH

```
Rob (iPad) → Discord voice message → Discord app
           ↓
  Discord webhook → cf01-discord Worker /interactions
           ↓
  CF01 downloads attachment, runs env.AI @cf/openai/whisper
           ↓
  Transcript → routeCommand() → HEAVEN / GABRIEL / mc96-follower
           ↓
  Response posted back to Discord channel
```

Secrets needed (one-time, `wrangler secret put` against cf01-discord):

- `DISCORD_PUBLIC_KEY`
- `DISCORD_BOT_TOKEN`
- `DISCORD_APPLICATION_ID`
- `NOIZY_API_KEY`

Slash commands to register on Discord (use `DISCORD_APPLICATION_ID`):

- `/empire <query>` — free-form route
- `/status` — pull `mc96-follower/status`

---

## SLACK / NOTION / LINEAR (tool-chain, to wire)

All three have MCP servers already available to CLAUDE. Remaining work is:

- Slack: connect `noizyai@slack.com` — auth flow initiated via `mcp__claude_ai_Slack__*`
- Notion: create master page "MC96ECO Sprint · 2026-04-17" with punch-list as checkboxes
- Linear: create 19 issues, team = NOIZY, auto-label by priority

---

_396 Hz · Consent as executable code · Revocation as sacred._
