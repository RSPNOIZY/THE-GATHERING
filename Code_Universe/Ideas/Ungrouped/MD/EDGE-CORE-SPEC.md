# NOIZY Edge Core Specification

> **If the edge cannot observe itself, choose restraint, and roll back safely, the edge cannot be trusted.**

## Architecture Overview

| Layer | Responsibility | Cloudflare Primitive |
|-------|----------------|---------------------|
| **Observability** | Measure truth before deciding anything | Analytics, Logpush, Invocation metrics |
| **Edge Flags** | Change behavior instantly (<1ms) | KV (read), DO (kill switch writes) |
| **Edge A/B** | Multi-variant experiments | KV + deterministic hashing |
| **Gradual Deployments** | Primary canary — traffic % by version | Native Versions API |
| **Route Canaries** | Blast-radius control by surface area | Routes + Environments |
| **Error Budgets** | Gate promotion of new versions | Operational pattern on CF telemetry |
| **Traffic Throttling** | Reduce harm during budget burn | KV-controlled runtime |
| **Auto-Promotion** | Promote winning variants | CI + KV rewrite |
| **Edge Postmortems** | Capture facts, not memories | Artifact generation |
| **Read-only DR** | Recovery visibility and auditability | Workers Platform (Read-only) role |

---

## 1. Observability (Foundation)

**Cloudflare provides:** Request counts, error rates, invocation statuses, analytics, and Logpush.

**Why this matters:** Every other decision (flags, canaries, budgets, rollbacks) depends on accurate telemetry. Without observability, you're flying blind.

### Key Metrics to Surface

| Metric | Source | Use |
|--------|--------|-----|
| Request success/error rate | Workers Analytics | Error budget computation |
| P50/P95/P99 latency | Workers Analytics | Canary health checks |
| Invocation status (ok/error/exceeded) | Workers Metrics | Alert triggers |
| Version deployment timestamp | Deployments API | Rollback targeting |

### Implementation

```javascript
// src/observability.js — already implemented
import { logRequest, logResponse, logError } from './observability';
```

**Rule:** Log structured telemetry on every request. Never log secrets.

---

## 2. Feature Flags (KV-Backed, DO for Kill Switches)

**Cloudflare says:** KV is ideal for "configuration, routing data, and A/B testing configurations" — read-heavy, globally replicated, <1ms reads.

**Caveat:** KV is eventually consistent. For critical kill switches requiring write-after-write guarantees, use a Durable Object-backed control path.

### Normal Flags → KV

```javascript
// src/flags.js — already implemented
import { isEnabled, getVariant, isRolledOut } from './flags';

if (await isEnabled(env, 'new_consent_flow')) {
  return newHandler(request, env);
}
```

### Critical Kill Switches → Durable Object

```javascript
// src/kill-switch.ts (for atomic write guarantees)
export class KillSwitchDO implements DurableObject {
  private state: DurableObjectState;

  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === 'PUT') {
      const { flag, value } = await request.json();
      await this.state.storage.put(flag, value);
      return new Response('OK');
    }

    const flag = url.searchParams.get('flag');
    const value = await this.state.storage.get(flag);
    return new Response(JSON.stringify({ flag, value, consistent: true }));
  }
}
```

**Rule:** Use KV for normal flags. Use DO for kill switches that require atomic consistency.

---

## 3. Gradual Deployments (Primary Canary Mechanism)

**Cloudflare native:** The Versions API supports traffic splitting across Worker versions. This is the correct primary canary mechanism.

**Why native gradual deployments first:**
- Same Worker, same routes, multiple versions
- Traffic split by percentage (1% → 10% → 50% → 100%)
- Built-in metrics comparison between versions
- One-command rollback to previous version

### Deployment Flow

```bash
# 1. Publish new version (not yet receiving traffic)
npx wrangler versions upload

# 2. Gradual rollout
npx wrangler versions deploy <version-id> --percentage 1
# Monitor for 30 min...
npx wrangler versions deploy <version-id> --percentage 10
# Monitor for 1 hour...
npx wrangler versions deploy <version-id> --percentage 100

# 3. If errors spike, instant rollback
npx wrangler rollback
```

### When to Use Gradual Deployments

- Testing new code on the same route set
- Rolling out changes to all paths simultaneously
- Comparing version metrics directly

---

## 4. Per-Route Canaries (Secondary Blast-Radius Tool)

**When routes + environments add value:**
- Testing changes on risky paths only (`/api/*`) while homepage stays stable
- Different Worker instances for different surface areas
- Path-specific feature testing

### Route Strategy

| Use Case | Approach |
|----------|----------|
| Worker is the origin for a hostname | **Custom domain** |
| Worker sits in front of existing origin | **Route pattern** |

```toml
# wrangler.toml

# Production: all routes via custom domain
[env.production]
name = "heaven"
routes = [
  { pattern = "noizy.ai/*", custom_domain = true }
]

# Canary: risky paths only
[env.canary]
name = "heaven-canary"
routes = [
  { pattern = "noizy.ai/api/v2/*", zone_name = "noizy.ai" }
]
# More specific route wins → /api/v2/* goes to canary
```

**Rule:** Use gradual deployments as the default canary. Use route canaries only when you need path-specific blast-radius control.

---

## 5. Error Budgets (Gate Version Promotion)

**What Cloudflare provides:** Telemetry (errors, successes, latency).
**What you implement:** The policy that gates version promotion.

### Refined Wording

> **Gate promotion of new versions while budget remains.**

You may still *publish* a version but refuse to *advance* it past a threshold when budget is exhausted.

### SLO Definition

```javascript
// SLO: 99.9% success over 30 days
// Error budget: 0.1% = ~43.8 minutes/month allowed downtime
const SLO = 0.999;
```

### Budget Gate Logic

```javascript
// src/error-budget.js — already implemented
import { shouldDeploy } from './error-budget';

const decision = shouldDeploy(metrics, SLO);
if (!decision.allowed) {
  console.log('❌ Error budget exhausted — FREEZE version promotion');
  process.exit(1);
}
```

### CI Integration

```yaml
# .github/workflows/deploy.yml — already implemented
- name: Check error budget
  run: node scripts/check-error-budget.js
  # Exits non-zero if budget exhausted → blocks promotion
```

**Rule:** Error budgets gate *version promotion*, not publication. Reliability fixes get priority when budget is exhausted.

---

## 6. Cross-Account DR (Visibility and Preparedness)

**What this is:**
- Configuration and state visibility
- Recovery preparedness verification
- Human-auditable recovery state

**What this is NOT:**
- Full active-active failover
- Automatic traffic switching

### Setup

1. Invite `dr-monitor@noizy.ai` to primary account with **Workers Platform (Read-only)** role
2. Mirror `wrangler.toml` and code to DR Git repo
3. Export KV snapshots weekly (encrypted)
4. Export D1 backups weekly (encrypted)

### Drill Commands

```bash
# Quick drill (weekly)
./scripts/dr-drill.sh quick

# Full drill (monthly)
./scripts/dr-drill.sh full

# Tabletop exercise (quarterly)
./scripts/dr-drill.sh tabletop
```

**Rule:** DR is about ensuring you *can* recover. Test it regularly. Document what you find.

---

## 7. Edge A/B Experimentation (Variants, Not Just Booleans)

**Status:** Operational pattern enabled by **Workers KV + deterministic hashing**.

Beyond boolean flags, full multi-variant experiments (A/B/n testing) with weighted traffic allocation.

### Experiment Definition (stored in KV)

```json
{
  "salt": "noizy-search-2026",
  "variants": {
    "control": 70,
    "v2": 20,
    "v3": 10
  }
}
```

### Deterministic Variant Selection

```javascript
// src/experiments.js — already implemented
import { chooseVariant } from './experiments';

const variant = await chooseVariant(env, 'search_algo', userId);
if (variant === 'v2') {
  return newSearchHandler(request, env);
}
```

**Properties:**
- Sticky assignment (same user always gets same variant)
- Weighted variants (A/B/n testing)
- No flicker (decision made at edge)
- No client logic required

---

## 8. Automated Variant Promotion

**Status:** Operational pattern — CI evaluates outcomes and rewrites KV.

Cloudflare does not auto-promote variants. Promotion is a **policy decision**.

### Promotion Rule (example)

> Promote variant with:
> - Lowest error rate
> - Latency not worse than control
> - Statistically significant sample size

### CI Promotion

```bash
# Evaluate metrics, select winner, rewrite KV
npm run promote search_algo
```

**Result:**
- Winning variant becomes new control
- Losing variants phased out automatically
- No code deploy required

---

## 9. Budget-Aware Traffic Throttling

**Status:** Runtime behavior change, not just CI policy.

**Freeze stops change. Throttling reduces harm.**

When error budget burn rate is high:
- Don't deploy
- **Reduce traffic hitting risky paths**
- Prefer cached/degraded responses

### Edge Throttle (KV-controlled)

```javascript
// src/throttle.js — already implemented
import { applyThrottle, ThrottleConfig } from './throttle';

const throttled = await applyThrottle(request, env);
if (throttled) return throttled;
```

### Throttle Modes

| Mode | Behavior |
|------|----------|
| `normal` | No throttling |
| `throttle` | Shed 40% of risky path traffic |
| `emergency` | Shed 80% of risky path traffic |

**Effect:**
- System sheds load gracefully
- Users experience "soft degradation," not failure
- Error budget stops burning faster

---

## 10. Edge-Captured Postmortems

**Status:** Operational pattern — artifacts, not memories.

Postmortems should be **generated from facts**, not recollections.

### Automatic Capture at Rollback

```bash
# Captures deployment, experiments, budget state, git info
npm run postmortem
```

### CI Hook

```yaml
- name: Capture postmortem artifact
  if: failure()
  run: TRIGGER=ci_failure ACTION=rollback ./scripts/capture-postmortem.sh
```

**Output:**
- Immutable JSON record
- Time-aligned with real events
- Reviewable, auditable, blameless

---

## Complete Edge Core Summary

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         NOIZY Edge Core                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│   [Observability]  ◄── Foundation: measure everything, log safely        │
│         │                                                                │
│         ▼                                                                │
│   [Edge Flags]     ◄── KV for normal, DO for kill switches              │
│         │                                                                │
│         ▼                                                                │
│   [Edge A/B]       ◄── Multi-variant experiments, sticky assignment     │
│         │                                                                │
│         ▼                                                                │
│   [Gradual Deploy] ◄── PRIMARY: version traffic split (1%→10%→100%)    │
│         │                                                                │
│         ▼                                                                │
│   [Route Canary]   ◄── SECONDARY: path-specific blast radius            │
│         │                                                                │
│         ▼                                                                │
│   [Error Budget]   ◄── Gate: promote only when budget healthy           │
│         │                                                                │
│         ▼                                                                │
│   [Throttling]     ◄── Shed load gracefully during budget burn          │
│         │                                                                │
│         ▼                                                                │
│   [Auto-Promote]   ◄── Winning variants become new control              │
│         │                                                                │
│         ▼                                                                │
│   [Postmortem]     ◄── Capture facts, not memories                      │
│         │                                                                │
│         ▼                                                                │
│   [Read-only DR]   ◄── Verify: can we recover?                          │
│                                                                          │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## System Behavior Matrix

| Situation | System Response |
|-----------|-----------------|
| Experiment fails | Variant auto-demoted |
| Experiment wins | Variant auto-promoted |
| Errors spike | Traffic throttled |
| Budget exhausted | Changes frozen |
| Rollback occurs | Postmortem captured |
| Region fails | Canary halts globally |

---

## Quick Reference: Commands

| Task | Command |
|------|---------|
| Publish version | `npx wrangler versions upload` |
| Gradual rollout | `npx wrangler versions deploy <id> --percentage 10` |
| Instant rollback | `npx wrangler rollback` |
| Check error budget | `npm run budget` |
| Change freeze check | `npm run change-freeze` |
| DR drill | `npm run dr:quick` |
| Toggle flag | `npx wrangler kv key put --namespace-id=<id> flag_name true` |
| Monitor canary | `npm run canary:monitor` |
| Promote variant | `npm run promote <experiment>` |
| Capture postmortem | `npm run postmortem` |

---

## Final Operating Doctrine

> **The edge observes.**
> **The edge adapts.**
> **The edge remembers.**
> **Humans decide when to forget.**

At this point, the NOIZY Edge Core is:
- Feature-adaptive
- Reliability-aware
- Ethically constrained
- Operationally literate

You are no longer "deploying to the edge."
You are **governing behavior at the edge**.

---

*Version: 2.0 — 2026-04-07*
*Owner: RSP_001*
*Review: Quarterly*
