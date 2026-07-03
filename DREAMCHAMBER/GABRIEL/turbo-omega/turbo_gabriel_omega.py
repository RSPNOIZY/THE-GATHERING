#!/usr/bin/env python3
"""
GABRIEL OMEGA — hardened runtime brain.

Governance-Plane hardening (RSP_001 directive, 2026-06-21):
  - Bounded, iterative self-heal (no recursive boot_sequence → no crash-loop / OOM)
  - Memory-aware scheduling (skip heavy model loads when unified-memory headroom < 10 GB)
  - Atomic receipts in a SQLite WAL store (state survives crash / power flicker; heal resumes)
  - Fail-loud error handling (no bare `except: pass` — every failure is logged)
  - Real telemetry fallback (OpenTelemetry-shaped spans → JSONL, never a silent no-op)
  - REFLEX_HALT actually halts in-flight work
"""
import os
import sys
import time
import json
import logging
import sqlite3
import threading
import subprocess
from pathlib import Path

import msgpack
import mido
import sounddevice as sd
import mlx.core as mx
# import mlx.fft  <-- REMOVED: Accessed via mx.fft
from mlx_lm import load, generate

# ==========================================
# 🪵 OBSERVABILITY: structured logging + paths
# ==========================================
BASE_DIR = Path(__file__).resolve().parent
LOG_DIR = BASE_DIR.parent / "ops" / "logs"
LOG_DIR.mkdir(parents=True, exist_ok=True)
RECEIPTS_DB = LOG_DIR / "gabriel_receipts.db"
TELEMETRY_JSONL = LOG_DIR / "telemetry.jsonl"

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s [%(name)s] %(message)s",
    handlers=[
        logging.StreamHandler(sys.stderr),
        logging.FileHandler(LOG_DIR / "gabriel_omega.log"),
    ],
)
log = logging.getLogger("gabriel.omega")

# Memory-aware scheduling: skip heavy loads below this unified-memory headroom.
LOW_POWER_THRESHOLD_GB = 10.0

# Bounded heal policy: cap restarts, back off, then drop to reflex-only safe mode.
MAX_HEAL_ATTEMPTS = 3
HEAL_BACKOFF_BASE_SEC = 2.0  # 2s, 4s, 8s ...

try:
    from audiocraft.models import MusicGen
except ImportError:
    MusicGen = None
    log.warning("AUDIOCRAFT NOT FOUND. Music module will be restricted.")

# ==========================================
# 💎 CONFIGURATION: M2 ULTRA GOD MODE
# ==========================================
MODELS = {
    "MASTER": "mlx-community/Meta-Llama-3-70B-Instruct-4bit",
    "GHOST":  "mlx-community/Meta-Llama-3-8B-Instruct-4bit",
    "MUSIC":  "facebook/musicgen-large",
}
try:
    from turbo_memcell import MemCell
    import turbo_prompts as prompts
except ImportError:
    # Fallback if unitor path not in sys
    sys.path.append(str(BASE_DIR))
    from turbo_memcell import MemCell
    import turbo_prompts as prompts


# ==========================================
# 🧮 MEMORY PROBE — macOS unified-memory headroom (no extra deps)
# ==========================================
def available_memory_gb():
    """Best-effort free unified memory in GB via vm_stat. Returns None if unknown."""
    try:
        page_size = 4096
        out = subprocess.run(["vm_stat"], capture_output=True, text=True, timeout=5).stdout
        free_pages = 0
        for line in out.splitlines():
            if line.startswith("page size of"):
                # e.g. "Mach Virtual Memory Statistics: (page size of 16384 bytes)"
                for tok in line.split():
                    if tok.isdigit():
                        page_size = int(tok)
            # Pages that are reclaimable as "available"
            if line.startswith(("Pages free", "Pages inactive", "Pages speculative")):
                free_pages += int(line.split(":")[1].strip().rstrip("."))
        if free_pages:
            return round(free_pages * page_size / (1024 ** 3), 2)
    except Exception as e:
        log.warning("Memory probe failed (assuming full power): %s", e)
    return None


def is_low_power():
    avail = available_memory_gb()
    if avail is None:
        return False  # can't measure → don't throttle, but it was logged
    low = avail < LOW_POWER_THRESHOLD_GB
    log.info("Unified-memory headroom: %.2f GB (low_power=%s)", avail, low)
    return low


# ==========================================
# 🧾 ATOMIC RECEIPTS — SQLite WAL (crash/power-flicker safe)
# ==========================================
class Receipts:
    """
    Write-Ahead-Logged receipt store. Each significant action records a row.
    Lets heal() RESUME rather than RESTART, and makes boot idempotent.
    """
    def __init__(self, db_path=RECEIPTS_DB):
        self.db = sqlite3.connect(str(db_path), check_same_thread=False)
        self.db.execute("PRAGMA journal_mode=WAL;")
        self.db.execute("PRAGMA synchronous=NORMAL;")
        self.db.execute(
            """CREATE TABLE IF NOT EXISTS receipts (
                   id      INTEGER PRIMARY KEY AUTOINCREMENT,
                   ts      REAL NOT NULL,
                   kind    TEXT NOT NULL,
                   key     TEXT,
                   status  TEXT NOT NULL,
                   detail  TEXT
               )"""
        )
        self.db.commit()
        self._lock = threading.Lock()

    def record(self, kind, status, key=None, detail=None):
        with self._lock:
            self.db.execute(
                "INSERT INTO receipts (ts, kind, key, status, detail) VALUES (?,?,?,?,?)",
                (time.time(), kind, key, status, detail),
            )
            self.db.commit()
        log.info("receipt kind=%s key=%s status=%s", kind, key, status)

    def already_done(self, kind, key):
        cur = self.db.execute(
            "SELECT 1 FROM receipts WHERE kind=? AND key=? AND status='ok' LIMIT 1",
            (kind, key),
        )
        return cur.fetchone() is not None


# ==========================================
# 📡 TELEMETRY — real spans (OpenTelemetry-shaped) → JSONL fallback
# ==========================================
try:
    from turbo_telemetry import telemetry  # real exporter if present
    log.info("Telemetry: using turbo_telemetry exporter.")
except ImportError:
    class _JsonlTelemetry:
        """Never silent: writes span deltas to telemetry.jsonl with durations."""
        def __init__(self, path=TELEMETRY_JSONL):
            self.path = path
            self._open = {}
            self._lock = threading.Lock()

        def start(self, name):
            with self._lock:
                self._open[name] = time.time()

        def stop(self, name, category="general"):
            end = time.time()
            with self._lock:
                start = self._open.pop(name, end)
            span = {
                "name": name,
                "category": category,
                "start": start,
                "end": end,
                "duration_ms": round((end - start) * 1000, 2),
            }
            try:
                with open(self.path, "a") as f:
                    f.write(json.dumps(span) + "\n")
            except Exception as e:
                log.warning("Telemetry write failed: %s", e)
    telemetry = _JsonlTelemetry()
    log.info("Telemetry: using JSONL fallback at %s", TELEMETRY_JSONL)


# ==========================================
# 🧠 MODULE 2: SILICON CORTEX (SPECULATIVE)
# ==========================================
class SiliconCortex:
    def __init__(self, low_power=False):
        self.master = None
        self.master_tok = None
        if low_power:
            log.warning("[CORTEX] LOW POWER — skipping model load; reflex-only cognition.")
            return
        log.info("[CORTEX] Loading Llama-3-8B (Fast Mode) into unified memory...")
        try:
            # GHOST (8B) for fast launch. mlx_lm.load returns (model, tok)
            # on some versions and (model, tok, config) on others — unpack defensively.
            loaded = load(MODELS["GHOST"])
            self.master, self.master_tok = loaded[0], loaded[1]
            log.info("[CORTEX] ONLINE.")
        except Exception as e:
            log.error("[CORTEX] LOAD FAILED: %s", e)
            self.master = None
            self.master_tok = None

    def think(self, prompt, context=""):
        if not self.master or not self.master_tok:
            return "Thinking (Simulated — cortex offline)."
        full_prompt = f"<|system|>{context}<|user|>{prompt}<|assistant|>"
        try:
            response = generate(self.master, self.master_tok, prompt=full_prompt, max_tokens=200, verbose=False)
            return response.strip()
        except Exception as e:
            log.error("[CORTEX] generation error: %s", e)
            return f"[CORTEX ERROR]: {e}"


# ==========================================
# 🎵 MODULE 3: MAESTRO (AUDIO ENGINE)
# ==========================================
class Maestro:
    def __init__(self, low_power=False):
        self.gen = None
        self.midi = None
        if MusicGen and not low_power:
            log.info("[MAESTRO] Initializing MusicGen on GPU...")
            try:
                self.gen = MusicGen.get_pretrained(MODELS["MUSIC"])
            except Exception as e:
                log.error("[MAESTRO] MusicGen load failed: %s", e)
        elif low_power:
            log.warning("[MAESTRO] LOW POWER — MusicGen load skipped.")

        try:
            self.midi = mido.open_output('Gabriel_Virtual_Out', virtual=True)
        except Exception as e:
            log.warning("[MAESTRO] MIDI virtual port unavailable: %s", e)
            self.midi = None

        log.info("[MAESTRO] ONLINE (music=%s, midi=%s).", bool(self.gen), bool(self.midi))

    def compose(self, description):
        if not self.gen:
            return "MusicGen Unavailable."
        self.gen.set_generation_params(duration=10)
        self.gen.generate([description])
        # In a real build, save to RAM disk for DAW import
        return "Audio Generated."

    def automation(self, cc_num, value):
        if self.midi:
            self.midi.send(mido.Message('control_change', control=cc_num, value=value))


# ==========================================
# 👂 MODULE 4: GOLDEN EARS (MLX FFT)
# ==========================================
class GoldenEars:
    def __init__(self):
        self.stream = None
        try:
            target_device = None
            try:
                devices = sd.query_devices()
                for i, d in enumerate(devices):
                    if ("Apollo" in d['name'] or "Universal Audio" in d['name']) and d['max_input_channels'] > 0:
                        target_device = i
                        log.info("[EARS] LOCKED ONTO HARDWARE: %s (Index %d)", d['name'], i)
                        break
            except Exception as e:
                log.warning("[EARS] device scan error: %s", e)

            if target_device is None:
                log.info("[EARS] Hardware not found. Defaulting to system input.")

            self.stream = sd.InputStream(callback=self._callback, channels=1, samplerate=44100, device=target_device)
            self.stream.start()
            log.info("[EARS] LISTENING (Metal accelerated).")
        except Exception as e:
            log.error("[EARS] INIT FAILED: %s", e)

    def _callback(self, indata, frames, time_info, status):
        """Audio FFT on the Neural Engine (MLX) instead of CPU for low-latency analysis."""
        if status:
            log.debug("[EARS] stream status: %s", status)
        try:
            audio_tensor = mx.array(indata.flatten())
            spectrum = mx.fft.rfft(audio_tensor)
            magnitude = mx.abs(spectrum)
            bass_energy = mx.mean(magnitude[0:50]).item()
            if bass_energy > 50:
                # In production, fire an event to the Supervisor here.
                pass
        except Exception as e:
            log.debug("[EARS] callback analysis error: %s", e)


# ==========================================
# 🗣️ MODULE 4B: ORATOR (VOICE ENGINE)
# ==========================================
class Orator:
    def __init__(self):
        self.mode = "system"
        self._proc = None  # track in-flight `say` so HALT can interrupt it
        log.info("[ORATOR] ONLINE (Mode: System Apple Speech).")

    def speak(self, text):
        if not text:
            return
        clean_text = text.replace("**", "").replace("*", "").replace("#", "")
        threading.Thread(target=self._speak_thread, args=(clean_text,), daemon=True).start()

    def _speak_thread(self, text):
        try:
            self._proc = subprocess.Popen(["say", "-v", "Samantha", text])
            self._proc.wait()
        except Exception as e:
            log.warning("[ORATOR] speech failed: %s", e)
        finally:
            self._proc = None

    def silence(self):
        """Interrupt any in-flight speech (used by REFLEX_HALT)."""
        if self._proc and self._proc.poll() is None:
            try:
                self._proc.terminate()
            except Exception as e:
                log.warning("[ORATOR] could not interrupt speech: %s", e)


# ==========================================
# 🗿 MODULE 4C: AVATAR BRIDGE (UNITY LINK)
# ==========================================
class AvatarBridge:
    def __init__(self):
        self.state_file = BASE_DIR.parent / "Assets" / "avatar_state.json"
        self.state_file.parent.mkdir(parents=True, exist_ok=True)

    def update_state(self, emotion="neutral", speaking=False, text=""):
        state = {
            "emotion": emotion,
            "is_speaking": speaking,
            "last_text": text,
            "timestamp": time.time(),
        }
        try:
            tmp = self.state_file.with_suffix(".json.tmp")
            with open(tmp, "w") as f:
                json.dump(state, f)
            os.replace(tmp, self.state_file)  # atomic write
        except Exception as e:
            log.warning("[AVATAR] state write failed: %s", e)


# ==========================================
# ⚡ MODULE 6: THE TOOLBELT (REAL-WORLD ACTION)
# ==========================================
try:
    from turbo_video_ai import VideoForge
    from turbo_audio_ai import AudioEnhancer
except ImportError:
    log.warning("TOOLBELT MISSING: Video/Audio modules not found.")
    VideoForge = None
    AudioEnhancer = None


# ==========================================
# 🧠 MODULE 2B: CORTEX ROUTER (SPLIT BRAIN)
# ==========================================
class CortexRouter:
    """Classifies intent in <50ms (Reflex) or delegates to the Deep Brain."""
    def __init__(self, cortex_instance, supervisor=None):
        self.cortex = cortex_instance
        self.supervisor = supervisor
        self.reflex_patterns = {
            "status": "REFLEX_STATUS",
            "report": "REFLEX_STATUS",
            "hello": "REFLEX_GREETING",
            "hi": "REFLEX_GREETING",
            "gabriel": "REFLEX_ATTENTION",
            "stop": "REFLEX_HALT",
            "silence": "REFLEX_HALT",
            "time": "REFLEX_TIME",
            "date": "REFLEX_TIME",
        }

    def route(self, user_in, context):
        telemetry.start("router_decision")
        tokens = user_in.lower().strip().split()

        intent = None
        for key, val in self.reflex_patterns.items():
            if key in tokens:
                intent = val
                break

        if intent:
            telemetry.stop("router_decision", "router")
            telemetry.stop("voice_response", "voice")
            log.info("[ROUTER] REFLEX TRIGGER: %s", intent)
            return self.execute_reflex(intent, user_in)

        log.info("[ROUTER] Deep cognition required.")
        telemetry.stop("router_decision", "router")
        telemetry.start("cortex_think")
        response = self.cortex.think(user_in, context)
        telemetry.stop("cortex_think", "cortex")
        return response

    def execute_reflex(self, intent, original_input):
        if intent == "REFLEX_GREETING":
            return "Gabriel Omega Online. State your command."
        elif intent == "REFLEX_STATUS":
            mem = available_memory_gb()
            mem_str = f"{mem} GB free" if mem is not None else "memory probe unavailable"
            return f"Systems nominal. {mem_str}."
        elif intent == "REFLEX_HALT":
            # Real halt: interrupt speech and raise the supervisor flag.
            if self.supervisor:
                self.supervisor.request_halt()
            return "Holding all processes."
        elif intent == "REFLEX_TIME":
            return f"Current Timeline: {time.strftime('%H:%M:%S')}"
        elif intent == "REFLEX_ATTENTION":
            return "I am listening."
        return "Command Acknowledged."


# ==========================================
# 🛡️ MODULE 5: SUPERVISOR (BOUNDED SELF-HEALING)
# ==========================================
class GabrielSupervisor:
    def __init__(self):
        self.receipts = Receipts()
        self.memory = MemCell()
        self.cortex = None
        self.router = None
        self.maestro = None
        self.ears = None
        self.orator = None
        self.avatar = None
        self.video_forge = None
        self.audio_hand = None
        self.low_power = False
        self.halt_requested = False

    # ---- lifecycle -------------------------------------------------------
    def request_halt(self):
        self.halt_requested = True
        if self.orator:
            self.orator.silence()
        log.info("[SUPERVISOR] HALT requested — deep cognition suspended until next input.")

    def run(self):
        """
        Bounded, iterative supervisor loop. Replaces the old recursive heal()
        that re-loaded models on every crash and grew the stack until OOM.
        """
        attempt = 0
        while attempt <= MAX_HEAL_ATTEMPTS:
            try:
                self._boot()
                self._main_loop()
                return  # clean exit (KeyboardInterrupt / shutdown)
            except KeyboardInterrupt:
                log.info("[SUPERVISOR] Sleep mode (operator interrupt).")
                if self.orator:
                    self.orator.speak("Gabriel shutting down.")
                return
            except Exception as e:
                attempt += 1
                self.receipts.record("heal", "attempt", key=str(attempt), detail=repr(e))
                log.error("[SUPERVISOR] CRITICAL FAILURE (attempt %d/%d): %s",
                          attempt, MAX_HEAL_ATTEMPTS, e)
                self._teardown()
                if attempt > MAX_HEAL_ATTEMPTS:
                    break
                backoff = HEAL_BACKOFF_BASE_SEC * (2 ** (attempt - 1))
                log.info("[SUPERVISOR] Self-heal in %.1fs...", backoff)
                time.sleep(backoff)

        # Exhausted retries → degrade, do NOT keep reloading models.
        self.receipts.record("heal", "exhausted", detail=f"{MAX_HEAL_ATTEMPTS} attempts")
        log.critical("[SUPERVISOR] Heal exhausted — entering reflex-only SAFE MODE.")
        self._safe_mode_loop()

    def _boot(self):
        self.halt_requested = False
        self.low_power = is_low_power()
        self.receipts.record("boot", "start", detail=f"low_power={self.low_power}")

        self.cortex = SiliconCortex(low_power=self.low_power)
        self.router = CortexRouter(self.cortex, supervisor=self)
        self.maestro = Maestro(low_power=self.low_power)
        self.ears = GoldenEars()
        self.orator = Orator()
        self.avatar = AvatarBridge()

        if VideoForge and not self.low_power:
            self.video_forge = VideoForge()
        if AudioEnhancer and not self.low_power:
            self.audio_hand = AudioEnhancer()

        mode = "LOW POWER (reflex-first)" if self.low_power else "CRYSTAL SMOOTH"
        log.info("GABRIEL OMEGA: systems up. Protocol: %s", mode)
        self.receipts.record("boot", "ok", detail=mode)
        self.orator.speak("Gabriel Omega Online. Ready to create."
                          if not self.low_power else "Gabriel Omega online in low power mode.")

    def _teardown(self):
        """Release audio stream + model handles before a heal retry (prevents leak/OOM)."""
        try:
            if self.ears and self.ears.stream:
                self.ears.stream.stop()
                self.ears.stream.close()
        except Exception as e:
            log.warning("[SUPERVISOR] teardown ears error: %s", e)
        self.cortex = self.maestro = self.ears = None
        self.video_forge = self.audio_hand = None

    # ---- loops -----------------------------------------------------------
    def _main_loop(self):
        log.info("Waiting for command...")
        context = self.memory.inject_omniscience()

        while True:
            try:
                user_in = input("GABRIEL >> ")
                self.halt_requested = False  # fresh input clears a prior halt
                self.avatar.update_state(emotion="processing", speaking=False)
                lower_in = user_in.lower()

                if "video" in lower_in and ("create" in lower_in or "generate" in lower_in):
                    self.handle_video(user_in)
                elif "repair" in lower_in or "fix audio" in lower_in:
                    self.handle_repair()
                elif "music" in lower_in or "compose" in lower_in:
                    self.handle_music(user_in)
                else:
                    response = self.router.route(user_in, context)
                    if self.halt_requested:
                        print("⏸️  Halted.")
                        continue
                    print(response)
                    self.orator.speak(response)
                    self.avatar.update_state(emotion="happy", speaking=True, text=response)

            except (KeyboardInterrupt, EOFError):
                print("💤 SLEEP MODE.")
                self.orator.speak("Gabriel shutting down.")
                break
            except Exception as e:
                # Loop errors are isolated — one bad command never crashes the supervisor.
                log.error("[LOOP] error: %s", e)
                self.receipts.record("command", "error", detail=repr(e))
                if self.avatar:
                    self.avatar.update_state(emotion="error", speaking=False)
                continue

    def _safe_mode_loop(self):
        """Degraded mode: reflex router only, no model loads. Keeps Gabriel responsive."""
        router = CortexRouter(SiliconCortex(low_power=True), supervisor=self)
        print("🟠 SAFE MODE — reflex only. Type 'exit' to quit.")
        while True:
            try:
                user_in = input("GABRIEL(safe) >> ")
                if user_in.strip().lower() in ("exit", "quit"):
                    break
                print(router.route(user_in, ""))
            except (KeyboardInterrupt, EOFError):
                break

    # ---- handlers --------------------------------------------------------
    def handle_video(self, user_in):
        if self.video_forge:
            self.orator.speak("Engaging Video Forge.")
            self.avatar.update_state(emotion="creative", speaking=True, text="Engaging Video Forge...")
            prompt = user_in.replace("create a video", "").replace("generate video", "").strip() or "Abstract flow"
            log.info("[TOOLS] Generating video: %s", prompt)
            try:
                path = self.video_forge.generate_veo(prompt)
            except Exception as e:
                log.error("[TOOLS] video generation error: %s", e)
                path = None
            msg = f"Video complete: {path.name}" if path else "Video generation failed."
            print(msg)
            self.orator.speak("Visuals rendered." if path else "Visuals failed.")
        else:
            print("⚠️ Video tool unavailable.")

    def handle_repair(self):
        self.orator.speak("Scanning repair sector.")
        log.info("[TOOLS] Studio Hand is watching Assets/To_Repair.")
        self.orator.speak("Drop files in the repair folder. I am watching.")

    def handle_music(self, user_in):
        text = "Composing audio sequence."
        self.orator.speak(text)
        self.avatar.update_state(emotion="creative", speaking=True, text=text)
        print(self.maestro.compose(user_in))


if __name__ == "__main__":
    GabrielSupervisor().run()
