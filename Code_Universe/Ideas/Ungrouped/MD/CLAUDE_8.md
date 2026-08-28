# DreamChamber — MC96ECO Creative Expedition Engine v4.0

## Build & Test

```bash
swift build          # Build the DreamChamber library
swift test           # Run all 77 tests (zero failures expected)
```

## Architecture

Swift Package (macOS 14+ / iOS 17+) with one dependency: GRDB.swift for SQLite + FTS5.

- **Sources/Lucy/** — All production code
  - `State/` — SwiftKnowledgeBase (GRDB), HybridQueryEngine (BM25 + semantic fusion), KnowledgeForge (ingestion), LocalEnvironment
  - `Models/` — KnowledgeNode, NoisyBrand (MC96ECO registry), SacredInvariants (75/25 split, consent, revocation)
  - `MCP/` — MCPBridge (13 tools), SemanticRouter (Apple NaturalLanguage 512-d embeddings)
  - `Agents/` — AgentRouter (Gabriel/Lucy/Claude), AgentIdentity
  - `Knowledge/` — BrandKnowledgeManifest (31 pre-seeded nodes), RecursiveForge
  - `Creative/` — CreativeCanvas, CreativePipeline, HapticComposer, CreativeIntelligence
  - `DreamChamberEngine.swift` — Main orchestrator singleton
- **Tests/LucyTests/** — KnowledgeForgeTests.swift (77 tests)
- **ops/** — Deployment scripts and runbooks
  - `cloudflare/` — Tunnel config, Worker, preflight, email routing
  - `noizynet/` — Studio chain deploy, signal daemon, ENGR_KEITH

## Sacred Invariants (never violate)

- 75/25 royalty split (creator/platform) — hardcoded, not configurable
- Consent required (explicit, revocable)
- Revocation is sacred (no penalty)
- Auto-compensation on revocation

## Agents

- **GABRIEL** — Executor (infra, deploy, DevOps) — owns NOIZY.AI, NOIZYLAB, DREAMCHAMBER
- **LUCY** — Sovereign (creative, brand, voice) — owns NOIZYVOX, FISHMUSICINC, NOIZYKIDZ
- **CLAUDE** — Analyst (code, analysis, refactor) — advises NOIZY.AI, NOIZYLAB, DREAMCHAMBER

## Ops

- Cloudflare Zero Trust tunnel protects `heaven.noizy.ai` and `gabriel.dreamchamber.noizy.ai`
- ENGR_KEITH on `:7006`, signal daemon on `:9699`, AU Net on `:97100`
- HEAVEN Worker routes `/keith/*` to KEITH tunnel
- See `ops/cloudflare/CLOUDFLARE_STABILIZATION_RUNBOOK.md` for full deployment sequence
