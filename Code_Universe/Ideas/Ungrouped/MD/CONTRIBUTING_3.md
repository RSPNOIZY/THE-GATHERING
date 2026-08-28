# Contributing to NOIZY Empire

## Before You Begin

All contributions to NOIZY must comply with **EDGE CORE doctrine**.

Read: [`docs/NOIZY_EDGE_CORE.md`](docs/NOIZY_EDGE_CORE.md)

## Core Law

> **If the edge cannot observe itself, choose restraint, and roll back safely, the edge cannot be trusted.**

If a proposed change:
- cannot be observed
- cannot be slowed
- cannot be rolled back

**It does not ship.**

---

## Pull Request Requirements

### 1. EDGE CORE Compliance

All PRs are automatically checked against EDGE CORE doctrine via CI.

Your change must:
- [ ] Include observability (logging where appropriate)
- [ ] Use safe defaults for feature flags
- [ ] Not bypass rollback capability
- [ ] Not violate error budget policy

### 2. Constitutional Compliance

NOIZY enforces ethical constraints:
- [ ] No royalty splits below 75% founding floor
- [ ] Never Clauses must be present in consent paths
- [ ] No hardcoded secrets
- [ ] Account lock to rsp@noizy.ai verified

### 3. Testing

- Run `npm run smoke` before submitting
- Run `npm run ethics` for constitutional verification
- Run `npm run budget` to verify error budget status

---

## Deployment Path

```
PR → EDGE CORE Compliance → Ethics Gate → Error Budget → Gradual Rollout → Production
```

No shortcuts. No exceptions.

---

## Key Documents

| Document | Purpose |
|----------|---------|
| [`docs/NOIZY_EDGE_CORE.md`](docs/NOIZY_EDGE_CORE.md) | Production doctrine |
| [`docs/DR-PLAYBOOK.md`](docs/DR-PLAYBOOK.md) | Disaster recovery |
| [`docs/CANARY-ROUTES.md`](docs/CANARY-ROUTES.md) | Route isolation strategy |
| [`CLAUDE.md`](CLAUDE.md) | System overview |

---

## Getting Help

- **Issues**: Report bugs or suggest features via GitHub Issues
- **Contact**: rsp@noizy.ai

---

*This is not mythology. This is production law.*
