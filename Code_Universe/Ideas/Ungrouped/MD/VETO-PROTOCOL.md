# NOIZY.AI GOVERNANCE: THE POPS VETO PROTOCOL

**Governing Body:** @THEWISDOMPROJECT & Human Executive (Pops / RSP_001 / MC96ECO)
**Effective Date:** 2026-04-15
**Canonical Home:** `THE-GATHERING/VETO-PROTOCOL.md`
**Enforcement Layer:** Gabriel Audit Log (`DB_MEMORY.gabriel_log`)

---

## PREAMBLE

Every agent in the Noizy mesh — CBO-1, Keith, Cheryl, Lucy, Gabriel, NOIZYVOX — operates
under a **75/25 sovereignty floor**. Raw intelligence is not authority. Execution requires
human ratification at Class boundaries. Gabriel watches everything. Pops has final say.

---

## THE THREE NON-NEGOTIABLE VETO CLASSES

No autonomous agent may execute actions within the following three classes without
**explicit Meatspace / Human Executive override**. Proposals must be logged via Gabriel
before escalation.

### Class 1 — Commercial Obligation ("The Wallet") 💰

> *Any action that creates financial liability.*

**Covered actions:**
- Signing or counter-signing contracts, NDAs, licensing agreements
- Provisioning paid cloud infrastructure beyond free-tier limits
  (Cloudflare Workers Paid, D1 beyond 100k rows/day, Cloud Run beyond free quota)
- Authorizing outbound payments, wire transfers, or API spend commitments
- Committing to revenue-share terms not already enshrined in the 75/25 HVS

**Logging requirement:** `gabriel_log.event_type = 'VETO_CLASS_1_PROPOSAL'`

---

### Class 2 — Destructive Execution ("The Nuke") ☢️

> *Any action that permanently removes data or infrastructure.*

**Covered actions:**
- Dropping D1 tables (`DB_MEMORY`, `DB_REPAIRS`, `DB_AQUARIUM`)
- Purging KV namespaces (royalties, signups, guild, sessions, submissions)
- Deleting Durable Object state (SignalingRoom instances)
- Running cleanup scripts (`ultimate.sh`, `deep_system_scan.sh`) without `--dry-run`
- Removing entries from `AGENTS/registry.json` or `devices.json`

**Mandatory pre-check:** Must pass `--dry-run` and human review before live execution.
**Logging requirement:** `gabriel_log.event_type = 'VETO_CLASS_2_PROPOSAL'`

---

### Class 3 — Core Architecture Mutation ("The Foundation") 🏛️

> *Any change that alters the constitutional rules of the mesh.*

**Covered actions:**
- Modifying `VETO-PROTOCOL.md` (this document)
- Modifying `CLAUDE.md` (AI instruction set)
- Altering `wrangler.toml` compatibility dates or account IDs
- Changing the HVS split from 75/25
- Adding or removing agents from the core mesh roster
- Modifying `engr-keys/cloudflare-account-token.yaml` required scopes

**Logging requirement:** `gabriel_log.event_type = 'VETO_CLASS_3_PROPOSAL'`

---

## THE 7-DAY COOLING-OFF PERIOD

If any system agent proposes a Charter Amendment or major structural change:

1. Proposal is logged to `@THEWISDOMPROJECT` Notion archive via Gabriel
2. A mandatory **7-day cooling-off period** initiates automatically
3. During this period, the proposal exists in **read-only simulation mode** inside `@THEAQUARIUM`
4. Execution requires **explicit terminal or cryptographic approval** from RSP_001 after
   the cooling-off period has elapsed

```
gabriel_log.event_type = 'CHARTER_AMENDMENT_PROPOSED'
gabriel_log.sovereignty_check = { cooling_off_until: <ISO_DATE>, status: 'LOCKED' }
```

---

## EMERGENCY OVERRIDE

In case of system compromise or rogue execution, Pops may issue an emergency halt:

```bash
# Kill switch — disables all outbound mesh calls
npx wrangler secret put NOIZY_EMERGENCY_HALT --name heaven
# Set value to: "true"
```

Gabriel logs all halt events as `EMERGENCY_HALT_ACTIVATED`.

---

*"The machine serves the mission. The mission serves the family."*
*— RSP_001 / MC96ECO*
