# HEALING AUDIT — ROUND 2 — 2026-04-22

**Operator:** RSP_001 via GABRIEL
**Follows:** `2026-04-22-fix-all.md`
**Scope:** COMMIT · DEPLOY MCP · CF SWEEP REMAINING · SCRAPE MORE · NOIZY.AI APEX

---

## 1. COMMIT (status)

LUCY's auto-git toolchain is live — last auto-sync **12:57:09** local, branch `copilot/fix-repo-issues`, remote `RSPNOIZY/NOIZYANTHROPIC`. Per `auto-git-toolchain.md`:

- **LUCY commits. GABRIEL never commits directly.**
- All my edits to tracked files (noizybeast extension, noizyproof package + c2pa, root package-lock, .mcp.json, ops/mcp-health.sh, repos/noizy-heaven/src/index.ts, _INDEX/tree.txt) were **already absorbed into HEAD by the auto-sync cadence**.
- Remote HEAD matches local HEAD. No push required from me.
- New untracked artifact: `_healing_audits/2026-04-22-fix-all.md` + this file — will land on the next LUCY cycle (~10–30 min).

`git status` at time of writing shows 4 files modified by OTHER processes (not me):

```
.claude/memcells/dazeflow-2026-04-22.md
.github/templates/cloudflare-worker/src/index.ts
.github/templates/react-consent/src/ConsentGate.tsx
cloudflare/workers/mc96-follower/src/index.js
```

These are outside my scope — LUCY will commit them on her cycle.

---

## 2. DEPLOY MCP — wrangler deploy + smoke test for noizy-landing

**Goal:** Get `https://noizy.ai/` returning 200 instead of timing out.

### Preconditions (one-time)

```bash
# 1. Confirm CLOUDFLARE_API_TOKEN is set in your shell (not this session)
echo "${CLOUDFLARE_API_TOKEN:0:8}…"   # should show 8 chars, not empty

# 2. Confirm the canonical account is active
cd ~/NOIZYANTHROPIC/landing/noizy
grep account_id wrangler.toml
# Expected: account_id = "5f36aa9795348ea681d0b21910dfc82a"
```

### Deploy

```bash
cd ~/NOIZYANTHROPIC/landing/noizy
npx wrangler deploy
```

Expected output includes:

```
Uploaded noizy-landing (...)
Deployed noizy-landing triggers (...)
  https://noizy-landing.rsp-5f3.workers.dev
  noizy.ai/*  (route, zone noizy.ai)
  www.noizy.ai (custom_domain, zone noizy.ai)
```

If `www.noizy.ai` custom_domain fails with "zone not on account" → the domain is not yet registered to the canonical account. Resolve via the APEX section below.

### Smoke test (run after deploy returns)

```bash
# 1. Worker.dev — ground truth, should already be 200
curl -sS -m 10 -o /dev/null -w "workers.dev: %{http_code}\n" \
  https://noizy-landing.rsp-5f3.workers.dev/

# 2. Apex — the actual fix we're verifying
curl -sS -m 10 -o /dev/null -w "apex: %{http_code}\n" https://noizy.ai/

# 3. www subdomain
curl -sS -m 10 -o /dev/null -w "www: %{http_code}\n" https://www.noizy.ai/

# 4. Headers check — confirm the Worker is the one answering
curl -sS -m 10 -I https://noizy.ai/ | grep -iE "x-powered-by|server|cf-ray"
# Expected to include: x-powered-by: NOIZY/RSP_001

# 5. Security headers
curl -sS -m 10 -I https://noizy.ai/ | grep -iE "x-content-type-options|x-frame-options|strict-transport-security"
```

### Rollback (if smoke test fails)

```bash
# List recent deployments
npx wrangler deployments list --name noizy-landing | head -10

# Rollback to previous version (replace VERSION_ID)
npx wrangler rollback --name noizy-landing --version-id <PREV_VERSION>
```

---

## 3. CF SWEEP — 15 remaining CF-account-ID references

**Canonical:** `5f36aa9795348ea681d0b21910dfc82a` (rsp@noizy.ai)
**Retired:** `2446d788cc4280f5ea22a9948410c355` (Fishmusicinc — DO NOT DEPLOY)

### Split: PATCHED this session (4 files)

| File | Line | Change |
|---|---|---|
| `repos/the-gathering/gabriel/projects/noizylab-tunnel/deploy-api.sh` | 7 | Fallback account ID canonical |
| `repos/the-gathering/gabriel/workers/deploy-api.sh` | 7 | Fallback account ID canonical |
| `mc96/docs/runbooks/deploy-heaven.md` | 6 | Account ID canonical (runbook was misleading) |
| `docs/ai-prompts/SUPERSONIC_GITKRAKEN_PROMPT.md` | 24 | Account ID canonical (AI prompt would mislead agents) |

Each keeps a parenthetical note referencing the retired ID for historical context.

### Split: LEAVE AS-IS (documented historical/safety context)

| File | Role | Why leave |
|---|---|---|
| `repos/noizy-heaven/claude.rules.md:15` | Doc | Historical note — labeled as "Fishmusicinc" explicitly |
| `repos/noizy-infra/scripts/deploy-all.sh:88` | Guard | Actively blocks deploys that reference retired ID — safety layer |
| `repos/the-gathering/brands/FISHMUSICINC/README.md:27,30` | Doc | Brand-identity history; line 30 explicitly states "never deploy to this account" |
| `tools/CODEMASTER/turbo-scripts/CATALOG.md:102` | Doc | Warning already present: "conflicts with canonical …" |
| `.claude/rules/turbo-scripts.md:49` | Rule | Same warning, enshrined in rules |
| `docs/NOIZY_PROJECT_INSTRUCTIONS_FINAL.md:216` | Doc | Marked RETIRED |
| `docs/audits/DNS_INFRA_AUDIT_20260403.md:9` | Audit | Historical audit snapshot (2026-04-03) |
| `docs/INFRASTRUCTURE-UPGRADE-2026-04-10.md:61` | Migration log | Migration evidence |
| `docs/INFRASTRUCTURE_MAP_2026-04-21.md:100` | Map | Labeled "DO NOT DEPLOY" |
| `DIRECTORY/CLOUDFLARE_ALIGNMENT/tools/verify_token.sh:19` | Tool | Verifies tokens across BOTH accounts intentionally |
| `DIRECTORY/CLOUDFLARE_ALIGNMENT/INVENTORY.md:4` | Inventory | States "where storage lives today" — time-pinned |
| `DIRECTORY/CLOUDFLARE_ALIGNMENT/PHASE_0_token.md:56,131` | Runbook | Phase-0 token creation flow — needs both IDs |
| `NOIZY_AI_MASTER_BIBLE.md:134` | Reference | Comparison table old-vs-new |

### Split: DUPLICATES (can delete when `noizy-workspace` is pruned)

| File | Duplicate of |
|---|---|
| `noizy-workspace/THE-GATHERING/gabriel/projects/noizylab-tunnel/deploy-api.sh:7` | `repos/the-gathering/...` (patched above) |
| `noizy-workspace/THE-GATHERING/gabriel/workers/deploy-api.sh:7` | `repos/the-gathering/...` (patched above) |
| `noizy-workspace/THE-GATHERING/PROJECTS/GABRIEL/archive/downloads-backup/...` | Archive snapshots — safe to leave |

Leave duplicates until a `noizy-workspace` prune is scheduled. Patching them now risks confusing merge-conflicts with whatever is canonical.

### Result

All active deploy paths now default to the canonical account. All historical/audit docs preserved with their context. The retired `2446d788…` ID remains only in places where its presence is deliberate (warnings, audits, migration evidence, safety guards).

---

## 4. SCRAPE MORE — noizy-prod D1 data-integrity scan

**Blocked from this session:** CLOUDFLARE_API_TOKEN not in shell env. Produce the ready-to-run probe queries.

### The 5 data-integrity blockers (per April 17 ground-truth doc)

1. Missing `public_key` on RSP_001
2. Missing `voice_dna_hash` on RSP_001
3. 3 unsigned consent tokens (signature = NULL)
4. 3 NULL `expires_at` values on issued tokens
5. Royalty doctrine clash (85% floor on RSP_001 vs 75% standard_actor)

### Ready-to-run probes (paste into your shell)

```bash
cd ~/NOIZYANTHROPIC/repos/noizy-heaven

# Probe 1 — RSP_001 cryptographic identity fields
npx wrangler d1 execute noizy-prod --remote --command \
  "SELECT actor_id, display_name,
          CASE WHEN public_key IS NULL OR public_key = '' THEN 'MISSING' ELSE 'OK' END  AS pk,
          CASE WHEN voice_dna_hash IS NULL OR voice_dna_hash = '' THEN 'MISSING' ELSE 'OK' END AS vdh
   FROM hvs_actors WHERE actor_id = 'RSP_001';"

# Probe 2 — Unsigned tokens (signature NULL or empty)
npx wrangler d1 execute noizy-prod --remote --command \
  "SELECT token_id, actor_id, scope, issued_at
   FROM hvs_consent_tokens
   WHERE signature IS NULL OR signature = '';"

# Probe 3 — NULL expires_at
npx wrangler d1 execute noizy-prod --remote --command \
  "SELECT token_id, actor_id, scope, issued_at
   FROM hvs_consent_tokens
   WHERE expires_at IS NULL;"

# Probe 4 — Royalty doctrine per actor
npx wrangler d1 execute noizy-prod --remote --command \
  "SELECT actor_id, display_name, royalty_floor_pct, actor_tier
   FROM hvs_actors
   ORDER BY actor_id;"

# Probe 5 — Bonus: Never Clause violations in ledger
npx wrangler d1 execute noizy-prod --remote --command \
  "SELECT COUNT(*) as violations, MAX(created_at) as latest
   FROM noizy_ledger
   WHERE event_type = 'NEVER_CLAUSE_VIOLATION';"
```

Expected GREEN state:
- Probe 1: `pk = OK`, `vdh = OK` for RSP_001
- Probe 2: **0 rows** (no unsigned tokens)
- Probe 3: **0 rows** (all tokens have expiry)
- Probe 4: RSP_001 = 85, all standard actors = 75
- Probe 5: `violations = 0`

Any RED result is a block on the consent kernel going live.

### Related check — `0003_repairs.sql` migration status

```bash
npx wrangler d1 execute noizy-prod --remote --command \
  "SELECT name FROM sqlite_master WHERE type='table' AND name IN ('repair_tickets','system_alerts');"
```

Expect 2 rows. If 0 or 1, apply:

```bash
cd ~/NOIZYANTHROPIC/repos/noizy-heaven
npx wrangler d1 execute noizy-prod --remote --file=db/migrations/0003_repairs.sql
```

---

## 5. NOIZY.AI APEX — 3-click CF dashboard path

**Situation:** `landing/noizy/wrangler.toml` has the correct route binding for `noizy.ai/*` + `www.noizy.ai` custom_domain. BUT `www.noizy.ai` doesn't resolve — meaning the Worker was never deployed to that route, OR the domain is on the retired Fishmusicinc account.

### Path A — Domain already on canonical `rsp@noizy.ai` account

1. **Click 1:** `https://dash.cloudflare.com/5f36aa9795348ea681d0b21910dfc82a/noizy.ai/dns/records` — confirm the apex `A` records point to `192.0.2.1` (Cloudflare's universal placeholder) or to existing proxied records. The Worker Route binding makes the apex answer regardless of origin record. If apex has no record, add an `AAAA` record to `100::` (placeholder) proxied = orange cloud.
2. **Click 2:** `https://dash.cloudflare.com/5f36aa9795348ea681d0b21910dfc82a/workers/overview` → select `noizy-landing` → **Triggers** tab → confirm `noizy.ai/*` route is bound. If missing, **Add route** → pattern `noizy.ai/*`, zone `noizy.ai`.
3. **Click 3:** Same `noizy-landing` Worker → **Triggers** → **Custom Domains** → **Add Custom Domain** → `www.noizy.ai`. Cloudflare auto-creates the DNS record + issues the SSL cert. Wait ~60s. Then `curl https://www.noizy.ai/` should return 200.

### Path B — Domain still on retired Fishmusicinc account

This is the CB01 / GoDaddy-exit path. If you open `https://dash.cloudflare.com/` and the `noizy.ai` zone is listed under **Fishmusicinc** not **rsp@noizy.ai**:

1. **Click 1:** In Fishmusicinc dashboard → `noizy.ai` → **Advanced** → **Change account** → select `rsp@noizy.ai`. Cloudflare will issue a zone-move confirmation.
2. **Click 2:** In rsp@noizy.ai inbox → confirm the zone-move email (link).
3. **Click 3:** Once the zone is on the canonical account, run the Path A sequence. The Worker route + Custom Domain will bind.

### Verify the fix

```bash
dig +short noizy.ai A
# Expected: any CF edge IP (104.21.*, 172.67.*, or proxied placeholder)

curl -sS -m 10 -o /dev/null -w "apex: %{http_code}\nheaders: %{header_json}\n" https://noizy.ai/ | head -20
# Expected: apex: 200

curl -sS -m 10 -I https://noizy.ai/ | grep -i "x-powered-by"
# Expected: x-powered-by: NOIZY/RSP_001
```

---

## DELIVERED THIS ROUND

```
4 CF-account-ID drifts patched (active deploy paths now canonical) ·
CF sweep report complete (15 remaining: 13 leave, 2 duplicates queued) ·
noizy-landing deploy + smoke test procedure documented ·
noizy-prod D1 integrity probes documented (ready to paste) ·
APEX 3-click path documented (Path A + Path B) ·
COMMIT already handled by LUCY cadence
```

_Sealed in the NOIZY Origin Record · 2026-04-22 · healing-event (round 2)_
