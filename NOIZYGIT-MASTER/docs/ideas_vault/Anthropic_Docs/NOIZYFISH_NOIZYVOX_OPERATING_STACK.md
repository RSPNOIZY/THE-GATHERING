# NOIZYFISH_NOIZYVOX_OPERATING_STACK.md

## Purpose
This document defines the operating stack for **NOIZYFISH** and **NOIZYVOX** so both brands stay:
- credible
- fast
- buildable
- governable

It locks the stack around:
- Cloudflare-native primitives for runtime, storage, config, bindings, and rollout
- precise model roles
- fast-path vs slow-path behavior
- clear brand ownership
- a hard separation between platform primitives and NOIZY meaning/proof/governance

---

## Shared Stack Foundation

### Cloudflare primitives
The shared platform layer is:

- **Workers** for runtime execution and request handling
- **D1** for durable relational truth
- **KV** for read-heavy distributed configuration
- **Bindings** through `env` for direct in-Worker access to platform resources
- **Versions / deployments / gradual deployments** for controlled rollout

These are all directly supported by Cloudflare's current Workers, D1, KV, bindings, and gradual deployment docs. D1 is a serverless SQL database with SQLite semantics, KV is designed for read-heavy globally distributed config-like workloads, and Workers bindings are the preferred runtime access mechanism.

### Shared law
1. Tracked D1 migrations are the default schema path.
2. `wrangler d1 execute` is for verification, inspection, and controlled remediation.
3. Cloudflare provides primitives.
4. NOIZY provides meaning, proof, governance, and institutional law.

---

## Model Role Split

### Claude
Use Claude for:
- higher-order reasoning
- long-context synthesis
- workflow generation
- writing
- operator-facing or creator-facing explanation
- decision support

Anthropic's help center says paid Claude plans generally provide a **200K context window**, while Anthropic's pricing page shows that **1M context** is available only for specific supported model/platform paths rather than as a blanket Max-plan default. So the correct wording is: Claude is the deep reasoning layer, and 1M context applies only where the selected model/platform supports it.

### Gemma 4
Use Gemma 4 precisely:
- **E2B / E4B** for audio understanding and clip analysis
- **31B / 26B A4B** for non-audio roles appropriate to those variants
- not as a blanket "Gemma does everything" claim

Google's Gemma 4 model card explicitly distinguishes the family variants and supports audio input on the E2B/E4B audio-capable models rather than across the whole family.

### NOIZY runtime
Use the NOIZY runtime for:
- storage
- routing
- enforcement
- auditability
- rollout governance
- trust-surface delivery

---

## Fast Path vs Slow Path

### Fast path
The edge fast path should handle:
- existence check
- consent state
- provenance summary
- gap detection
- ordinary launch/config flags
- lightweight search hints

This is realistic because Workers, KV, D1, and bindings are designed for low-latency edge execution and direct access patterns.

### Slow path
The governed slower path should handle:
- full remix generation
- deeper audio analysis
- third-party tagging
- proof-bundle assembly
- richer explanation
- larger model reasoning passes

### Performance language rule
Do not state "120ms end-to-end" as an established fact unless internally benchmarked and reproducible.
Use this instead:

> **120ms fast-path target for preflight decisions; longer for full generative and external-service paths.**

---

## NOIZYFISH

### Brand role
**NOIZYFISH = archive intelligence + provenance power**

### What NOIZYFISH owns
- search across archive truth
- gap detection
- resurrection priorities
- "why this worked"
- lineage explanations
- durable source records
- archive memory surfaces

### What backs NOIZYFISH
- **D1 migrations** for schema law
- **D1** for provenance, gap, and resurrection truth
- **KV** for fast search/config toggles
- **Workers** for runtime delivery
- **Bindings** for direct D1/KV access

Cloudflare's D1 migrations reference documents tracked migrations and the `d1_migrations` table, while KV and bindings docs support the fast-config/runtime split.

### NOIZYFISH statement
> **NOIZYFISH turns archives into living, searchable truth. It does not just retrieve files; it explains lineage, surfaces gaps, and converts forgotten material into actionable creative memory.**

### NOIZYFISH fast path
- asset existence
- source summary
- consent/rights status if relevant
- gap indicator
- archive match confidence

### NOIZYFISH slow path
- resurrection analysis
- deep provenance explanation
- rich similarity clustering
- archive-priority planning
- bundle generation

---

## NOIZYVOX

### Brand role
**NOIZYVOX = voice estate + consent law + operator accountability**

### What NOIZYVOX owns
- consent enforcement
- revoke logic
- voice provenance
- proof-bundle links
- operator approval surfaces
- trust-state visibility for creators
- voice authority surfaces

### What backs NOIZYVOX
- **D1 migrations** for consent/audit schema law
- **D1** for audit truth and provenance records
- **KV** for ordinary low-risk UX/config flags
- **Workers** for request handling
- **Bindings** for direct runtime access

D1's SQLite-based relational model and Worker binding API make it the right substrate for durable audit and consent state, while KV remains appropriate for low-risk read-heavy config.

### NOIZYVOX statement
> **NOIZYVOX turns voice rights into operational law. It does not just store consent; it makes authority visible, auditable, and enforceable before any voice-sensitive action can happen.**

### NOIZYVOX fast path
- consent present or absent
- revoke state
- trust-state summary
- authority visibility
- launch/config flags for ordinary UX

### NOIZYVOX slow path
- proof-bundle generation
- deeper provenance explanation
- operator ceremony flows
- compliance packaging
- extended voice-history reasoning

---

## Primitive Boundary

### Native Cloudflare primitives
Cloudflare natively provides:
- Workers runtime
- D1
- KV
- bindings
- versions/deployments
- gradual deployments
- observability/analytics

These are platform primitives.

### NOIZY higher-order logic
NOIZY adds:
- provenance meaning
- consent interpretation
- proof-bundle logic
- operator ceremony
- gap intelligence
- regulator-facing packaging
- institutional law

### Boundary law
> **Cloudflare provides primitives. NOIZY provides meaning, proof, and governance.**

Do not describe:
- D1 as natively providing NOIZY proof semantics
- KV as authoritative audit truth
- Workers as natively enforcing NOIZY's institutional law

---

## Deployment Law

### Use real Cloudflare deploy primitives
Use:
```bash
npx wrangler d1 migrations apply <DB_NAME> --remote
npx wrangler deploy
npx wrangler versions deploy
```

Cloudflare documents tracked D1 migrations and separate Workers versions/deployments with gradual deployment support.

### Do not rely on pseudo-commands unless you own the wrapper

Treat commands like:
```bash
wrangler deploy fish/genius-router --gemma4 claude_max
```

as wrapper syntax only if you have actually implemented that wrapper. Cloudflare's documented primitives are `wrangler deploy` and the versions/deployments flow, not brand-specific model-routing flags in the CLI.

---

## Operating Truth Rules

### Promise less magic
Do not claim unsupported model/context/runtime properties as defaults.

### Show more truth
Expose:
- what exists
- what is missing
- what is inferred
- what is proven
- what the platform provides
- what NOIZY adds

### Keep the edge immediate
Use the edge for preflight clarity, not for every heavy task.

### Keep heavy intelligence governed
Move expensive, long-running, or externally dependent work into slower governed paths.

### Separate platform from meaning
Never blur Cloudflare primitives with NOIZY proof or governance claims.

---

## Final Locked Positioning

### NOIZYFISH
Archive intelligence + provenance power

### NOIZYVOX
Voice estate + consent law + operator accountability

### Shared winning formula
- promise less magic
- show more truth
- keep fast-path UX immediate
- move heavy intelligence into governed slower paths
- separate platform primitive from NOIZY meaning

---

## Final Statement

NOIZYFISH and NOIZYVOX stay credible when they are:
- faster at the edge
- stricter about truth
- clearer about provenance and consent
- disciplined about what the platform does versus what NOIZY means

That is how the brands sound smarter, not louder.

---

*Locked: 2026-04-07*
*Authority: Robert Stephen Plowman (RSP_001)*
