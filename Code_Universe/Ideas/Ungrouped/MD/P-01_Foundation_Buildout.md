# P-01 — NOIZY.AI Foundation Buildout

**Type:** Meta-project (infrastructure)
**Operator:** Robert Stephen Plowman
**Co-architect:** CLAUDE
**Opened:** 2026-04-13
**Target close:** 2026-04-27 (focused) / 2026-05-25 (ambient)
**Status:** OPEN

---

## Objective

Convert the designed NOIZY.AI foundation — Foundation Architecture v1.0, Day-0 Execution Runbook, Command Pack v1.0, Phase 4–6 Artifacts, and Phase 7 Full-Auto deployment — from **scaffolds on disk** to **live, verified, and sealed infrastructure**. Close the gap between "designed" and "deployed" so that P-02 (Consent-as-Code) and P-03 (first artist engagement) can be built on a proven runtime.

## Close criteria

This project closes only when all six items are green. No partial closes. No scope expansion without re-opening.

| # | Criterion | How verified | Status |
|---|---|---|---|
| C-1 | Edge Bridge Worker deployed at `voice-mcp.noizy.ai` | `curl -I https://voice-mcp.noizy.ai` returns `401 Unauthorized` with `WWW-Authenticate: Bearer realm="noizy-mcp"` | ⬜ |
| C-2 | Cloudflared tunnel `noizy-dreamchamber` healthy on M2 Ultra | `cloudflared tunnel info noizy-dreamchamber` reports HEALTHY; `voice.noizy.ai` and `gabriel.noizy.ai` resolve and return expected edge responses | ⬜ |
| C-3 | Cloud Run MCP mirror deployed and IAM-gated | `gcloud run services describe noizy-mcp` shows `INGRESS=internal-and-cloud-load-balancing`, `--no-allow-unauthenticated`; authenticated request returns 200 | ⬜ |
| C-4 | Consent-as-Code v1.0 **drafted** (not yet enforced) | `Team Canon/03_Governance/Consent-as-Code-v1.0.md` exists, reviewed by operator, status = DRAFT | ⬜ |
| C-5 | Decision Register instantiated | `Team Canon/03_Governance/Decision-Register-v1.0.xlsx` exists with D-01 through D-19 populated, override column present | ⬜ |
| C-6 | First session sealed end-to-end | One complete session run through `/gabriel-note` → `/session-proof` → `/recall` → `/gabriel-export`; delivery manifest produced; seal hash verified | ⬜ |

## Current state (2026-04-13 stress-test)

Designed on disk, not yet live:
- Worker source at `apps/voice-bridge-remote/` — not deployed (no `wrangler deploy` run yet).
- `NOIZY_MCP_AUTH_TOKEN` secret — not generated, not stored in vault, not pushed to Worker.
- Tunnel `noizy-dreamchamber` — not created on M2 Ultra; credentials JSON absent; DNS routes unbound.
- Cloud Run mirror source at `noizy-mcp-remote/` — not deployed (no `gcloud run deploy` run yet).
- Port `17017` for GABRIEL / Heaven pipeline — first mention in Canon; needs operator confirmation before tunnel bringup.
- Zero Trust — 0/50 seats used; no Access policies in front of any tunnel hostname.
- DNS zone for `noizy.ai` — has apex + `www` + mail records; **missing** `voice-mcp`, `voice`, `gabriel` subdomains (auto-created by deploy commands).
- DMARC, CAA, apex redirect behavior — see D-16/17/18 in Decision Register.

## Dependencies

| Blocks | Description |
|---|---|
| P-02 Consent-as-Code v1.0 enforcement | Needs a live runtime (C-1, C-2, C-3) to bind policy to |
| P-03 First artist engagement | Needs sealed session chain (C-6) before any human voice data goes through the system |

## Risk register (project-scoped)

| ID | Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|---|
| R-P01-01 | Scope creep — "Foundation" expands beyond the six close criteria | Medium | High | Six criteria are frozen. New work opens a new project, not a scope extension. |
| R-P01-02 | Auth secret leaked during first rotation | Low | Critical | Generate secret with `openssl rand -hex 32`, write directly to vault + `wrangler secret put`. Never paste into chat, email, or file. |
| R-P01-03 | Tunnel credentials file lost | Low | High | Back up `noizy-dreamchamber.json` to founder password vault per Day-0 Runbook Step 0.4 **before** first use. |
| R-P01-04 | Port `17017` is wrong for Heaven pipeline → tunnel 502s | Medium | Medium | Operator confirms port before `cloudflared tunnel run`; fix `cloudflared/config.yml` if wrong. |
| R-P01-05 | Cloud Run mirror drifts from Worker surface | Medium | Medium | Shared schema file; CI check (deferred to hardening phase). For P-01 close, manual review. |

## Decision log (project-scoped)

| Date | Decision | Rationale |
|---|---|---|
| 2026-04-13 | P-01 is the first tracked project | Runtime must exist before governance or dogfooding can be real. Stress-test surfaced 6 amber lights; closing them is prerequisite to everything else. |
| 2026-04-13 | Close criteria frozen at six items | Prevent scope drift. Consent-as-Code is *drafted* here, *enforced* in P-02. |

## Next actions (operator)

1. Generate `NOIZY_MCP_AUTH_TOKEN` (`openssl rand -hex 32`), store in founder password vault under "NOIZY / voice-mcp / auth-token v1".
2. On M2 Ultra: `cloudflared tunnel login` → `cloudflared tunnel create noizy-dreamchamber` → back up credentials JSON to vault.
3. Run `make deploy-remote` (requires wrangler + gcloud auth prerequisites).
4. Run `cloudflared tunnel route dns noizy-dreamchamber voice.noizy.ai` and same for `gabriel.noizy.ai`.
5. Run `make start` (or install as launchd service per Day-0 Runbook Step 7.x).
6. Run `make verify` — expect `401` at `voice-mcp.noizy.ai`.
7. Confirm or correct port `17017` for Heaven pipeline.
8. Kick off C-4 (Consent-as-Code draft) and C-5 (Decision Register instantiation) in parallel — they don't block deploy work.

## Amendments

*None yet. Any scope change requires a dated amendment entry here plus operator sign-off.*
