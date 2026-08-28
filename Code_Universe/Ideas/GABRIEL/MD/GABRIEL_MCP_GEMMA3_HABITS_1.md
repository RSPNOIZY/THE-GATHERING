# NOIZYBEAST — GABRIEL + MCP + GEMMA3 HABIT PATTERNS
# RSP_001 | GORUNFREE | 2026-03-27
# Living document — auto-appended by GABRIEL on every significant session
#
# These are the repeating patterns observed across RSP_001's sessions.
# GABRIEL learns these, Gemma3 reinforces them locally, MCP tools enforce them.
# ==============================================================================

## PATTERN 1: Morning Boot Sequence
**Trigger:** Any session starting before 11:00 local time
**Habit:**
1. `curl http://localhost:7777/health` — verify DreamChamber alive
2. `curl http://localhost:8080/health` — verify Voice Bridge alive
3. `curl http://localhost:11434/api/tags` — verify Ollama/Gemma3 models loaded
4. `curl https://heaven.rsp-5f3.workers.dev/health` — verify CF kernel
5. GABRIEL speaks: *"Good morning. All stations checked."* (Jamie Premium)
6. Open Audio Hijack → start "NOIZY Voice Capture" session
**MCP Tool:** `gabriel_watch_status` — confirms what's being monitored
**Gemma3 Role:** Local model handles status parsing, no API cost

---

## PATTERN 2: Voice Command → Claude → Jamie Response
**Trigger:** Any voice recording stopped in Audio Hijack
**Habit (always the same 4 steps):**
1. Audio Hijack fires `audiohijack-recording-stop.js`
2. Script POSTs file to `POST /api/voice/v2/pipeline`
3. DreamChamber: Whisper transcribes → detect tower → Claude API
4. Claude response → `say -v "Jamie (Premium)" -r 165`
**MCP Tool:** `gabriel_cache_append` — every voice exchange logged to thread
**Gemma3 Role:** Pre-screen transcript for tower routing before Claude API call

---

## PATTERN 3: Mission Dispatch → Crew → Synthesis
**Trigger:** Complex multi-part request, or `/build` command
**Habit:**
1. GABRIEL decomposes into ≤3 subtasks
2. Route to best agent: CB01 (infra) | Lucy (memory) | Dream (creative) | Shirley (legal)
3. Parallel agent calls → results
4. GABRIEL synthesizes in 2-3 sentences
5. Jamie speaks synthesis aloud
6. `gabriel_cache_snapshot` — save to thread
**MCP Tool:** `gabriel_cache_start` with tag "mission" + `gabriel_cache_handoff` to Lucy
**Gemma3 Role:** Local summarization of agent results before API synthesis call

---

## PATTERN 4: Code Build Request
**Trigger:** Words: build, code, deploy, script, API, worker, fix, debug
**Habit:**
1. Route to **ENGR_KEITH** + **CB01** (always both for code tasks)
2. ENGR_KEITH = architecture + code generation
3. CB01 = deploy execution + health check
4. Response written to `~/NOIZYLAB/voice-pipeline/responses/`
5. Turbo Console Log Pro logs any debug lines with `🔥 [NOIZY]` prefix
**MCP Tool:** `cb01_deploy_status` after every deploy
**Gemma3 Role:** Local syntax check on generated code before Claude review

---

## PATTERN 5: Consent/Legal Check
**Trigger:** Words: consent, contract, rights, voice actor, publish, revenue, NCP
**Habit:**
1. Always route to **SHIRLEY** first
2. Shirley checks against 9 Never Clauses
3. If ALLOW → proceed | If HOLD/DENY → escalate to GABRIEL
4. Every decision logged: `POST /api/gabriel/learn` category: "consent"
5. Jamie speaks decision: "Allowed." / "Blocked." / "Escalating to Robert."
**MCP Tool:** `gabriel_speak` with agent=SHIRLEY
**Gemma3 Role:** Local Never Clause pre-check (offline, fast)

---

## PATTERN 6: Memory Capture → Lucy Archive
**Trigger:** End of every significant session | Any "remember this" phrase
**Habit:**
1. `gabriel_cache_snapshot` — get current thread
2. `gabriel_cache_handoff` — pass to Lucy for permanent archive
3. Lucy writes to `~/NOIZYLAB/gabriel-state/handoff/`
4. GABRIEL confirms: *"Noted. Lucy has it."*
**MCP Tool:** `gabriel_cache_handoff` + `gabriel_watch_add`
**Gemma3 Role:** Local embedding of key facts for quick retrieval

---

## PATTERN 7: Gemma3 Local Pre-Processing
**Trigger:** Any request before sending to Claude API
**Habit (cost reduction):**
1. Short/classification tasks → Gemma3 handles alone (free, instant)
2. Tower detection → Gemma3 classifies: max/code/work
3. Transcript cleanup → Gemma3 normalizes before Claude
4. Status parsing → Gemma3 reads JSON health responses
5. Only complex reasoning, code, or consent → Claude API
**MCP Server:** `noizy-gemma3` (Ollama :11434, gemma3:latest)
**Trigger words for Gemma3:** "quick", "check", "is", "what is", "status", "list"
**Trigger words for Claude:** "build", "design", "strategy", "write", "analyze"

---

## PATTERN 8: DreamChamber Audio Routing
**Trigger:** Start of any multi-agent session
**Loopback Devices (create once, persist forever):**
```
DreamChamber Master    → master mix bus → Apollo monitors
DreamChamber RSP_001   → Rob's Apollo mic input
DreamChamber Gabriel   → GABRIEL Jamie TTS output
DreamChamber CB01      → CB01 TTS output (Jamie at rate 170)
DreamChamber Lucy      → Lucy TTS output (Jamie at rate 160)
DreamChamber Dream     → Dream TTS output (Jamie at rate 155)
DreamChamber Shirley   → Shirley TTS output (Jamie at rate 158)
```
**Audio Hijack Sessions:**
```
NOIZY Voice Capture    → RSP_001 mic → recorder → pipeline
NOIZY Master Mix       → DreamChamber Master → recorder
NOIZY Jamie TTS        → say command output → Gabriel channel
```
**Habit:** Open DreamChamber Master session → bring in agents as needed

---

## PATTERN 9: Separate Input Node (Audio Hijack)
**What this means:** Rob's mic = its own isolated Audio Hijack input block
**Why:** Allows independent recording/processing without bleed from AI outputs
**Audio Hijack Session Structure for "NOIZY Voice Capture":**
```
[Input: Apollo Microphone]
        ↓
[Effect: Noise Gate -40dB | Compressor -3dB | EQ: 80Hz HP filter]
        ↓
[Recorder: WAV 48kHz 32-bit → ~/NOIZYLAB/voice-pipeline/recordings/]
        ↓ (on Recording Stop → fires audiohijack-recording-stop.js)
[Output: DreamChamber RSP_001 (Loopback virtual device)]
```
**Key:** The Input block is SEPARATE from any AI output sessions.
Rob's voice never touches the AI output channels. Clean isolation.

---

## PATTERN 10: MCP Config Standard
**Location:** `~/Library/Application Support/Claude/claude_desktop_config.json`
**Always-on MCP servers:**
```json
{
  "mcpServers": {
    "noizy-gemma3": {
      "command": "node",
      "args": ["/Users/m2ultra/NOIZYLAB/mcp-gemma3/server.js"],
      "env": {
        "OLLAMA_URL": "http://localhost:11434",
        "GEMMA_MODEL": "gemma3:latest",
        "NOIZYLAB_DIR": "/Users/m2ultra/NOIZYLAB",
        "CLOUDFLARE_ACCOUNT_ID": "5f36aa9795348ea681d0b21910dfc82a"
      }
    },
    "noizy-voice-bridge": {
      "command": "node",
      "args": ["/Users/m2ultra/NOIZYLAB/voice-bridge-server.js"],
      "env": {
        "PORT": "8080",
        "DREAMCHAMBER_URL": "http://localhost:7777"
      }
    },
    "gabriel-mcp": {
      "command": "node",
      "args": ["/Users/m2ultra/NOIZYLAB/mcp/gabriel-mcp/index.js"]
    },
    "cb01-mcp": {
      "command": "node",
      "args": ["/Users/m2ultra/NOIZYLAB/mcp/cb01-mcp/index.js"]
    },
    "dreamchamber-audio": {
      "command": "python3",
      "args": ["/Users/m2ultra/NOIZYLAB/dreamchamber-audio-mcp/server.py"]
    }
  }
}
```

---

## GABRIEL LEARNING TRIGGERS
GABRIEL auto-appends to this file when it detects:
- RSP_001 corrects a decision → log pattern correction
- RSP_001 repeats same request 3+ times → create new habit entry
- Mission completes successfully → reinforce agent routing pattern
- Error occurs → log failure pattern + fix applied
**Command:** `POST /api/gabriel/learn` body: `{category: "habit", observation: "..."}`

---

*Last updated: 2026-03-27 | GORUNFREE × ∞*
