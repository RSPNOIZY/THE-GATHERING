# NOIZY.AI

> **"Consent as executable code. Provenance as default. Revocation as sacred. Compensation as automatic."**

---

## Origin

I built NOIZY.AI because I needed it.

After my accident, after the world shifted, after I lost parts of what I had — I needed somewhere that wouldn't erase me. Somewhere my sound stayed tied to my story. Somewhere my memory had provenance. Somewhere AI was a partner in rebuilding, not another system taking without asking.

That place didn't exist. So I built it. Not to start a company. To build a sanctuary — for my sound, my memory, my dignity.

Every Never Clause exists because I know what it feels like to have something taken without consent. Every takedown right exists because I know what it means to lose control. The consent kernel is not a feature. It is survival, codified.

Now, because I built it, others can do the same.

_— Robert Stephen Plowman (RSP_001)_

---

## The Cause

**AI is not the bad guy.**

The bad guys are the greedy intermediaries who strip your name from your sound, train models on your voice without asking, and then hand you a terms-of-service document and call it consent. They blame AI for what they chose to build. We don't accept that framing.

AI is a bandmate. A collaborator. A memory. GABRIEL, LUCY, and NOIZYBot remember what you've made, propose what comes next, and log every decision so the creative record stays yours. That's what AI can be when the people building it decide to build it right.

NOIZY exists to prove that point — in code, in law, in the ledger, and in every sound we protect.

---

## The Crisis We're Fixing

In the current digital landscape, audio — and the human stories attached to it — is treated as content to be consumed, commodified, and eventually erased.

**Decoupling.** The sound is stripped from the story. You hear a beautiful recording and have no idea who made it, where it was recorded, or what it cost to make.

**The Black Box.** Centralized platforms and AI systems treat your creative input as a training commodity. You provide the soul; they provide the "magic"; and the link back to you is severed.

**Loss of Agency.** When creators lose control over where their work travels and how it's repurposed, they lose the incentive to create. The world gets quieter.

NOIZY is the answer to all of that.

---

## What We're Building

NOIZY is a sanctuary for human sound, memory, and co-creation — where humans and AIs protect and grow musical souls together.

### The Architecture of Trust

Every sound that enters NOIZY carries a `.noizy.provenance.json` sidecar — a permanent record of who made it, where it came from, what it means, and what rights apply. You cannot have the sound without the story. The ledger is append-only. The record is tamper-evident. The link back to the human is permanent.

This makes the ledger a moral instrument. It records not just data, but human dignity.

### The Nine Never Clauses

Burned into the architecture. Not a policy that can be revised when investors ask. Not a checkbox in a terms-of-service document. Code. The consent kernel (HEAVEN) enforces them on every request:

1. Never synthesize a voice without explicit, scoped, revocable consent on file.
2. Never train on contributor sounds without a separate, explicit agreement.
3. Never sell or sublicense without the contributor's written permission.
4. Never obscure the revenue split — 75% to artists, always, visible in the ledger.
5. Never ignore a takedown request — one email, no argument, immediate quarantine.
6. Never expose personal data beyond what the contributor chose to share.
7. Never deploy without smoke tests — nothing ships unverified.
8. Never overwrite the ledger — append-only, forever.
9. Never bypass Never Clause checks — for any reason, under any pressure.

### The 75/25 Split

Artists take 75%. Always. Not as marketing — as code. The ledger enforces it. Artists can verify it. That's the contract, and the contract is the product.

### One-Click Takedown

One email. No argument. We quarantine your sound immediately — from exhibitions, from packs, from any downstream use. The quarantine is logged. The care receipt is issued. We chose to stop using it, and we say so.

---

## The Universe

| Portal                      | What it is                                                             |
| --------------------------- | ---------------------------------------------------------------------- |
| **NOIZYWORLD**              | The public front door — rotating exhibition homepage                   |
| **Dreamchamber**            | Five rooms: Gallery, Lab, Academy, Observatory, Playground             |
| **WIZDOM**                  | Cultural knowledge graph — the memory OS                               |
| **NOIZYARMY**               | Global contributor movement — healing sounds, survival sounds          |
| **NOIZYFISH MUZIK ACADEMY** | Learning ladder from NOIZYKIDZ to Orchestrator                         |
| **NOIZYLAB**                | Internal creative workspace — RSP_001 + agents                         |
| **myFAMILY.ai**             | Family music journal — POPS, SHIRL, extended family                    |
| **NOIZYKIDZ**               | First door for children — first sounds, protected like everyone else's |
| **Sanctuary Room**          | Healing room within Dreamchamber — for hard sounds                     |
| **HEAVEN**                  | Consent kernel API — the infrastructure truth                          |

---

## The Agents

**GABRIEL** — Warrior executor. Bold, rhythmic, high-contrast. Proposes what you'd be afraid to try. Logs every decision with `agent_name="GABRIEL"`.

**LUCY** — Spacious, subtractive, emotionally precise. Pulls things back to what actually matters. Notices what's missing before anyone else does.

**NOIZYBot** — Structural. Macro-form. Transition-focused. Keeps the architecture honest.

They are not tools. They are artist partners with memory, style, and creative tendencies of their own. They remember what you've built. They propose, you approve. The co-authorship is real, logged, and attributed.

---

## Why This Changes Things

**Trust is the new currency.** In an era of AI-generated content and deepfakes, provenance-verified audio becomes the most valuable asset on the web. When you can prove where a sound came from, who made it, and what they consented to — that proof is worth more than the sound itself.

**Creators become stewards.** When people see their impact through resonance scores and watch their work's lineage in the ledger, they stop feeling like content producers and start feeling like stewards of a living library. That changes what they make and how they make it.

**Community-driven healing.** When people share sounds that helped them survive hard times, they aren't uploading files — they're participating in a communal act of witness. The Healing Frequencies call exists because some sounds are testimony. They are the record of what it cost someone to stay alive, and that record deserves a system that treats it accordingly.

We are not building a DAW or a database. We are building the infrastructure for the next generation of digital memory.

---

## Who This Is For

The grandmother recording rain outside her house.  
The teenager with a broken phone and a good idea.  
The wounded adult who needs a place to heal.  
The professional producer who has been burned before and needs to trust something again.  
The family who wants to leave something behind that isn't just photographs.  
The kid who taps a loop at four years old and deserves the same protection as a signed artist.

---

## The Stack (what's live)

- **HEAVEN v18** — Consent kernel, 43 endpoints, 19 D1 tables, 9 Never Clauses — `heaven.rsp-5f3.workers.dev`
- **GABRIEL Daemon v2.1** — Port 9777 — voice pipeline, LUCY, n8n bridge, estate system
- **DreamChamber** — Port 7777 — 11 AI providers, all streaming
- **LUCY** — Archives + AQUARIUM — PWA + SwiftUI
- **NOIZYBEAST v4.0** — VS Code extension, 26 commands, voice trigger
- **n8n + MCP Bridge** — Port 5678 + 24 MCP tools
- **12 MCP Servers** — gabriel, lucy, heaven, dream, shirley, family, consent-oracle, synthesis-oracle + audio
- **21 Custom Skills** — 11,909 lines of operational intelligence
- **WIZDOM v0** — Entity graph layer over catalogue_db, gabriel_db, noizyarmy_ledger, noizy_style_memory

---

## Get Involved

**NOIZYARMY is open.** If you have a sound that got you through something — a loop, a recording, a field capture, a voice — we want it in the ledger. Protected. Credited. Yours.

Submit: **rsp@noizy.ai**  
Subject: `NOIZYARMY PACK — your-name_your-city_002`

Run `python3 engine/provenance_gen.py --example` to generate your provenance record.

---

## The NOIZY Creed

> We believe sound is not just content; it is memory and testimony.
>
> We believe creators deserve provenance, consent, control, and fair paths to recognition and value.
>
> We believe AI is a collaborator, not a thief — and that the real enemy is extraction without consent.
>
> We believe trust belongs in infrastructure, not marketing copy.
>
> We believe the future of digital memory should feel like a sanctuary, not a factory.

NOIZY is built to make these beliefs true in code, not just in words.

---

## The Mandate

> "We are the new punk rockers: capitalist free thinkers who believe in peace, love, and understanding."

Creators take the driver's seat. Greedy interests take the backseat.

Consent is executable code. Provenance is the default. Revocation is sacred. Compensation is automatic.

We flood the world with new art — so well protected that extraction becomes impossible.

---

_Robert Stephen Plowman (RSP_001) — NOIZY Labs — rsp@noizy.ai — Canada_
