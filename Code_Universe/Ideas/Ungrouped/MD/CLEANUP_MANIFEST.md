# Cleanup Manifest — 2026-04-18

> Record of the "grep & clean" pass triggered 2026-04-18 in service of the GoDaddy exit. Canonical DNS plan: [`ops/DNS_CORRECTNESS_PLAN.md`](./DNS_CORRECTNESS_PLAN.md).

## Scope of this pass

**Active tree only.** Everything under `repos/`, `noizy-workspace/`, `.claude/worktrees/`, `Recovered/`, `RSP_001_VAULT/`, `_private/`, and `mc96/eco/.heal-backups/` is considered archived and was **not** touched. Those require separate decisions (see Open Decisions below).

## What was ratified (must propagate to memory + CLAUDE.md)

1. **5 canonical NOIZY domains**: noizy.ai · noizyfish.com · fishmusicinc.com · noizykidz.com · noizyvox.com
2. **Not registered, not registering**: noizyfish.ca · noizylab.ca · noizlab.ca
3. **`.ai` transfer blocker**: noizy.ai has 525 days remaining; registry requires ≥730. **Renew +2y at GoDaddy before transfer.**
4. **CF account policy**: NOIZYFISH (5f36aa97…) is canonical. Fishmusicinc (2446d788…) is legacy — consolidate + close.
5. **CF login**: move from `rsp@noizyfish.com` → `rsplowman@icloud.com` before any transfer.

## Files created

| Path                                         | Purpose                                                                  |
| -------------------------------------------- | ------------------------------------------------------------------------ |
| `ops/DNS_CORRECTNESS_PLAN.md`                | Canonical 6-phase plan — source of truth                                 |
| `ops/cf-dns-bootstrap.sh`                    | Idempotent MX/SPF/DMARC/CAA/Email-Routing installer                      |
| `ops/cf-transfer-preflight.sh`               | Verifies transfer readiness (lock/expiry/.ai min-term/60-day ICANN risk) |
| `ops/CLEANUP_MANIFEST.md`                    | This document                                                            |
| `_archived/2026-04-18-unregistered-domains/` | Safe-quarantine for removed artifacts                                    |

## Files edited

Active-tree updates (surgical, no banners):

- `.claude/prompts/godaddy-exit.md` — rewrote to 5-domain reality, points to canonical plan
- `.claude/prompts/workspace-setup.md` — dropped noizyfish.ca from secondary-domain recommendations
- `.claude/skills/godaddy-migration/SKILL.md` — rewrote with 5-domain inventory + CF API token prereq
- `infra/PRODUCTION_CHECKLIST.md` — rewrote with 5-domain checklist + ratified decisions
- `infra/runbook/GODADDY_EXIT_RUNBOOK.md` — version 2.0 banner, 3-domain transfer table, .ai renewal gate
- `infra/dns/README.md` — 6-zone table → 5-zone, dropped noizyfish.ca row
- `infra/docker/scripts/dns-scan.sh` — DOMAINS var: drop .ca, add noizykidz + noizyvox
- `MC96ECO/heaven/tools/preflight.sh` — domain loop: drop noizylab.ca, add 3 canonical
- `mc96/heaven/tools/preflight.sh` — same fix (duplicate subtree)
- `mc96/eco/scripts/mc96_universe_heal.sh` — DNS check loop: drop noizylab.ca
- `scripts/mc96_universe_heal.sh` — DNS check loop: drop noizylab.ca
- `scripts/setup-integrations.sh` — dropped noizylab.ca hint, pointed to cf-dns-bootstrap.sh
- `workers/_cloudflare-legacy/workers/admin/src/index.js` — domains array: drop noizyfish.ca
- `registry/agents/CB01.md` — rewrote with 5-domain active mission
- `MC96ECO_100_PERCENT_SPRINT.md` — domain list fix

## Files banner-superseded (content preserved, banner added at top)

> All marked with `⚠ SUPERSEDED 2026-04-18` banner pointing to canonical plan. Content remains for historical reference.

- `MC96ECO/heaven/MAIL_DOCTRINE.md`
- `MC96ECO/heaven/tools/dns/MAIL_DOCTRINE.md`
- `MC96ECO/heaven/tools/dns/DNS_CHECKLIST.md`
- `mc96/heaven/MAIL_DOCTRINE.md`
- `mc96/heaven/tools/dns/MAIL_DOCTRINE.md`
- `mc96/heaven/tools/dns/DNS_CHECKLIST.md`
- `docs/ops/NOIZY_EMAIL_MATRIX.md`
- `docs/ops/DNS_EMAIL_MIGRATION.md`
- `docs/ops/GODADDY_EXIT_NOW.md`
- `docs/audits/DNS_INFRA_AUDIT_20260403.md`
- `ops/cloudflare-provision-checklist.md`
- `ops/google-workspace-setup.md`

## Files archived (moved, not deleted — reversible)

Moved to `_archived/2026-04-18-unregistered-domains/`:

- `landing/noizyfish-ca/` → workers for unregistered domain
- `landing/noizylab-ca/` → workers for unregistered domain
- `infra/dns/zones/noizyfish.ca.zone` → zone file for unregistered domain
- `scripts/fix-noizylab-mx.sh` → whole script for unregistered domain
- `ops/godaddy-exit-dns.sh` → superseded by `ops/cf-dns-bootstrap.sh`
- `ops/godaddy-exit-execute.sh` → superseded by `ops/cf-transfer-preflight.sh` + plan

## Memory updated

- `/Users/m2ultra/.claude/projects/-Users-m2ultra-NOIZYANTHROPIC/memory/project_domain_empire.md` — 2026-04-18 verified state, transfer gates, consolidation plan

## Verification state

```
Active tree .ca refs (excluding banner-guarded files, archives, worktrees): 1
  └─ infra/dns/README.md:5  — correct notation that noizyfish.ca is NOT registered
```

Effective cleanliness: active tree is aligned with the 5-domain canonical inventory.

---

## OPEN DECISIONS — require RSP_001 call

These are out of scope for the 2026-04-18 pass. Each is a distinct decision.

### D-1 · `repos/the-gathering/` — archive or prune?

Contains 40+ `.ca`-era references, old wrangler files, duplicate of `./noizy-workspace/THE-GATHERING/`. Directory mtime April 16. Looks like a pre-consolidation snapshot kept around for reference.

- **Option A**: Move to `_archived/2026-04-18-pre-consolidation-snapshots/` (preserves, quarantines)
- **Option B**: Delete outright (saves ~? MB, no longer referenced from CLAUDE.md)
- **Option C**: Leave as-is, mark with `SUPERSEDED.md` at root

Recommend **A**.

### D-2 · `noizy-workspace/THE-GATHERING/` — duplicate of above

Same content, different location. Strongly recommend archive + keep only one copy.

### D-3 · `.claude/worktrees/youthful-edison/` — abandoned worktree

Git worktree on branch `claude/youthful-edison` with commit `d95d7090`. Not merged. Contains 30+ legacy CF account references and stale `.ca` content.

- **Option A**: Merge useful parts (if any) to main, then `git worktree remove`
- **Option B**: Delete worktree + branch (lose any uncommitted work)
- **Option C**: Leave as-is

Recommend **A** after Rob inspects what's in that branch.

### D-4 · `repos/noizy-*/` sub-repos (14 of them)

The non-`the-gathering` sub-repos in `repos/`: `noizy-ai`, `noizy-aquarium`, `noizy-consent`, `noizy-docs`, `noizy-fish`, `noizy-gabriel`, `noizy-heaven`, `noizy-infra`, `noizy-kidz`, `noizy-lab`, `noizy-supersonic`, `noizy-voice`, `noizy-vox`, `noizy-wisdom`. Each may or may not be actively used — CLAUDE.md doesn't enumerate them.

- Need per-repo audit: active development vs. abandoned vs. superseded
- Recommend separate session with TodoWrite item per repo

### D-5 · CLAUDE.md version/count drift

Per subagent audit (may be partially unreliable, verify):

- "Heaven v18.0.0" — actual wrangler may say 18.1.0
- "9 Prompt Templates" — 10 files present (workspace-setup.md added but unlisted)
- "12 MCP Servers" — 17 dirs in `mcp/` (audio, dreamchamber-audio, gemma3, metabeast-remote, supersonic undocumented)
- `noizy-landing/` referenced but not present at that path (landing pages live in `landing/`)
- 21 `ops/` scripts undocumented in CLAUDE.md

Recommend: single pass to reconcile CLAUDE.md counts after DNS/domain work completes.

### D-6 · Root-level markdown sprawl

Top level has 30+ `.md` files (ARCHITECTURE.md, CLAUDE.md, CONTROL*MATRIX.md, DREAMCHAMBER*\*.md, FAMILY_TEAM_BRANDS.md, GORUNFREE_SELF_AUDIT.md, etc.). Several overlap in scope. No decision requested today — just flagging for future tidy.

### D-7 · `.claude/prompts/workspace-setup.md`

Not listed in CLAUDE.md's prompts table (which claims 9; there are 10). Either add or archive. Recommend **add** since it's actively referenced.

---

## Post-pass grep baseline (for regression detection)

```bash
# Active tree should show 0 unauthorized .ca references (noise-free filter)
grep -rInE 'noizyfish\.ca|noizylab\.ca|noizlab\.ca' \
  --include='*.md' --include='*.sh' --include='*.js' --include='*.mjs' \
  --include='*.ts' --include='*.py' --include='*.json' --include='*.toml' 2>/dev/null \
  | grep -vE '^\./(repos|noizy-workspace|\.claude/worktrees|Recovered|RSP_001_VAULT|_private|_archived|node_modules|\.git|\.wrangler|\.mypy_cache|logs|\.agent|\.session|\.sixth|supersonic-state|mc96/eco/\.heal-backups)/' \
  | grep -vE 'SUPERSEDED 2026-04-18|Not registering|Not registered|ratified 2026-04-18|removed from all plans|NOT registered, not registering|exit pending'

# Should return only: infra/dns/README.md:5 (correct notation)
```
