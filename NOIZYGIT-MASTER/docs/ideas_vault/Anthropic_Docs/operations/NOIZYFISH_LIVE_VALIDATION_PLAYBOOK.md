# NOIZYFISH Live Validation Playbook

**Status:** Delivery package installed. Runtime execution remains operator-controlled.

## Artifacts

- Harness: `scripts/live-validation/harness.js`
- Receipt schema: `scripts/live-validation/schemas/receipt.schema.json`
- Ingest envelope schema: `scripts/live-validation/schemas/ingest-envelope.schema.json`
- Rollbacks: `scripts/live-validation/rollbacks/*.sh`
- Acceptance report template: `docs/operations/acceptance_report.template.md`
- n8n blueprint: `tools/n8n_workflows/14_noizyfish_validation_replication.json`
- Matrix: `docs/LIVE_VALIDATION_MATRIX.md`

## Execution

Dry-run-safe validation:

```bash
node scripts/live-validation/harness.js
```

Execute bounded rollback scripts only after operator approval:

```bash
NOIZY_EXECUTE_ROLLBACKS=1 node scripts/live-validation/harness.js
```

For ZK-VDR Redis session deletion, the rollback script also requires:

```bash
NOIZY_CONFIRM_SESSION_FLUSH=RSP_001
```

## Environment Overrides

| Variable | Default |
| --- | --- |
| `NOIZY_INGRESS_URL` | `http://127.0.0.1:8088/webhook/triage` |
| `NOIZY_C2PA_URL` | `http://localhost:5174/queen-of-spades/health` |
| `NOIZY_VDR_URL` | `http://localhost:5173/vault/health` |
| `NOIZY_D1_CHECK_URL` | unset |
| `NOIZY_SHEET_CHECK_URL` | unset |
| `NOIZY_TMUX_SESSION` | `noizy-skunkworks` |
| `NOIZY_REQUIRED_DAEMONS` | `code-server,ollama-engine,gathering-router` |
| `NOIZY_VALIDATION_LOG_DIR` | `apps/dreamchamber/logs/live-validation` |

## Receipt Rules

- A subsystem is verified only after a receipt is emitted and validated.
- Receipts include `run_id`, `correlation_id`, `request_id`, `artifact_hash`, `evidence_ref`, and `receipt_hash`.
- Receipt hashes are SHA-256 over the canonical JSON receipt body.
- Private vault contents, voice data, biometric data, payment data, and named sensitive payload subjects must not enter receipts.

## Rollback Boundaries

- `01_drop_requeue.sh`: records a requeue intent only.
- `02_d1_revoke.sh`: deletes a D1 telemetry row only when explicitly enabled and the correlation ID passes strict validation.
- `03_ui_quarantine.sh`: marks the UI branch unsealed for inspection.
- `04_session_revoke.sh`: deletes only Redis keys matching the ZK-VDR prefix when explicitly confirmed.
- `05_daemon_respawn.sh`: respawns only the specified tmux window when explicitly enabled.

## Acceptance Criteria

The run can be accepted only when:

1. Ingress emits a request ID and receipt hash.
2. D1 and Sheets replication share the same correlation ID.
3. C2PA UI readiness is confirmed and later bound to a manifest ID, asset hash, and signer reference.
4. ZK-VDR readiness is confirmed, with WebAuthn and watermark proofs recorded separately.
5. tmux daemon sweep shows expected windows.
6. No raw private artifacts appear in the logs or receipts.
