# NEXT 25 MOVES — NOIZY.AI

**Compiled:** 2026-04-15 · **Target ship date:** 2026-04-17 (T-2 days)
**Rule:** do them in order. Each move has a single owner, a single command or artifact, and a definition of done.

---

## 🔴 UNBLOCKERS (1–5) — do today

### 1. Complete `noizy.ai` NS delegation → HEAVEN CF account
- **Action:** Point GoDaddy NS for `noizy.ai` to `naomi.ns.cloudflare.com` + `renan.ns.cloudflare.com` under account `5f36aa9795348ea681d0b21910dfc82a`.
- **Done when:** `dig NS noizy.ai +short` returns the HEAVEN nameservers, zone shows **Active** in CF dashboard.
- **Unblocks:** moves 2, 3, 4, 11, 12.

### 2. Activate Cloudflare Email Routing on `noizy.ai`
- **Action:** Dash → Email → enable routing; add catch-all `*@noizy.ai` → `rsplowman@icloud.com`; verify `rsp@noizy.ai`.
- **Done when:** Test email to `rsp@noizy.ai` lands in iCloud within 60s.

### 3. Bind `heaven.noizy.ai` custom route to Heaven Worker
- **Action:** `wrangler deploy` with `routes = ["heaven.noizy.ai/*"]` in `wrangler.toml`.
- **Done when:** `curl https://heaven.noizy.ai/health` returns `{success: true}`.

### 4. Bind `consent.noizy.ai` + `cb01.noizy.ai` routes
- **Action:** Same pattern as #3 for Consent Gateway + CB01 Router workers.
- **Done when:** Both `/health` endpoints return 200.

### 5. Upgrade Wrangler 4.53.0 → 4.81.1
- **Action:** `npm i -g wrangler@latest` then `wrangler --version` to confirm.
- **Done when:** All local deploy scripts still pass smoke tests.

---

## 🟠 CONSENT KERNEL LOCKDOWN (6–10) — the product itself

### 6. Run the 9-point Never Clause audit
- **Action:** Invoke `consent-audit` skill against live `gabriel_db`.
- **Done when:** All 9 clauses return enforced · ledger entry written.

### 7. Seed RSP_001 founding consent token
- **Action:** Confirm token exists in `hvs_consent_tokens` for actor `RSP_001`, scope `founding`, `is_active=1`.
- **Done when:** `SELECT * FROM hvs_consent_tokens WHERE actor_id='RSP_001' AND is_active=1` returns 1 row.

### 8. Wire Kill Switch to production
- **Action:** Expose `/kill-switch` endpoint on Heaven; require `X-NOIZY-Key` + actor signature.
- **Done when:** Test revocation of a sandbox token flips `is_active=0` in D1 + fires Slack webhook.

### 9. C2PA sign one synth response end-to-end
- **Action:** Run one voice synth through the pipeline; confirm manifest is embedded + verifiable.
- **Done when:** `c2pa verify output.wav` returns valid manifest with `rsp@noizy.ai` as signer.

### 10. Ledger append test (idempotent)
- **Action:** Issue 3 identical POSTs to `/synth`; confirm ledger has 3 distinct entries, no collisions.
- **Done when:** `SELECT COUNT(*) FROM noizy_ledger WHERE request_id LIKE 'test-%'` = 3.

---

## 🟡 PROOF LAYER (11–15) — the provenance story

### 11. Publish `heaven.rsp-5f3.workers.dev` under `heaven.noizy.ai`
- **Action:** Once #3 is done, update all docs/clients to new URL; keep workers.dev as fallback.
- **Done when:** `grep -r "rsp-5f3.workers.dev" --include="*.md"` shows no stale refs in public docs.

### 12. Deploy landing page to `noizy.ai` root
- **Action:** Publish `landing/` via `wrangler pages deploy`; wire `noizy.ai` apex.
- **Done when:** `https://noizy.ai` serves the landing page with SSL.

### 13. Lock the 3-layer watermark
- **Action:** Confirm acoustic + perceptual + cryptographic layers all engage on synth output.
- **Done when:** `dreamchamber-proof` skill passes all 3 layer checks.

### 14. Archive one Voice DNA sample to OAIS/PREMIS
- **Action:** Full pipeline: capture → encrypt → PREMIS metadata → cold store.
- **Done when:** Retrieval test from archive returns byte-identical file + valid manifest.

### 15. 100-year verification dry run
- **Action:** Verify a sample using only archival keys (not live keys) — simulate future recovery.
- **Done when:** Verification succeeds with archive-only key material.

---

## 🟢 DEPLOY & OBSERVE (16–20)

### 16. Slack webhook for CRITICAL events
- **Action:** Add `WEBHOOK_URL` secret to Heaven; fire on kill-switch + Never-Clause violation.
- **Done when:** Test revocation posts to #noizy-alerts within 5s.

### 17. Health dashboard online
- **Action:** Deploy the 15-service health matrix (from master bible §13).
- **Done when:** Dashboard shows all 15 services with live status.

### 18. `deploy.sh` smoke tests green across all workers
- **Action:** Run `bash deploy.sh` in NOIZYLAB root; fix any red.
- **Done when:** Exit code 0 on a clean run.

### 19. Backup `gabriel_db` to R2
- **Action:** `wrangler d1 export gabriel_db --remote` → upload to R2 bucket with datestamp.
- **Done when:** Backup file exists in R2 + restore dry-run succeeds against sandbox DB.

### 20. Rotate `NOIZY_API_KEY`
- **Action:** Generate new key · update CF Worker secrets · update `.env` · invalidate old key.
- **Done when:** Old key returns 401 · new key returns 200 on `/health`.

---

## 🔵 LAUNCH PREP (21–25) — for April 17

### 21. One-page public brief at `noizy.ai/mission`
- **Action:** Publish the Mission + Never Clauses as a static page.
- **Done when:** `curl https://noizy.ai/mission` returns the page.

### 22. DMCA / enforcement template ready
- **Action:** Finalize template with `rsp@noizy.ai` as notice address; store in `contracts/enforcement/`.
- **Done when:** Template reviewed + committed.

### 23. One sample artist onboarding end-to-end
- **Action:** Create a test actor, issue token, run one synth, revoke, verify full ledger trail.
- **Done when:** All 5 steps appear in `noizy_ledger` with correct actor + timestamps.

### 24. Record the 396 Hz activation — April 17 session prep
- **Action:** Pre-stage DreamChamber :7777 · confirm mic chain · dry-run narrative arc.
- **Done when:** 30-min arc runs clean start-to-finish in rehearsal.

### 25. Ship announcement — drafted, held, ready to send
- **Action:** Draft the April 17 announcement (Slack + email + landing banner). Do not send.
- **Done when:** Draft is written + reviewed; ready to publish with one click on the 17th.

---

## EXECUTION LAW

- One move at a time. Mark done in this file.
- Any blocker → note it under the move, skip, come back.
- Every completed move that touches production → ledger entry.
- No move ships without a smoke test.

**If a move fails:** fix the root cause, don't move on. The empire is built on no-fake-passes.
