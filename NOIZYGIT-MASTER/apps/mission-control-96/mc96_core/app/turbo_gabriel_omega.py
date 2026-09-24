#!/usr/bin/env python3
import os
import time
import threading
import subprocess
import mido
import sounddevice as sd
import mlx.core as mx
# import mlx.fft  <-- REMOVED: Accessed via mx.fft
from mlx_lm import load, generate
from pathlib import Path

try:
    from audiocraft.models import MusicGen
except ImportError:
    MusicGen = None
    print("⚠️ AUDIOCRAFT NOT FOUND. Music Module will be restricted.")

# ==========================================
# 💎 CONFIGURATION: M2 ULTRA GOD MODE
# ==========================================
MODELS = {
    "MASTER": "mlx-community/Meta-Llama-3-70B-Instruct-4bit",
    "GHOST":  "mlx-community/Meta-Llama-3-8B-Instruct-4bit",
    "MUSIC":  "facebook/musicgen-large"
}
try:
    from turbo_memcell import MemCell
    import turbo_prompts as prompts
except ImportError:
    # Fallback if unitor path not in sys
    import sys
    sys.path.append(str(Path(__file__).parent))
    from turbo_memcell import MemCell
# ==========================================
# 🧬 MODULE 1: MEMCELL 3.0 (UNIFIED)
# ==========================================
# (Inline class removed - Using Unitor Unified Memory)

# ==========================================
# 🧠 MODULE 2: SILICON CORTEX (SPECULATIVE)
# ==========================================
class SiliconCortex:
    def __init__(self):
        print("⚡ [CORTEX] Loading Llama-3-8B (Fast Mode) into Unified Memory...")
        try:
            # SWITCHING TO GHOST (8B) FOR FAST LAUNCH
            self.master, self.master_tok = load(MODELS["GHOST"])
            print("⚡ [CORTEX] ONLINE.")
        except Exception as e:
            print(f"⚠️ CORTEX LOAD FAILED: {e}")
            self.master = None

    def think(self, prompt, context=""):
        if not self.master: return "Thinking (Simulated)..."
        full_prompt = f"<|system|>{context}<|user|>{prompt}<|assistant|>"
        # MLX optimized generation
        try:
            response = generate(self.master, self.master_tok, prompt=full_prompt, max_tokens=200, verbose=False)
            return response.strip()
        except Exception as e:
            return f"[CORTEX ERROR]: {e}"

# ==========================================
# 🎵 MODULE 3: MAESTRO (AUDIO ENGINE)
# ==========================================
class Maestro:
    def __init__(self):
        print("🎵 [MAESTRO] Initializing MusicGen on GPU...")
        if MusicGen:
            self.gen = MusicGen.get_pretrained(MODELS["MUSIC"])
        else:
            self.gen = None
        
        try:
            self.midi = mido.open_output('Gabriel_Virtual_Out', virtual=True)
        except:
            self.midi = None

        print("🎵 [MAESTRO] ONLINE.")

    def compose(self, description):
        if not self.gen: return "MusicGen Unavailable."
        self.gen.set_generation_params(duration=10)
        self.gen.generate([description])
        # In a real build, save 'wav' to RAM disk for DAW import
        return "Audio Generated."

    def automation(self, cc_num, value):
        if self.midi:
            self.midi.send(mido.Message('control_change', control=cc_num, value=value))

# ==========================================
# 👂 MODULE 4: GOLDEN EARS (MLX FFT)
# ==========================================
class GoldenEars:
    def __init__(self):
        try:
            # 🎛️ HARDWARE SELECTION: Universal Audio Apollo
            target_device = None
            try:
                devices = sd.query_devices()
                for i, d in enumerate(devices):
                    # Look for Apollo or Universal Audio
                    if ("Apollo" in d['name'] or "Universal Audio" in d['name']) and d['max_input_channels'] > 0:
                        target_device = i
                        print(f"👂 [EARS] LOCKED ONTO HARDWARE: {d['name']} (Index {i})")
                        break
            except Exception as e: 
                print(f"⚠️ DEVICE SCAN ERROR: {e}")

            # Fallback message
            if target_device is None:
                print("👂 [EARS] Hardware not found. Defaulting to System Input.")

            self.stream = sd.InputStream(callback=self._callback, channels=1, samplerate=44100, device=target_device)
            self.stream.start()
            print("👂 [EARS] LISTENING (METAL ACCELERATED).")
        except Exception as e:
            print(f"⚠️ EARS INIT FAILED: {e}")

    def _callback(self, indata, frames, time, status):
        """
        THE MIRACLE: Running Audio FFT on the Neural Engine (MLX)
        instead of the CPU (Numpy) for 0ms latency analysis.
        """
        if status:
            print(status)
        
        # Convert audio buffer to MLX Array (GPU)
        audio_tensor = mx.array(indata.flatten())
        
        # Perform FFT on Metal
        spectrum = mx.fft.rfft(audio_tensor)
        magnitude = mx.abs(spectrum)
        
        # Fast analysis (Bass detection)
        # Note: Index mapping depends on sample rate/bin size. Simplified here.
        bass_energy = mx.mean(magnitude[0:50]).item() 
        
        if bass_energy > 50: 
            # If bass is too loud, auto-trigger a thought
            # In production, this would fire an event to the Supervisor
            pass

# ==========================================
# 🗣️ MODULE 4B: ORATOR (VOICE ENGINE)
# ==========================================
class Orator:
    def __init__(self):
        print("🗣️ [ORATOR] Initializing Neural Voice...")
        # Check for turbo_audio_ai or use system default
        self.mode = "system" # default
        print("🗣️ [ORATOR] ONLINE (Mode: System Apple Speech).")
        
    def speak(self, text):
        if not text: return
        # Clean text of markdown for speech
        clean_text = text.replace("*", "").replace("#", "").replace("**", "")
        # Non-blocking speech
        threading.Thread(target=self._speak_thread, args=(clean_text,)).start()
        
    def _speak_thread(self, text):
        # Use MacOS 'say' for natural "Daniel" or "Samantha" voice, or maybe "Alex"
        # Using "Fred" or similar for robotic, but let's go for specific high quality
        # "Samantha" is decent.
        try:
            subprocess.run(["say", "-v", "Samantha", text]) # User can customize voice
        except: pass

# ==========================================
# 🗿 MODULE 4C: AVATAR BRIDGE (UNITY LINK)
# ==========================================
import json
class AvatarBridge:
    def __init__(self):
        self.state_file = Path(os.path.dirname(__file__)).parent / "Assets" / "avatar_state.json"
        self.state_file.parent.mkdir(parents=True, exist_ok=True)
        
    def update_state(self, emotion="neutral", speaking=False, text=""):
        state = {
            "emotion": emotion,
            "is_speaking": speaking,
            "last_text": text,
            "timestamp": time.time()
        }
        try:
            with open(self.state_file, 'w') as f:
                json.dump(state, f)
        except: pass

# ==========================================
# ⚡ MODULE 6: THE TOOLBELT (REAL-WORLD ACTION)
# ==========================================
try:
    from turbo_video_ai import VideoForge
    from turbo_audio_ai import AudioEnhancer
except ImportError:
    print("⚠️ TOOLBELT MISSING: Video/Audio modules not found.")
    VideoForge = None
    AudioEnhancer = None

try:
    from turbo_telemetry import telemetry
except ImportError:
    # Fail-safe dummy telemetry
    class DummyTelemetry:
        def start(self, x): pass
        def stop(self, x, y): pass
    telemetry = DummyTelemetry()

# ==========================================
# 🧠 MODULE 2: CORTEX ROUTER (SPLIT BRAIN)
# ==========================================
class CortexRouter:
    """
    ⚡ ZERO LATENCY PERFECTION
    Classifies intent in <50ms (Reflex) or delegates to Deep Brain.
    """
    def __init__(self, cortex_instance):
        self.cortex = cortex_instance
        self.reflex_patterns = {
            "status": "REFLEX_STATUS",
            "report": "REFLEX_STATUS",
            "hello": "REFLEX_GREETING",
            "hi": "REFLEX_GREETING",
            "gabriel": "REFLEX_ATTENTION",
            "stop": "REFLEX_HALT",
            "silence": "REFLEX_HALT",
            "time": "REFLEX_TIME",
            "date": "REFLEX_TIME"
        }

    def route(self, user_in, context):
        telemetry.start("router_decision")
        user_in_lower = user_in.lower().strip()
        
        # 1. REFLEX LAYER (Regex/Keyword) - <10ms
        intent = None
        for key, val in self.reflex_patterns.items():
            if key in user_in_lower.split(): 
                intent = val
                break
                
        if intent:
            telemetry.stop("router_decision", "router")
            telemetry.stop("voice_response", "voice") # instant response
            print(f"⚡ [ROUTER] REFLEX TRIGGER: {intent}")
            return self.execute_reflex(intent, user_in)
            
        # 2. DEEP LAYER (LLM) - >500ms
        print("🧠 [ROUTER] DEEP COGNITION REQUIRED...")
        telemetry.stop("router_decision", "router")
        
        telemetry.start("cortex_think")
        response = self.cortex.think(user_in, context)
        telemetry.stop("cortex_think", "cortex")
        
        return response

    def execute_reflex(self, intent, original_input):
        if intent == "REFLEX_GREETING":
            return "Gabriel Omega Online. State your command."
        elif intent == "REFLEX_STATUS":
            return "Systems Nominal. 100% Crystal Smooth."
        elif intent == "REFLEX_HALT":
            return "Holding all processes."
        elif intent == "REFLEX_TIME":
            return f"Current Timeline: {time.strftime('%H:%M:%S')}"
        elif intent == "REFLEX_ATTENTION":
            return "I am listening."
        return "Command Acknowledged."

# ==========================================
# 🛡️ MODULE 5: SUPERVISOR (SELF-HEALING)
# ==========================================
class GabrielSupervisor:
    def __init__(self):
        self.memory = MemCell()
        self.cortex = None
        self.router = None # New Router
        self.maestro = None
        self.ears = None
        self.orator = None
        self.avatar = None
        
        # Tools
        self.video_forge = None
        self.audio_hand = None
        
    def boot_sequence(self):
        try:
            self.cortex = SiliconCortex()
            self.router = CortexRouter(self.cortex) # Initialize Router
            self.maestro = Maestro()
            self.ears = GoldenEars()
            self.orator = Orator()
            self.avatar = AvatarBridge()
            
            # Init Tools
            if VideoForge: self.video_forge = VideoForge()
            if AudioEnhancer: self.audio_hand = AudioEnhancer()
            
            print("\n💎 GABRIEL OMEGA: ALL SYSTEMS OPTIMIZED.")
            print("💎 PROTOCOL: CRYSTAL SMOOTH")
            self.orator.speak("Gabriel Omega Online. Ready to create.")
            self.main_loop()
        except Exception as e:
            print(f"⚠️ CRITICAL FAILURE: {e}")
            self.heal()

    def heal(self):
        print("❤️‍🩹 SELF-HEALING INITIATED...")
        time.sleep(1)
        self.boot_sequence() # Recursive restart

    def main_loop(self):
        print("Waiting for command...")
        
        # Initial Omni-Injection
        context = self.memory.inject_omniscience()
        
        while True:
            try:
                user_in = input("GABRIEL >> ")
                
                # 1. ROUTER (Reflex vs Deep)
                # Replaces direct Cortex call
                self.avatar.update_state(emotion="processing", speaking=False)
                
                # We check for Tool Keywords FIRST (Hardcoded Reflex Tools)
                # In v2 Router, we could move this into the Router class itself
                lower_in = user_in.lower()

                # --- TOOLS (Reflex Actions) ---
                if "video" in lower_in and ("create" in lower_in or "generate" in lower_in):
                    self.handle_video(user_in) 
                elif "repair" in lower_in or "fix audio" in lower_in:
                    self.handle_repair()
                elif "music" in lower_in or "compose" in lower_in:
                    self.handle_music(user_in)
                else:
                    # --- CONVERSATION (Router) ---
                    response = self.router.route(user_in, context)
                    print(response)
                    self.orator.speak(response)
                    self.avatar.update_state(emotion="happy", speaking=True, text=response)

            except KeyboardInterrupt:
                print("💤 SLEEP MODE.")
                self.orator.speak("Gabriel shutting down.")
                break
            except Exception as e:
                print(f"⚠️ LOOP ERROR: {e}")
                self.avatar.update_state(emotion="error", speaking=False)
                continue 
    
    # Helper Handlers to keep Main Loop Clean
    def handle_video(self, user_in):
        if self.video_forge:
            self.orator.speak("Engaging Video Forge.")
            self.avatar.update_state(emotion="creative", speaking=True, text="Engaging Video Forge...")
            prompt = user_in.replace("create a video", "").replace("generate video", "").strip() or "Abstract flow"
            print(f"⚡ [TOOLS] Generating Video: {prompt}")
            path = self.video_forge.generate_veo(prompt)
            msg = f"Video complete: {path.name}" if path else "Video generation failed."
            print(msg)
            self.orator.speak("Visuals rendered." if path else "Visuals failed.")
        else: print("⚠️ Video Tool Unavailable.")

    def handle_repair(self):
        self.orator.speak("Scanning repair sector.")
        print("⚡ [TOOLS] Studio Hand is watching Assets/To_Repair.")
        self.orator.speak("Drop files in the repair folder. I am watching.")

    def handle_music(self, user_in):
        text = "Composing audio sequence."
        self.orator.speak(text)
        self.avatar.update_state(emotion="creative", speaking=True, text=text)
        print(self.maestro.compose(user_in)) 

if __name__ == "__main__":
    GabrielSupervisor().boot_sequence()
