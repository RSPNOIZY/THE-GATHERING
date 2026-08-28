# Agent Style Memory Prompts

Copy-pastable prompt snippets for GABRIEL, LUCY, and NOIZYBot.
All endpoints are on `http://127.0.0.1:5055` — localhost only, never external.

---

## Prerequisites

```bash
# Start the API (one terminal, keep running)
cd /Users/m2ultra/NOIZYANTHROPIC
python3 engine/noizy_api.py

# Verify it's alive
curl -s http://127.0.0.1:5055/health | python3 -m json.tool
```

---

## GABRIEL — Session Briefing Prompt

Use at the start of a music session to surface NOIZYARMY context.

```
GABRIEL pre-session check:

1. Call: GET http://127.0.0.1:5055/style/sessions-80-20
   → Show the last 3 sessions that observed the 80/20 rule.
   → Key fields: session_id, personal_pack, calls_used

2. Call: GET http://127.0.0.1:5055/style/top-contributors?limit=5
   → List the 5 NOIZYARMY sounds RSP has kept most.
   → Key fields: sound_name, contributor, region, times_kept

3. Call: GET http://127.0.0.1:5055/ledger/call-pack-summary
   → Show open calls and how many contributors/regions each has.
   → Key fields: call_id, theme, status, contributor_count, region_count

Present as:
  "Last 80/20 session: <session_id> (<personal_pack>)
   Top NOIZYARMY sound: <sound_name> by <contributor> (<region>), kept <times_kept>x
   Active call: <call_id> — <contributor_count> contributors from <region_count> regions"
```

---

## GABRIEL — Sound Suggestion Prompt

Use mid-session when RSP asks "what NOIZYARMY sounds should I try next?"

```
GABRIEL suggest sounds for current session:

Call: GET http://127.0.0.1:5055/style/suggest-sounds?session_id=<SESSION_ID>&limit=5

Replace <SESSION_ID> with the current session ID (format: "2026-06-21_NOIZYFISH_001").

Response fields per suggestion:
  - sound_name  : filename to search for in NOIZYARMY/APPROVED/
  - contributor : who made it
  - region      : where it's from
  - times_kept  : how many sessions RSP kept this sound in the final mix

Present as a short list:
  "Suggested sounds for this session:
   1. <sound_name> — <contributor>, <region> (kept <times_kept>x)
   ..."

If suggestions list is empty, fall back to:
  GET http://127.0.0.1:5055/style/top-contributors?limit=5
```

---

## LUCY — Daily DAZEFLOW Digest Prompt

Use in LUCY's morning session check to summarize overnight NOIZYARMY activity.

```
LUCY DAZEFLOW — NOIZYARMY overnight digest:

1. GET http://127.0.0.1:5055/ledger/by-contributor?limit=10
   → Who are the top contributors right now?
   → Fields: contributor, total_sounds, calls_participated, regions, approved, in_packs

2. GET http://127.0.0.1:5055/style/recent-tracks?limit=5
   → What sessions happened recently?
   → Fields: session_id, personal_pack, rule_80_20 (observed/not_observed), noizyarmy_count

3. GET http://127.0.0.1:5055/ledger/call-pack-summary
   → Call status snapshot.
   → Fields: call_id, status (open/closed), submission_count, sound_count, packs_count

Format as DAZEFLOW entry:
  "NOIZYARMY digest — <date>:
   Contributors: <N> total | Top: <contributor> (<total_sounds> sounds)
   Recent sessions: <N> | 80/20 observed: <M>
   Active calls: <call_id> — <sound_count> sounds / <submission_count> submissions"
```

---

## NOIZYBot (Discord) — Contributor Leaderboard Prompt

Use in the NOIZYWORLD Discord bot to show the community leaderboard.

```
NOIZYBot leaderboard command:

Call: GET http://127.0.0.1:5055/ledger/by-contributor?limit=10

Format as Discord embed:
  🌍 NOIZYARMY Contributors
  ─────────────────────────
  1. <contributor>  — <total_sounds> sounds, <regions> regions
     Calls: <calls_participated> | Approved: <approved> | In Packs: <in_packs>
  2. ...

Footer: "Powered by NOIZYARMY Ledger · rsp@noizy.ai"

Only show contributors where in_packs > 0 or approved > 0 for public-facing output.
```

---

## NOIZYBot (Discord) — Active Call Announcement Prompt

Use to auto-announce when a new NOIZYARMY call opens.

```
NOIZYBot call-announce:

Call: GET http://127.0.0.1:5055/ledger/call-pack-summary

Filter: rows where status = 'open'

For each open call, post Discord embed:
  🥁 NOIZYARMY CALL: <call_id>
  Theme: <theme>
  Contributors: <contributor_count> from <region_count> regions
  Sounds received: <sound_count>

  Submit your sounds → rsp@noizy.ai
  Subject: NOIZYARMY PACK — <your-pack-id>

Only announce calls where submission_count == 0 (just opened) or
where the call just crossed 10 / 25 / 50 sound milestones.
```

---

## Quick curl Reference

```bash
# Health
curl -s http://127.0.0.1:5055/health

# Top NOIZYARMY sounds (kept most often)
curl -s 'http://127.0.0.1:5055/style/top-contributors?limit=5'

# Sessions that observed 80/20
curl -s http://127.0.0.1:5055/style/sessions-80-20

# Recent tracks with NOIZYARMY count
curl -s 'http://127.0.0.1:5055/style/recent-tracks?limit=5'

# Suggest sounds for a session
curl -s 'http://127.0.0.1:5055/style/suggest-sounds?session_id=2026-06-21_NOIZYFISH_001&limit=5'

# Call + pack summary (ledger)
curl -s http://127.0.0.1:5055/ledger/call-pack-summary

# Contributors leaderboard (ledger)
curl -s 'http://127.0.0.1:5055/ledger/by-contributor?limit=10'
```

---

## Response Schema Quick Reference

| Endpoint                    | Top-level key       | Key fields per item                                                          |
| --------------------------- | ------------------- | ---------------------------------------------------------------------------- |
| `/style/top-contributors`   | `top_contributors`  | `sound_name, contributor, region, times_kept, session_count`                 |
| `/style/sessions-80-20`     | `sessions`          | `session_id, personal_pack, calls_used, noizyarmy_sounds`                    |
| `/style/recent-tracks`      | `recent_tracks`     | `session_id, personal_pack, rule_80_20, noizyarmy_count`                     |
| `/style/suggest-sounds`     | `suggestions`       | `sound_name, sound_id, contributor, region, times_kept`                      |
| `/ledger/call-pack-summary` | `call_pack_summary` | `call_id, theme, status, sound_count, contributor_count, region_count`       |
| `/ledger/by-contributor`    | `contributors`      | `contributor, total_sounds, calls_participated, regions, approved, in_packs` |

All responses include `"count": N` at the top level.

---

_GABRIEL × LUCY × NOIZYARMY — Robert Stephen Plowman (RSP_001) — 2026_
