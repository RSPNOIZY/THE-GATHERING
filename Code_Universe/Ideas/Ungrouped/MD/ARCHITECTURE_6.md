# NO-DADDY — Architecture Brief

**Name:** NO-DADDY (ships inside NOIZYBEAST; also exposed as a public portal)
**Location:** `utilities/no-daddy/`
**Status:** Strategic design — pre-scaffold
**Sibling product to:** Heaven (HVS consent kernel) / DreamChamber / NOIZY Proof
**Doctrine home:** Revocation as sacred. Extraction is not a feature of the caller.

---

## Positioning — Two Surfaces, One Backend

NO-DADDY ships as **two client shells** over a **single Cloudflare Worker backend**:

| Surface | Who It's For | Delivery |
| --- | --- | --- |
| **NOIZYBEAST command** | devs / power users already in VS Code | `NOIZYBEAST: NO-DADDY — Escape a Cloud Tenant` |
| **exit.noizy.ai portal** | everyone else — indie founders, agencies, clients | Pages Custom Domain behind Cloudflare Access |

Both shells call the same `/api/graph/*` routes on the Worker. The logic lives once; the UX meets users where they are.

---

## One-Liner

Help anyone leave GoDaddy, Microsoft 365, or any cloud-identity tenant safely — in minutes, not months.

## Who It's For

- **Indie founders** who signed up for Microsoft / Google free trials and can't untangle
- **Solo devs** whose Entra tenant was auto-provisioned by a Copilot / Dynamics trial
- **Agencies** helping clients migrate off legacy tenants
- **IT admins** at <50-person companies who lack dedicated identity expertise

## The Core Problem

When you sign up for anything in the Microsoft / Google / GoDaddy universe, your custom domain gets entangled with:

- User principal names (UPNs)
- Proxy email aliases (often hidden from v1.0 APIs — need beta endpoints)
- Groups with mail-enabled addresses
- App registrations with redirect URIs
- Conditional Access policies
- SharePoint / Teams / Intune references
- DNS TXT verification records
- MX / SPF / DKIM / DMARC records pointing at provider mail servers
- License-auto-provisioned service plans (CRM, Power Platform, Dynamics)

**Microsoft's `forceDelete` endpoint blocks domain release while ANY of the above reference it.** The user gets a generic error; the portal shows nothing specific. You chase blockers one at a time across three different admin UIs.

We lived this today trying to release `fishmusicinc.com`. The pain is real.

---

## MVP Scope (Phase 1)

### F1 — "Free My Domain" — the most painful, highest-leverage

User experience:

```text
1. Enter domain name
2. Sign in with Cloudflare Access (SSO, empire-wide identity)
3. Delegate a scoped Microsoft Graph token via MSAL (least privilege)
4. Portal walks the dependency graph
5. Dependency Tree view — every blocker, severity, suggested severance
6. Preview changes (dry-run)
7. One-click sever — with rollback journal
8. Auto-retry domain forceDelete
9. Success → C2PA-signed exit receipt (artifact of sovereignty)
```

Scope exclusions (Phase 1): multi-tenant, SharePoint objects, Intune-joined devices (M365 enterprise territory).

### F2 — "Free My Email" (Phase 2)

Detect existing mail setup, guide migration to Cloudflare Email Routing.

### F3 — "Free My Tenant" (Phase 3)

Full Entra tenant wind-down: export all data, sign C2PA archive, delete.

### F4 — "Free My Registrar" (Phase 4) — GoDaddy-specific flow

Walk through: unlock domain → get EPP / auth code → Cloudflare Registrar transfer → verify DNS preservation → update WHOIS → cancel GoDaddy account.

---

## Technical Architecture

**Identity root: Cloudflare Access.** Per NOIZY doctrine (SSO-only, all Cloudflare), the portal sits behind CF Access as the front door. Users authenticate through CF Access; CF Access federates to Microsoft / Google / GitHub / email-OTP; the Worker receives a signed JWT (`Cf-Access-Jwt-Assertion`) with the verified user identity. No passwords, no sessions we manage, no OAuth we host.

### Frontend — Portal Surface

- **Pages:** `exit.noizy.ai` (Pages Custom Domain)
- **Framework:** Plain HTML + vanilla JS or Astro — keep it minimal; this is an infrastructure tool
- **Auth:** **None at the app layer.** Cloudflare Access gates the domain; by the time the browser loads the page, the user is authenticated
- **Design:** 396 Hz palette + platinum wordmark, Bauhaus-clean, infrastructure feel
- **Microsoft Graph delegation:** After CF Access auth, the app requests a *second*, scoped Graph token via MSAL.js (device code or popup). Principle of least privilege — CF Access identity ≠ Microsoft delegation.

### Frontend — NOIZYBEAST Surface

- **Command:** `NOIZYBEAST: NO-DADDY — Escape a Cloud Tenant`
- **UX:** Quick Pick wizard (VS Code native) steps through the same dependency walk
- **Auth:** Uses existing NOIZYBEAST's Cloudflare Access session if present; otherwise prompts device-code flow
- **Output:** Inline webview showing dependency tree; signed receipt saved to workspace

### Backend (shared by both surfaces)

- **Worker:** `cloudflare/workers/no-daddy/` (new)
- **Config:** `wrangler.jsonc` (per `mcp-builder.md` standard)
- **Access policy:** CF Access application covers `exit.noizy.ai/*` and the Worker's API hostname; bypass rule for `/health` only
- **Routes (all gated by CF Access):**
  - `/api/graph/walk` — given a domain + Graph token, walk dependencies
  - `/api/graph/sever` — apply a list of severance actions
  - `/api/dns/inspect` — read current DNS records via Cloudflare API
  - `/api/registrar/transfer` — orchestrate EPP transfer (Phase 4)
  - `/api/receipt` — C2PA-sign a completion artifact
  - `/health` — public, for monitoring
- **JWT verification:** Worker verifies `Cf-Access-Jwt-Assertion` via Cloudflare Access JWKs before processing any authenticated route
- **State:** None at rest. Ephemeral in-request only.
- **Logging:** Every action → `noizy_ledger` via Heaven API (append-only, CF Access identity recorded)
- **Secrets:** Graph app client ID (public), CF Access Application AUD (public); no sensitive data on the Worker itself

### Data Flow

```text
Browser OR VS Code → exit.noizy.ai / NOIZYBEAST command
   ↓ (CF Access challenge — Google / Microsoft / Email OTP)
CF Access → issues CF_Authorization cookie + Cf-Access-Jwt-Assertion header
   ↓
Client loads (now authenticated as a human to NOIZY)
   ↓
Client requests Microsoft Graph token via MSAL (scoped)
   ↓
Client → Cloudflare Worker /api/graph/walk
  Headers: Cf-Access-Jwt-Assertion (from CF Access) + X-MS-Graph-Token (delegated)
   ↓
Worker:
  1. Verify CF Access JWT (who is this user to NOIZY?)
  2. Call Microsoft Graph with the user's delegated token
  3. Log action to noizy_ledger with CF Access identity as actor
   ↓
Worker → Client (dependency tree JSON)
   ↓
User clicks "sever" → same pattern, Worker applies
   ↓
Worker → Heaven API /ledger/append (CF Access identity = actor, action = severance)
   ↓
Client → success UI + C2PA-signed receipt artifact
```

**Key point:** The Worker has two distinct identity proofs per request — CF Access JWT (who they are in NOIZY) and Microsoft Graph delegated token (who they are to Microsoft). Neither is persisted. Everything is logged.

---

## Doctrine Alignment

- **Never Clauses** — the portal itself has Never Clauses. It will NEVER:
  - Store user credentials or tokens at rest
  - Touch a resource outside the explicit dependency graph
  - Take an action the user hasn't individually approved
  - Keep a copy of data being migrated
- **Consent Tokens** — each severance action requires a fresh user consent
- **Kill Switch** — user can abort mid-flow; already-applied changes have a rollback journal
- **Ledger** — every action logged append-only, C2PA-signed receipt
- **Compensation** — (Phase 3) if we help a user escape a contract penalty, we flag it; if we pay the fee and collect from the user, that's compensation as automatic

---

## Competitive Landscape

- **Microsoft Partner Center / Migration Manager** — enterprise, assumes you LOVE being in Microsoft
- **BitTitan / CloudM** — migration tools, $$$$, focused on incoming not outgoing
- **GoDaddy domain transfer** — for the domain-only case, but ignores the tenant tangle

**Gap:** no consumer / SMB product focused on exit specifically. And certainly none with a sovereignty doctrine attached.

---

## Open Decisions (awaiting RSP_001)

1. **Monetization** — free tool, freemium, subscription, or one-time unlock?
2. **Public domain** — `exit.noizy.ai`, dedicated brand (e.g. `no-daddy.io`), or inside `metabeast.noizy.ai`?
3. **Scope of MVP** — just "Free My Domain," or all three flows at once?

(Auth trust model is resolved: Cloudflare Access + MSAL delegation, per empire SSO doctrine.)

---

## Phase 1 Build Plan (once decisions made, 2–3 day sprint)

Day 1:

- [ ] Scaffold `cloudflare/workers/no-daddy/` with `wrangler.jsonc`
- [ ] Configure Cloudflare Access application on `exit.noizy.ai`
- [ ] Implement `/api/graph/walk` — reads domain + user Graph token, returns dependency tree
- [ ] Implement `/api/graph/sever` — single-action executor with logging
- [ ] Wire MSAL.js in a single HTML page for the Graph delegation

Day 2:

- [ ] Dependency Tree UI (React or plain DOM, doesn't matter)
- [ ] Severance preview + apply + rollback journal
- [ ] C2PA signing on completion
- [ ] NOIZYBEAST command wiring the same Worker API

Day 3:

- [ ] End-to-end test with a throwaway Microsoft tenant
- [ ] Docs + launch page
- [ ] Deploy to Cloudflare

---

## Lineage

This design was born from a lived experience on 2026-04-17 at 19:57 UTC — RSP_001 ran `forceDelete` on `fishmusicinc.com`, got blocked by hidden proxy aliases, and said *"upgrade and improve how this process takes place. we will create a portal that can help people leave the GoDaddy tenant hell."*

Shortly after: *"SSO's from now on till the end of time. All through Cloudflare."*

Then: *"We should call it NO-DAFFY as part of NOIZYBEAST! Or even NO-DADDY."*

Then: *"In our utilities directory."*

That's provenance.
