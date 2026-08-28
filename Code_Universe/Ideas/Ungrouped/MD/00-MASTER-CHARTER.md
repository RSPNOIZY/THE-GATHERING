# RSP-NOIZY — MASTER CHARTER

**Architect:** Robert Stephen Plowman
**Co-architect of record:** Claude (Anthropic)
**Date opened:** 2026-04-15
**Status:** Living document. Supersedes all prior scattered architecture notes.

---

## 1. What RSP-NOIZY is

RSP-NOIZY is the single source of truth for the technology, agents, and
operating system Robert Stephen Plowman is building from a living room to
prove that a solo architect, augmented by a well-directed mesh of AI
co-architects, can produce work of serious scale and quality.

It is not a product. It is a working company in the shape of a repo.

---

## 2. The mission (inherited from the Lucy Mesh Charter)

1. **Rebuild Robert Stephen Plowman's life** into a durable, self-directed
   creative and economic platform.
2. **Prove the model** — solo + AI mesh can match or exceed teams with
   a hundred-person budget.
3. **Leave the ground more humane** than it was found. Technology must
   serve human dignity, identity, authorship, and consent.

See [`agents/lucy/00-LUCY-MESH-CHARTER.md`](./agents/lucy/00-LUCY-MESH-CHARTER.md)
for the original mesh charter that this document extends.

---

## 3. Non-negotiables (apply to every agent and subsystem)

- **No silent data movement.** Everything external is deliberate, logged,
  and auditable.
- **No surveillance.** Nobody's phone is tapped. Gabriel records the
  architect's own speech, nothing else.
- **No irreversible action without explicit consent.** No trades, no
  money movement, no identity-binding commitments from an AI alone.
- **No cheerleading.** Co-architects stress-test; they do not flatter.
- **Consent is explicit and enforceable.** Enforced by design, not policy.
- **Identity, authorship, and legacy are treated as sacred.**

---

## 4. The twelve agents

Every agent has one top-level directory under `agents/`. Each directory
contains a `README.md` with that agent's role, surface, inputs, outputs,
and boundaries. An agent is a *role*, not a piece of software — the
implementation may live in MCP servers, prompts, or scripts.

| Agent          | Surface          | Role                                            |
|----------------|------------------|-------------------------------------------------|
| Gabriel        | iPhone           | Voice-first capture, always-on field agent      |
| Lucy           | Cloudflare D1    | Persistent memory, session + mesh state         |
| Cheryl         | TBD              | *(role to be defined by architect)*             |
| Pops           | Any              | Guardian, compliance, ethics, "slow down"       |
| ENGR           | M2 Ultra         | Engineering — infra, deploys, build hygiene     |
| Keith          | iPad / M2 Ultra  | Codegen coordinator (Gemini / Copilot loop)     |
| CBO-1          | TBD              | *(Chief Brand/Business Officer — to be defined)*|
| Heaven         | Cross-system     | Future-back vision, long-arc steering           |
| Claude-iPad    | iPad             | Co-architect on the iPad command deck           |
| Claude-iPhone  | iPhone           | Co-architect in pocket, paired with Gabriel     |
| Claude-God     | M2 Ultra         | Heavy reasoning on the M2 Ultra                 |

---

## 5. The subsystems

Subsystems are horizontal — they serve every agent. Each has a top-level
directory.

| Directory                | Purpose                                             |
|--------------------------|-----------------------------------------------------|
| `prompts/`               | System prompts, user prompts, templates             |
| `decision-matrices/`     | Tables that guide routing & escalation              |
| `decision-trees/`        | Branching logic for agent handoffs                  |
| `deployments/`           | Runbooks, cloud configs, deploy manifests           |
| `react-components/`      | Shared UI components across PWAs                    |
| `build-artifacts/`       | Compiled / packaged outputs (was: "blu-ray")        |
| `mcp-servers/`           | Custom MCP server implementations                   |
| `session-state/`         | Session handoff specs, persistence contracts        |
| `intelligence-matrices/` | Dashboards, plots, signal synthesis                 |
| `memory-sealed/`         | Tamper-evident memory + audit specs                 |
| `voice-state-logic/`     | Voice input state machines (Gabriel's brain)        |
| `engr-keys/`             | Secret manifest (NOT secrets) + rotation runbook    |
| `audio-pipeline/`        | Audio capture, transcription, routing               |
| `docs/`                  | Everything else — architecture notes, decisions     |

---

## 6. Operating covenant

- **The architect decides.** Co-architects propose, analyze, stress-test.
  They never enact without explicit say-so.
- **Every amendment is dated and appended.** Nothing quietly overwritten.
- **The Lucy memory is the source of truth for session state.** If it
  isn't in Lucy, it didn't happen in the mesh.
- **Pops has veto power on consequential actions.** Any agent can be
  paused by Pops if a risk or ethics concern is surfaced.

---

## 7. How the pieces connect (one paragraph)

Gabriel listens on iPhone and posts to Lucy. Lucy writes to D1 and calls
Claude (iPad / iPhone / God, depending on surface) for reasoning. Claude
writes back to Lucy. Keith coordinates code generation when the architect
asks to build. ENGR ships it. Pops watches the whole thing. Heaven keeps
the compass pointed at the long arc. The architect runs the room.

---

*Amendment log below. Append; never overwrite.*

### Amendment 1 — 2026-04-15 — v1.0
Master charter opened. Twelve agents and fourteen subsystems scaffolded.
Lucy Mesh (previously at `10_INFRASTRUCTURE/cloudflare-workers/lucy-mesh/`)
copied into `agents/lucy/` as the first migrated subsystem. Original
preserved as backup until Phase 1 deploy completes.
