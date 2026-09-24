# NOIZY Infrastructure Upgrade — April 10, 2026
## Built by Claude (Co-Architect) for Robert Stephen Plowman

---

## WHAT WAS DONE

### 1. Full MCP Audit (13 connectors tested)
- 12 of 13 LIVE and working
- Stripe needs re-authentication (only broken connector)
- New: noizy-gemma3 MCP confirmed online (GOD.local bridge)

### 2. D1 Voice Equity Registry Schema Created
**File:** `sql/schema.sql` — 14 tables, 30 indexes, seed data
- `actors` — Human voice owners with union tiers and royalty floors
- `never_clauses` — Immovable prohibitions per actor (7 built-in types + custom)
- `voice_dna` — Encrypted spectral fingerprints with R2 pointers and C2PA
- `descendants` — Synthetic voice models with drift tracking
- `consent_tokens` — Explicit, enforceable, revocable permissions
- `licensees` — Organizations licensed to use voice assets
- `licenses` — Commercial agreements with 75% minimum royalty floor
- `synth_requests` — Every synthesis attempt (auditable, Never Clause enforced)
- `noizy_ledger` — Append-only financial record (NEVER UPDATE/DELETE)
- `rate_table` — Pricing per synthesis type
- `estates` — Posthumous voice rights (100-year OAIS/PREMIS)
- `union_tiers` — Artist classification tiers
- `audit_log` — Every system action (append-only)
- `gap_solver_entries` — GORUNFREE absence intelligence

**Seed data:** RSP_001 as Founding Actor, 4 default Never Clauses, 4 union tiers, 4 rate table entries.

### 3. KV Namespaces Created
- FEATURE_FLAGS: `bf944d9a307249289565144a569a1de8`
- GAP_SOLVER: `f481eeaa1a724c45a510674273f463d1`
- ⚠️ NOTE: Created on Fishmusicinc account — need to recreate on rsp@noizy.ai after wrangler login

### 4. wrangler.toml Upgraded to v18.0.0
- Added `[ai]` binding — Workers AI for edge inference
- Added `[[r2_buckets]]` VOICE_VAULT binding (ready for R2 activation)
- Version bumped 17.9.0 → 18.0.0
- Added VOICE_VAULT_BUCKET env var

### 5. GOD.local System Status Captured
- macOS 15.7.6 on M2 Ultra
- Node v24.13.1
- Wrangler 4.53.0 (update available: 4.81.1)
- Whisper installed (/opt/homebrew/bin/whisper)
- Voice Bridge: NOT RUNNING
- 15 Ollama models (10 custom NOIZY agents)
- Wrangler: NOT AUTHENTICATED — needs `wrangler login`

---

## CRITICAL: DUAL CLOUDFLARE ACCOUNT ISSUE

There are TWO Cloudflare accounts in play:

| | Cowork MCP Account | wrangler.toml Account |
|---|---|---|
| **Name** | Fishmusicinc | rsp@noizy.ai |
| **Account ID** | `2446d788cc4280f5ea22a9948410c355` | `5f36aa9795348ea681d0b21910dfc82a` |
| **D1 gabriel_db** | `68ac0f08-c4ee-43ff-9480-366406d41b37` (empty) | `a31d68e2-f2d4-4203-a803-8039fdff31cb` (canonical) |
| **Workers** | 1 ("deploy") | Heaven v17.9.0, noizy-landing |
| **KV** | GABRIEL_VOICE, GABRIEL_KV | GABRIEL_VOICE, GABRIEL_KV (different IDs) |

### Resolution Options
1. **Reconnect Cloudflare MCP to rsp@noizy.ai account** — keeps everything canonical
2. **Migrate everything to Fishmusicinc** — requires re-deploying all workers
3. **Consolidate into one account** — merge and close the other

**Recommended:** Option 1. The rsp@noizy.ai account has all the production resources.

---

## BLOCKERS REQUIRING YOUR ACTION

| # | Action | Where | Why |
|---|--------|-------|-----|
| 1 | Run `wrangler login` on GOD.local | Terminal | Wrangler is not authenticated — can't deploy or migrate schema |
| 2 | Run `npm update wrangler` | Terminal | 4.53.0 → 4.81.1 available |
| 3 | Enable R2 | Cloudflare Dashboard → R2 tab | Required before creating Voice Vault bucket |
| 4 | Reconnect Stripe | Cowork settings → Connectors | Auth expired |
| 5 | Reconnect Cloudflare MCP to rsp@noizy.ai | Cowork settings → Connectors | Currently connected to wrong account |

## AFTER BLOCKERS ARE CLEARED

```bash
# 1. Authenticate wrangler
wrangler login

# 2. Update wrangler
npm install -g wrangler@latest

# 3. Create KV namespaces on correct account
npx wrangler kv namespace create "FEATURE_FLAGS"
npx wrangler kv namespace create "GAP_SOLVER"
# → Update IDs in wrangler.toml

# 4. Run D1 schema migration
npx wrangler d1 execute gabriel_db --remote --file=sql/schema.sql

# 5. Run seed data
npx wrangler d1 execute gabriel_db --remote --file=sql/seed.sql

# 6. Create R2 bucket (after R2 is enabled)
npx wrangler r2 bucket create noizy-voice-vault

# 7. Deploy Heaven v18.0.0
npx wrangler deploy

# 8. Smoke test
bash scripts/smoke-test.sh
```

---

*"Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."*
