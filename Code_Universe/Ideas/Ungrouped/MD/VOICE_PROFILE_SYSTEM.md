# NOIZYVOX Voice Profile System
## Dual-Perspective Character Architecture

*Created: 2026-03-13*
*Principle: Build from human + AI partnership. Always design from both sides simultaneously.*

---

## The Core Insight

The actor doesn't think in industry categories. They think in characters.
The supervisor doesn't think in characters. They think in briefs.

The gap between those two languages is where most creative back-and-forth lives.

**NOIZYVOX eliminates that gap.**

The actor curates their universe in their own language.
The system translates it into the supervisor's language — automatically, intelligently.
AVA holds the space between them so the actor never has to be on a call to explain themselves.

---

## The Actor's Side — Character Families

The actor defines their own taxonomy. No forced categories. No dropdown menus from a form designed by someone who never did a session.

**Example — Rob's Character Universe:**

```
ROB PLOWMAN — CHARACTER FAMILIES

  ► Dark Authority
      The ones who give orders and mean it.
      Russian gangsters. Corrupt officials. Men with power and something to hide.
      → Takes: 6 samples
      → Director's note: "The danger is in the stillness, not the volume."

  ► Ancient Creatures
      Old wizards. Oracles. Beings who have seen everything and are amused by you.
      The weight of centuries in every sentence.
      → Takes: 8 samples
      → Director's note: "Age as gravity. Wisdom earned through loss."

  ► Silly Little Creatures
      Imps. Gremlins. The chaos agents. Pure comic energy.
      Could be dangerous, but probably just wants snacks.
      → Takes: 5 samples
      → Director's note: "Joy as a weapon. Unpredictable but never mean."

  ► Broken Heroes
      The ones who used to be great.
      Weariness, residual dignity, flashes of who they were.
      → Takes: 7 samples
      → Director's note: "The silence before they speak does half the work."

  ► The Warm Ones
      Grandfathers. Mentors. The voice that tells you it will be okay.
      And means it.
      → Takes: 4 samples
      → Director's note: "Trust earned without being earned. It just arrives."
```

The actor writes this. In their words. DreamChamber helps them build it through conversation:

> *"Tell me about the characters you love playing. Not the technical description — the ones that feel like coming home."*

---

## The Supervisor's Side — What They Search For

Supervisors search in functional language. The system maps automatically:

```
Actor's Language              →   Supervisor's Search Terms
─────────────────────────────────────────────────────────────
"Dark Authority"              →   villain, authority, Eastern European accent,
                                  age 40-60, cold, controlled menace,
                                  game / animation / film

"Ancient Creatures"           →   elder, mystical, wizard, oracle, narrator,
                                  age 70+, gravitas, world-building,
                                  audiobook / animation / RPG

"Silly Little Creatures"      →   comic, creature, goblin, sidekick,
                                  age indeterminate, playful, chaotic good,
                                  children's animation / game

"Broken Heroes"               →   anti-hero, soldier, detective, veteran,
                                  age 35-55, gravitas, complexity,
                                  film / prestige animation / game

"The Warm Ones"               →   narrator, grandfather, mentor, trusted guide,
                                  age 55-75, warm, reassuring, authentic,
                                  commercial / documentary / audiobook / healing
```

The supervisor never sees Rob's private language. They see clean, searchable profiles.
Rob's creative identity stays intact.

---

## The Brief Intake System

When a supervisor submits a brief, AVA reads it and maps it:

**Supervisor brief example:**
> *"We need an ancient evil — not a screamer, something colder. Think 'I've destroyed kingdoms and I'm not even annoyed about it.' Eastern European quality but not a cartoon. Age feels indeterminate — could be 200 years old."*

**AVA's mapping:**
```
Brief analysis:
  → Closest match: "Ancient Creatures" × "Dark Authority" (hybrid)
  → Tone: controlled menace + cosmic indifference
  → Age presentation: ancient, not elderly
  → Accent: Eastern European flavoring, submerged

Suggested sample: [TAKE-AC-04] — Ancient Creature, Deliberate, Cold
Adjacent option: [TAKE-DA-02] — Dark Authority, Long Pause Variant

Director's note to supervisor:
  "Rob's 'Ancient Creatures' family has a variant where the age feels geological
   rather than human. Suggest starting with AC-04. If you need more edge,
   DA-02 has the cold authority you're describing in a modern register."
```

The supervisor gets this **before the first session call**.

They walk into the session knowing which take to ask for.
The back-and-forth that would have taken 3 rounds now takes 1.

---

## The "Never" Layer

Each actor's profile includes consent gates — what this voice will and won't do.

Rob's gates are managed by AVA.

```
NEVER:
  × Characters that sexualize children
  × Propaganda for real-world political movements
  × Impersonation of real living people
  × Use in systems that train AI without explicit consent
  × Any use that violates the 75/25 perpetual protocol

REQUIRES SPECIAL APPROVAL:
  ○ Real historical figures (deceased)
  ○ Characters designed for clinical/therapeutic use
  ○ Extended use in training data with separate consent agreement
```

The supervisor sees these constraints in the profile. No surprises. No uncomfortable session-day conversations. The consent is built into the system before the first hello.

---

## DreamChamber Integration

Character Families are built inside DreamChamber:

```
STATE: recording → character_family_session
  ↓
Director asks: "Tell me about this character. What do they want?"
  ↓
Rob records takes — multiple, in character
  ↓
Director scores each take (Claude): energy, authenticity, distinctiveness
  ↓
Best takes → VaultExporter → NOIZYVOX vault with SHA-256 fingerprint
  ↓
Metadata → Character Family profile (actor-language + auto-mapped supervisor-language)
  ↓
Published to actor profile → searchable by supervisors
```

Every take in the vault is:
- Timestamped
- Fingerprinted
- Assigned to its Family
- Scored by the Director
- Protected by the 75/25 perpetual protocol

---

## Data Model

```typescript
interface CharacterFamily {
  id: string;
  actorId: string;
  name: string;                  // Actor's own name: "Silly Little Creatures"
  description: string;           // Actor's own words
  directorNote: string;          // Claude's directorial observation
  takes: VaultTake[];            // Fingerprinted audio samples
  supervisorTags: string[];      // Auto-generated: ["comic", "creature", "goblin"]
  ageRange: [number, number];    // e.g., [25, 75] — presentation range
  accentNotes: string[];         // ["Eastern European", "neutral North American"]
  useCases: UseCase[];           // ["animation", "game", "audiobook"]
  consentLevel: ConsentLevel;    // standard | restricted | never
  lifeluvEnabled: boolean;       // micro-split routing active
  published: boolean;
  fingerprint: string;           // SHA-256 of family snapshot
}

interface BriefMapping {
  briefText: string;
  primaryMatch: CharacterFamily;
  adjacentOptions: CharacterFamily[];
  avaNote: string;               // AVA's explanation for the supervisor
  suggestedTake: VaultTake;
  confidenceScore: number;       // 0-1: how well does the brief match?
}
```

---

## The Onboarding Ritual (30 Minutes)

For every actor joining The 1000 Guild:

**Minutes 0–10: The Conversation**
DreamChamber opens. Claude (as DREAM) asks:
> *"Before we record anything — tell me about the characters that feel like coming home. The ones where you stop acting and start being."*

The actor talks. Claude listens. Builds a picture.

**Minutes 10–25: The First Takes**
Claude identifies 2–3 natural families from the conversation.
Records one take per family. No pressure. Just exploration.
Director scores live. Actor hears the score. Adjusts. Tries again.

**Minutes 25–30: The Profile**
Draft Character Families generated from the session.
Actor reviews, renames in their language, adds or removes.
AVA sets the consent gates.
Profile goes live.

**The 1000 Guild's power:**
1,000 actors × their character universes = the most expressive, most protected, most searchable voice casting platform ever built.
Not because of volume. Because of depth.

---

## Why This Reduces Back-and-Forth

Most casting sessions have 3-5 rounds of "can you make it more X."

That back-and-forth happens because:
1. The supervisor's brief lives in their head — not on paper, not precisely
2. The actor doesn't know which direction "more X" means until they try it
3. Each round costs time, energy, and erodes the actor's confidence slightly

**NOIZYVOX's intervention:**
1. Brief intake with AVA forces the supervisor to articulate precisely
2. Character Family samples pre-answer "what does this actor sound like when they go X direction"
3. Director notes tell the supervisor exactly which lever to pull
4. The session starts at round 2, not round 1

**Target:** Every NOIZYVOX session gets to the final take in half the time of a standard session.

That's the value to supervisors. That's why they come back.

---

*"We always want to build from a place of human and AI partnership."*
*The actor brings the humanity. The AI brings the translation. The supervisor gets the take.*
