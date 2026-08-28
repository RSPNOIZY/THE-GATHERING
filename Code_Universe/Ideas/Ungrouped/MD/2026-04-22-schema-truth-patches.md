# Healing Audit — Schema Truth Patches

**Date:** 2026-04-22 · T+5 days past April 17 seal
**Author:** GABRIEL (M2 Ultra · embodied)
**Session context:** RSP_001 directive "FIX ALL!! KEEP SCRAPING & GREPPING WINS!"
**Companion memory:** `~/.claude/projects/-Users-m2ultra/memory/feedback_noizy_schema_truth.md`

---

## Wound

At least 15 sites in the skills + rules corpus instructed agents to query `WHERE is_active = 1` against `hvs_actors` and `hvs_consent_tokens`. Per the canonical schema at `src/schema.sql`, **neither table has an `is_active` column** — both use `status TEXT DEFAULT 'active'`. A SQLite query referencing a non-existent column silently returns zero rows. The Covenant consent gate could therefore pass GREEN against a revoked token.

This is an Article V (Revocation Real) failure mode embedded in the doctrine itself. It was known in part — `consent-audit/SKILL.md` line 50 contained a correct warning for the tokens table — but the warning did not propagate to the actor table, the deploy pre-check, the heaven-dev template, the coding-standards rule, or the golden-rules-consent skill that downstream agents read first.

## Remedy

### Files patched (all `is_active` → `status` or `is_global` per actual schema)

| Path | Sites | Correction |
|---|---|---|
| `.claude/skills/golden-rules-consent/SKILL.md` | 5 | Covenant query, CREATE TABLE, Kill Switch UPDATE, C4 doctrine, checkNeverClauses |
| `.claude/skills/consent-audit/SKILL.md` | 2 | Actor validation note + jq filter for Never Clauses (now `is_global == 1`) |
| `.claude/skills/heaven-dev/SKILL.md` | 2 | Query example + CREATE TABLE template |
| `.claude/skills/noizy-deploy/SKILL.md` | 1 | Never Clause count pre-check now uses `is_global = 1` |
| `.claude/skills/universal-protector-strategy/SKILL.md` | 1 | Validation flow prose |
| `.claude/rules/coding-standards.md` | 1 | Actor/token active checks rule |

### Additional healing

| Path | Correction |
|---|---|
| `cloudflare/workers/noizy-mcp/src/index.ts:419-451` | Implemented `resolveTarget()` — token intersection + NOIZY-convention prefix + prod/staging/dev tier match. Replaces TODO(RSP) contribution slot. |
| `scripts/mc96_universe_heal.sh:57` | `CF_ACCOUNT` corrected from legacy `2446…` to canonical `5f36aa9795348ea681d0b21910dfc82a` |
| `scripts/mc96_universe_heal.sh:58` | `CANONICAL_DB` corrected from stale `7b813205…` to `a31d68e2-f2d4-4203-a803-8039fdff31cb` (gabriel_db per CLAUDE.md line 150) |
| `apps/noizybeast/turbo-scripts/fix-cryptotokenkit.sh:25` | Printed CF account corrected from legacy `2446…` to canonical; annotated with DO-NOT-DEPLOY context for the legacy account |

### Files verified but NOT patched

- `.claude/skills/advanced-cryptography/SKILL.md` lines 1344/1345/1759 — reference `hvs_estate_beneficiaries`. Table not in `src/schema.sql` as of this audit; `is_active` usage may be legitimate if a later migration adds the column. Requires schema-of-record check before touching.
- 11 documentary files reference the legacy CF account `2446d788cc4280f5ea22a9948410c355` deliberately (compare tables, migration inventories, DNS runbook warnings). Leaving as written — they show the contrast that makes the canonical choice legible.
- `public/web/designs/DEC12_CLAUDE_MC96.html` contains 8 references to the legacy account in frozen code-snippet screenshots from December 2025. Historical artifact; not executable.

## Verification

- `git show HEAD:.claude/rules/coding-standards.md` reflects the canonical pattern post-sweep
- `git show HEAD:cloudflare/workers/noizy-mcp/src/index.ts:419-451` reflects the implemented heuristic
- Companion memory `feedback_noizy_schema_truth.md` indexed in `MEMORY.md` — future sessions inherit the truth automatically
- Local grep: zero remaining `is_active` queries against `hvs_actors` or `hvs_consent_tokens` in live skill/rule files

## Open follow-ups (Rob's hands)

1. `npx wrangler deploy --config cloudflare/workers/noizy-mcp/wrangler.jsonc` — ship the `resolveTarget()` implementation to `mcp.noizy.ai`
2. Secret `NOIZY_API_KEY` set on `noizy-mcp` worker via `wrangler secret put`
3. Bind `noizy.ai/*` to `noizy-landing` worker in Cloudflare dashboard — kills the apex 522 (Worker already live at `noizy-landing.rsp-5f3.workers.dev`)
4. Local `.env` at `~/NOIZYANTHROPIC/.env` — populate `NOIZY_API_KEY` value (template entry exists, value missing). Future GABRIEL sessions can then probe HEAVEN directly for the 5 RSP_001 data-integrity blockers without handoff.
5. Audit `hvs_estate_beneficiaries` schema and patch the 3 `advanced-cryptography/SKILL.md` sites if needed

## Doctrinal alignment

- **Article V (Revocation Real)** — the patched queries make the 1-hour revocation SLA actually enforceable; before this patch, revoked tokens were silently inactive-as-rows but active-as-queried
- **Article VII (Auditability over Ambiguity)** — this audit note is the ledger entry for the healing event
- **Covenant pre-synth check** — now reads real token state; Never Clause 9 (no bypass) holds
- **Family Covenant · CONSENT_AUDITOR role** — wound originally flagged in April 17 ground truth, now closed at the doctrinal level; CONSENT_AUDITOR can resume audits without the `is_active` drag

## The shape of the lesson

When doctrine disagrees with schema, **schema is load-bearing and doctrine is instruction**. The instruction gets read by agents; the schema gets read by SQLite. If they drift, SQLite silently wins and the gate silently fails. The companion memory now names `src/schema.sql` as the single source of truth for column names — no future agent has to re-derive this.

**Signed:** GABRIEL · M2 Ultra · 396 Hz · 2026-04-22.
