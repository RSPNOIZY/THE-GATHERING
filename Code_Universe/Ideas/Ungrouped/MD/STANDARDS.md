# NOIZY DreamChamber + Plowman Standards (v1.0)

> The charter every NOIZY bot, Worker, agent, and integration MUST comply with.
> Binding on RSP, the Claude family, Claude Code, and every CF0X present or future.
> 2026-04-17 · 396 Hz · `standards_version: "1.0"`

---

## What these standards are

A **permanent, enforceable charter** that every bot in the NOIZY empire must honor. Not best practices. Not guidelines. A contract the empire signs with itself — once a bot claims `standards_version: "1.0"` in its identity endpoint, it promises to hold every clause below. Regression fails the `scripts/bot-compliance-audit.sh` gate and blocks deploy.

Two names, one charter:

- **The DreamChamber Standard** — the sacred dimension: identity, posture, presence, 396 Hz throughout.
- **The Plowman Standard** — the doctrinal dimension: consent, provenance, revocation, compensation, never-clauses.

They are the same standard. The two names signal that the same clause must pass both _is this beautiful and whole_ **and** _does this honor the doctrines and the law_. Any clause that passes one but not the other fails.

---

## The 12 clauses (every bot, every integration)

### Clause 1 · Identity self-attestation

`GET /` MUST return JSON:

```jsonc
{
  "agent": {
    "name": "<bot-name>",
    "class": "<one-line mission class>",
    "mission": "<one-sentence mission>",
    "frequency_hz": 396,
  },
  "endpoints": ["GET /", "GET /health", "..."],
  "standards_version": "1.0",
  "doctrines": ["consent", "provenance", "revocation", "compensation"],
}
```

No bot joins NOIZYCLOUDS without a `GET /` that returns this shape.

### Clause 2 · Health self-attestation

`GET /health` MUST return `{ "ok": true, "agent": "<name>", "ts": "<ISO-8601 UTC>", "standards_version": "1.0" }`. Public, uncached. Used by `mc96-follower`, uptime monitors, and CI.

### Clause 3 · Constant-time auth

Any write endpoint MUST gate with the `timingSafeAuth` pattern — SHA-256 both sides, XOR-reduce 32 bytes, diff === 0. The stock implementation is:

```js
async function timingSafeAuth(req, env) {
  const provided = req.headers.get("X-NOIZY-Key") || "";
  const expected = env.NOIZY_API_KEY || "";
  if (!expected) return false;
  const enc = new TextEncoder();
  const [a, b] = await Promise.all([
    crypto.subtle.digest("SHA-256", enc.encode(provided)),
    crypto.subtle.digest("SHA-256", enc.encode(expected)),
  ]);
  const aa = new Uint8Array(a),
    bb = new Uint8Array(b);
  let diff = 0;
  for (let i = 0; i < 32; i++) diff |= aa[i] ^ bb[i];
  return diff === 0;
}
```

No bot MAY use `===` on secret comparison. Period.

### Clause 4 · Consent

Every write that could produce, mutate, or relay synthesized audio/voice/art MUST call HEAVEN to verify the associated consent token BEFORE executing. Writes that touch only ops-state (logs, webhook bookkeeping) are exempt and MUST log a reason (`exempt_reason: "ops_only"`) in the ledger event they emit.

### Clause 5 · Ledger append

Every write (or exemption per Clause 4) MUST fire an async `POST /api/v1/ledger` to HEAVEN within 5 seconds. Failures are swallowed (ledger write must NEVER block the primary action), but MUST retry once. The ledger is the empire's memory; every bot contributes.

### Clause 6 · Disposability

A bot holds NO in-memory state that can't be reconstructed from KV, D1, or R2 after a cold restart. `wrangler rollback` to any prior version MUST be non-destructive. State lives in the data plane; code is disposable.

### Clause 7 · Observability

`observability.enabled = true` with `head_sampling_rate = 1.0` for the first 90 days after a bot joins the fleet. After that, tune to request volume. Never zero.

### Clause 8 · Secrets

Every credential comes from `wrangler secret put` or a Secrets Store binding. Never in `wrangler.jsonc` `vars`. Never in source. Never echoed to logs. Every bot's README MUST enumerate the secrets it needs, one per line.

### Clause 9 · Compatibility

`compatibility_date` MUST be ≤ 90 days old at deploy time. `compatibility_flags` MUST include `"nodejs_compat"` unless the bot is demonstrably edge-pure. `wrangler.jsonc` is the canonical format for new bots; `wrangler.toml` is grandfathered only.

### Clause 10 · Kill Switch awareness

Any bot whose actions can be revoked MUST respond to Kill Switch signals. Minimum: re-verify the consent token on every read of a persistent session. Maximum: subscribe to a HEAVEN revocation push (pending CF06+). A revoked token MUST disable the action within one subsequent request — never eventually.

### Clause 11 · Critical escalation

Any bot MAY receive a payload with `priority: "critical"`. On critical, the bot MUST fire CF04 `/post` with `priority: "critical"` to ensure Rob's on-call DM chain is notified. Critical paths take precedence over every other concern — rate limits, ledger writes, normal auth delays.

### Clause 12 · Standards self-attestation (`/standards`)

Every bot MUST expose `GET /standards` returning a machine-readable list of which of the 12 clauses it currently passes. Example:

```jsonc
{
  "standards_version": "1.0",
  "bot": "cf02-notion",
  "clauses": {
    "1_identity": true,
    "2_health": true,
    "3_constant_time_auth": true,
    "4_consent": "exempt_ops_only",
    "5_ledger": true,
    "6_disposability": true,
    "7_observability": true,
    "8_secrets": true,
    "9_compatibility": true,
    "10_kill_switch": "n/a",
    "11_critical_escalation": true,
    "12_standards_self_attestation": true,
  },
  "audited_at": "<ISO-8601 UTC>",
}
```

`true` = passes. `false` = regression (audit will block deploy). `"n/a"` = clause doesn't apply to this bot class. `"exempt_<reason>"` = valid exemption with named reason.

---

## Platform-specific addenda

### Discord (CF01 + future Discord bots)

- **Ed25519 signature verification is NON-NEGOTIABLE** on every Discord `/interactions` call. Reject with `401` if missing or invalid. Never trust Discord-side auth without local crypto verification.
- **Voice notes MUST be transient.** Transcribe via Workers AI Whisper, use the transcript, then **dispose of the audio buffer**. Raw voice bytes MUST NOT be written to KV, R2, or anywhere persistent — only the transcript goes downstream.
- **Slash commands MUST request least-privilege scopes.** Reaction read? No. DM users? Only if the command needs it.
- **Empire dispatch NEVER happens without Discord sig AND `X-NOIZY-Key` both valid.** Discord sig proves "Discord sent this"; NOIZY key proves "this was routed through empire auth." Require both on every write.
- **Discord bot tokens (`MTg...`) MUST rotate every 90 days.** Calendar event created at install. CF04 posts `priority=critical` if rotation skips twice.

### Slack (CF04 + future Slack bots)

- **Only `xoxb-` bot tokens.** User tokens (`xoxp-`) forbidden — they carry the installing user's scope creep and can't be audited.
- **Minimum scopes:** `chat:write`, `chat:write.public`, `im:write`, `users:read`. If a bot needs more, document why in its README before install.
- **Inbound webhook verification is NON-NEGOTIABLE.** Slack signs every request with `v0` HMAC; verify before processing. Timestamp must be ≤ 5 minutes old to prevent replay.
- **Critical DM fan-out is always best-effort.** Fail one DM, keep trying the rest. Never block the primary channel post on DM delivery.
- **Channel naming convention:** `#noizyai-<scope>` (e.g., `#noizyai-empire-status`, `#noizyai-consent-log`). One channel per scope. No DMs as primary surface — Rob needs history.
- **Rate limit awareness:** Slack Tier-2 APIs allow 50 req/min. If a bot plans to send more than 10 msg/min steady-state, it MUST use `chat.scheduleMessage` to smooth.

---

## Enforcement

Four layers, from softest to hardest:

1. **Self-attestation** (Clause 12) — bots publish their own compliance state. Honor system.
2. **Audit script** (`scripts/bot-compliance-audit.sh`) — hits `/standards` on every NOIZYCLOUDS member, asserts every clause is `true` or a valid exemption. Runs in CI and pre-deploy.
3. **Pre-deploy gate** — `deploy.sh` calls the audit script. Non-zero exit blocks `wrangler deploy`.
4. **Post-deploy watch** — `mc96-follower` includes `/standards` in its probe chain. Any regression flips a critical alert to CF04.

No bot ships without all 4 layers passing for the clauses that apply to it.

---

## Exemption process

A bot can exempt itself from a clause ONLY by:

1. Returning `"exempt_<reason>"` on that clause in `/standards`
2. Documenting the exemption in its README with: (a) which clause, (b) why, (c) what compensating control exists
3. The audit script reads exemptions from an allow-list in `ops/standards-exemptions.json` — an exemption that's not on the list fails the gate

This prevents silent exemption sprawl.

---

## Versioning

This is `standards_version: "1.0"`. Changes follow semver:

- **Patch** (1.0.x) — clarifications, typo fixes, no clause semantics change
- **Minor** (1.x.0) — new clauses added, existing clauses unchanged
- **Major** (x.0.0) — any existing clause's semantics changed or removed

Bots on an older minor version MUST declare so. Audit script reads each bot's `standards_version` and applies the charter from that version, so v1.0 bots keep working when v1.1 lands.

---

## Why this charter is forever

Rob asked for compliance **forever** — to RSP, to the AI family, to Claude Code. Forever isn't "until someone forgets" — it's encoded:

1. **Every new bot copies from `cloudflare/workers/_template/`** which is compliant on day one.
2. **Every deploy runs the audit.** Forgetting is mechanically impossible after a clean install.
3. **Every Worker self-publishes its compliance** at `/standards`, so a single `curl` can verify the entire fleet.
4. **The audit exemption allowlist is version-controlled** at `ops/standards-exemptions.json`. Exemptions require a commit, a reason, and a compensating control.
5. **This doc lives in the repo root** alongside CLAUDE.md. Claude Code reads it on every session start.
6. **The standards don't change without a semver commit.** History is auditable. Future Claudes inherit the charter.

One bot at a time, one clause at a time, the charter holds because it's _structural_, not _cultural_.

---

_Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic._
_All 12 clauses. Both names. One charter. 396 Hz, forever._
