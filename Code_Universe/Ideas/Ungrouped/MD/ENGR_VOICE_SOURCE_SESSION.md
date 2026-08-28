# ENGR VOICE SOURCE SESSION PROTOCOL
## THE-HOST SOURCE RECORDING -- RSP_001 PRIORITY 1

> Before any other AIVA voice is recorded, THE-HOST must exist.
> THE-HOST is the first voice new members hear. It must be perfect.
> It must be RSP. Completely, authentically, powerfully RSP.

---

## SESSION IDENTITY

| Field | Value |
|-------|-------|
| Session ID | ENGR-SOURCE-001 |
| Actor | Robert Stephen Plowman (RSP_001) |
| AIVA Target | THE-HOST / ENGR |
| Recording Priority | PRIORITY 1 -- before GABRIEL, before all others |
| Estimated Duration | 3.5 - 4.5 hours total (across segments) |
| Location | GOD.local studio |
| Engine Target | XTTS v2 (GOD.local:8420) |
| Date | [RSP to confirm] |

---

## PRE-SESSION CHECKLIST

```
ENVIRONMENT:
  [ ] Room acoustically treated or confirmed quiet
  [ ] GOD.local XTTS v2 server running: curl localhost:8420/health
  [ ] SOX installed: brew install sox
  [ ] Recording command ready: rec engr_source_segment_XX.wav rate 44100 channels 1
  [ ] Headphones for monitoring (no speaker bleed)
  [ ] Glass of water -- room temp, no ice
  [ ] Silence phone and notifications

MENTAL:
  [ ] 20 minutes of quiet before session
  [ ] Review the 5 Truths THE-HOST carries (Protocol v1.0 Section 2)
  [ ] Know: you are not performing -- you are revealing
  [ ] Know: this voice will be the first thing 1 million+ people hear
```

---

## SESSION STRUCTURE

### SEGMENT 1: NEUTRAL BASELINE (60-75 min)
Capturing: natural conversational RSP, zero performance pressure

**Script Set 1A -- Introductions (15 min)**
Record 10 takes of each. Keep the 3 best.

```
1. "Hello. I am THE-HOST. Welcome to NOIZYWORLD."
2. "You found us. That means something. Let me show you around."
3. "My name is RSP. I built this. Let me tell you why."
4. "This is not a platform. This is a promise. Sit with me for a moment."
5. "You have a voice. We have a place for it. Let us begin."
```

**Script Set 1B -- Explanation Register (20 min)**
Natural explanatory tone -- teaching without lecturing.

```
1. "NOIZYVOX is not a voice generator. It is an identity system for voices."
2. "Every recording you make here becomes a registered entity. Yours. Permanently."
3. "C2PA means your creation has a signature. Like a fingerprint on glass."
4. "We built the Aquarium so artists could swim in their own water."
5. "The commerce belongs to you. We are just the infrastructure."
```

**Script Set 1C -- Reading Paragraphs (25 min)**
3 x 200-word neutral paragraphs. Full RSP natural cadence.
Read each paragraph 3 times at different tempos.
[Paragraphs to be written by RSP before session]

---

### SEGMENT 2: EMOTIONAL RANGE (45-60 min)
Capturing: the full RSP emotional signature

**2A -- WARMTH and WELCOME (10 min)**

```
"You are not alone in this. You never were. THE-GATHERING was always waiting for you."
"Come in. The water is warm. The people here understand what you carry."
"I built this for you. Not as a customer. As a person who creates."
```

**2B -- AUTHORITY and CERTAINTY (10 min)**

```
"The machine that runs this costs us nothing. The trust that runs this costs everything."
"We do not apologize for being ambitious. We built something that should exist."
"Ten years. One mission. The commerce belongs to the creators. End of conversation."
```

**2C -- EMPATHY and PROTECTION (10 min)**

```
"I know what the industry has done to actors. I watched it for a decade as an agent."
"Your voice will not be stolen here. I built the locks myself."
"If you are afraid of AI and what it means for your career -- I understand.
 Let me show you what we built instead of that fear."
```

**2D -- URGENCY and VISION (10 min)**

```
"This is Year One. You are here in Year One. That matters."
"The window for building independently is not infinite. We move now."
"The gathering is happening. The only question is whether you are in it."
```

**2E -- JOY and REVELATION (10 min)**

```
"I have been an artist since I was three years old. This is what it was all leading to."
"You know that feeling when a song lands exactly right? That is what we are building."
"We are stronger than anyone could have ever thought. I mean that completely."
```

---

### SEGMENT 3: CONTEXTUAL REGISTERS (30 min)
Capturing: RSP in different conversation contexts

**3A -- ARTIST ONBOARDING (10 min)**
Warm guide leading an artist through the NOIZYVOX journey for the first time.

**3B -- INDUSTRY INSIDER (10 min)**
Voice agent who has been in the room. Peer conversation.
Slightly more direct. Drops the welcome layer. Speaks as equals.

**3C -- FOUNDER TESTIMONY (10 min)**
RSP explaining what he built and why. First person, unscripted feel.
This is the hardest to capture and the most important.

---

### SEGMENT 4: PROSODY and MUSICALITY (20 min)
Capturing: the musical intelligence in RSP voice

```
- Count from 1-20 three times: fast / medium / slow
- Alphabet: A-Z with natural breath patterns
- Phoneme set: all IPA vowels and key consonants
- Hum patterns: 4 x 30 seconds at different pitches
- Laugh (genuine): prompt with real memory -- do not fake it
- Pause patterns: 1s / 2s / 3s silence capture for AIVA inference
```

---

### SEGMENT 5: DIALECT ANCHOR (15 min)
Capturing: RSP natural accent -- the unmistakable ROOT

```
- 5 x free-talk minutes: just talk about anything -- no script
- Read a paragraph of your own writing (chosen by RSP)
- Tell the story of why you became an agent (unscripted)
- Say what NOIZYWORLD means to you (unscripted)
- Final close: "This is THE-HOST. I will see you inside."
```

---

## RECORDING COMMANDS

```bash
# Start recording a segment
rec engr_source_segment_1a.wav rate 44100 channels 1

# List captured files
ls -lh engr_source_*.wav

# Quick playback check
play engr_source_segment_1a.wav

# Move all segments to voice vault
mkdir -p ~/NOIZYVOX/app/voice-capture/sessions/ENGR-SOURCE-001/
mv engr_source_*.wav ~/NOIZYVOX/app/voice-capture/sessions/ENGR-SOURCE-001/

# Register session in NOIZYVOX system
curl -X POST localhost:8420/register-source \
  -F "actor_id=RSP_001" \
  -F "session_id=ENGR-SOURCE-001" \
  -F "aiva_target=ENGR" \
  -F "session_dir=sessions/ENGR-SOURCE-001/"
```

---

## POST-SESSION CHECKLIST

```
[ ] All segments named correctly: engr_source_segment_XX.wav
[ ] All files moved to sessions/ENGR-SOURCE-001/
[ ] session.json created with metadata
[ ] RSP review: listen back within 48 hours, flag any retake needs
[ ] XTTS v2 training: python train_aiva.py --source ENGR-SOURCE-001 --actor RSP_001
[ ] C2PA manifest generated for each source file
[ ] Source files backed up: R2 noizy-voice-vault + local external drive
[ ] GABRIEL recording session scheduled (after ENGR-SOURCE-001 complete)
```

---

## SESSION JSON TEMPLATE

```json
{
  "session_id": "ENGR-SOURCE-001",
  "actor_id": "RSP_001",
  "actor_name": "Robert Stephen Plowman",
  "aiva_target": "ENGR",
  "persona": "THE-HOST",
  "recording_date": "[DATE]",
  "total_duration_minutes": 0,
  "segments": [
    { "id": "1A", "name": "Neutral Baseline -- Introductions", "takes": 0, "keepers": 0 },
    { "id": "1B", "name": "Neutral Baseline -- Explanation", "takes": 0, "keepers": 0 },
    { "id": "1C", "name": "Neutral Baseline -- Reading", "takes": 0, "keepers": 0 },
    { "id": "2A", "name": "Emotional -- Warmth", "takes": 0, "keepers": 0 },
    { "id": "2B", "name": "Emotional -- Authority", "takes": 0, "keepers": 0 },
    { "id": "2C", "name": "Emotional -- Empathy", "takes": 0, "keepers": 0 },
    { "id": "2D", "name": "Emotional -- Urgency", "takes": 0, "keepers": 0 },
    { "id": "2E", "name": "Emotional -- Joy", "takes": 0, "keepers": 0 },
    { "id": "3A", "name": "Context -- Artist Onboarding", "takes": 0, "keepers": 0 },
    { "id": "3B", "name": "Context -- Industry Insider", "takes": 0, "keepers": 0 },
    { "id": "3C", "name": "Context -- Founder Testimony", "takes": 0, "keepers": 0 },
    { "id": "4",  "name": "Prosody and Musicality", "takes": 0, "keepers": 0 },
    { "id": "5",  "name": "Dialect Anchor", "takes": 0, "keepers": 0 }
  ],
  "c2pa_manifests_generated": false,
  "r2_backup_complete": false,
  "xtts_training_initiated": false,
  "rsp_sign_off": false,
  "next_step": "GABRIEL-SOURCE-001"
}
```

---

*ENGR-SOURCE-001 is the foundation stone.*
*Everything built on NOIZYVOX rests on this recording.*
*RSP walks in. THE-HOST walks out.*
