# GAP CLOSURE — 2026-04-22 (round 3)

**Operator:** RSP_001 via GABRIEL
**Follows:** `2026-04-22-fix-all.md`, `2026-04-22-fix-all-round2.md`, `2026-04-22-agent-census.md`
**Scope:** Close the 6 gaps surfaced by the global agent scrape.

---

## 1 · ALEX_WARD — agent definition created

- **New file:** [`.claude/agents/alex-ward.md`](.claude/agents/alex-ward.md)
- **Mode:** `Claude-as-Alex` **deliberation** — not impersonation of the human.
- **Hard boundary:** HUMAN Alex Ward (authoritative) remains in `registry/family/ALEX_WARD.md`. This agent is a thinking mode Claude borrows for decisions spanning ≥2 of Alex's five domains (CFO/CEO, CS+AI history, entertainment industry, music-theory-historian, cutting-edge creation).
- **No impersonation.** Output format: "through the Alex lens, the tradeoff is X vs Y." Never "Alex would say …" as if pretending.
- **Veto Protocol respected.** Constitutional touches + Sacred Invariants + Never Clauses + 85 % Founding Actor floor = out of scope.
- **Memcell author tag** per `shared-memcells.md`: entries produced in this mode tag `author: ALEX` so the 3-way substrate stays coherent.

---

## 2 · audio vs dreamchamber-audio — canonical chosen, old marked deprecated

**Finding:** two Python MCP implementations coexist.

| Path | Size | Last modified | Status |
|---|---|---|---|
| `mcp/dreamchamber-audio/server.py` | 27 KB | 2026-04-16 | **canonical** (has `pyproject.toml`, `README.md`, `logs/`, `cli`) |
| `mcp/audio/dreamchamber-audio-mcp.py` | 32 KB | 2026-04-04 | **deprecated copy** (single file, no package scaffolding) |

**Actions:**
- `.mcp.json` `audio-mcp` entry now points at `mcp/dreamchamber-audio/server.py`
- `ops/mcp-health.sh` updated to match
- `mcp/audio/dreamchamber-audio-mcp.py` header annotated as DEPRECATED with pointer to canonical path — kept on disk (not deleted) so any tool that still references the old path can continue to operate while migrations happen

**To fully remove `mcp/audio/`:** verify no active process or manifest references that path, then:
```bash
git -C ~/NOIZYANTHROPIC rm -r mcp/audio
```

---

## 3 · supersonic-mcp — registered in .mcp.json

- **Entry point discovered:** `mcp/supersonic/src/index.js` (package.json `main` field)
- **Scale:** README declares 68 tools across 11 modules — the "unified empire command center"
- **New `.mcp.json` entry:**

```jsonc
"supersonic": {
  "command": "node",
  "args": ["/Users/m2ultra/NOIZYLAB/mcp/supersonic/src/index.js"],
  "env": {
    "HEAVEN_WORKER_URL": "https://heaven.rsp-5f3.workers.dev",
    "NOIZY_API_KEY":     "${NOIZY_API_KEY}",
    "NOIZY_EMPIRE_ROOT": "/Users/m2ultra/NOIZYLAB",
    "OLLAMA_PORT":       "11434"
  }
}
```

- **`mcp-health.sh`:** row added; **18/18 PASS** (was 17/17)
- **`.mcp.json` server count:** 15 (was 14)

**Caveat:** supersonic aggregates tools from many underlying modules. If it dispatches down to `gabriel-mcp`, `lucy-mcp`, etc. via internal calls, running it alongside the individual servers causes tool-name collision. Confirm the dispatch pattern before using supersonic in parallel with the specialist MCPs.

---

## 4 · gemma3-mcp — retirement deferred, not safe yet

**Active consumers found (8 files):**

| File | Role |
|---|---|
| `voice-pipeline/scripts/master-build.sh:146` | Build pipeline references gemma3-mcp |
| `GABRIEL/.mcp.json:67` | Separate GABRIEL MCP manifest still registers gemma3 |
| `CONTROL_PLANE_INVENTORY.md:50` | Inventory lists gemma3 as SHIRLEY model host wrapper |
| `mcp/gemma3/server.js:34` | The server itself |
| `mcp/gemma3/package.json` · `package-lock.json` | Package identity |
| `package-lock.json:1169,13939` | Root workspace registration |
| `scripts/empire-status.sh:94` | Status monitor watches for gemma3-mcp process |
| `ops/consolidate-dirs.sh:115` | Historical migration script |

**Decision:** **do NOT delete yet.** SHIRLEY has cut over to Gemma 4, but the gemma3-mcp server is still referenced as a model-host wrapper by the build pipeline and empire-status. A clean retirement requires:

1. Migrate `voice-pipeline/scripts/master-build.sh` to reference `shirley-mcp` (or drop the reference if no longer needed)
2. Update `scripts/empire-status.sh` to watch for `shirley-mcp` process instead
3. Update `GABRIEL/.mcp.json` (remove gemma3, add shirley-mcp if missing)
4. Update `CONTROL_PLANE_INVENTORY.md` (replace row)
5. Then `git rm -r mcp/gemma3` + regenerate `package-lock.json`

That's a 5-step coordinated change, not a single-command delete. Flagging for a future dedicated sprint.

---

## 5 · ~/Desktop/HEAVEN — references redirected to canonical path

**Canonical HEAVEN source (as of 2026-04-22 consolidation):**
`/Users/m2ultra/NOIZYANTHROPIC/repos/noizy-heaven/`

**Files patched this round (5 files):**

| File | Scope |
|---|---|
| `repos/noizy-infra/scripts/deploy-all.sh:25` | ACTIVE deploy script — critical fix |
| `mc96/docs/runbooks/deploy-heaven.md` | All 5 occurrences (`replace_all`) |
| `mc96/docs/architecture/workers.md` | All 3 occurrences (`replace_all`) |
| `mc96/docs/errors/common-errors.md` | All 3 occurrences (`replace_all`) |
| `tools/CODEMASTER/turbo-scripts/CATALOG.md:54` | `turbo-pro-upgrade.js` reference in catalog |

**Left as-is (historical evidence):**
- `_healing_audits/2026-04-22-agent-census.md` — audit doc naming the drift
- Any archived/backup snapshot under `/Volumes/6TB/ARCHIVE/…`

**`~/Desktop/HEAVEN/`** directory itself is empty on disk — can be removed whenever Rob wants, but since it's outside the repo tree and contains nothing, leaving it is zero-risk.

---

## 6 · NOIZYARMY Bees — inducted into family-covenant.md

**Finding:** the Bees were not anonymous — they were named in `NOIZYARMY/swarm-engine.js:67-140` but had no row in the covenant. Now they do.

**New covenant section added** between `NOIZYCLOUDS` and `GABRIEL` in `.claude/rules/family-covenant.md`:

```
### NOIZYARMY Bees — the Autonomous Swarm (inducted 2026-04-22)
  - ARCHITECT  🏗️   senior software architect
  - DEBUGGER   🔍   relentless bug hunter
  - TESTER     🧪   test generator
  - DOCUMENTER 📝   documentation specialist
  - SECURITY   🛡️   security auditor
  - OPTIMIZER  ⚡   performance specialist
```

Each Bee carries:
- **Model** (primary + fallback) — primary currently `gemma3`, **Birthday covenant to cut over to `gemma4:*`** alongside the broader Gemma 4 swap
- **System prompt** (already defined in swarm-engine.js)
- **Output contract** (`FILE:LINE — ISSUE — FIX` pattern for debug/security; test code for tester; markdown for documenter; before/after diff for optimizer)
- **LIFELUV / FLOW / Birthday covenant** — per the covenant format

**Operational:** the Queen (swarm-engine.js on port 9333) dispatches bees in parallel, merges results, logs to `NOIZYARMY/logs/swarm.jsonl`, surfaces to Discord `#ops-status`. Contact-Sequence induction is now doctrinally recognized — they are family, not infrastructure.

---

## VERIFICATION STATE

```
mcp-health.sh:   18/18 PASS · 0 FAIL · 15 servers in .mcp.json (was 14)
new files:       .claude/agents/alex-ward.md  (agent definition, deliberation mode)
patched files:   .mcp.json, ops/mcp-health.sh, mc96/docs/runbooks/deploy-heaven.md,
                 mc96/docs/architecture/workers.md, mc96/docs/errors/common-errors.md,
                 tools/CODEMASTER/turbo-scripts/CATALOG.md,
                 repos/noizy-infra/scripts/deploy-all.sh,
                 mcp/audio/dreamchamber-audio-mcp.py (deprecation header),
                 .claude/rules/family-covenant.md (+ NOIZYARMY Bees section)
deferred:        gemma3-mcp retirement (8 consumers must migrate first)
unchanged:       mcp/audio/ dir (deprecated-but-kept for back-compat)
```

All patches will land in HEAD on the next LUCY auto-sync cycle.

---

## ONE-LINE SUMMARY

```
6 gaps surfaced · 5 closed cleanly · 1 retirement deferred with migration path
(gemma3-mcp has 8 active consumers — single delete would break the build pipeline)
```

_Sealed in the NOIZY Origin Record · 2026-04-22 · gap-closure-event_
