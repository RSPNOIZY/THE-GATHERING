# Live Validation Matrix

**System:** MC96ECOUNIVERSE / NOIZYFISH / RSP001 Rebirth  
**Date:** 2026-08-24  
**Operator:** RSP_001  
**Mode:** Measured, acknowledged, bounded validation

## Operating Rules

- Every step must emit a receipt before it can be called verified.
- Raw voice, biometric, private vault, payment, or identity payloads stay out of telemetry. Use hashes, proof IDs, or local references.
- A failed subsystem does not block unrelated checks. Record the failure, stop that branch, and continue the remaining bounded checks.
- Any rights, payouts, signing certificates, private agreements, or publication actions require approval before irreversible action.
- Receipt hashes are SHA-256 over the canonical JSON receipt body.

## Receipt Schema

```json
{
  "receipt_id": "rcpt_20260824_<step>_<shortid>",
  "run_id": "lv_20260824_rsp001_001",
  "step": "telemetry_ingest",
  "status": "pending|passed|failed|blocked",
  "target": "http://127.0.0.1:8088/webhook/triage",
  "correlation_id": "corr_rsp001_20260824_001",
  "request_id": null,
  "artifact_hash": null,
  "observed_at": "2026-08-24T00:00:00-04:00",
  "evidence_ref": "local path, manifest id, row id, proof id, or redacted log ref",
  "failure_reason": null,
  "receipt_hash": "sha256:<computed>"
}
```

## Versioned Ingest Envelope

```json
{
  "schema": "noizy.telemetry.triage.v1",
  "message_id": "msg_ami_ott_20260824_01",
  "idempotency_key": "idem_ami_ott_20260824_01",
  "correlation_id": "corr_rsp001_20260824_001",
  "ttl_ms": 300000,
  "consent_version": "rsp001-consent-v1",
  "approval_required": false,
  "actor": {
    "id": "RSP_001",
    "role": "operator"
  },
  "payload": {
    "event_type": "PROJECT_AMI_TELEMETRY",
    "trip_id": "AMI-OTT-20260824-01",
    "timestamp": "2026-08-24T16:08:18-04:00",
    "atmosphere_profile": "CALM_AMBIENT_396HZ",
    "journey_flow": "Ottawa Urban Core -> Rockcliffe",
    "currency": "CAD",
    "base_fare": 28.5,
    "local_tip_est": 7,
    "telemetry": {
      "codec": "OPUS_128",
      "network": "TAILSCALE_CELLULAR_HANDOFF",
      "latency_ms": 42
    }
  }
}
```

## Validation Matrix

| Step | Request Target | Expected Ack | Success Criteria | Failure Criteria | Receipt ID | Rollback / Containment |
| --- | --- | --- | --- | --- | --- | --- |
| 1. Ingress ACK | `POST http://127.0.0.1:8088/webhook/triage` | `ingress_success`, unique `request_id`, `sha256` receipt hash | Router accepts the versioned envelope, validates `X-NOIZY-Actor: RSP_001`, returns a receipt, and does not expose raw private payloads | Connection refused, non-2xx response, missing `request_id`, missing hash, duplicate idempotency key accepted as new work | `rcpt_20260824_ingress_<shortid>` | Stop downstream fan-out, preserve request and response headers locally, mark router branch failed |
| 2. D1 Replication | Cloudflare D1 `agent-memory` / `DB_MEMORY` | `d1_append_success`, row or event ID, matching `correlation_id` | D1 contains exactly one event for the idempotency key and the receipt hash matches the ingress receipt | Missing row, duplicate row, mismatched `correlation_id`, write against dead `gabriel_db` IDs | `rcpt_20260824_d1_<shortid>` | Quarantine replication job, do not retry without idempotency guard, record failed D1 target |
| 3. Sheets Replication | NOIZYMOBILE Silent Ingestion Ledger | `sheet_append_success`, spreadsheet row ID, matching `correlation_id` | Sheet row contains redacted operational fields only, matches D1 `correlation_id`, and excludes secrets/private identity data | Auth failure, missing row, mismatched row, raw sensitive payload leaked into the sheet | `rcpt_20260824_sheet_<shortid>` | Freeze sheet fan-out, redact affected row if created, preserve local evidence hash |
| 4. Ferris Wheel UI Readiness | `GET http://localhost:5174/` or `http://[::1]:5174/` | HTTP 200 and app shell loaded | Vite app shell loads, canvas root exists, visualizer readiness probe passes before high-frequency rendering starts | Connection refused, app shell missing, JavaScript crash, canvas absent | `rcpt_20260824_ui5174_<shortid>` | Stop visualizer playback, keep service running for inspection, capture browser/HTTP evidence |
| 5. C2PA Claim Binding | Ferris Wheel UI claim inspector / C2PA engine | `c2pa_claim_bound`, manifest ID, asset hash, signer ref | Active session displays `RSP_001` signer reference and binds the Queen of Spades artifact hash to the profile without exposing private keys | No manifest, signer mismatch, hash mismatch, untrusted certificate, fake readable claim text | `rcpt_20260824_c2pa_<shortid>` | Mark media provenance unsealed, block publication/export, keep local manifest for audit |
| 6. ZK-VDR UI Readiness | `GET http://localhost:5173/` or `http://[::1]:5173/` | HTTP 200 and VDR app shell loaded | App shell loads and advertises WebAuthn / secure deal vault flow without exposing protected agreement data | Connection refused, app shell missing, route crash, protected data rendered before auth | `rcpt_20260824_vdr5173_<shortid>` | Stop VDR validation branch, preserve HTTP headers/body hash, do not open sensitive records |
| 7. WebAuthn Gate | ZK-VDR WebAuthn challenge | `webauthn_verified`, challenge ID, policy state | WebAuthn challenge completes for authorized operator and server records session/policy state | No challenge, weak fallback auth, challenge replay accepted, auth bypass, unlogged session | `rcpt_20260824_webauthn_<shortid>` | Revoke test session, rotate challenge material if needed, freeze agreement access |
| 8. Dynamic Watermark | ZK-VDR agreement viewer | `watermark_enforced`, policy ID, session ID | Client overlays ISO-8601 timestamp, account reference, and network reference while server records policy state; copy/print inspection is blocked client-side | Watermark absent, stale timestamp, copy/print available, policy state not logged | `rcpt_20260824_watermark_<shortid>` | Close viewer, invalidate session, mark document access unsealed |
| 9. tmux Matrix | `tmux list-windows -t noizy-skunkworks` | window list with stable names | Session exists and windows map to router, code-server, Ollama, Vite, and support daemons | tmux socket missing, session absent, unexpected window churn, orphaned service windows | `rcpt_20260824_tmux_<shortid>` | Do not restart automatically; record absence and require operator decision |
| 10. Port Health | `:8088`, `:8443`, `:11434`, `:5173`, `:5174` | listener snapshot and memory sample | Expected services are listening, bound to intended interfaces, and memory is stable across two samples | Missing listener, wrong interface, repeated crash/restart, memory growth outside failure budget | `rcpt_20260824_ports_<shortid>` | Keep existing processes intact, capture snapshot, avoid destructive restarts |
| 11. SonoBus / Tailscale Mesh | Tailscale status and SonoBus session evidence | mesh node IDs, route state, codec state | M2 Ultra and Lucy iPad Pro are visible in mesh evidence and the stream mode is recorded as PCM or Opus | Tailscale unavailable, node absent, route mismatch, codec state unobserved | `rcpt_20260824_mesh_<shortid>` | Mark mobile audio branch unverified, keep local-only studio path active |
| 12. Freedom Nodes | Snowflake/Tor process or service logs | proxy active receipt and node ref | Recycled node emits Snowflake/Tor active evidence without publishing private operator identifiers | No process/log evidence, stale logs, unknown node identity, sensitive host data exposed | `rcpt_20260824_freedom_<shortid>` | Mark anti-censorship branch pending, redact logs before sharing |

## Failure Budget

| Subsystem | Budget | Action When Exceeded |
| --- | --- | --- |
| Router ingress | 1 failed POST per run | Stop fan-out and mark run partially failed |
| D1 replication | 1 missing or duplicate row | Freeze D1 branch until idempotency is inspected |
| Sheet replication | 1 missing or unsafe row | Freeze Sheets branch and redact before retry |
| UI readiness | 1 unavailable UI per port | Mark UI branch blocked, continue daemon checks |
| WebAuthn / VDR | 0 auth bypasses | Stop immediately and freeze protected document access |
| C2PA binding | 0 signer or hash mismatches | Mark media unsealed and block publication |
| tmux / process sweep | 1 unavailable control surface | Record unavailable, do not restart automatically |

## Execution Notes

- `127.0.0.1` and `localhost` may resolve differently from IPv6-only Vite listeners. Check `http://[::1]:5173/` and `http://[::1]:5174/` when IPv4 probes fail.
- The canonical Cloudflare D1 memory binding is `DB_MEMORY` / `agent-memory` (`b5b58cc9-1f37-4000-adc5-12f9e419662f`). Do not use dead `gabriel_db` IDs.
- Google Sheets is an external replication surface. Write only redacted operational fields unless the operator explicitly approves broader publication.
- C2PA validation must name the manifest ID, artifact hash, signer reference, and verification result. A UI claim without those fields is not sealed evidence.
- WebAuthn validation must verify challenge freshness and server-side session logging, not only a client-side success banner.

## Run Result Summary

| Run ID | Started At | Completed At | Status | Notes |
| --- | --- | --- | --- | --- |
| `lv_20260824_rsp001_001` | TBD | TBD | Pending receipts | Use this row for the next measured run. |

## Harness Implementation

- Harness: `scripts/live-validation/harness.js`
- Rollbacks: `scripts/live-validation/rollbacks/*.sh`
- Schemas: `scripts/live-validation/schemas/*.json`
- Playbook: `docs/operations/NOIZYFISH_LIVE_VALIDATION_PLAYBOOK.md`
- Acceptance template: `docs/operations/acceptance_report.template.md`
- n8n blueprint: `tools/n8n_workflows/14_noizyfish_validation_replication.json`

## Reference Anchors

- Node-RED messages: `https://nodered.org/docs/user-guide/messages`
- Node-RED functions: `https://nodered.org/docs/user-guide/writing-functions`
- WebAuthn: `https://developer.mozilla.org/en-US/docs/Web/API/Web_Authentication_API`
- tmux manual: `https://man.archlinux.org/man/tmux.1`
- tmux commands: `https://tmux.app/commands/`
