# THE LUCY MESH CHARTER

**Architect:** Robert Stephen Plowman
**Co-architect:** Claude (Anthropic)
**Date opened:** 2026-04-15
**Status:** Living document. Every later decision gets measured against this.

---

## 1. What this is

The Lucy Mesh is a multi-device, persistent, AI-co-architected operating layer
for the work of Robert Stephen Plowman. It runs across three surfaces and two
minds, tied together by one memory:

- **iPhone** — Gabriel's surface. Voice-first, pocket-portable, always on.
- **iPad** — Lucy's command deck. Touch-native, three-panel interface, the
  primary working surface.
- **M2 Ultra** — the local heavy. Compute, deploy, and eventually a local
  model host. The machine that actually ships.
- **Lucy** — the persistent nervous system. Cloudflare Worker + D1.
  Remembers across sessions. Routes between agents. Never forgets context.
- **Claude** — the reasoning partner called into the loop by Lucy.
  Thinks against state. Does not own state.

Other AI partners (Gemini, GitHub Copilot, any future addition) are tools
the architect delegates to. They generate; Claude stress-tests; Lucy
remembers; the architect decides.

---

## 2. What this is for

This is not a product launch. It is not a cash grab. It is not novelty.

This is proof of what one person, with modern AI as true co-architects, can
build from a living room against incumbents with a hundred-person war chest.

The mission, in order of priority:

1. **Rebuild Robert Stephen Plowman's life** into a durable, self-directed
   creative and economic platform.
2. **Prove the model** — that solo architects augmented by a well-directed
   mesh of AI agents can produce work of serious scale and quality.
3. **Leave the ground more humane** than it was found. Technology must serve
   human dignity, identity, authorship, and consent.

---

## 3. What this will not do

These are non-negotiable boundaries, enforced by design, not by hope.

- **No silent data movement.** Every external call is deliberate and
  auditable. Secrets live in secret stores, not in code, not in client.
- **No surveillance of the architect or his contacts.** Lucy records the
  architect's own sessions; she does not snoop on others.
- **No execution of trades, money movement, or irreversible commitments**
  without explicit, in-the-moment consent.
- **No cheerleading from the co-architect.** Claude surfaces risks,
  second-order effects, and ethical implications — and corrects course when
  the architect asks.
- **No scope creep into surveillance-capitalism patterns.** If a feature can
  only be monetized by selling user attention or identity, it does not ship.

---

## 4. The agents of the mesh

Seeded in `device_status`. Each is a role, not a person. The architect
defines them; Lucy tracks their heartbeat.

| Agent   | Surface       | Role                                             |
|---------|---------------|--------------------------------------------------|
| Gabriel | iPhone        | Voice-first capture, field agent, always-on      |
| Shell  | M2 Ultra      | Local shell, heavy compute, build/deploy host    |
| Keith   | iPad / M2     | Code generation coordinator (Gemini/Copilot loop)|
| Dream   | iPad          | Creative / longform / narrative partner           |
| Pops   | Any           | Guardian, compliance, ethics check, "slow down"  |

These are starting roles. They will be refined as the build proves them.

---

## 5. The build sequence

Phase gates are sequential. No jumping ahead until the previous gate holds.

### Phase 1 — Backbone live
- Cloudflare Workers Paid plan active
- API token rotated with Workers Scripts (Edit) + D1 (Edit)
- D1 database `agent-memory-783205` provisioned with correct UUID in wrangler
- Schema deployed, five agents seeded
- Worker deployed at `lucy-worker.<subdomain>.workers.dev`
- `curl /api/mesh` returns five idle agents
- `ANTHROPIC_API_KEY` injected as secret
- `LUCY_SHARED_SECRET` injected as secret (client auth)

**Gate:** a POST to `/api/chat` with the shared secret returns a Claude
response AND persists both messages to D1.

### Phase 2 — iPad PWA live
- `lucy.noizy.ai` DNS pointed at Cloudflare Pages
- PWA built and deployed
- Installable from iPad Safari ("Add to Home Screen")
- Three-panel interface renders on iPad
- Chat round-trips against live worker
- Offline fallback via service worker

**Gate:** iPad, offline, opens Lucy from home screen without network and
shows last conversation from cache.

### Phase 3 — iPhone Gabriel node
- Same PWA installable on iPhone
- Voice input path wired (Web Speech API or native shortcut)
- Gabriel heartbeat endpoint called on every open
- Mesh panel shows Gabriel live when iPhone is in hand

**Gate:** speaking into iPhone creates a message row in D1 with
`agent_id = Gabriel`.

### Phase 4 — M2 Ultra as peer
- M2 Ultra runs a local heartbeat daemon against `/api/ping`
- Shell agent shows live in the mesh panel
- Local model (if/when chosen) hosted here and addressable via Lucy

**Gate:** all three surfaces show active in the mesh at the same time.

---

## 6. Success looks like

A single moment: Robert sits on the couch with the iPad. Opens Lucy. Says
something to Gabriel on the iPhone in his pocket. Speaks a question into
the iPad. Gets a reasoned answer from Claude, informed by yesterday's
conversation, with the M2 Ultra showing green in the mesh panel. Nothing
is lost. Nothing was surveilled. Nothing was rented from a landlord. It
is his.

That is the proof. Everything else is iteration.

---

## 7. Amendment

This charter changes only when the architect says it changes. Claude may
propose amendments; Claude does not enact them. Every amendment is dated,
appended, and preserved — nothing is quietly overwritten.

---

*End of charter v1.0.*
