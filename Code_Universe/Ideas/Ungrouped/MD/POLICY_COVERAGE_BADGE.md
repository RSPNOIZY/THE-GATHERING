# POLICY_COVERAGE_BADGE.md

## Purpose

A **public badge** that displays real-time policy compliance coverage.

Embeddable in READMEs, dashboards, and external systems.

---

## Endpoints

### SVG Badge

```
GET /badge/policy-coverage.svg
```

Returns a shields.io-style SVG badge:

![policy coverage](https://img.shields.io/badge/policy%20coverage-100%25-brightgreen)

### JSON Endpoint

```
GET /badge/policy-coverage.json
```

Returns shields.io-compatible JSON:

```json
{
  "schemaVersion": 1,
  "label": "policy coverage",
  "message": "100%",
  "color": "brightgreen",
  "namedLogo": "shield",
  "data": {
    "overall_compliance": 100,
    "total_policies": 8,
    "zk_policies": 8,
    "period_days": 30,
    "policies": { ... },
    "generated_at": "2026-04-07T12:00:00Z"
  }
}
```

### Detailed Coverage

```
GET /trust/policy-coverage
```

Returns full coverage breakdown:

```json
{
  "success": true,
  "coverage": {
    "overall_compliance": 100,
    "period_days": 30,
    "policies": {
      "CONSENT_ACTIVE_ON_USE": {
        "description": "Consent was active when the action occurred",
        "applicable_events": 142,
        "passed": 142,
        "compliance_rate": 100
      },
      ...
    }
  },
  "gates": {
    "audit_readiness": true,
    "policy_compiler": true,
    "time_travel": true,
    "regulator_bundle": true
  },
  "badge_url": "/badge/policy-coverage.svg"
}
```

---

## Usage

### In README.md

```markdown
[![Policy Coverage](https://heaven.rsp-5f3.workers.dev/badge/policy-coverage.svg)](https://heaven.rsp-5f3.workers.dev/trust/policy-coverage)
```

### In HTML

```html
<img src="https://heaven.rsp-5f3.workers.dev/badge/policy-coverage.svg" alt="Policy Coverage">
```

### Dynamic Badge via Shields.io

```markdown
![Policy Coverage](https://img.shields.io/endpoint?url=https://heaven.rsp-5f3.workers.dev/badge/policy-coverage.json)
```

---

## Color Scale

| Coverage | Color | Meaning |
|----------|-------|---------|
| 100% | ![#4c1](https://via.placeholder.com/15/4c1/000000?text=+) Bright Green | Perfect |
| 95-99% | ![#97CA00](https://via.placeholder.com/15/97CA00/000000?text=+) Green | Excellent |
| 90-94% | ![#a4a61d](https://via.placeholder.com/15/a4a61d/000000?text=+) Yellow-Green | Good |
| 80-89% | ![#dfb317](https://via.placeholder.com/15/dfb317/000000?text=+) Yellow | Needs Attention |
| 70-79% | ![#fe7d37](https://via.placeholder.com/15/fe7d37/000000?text=+) Orange | Warning |
| <70% | ![#e05d44](https://via.placeholder.com/15/e05d44/000000?text=+) Red | Critical |

---

## Caching

- SVG: 5 minute cache (`Cache-Control: public, max-age=300`)
- JSON: 5 minute cache
- Detailed: 1 minute cache

---

## Public Access

These endpoints require **no authentication**.

Transparency is the point.

Anyone can verify:
- How many policies exist
- What percentage are passing
- Which specific policies are evaluated
- When the data was generated

---

## Integration with CI

Add badge status check to CI:

```yaml
- name: Check policy coverage
  run: |
    COVERAGE=$(curl -s https://heaven.rsp-5f3.workers.dev/badge/policy-coverage.json | jq -r '.data.overall_compliance')
    if [ "$COVERAGE" -lt 95 ]; then
      echo "Policy coverage below threshold: ${COVERAGE}%"
      exit 1
    fi
    echo "Policy coverage: ${COVERAGE}%"
```

---

## Final Statement

A badge is a public commitment.

If policy coverage drops, everyone can see it.

**Transparency enforces accountability.**

---

*This badge exists because compliance that can't be publicly verified isn't really compliance.*
