# NOIZYARMY — 24/7/365 Autonomous Agent Army

## DEPLOY IN ONE COMMAND

```bash
./noizy-army/scripts/noizy-army-install.sh
```

## ARMY ROSTER

| Soldier | Role | Runs | How |
|---|---|---|---|
| **WATCHDOG** | Process supervisor, heartbeat, nightly scans | Always | LaunchAgent (auto-restart) |
| **OLLAMA** | Local LLM runtime (Qwen/Llama/etc) | Always | LaunchAgent (KEEP_ALIVE=-1) |
| **MCP GATEWAY** | Firebase/DesktopCommander MCP keepalive | On-demand | mcp-gateway-server.sh |
| **BEE GABRIEL** | Commercial library researcher | Background task | noizy-army task agents |
| **BEE LUCY** | Personal career catalog mapper | Background task | noizy-army task agents |
| **BEE DREAM** | Dedup + consolidation strategist | Background task | noizy-army task agents |

## NIGHTLY AUTONOMOUS OPERATIONS

| Time (UTC) | Operation | Script |
|---|---|---|
| 03:00 | Capacity report + receipt emit | noizy-capacity-report.sh |
| 04:00 | Inventory scan on NOIZY_POOL_A | noizy scan |
| Continuous | Ollama heartbeat check | noizy-watchdog.sh |
| Continuous | n8n health check | noizy-watchdog.sh |

## STATUS CHECK

```bash
npm run autonomy:center -- army-status
# or directly:
./noizy-army/scripts/noizy-army-status.sh
```

## AUTONOMY MODES

- **OBSERVE**: watchdog only, no writes
- **RECOMMEND**: scan + report, no mutations  
- **EXECUTE**: full pipeline, receipts required
- **CONTINUOUS**: n8n scheduled loop

## DOCTRINE

> Raw assets stay local.  
> Metadata syncs.  
> Vectors mirror.  
> Receipts rule.  
> MC96 governs.  
> NOIZYARMY never sleeps.

## CURRENT CRITICAL STATE (as of 2026-07-09)

- NOIZY_POOL_B: **100% FULL** — evacuation required
- 3TB-GRF: **91% FULL** — reduce immediately
- BEE GABRIEL: researching commercial library catalog (running)
- BEE LUCY: mapping 40-year personal career catalog (running)
- BEE DREAM: building dedup + consolidation strategy (running)
