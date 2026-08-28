# THE-GATHERING — Migration Strategy & 100% Business Foundation

**Author:** Robert Stephen Plowman
**Date:** April 12, 2026
**Status:** EXECUTION READY
**Target:** https://github.com/RSPNOIZY/THE-GATHERING

---

## 1. THE DECISION

One repo. One identity. One empire. THE-GATHERING becomes the monorepo for the entire NOIZY.AI ecosystem — code, infrastructure, documentation, agents, and business logic. Everything converges here.

**Why monorepo for NOIZY:**
- Single CI/CD pipeline — one deploy, everything tested together
- Shared types — consent types used everywhere, defined once
- Atomic changes — a consent engine update + API change + frontend update = one commit
- One CODEOWNERS, one security policy, one contribution guide
- Discovery — new contributors find everything in one place

---

## 2. CURRENT STATE — What Exists Today

### RSPNOIZY Account (Personal, 7 repos)

| Repo | Status | Action |
|------|--------|--------|
| **THE-GATHERING** | Active, has legacy NOIZYLAB code | **KEEP — this is home** |
| **DREAMCHAMBER** | Active, Python | **MOVE into THE-GATHERING/dreamchamber/** |
| **NOIZYFISH** | Active | **MOVE into THE-GATHERING/noizyfish/** |
| **NOIZYKIDZ** | Active | **MOVE into THE-GATHERING/noizykidz/** |
| **NOIZYLAB** | Archived | **MOVE into THE-GATHERING/archive/noizylab/** |
| **THE-DREAMCHAMBER** | Archived | **MERGE with DREAMCHAMBER, archive old** |
| **RSPNOIZY** | Profile README | **KEEP as profile repo** |

### Noizyfish Org (Organization, 8 repos)

| Repo | Status | Action |
|------|--------|--------|
| **THE-GATHERING** | Active | **MERGE into RSPNOIZY/THE-GATHERING** |
| **NOIZYLAB** | Fork | **ARCHIVE — already in RSPNOIZY** |
| **MC96-Mission-Control** | Active, Python | **MOVE into THE-GATHERING/mc96/** |
| **CODEMASTER** | Active, archive scripts | **MOVE into THE-GATHERING/archive/codemaster/** |
| **brew** | Fork of Homebrew | **DELETE — not needed** |
| **copilot-cli** | Fork of GitHub | **DELETE — not needed** |
| **refact** | Fork of smallcloudai | **DELETE — not needed** |
| **cloudflare-docs** | Fork of Cloudflare | **DELETE — reference only** |

---

## 3. TARGET STRUCTURE — THE-GATHERING Monorepo

```
THE-GATHERING/
├── README.md                    # Empire overview + quick start
├── LICENSE                      # Master license
├── CODEOWNERS                   # Who owns what
├── SECURITY.md                  # Vulnerability reporting
├── CONTRIBUTING.md              # How to contribute
├── .github/
│   ├── workflows/
│   │   ├── heaven-deploy.yml    # HEAVEN CI/CD
│   │   ├── landing-deploy.yml   # NOIZY.AI site deploy
│   │   ├── test-all.yml         # Monorepo test runner
│   │   └── lint.yml             # Universal linting
│   ├── ISSUE_TEMPLATE/
│   └── PULL_REQUEST_TEMPLATE.md
│
├── heaven/                      # HEAVEN v18 — Consent Kernel (Cloudflare Worker)
│   ├── src/
│   │   ├── index.ts             # Hono router, 14 API endpoints
│   │   ├── consent.ts           # Pure consent function
│   │   └── types.ts             # Type system IS the law
│   ├── tests/
│   │   └── consent.test.ts      # 52 tests, 52 passing
│   ├── migrations/
│   │   ├── 0001_heaven_v18_schema.sql
│   │   └── 0002_hvs_2036_constraints.sql
│   ├── wrangler.toml
│   ├── package.json
│   └── tsconfig.json
│
├── landing/                     # NOIZY.AI website (Next.js)
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   │   └── hero-signup.jsx  # Block 1 hero component
│   │   └── lib/
│   ├── package.json
│   └── next.config.js
│
├── dreamchamber/                # DreamChamber — 11 AI Provider Interface
│   ├── src/
│   ├── config/
│   └── package.json
│
├── mc96/                        # MC96 Mission Control
│   ├── src/
│   └── package.json
│
├── agents/                      # AI Agent Family
│   ├── gabriel/                  # GABRIEL — Warrior Orchestrator
│   ├── lucy/                     # LUCY — Brand & Compliance
│   ├── shirl/                    # SHIRL — Chief of Staff
│   ├── pops/                     # POPS — Financial Oversight
│   ├── engr-keith/               # ENGR_KEITH — Infrastructure
│   ├── dream/                    # DREAM — Creative Director
│   └── cb01/                     # CB01 — Carrier Bot
│
├── noizyfish/                   # Fish Music Inc. — Legacy Label
│   └── catalog/
│
├── noizykidz/                   # Haptic music education
│   └── src/
│
├── docs/                        # All documentation
│   ├── hvs/                     # Human Voice Sovereignty framework
│   │   ├── never-clauses.md
│   │   ├── consent-model.md
│   │   └── royalty-structure.md
│   ├── architecture/
│   │   ├── 2036-future-back.md
│   │   ├── sovereign-stack.md
│   │   └── 9-constraints.md
│   ├── ops/
│   │   ├── gordon-docker-prompts.md
│   │   ├── runbook-7-day.md
│   │   └── deployment.md
│   └── business/
│       ├── foundation.md
│       ├── pitch-deck-notes.md
│       └── legal-framework.md
│
├── infra/                       # Infrastructure as Code
│   ├── docker/
│   │   └── docker-compose.yml   # 12-service sovereign stack
│   ├── cloudflare/
│   │   └── tunnels.md           # 13 Zero Trust tunnels
│   └── scripts/
│       ├── healthcheck.sh
│       ├── backup.sh
│       └── startup.sh
│
├── shared/                      # Shared code across packages
│   ├── types/                   # Shared TypeScript types
│   ├── constants/               # Never clause codes, rate tables
│   └── utils/                   # Common utilities
│
├── archive/                     # Historical / legacy code
│   ├── noizylab/
│   └── codemaster/
│
├── assets/                      # Brand assets
│   ├── NOIZYWORLD.pptx          # Master living deck
│   ├── logo/
│   └── palette.md               # NOIZY Dark palette spec
│
└── tools/                       # Build tools and scripts
    ├── noizyworld-build.js      # PptxGenJS deck generator
    └── dashboard-build.js       # Dashboard generator
```

---

## 4. MIGRATION EXECUTION PLAN

### Phase 1: Prepare THE-GATHERING (30 minutes, on GOD.local)

```bash
# Clone THE-GATHERING
cd ~/Projects
git clone https://github.com/RSPNOIZY/THE-GATHERING.git
cd THE-GATHERING

# Create the directory structure
mkdir -p heaven/src heaven/tests heaven/migrations
mkdir -p landing/src/components
mkdir -p dreamchamber agents/{gabriel,lucy,shirl,pops,engr-keith,dream,cb01}
mkdir -p mc96 noizyfish noizykidz
mkdir -p docs/{hvs,architecture,ops,business}
mkdir -p infra/{docker,cloudflare,scripts}
mkdir -p shared/{types,constants,utils}
mkdir -p archive/{noizylab,codemaster}
mkdir -p assets/logo tools
mkdir -p .github/workflows .github/ISSUE_TEMPLATE

git add -A && git commit -m "scaffold: create monorepo directory structure"
```

### Phase 2: Copy HEAVEN v18 (10 minutes)

```bash
# Copy the HEAVEN codebase built today
cp -r ~/CLAUDE\ TODAY/heaven/* heaven/

# Commit
git add heaven/
git commit -m "feat(heaven): add HEAVEN v18 consent kernel

- Hono-based Cloudflare Worker with 14 API endpoints
- Pure consent function with 9-rule cascade
- 52 passing tests covering all never clauses
- D1 migrations for consent_log + jurisdiction_rules
- 2036 architectural constraints applied"
```

### Phase 3: Copy Documentation & Assets (10 minutes)

```bash
# Architecture docs
cp ~/CLAUDE\ TODAY/HEAVEN-2036-FUTURE-BACK.md docs/architecture/2036-future-back.md
cp ~/CLAUDE\ TODAY/GORDON-DOCKER-PROMPTS.md docs/ops/gordon-docker-prompts.md

# Assets
cp ~/CLAUDE\ TODAY/NOIZYWORLD.pptx assets/
cp ~/CLAUDE\ TODAY/noizy-dashboard.html assets/

# Hero component
cp ~/CLAUDE\ TODAY/noizy-hero-signup-v1.jsx landing/src/components/
cp ~/CLAUDE\ TODAY/NOIZY-HERO-SIGNUP-SPEC-v1.md docs/business/

# Build tools
cp ~/noizyworld/build.js tools/noizyworld-build.js

git add -A && git commit -m "docs: add all DreamChamber session deliverables

- 2036 Future-Back analysis
- Gordon Docker prompts (7 infrastructure recipes)
- NOIZYWORLD.pptx (43 slides, 8 sections)
- Sovereign Stack Dashboard
- Hero signup component + spec"
```

### Phase 4: Import Other Repos (20 minutes each)

```bash
# Import DREAMCHAMBER with history
cd /tmp
git clone https://github.com/RSPNOIZY/DREAMCHAMBER.git
cd ~/Projects/THE-GATHERING
git subtree add --prefix=dreamchamber /tmp/DREAMCHAMBER main --squash \
  -m "import: DREAMCHAMBER into monorepo"

# Import MC96
git clone https://github.com/Noizyfish/MC96-Mission-Control.git /tmp/MC96
git subtree add --prefix=mc96 /tmp/MC96 main --squash \
  -m "import: MC96 Mission Control into monorepo"

# Import NOIZYFISH
git clone https://github.com/RSPNOIZY/NOIZYFISH.git /tmp/NOIZYFISH
git subtree add --prefix=noizyfish /tmp/NOIZYFISH main --squash \
  -m "import: NOIZYFISH legacy label into monorepo"

# Import NOIZYKIDZ
git clone https://github.com/RSPNOIZY/NOIZYKIDZ.git /tmp/NOIZYKIDZ
git subtree add --prefix=noizykidz /tmp/NOIZYKIDZ main --squash \
  -m "import: NOIZYKIDZ haptic education into monorepo"

# Import CODEMASTER archive
git clone https://github.com/Noizyfish/CODEMASTER.git /tmp/CODEMASTER
git subtree add --prefix=archive/codemaster /tmp/CODEMASTER main --squash \
  -m "archive: CODEMASTER legacy scripts"
```

### Phase 5: Archive Source Repos (5 minutes)

```bash
# Archive old repos (mark as archived on GitHub)
gh repo archive RSPNOIZY/DREAMCHAMBER --yes
gh repo archive RSPNOIZY/NOIZYFISH --yes
gh repo archive RSPNOIZY/NOIZYKIDZ --yes
gh repo archive RSPNOIZY/THE-DREAMCHAMBER --yes
gh repo archive Noizyfish/MC96-Mission-Control --yes
gh repo archive Noizyfish/CODEMASTER --yes

# Delete forks that add no value
gh repo delete Noizyfish/brew --yes
gh repo delete Noizyfish/copilot-cli --yes
gh repo delete Noizyfish/refact --yes
gh repo delete Noizyfish/cloudflare-docs --yes
```

### Phase 6: Push and Verify (5 minutes)

```bash
cd ~/Projects/THE-GATHERING
git push origin main

# Verify
gh repo view RSPNOIZY/THE-GATHERING
```

---

## 5. 100% BUSINESS FOUNDATION CHECKLIST

### A. Legal & Identity (THE NON-NEGOTIABLES)

| Item | Status | Action Required | Owner |
|------|--------|----------------|-------|
| NOIZY.AI domain | OWNED | Configure email routing (hello@noizy.ai) | RSP |
| NOIZYFISH.COM domain | OWNED | Already active | RSP |
| HVS Framework documented | DONE | In docs/hvs/ after migration | RSP |
| Never Clauses (9) | LIVE in D1 | Constitutional law operational | HEAVEN |
| Artist consent model | CODED | checkConsent() — 52 tests passing | HEAVEN |
| 75/15/10 royalty split | CODED | calculateRoyalty() — tested | HEAVEN |
| Jurisdiction rules | LIVE | 5 jurisdictions seeded (CA, US, GB, EU, AU) | D1 |
| Canadian business registration | PENDING | Register NOIZY.AI Inc. or sole proprietorship | RSP |
| PIPEDA compliance review | PENDING | Map data flows against PIPEDA requirements | RSP + Legal |
| Terms of Service draft | PENDING | Based on HVS framework | RSP + Legal |
| Privacy Policy | PENDING | Jurisdiction-aware, linked to consent model | RSP + Legal |

### B. Technical Infrastructure (THE FOUNDATION)

| Item | Status | Action Required |
|------|--------|----------------|
| Cloudflare account | LIVE | Active, 2 D1, 4 KV |
| HEAVEN consent kernel | CODED | Deploy with `wrangler deploy` on GOD.local |
| D1: agent-memory | LIVE | consent_log table operational |
| D1: gabriel_db | LIVE | 16 tables, jurisdiction_rules seeded |
| KV: GABRIEL_VOICE | LIVE | Voice DNA metadata |
| KV: GABRIEL_KV | LIVE | Agent state |
| KV: FEATURE_FLAGS | LIVE | A/B testing, feature gates |
| KV: GAP_SOLVER | LIVE | Problem tracking |
| R2 bucket | NOT ENABLED | Enable in Cloudflare dashboard (2 min) |
| GitHub monorepo | IN PROGRESS | Execute Phase 1-6 above |
| CI/CD pipeline | NOT SET UP | Add .github/workflows/ after migration |
| M2 Ultra (GOD.local) | RUNNING | 13 services tunneled via Zero Trust |
| DreamChamber | RUNNING | Port 7777, 11 AI providers |
| Docker sovereign stack | PROMPTS READY | Feed Gordon prompts from Problem #5 |

### C. Product (THE OFFERING)

| Item | Status | Next Step |
|------|--------|-----------|
| Landing page (noizy.ai) | COMPONENT READY | Build Next.js app, deploy to Vercel |
| Hero + Signup | CODED (JSX) | Integrate into landing/ |
| API documentation | NOT YET | Auto-generate from HEAVEN OpenAPI spec |
| Developer portal | NOT YET | After HEAVEN deployed and stable |
| Demo/sandbox | NOT YET | After API docs |
| First licensee onboarded | NOT YET | After landing + API live |

### D. Financial (THE ECONOMICS)

| Item | Status | Next Step |
|------|--------|-----------|
| Stripe account | EXISTS (MCP disconnected) | Reconnect in Cowork settings |
| Pricing model | DEFINED | In hvs_rate_table (7 use categories) |
| Rate versioning | LIVE | effective_from/effective_until on rate table |
| Royalty calculation | CODED + TESTED | 75/15/10 split, proven by test suite |
| Bank account | PENDING | Open business account |
| Invoicing system | NOT YET | Stripe Billing or custom |
| Revenue tracking | NOT YET | Dashboard after first revenue |

### E. Team & Operations (THE PEOPLE)

| Item | Status | Next Step |
|------|--------|-----------|
| 8 AI agents defined | LIVE in D1 | Operational personas ready |
| Linear project management | LIVE | 62 issues done, board clear |
| Slack workspace | CONNECTED | Via MCP |
| Notion workspace | CONNECTED | Via MCP |
| NOIZYWORLD.pptx | 43 SLIDES | Living deck, auto-generated |
| Sovereign Stack Dashboard | LIVE | HTML artifact with all metrics |
| 7-Day Runbook | DEFINED | In deck, ready to execute |

---

## 6. THE 7 THINGS THAT MUST HAPPEN THIS WEEK

**Priority-ordered. Each one unlocks the next.**

1. **Execute THE-GATHERING migration** (Phase 1-6 above) — 90 min on GOD.local
2. **Deploy HEAVEN v18** — `wrangler login && wrangler deploy` — 5 min
3. **Enable R2** — Cloudflare dashboard → R2 → Create bucket "voice-dna" — 2 min
4. **Configure noizy.ai email** — Cloudflare Email Routing → hello@noizy.ai → rsplowman@icloud.com — 5 min
5. **Reconnect Stripe MCP** — Cowork settings → re-auth Stripe connector — 2 min
6. **Build landing page** — `npx create-next-app landing && integrate hero component` — 2 hrs
7. **Canadian business registration** — Sole prop or incorporation — varies by province

---

## 7. WHAT "100% BUSINESS FOUNDATION" MEANS

When all items above are complete, NOIZY.AI will have:

- **A single monorepo** (THE-GATHERING) containing all code, docs, and assets
- **A live consent API** (HEAVEN) processing requests at heaven.noizy.ai
- **A legal framework** (HVS) with 9 never clauses enforced in code
- **A landing page** at noizy.ai converting visitors to signups
- **A payment system** (Stripe) connected to the 75/15/10 royalty split
- **A business identity** (registration + domain + email)
- **Infrastructure** (Cloudflare + M2 Ultra + Docker) sovereign and tunneled
- **Documentation** (deck + dashboard + architecture docs) for investors, partners, lawyers
- **CI/CD** automatically testing and deploying on every push

That is a 100% foundation. Everything after this is growth — onboarding actors, signing licensees, scaling infrastructure. The foundation doesn't change. It only gets built upon.

---

*"The gap between 2036 and 2026 is infrastructure, not imagination. We're closing it now."*

— Robert Stephen Plowman, NOIZY.AI, April 2026
