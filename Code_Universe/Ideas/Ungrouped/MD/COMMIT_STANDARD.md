# NOIZY Commit Standard

## Format
```
type(scope): intent

[optional body]

[optional footer]
```

## Types
| Type | Purpose |
|------|---------|
| `sound` | Creative or lineage changes |
| `infra` | Cloudflare, CI, deploy, infrastructure |
| `ethics` | Constraints, safeguards, refusals |
| `docs` | Documentation, meaning, narrative |
| `fix` | Corrective, reversible changes |
| `feat` | New features |
| `refactor` | Code restructuring (no behavior change) |
| `test` | Test additions or fixes |
| `chore` | Maintenance tasks |

## Scopes
- `heaven` — Heaven Worker API
- `gabriel` — GABRIEL orchestration
- `consent` — Consent kernel
- `dream` — DreamChamber
- `ci` — GitHub Actions
- `deploy` — Deployment infrastructure

## Intent Requirements
Every commit message must answer:
1. **Why** does this exist?
2. **Who** does it protect?
3. **What** does it refuse to do?

## Examples

### Good
```
infra(deploy): add canary rollout with instant rollback

Protects users from bad deploys by routing only 1% traffic
initially. Auto-rollback if smoke test fails.
```

```
ethics(consent): add kill switch for token revocation

RSP_001 can now revoke any consent token instantly.
No synthesis can proceed without valid consent.
```

### Bad
```
fixed stuff
```

```
update
```

## Co-Author
All Claude-assisted commits should include:
```
Co-Authored-By: Claude <noreply@anthropic.com>
```
