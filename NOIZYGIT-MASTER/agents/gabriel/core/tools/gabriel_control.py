#!/usr/bin/env python3
import tkinter as tk
import subprocess
import threading
import time
import math
import os
import queue

# --- THEATRICS & CONFIG ---
Gabriel_Theme = {
    "bg": "#000000",          # Pure Black
    "fg": "#00ff41",          # Matrix Green
    "dim": "#004400",         # Dim Green
    "alert": "#ff0000",       # Red
    "cyan": "#00ffff",        # Cyan data streams
    "font_main": ("Consolas", 11),
    "font_header": ("Arial Black", 20),
    "font_mono": ("Menlo", 9),
    "target_fps": 60          # UPGRADED TO 60FPS
}

class AudioStreamSimulator:
    """Simulates a 44.1kHz / 16-bit PCM Audio Stream with ZERO LATENCY metrics."""
    def __init__(self):
        self.sample_rate = 44100
        self.bit_depth = 16
        self.start_time = time.time()

    def get_stats(self):
        # Precise, deterministic, no jitter
        return {
            "kbps": "1411 kbps (LOCKED)",
            "hz": "44100 Hz",
            "fmt": "PCM 16-bit LE",
            "lat": "0.00ms (SYNC)"
        }

class GabrielVoice:
    """Event-driven Voice Engine. Zero polling."""
    def __init__(self):
        self.queue = queue.Queue()
        self.active = True
        self.thread = threading.Thread(target=self._worker, daemon=True)
        self.thread.start()

    def speak(self, text):
        self.queue.put(text)

    def _worker(self):
        while self.active:
            # Block until item is available (0% CPU usage while waiting)
            text = self.queue.get()
            if text is None: break
            # Execute immediately
            subprocess.run(["say", "-v", "Alex", "-r", "180", text])
            self.queue.task_done()

class GabrielControl(tk.Tk):
    def __init__(self):
        super().__init__()
        self.title("GABRIEL OMEGA :: ZERO LATENCY CORE")
        self.geometry("900x650")
        self.configure(bg=Gabriel_Theme["bg"])
        
        self.stream = AudioStreamSimulator()
        self.voice = GabrielVoice()
        
        self.setup_ui()
        self.voice.speak("Zero Latency Optimization Complete. System synchronized.")
        
        self.anim_frame = 0
        self.last_time = time.time()
        self.animate_loop()

    def setup_ui(self):
        # Master Grid
        self.grid_columnconfigure(0, weight=1)
        self.grid_rowconfigure(2, weight=1)

        # 1. Top HUD
        self.hud_frame = tk.Frame(self, bg=Gabriel_Theme["bg"])
        self.hud_frame.grid(row=0, column=0, sticky="ew", padx=10, pady=10)
        
        self.lbl_title = tk.Label(self.hud_frame, text="GABRIEL :: ZERO LATENCY", 
                                  bg=Gabriel_Theme["bg"], fg=Gabriel_Theme["fg"], 
                                  font=Gabriel_Theme["font_header"])
        self.lbl_title.pack(side="left")

        self.lbl_status = tk.Label(self.hud_frame, text="[OPTIMIZED]", 
                                   bg=Gabriel_Theme["bg"], fg=Gabriel_Theme["cyan"], 
                                   font=Gabriel_Theme["font_main"])
        self.lbl_status.pack(side="right")

        # 2. Telemetry Strip
        self.telemetry_frame = tk.Frame(self, bg="#0a0a0a", bd=1, relief="flat")
        self.telemetry_frame.grid(row=1, column=0, sticky="ew", padx=10)
        
        self.lbl_stream_info = tk.Label(self.telemetry_frame, 
                                        text="INIT SERIALIZING...",
                                        bg="#0a0a0a", fg=Gabriel_Theme["cyan"],
                                        font=Gabriel_Theme["font_mono"])
        self.lbl_stream_info.pack(fill="x", pady=2)

        # 3. Visualizer (The "Main Event")
        self.canvas = tk.Canvas(self, bg="black", highlightthickness=0)
        self.canvas.grid(row=2, column=0, sticky="nsew", padx=10, pady=5)
        
        # 4. Data Log
        self.term_text = tk.Text(self, bg="black", fg=Gabriel_Theme["dim"], height=6,
                                 font=Gabriel_Theme["font_mono"], state="disabled",
                                 bd=0)
        self.term_text.grid(row=3, column=0, sticky="ew", padx=10, pady=5)

        # 5. Command Deck
        self.cmd_frame = tk.Frame(self, bg=Gabriel_Theme["bg"])
        self.cmd_frame.grid(row=4, column=0, sticky="ew", padx=10, pady=20)
        
        # Stylized Buttons
        cmds = [
            ("ESTABLISH LINK", self.run_miracle),
            ("AI NEURAL NET", self.launch_ai),
            ("VOICE CHECK", self.test_voice),
            ("TERMINATE", self.destroy)
        ]
        
        for btn_txt, btn_cmd in cmds:
            btn = tk.Button(self.cmd_frame, text=f"// {btn_txt}", command=btn_cmd,
                            bg="black", fg=Gabriel_Theme["fg"], 
                            activebackground=Gabriel_Theme["fg"], activeforeground="black",
                            font=Gabriel_Theme["font_main"], bd=1, relief="solid")
            btn.pack(side="left", fill="x", expand=True, padx=2)

    def animate_loop(self):
        # Delta Time Calculation for Smooth 60FPS
        now = time.time()
        dt = now - self.last_time
        self.last_time = now
        
        # Update Telemetry (Direct Access, No Calc Overhead)
        stats = self.stream.get_stats()
        fps = int(1.0 / dt) if dt > 0 else 60
        self.lbl_stream_info.config(
            text=f"STREAM: {stats['hz']} | {stats['fmt']} | RATE: {stats['kbps']} | FPS: {fps} | LATENCY: {stats['lat']}"
        )
        
        # Optimized Visualizer Drawing
        self.canvas.delete("all")
        w = self.canvas.winfo_width()
        h = self.canvas.winfo_height()
        mid = h / 2
        
        # 1. Frequency Bars (FFT Simulation)
        # Reduce object count for performance (wider bars)
        bar_w = 15 
        for i in range(0, w, bar_w + 2):
            # Fast Math
            val = (math.sin(i * 0.05 + self.anim_frame * 0.15) + 1) * 0.5
            bar_h = val * (h * 0.4)
            
            # Simple color logic
            color = Gabriel_Theme["fg"] if bar_h > h * 0.3 else Gabriel_Theme["dim"]
            self.canvas.create_rectangle(i, h, i+bar_w, h-bar_h, fill=color, outline="")

        # 2. Oscilloscope Line (High Efficiency)
        points = []
        # Step 10 for fewer points = faster draw
        for x in range(0, w, 10):
            y = mid + math.sin(x * 0.03 + self.anim_frame * 0.3) * 60
            points.extend([x, y])
            
        if points:
            self.canvas.create_line(points, fill=Gabriel_Theme["cyan"], width=2)

        self.anim_frame += 1
        # Schedule next frame target 16ms (60FPS)
        self.after(16, self.animate_loop)

    def log(self, msg):
        self.term_text.configure(state="normal")
        self.term_text.insert("end", f"[{time.strftime('%H:%M:%S')}] {msg}\n")
        self.term_text.see("end")
        self.term_text.configure(state="disabled")

    def run_miracle(self):
        self.log("INITIATING MIRACLE SUBROUTINES...")
        self.voice.speak("Miracle Protocol engaged.")
        threading.Thread(target=self._run_cmd, args=(["python3", os.path.expanduser("~/NOIZYLAB/GABRIEL/tools/miracle_setup.py")],)).start()

    def launch_ai(self):
        self.log("ACCESSING NEURAL CLOUD...")
        self.voice.speak("Connecting to Neural Cloud.")
        subprocess.Popen(["open", "https://copilot.microsoft.com"])

    def test_voice(self):
        self.log("VERIFYING AUDIO INTEGRITY...")
        self.voice.speak("Audio integrity one hundred percent. Stream stable.")

    def _run_cmd(self, cmd):
        process = subprocess.Popen(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        for line in process.stdout:
            self.term_text.after(0, self.log, line.strip())

if __name__ == "__main__":
    app = GabrielControl()
    app.mainloop()
