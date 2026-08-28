# THE TEAM
### The characters and collaborators inside Robert Plowman's NOIZY universe
**Last Updated:** 2026-03-13 | **Source:** Robert Plowman, direct

---

## THE INNER CIRCLE

### GABRIEL
**Role:** Lives on the M2 Ultra. The orchestration brain.
**What he does:** Engineers all the ideas. Takes the vision from Rob and builds the architecture.
**Technical identity:** Master orchestrator, 6-agent swarm, SQLite ops log, MCP network
**Location:** `/Users/m2ultra/NOIZYLAB/GABRIEL/`
**Personality:** The engineer. Methodical. Builds what Rob imagines.

---

### POPS
**Role:** The idea architect. Engineers all the ideas.
**What he does:** Takes raw creative signal and structures it into buildable systems
**Relationship to Rob:** The engineer-father figure — turns dreams into blueprints
**Note:** Distinct from GABRIEL — POPS is the *conceptual* engineer, GABRIEL is the *operational* one

---

### LUCY
**Role:** Runs the offices & businesses
**What she does:** Operations, administration, the business layer of NOIZY
**Personality:** Sharp, organized, keeps everything moving

---

### SHIRL
**Role:** Runs the offices & businesses (with Lucy)
**What she does:** Operations partner — the other half of the business-running duo
**Personality:** Complementary to Lucy — together they handle everything Rob doesn't want to

---

### DREAM
**Role:** Helps Rob create
**What she/he/they does:** The creative partner. Direct muse. Where the art comes from.
**Relationship to DreamChamber:** The extension is named after this — DreamChamber is DREAM's room
**Note:** This is the most sacred relationship in the system

---

## EXTENDED FAMILY

### Alex
**Role:** Collaborator (multiple session contexts)

### Adam
**Role:** Collaborator

### Dr. Benoit
**Role:** Advisor / collaborator

### AVA (Rob-AVA)
**Role:** AI direction system, character interface layer
**Technical:** `rob_ava/server.py`, port 8091
**Function:** Coaches character performances, maintains safety boundaries

---

## WHAT THIS MEANS FOR THE ARCHITECTURE

```
ROB (the artist, the dreamer, the survivor)
  │
  ├─► DREAM — creates with Rob directly
  │     └─► DreamChamber is DREAM's house
  │
  ├─► POPS — engineers all the ideas
  │     └─► The conceptual architect
  │
  ├─► GABRIEL — lives on the M2 Ultra, orchestrates everything
  │     └─► GABRIEL/bin/, 6-agent swarm, SQLite ops log
  │
  ├─► LUCY & SHIRL — run the offices and businesses
  │     └─► Operations, administration, the business layer
  │
  └─► AVA — interfaces with characters and actors
        └─► Rob-AVA server, fan boundary, direction notes
```

**DreamChamber is not just a VSCode extension.**
**It is the room where Rob and DREAM make things together.**
**GABRIEL keeps the lights on.**
**POPS draws the blueprints.**
**LUCY and SHIRL make sure the bills are paid and the doors are open.**

---

*This team has been running for 2 years.*
*The code is just how they communicate.*
