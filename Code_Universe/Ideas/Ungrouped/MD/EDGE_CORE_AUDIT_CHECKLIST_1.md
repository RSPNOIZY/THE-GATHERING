# EDGE CORE Code Audit Checklist

**Use before every merge. If any box cannot be checked, the change does not ship.**

---

## Behavior Control

- [ ] All new behavior is gated by a flag or explicit version rollout
- [ ] No hard-coded "always on" paths for new features
- [ ] Safe defaults exist if flags are missing or delayed
- [ ] Flag changes do not require code deployment

---

## Deployment Safety

- [ ] Gradual deployments are used for version promotion
- [ ] Rollback is wired and tested (`npx wrangler rollback` works)
- [ ] No deploy requires manual heroics to reverse
- [ ] CI includes rollback verification step

---

## Blast Radius

- [ ] Risky endpoints (`/api/*`, inference paths) can be isolated by route
- [ ] Control plane changes do not affect unrelated routes
- [ ] Canary environments exist for high-risk paths
- [ ] Route isolation is documented in wrangler.toml

---

## Observability

- [ ] Errors are measurable before rollout expansion
- [ ] Metrics exist for request volume and failure rate
- [ ] Promotion logic does not ignore real-world signals
- [ ] Logging does not expose secrets (sanitization in place)
- [ ] `src/observability.js` is imported in request paths

---

## Error Budget

- [ ] Error budget policy is evaluated in CI
- [ ] Feature promotion halts when budget is exhausted
- [ ] Reliability fixes bypass freeze appropriately
- [ ] Budget status is logged in deployment artifacts
- [ ] `scripts/check-error-budget.js` exits non-zero when exhausted

---

## Consent & Rights

- [ ] Sensitive compute paths verify consent first
- [ ] Rights state is visible and enforceable
- [ ] No compute without authorization
- [ ] Never Clauses are present in consent paths
- [ ] Kill Switch remains functional

---

## Recovery

- [ ] A read-only DR account exists (or is documented as pending)
- [ ] Recovery state is inspectable without write access
- [ ] DR access is exercised periodically (`npm run dr:quick`)
- [ ] `docs/DR-PLAYBOOK.md` is current
- [ ] Secrets recovery template exists (`.dev.vars.example`)

---

## Sunset Discipline

- [ ] Flags and experiments have owners
- [ ] Expiration dates exist for temporary flags
- [ ] Expired constructs are removed or archived
- [ ] No orphaned feature flags in production

---

## Final Gate

**Before approving this PR, confirm:**

- [ ] I have read `docs/NOIZY_EDGE_CORE.md`
- [ ] This change can be observed
- [ ] This change can be slowed
- [ ] This change can be rolled back
- [ ] This change does not bypass EDGE CORE doctrine

---

## Quick Commands

| Check | Command |
|-------|---------|
| Full compliance | `./scripts/edge-core/check-all.sh` |
| Observability | `./scripts/edge-core/check-observability.sh` |
| Rollback | `./scripts/edge-core/check-rollback.sh` |
| Error budget | `./scripts/edge-core/check-error-budget.sh` |
| DR visibility | `./scripts/edge-core/check-dr.sh` |

---

## Reference

- **Doctrine**: `docs/NOIZY_EDGE_CORE.md`
- **Contributing**: `CONTRIBUTING.md`
- **DR Playbook**: `docs/DR-PLAYBOOK.md`

---

*If a box cannot be checked, the change does not ship.*
*This is not mythology. This is production law.*
