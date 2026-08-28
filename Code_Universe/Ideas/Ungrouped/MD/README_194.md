# NOIZY.AI — Team Canon

**Single source of truth for the AI team.**

**Operator:** Robert Stephen Plowman
**Entity:** NOIZYFISH INC.
**AI Team:** CLAUDE · GABRIEL · LUCY
**Established:** 2026-04-13

---

## What this folder is

Every artifact the AI team needs to do its job — audits, architecture, runbooks, commands, governance — lives here. One location. One naming convention. One registry.

If it's not in Team Canon, it's not canonical.

## What this folder is not

- Not a working scratchpad. Drafts stay in `/CLAUDE TODAY/` until reviewed, then get promoted here.
- Not a share-out inbox. Distribution to the AI team is a pull model: agents read from Canon; the operator publishes to it.
- Not a dumping ground. Every file here has an entry in `_index.md`.

---

## Folder structure

```
Team Canon/
├── README.md                    ← you are here
├── _index.md                    ← the registry (every artifact, by date, version, status)
├── 00_Agent_Briefings/          ← role + context per agent (CLAUDE.md, GABRIEL.md, LUCY.md)
├── 01_Foundation/               ← audit, architecture, runbook
├── 02_Command_Pack/             ← OpenCode commands + MCP scaffolds
└── 03_Governance/               ← Consent-as-Code, Data Classification, Incident Response
```

---

## Distribution protocol

1. **Operator** (Robert Stephen Plowman) reviews any artifact in `/CLAUDE TODAY/`.
2. **Operator** copies the approved file into the appropriate Team Canon subfolder.
3. **Operator** updates `_index.md` with the new entry (or asks CLAUDE to update it).
4. **Agents** (CLAUDE, GABRIEL, LUCY) read from Team Canon. They do not write to it.

This is a **pull model**. No agent has write access to Canon. The operator is the only writer. This keeps authorship and provenance clean.

---

## Agent Briefings — Start Here

Each agent has a briefing file describing their role, boundary, and standing context:

- [CLAUDE.md](00_Agent_Briefings/CLAUDE.md) — Co-architect, document builder, strategic stress-tester
- [GABRIEL.md](00_Agent_Briefings/GABRIEL.md) — Session memory, voice annotation, thread preservation
- [LUCY.md](00_Agent_Briefings/LUCY.md) — *[role to be defined by operator]*

When an agent joins a new session, its first read is its briefing file. Everything else builds from there.

---

## Versioning

- Artifacts carry a version suffix: `-v1.0.docx`, `-v1.1.md`.
- Minor revisions (typos, clarifications) → version bump (`v1.0` → `v1.1`).
- Substantive changes (new sections, overturned decisions) → major bump (`v1.x` → `v2.0`).
- Superseded versions are never deleted — they move to `_archive/` with an entry in `_index.md`.

---

**Peace. Consent. Rigor. Dignity.**

**GORUNFREE.**
