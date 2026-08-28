# Node-RED Flow Surface

Node-RED receives mobile telemetry envelopes, normalizes them, and sends only redacted operational receipts downstream.

Expected ingress contract:

- `schema`: `noizy.telemetry.triage.v1`
- `message_id`
- `idempotency_key`
- `correlation_id`
- `ttl_ms`
- `consent_version`
- `approval_required`
- `actor.id`: `RSP_001`
- `payload.event_type`: `PROJECT_AMI_TELEMETRY`

Raw voice, biometric, payment, vault, or private agreement payloads must not pass through this path. Route hashes, proof IDs, or local references instead.
