# CLOUDFLARE / GITHUB CONFLICT RESOLUTION
# NOIZY.AI — GOD.local — 2026-03-27T13:32

---

## ROOT CAUSE IDENTIFIED

Two Cloudflare accounts existed in the codebase simultaneously.

| Account | ID | Status |
|---|---|---|
| **NOIZY.ai (PRODUCTION)** | `5ba03939f87a498d0bbed185ee123946` | ✅ CANONICAL — wrangler authenticated here, gabriel_db lives here |
| Second account | `2446d788cc4280f5ea22a9948410c355` | ❌ REMOVED from all files |

**The `5ba03939` account is the production NOIZY.ai account.**
Wrangler's own auth cache confirms this: `{"account": {"id": "5ba03939...", "name": "NOIZY.ai"}}`

---

## FILES FIXED (12 total)

- noizy-command-center/ipad.html ✅
- noizy-command-center/index.html ✅
- noizy-command-center/extras.js ✅
- noizy-command-center/gabriel.js ✅
- noizy-workers/claude-proxy/wrangler.toml ✅
- noizy-workers/claude-proxy/src/index.js ✅
- noizy-workers/claude-proxy/src/index.ts ✅
- noizy-workers/scripts/migrate-zone.sh ✅
- noizy-workers/teams-bot/src/index.js ✅
- NOIZYLAB/mcp-gemma3/server.js ✅
- NOIZYLAB/voice-pipeline/scripts/master-build.sh ✅
- NOIZYLAB/workers/consent-gateway/wrangler.toml ✅ (added explicit account_id)
- Desktop/CLAUDE TODAY/CLAUDE.md ✅

---

## GITHUB CONFLICTS

| Issue | Fix |
|---|---|
| MCP configs referenced `/Users/robplowman/` | Fixed → `/Users/m2ultra/` |
| GitHub Enterprise org | NOIZY.AI Enterprise only — personal repos → ARCHIVE/ |
| No public repos | Enforced |
| wrangler login | Uses GitHub OAuth — log in ONCE and it caches to the correct account |

---

## ACTIVE CF RESOURCES ON 5ba03939

| Resource | Name | ID |
|---|---|---|
| D1 Database | gabriel_db | f75939d5-5747-4a9c-8ac2-7710201fda09 |
| Worker | noizy-consent-gateway | deployed |
| Worker | HEAVEN (target) | pending deploy |

---

## NEXT: wrangler login

Run this ONCE — it will open GitHub OAuth and authenticate to NOIZY.ai account:

```bash
WRANGLER_HOME=$HOME/.wrangler wrangler login
```

When prompted to select account → choose **NOIZY.ai** (`5ba03939...`)

After login, deploy HEAVEN worker:

```bash
cd ~/.gemini/antigravity/scratch/noizy-workers/claude-proxy
wrangler secret put ANTHROPIC_API_KEY
wrangler deploy
```
