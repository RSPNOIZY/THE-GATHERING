# NOIZYMOBILE

Mobile transit sync layer for the 2026 Honda CR-V Hybrid field node.

## Responsibilities

- Accept CR-V/iPad telemetry envelopes.
- Store-and-forward only redacted operational events.
- Preserve `message_id`, `idempotency_key`, and `correlation_id`.
- Sync to The Gathering Router on `:8088` when the Tailscale route is available.

## Privacy Boundary

Do not send raw dashcam footage, voice captures, biometric material, precise private location history, payment credentials, or private agreement contents through this path. Use hashes, local file references, or proof IDs.
