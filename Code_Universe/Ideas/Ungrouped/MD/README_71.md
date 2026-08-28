# `_template/` · NOIZYCLOUDS bot starter

> Copy this directory to create a new CF0X bot. Compliant with NOIZY DreamChamber + Plowman Standards v1.0 on the first deploy. Don't skip any file.

**Charter:** [`../../../STANDARDS.md`](../../../STANDARDS.md)
**Parent brand:** [`../../../NOIZYCLOUDS.md`](../../../NOIZYCLOUDS.md)

---

## Create a new bot

```bash
cp -r cloudflare/workers/_template cloudflare/workers/cf06-myname
cd cloudflare/workers/cf06-myname
# Then edit:
#   wrangler.jsonc  — name, AGENT_NAME/CLASS/MISSION, secrets list
#   src/index.js    — AGENT constant, domain handlers
#   README.md       — this file, customized
npx wrangler secret put NOIZY_API_KEY
npx wrangler deploy --config wrangler.jsonc
```

---

## Template provides (do not remove)

- `GET /` — Clause 1 identity, includes `frequency_hz: 396`, `standards_version: "1.0"`, `doctrines`
- `GET /health` — Clause 2 health, used by mc96-follower
- `GET /standards` — Clause 12 self-attestation, machine-readable compliance state
- `timingSafeAuth(req, env)` — Clause 3 constant-time auth helper
- `writeLedger(event, payload, env)` — Clause 5 non-blocking ledger append
- `escalateCritical(summary, payload, env)` — Clause 11 CF04 Slack DM fan-out
- `POST /webhook` — generic event ingestion (auth-gated, ledger-logged, critical-aware)

---

## You must customize

1. **`AGENT` constant** in `src/index.js` — name, class, mission.
2. **Clause 4** in `standardsReport()` — set to `true` if your bot writes voice/art; set to `"exempt_ops_only"` with a documented reason if not.
3. **Clause 10** — set to `true` if your bot holds revocable sessions; `"n/a"` if it doesn't.
4. **Add domain handlers.** Each one MUST:
   - `await timingSafeAuth(req, env)` before doing anything mutating
   - `await writeLedger(event, payload, env)` after the action
   - Call `escalateCritical()` when `payload.priority === "critical"`
5. **Register on NOIZYCLOUDS.md** once your bot passes the Agent Contact Sequence (see `DREAMCHAMBER_BEST_IDEAS_2026-04-17.md` Part II §7).

---

## Verify compliance

```bash
# After deploy:
curl https://cf06-myname.rsp-5f3.workers.dev/
curl https://cf06-myname.rsp-5f3.workers.dev/health
curl https://cf06-myname.rsp-5f3.workers.dev/standards

# Or run the fleet-wide audit:
bash scripts/bot-compliance-audit.sh
```

A passing `/standards` response means the bot self-attests compliance with the 12 clauses. The audit script confirms — if any clause returns `false` or an unregistered exemption, deploy is blocked.

---

## Secrets checklist (minimum)

| Secret            | Source      | Purpose                                                     |
| ----------------- | ----------- | ----------------------------------------------------------- |
| `NOIZY_API_KEY`   | empire-wide | Clause 3 auth                                               |
| `<SERVICE>_TOKEN` | per-bot     | Whatever platform this bot relays to (Notion, Linear, etc.) |

Never add secrets to `wrangler.jsonc` `vars`. Never log them. Clause 8 is non-negotiable.

---

_Copy this template, customize thoughtfully, and your bot enters NOIZYCLOUDS correctly on day one. 396 Hz._
