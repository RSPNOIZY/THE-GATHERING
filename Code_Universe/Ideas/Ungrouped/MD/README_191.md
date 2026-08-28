# decision-matrices/

Routing and escalation tables. Answer questions like:

- Which Claude surface handles this request? (iPad / iPhone / God)
- When does Pops get invoked?
- When does a task escalate from Keith to ENGR?

## Format
Prefer Markdown tables over code. These should be readable by the
architect on a phone at 2am.

## First matrices to author
- [ ] `surface-routing.md` — which device handles what
- [ ] `escalation.md` — when each agent escalates up
- [ ] `pops-triggers.md` — exact conditions that summon Pops
