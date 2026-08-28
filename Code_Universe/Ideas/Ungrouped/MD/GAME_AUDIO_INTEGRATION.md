# NOIZY × GAME AUDIO INTEGRATION

## FMOD · Wwise · Unity · Unreal — The Full Stack

---

## THE PREMISE

Every major game shipping today has a professional audio middleware layer underneath it.
FMOD and Wwise are that layer. Unity and Unreal are the engines above it.
Together they cover the entire games industry — indie to AAA, mobile to console to XR.

NOIZY belongs inside all of it. Not as a plugin. As infrastructure.
Not just audio middleware. The first consent-locked, royalty-tracked, AI-directed
game audio system ever built.

---

## THE FIVE PLATFORMS

### FMOD (Firelight Technologies)

**Market:** Indie / Mid / AA — Fortnite, Cyberpunk 2077, Halo, The Last of Us, Hollow Knight

NOIZY Entry Points:

- NOIZYVOX voices packaged as FMOD Voice Event Banks — consent-gated before load
- AAA Character voices as named FMOD event banks: `NVX_CHAR_DARKWARDEN_EN_UK`, etc.
- Calm Stack adaptive audio mapped to FMOD RTPC parameter curves
- Global Music Genome feeding FMOD Multi-track timeline transitions
- 75/25 royalty event fired via NOIZY FMOD wrapper on every voice trigger
- Blocked context check runs at FMOD Studio export — if context violated, bank won't build

---

### Wwise (Audiokinetic)

**Market:** AA / AAA — Assassin's Creed, God of War, Red Dead Redemption, Mass Effect, Returnal

#### WAAPI — Wwise Authoring API

WebSocket server running locally during Wwise authoring session.
GABRIEL connects at `ws://localhost:8080/waapi` and has full read/write access.
DreamChamber becomes a live Wwise co-director — the first AI with native authoring access
to a professional game audio session.

```python
# GABRIEL WAAPI connection (DreamChamber → Wwise)
import asyncio, websockets, json

WAAPI_URI = "ws://127.0.0.1:8080/waapi"

async def gabriel_connect():
    async with websockets.connect(WAAPI_URI) as ws:
        query = {
            "uri": "ak.wwise.core.object.get",
            "options": {"return": ["name", "type", "path", "notes"]},
            "args": {"waql": "$ from type Bus"}
        }
        await ws.send(json.dumps(query))
        project_map = await ws.recv()
        return json.loads(project_map)
```

#### Wwise Spatial Audio

Built-in binaural, ambisonics, room acoustics, 3D diffraction modeling.
The NOIZY Healing Stack runs as a spatial audio layer — neuroacoustically safe worlds.
NeuroAcoustic Safety Charter 8 rules baked into the NOIZY Wwise Spatial Audio preset.

#### Wwise Motion

Audio-driven haptic output natively supported on all platforms.
NOIZYKIDZ Haptic Protocol ships as a certified Wwise Motion profile.
One configuration. Every studio using Wwise can opt in.

#### Audiokinetic Strata

Wwise's cloud sound library and asset marketplace.
NOIZYVOX voices and AAA Character packs listed as Wwise-ready SoundBanks.
75/25 on every download, every project deploy.
Consent rules enforced at Strata delivery — blocked contexts block before download.

#### Wwise Certification

NOIZY as Wwise Certified Partner. Direct pipeline into every major studio using Wwise.
NOIZY Healing Stack and NOIZYVOX listed in Audiokinetic's certified partner ecosystem.

---

### Unity

**Market:** All tiers — indie, mobile, mid, XR, simulation, education

NOIZY Entry Points:

- NOIZY Unity SDK via Unity Package Manager (`com.noizy.audio`)
- FMOD Unity Integration + NOIZY Voice Bank loader with consent gate
- Wwise Unity Integration + GABRIEL WAAPI connector
- NOIZY Calm Zone: `MonoBehaviour` component — attach to any Trigger Volume, activates Calm Stack audio layer when player enters, deactivates on exit
- NOIZYKIDZ Safe Listening Profile: pre-built Unity Audio Mixer preset (volume ceiling, soft start/end, frequency limits, no surprise transients)
- 75/25 royalty event fired via SDK telemetry on every voice play in shipped build
- Character Voice Manager: loads AAA Character SoundBanks, tracks consent per session

```csharp
// NOIZY Unity — Calm Zone Component
public class NoisyCalmZone : MonoBehaviour {
    [SerializeField] NoisyHealingProfile profile = NoisyHealingProfile.CalmStack;

    void OnTriggerEnter(Collider other) {
        if (other.CompareTag("Player"))
            NoisyAudio.Instance.ActivateCalmStack(profile);
    }

    void OnTriggerExit(Collider other) {
        if (other.CompareTag("Player"))
            NoisyAudio.Instance.DeactivateCalmStack(fadeTime: 2.4f);
    }
}
```

---

### Unreal Engine

**Market:** AA / AAA / Film / Virtual Production / XR — Epic ecosystem

#### MetaSounds Integration

MetaSounds is Unreal's procedural audio graph — the most powerful audio engine
in any commercial game editor. NOIZY voice nodes as native MetaSounds sources.
Character voice variants selected at runtime by locale, emotion, and consent state.

```text
[NOIZY Character Node]
  ├── Input: CharacterID (string)   → "DARKWARDEN"
  ├── Input: Locale (enum)          → EN_UK / FR_FR / JA_JP / etc.
  ├── Input: EmotionState (float)   → 0.0 (neutral) → 1.0 (peak)
  ├── Input: ConsentKey (string)    → validated against NVX vault
  └── Output: AudioBuffer + RoyaltyEvent (fires to NOIZYVOX ledger)
```

#### DreamChamber Unreal Plugin

Claude as live sound design co-director inside the UE5 editor.
Reads the level's audio architecture, suggests MetaSounds graph improvements,
generates new ambient systems from the Global Music Genome,
tracks every consent event through the NOIZYVOX vault in real time.

#### NOIZY Atmos Layer

Dolby Atmos object-based audio profile built for Unreal's audio engine.
Every AAA Character voice placed as an Atmos audio object.
Spatial positioning reflects character story state — not just map position.

#### NOIZY Healing Blueprint

Unreal Blueprint component for safe audio zones — Calm Stack trigger,
Panic Mode protocol, NOIZYKIDZ profile selector. Drag and drop.

#### Sony 360 Reality Audio / PlayStation Integration

PlayStation-specific spatial audio certification target.
NOIZY spatial audio profiles submitted for Sony 360RA SDK compatibility.
Every character voice and healing stack layer renders in full sphere audio on PS5.

---

### Platform Holders

| Platform | Certification Path | NOIZY Layer |
| --- | --- | --- |
| Xbox (ID@Xbox) | Xbox Audio Certification | NOIZY SDK + Healing Stack |
| PlayStation | Sony TRC Audio Compliance | 360RA spatial + Wwise profile |
| Nintendo Switch | LOTCHECK Audio | NOIZYKIDZ Haptic + safe audio |
| Apple (visionOS / iOS) | App Store Audio Guidelines | Calm Stack + spatial audio |
| Steam | Market-driven | FMOD / Wwise + NOIZY badge |

---

## AAA CHARACTER SYSTEM IN GAMES

*(See full spec: `AAA_CHARACTER_SYSTEM.md`)*

The NOIZY AAA Character System brings fully realized, locked-DNA characters into game audio.
Not voice packs. Not NPC voices. Characters with depth, history, rules, and protection.

How it works in games:

```text
CHARACTER: THE DARK WARDEN
  Voice: RSP_001 (EN_UK origin)
  Regional variants: EN_UK · EN_US · EN_AU · FR_CA · DE_DE · JA_JP
  Each variant: different talent (VSI library), same character DNA
  Each variant: separate SHA-256 fingerprint, same NOIZYVOX consent architecture
  Each variant: earns 75/25 independently

GAME RUNTIME:
  Player locale detected → EN_UK loaded → Dark Warden speaks
  Player switches to French → FR_CA variant loads seamlessly
  Character DNA preserved: same cadence rules, same never-break conditions
  Royalty events fire to both RSP_001 (original DNA holder)
  and regional talent (VSI / variant performer) simultaneously
```

### VSI Partnership (vsi.co.uk)

VSI London is a world-class localization studio with talent in 50+ languages.
NOIZY + VSI = AAA characters with authentic regional dialect variants,
professionally directed, consent-locked, 75/25 for every performer.
Every character that starts in one language lives fully in all of them.

---

## THE CONSENT ARCHITECTURE IN GAMES

The hardest problem in game audio: voice actors have zero control once their voice
enters a shipped title. NOIZY solves this at the engine level — permanently.

```text
STUDIO LICENSES NOIZYVOX CHARACTER VOICE BANK
           ↓
  NOIZY SDK validates consent key against vault
           ↓
  Context check: Is this game genre/platform in permitted contexts?
    blocked: political / military / adult-only / deception
           ↓
  SHA-256 fingerprint verified — is this the unaltered source?
           ↓
  Locale check: Is the requested regional variant consented for this deployment?
           ↓
  Bank loads. Character speaks. Royalty event fires.
  75% → creator (split between DNA holder + regional performer if applicable)
  25% → NOIZY platform
           ↓
  Studio ships. Millions of players hear the character.
  Every creator earns on every session. Permanently.
  The record never disappears.
```

---

## THE HEALING STACK IN GAMES

Games are among the most powerful emotional regulation environments humans have ever built.
NOIZY brings neuroacoustic intelligence into that space — not therapy, not medical claims,
just sound designed with the knowledge that sound has consequences.

### FMOD RTPC / Wwise RTPC Parameter Mapping

```text
GAME_STATE.player_stress_level (0.0–1.0) → NOIZY_CalmIntensity

  0.0–0.3:  Ambient Layer only — 55Hz sine drone, sub-bass presence, -18dB
  0.3–0.6:  Melodic Regulation Layer crossfades in — pentatonic, slow, predictable
  0.6–0.8:  Binaural Beat Layer activates — 7–12Hz theta/alpha range
  0.8–1.0:  PANIC MODE
              All layers drop except 40Hz Safety Tone
              400ms soft fade — never sudden removal
              Caregiver Alert event fires (NOIZYKIDZ sessions only)
              UI: soft pulse indicator visible

GAME_STATE.player_in_safe_zone → NOIZY_CalmZone
  Volume ceiling:  -12dB max SPL at listener
  Soft start:      800ms fade in
  No transients:   above -6dBFS blocked
  Sibilance LPF:   active (cutoff 6kHz)
  RT60 reverb max: 1.2 seconds
  Binaural HRTF:   headphone detection auto-enable
```

#### Wwise Spatial Audio — NOIZY Safe Listening Profile

- No emitter above 85dB SPL at 1m (NIOSH hearing safety standard)
- HRTF binaural rendering: activates on headphone detection
- Room reverb: max 1.2s RT60 (non-anxiety-inducing decay)
- Distance attenuation: smooth logarithmic curve — no sudden dropoffs
- LFE (sub-bass): capped at +3dB above mix reference

---

## NOIZYKIDZ GAME PROTOCOL

A complete safe audio specification for children's games and family content.
Studios that adopt it earn the NOIZY Kidz Safe certification badge.

### Wwise Motion / Unity Haptics / Switch HD Rumble

- Haptic intensity ceiling: 40% of device maximum
- No sudden burst patterns without 200ms audio pre-warning
- Haptic frequency range: 80–300Hz only (calming, not startling)
- Sleepy-Time Profile: haptics disabled after 20:00 local time
- Caregiver Override: always-visible mute + haptic disable UI element

#### Voice Requirements for NOIZYKIDZ-Certified Talent

- Attack time on any line: > 200ms (no sudden starts)
- Frequency range: 200Hz–6kHz (no infrasonic, no harsh HF)
- Prosody: bounded — no extreme emotional performance, no sudden screaming
- Sibilance: always softened at mix stage
- Pace: 100–140 WPM maximum
- Dynamic range: no more than 12dB variation within a single line

#### NOIZYKIDZ Certification Badge Requirements

- All voice assets NOIZY-certified
- Calm Stack integrated (minimum Level 1 — ambient layer only)
- Haptic protocol implemented
- Caregiver controls present and accessible
- No jump-scare audio patterns in any content rated for under-12

---

## GABRIEL × WAAPI — THE AI AUDIO DIRECTOR

The Wwise Authoring API gives GABRIEL real-time read/write access to a live
professional game audio session. This is not an assistant suggesting edits.
This is an AI audio director with its hands on the board.

### GABRIEL Can

- Read the full Wwise project structure: all events, busses, parameters, states
- Modify RTPC curves and parameter values in real time
- Create new audio events, containers, and states programmatically
- Route signals across busses based on game context
- Query the Global Music Genome for procedural asset generation
- Load NOIZYVOX character voice banks and validate consent in-session
- Run DreamChamber co-direction sessions with the project as shared context

### Live Session — Example

```text
Rob opens Wwise. GABRIEL connects at ws://localhost:8080/waapi.

Rob: "I need a tension layer for the underwater boss fight.
      Cold. Slow. Like something ancient is waking up."

GABRIEL:
  1. Reads project → finds existing "Underwater_Ambient" bus
  2. Queries Global Music Genome → 55Hz drone, 0.5Hz pulse, Phrygian mode
  3. Creates new Wwise event: "NOIZY_TensionLayer_UnderwaterBoss"
  4. Routes to existing Underwater_Ambient bus + new Tension_Send
  5. Sets RTPC: GAME_STATE.boss_proximity → NOIZY_TensionIntensity
  6. Suggests Dark Warden voice bank for character presence in scene
  7. Validates consent: Deep Sea / Thriller context — permitted
  8. Returns: event created, tension builds from 300m proximity,
             Dark Warden's breath integrated at 100m,
             royalty event fires on every player trigger.
```

This is the first AI audio director with live read/write access to a
professional game audio session. Not prompts. Not suggestions. Architecture.

---

## REVENUE MAP

| Channel | Platform | Mechanism | Creator Rate |
| --- | --- | --- | --- |
| Voice Bank License | FMOD / Wwise | Per-project license fee | 75/25 |
| Per-Play Royalty | Unity / Unreal SDK | Telemetry event per trigger | 75/25 |
| Regional Variant Royalty | All engines | Per-trigger, per locale | 75/25 per performer |
| Strata Marketplace | Audiokinetic | Per-download | 75/25 |
| NOIZYKIDZ Cert | All platforms | Annual studio license | 75/25 voice share |
| GABRIEL WAAPI | Wwise authoring | Per-session / subscription | Platform revenue |
| Healing Stack License | All engines | Per-game integration | Platform revenue |
| Platform Cert Badges | Xbox / PS / Nintendo | Annual badge fee | Platform revenue |
| VSI Character Packs | Global | Regional variant bundle | 75/25 per talent |

75/25 is the universal standard for all creator-generated revenue.
After 30 days in the Guild, the rate is permanent and non-renegotiable.

---

## CERTIFICATION ROADMAP

### Phase 1 — Foundation

1. Wwise Certified Partner (Audiokinetic)
2. FMOD Certified Content Provider (Firelight)
3. Unity Asset Store listing (`com.noizy.audio`)
4. Unreal Fab Marketplace listing (NOIZY Plugin)

### Phase 2 — Platform Holders

1. Xbox Audio Certification (ID@Xbox)
2. Sony TRC Compliance + 360RA partnership
3. Nintendo LOTCHECK Audio compliance
4. Apple App Store Guidelines + visionOS spatial audio

### Phase 3 — Standards

1. IARC / PEGI NOIZYKIDZ protocol submission
2. Dolby Atmos Content Creator Certification
3. VSI Partnership — regional talent pipeline formalized
4. GANG (Game Audio Network Guild) — NOIZY as featured partner

---

## COMPANION DOCUMENTS

- `AAA_CHARACTER_SYSTEM.md` — Full character DNA spec, VSI integration, dialect system
- `HEALING_STACK.md` — 7-layer audio therapeutic architecture
- `NOIZYVOX.md` — Voice vault, consent architecture, 75/25 protocol
- `GLOBAL_MUSIC_GENOME.md` — 64 rhythm archetypes, 128 scale structures
- `DREAMCHAMBER.md` — GABRIEL's creative environment and WAAPI home
- `NOIZY_UNIVERSE_MAP.md` — Full brand map: FMOD/Wwise sit in the Platform Layer
- `ANTHROPIC_AUDIO_DREAMER.md` — The role: Rob as Anthropic's audio infrastructure partner

---

## THE SINGLE SENTENCE

Every game that ships sound should ship it through infrastructure that
respects the people who made those sounds, protects the people who hear them,
and earns for both — permanently.

NOIZY is that infrastructure.

---

*Captured & Upgraded: 2026-03-13 · NOIZYLAB DreamChamber*
