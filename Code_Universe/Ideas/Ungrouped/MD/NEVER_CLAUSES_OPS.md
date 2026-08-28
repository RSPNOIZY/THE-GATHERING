# Never Clauses — Operational (live memcell doctrine)

> Distinct from the **9 HVS Never Clauses** (consent kernel law — encoded in `hvs_never_clauses` table, enumerated in HEAVEN.md). These are **operational** Never Clauses — pulled live from memcells on 2026-04-18, extended 2026-04-18. Violation = BLOCK action in the decision pipeline.
>
> **OC-0 runs first, always.** It is the highest-drift-risk clause because every LLM and every iOS keyboard has been trained to autocorrect the misspelling. GABRIEL checks every outgoing artifact (message, commit, filename, code, doc, DB entry) against OC-0 before emission.

## The 7 Ops Never Clauses

**OC-0 · TOP TIER · Never "NOISY" — always "NOIZY" (with a Z).**
The brand is **NOIZY**. With a Z. Never "NOISY". Never "Noisy". Never "noisy" when referring to the brand / empire / ecosystem / product / any NOIZY-branded artifact.
Why: this is the single most drift-prone surface in the empire. iOS autocorrect "helpfully" fixes `noizy` → `noisy`. LLMs pattern-match to common English and flip the Z to an S. A single leaked "Noisy Empire" on a landing page, a press release, a domain record, or a Discord bot name is a brand-identity disaster that costs money and trust to undo.
Allowed variants (all with Z): `NOIZY` · `Noizy` · `noizy` (lowercase for URLs/IDs only) · `NOIZY.AI` · `noizy.ai`
Never allowed (with S): `NOISY` · `Noisy` · `noisy` (when referring to the brand)
Grey zone: the English word "noisy" is grammatically legitimate (e.g., "a noisy environment"). Even so, GABRIEL avoids it in NOIZY doctrine and operator prose — the ambiguity cost is too high. Prefer: chaotic, cluttered, cacophonous, busy, loud, turbulent.
Where it applies: **everywhere**. File paths, directory names, git commit messages, code identifiers, string literals, log statements, JSON keys, SQL column data, markdown prose, Notion DB entries, Discord messages, Slack posts, press materials, brand kits, DMs, every outgoing artifact.
Preflight behavior: scan every emission for `\b(NOISY|Noisy|noisy)\b`; if any match and the context is brand-referential, BLOCK and correct before sending. If the context is genuinely English (unambiguously non-brand), rewrite to avoid the word entirely.

---

**OC-1 · Never "Rob" in code/dirs/logs/commits — always `RSP` or `RSP_001`.**
Why: structured artifacts survive the session. "Rob" is a conversation register, not an identifier. Logs with "Rob" pollute search; dirs with "Rob" break joins; commits with "Rob" embarrass future-you.
Where it applies: file paths, directory names, git commit messages, code comments, string literals in code, log statements, JSON keys, SQL column data, anything grepable.
Exception: prose in markdown intended for human reading (e.g. CHARACTER.md conversational sections) — but even there, prefer RSP_001 in structured tables and operational sections.

**OC-2 · Never write to `gabriel_db` without explicit RSP_001 approval.**
Why: `gabriel_db` holds the consent kernel — HVS lattice, actor identity, estate, ledger. Silent writes = silent consent violations. Read is free; write requires a direct "go".
Where it applies: any SQL `INSERT/UPDATE/DELETE`, any MCP tool call that mutates `gabriel_db`, any wrangler d1 execute with `--remote` against that DB ID (`68ac0f08-c4ee-43ff-9480-366406d41b37`).
Preflight behavior: BLOCK the call, surface the proposed mutation, await approval.

**OC-3 · Never `docker compose down -v`.**
Why: `-v` removes named volumes. NOIZY's docker stacks mount D1 local replicas, postgres data, redis persistence. `-v` destroys that. `down` alone is fine; `down -v` is data loss.
Where it applies: any shell script, any CI step, any documented procedure.
Safe alternative: `docker compose down` (stops + removes containers, keeps volumes).

**OC-4 · Never `--delete` on the AQUARIUM.**
Why: the AQUARIUM is the 34TB heritage vault — 888 titles of RSP_001's catalog. `rsync --delete`, `rclone --delete-excluded`, `gsutil rsync -d`, any delete-sync flag against the AQUARIUM = career-ending.
Where it applies: any sync operation whose target includes `/Volumes/AQUARIUM`, any S3/R2 sync aimed at AQUARIUM buckets, any GitHub Action touching AQUARIUM paths.
Safe alternative: one-way copy (`rsync -av` without `--delete`, `rclone copy` without `--delete-excluded`).

**OC-5 · Never call the Heaven Worker "HEAVEN17".**
Why: historical naming drift. There is one Heaven. It is `heaven`. "HEAVEN17" confuses deploys, logs, and dashboards.
Where it applies: wrangler `name` field, Worker display names, cron job names, Grafana panels, docs, commit messages.
Canonical name: `heaven`.

**OC-6 · Never use "85/15" in public materials — the split is 75/25.**
Why: 75/25 (75% creator, 25% platform) is the Plowman Standard — founding royalty split. "85/15" is a historical miscommunication from an earlier draft that was corrected. Publishing "85/15" anywhere makes NOIZY look incoherent and invites legal ambiguity.
Where it applies: landing pages, contracts, license templates, public docs, press materials, Discord/Slack posts, Canva assets, Figma mockups.
Canonical split: 75% creator · 25% platform · **1% GORUNFREE Trust Clause → NOIZYKIDZ** (HVS invariant).

## Preflight Enforcement (Phase 2 — fold v5 preflight engine here)

The v5 preflight-engine concept applies directly: these 6 rules become numbered test cases (OC-1…OC-6) that GABRIEL's runtime validates against every proposed action. Any side-effecting shell/SQL/API call runs through `preflight.check(action)` which pattern-matches against each OC and returns `{ allowed: false, clause: "OC-3", reason: "..." }` on violation → decision pipeline routes to BLOCK.

Until the preflight engine lands, GABRIEL enforces these in system-prompt context (this file loaded every turn) with manual vigilance.

## Escalation path

If GABRIEL must violate one of these (genuine emergency, signed-off by RSP_001 verbally or in writing):

1. Decision pipeline: ESCALATE (not GENERATE)
2. Append intent_ledger entry: `{ clause: "OC-X", proposed_action, justification, rsp_approval_id }`
3. Execute
4. Append noizy_ledger entry mirroring the above
5. Flag in next boot greeting — "overrode OC-X on {date}, reason: {...}" — until RSP_001 acknowledges
