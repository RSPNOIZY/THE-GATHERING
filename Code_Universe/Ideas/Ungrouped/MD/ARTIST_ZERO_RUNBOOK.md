# Artist Zero · Runbook

> The ritual by which the first artist outside RSP_001 passes through the empire. Framed as a Contact Sequence — Anticipation → Recognition → Possibility → Flow → Elevation — mapped onto the HEAVEN consent kernel surface.

This runbook is the sacred companion to `scripts/artist-zero-walkthrough.sh`. The script exercises every seam; this doc explains what each seam means and what to expect.

**Who is Artist Zero?** A synthetic test artist we create every time this runs. Unique ID per run (`ARTIST_ZERO_<timestamp>`), never collides with real artists, always revocable, always auditable. Treat it as the **first rehearsal** — a no-risk way to prove every doctrine before a real human steps in.

---

## Pre-flight

1. `.env` has `NOIZY_API_KEY=<value>` (same key set as `wrangler secret put NOIZY_API_KEY` on `heaven`).
2. HEAVEN is responding (`curl heaven.rsp-5f3.workers.dev/health`).
3. You're on `copilot/fix-repo-issues` or a branch with this runbook checked in.

Run:

```bash
bash scripts/artist-zero-walkthrough.sh
# or dry-run to see the plan without hitting HEAVEN:
bash scripts/artist-zero-walkthrough.sh --dry-run
```

Writes a full log to `reports/artist-zero-<timestamp>.log`.

---

## The 9 stages of Artist Zero's journey

### 0 · Preflight

HEAVEN must be `"status":"LIVE"` with a known version. If this fails, nothing else runs.

### 1 · Recognition (the door opens)

`POST /api/v1/actors` registers a human actor. Fields used: `actor_id`, `full_name`, `email`, `country`, `actor_type=human`, `tier=artist`.

**What this proves:** an actor exists in `hvs_actors`. Every subsequent write ties back to this actor_id.

### 2 · Anticipation (the law is shown)

`GET /api/v1/actors/:id/never-clauses` lists the 9 Never Clauses in force: 6 personal (inherited from the founding actor's doctrine) + 3 system (empire-wide prohibitions).

**What this proves:** every artist sees the law before they're asked to consent to anything. No hidden prohibitions; no surprise blocks.

### 3 · Possibility (the voice is captured)

`POST /api/v1/actors/:id/voice-dna` enrolls a Voice DNA spectral fingerprint. In this walkthrough we use a synthetic test vector so we can run the ritual without actually recording audio.

**What this proves:** `hvs_voice_dna` accepts enrollments; the Voice Vault is functional.

### 4 · Descendant (the model takes form)

`POST /api/v1/descendants` registers a synthetic voice model tied to the actor (`xtts-v2` in this example). Descendants are the artifacts that would be created by training on Voice DNA.

**What this proves:** `hvs_descendants` table records the model provenance. Every synth later ties to a descendant_id.

### 5 · Flow (consent becomes executable)

`POST /api/v1/consent-tokens` issues a **scoped, time-bound, revocable** token:

- `scope=synth-audio-nc`
- `territory=CA`
- `use_categories=[demo, editorial]`
- `expires_in_hours=24`
- `compensation_tier=artist`

**What this proves:** tokens are the currency of authorized synthesis. Nothing moves without one.

### 6 · Elevation (the first synthesis)

`POST /api/v1/synth-requests` with the token. HEAVEN checks:

- Token is valid + not revoked + not expired
- Use category is inside the token's allowed list
- Territory matches
- All 9 Never Clauses pass for this actor + descendant + request combination

On success: returns a `request_id` and writes to `hvs_synth_requests`. Then we pull C2PA credentials via `GET /api/v1/synth-requests/:id/c2pa`.

**What this proves:** the kernel is alive. Consent-as-executable-code becomes real — a synth request with a valid token produces a ledger-logged, C2PA-attached synthesis.

### 7 · Compensation (the economics land)

`POST /api/v1/licenses` creates a license record with `royalty_pct_artist=75` / `royalty_pct_platform=25`. HEAVEN enforces this ratio server-side (the 75% floor is doctrine).

**What this proves:** the 75/25 split isn't a policy document — it's a column constraint in `hvs_licenses`.

### 8 · Revocation (the Kill Switch)

`POST /api/v1/consent-tokens/:id/revoke` fires the Kill Switch. Immediately after, we **retry the same synth request** with the now-revoked token and expect a 403 or `revoked` response.

**What this proves:** revocation is sacred. A revoked token is dead instantly — not eventually.

### 9 · Audit (the ledger remembers)

`GET /api/v1/ledger?limit=50` pulls the recent ledger. We count entries containing our `ARTIST_ID`. Should be ≥ 3 (actor-create, token-issued, token-revoked at minimum — most runs will show 5-7).

**What this proves:** every action left a trace. The ledger is append-only and the empire's memory is intact.

### After · Empire totals

We fetch `GET /gabriel` and confirm `actors`, `consent_tokens`, `ledger_events`, `descendants`, `voice_dna_records` all incremented. The empire has grown by one walkthrough's worth.

---

## What success looks like (expected output)

A clean run shows (approximately):

```
━━━ 0/9 · Preflight ━━━
  ✓ HEAVEN is LIVE (v18.0.0)

━━━ 1/9 · Recognition — register artist with founding-actor protections ━━━
  ✓ Actor registered: ARTIST_ZERO_20260417T222930Z

━━━ 2/9 · Anticipation — show Never Clauses in force for this artist ━━━
  ✓ Never Clauses returned: 9

━━━ 3/9 · Possibility — enroll synthetic Voice DNA (placeholder spectral) ━━━
  ✓ Voice DNA enrolled (synthetic)

━━━ 4/9 · Descendant — register a synthetic voice model ━━━
  ✓ Descendant registered: ArtistZero-v1-...

━━━ 5/9 · Flow — issue time-bound territory-scoped consent token ━━━
  ✓ Consent token issued: tok_... (24h, CA, demo+editorial)

━━━ 6/9 · Elevation — synth request (expect Never Clause pass) ━━━
  ✓ Synth request accepted: req_... (passed all 9 Never Clauses)
  ✓ C2PA manifest attached

━━━ 7/9 · Compensation — issue license with 75/25 split ━━━
  ✓ License issued (75/25 split enforced)

━━━ 8/9 · Revocation — Kill Switch drill ━━━
  ✓ Token revoked: tok_...
  ✓ Post-revoke synth correctly rejected

━━━ 9/9 · Audit — verify ledger has every event ━━━
  ✓ Ledger entries matching ARTIST_ZERO_...: 6
```

---

## Interpreting failures

- **Step 1 fails** — HEAVEN's `POST /api/v1/actors` is rejecting our body shape. Compare with `src/index.js` schema.
- **Step 2 returns 0 clauses** — `hvs_never_clauses` hasn't been seeded or the actor lookup failed. Run `npx wrangler d1 execute gabriel_db --remote --file seed.sql`.
- **Step 5 returns no token_id** — the consent-tokens endpoint is returning a shape we don't parse. Check the log, adjust the jq path.
- **Step 6 rejected unexpectedly** — a Never Clause is blocking. Read the error body; this is the system working correctly. Clause inspection via step 2.
- **Step 8 "Post-revoke retry unexpected"** — either the revoke didn't propagate (cache?), or the synth endpoint isn't re-checking the token. This is a P0 bug; block launch.

---

## Why we do this

The founding doctrine says: _"Explicit consent is not optional. It is the product."_

Running Artist Zero is how you prove the product works on a human other than yourself. Every table gets exercised. Every doctrine gets tested. Every rail gets driven. If Artist Zero can't pass, a real artist certainly can't.

This is the **rehearsal before opening night**. Run it the day of every launch, and any time you change the consent kernel.

---

## Promote to real human

When Artist Zero passes cleanly three times in a row, replace the synthetic vectors with:

- a real Voice DNA capture (30s of U87 → Apollo → LUCY-assisted enrollment)
- a real artist (someone you trust — a collaborator, a friend, POPS if he's amenable)
- a real use case (not "demo" — an actual commission or live performance)

Same runbook, real stakes. That's launch.

---

_Consent as executable code · Provenance as default · Revocation as sacred · Compensation as automatic · 396 Hz._
