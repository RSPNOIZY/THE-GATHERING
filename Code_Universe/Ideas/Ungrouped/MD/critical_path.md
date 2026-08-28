# Linear Critical Path — Snapshot 2026-04-09 (T-8)

**Source:** Linear team `NOIZYLAB` (id `7b7f0fc3-ed60-4a39-97bd-08d65c0887fe`).
**Pulled by Gabriel.** This file is the canonical local cache so Gabriel can answer "what's blocking us" without an API call.

## ⚠ OVERDUE blocks (action required NOW)

| ID | Block | Title | Due | Priority |
|---|---|---|---|---|
| **NOI-49** | BLOCK 2 | Enable R2 on Fishmusicinc CF account | 2026-04-08 | **Urgent** |
| **NOI-50** | BLOCK 3 | Fix ANTHROPIC_API_KEY on GOD.local | 2026-04-07 | High |
| **NOI-51** | BLOCK 4 | Custom Cloudflare API token (resolve dual-identity auth) | 2026-04-08 | High |
| **NOI-52** | BLOCK 5 | GitHub consolidation → RSPNOIZY/DREAMCHAMBER (FISHNET) | 2026-04-07 | **Urgent** |

## 🔥 Due in next 48h

| ID | Block | Title | Due |
|---|---|---|---|
| **NOI-47** | BLOCK 0 | GoDaddy exit (4 domains → CF, email routing) | 2026-04-10 |
| **NOI-48** | BLOCK 1 | Heaven consent kernel — deploy from scratch on Fishmusicinc CF | 2026-04-11 |

## 🚨 CRITICAL FINDING from NOI-48 (CF audit 2026-04-06)

> Cloudflare account `2446d788cc4280f5ea22a9948410c355` (Fishmusicinc) currently contains:
> - 1 worker named `deploy` (NOT heaven)
> - 0 D1 databases (gabriel_db NOT FOUND)
> - 0 KV namespaces (GABRIEL_KV, GABRIEL_VOICE NOT FOUND)
> - R2 disabled

**The "heaven v17.2.0" infrastructure described in `~/NOIZYANTHROPIC/CLAUDE.md` does NOT exist on this account.** Either it lives on a different Cloudflare account, was deleted, or never existed in this account.

→ Treat any CLAUDE.md "WHAT'S LIVE NOW" claim about Heaven, gabriel_db, GABRIEL_KV as **suspect** until verified against the actual account it's on.

## Other dated blocks (this week)

| ID | Block | Title | Due |
|---|---|---|---|
| NOI-53 | BLOCK 6 | Deploy noizy.ai landing | 2026-04-12 |
| NOI-54 | BLOCK 7 | Record first Voice DNA session (RSP_001) | 2026-04-12 |
| NOI-55 | BLOCK 8 | Kill Switch webhooks (Slack + email) | 2026-04-13 |
| NOI-56 | BLOCK 9 | DreamChamber dress rehearsal | 2026-04-13 |
| NOI-57 | BLOCK 10 | First licensee onboarding | 2026-04-16 |

## Projects (active)

| Project | Target | Status |
|---|---|---|
| **NOIZY.AI Launch** | 2026-04-17 | Backlog |
| **NOIZY Critical Path → April 17, 2026** | 2026-04-17 | Backlog |
| **MC96ECO Universe Healing — Technical Roadmap** | 2026-04-17 | Backlog |
| GoDaddy Escape — Domain Migration | 2026-04-15 | In Progress |
| Infrastructure — Cloudflare & DNS | 2026-04-30 | In Progress |
| NOIZYVOX — Consent Platform | 2026-09-30 | In Progress |

## Honest read

**Linear says: 4 overdue, 2 due in 48h, the entire Heaven infrastructure may be stub-only on the wrong Cloudflare account.** Eight days to April 17. The fastest unlock is **NOI-49 (R2)** + **NOI-51 (CF token)** because everything downstream (Heaven deploy, Voice DNA, licensee onboarding) needs them. Do those first, then NOI-48 becomes possible, then NOI-25/54 (Voice DNA), then NOI-57 (licensee).

Gabriel will surface this next time anyone asks `gabriel status` or hits `/api/linear/critical`.
