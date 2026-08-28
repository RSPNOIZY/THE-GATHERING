# NOIZY BUILDING BLOCKS RUNBOOK

## Purpose

This runbook turns the NOIZY Claude Terminal prompt pack into a staged execution flow that is:
- repo-friendly
- Cloudflare-real
- less lossy
- easier to recover if a pass drifts
- better suited to Claude Terminal / Claude Code workflow

It is designed for a monorepo with:

- **NOIZYFISH** → living ocean archive, legacy vault, museum-grade catalog
- **NOIZYVOX** → sovereign voice platform, consent-native infrastructure, casting-trust interface

Stack:
- pnpm workspaces
- Turborepo
- Next.js
- TypeScript
- Tailwind
- Cloudflare-compatible deployment path

---

## Locked operating laws

### Law 1
**Build shared structure first. Brand soul second. Copy polish last.**

### Law 2
**Route structure before page volume.**

### Law 3
**Checkpoint after scaffold, after shared contracts, after NOIZYFISH MVP, after NOIZYVOX MVP, and after final QA.**

These laws reduce drift, overbuilding, page chaos, and late rewrite cost.

---

## Working model

This runbook assumes Claude Terminal is strongest when work is split into meaningful passes rather than one giant world-building request.

The right operating rhythm is:

1. build foundation
2. stabilize contracts
3. lock routes
4. build brand systems
5. build pages
6. prepare infra
7. polish copy
8. QA hard
9. handoff cleanly

---

## Repo target

Target structure:

```txt
/
  apps/
    noizyfish/
      app/
      components/
      content/
      lib/
      public/
    noizyvox/
      app/
      components/
      content/
      lib/
      public/
  packages/
    ui/
    config/
    content/
  package.json
  pnpm-workspace.yaml
  turbo.json
  tsconfig.json
```

Notes:
- pnpm-workspace.yaml must exist at repo root
- Turborepo should orchestrate tasks across apps and packages
- shared packages should contain structure, not flattened brand identity
- app-local content should remain clearly separated

---

## Execution phases

### Phase 1 — Scaffold foundations

**Goal**: Create the monorepo base only.

Do not over-polish pages yet. Do not write final copy yet. Do not over-abstract.

**Prompt**: Use GORUNFREE — FULL EXECUTION SUPERPROMPT

**Scope constraint**: In this first pass, constrain the prompt to:
- workspace root
- Turborepo config
- app folders
- package folders
- baseline scripts
- baseline TypeScript setup
- baseline Tailwind setup
- basic README stubs

**Deliverables**:
- pnpm-workspace.yaml
- turbo.json
- root package.json
- apps/noizyfish
- apps/noizyvox
- packages/ui
- packages/config
- packages/content
- initial tsconfig strategy
- initial run/build scripts

**Exit criteria**:
- workspace installs
- both apps are present
- shared packages resolve cleanly
- scripts are readable
- no unnecessary page flourish yet

**Checkpoint**: After this phase, checkpoint repo state, verify root commands, verify workspace integrity.

---

### Phase 2 — Shared contracts

**Goal**: Stabilize shared data shapes and shared structural primitives before page divergence begins.

This phase has two passes:
1. shared content contract
2. route map

#### Phase 2.1 — Shared content contract

**Prompt**: Use GORUNFREE — SHARED CONTENT CONTRACT PROMPT

**Deliverables**:
- TypeScript models for archive items, lineage entries, featured works, voice profiles, consent states, trust blocks, CTA groups, metadata groups
- mock data for both apps
- shared content utilities
- content folder structure
- backend mapping notes

**Exit criteria**:
- archive-related shapes are stable
- voice/consent-related shapes are stable
- shared types are readable
- app-local content is clearly separated
- future D1 / Workers mapping is plausible

#### Phase 2.2 — Route map

**Prompt**: Use GORUNFREE — ROUTE MAP BLOCK

**Deliverables**:
- route tree for both apps
- layout ownership notes
- App Router structure plan
- static vs future dynamic notes

**Exit criteria**:
- route ownership is clear
- shared layouts are justified
- app-local layouts remain distinct
- future dynamic paths are planned, not improvised later

**Checkpoint**: After shared contracts + route map, checkpoint repo state, verify content structure, verify route plan before page build begins.

---

### Phase 3 — Brand systems

**Goal**: Forge the visual and structural soul of each app without collapsing them into one aesthetic.

This is where "shared primitives, separate souls" becomes real.

#### Phase 3.1 — NOIZYFISH design system

**Prompt**: Use GORUNFREE — NOIZYFISH DESIGN SYSTEM PROMPT

**Focus**: archive visual rhythm, typography hierarchy, metadata presentation, oceanic restraint, museum-grade calm, archive cards, archive grid behavior, subtle motion rules

**Exit criteria**:
- NOIZYFISH feels archival, not product-marketing
- cards do not feel ecommerce-like
- dark theme feels deep, not flashy

#### Phase 3.2 — NOIZYVOX design system

**Prompt**: Use GORUNFREE — NOIZYVOX DESIGN SYSTEM PROMPT

**Focus**: dashboard shell, consent panel hierarchy, casting card system, status chips, onboarding visual rhythm, controlled glow, trust-heavy panel language

**Exit criteria**:
- NOIZYVOX feels intimate and consequential
- no crypto aesthetic
- no toy AI demo energy
- UI feels creator-rights aware

#### Phase 3.3 — Content/data model reinforcement

**Prompts**: Use GORUNFREE — NOIZYFISH CONTENT MODEL PROMPT and GORUNFREE — NOIZYVOX DATA MODEL PROMPT

**Focus**: Lock the final usable model shape before page volume grows.

**Exit criteria**:
- mock content is strong enough to support page building
- type drift is minimized
- page components can consume stable data

---

### Phase 4 — NOIZYFISH MVP

**Goal**: Build NOIZYFISH first.

**Reason**:
- archive structure is content-led
- lineage language benefits from stability
- museum pacing is easier to lock before rights-control UI complexity

**Minimum route target**:
- /
- /about
- /archive
- /archive/[slug]
- /lineage
- /contact if desired in MVP

**Recommended prompts**: Use, in order:
1. homepage/hero block if available
2. archive grid/list block if available
3. related works block if available
4. GORUNFREE — NOIZYFISH ABOUT PAGE PROMPT
5. lineage page prompt if included in extended pack
6. mobile polish prompt
7. Cloudflare architecture prompt

**Deliverables**:
- homepage
- archive browser
- archive detail structure
- about page
- lineage page
- mobile refinement
- Cloudflare integration note

**Exit criteria**:
- NOIZYFISH feels like a living archive
- archive browsing is calm and premium
- metadata feels meaningful
- lineage is framed clearly without overclaiming
- mobile browsing works with dignity

**Checkpoint**: After NOIZYFISH MVP, checkpoint repo state, verify archive routes, verify content model fit, verify visual identity is distinct.

---

### Phase 5 — NOIZYVOX MVP

**Goal**: Build NOIZYVOX second.

**Reason**:
- it benefits from stable consent/profile model shapes
- dashboard + consent + casting logic are easier once shared contracts are locked
- shared UI primitives should already be mature enough

**Minimum route target**:
- /
- /about
- /onboarding
- /dashboard
- /consent
- /casting
- /trust
- /contact if desired in MVP

**Recommended prompts**: Use, in order:
1. homepage/hero block if available
2. consent model block if available
3. casting card block if available
4. readiness panel block if available
5. activity timeline block if available
6. GORUNFREE — NOIZYVOX ABOUT PAGE PROMPT
7. GORUNFREE — NOIZYVOX DASHBOARD PROMPT
8. mobile polish prompt
9. Cloudflare architecture prompt

**Deliverables**:
- homepage
- about page
- onboarding flow
- dashboard
- consent center
- casting interface
- trust page
- mobile refinement
- Cloudflare integration note

**Exit criteria**:
- NOIZYVOX explains itself clearly
- consent settings feel structured and consequential
- dashboard panels all matter
- casting looks curated, not commodified
- mobile remains readable and premium

**Checkpoint**: After NOIZYVOX MVP, checkpoint repo state, verify route integrity, verify consent model fit, verify brand separation from NOIZYFISH.

---

### Phase 6 — Infrastructure realism

**Goal**: Prepare for real deployment evolution without inventing unsupported guarantees.

This is architecture-note work, not fantasy deployment language.

**Prompts**: Use GORUNFREE — NOIZYFISH CLOUDFLARE ARCHITECTURE PROMPT and GORUNFREE — NOIZYVOX CLOUDFLARE ARCHITECTURE PROMPT

**Expected outputs**:
- integration-plan.md
- env.example
- optional schema sketch
- endpoint recommendations
- migration phases
- risk notes

**Rules**:
- say Cloudflare-compatible, not magically solved
- do not invent pseudo CLI flags
- do not imply immutable state where it is not implemented
- frame proof/provenance as provenance-ready unless fully built
- keep static vs dynamic boundaries explicit

**Exit criteria**:
- both apps have practical integration notes
- D1 / R2 / KV / Workers usage is sensibly scoped
- no fake deployment confidence appears in docs

---

### Phase 7 — Structural cleanup

**Goal**: Ensure the monorepo still makes sense after both app builds.

**Prompt**: Use GORUNFREE — MONOREPO STRUCTURE UPGRADE PROMPT

**Focus**:
- package boundaries
- tsconfig relationships
- import paths
- Tailwind sharing strategy
- shared vs app-local ownership
- README clarity
- script consistency

**Exit criteria**:
- shared packages are justified
- app-specific theme logic remains local
- imports are clean
- no identity bleed
- no pointless abstraction layers

---

### Phase 8 — Founder copy pass

**Goal**: Make the repo sound authored.

This is not where structure is invented. This is where wording gets sharpened.

**Prompt**: Use GORUNFREE — FOUNDER-LEVEL COPY PASS PROMPT

**Focus**:
- headlines
- subheads
- CTAs
- trust language
- consent language
- archive language
- casting language
- empty states
- metadata labels

**Exit criteria**:
- generic startup diction is gone
- recycled AI phrasing is gone
- both apps sound intentional
- copy fits brand truth without bloat

---

### Phase 9 — Ship-ready QA

**Goal**: Do the hard cleanup pass before handoff.

**Prompt**: Use GORUNFREE — SHIP-READY QA PROMPT

**Focus**:
- routes
- imports
- types
- hydration
- accessibility basics
- image/layout issues
- mobile regressions
- duplicate patterns
- dead code
- README truthfulness

**Exit criteria**:
- repo builds
- repo runs
- obvious dead code is removed
- weak patterns are tightened
- final commands reflect reality

**Final checkpoint**: After QA, checkpoint repo state, verify install/dev/build commands, verify final file tree, verify README truth.

---

## Canonical execution order

Run in this order:
1. GORUNFREE — FULL EXECUTION SUPERPROMPT
2. GORUNFREE — SHARED CONTENT CONTRACT PROMPT
3. GORUNFREE — ROUTE MAP BLOCK
4. GORUNFREE — NOIZYFISH DESIGN SYSTEM PROMPT
5. GORUNFREE — NOIZYVOX DESIGN SYSTEM PROMPT
6. GORUNFREE — NOIZYFISH CONTENT MODEL PROMPT
7. GORUNFREE — NOIZYVOX DATA MODEL PROMPT
8. NOIZYFISH page/building-block prompts
9. NOIZYVOX page/building-block prompts
10. GORUNFREE — NOIZYFISH CLOUDFLARE ARCHITECTURE PROMPT
11. GORUNFREE — NOIZYVOX CLOUDFLARE ARCHITECTURE PROMPT
12. GORUNFREE — MONOREPO STRUCTURE UPGRADE PROMPT
13. GORUNFREE — FOUNDER-LEVEL COPY PASS PROMPT
14. GORUNFREE — SHIP-READY QA PROMPT

---

## What belongs where

**Shared packages should own**:
- reusable UI primitives
- base config
- shared content types
- metadata helpers
- status chips if structure-only
- generic filter/search primitives
- generic layout helpers

**NOIZYFISH should own**:
- archive content
- lineage content
- legacy copy
- archive route logic
- archive visual treatment
- archive-specific metadata expression

**NOIZYVOX should own**:
- creator/voice mock data
- consent content
- trust content
- casting logic
- dashboard language
- rights-control styling and interaction tone

---

## Route guidance

### NOIZYFISH

**Prefer**:
- /
- /about
- /archive
- /archive/[slug]
- /lineage

**Avoid**:
- unnecessary nesting early
- archive subtrees that do not yet serve the MVP

### NOIZYVOX

**Prefer**:
- /
- /about
- /onboarding
- /dashboard
- /consent
- /casting
- /trust

**Avoid**:
- deeply nested dashboard trees too early
- fake settings sprawl
- dynamic route volume before real data needs it

---

## Cloudflare realism guidance

**Use these assumptions**:
- Next.js can target Cloudflare Workers through a documented compatibility path
- static-first MVP is the safest starting point
- D1 should hold structured relational data later
- R2 should hold larger assets later
- KV should be used only where simple fast key-value access actually helps
- Workers endpoints should start small and practical

**Do not**:
- invent unsupported deploy commands
- imply immutable state without implementing an append-only verified model
- claim cryptographic proof where only placeholders exist
- treat architecture notes as finished enforcement

---

## Recovery strategy if Claude Terminal drifts

If a pass starts getting vague or bloated:
1. stop page volume
2. return to current phase goal
3. ask for:
   - files changed
   - exact decisions made
   - unresolved weak spots
4. narrow the next prompt to one block only
5. checkpoint before proceeding

**Use smaller building blocks when**:
- type drift appears
- copy becomes generic
- route ownership gets muddy
- one app starts visually bleeding into the other
- infrastructure notes become fantasy

---

## Definition of done

The NOIZY build is ready for founder review when:
- monorepo installs cleanly
- both apps run locally
- both apps build cleanly
- shared packages are coherent
- route ownership is clear
- content contracts are stable
- NOIZYFISH feels archival, oceanic, calm, and authored
- NOIZYVOX feels creator-first, intimate, structured, and trustworthy
- mobile layouts feel intentional
- README files reflect reality
- Cloudflare integration docs are practical
- QA has removed obvious dead weight

---

## Final principle

**Sequence is leverage.**

Do not build page beauty before structure exists.
Do not build route volume before route ownership is clear.
Do not polish copy before the system stops moving.
Do not let shared packages flatten brand soul.

Build the bones. Then the routes. Then the atmosphere. Then the voice.

---

## Additional Building Blocks

### GORUNFREE — CHECKPOINT BLOCK

```
You are Claude Terminal in GORUNFREE mode.

Task:
Checkpoint the repo at the end of this phase.

Do:
1. summarize what changed
2. list files created or updated
3. list commands that currently work
4. list unresolved weak spots
5. state whether the repo is ready for the next phase

Rules:
- concise
- concrete
- no filler
- no vague confidence language

Return:
- checkpoint summary
- readiness verdict
```

### GORUNFREE — APP ROUTER LAYOUT BLOCK

```
You are Claude Terminal in GORUNFREE mode.

Task:
Define layout ownership for the NOIZY monorepo using Next.js App Router conventions.

Determine:
- root layout responsibilities
- app-local layout responsibilities
- shared header/footer ownership
- page container ownership
- metadata ownership
- route-group usage if justified
- where not to overuse nesting

Rules:
- keep layout boundaries readable
- shared structure only where justified
- preserve separate souls for NOIZYFISH and NOIZYVOX
- avoid abstraction churn

Return:
- layout plan
- file ownership notes
- recommended layout files
```

### GORUNFREE — STATIC VS DYNAMIC BLOCK

```
You are Claude Terminal in GORUNFREE mode.

Task:
Decide what remains static in MVP and what becomes dynamic later.

Evaluate for both apps:
- homepage content
- about content
- archive listings
- archive details
- lineage/trust content
- dashboard panels
- consent states
- casting search
- activity timeline

Rules:
- prefer static-first where possible
- make future dynamic evolution explicit
- optimize for lower deployment risk on Cloudflare Workers
- no fake backend confidence

Return:
- static MVP list
- future dynamic list
- reasons for each
```

### GORUNFREE — NEXT.JS CLOUDFLARE READINESS BLOCK

```
You are Claude Terminal in GORUNFREE mode.

Task:
Audit the current Next.js app structure for Cloudflare deployment readiness.

Check:
- static-first assumptions
- route-handler needs
- env var usage
- image assumptions
- font assumptions
- runtime-sensitive code
- dynamic requirements that can wait
- anything likely to complicate Workers deployment

Rules:
- use Cloudflare-compatible assumptions only
- no fake certainty
- keep MVP risk low
- identify what should stay simple

Return:
- readiness notes
- risk list
- simplification recommendations
```

### GORUNFREE — PACKAGE OWNERSHIP BLOCK

```
You are Claude Terminal in GORUNFREE mode.

Task:
Decide exact ownership boundaries for apps and packages.

Packages:
- ui
- config
- content
- shared-types only if justified

For each package/app define:
- what it owns
- what it must not own
- what can be imported from it
- what should remain local
- naming/import conventions

Rules:
- readable imports
- no identity bleed
- no over-centralization
- no pseudo-platform abstraction

Return:
- package ownership matrix
- import rules
- files/docs updated
```

### GORUNFREE — FINAL HANDOFF BLOCK

```
You are Claude Terminal in GORUNFREE mode.

Task:
Prepare the final handoff summary for the NOIZY monorepo.

Include:
- what was built
- repo structure
- commands to install/dev/build
- shared package overview
- NOIZYFISH overview
- NOIZYVOX overview
- Cloudflare readiness note
- remaining weak spots
- recommended next build steps

Rules:
- concise
- technical
- real
- no marketing filler

Return:
- handoff summary
- exact commands
- next-step list
```
