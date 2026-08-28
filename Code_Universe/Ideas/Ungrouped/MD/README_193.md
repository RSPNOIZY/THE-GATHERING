# THE-GATHERING

**NOIZY.AI — The United Empire of Consent-Native Voice Infrastructure**

One repo. One identity. One mission: ensure that every human voice is sovereign, every use is consensual, and every artist gets paid.

---

## What Is This?

THE-GATHERING is the monorepo for the entire NOIZY.AI ecosystem. Everything lives here — the consent kernel, the AI agents, the landing page, the infrastructure, and the documentation. If it touches NOIZY, it's in this repo.

## Architecture

```
heaven/          → Consent Kernel (Cloudflare Worker) — the constitutional law
landing/         → NOIZY.AI website (Next.js)
dreamchamber/    → 11 AI Provider streaming interface
mc96/            → Mission Control browser panel
agents/          → 8 AI agents (GABRIEL, LUCY, SHIRL, POPS, ENGR_KEITH, DREAM, CB01, HEAVEN)
noizyfish/       → Fish Music Inc. legacy label
noizykidz/       → Haptic music education
docs/            → All documentation
infra/           → Docker, Cloudflare, deployment scripts
shared/          → Shared types and utilities
assets/          → NOIZYWORLD.pptx, brand assets, dashboards
tools/           → Build scripts
archive/         → Historical code
```

## The Consent Kernel (HEAVEN)

HEAVEN is a Cloudflare Worker that enforces Human Voice Sovereignty. It is the single source of truth for consent in the NOIZY empire.

**9 Never Clauses** — Constitutional law that cannot be overridden:
1. No political use
2. No sexual content
3. No weapons/violence
4. No deception/deepfakes
5. No hate speech
6. No unauthorized transfer
7. No surveillance
8. System integrity required
9. No voice DNA export

**Royalty Split:** 75% Artist / 15% NOIZY / 10% Union

**52 tests. 52 passing.**

## Quick Start

```bash
# Clone
git clone https://github.com/RSPNOIZY/THE-GATHERING.git
cd THE-GATHERING

# Run HEAVEN locally
cd heaven
npm install
npm run dev    # → http://localhost:8787

# Run tests
npm test       # → 52 tests, all passing
```

## The Stack

- **Edge:** Cloudflare Workers, D1, KV, R2
- **Local:** M2 Ultra (GOD.local), 13 Zero Trust tunneled services
- **AI:** 11 providers via DreamChamber, 8 specialized agents
- **Frontend:** Next.js on Vercel
- **CI/CD:** GitHub Actions

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md).

## License

All rights reserved. Robert Stephen Plowman / NOIZY.AI.

Human Voice Sovereignty (HVS) framework applies to all voice-related code and data.

---

*Consent is law. Build forward.*
