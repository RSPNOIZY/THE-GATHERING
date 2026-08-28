**AI Workers Readiness — Local-Only Mode**

- **Status:** Remote repairs via AI workers (voice) are NOT enabled.
- **Mode:** Local automation only; manual approval required for any system changes.

**Guardrails**
- **Auth:** No unattended credentials; MFA required for privileged actions.
- **Change control:** All changes must be reviewed and committed via Git.
- **Logging:** Full audit trail of commands, outputs, and timestamps.
- **Rollback:** Defined rollback steps per subsystem (network, storage, deploy).
- **Kill switch:** Immediate disable path for any automation.

**Readiness Checklist (to enable later)**
- Voice pipeline hardened: wake-word, consent, per-command confirmation.
- Privilege isolation: least-privilege tokens scoped to environment.
- Safety tests: dry-run modes, sandboxed execution, rate limiting.
- Monitoring: alerts on anomalous actions, resource spikes, failed auths.
- Incident workflow: on-call handoff, escalation paths, postmortems.

**Current Practice**
- Proceed with local tasks (MTU checks, speed tests, docs updates).
- Keep deploy steps manual until Wrangler auth is fixed.
- Defer voice-driven remote operations until checklist is complete.