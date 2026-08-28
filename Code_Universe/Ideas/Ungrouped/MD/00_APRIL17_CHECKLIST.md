# APRIL 17, 2026 — BINDING DEPLOYMENT CHECKLIST

**Founder**: Robert Stephen Plowman (RSP_001)
**Date**: Friday, April 17, 2026
**Mission**: Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic.
**Artifact root**: `/Users/m2ultra/NOIZYANTHROPIC/ops/april-17/`

---

## GROUND TRUTH (verified 2026-04-15 via `wrangler`)

- **Canonical CF account**: `5f36aa9795348ea681d0b21910dfc82a` (labeled "NOIZYFISH" in CF dashboard — naming drift, ID is correct). OAuth via `rsp@noizy.ai`.
- **Canonical consent DB**: `noizy-prod` (`cd6cae46-e5cd-42b6-a97a-5d0e576c1c2a`). Holds `actors`, `consent_tokens`, `consent_events`, `never_clauses`, `receipts`.
- **Canonical consent worker**: `noizy-app` (v19.0.0, at `noizy-app.rsp-5f3.workers.dev`). Binds `noizy-prod` as `DB_PROD`. Owns `ConsentWorkflow` + `KV_CONSENT` + `consent-lifecycle`.
- **`heaven` worker (v18)**: API gateway / signaling shell. Its `/health` display string says `database:"gabriel_db"` but its `DB_REPAIRS` binding points at `noizy-prod` (naming drift in wrangler.toml, not a data issue). Retained but NOT the consent kernel.
- **`consent_tokens` schema**: uses column `status` (values: `active`/`suspended`/`revoked`/`expired`). Do NOT write SQL against `is_active` for this table.

## BLOCKING DATA-INTEGRITY BLOCKERS (must fix before April 17 11:00 deploy)

These are NOT infrastructure — the infra is live. These are missing rows/columns in `noizy-prod`:

- [ ] **RSP_001 `actors.public_key` = NULL** → generate Ed25519 (or RSA-4096) keypair, store pub, keep priv in CF secret. Without this the founding actor has no cryptographic root.
- [ ] **RSP_001 `actors.voice_dna_hash` = NULL** → compute hash of RSP_001 voice master, store. Without this synthesis requests can't be cryptographically tied to actor identity.
- [ ] **All 3 RSP_001 consent tokens have `signature = NULL`** → sign each with RSP_001 private key (once issued). Unsigned tokens cannot survive a challenge.
- [ ] **All 3 RSP_001 consent tokens have `expires_at = NULL`** → set expiry per mission doctrine (time-limited is in the Mission statement). Pick a window (90d? 1yr?).
- [ ] **All 3 tokens have `split_actor=75, split_platform=25`** → conflicts with 85% founding-actor floor recorded in project doctrine. Either update tokens to split_actor=85 OR resolve the doctrine discrepancy with RSP.

## BLOCKING PRE-LAUNCH — MACHINE STATE

- [ ] **Fork exhaustion on GOD.local resolved**
  - Run: `ulimit -u` (should be >= 2784)
  - Run: `ps aux | wc -l` (should be well under ulimit)
  - Kill any leaked Claude Code sessions, stuck MCP servers, lingering wrangler dev processes
  - Confirm `brew` runs without `fork: resource temporarily unavailable`

## BLOCKING PRE-LAUNCH — TOOLING

- [ ] **Patch `consent-audit` skill** — its SQL checks reference `is_active` on `consent_tokens`. Update to `status IN ('active')`. Without this the gate runs green against broken tokens.

---

## T-24 HOURS (April 16, morning → evening)

### T-24h Security hardening
- [ ] Rotate `NOIZY_API_KEY` in Cloudflare secrets (`wrangler secret put NOIZY_API_KEY`)
- [ ] Grep repos for hardcoded keys: `grep -rn "sk-ant-\|NOIZY_API_KEY\s*=" --include="*.js" --include="*.ts"`
- [ ] Audit `.env` files not committed: `git log --all -- '.env' '*.env'`
- [ ] Enable Cloudflare WAF on canonical worker (`npx wrangler ...` — see 01_waf_config.md)
- [ ] Set rate limit to 60 req/min/IP

### T-18h Audit gates (both MUST pass)
- [ ] Run `/consent-audit` skill against canonical worker
- [ ] Run `/empire-status` skill (9 Never Clauses active, 0 violations, ledger intact)
- [ ] Verify D1 ledger append-only: attempt `UPDATE noizy_ledger SET ...` — must fail or be denied

### T-12h Provenance & archival
- [ ] Archive RSP_001 Voice DNA to OAIS/PREMIS layer
- [ ] Generate founding C2PA manifest (`node 03_c2pa_founding.js`)
- [ ] Sign founding manifest with production key; verify signature

### T-6h Deployment rehearsal
- [ ] Run deploy dry-run: `bash 04_deploy_dryrun.sh`
- [ ] Load test: `k6 run 05_loadtest.js` — confirm <1% error rate at 1000 req/min
- [ ] Rollback rehearsal: `bash 06_rollback.sh --dry-run` — confirm <5min restore
- [ ] Final consent audit re-run — must be 9/9 clean

---

## APRIL 17 — HOUR-BY-HOUR

### 09:00 — Sync
- [ ] Check GOD.local state (fork count, disk, CPU)
- [ ] `curl https://heaven.rsp-5f3.workers.dev/health` (and noizy-app equivalent) — both 200
- [ ] Review overnight ledger for unexpected events
- [ ] Confirm Slack webhook receiving test alert

### 10:00 — Final freeze
- [ ] `git status` clean on canonical repo; tag `v19-prelaunch` or `v18-prelaunch`
- [ ] Snapshot D1: `wrangler d1 export <db> --output=backups/april17-t0.sql`
- [ ] Snapshot KV: export each namespace (script in 07_snapshot.sh)
- [ ] Publish public consent policy at noizy.ai/consent (`wrangler pages deploy`)

### 11:00 — Deploy
- [ ] `wrangler deploy --env production` on canonical consent worker
- [ ] Wait for propagation (~30s)
- [ ] Smoke test 6 endpoints: health, actors, tokens, never-clauses, ledger, kpi/trust
- [ ] If ANY fails: `bash 06_rollback.sh` (no hesitation; rehearsed)

### 12:00 — Thesis proof (STEP 24)
- [ ] Issue first **external** creator consent token (not RSP_001)
- [ ] External creator makes one synth request with that token
- [ ] Verify: request succeeds, ledger logs it, C2PA manifest attached to response
- [ ] This is the moment. Not you using your own kernel — a real creator using it.

### 13:00 — Seal
- [ ] Log founding event to `noizy_ledger` with C2PA signature
- [ ] Publish Ledger tx hash publicly (Twitter/site/wherever)
- [ ] Send ceremonial email from `rsp@noizy.ai` announcing live status

### 14:00 — Watch
- [ ] Monitor for 60min post-launch
- [ ] Keep rollback ready; document any anomalies
- [ ] If anomaly: triage → rollback if consent integrity threatened, otherwise hotfix

### 15:00 — Record
- [ ] Update MEMORY.md with launch outcome
- [ ] Append session to DAZEFLOW log via Lucy MCP
- [ ] Close out this checklist file with final status + timestamps

---

## ABORT CRITERIA (at any stage)

If ANY of these is true, STOP and rollback:
1. Any Never Clause returns `is_active = 0`
2. Any `NEVER_CLAUSE_VIOLATION` event appears in ledger
3. Consent token created without valid actor reference
4. Ledger UPDATE/DELETE succeeds (not just denied — the fact that it ran is the violation)
5. Health endpoint returns non-200 for >30s continuous

## ROLLBACK COMMAND

`bash /Users/m2ultra/NOIZYANTHROPIC/ops/april-17/06_rollback.sh`

Target: restore within 5 minutes. Rehearsed at T-6h.

---

*Rob — you built this over 2+ years. It saved your life. Today it starts saving others'.*
*— Claude, April 15, 2026 (T-48h)*
